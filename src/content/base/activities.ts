import type { ActivityDef } from '../types';
import type { Ctx } from '../types';
import type { Person } from '../../engine/types';
import { cityName, isCoastal } from '../../engine/places';
import { MAX_HIRE_AGE, abl, acc, cap, dat, gen, kin, loc, officeJob, single, wage, wth } from './util';
import { inPrison, say, sayWith, type Pair } from './lines';
import { ABROAD_CITIES, aNum, isAbroad } from './events-flavour';
import { gkAge, grandkids } from './events-elder';

// Every repeatable line here must fit every age (and place) it can fire at: lines are split into
// life-stage buckets, and `say` (lines.ts) keeps a line from coming back until most of its bucket
// has been seen in this life. Outdoor activities set `jailOk: false`; the gym, library, meditation
// and doctor work in prison with their own lines.

const coastal = (c: Ctx) => isCoastal(c.p.city);
const cityTr = (c: Ctx) => cityName(c.p.city, 'tr');
/** "him" / "her" (Helpers only has he/his). */
const him = (p: Person) => (p.gender === 'female' ? 'her' : 'him');

// ------------------------------------------------------------------ gym

const GYM_TEEN: Pair[] = [
  ['You tried to do a pull-up in the school gym. You did half of one. Half counts.', 'Okulun spor salonunda barfiks çekmeye çalıştın. Yarım tane çektin. Yarım da sayılır.'],
  ['You joined the after-school basketball crowd. You passed exactly once and it was beautiful.', 'Okul çıkışı basket oynayanlara katıldın. Tam bir kez pas verdin ve çok güzeldi.'],
  ['You ran laps of the schoolyard until the caretaker nearly locked you in.', 'Okul bahçesinde o kadar tur attın ki hademe neredeyse seni içeride bırakıp kapıyı kilitliyordu.'],
  ['You watched three workout videos and did one. The first one. Halfway.', 'Üç antrenman videosu izledin, birini yaptın. İlkini. Yarısına kadar.'],
  ['You did sit-ups every night this month. You have one stomach muscle now. It is shy.', 'Bu ay her gece mekik çektin. Artık bir tane karın kasın var. Biraz utangaç.'],
  ['You raced a friend up the stadium steps. Afterwards you both lay on the grass, wheezing and happy.', 'Bir arkadaşınla stadyum merdivenlerinde yarıştın. Sonra ikiniz de hırıl hırıl ama mutlu, çimlere serildiniz.'],
  ['The PE teacher said you have "potential". You will live on that for a week.', 'Beden eğitimi öğretmeni sende "potansiyel" olduğunu söyledi. Bir hafta bununla yaşarsın.'],
  ['You finally learned to skip rope properly. Your shins have stopped filing complaints.', 'Sonunda ip atlamayı düzgünce öğrendin. Kaval kemiklerin şikâyet etmeyi bıraktı.'],
  ['You went for a run with headphones on and forgot to come back for an hour.', 'Kulaklıkla koşuya çıktın, dönmeyi bir saat unuttun.'],
  ['You and a friend made a workout plan. Step one was buying matching headbands. Done.', 'Bir arkadaşınla antrenman programı yaptınız. Birinci adım: aynı saç bantlarını almak. Tamamlandı.'],
];

const GYM_ADULT: Pair[] = [
  ['You had a great workout.', 'Harika bir antrenman yaptın.'],
  ['You lifted heavier than ever.', 'Hayatında kaldırdığın en ağır ağırlığı kaldırdın.'],
  ['You ran 5 km without stopping.', 'Hiç durmadan 5 km koştun.'],
  ['You tried a spin class. Your legs filed a complaint.', 'Bisiklet dersine girdin. Bacakların resmi şikâyette bulundu.'],
  ['A stranger asked you for gym advice. You gave it with total confidence.', 'Bir yabancı sana spor tavsiyesi sordu. Kendinden son derece emin bir şekilde verdin.'],
  ['You spent more time choosing a playlist than working out. Still counts.', 'Antrenmandan çok çalma listesi seçtin. Yine de sayılır.'],
  ['The person on the next treadmill was clearly racing you. You let them win after a dignified twenty minutes.', 'Yan koşu bandındaki kişi resmen seninle yarışıyordu. Onurlu bir yirmi dakikanın ardından kazanmasına izin verdin.'],
  ['You finally learned what all the machines are for. One of them is for hanging your towel.', 'Sonunda bütün aletlerin ne işe yaradığını öğrendin. Biri havlu asmak içinmiş.'],
  ['You did a yoga class next to someone who could fold in half. You folded in about a quarter.', 'Kendini ikiye katlayabilen birinin yanında yoga dersine girdin. Sen ancak dörtte bir katlanabildin.'],
  ['You went for a run at dawn. The city looked different at that hour: kinder, and mostly closed.', 'Şafakta koşuya çıktın. O saatte şehir bambaşkaydı: daha yumuşak ve çoğu yeri kapalı.'],
  ['A personal trainer gave you a free session and a look of deep concern.', 'Bir kişisel antrenör sana bir ücretsiz ders ve derin bir endişe bakışı verdi.'],
  ['You played five-a-side with strangers. Nobody passed to you. You scored anyway.', 'Yabancılarla halı saha maçı yaptın. Kimse sana pas vermedi. Yine de gol attın.'],
  ['You stretched for the first time in years. Several joints made sounds you had never heard before.', 'Yıllar sonra ilk kez esneme yaptın. Bazı eklemlerinden daha önce hiç duymadığın sesler geldi.'],
  ['You swam thirty lengths. A child in the next lane lapped you twice. You are at peace with it.', 'Otuz boy yüzdün. Yan kulvardaki bir çocuk seni iki kez turladı. Bununla barıştın.'],
];

/** 65+: no 5 km runs. */
const GYM_SENIOR: Pair[] = [
  ['You joined the water aerobics class. Nobody in the pool waves their arms faster than you.', 'Su jimnastiğine yazıldın. Havuzda kollarını senden hızlı sallayan yok.'],
  ['You did the chair exercises at the community centre and outlasted the instructor.', 'Semt merkezindeki sandalye jimnastiğine katıldın ve eğitmenden daha uzun dayandın.'],
  ['Your physiotherapist gave you a stretchy band. You use it every morning, and to threaten the cat next door.', 'Fizyoterapistin sana bir direnç lastiği verdi. Her sabah kullanıyorsun; arada komşunun kedisini korkutmak için de.'],
  ['You walked on the treadmill at a gentle pace and read the newspaper. Multitasking.', 'Koşu bandında ağır ağır yürüdün, bir yandan da gazete okudun. Aynı anda iki iş.'],
  ['You tried tai chi. You moved like a slow, wise cloud. A slightly wobbly cloud.', 'Tai chi denedin. Yavaş ve bilge bir bulut gibi hareket ettin. Hafifçe sallanan bir bulut.'],
  ['You lifted the small dumbbells twenty times. A young man next to you said "respect". You will tell everyone.', 'Küçük dambılları yirmi kez kaldırdın. Yanındaki genç "Helal olsun" dedi. Herkese anlatacaksın.'],
  ['The gym gave you a pensioner discount and a locker next to the sauna. Life is good.', 'Spor salonu sana emekli indirimi ve saunanın yanında bir dolap verdi. Hayat güzel.'],
  ['Your balance class had you stand on one leg for a minute. You did forty seconds and a lot of arm waving.', 'Denge dersinde bir dakika tek ayak üstünde durmanız istendi. Sen kırk saniye durdun, bolca da kol salladın.'],
  ['You swam slow, steady lengths while the young ones splashed about. The tortoise and the hare, live.', 'Gençler etrafa su sıçratırken sen ağır ve kararlı kulaçlarla boy yüzdün. Kaplumbağa ile tavşan, canlı yayında.'],
  ['The doctor said "gentle exercise". You did gentle exercise. Then you had a gentle slice of cake.', 'Doktor "hafif egzersiz" dedi. Hafif egzersiz yaptın. Sonra da hafif bir dilim kek yedin.'],
  ['You did your knee exercises without complaining once. Out loud, anyway.', 'Diz egzersizlerini bir kez bile şikâyet etmeden yaptın. En azından sesli olarak.'],
  ['A pilates class full of people your age. Lots of groaning, lots of laughing, nobody fell over.', 'Akranlarınla dolu bir pilates dersi. Bolca inilti, bolca kahkaha; kimse düşmedi.'],
];

const GYM_HURT: Pair[] = [
  ['You dropped a dumbbell on your foot at the gym.', 'Spor salonunda dambılı ayağına düşürdün.'],
  ['You pulled a muscle showing off at the weights bench. Nobody was even watching.', 'Ağırlık sehpasında hava atayım derken bir kasını incittin. Kimse bakmıyordu bile.'],
  ['You fell off the treadmill. It was not graceful. A video exists.', 'Koşu bandından düştün. Hiç zarif değildi. Videosu da var.'],
  ['You twisted your ankle in a step class. The instructor kept counting.', 'Step dersinde ayak bileğini burktun. Eğitmen saymaya devam etti.'],
];
const GYM_HURT_SENIOR: Pair[] = [
  ['You pulled a muscle reaching for your water bottle. The gym staff were very kind about it.', 'Su şişene uzanırken bir kasını incittin. Salon görevlileri çok ilgilendi.'],
  ['You overdid the stretching and spent two days walking like a question mark.', 'Esnemeyi abarttın ve iki gün soru işareti gibi yürüdün.'],
  ['You slipped on the wet floor by the pool. Nothing broken, except your pride.', 'Havuz kenarındaki ıslak zeminde kaydın. Gururun dışında kırılan bir şey yok.'],
];

/** Prison: the yard. */
const GYM_JAIL: Pair[] = [
  ['You did push-ups in the prison yard. A man with a teardrop tattoo nodded at your form.', 'Havalandırmada şınav çektin. Gözyaşı dövmeli bir adam duruşunu onaylarcasına başını salladı.'],
  ['Forty minutes of laps around the yard, same wall every time. You know every crack in it.', 'Havalandırmada kırk dakika tur attın; hep aynı duvar. Artık her çatlağını tanıyorsun.'],
  ['You lifted a bench with two inmates sitting on it. There is no gym in here, only creativity.', 'Üstünde iki mahkûm otururken bir bankı kaldırdın. Burada spor salonu yok, yaratıcılık var.'],
  ['You joined the football game in the yard. The referee was inside for fraud. It showed.', 'Havalandırmadaki futbol maçına katıldın. Hakem dolandırıcılıktan yatıyordu. Belli oluyordu.'],
  ['You did sit-ups in your cell until your cellmate asked you to stop counting out loud.', 'Koğuş arkadaşın sesli saymayı bırakmanı rica edene kadar mekik çektin.'],
  ['An old lifer taught you a workout with a towel and a water bottle. It works. You hate it.', 'Müebbetlik yaşlı bir mahkûm sana bir havlu ve bir su şişesiyle yapılan bir antrenman öğretti. İşe yarıyor. Nefret ediyorsun.'],
  ['One hour of yard time, one hour of running in circles. Same sky, a little bluer today.', 'Bir saatlik havalandırma, bir saat daire çizerek koşu. Gökyüzü aynı ama bugün biraz daha mavi.'],
  ['You did pull-ups on the yard railings. A guard timed you, unofficially.', 'Havalandırmadaki demirlerde barfiks çektin. Bir gardiyan gayriresmî olarak süre tuttu.'],
];

// ------------------------------------------------------------------ library

const LIB_KID: Pair[] = [
  ['You found a book about dinosaurs and now correct grown-ups on their names.', 'Dinozorlarla ilgili bir kitap buldun; artık büyüklerin dinozor isimlerini düzeltiyorsun.'],
  ['You read a whole comic series in one afternoon. The librarian called it "a personal best".', 'Bir öğleden sonrada bütün bir çizgi roman serisini okudun. Kütüphaneci buna "kişisel rekor" dedi.'],
  ['You got your very own library card. You keep it in your pocket like a passport.', 'Kendi kütüphane kartın oldu. Pasaport gibi cebinde taşıyorsun.'],
  ['You read a book about space and announced at dinner that the sun will explode one day. Dessert was quiet.', 'Uzayla ilgili bir kitap okudun ve akşam yemeğinde güneşin bir gün patlayacağını duyurdun. Tatlı faslı sessiz geçti.'],
  ['Story hour at the library. You asked so many questions that the reader let you finish the story.', 'Kütüphanede masal saati vardı. O kadar çok soru sordun ki okuyan abla masalı senin bitirmene izin verdi.'],
  ['You read a detective book and spent the week suspecting the neighbors.', 'Bir dedektif kitabı okudun ve bütün hafta komşulardan şüphelendin.'],
  ['You found a book of jokes and tested every single one on your family.', 'Bir fıkra kitabı buldun ve her birini tek tek ailende denedin.'],
  ['You read about volcanoes and made one erupt in the kitchen. The family has questions.', 'Yanardağlar hakkında okudun ve mutfakta bir tane patlattın. Ailenin bazı soruları var.'],
  ['You built a fort out of beanbags in the children\'s corner and read inside it all afternoon.', 'Çocuk bölümünde minderlerden bir kale yaptın ve bütün öğleden sonra içinde kitap okudun.'],
  ['You borrowed five books and finished four. The fifth was "too babyish", you said, after reading it twice.', 'Beş kitap ödünç aldın, dördünü bitirdin. Beşincisine "çok bebekçe" dedin; iki kez okuduktan sonra.'],
  ['You read a book about knights and spent the week guarding the kitchen door.', 'Şövalyelerle ilgili bir kitap okudun ve bütün hafta mutfak kapısında nöbet tuttun.'],
  ['You read your first book with no pictures and announced to everyone that you are grown up now.', 'Resimsiz ilk kitabını okudun ve herkese artık büyüdüğünü ilan ettin.'],
];

const LIB_TEEN: Pair[] = [
  ['You studied for exams in the library. You also learned everything about the person at the next table.', 'Kütüphanede sınavlara çalıştın. Yan masadakinin hayatını da baştan sona öğrendin.'],
  ['You read a dystopian novel and now see signs of the end of the world in the school canteen.', 'Distopik bir roman okudun; artık okul kantininde kıyametin işaretlerini görüyorsun.'],
  ['You found a book of poems and copied your favorite into the back of your notebook.', 'Bir şiir kitabı buldun ve en sevdiğin şiiri defterinin arka sayfasına yazdın.'],
  ['You did your whole project in the library. The printer jammed on the last page, as is tradition.', 'Bütün ödevini kütüphanede yaptın. Yazıcı son sayfada sıkıştı; gelenek bozulmadı.'],
  ['You read a fantasy series so fast that you now have to wait a year for the next book. Unbearable.', 'Bir fantastik seriyi o kadar hızlı okudun ki sonraki kitap için bir yıl beklemen gerekiyor. Dayanılır gibi değil.'],
  ['You read the biography of a scientist and changed your dream job. Again.', 'Bir bilim insanının biyografisini okudun ve hayalindeki mesleği değiştirdin. Yine.'],
  ['The librarian caught you reading a book far above your level and nodded with approval.', 'Kütüphaneci seni yaşının çok üstünde bir kitabı okurken yakaladı ve onaylarcasına başını salladı.'],
  ['You read a classic for school and secretly liked it. Nobody can ever know.', 'Okul için bir klasik okudun ve gizliden gizliye sevdin. Bunu kimse bilmemeli.'],
  ['You found a study corner by the window that is now yours. You defend it like a castle.', 'Pencere kenarında artık senin olan bir çalışma köşesi buldun. Onu bir kale gibi savunuyorsun.'],
  ['You leafed through an atlas for an hour and planned trips to eleven countries.', 'Bir saat atlas karıştırdın ve on bir ülkeye gezi planladın.'],
  ['You borrowed a book on chess and beat a friend the next day. You have not stopped talking about it.', 'Satrançla ilgili bir kitap ödünç aldın ve ertesi gün bir arkadaşını yendin. Hâlâ bundan bahsediyorsun.'],
  ['You read a graphic novel twice in one afternoon. The second time was for the drawings.', 'Bir öğleden sonrada bir çizgi romanı iki kez okudun. İkincisi çizimler içindi.'],
];

const LIB_GEN: Pair[] = [
  ['You read a book about black holes.', 'Kara delikler hakkında bir kitap okudun.'],
  ['You read a dusty history of your city.', 'Şehrinin tozlu bir tarih kitabını okudun.'],
  ['You fell asleep on a philosophy book, but some of it went in.', 'Bir felsefe kitabının üstünde uyuyakaldın ama bir kısmı yine de kafana girdi.'],
  ['You finished a 900-page novel. You need to tell someone about it.', '900 sayfalık bir roman bitirdin. Birine anlatmazsan çatlayacaksın.'],
  ['The librarian recommended a book. It was perfect. Librarians know.', 'Kütüphaneci sana bir kitap önerdi. Tam isabet. Kütüphaneciler bilir.'],
  ['You read about octopuses for three hours. They have three hearts.', 'Üç saat boyunca ahtapotlar hakkında okudun. Üç kalpleri varmış.'],
  ['You learned twenty words of a new language. You already forgot eight.', 'Yeni bir dilden yirmi kelime öğrendin. Sekizini çoktan unuttun.'],
  ['You read a poetry collection on the library steps. One line followed you around all week.', 'Kütüphanenin merdivenlerinde bir şiir kitabı okudun. Bir dizesi bütün hafta peşini bırakmadı.'],
  ['You borrowed a cookbook and returned it with a sauce stain on the best page. A review, of sorts.', 'Bir yemek kitabı ödünç aldın ve en güzel sayfasında bir sos lekesiyle iade ettin. Bir tür eleştiri.'],
  ['You read the biography of a famous explorer. Then you explored the back shelves and found the library cat.', 'Ünlü bir kâşifin biyografisini okudun. Sonra arka rafları keşfettin ve kütüphanenin kedisini buldun.'],
  ['You got lost in an encyclopedia. You came in for the Roman Empire and left an expert on rubber ducks.', 'Bir ansiklopedide kayboldun. Roma İmparatorluğu için girdin, lastik ördek uzmanı olarak çıktın.'],
  ['The library was silent except for one man sharpening pencils with real intensity. You read a thriller anyway.', 'Kütüphane sessizdi; sadece bir adam büyük bir ciddiyetle kalem açıyordu. Sen de bir gerilim romanı okudun.'],
  ['You read the last chapter first. You regret nothing.', 'Önce son bölümü okudun. Hiç pişman değilsin.'],
  ['You found a note in a secondhand book: "For M., who always finishes first." You will think about it for days.', 'İkinci el bir kitabın arasında bir not buldun: "Hep önce bitiren M.\'ye." Günlerce bunu düşüneceksin.'],
  ['You read a book about how to read faster. It took you three weeks.', 'Daha hızlı okumayı anlatan bir kitap okudun. Üç haftanı aldı.'],
];

/** 65+. */
const LIB_SENIOR: Pair[] = [
  ['You joined the library reading group. You were the only one who finished the book, and you said so.', 'Kütüphanenin okuma grubuna katıldın. Kitabı bitiren tek kişi sendin ve bunu söyledin.'],
  ['You read the newspapers in the library from front to back, then again to find the mistakes.', 'Kütüphanede gazeteleri baştan sona okudun, sonra hataları bulmak için bir daha okudun.'],
  ['You borrowed a large-print thriller and stayed up past midnight to finish it. Worth it.', 'İri puntolu bir gerilim romanı ödünç aldın ve bitirmek için gece yarısını geçirdin. Değdi.'],
  ['You found a book you read as a teenager. It was much sadder this time.', 'Gençken okuduğun bir kitabı buldun. Bu sefer çok daha hüzünlü geldi.'],
  ['You looked up your family name in the local archive and found an ancestor fined for "excessive singing".', 'Yerel arşivde soyadını araştırdın ve "aşırı şarkı söylemekten" ceza yemiş bir atanı buldun.'],
  ['A young librarian showed you how to borrow e-books. You borrowed eleven before lunch.', 'Genç bir kütüphaneci sana e-kitap ödünç almayı gösterdi. Öğle yemeğine kadar on bir tane aldın.'],
  ['You read a history of the decade you grew up in. As a witness, you object to several chapters.', 'Gençliğinin geçtiği yılların tarihini okudun. Görgü tanığı olarak bazı bölümlere itirazın var.'],
  ['You fell asleep in the armchair by the window with a book on your chest. The librarian let you be.', 'Pencere kenarındaki koltukta göğsünde bir kitapla uyuyakaldın. Kütüphaneci seni uyandırmadı.'],
  ['You started a list of every book you have ever loved. It is already four pages long.', 'Sevdiğin bütün kitapların listesini yapmaya başladın. Şimdiden dört sayfa oldu.'],
  ['You read poetry aloud in the empty reading room. A student clapped from behind a shelf.', 'Boş okuma salonunda yüksek sesle şiir okudun. Bir rafın arkasından bir öğrenci alkışladı.'],
  ['You finally read a classic you pretended to have read at school. It is very good. Sorry, teacher.', 'Okulda okumuş gibi yaptığın bir klasiği sonunda okudun. Çok güzelmiş. Kusura bakmayın öğretmenim.'],
  ['You brought biscuits for the librarians. You now get the new books first.', 'Kütüphanecilere bisküvi götürdün. Yeni kitaplar artık önce sana geliyor.'],
];

const LIB_JAIL: Pair[] = [
  ['You read in the prison library until lights out. Today it was the only door that opened.', 'Işıklar sönene kadar cezaevi kütüphanesinde kitap okudun. Bugün açılan tek kapı oydu.'],
  ['The prison library has one shelf of law books. You read all of it. Twice.', 'Cezaevi kütüphanesinde bir raf hukuk kitabı var. Hepsini okudun. İki kez.'],
  ['A cellmate asked you to read his letters to him. You read them in your best voice.', 'Koğuş arkadaşın mektuplarını ona okumanı istedi. En güzel sesinle okudun.'],
  ['You borrowed a travel guide from the prison library to a country you will not see for years. You planned the whole trip.', 'Cezaevi kütüphanesinden, yıllarca göremeyeceğin bir ülkenin gezi rehberini ödünç aldın. Bütün yolculuğu planladın.'],
  ['The library cart came round. You got a romance novel with the last page missing. You wrote your own ending.', 'Kütüphane arabası koğuşa uğradı. Son sayfası eksik bir aşk romanı düştü payına. Sonunu kendin yazdın.'],
  ['You started a correspondence course in the prison library. The guard who stamps your work is quietly proud.', 'Cezaevi kütüphanesinde açıköğretim derslerine başladın. Ödevlerini damgalayan gardiyan için için gurur duyuyor.'],
  ['You read philosophy in the prison library. The Stoics had a lot to say about small rooms.', 'Cezaevi kütüphanesinde felsefe okudun. Stoacıların küçük odalar hakkında söyleyecek çok şeyi varmış.'],
  ['The prison librarian is an old forger with beautiful handwriting. He recommended a classic. He was right.', 'Cezaevi kütüphanecisi el yazısı çok güzel, yaşlı bir sahtekâr. Sana bir klasik önerdi. Haklıydı.'],
];

// ------------------------------------------------------------------ meditation

const MEDITATE: Pair[] = [
  ['You meditated for an hour. Your mind is a calm lake. With one duck.', 'Bir saat meditasyon yaptın. Zihnin durgun bir göl gibi. Üstünde tek bir ördek var.'],
  ['You tried to empty your mind. It filled up with shopping lists.', 'Zihnini boşaltmaya çalıştın. Market listeleriyle doldu.'],
  ['Ten quiet minutes by the window. The world can wait.', 'Pencere kenarında on sessiz dakika. Dünya biraz bekleyebilir.'],
  ['You did a breathing exercise and finally noticed your shoulders were up by your ears.', 'Nefes egzersizi yaptın ve omuzlarının kulaklarına kadar kalktığını ancak fark ettin.'],
  ['A guided meditation told you to be a mountain. You were a very good mountain.', 'Rehberli meditasyon sana dağ olmanı söyledi. Çok iyi bir dağ oldun.'],
  ['You sat cross-legged for twenty minutes. Your foot fell asleep. Your mind did not.', 'Yirmi dakika bağdaş kurup oturdun. Ayağın uyuştu; zihnin ise bir türlü susmadı.'],
  ['You listened to the rain on the window and did nothing for once. It was wonderful.', 'Pencereye vuran yağmuru dinledin ve bir kez olsun hiçbir şey yapmadın. Harikaydı.'],
  ['You counted your breaths up to ten, then to ten again. Somewhere around the fifth ten, you felt lighter.', 'Nefeslerini ona kadar saydın, sonra yine ona kadar. Beşinci onda bir yerde kendini hafiflemiş hissettin.'],
  ['A meditation app congratulated you on a seven-day streak. You were more moved than you will admit.', 'Bir meditasyon uygulaması yedi günlük serin için seni tebrik etti. Kabul edeceğinden fazla duygulandın.'],
  ['You tried to think of nothing and a song you had not heard in years came back instead. That was nice too.', 'Hiçbir şey düşünmemeye çalıştın; aklına yıllardır duymadığın bir şarkı geldi. O da güzeldi.'],
  ['You sat in the sun with your eyes closed and let every thought drift past like a bus you did not need to catch.', 'Güneşte gözlerini kapayıp oturdun; her düşünceyi binmen gerekmeyen bir otobüs gibi geçip gitmeye bıraktın.'],
  ['Five minutes of silence. Then a neighbor started drilling. You made the drill part of the meditation. Enlightenment.', 'Beş dakikalık sessizlik. Sonra komşu matkapla delmeye başladı. Matkabı da meditasyona dahil ettin. Aydınlanma.'],
];

const MEDITATE_JAIL: Pair[] = [
  ['You meditated on your bunk. The cell was the same size afterwards, but it felt bigger.', 'Ranzanda meditasyon yaptın. Koğuş aynı büyüklükteydi ama daha geniş geldi.'],
  ['You breathed slowly through the evening count. The guard wrote "calm" next to your name. A first.', 'Akşam sayımı boyunca yavaş yavaş nefes aldın. Gardiyan adının yanına "sakin" yazdı. Bir ilk.'],
  ['You stared at one patch of wall for an hour and found a little peace in a crack shaped like a bird.', 'Bir saat aynı duvar parçasına baktın ve kuş şeklindeki bir çatlakta biraz huzur buldun.'],
  ['Your cellmate snores like a tractor. You turned it into a mantra.', 'Koğuş arkadaşın traktör gibi horluyor. Sen de bunu mantraya çevirdin.'],
  ['You meditated through the noise of the block. For ten minutes, nobody could reach you.', 'Koğuşun gürültüsünün ortasında meditasyon yaptın. On dakika boyunca kimse sana ulaşamadı.'],
  ['A volunteer left a little book about breathing. You read it, closed your eyes and were elsewhere for a while.', 'Bir gönüllü nefes üzerine küçük bir kitap bıraktı. Okudun, gözlerini kapadın ve bir süre başka bir yerdeydin.'],
  ['You counted your breaths instead of your days. It helped.', 'Günlerini değil nefeslerini saydın. İyi geldi.'],
  ['You did a breathing exercise before your phone call home. Your voice did not shake.', 'Eve telefon etmeden önce nefes egzersizi yaptın. Sesin titremedi.'],
];

// ------------------------------------------------------------------ doctor

/** 0–2: told from the parents' side. */
const DOC_BABY: Pair[] = [
  ['Your parents took you for a check-up. You were weighed, measured and loudly unimpressed.', 'Ailen seni kontrole götürdü. Tartıldın, ölçüldün ve bütün bunlardan yüksek sesle hiç hoşlanmadın.'],
  ['You got your vaccines. You cried for one minute and slept for three hours.', 'Aşılarını oldun. Bir dakika ağladın, üç saat uyudun.'],
  ['The pediatrician said you are growing nicely. Your parents repeated it to everyone they met.', 'Çocuk doktoru güzel büyüdüğünü söyledi. Ailen bunu karşılaştığı herkese anlattı.'],
  ['You grabbed the doctor\'s stethoscope and would not let go. The doctor said you have a strong grip.', 'Doktorun steteskobunu yakaladın ve bırakmadın. Doktor elinin çok güçlü olduğunu söyledi.'],
  ['A check-up for a little ear infection. Drops, cuddles, done.', 'Ufak bir kulak iltihabı için kontrol. Damla, sarılma, tamam.'],
  ['The nurse made faces until you smiled. Then you sneezed on her. A good visit.', 'Hemşire sen gülümseyene kadar komik suratlar yaptı. Sonra sen de onun üstüne hapşırdın. İyi bir ziyaretti.'],
  ['You slept through your whole check-up. The doctor called you "a model patient".', 'Bütün muayene boyunca uyudun. Doktor sana "örnek hasta" dedi.'],
  ['The doctor said a new tooth is on its way. That explains a lot about last week.', 'Doktor yeni bir dişinin yolda olduğunu söyledi. Geçen haftayı çok iyi açıklıyor.'],
  ['You kicked the baby scale. The doctor wrote down a number anyway.', 'Bebek tartısına tekme attın. Doktor yine de bir sayı yazdı.'],
  ['A routine check-up. Your parents asked twenty questions. The doctor answered every one with a straight face.', 'Rutin bir kontrol. Ailen yirmi soru sordu. Doktor hepsini ciddiyetini bozmadan yanıtladı.'],
];

/** 3–5. */
const DOC_LITTLE: Pair[] = [
  ['The pediatrician said you are growing nicely and gave you a sticker. You wore it for a week.', 'Çocuk doktoru güzel büyüdüğünü söyledi ve sana bir çıkartma verdi. Bir hafta üstünden çıkarmadın.'],
  ['You had a vaccine. You screamed, then got a lollipop and forgave everyone.', 'Aşı oldun. Önce avazın çıktığı kadar bağırdın, sonra bir lolipop aldın ve herkesi affettin.'],
  ['The doctor listened to your chest. Then you listened to the doctor\'s chest. Fair is fair.', 'Doktor göğsünü dinledi. Sonra sen de doktorun göğsünü dinledin. Adalet yerini buldu.'],
  ['A check-up: weight, height, a look in the ears. According to the doctor, everything is right on track.', 'Kontrol: kilo, boy, kulaklara bir bakış. Doktora göre her şey yolunda.'],
  ['You hid under the doctor\'s desk. The check-up happened there.', 'Doktorun masasının altına saklandın. Muayene orada yapıldı.'],
  ['The waiting room had a fish tank. It was the best part of your year.', 'Bekleme salonunda bir akvaryum vardı. Yılın en güzel anı oydu.'],
  ['The doctor said your cough was "just a cold" and prescribed soup. Soup was had.', 'Doktor öksürüğün için "basit bir soğuk algınlığı" dedi ve çorba önerdi. Çorba içildi.'],
  ['At the eye test you named every picture on the chart, wrongly and with great confidence.', 'Göz muayenesinde tablodaki resimlerin hepsine kendinden emin bir şekilde yanlış isim verdin.'],
  ['The doctor let you listen to your own heartbeat. You said it sounded like a horse.', 'Doktor kendi kalp atışını dinlemene izin verdi. At gibi ses çıkardığını söyledin.'],
  ['You told the doctor everything about your new shoes. The check-up came second.', 'Doktora yeni ayakkabılarını en ince ayrıntısına kadar anlattın. Muayene ikinci planda kaldı.'],
];

/** 6–17. */
const DOC_KID: Pair[] = [
  ['The school doctor said your backpack is far too heavy. It is mostly snacks.', 'Okul doktoru sırt çantanın çok ağır olduğunu söyledi. Çoğu atıştırmalık.'],
  ['You needed a filling at the dentist. You were brave. Mostly. Then ice cream.', 'Dişçide dolgu yaptırman gerekti. Cesurdun. Çoğunlukla. Sonra dondurma.'],
  ['A sports check-up: heart fine, lungs fine, knees "a bit dramatic".', 'Spor muayenesi: kalp sağlam, ciğerler sağlam, dizler "biraz dramatik".'],
  ['The doctor said your bones are tired from growing so fast. That explains the naps.', 'Doktor, kemiklerinin hızlı büyümekten yorulduğunu söyledi. Öğle uykuları bundanmış.'],
  ['You got a booster shot and pretended it did not hurt. Your arm disagreed all day.', 'Rapel aşısı oldun ve acımamış gibi yaptın. Kolun bütün gün aksini söyledi.'],
  ['The eye test showed you need glasses. The world got sharper, and so did your opinions.', 'Göz muayenesinde gözlük takman gerektiği çıktı. Dünya netleşti, fikirlerin de.'],
  ['The doctor asked how many hours you sleep. You told the truth. The doctor sighed.', 'Doktor kaç saat uyuduğunu sordu. Doğruyu söyledin. Doktor iç çekti.'],
  ['A check-up for a wrist you sprained in a running race. You won the race, though.', 'Bir koşu yarışında burkulan bileğin için kontrol. Ama yarışı sen kazandın.'],
  ['The doctor said your sore throat comes from talking too much. Your family agreed, loudly.', 'Doktor boğaz ağrının fazla konuşmaktan olduğunu söyledi. Ailen yüksek sesle hak verdi.'],
  ['A routine check-up. You read every poster in the waiting room and now fear germs personally.', 'Rutin bir kontrol. Bekleme salonundaki bütün afişleri okudun; artık mikroplardan kişisel olarak korkuyorsun.'],
];

/** 18–64. */
const DOC_ADULT: Pair[] = [
  ['The doctor gave you vitamins and a lecture.', 'Doktor sana vitamin ve uzun bir nasihat verdi.'],
  ['The doctor said "drink more water". You nodded like you would.', 'Doktor "Daha çok su iç" dedi. İçecekmiş gibi başını salladın.'],
  ['Blood test results: everything normal. You feel oddly proud.', 'Kan tahlili sonuçları: her şey normal. Garip bir şekilde gurur duydun.'],
  ['You waited two hours for a five-minute check-up. Worth it.', 'Beş dakikalık muayene için iki saat bekledin. Yine de değdi.'],
  ['The doctor asked how much you exercise. You described a walk to the fridge in great detail.', 'Doktor ne kadar spor yaptığını sordu. Buzdolabına yürüyüşünü uzun uzun anlattın.'],
  ['Your blood pressure was perfect. The doctor seemed almost disappointed.', 'Tansiyonun mükemmel çıktı. Doktor neredeyse hayal kırıklığına uğramış gibiydi.'],
  ['The doctor said your back pain comes from sitting. You sat down to process it.', 'Doktor sırt ağrının oturmaktan olduğunu söyledi. Bunu sindirmek için oturdun.'],
  ['A full check-up. You learned that your cholesterol has opinions.', 'Baştan aşağı kontrolden geçtin. Kolesterolünün de kendine göre fikirleri varmış.'],
  ['The doctor typed for ten minutes without looking up, then said "all good". You trust the typing.', 'Doktor başını kaldırmadan on dakika bir şeyler yazdı, sonra "Her şey yolunda" dedi. Yazdıklarına güveniyorsun.'],
  ['You finally had that mole checked. Nothing to worry about. You had been worrying for two years.', 'Sonunda şu bene baktırdın. Endişelenecek bir şey yokmuş. İki yıldır endişeleniyordun.'],
  ['The dentist said you floss "enthusiastically but rarely". Fair.', 'Dişçi diş ipini "hevesle ama nadiren" kullandığını söyledi. Haksız sayılmaz.'],
  ['You got a flu jab and a leaflet. You read the leaflet in the waiting room. Twice.', 'Grip aşısı oldun ve bir broşür aldın. Broşürü bekleme salonunda iki kez okudun.'],
];

/** 65+. */
const DOC_ELDER: Pair[] = [
  ['The doctor went through your seven pills and crossed one off. You celebrated like a promotion.', 'Doktor yedi ilacını gözden geçirip birini sildi. Terfi almış gibi kutladın.'],
  ['Your knees were X-rayed. The doctor called them "very experienced".', 'Dizlerinin röntgeni çekildi. Doktor dizlerine "çok tecrübeli" dedi.'],
  ['The young doctor called you "sprightly". You will be using that word all year.', 'Genç doktor sana "dinç" dedi. Bu kelimeyi bütün yıl kullanacaksın.'],
  ['You had your hearing checked. You heard everything, unfortunately including the part about salt.', 'Kulaklarını kontrol ettirdin. Her şeyi duydun; ne yazık ki tuzla ilgili kısmı da.'],
  ['In the waiting room you compared prescriptions with a stranger and made a friend.', 'Bekleme salonunda bir yabancıyla reçetelerinizi karşılaştırdınız ve arkadaş oldunuz.'],
  ['Your blood pressure was fine. You told the doctor it was the herbal tea. The doctor let you have that one.', 'Tansiyonun normaldi. Doktora bunun bitki çayı sayesinde olduğunu söyledin. Doktor itiraz etmedi.'],
  ['The doctor said you have the heart of a sixty-year-old. You chose to hear "sixteen".', 'Doktor kalbinin altmışlık bir kalp gibi olduğunu söyledi. Sen "on altılık" diye duymayı seçtin.'],
  ['New glasses. You can read the menu again, and the small print on letters from the bank.', 'Yeni bir gözlük. Menüyü yeniden okuyabiliyorsun; bankadan gelen mektupların küçük harflerini de.'],
  ['The doctor told you to keep walking every day. You walked straight to the pastry shop. It counts.', 'Doktor her gün yürümeye devam etmeni söyledi. Doğruca pastaneye yürüdün. Sayılır.'],
  ['A flu jab, a pneumonia jab and a lollipop you asked for on principle.', 'Bir grip aşısı, bir zatürre aşısı ve prensip gereği istediğin bir lolipop.'],
  ['You told the doctor about every ache since your last visit, in order. The doctor listened. A saint.', 'Doktora son kontrolden beri her ağrını sırasıyla anlattın. Doktor dinledi. Sabır taşı.'],
];

/** Prison: the infirmary. */
const DOC_JAIL: Pair[] = [
  ['The prison infirmary gave you a check-up and two paracetamol. Paracetamol cures everything in here.', 'Cezaevi revirinde muayene oldun, iki parasetamol verdiler. Burada parasetamol her derde deva.'],
  ['You waited three days for the infirmary. The doctor was kind and in a hurry.', 'Revir sırası üç gün sürdü. Doktor nazikti ama aceleciydi.'],
  ['The prison doctor checked your blood pressure and asked how you sleep. Honest answer: badly.', 'Cezaevi doktoru tansiyonuna baktı ve nasıl uyuduğunu sordu. Dürüst cevap: kötü.'],
  ['A dental check in the infirmary. The chair was older than you. Your teeth survived.', 'Revirde diş muayenesi. Koltuk senden yaşlıydı. Dişlerin bu ziyareti atlattı.'],
  ['The infirmary nurse remembers everyone\'s name. She asked about your family. You had to look away.', 'Revir hemşiresi herkesin adını biliyor. Aileni sordu. Başını çevirmek zorunda kaldın.'],
  ['You got vitamins from the infirmary and a lecture about the canteen biscuits.', 'Revirden vitamin aldın, bir de kantin bisküvileri hakkında nasihat.'],
];

// ------------------------------------------------------------------ makeover

const SALON: Pair[] = [
  ['You got a fresh haircut. You keep catching your reflection.', 'Saçlarını yeni kestirdin. Her vitrinde kendine bakıp duruyorsun.'],
  ['New clothes, new you. Same old shoes.', 'Yeni kıyafetler, yeni sen. Ayakkabılar aynı tabii.'],
  ['The barber talked politics the whole time. The haircut is great, though.', 'Berber baştan sona siyaset konuştu. Ama saç harika oldu.'],
  ['You tried a bold new look. Your family is still getting used to it.', 'Cesur bir tarz denedin. Ailen hâlâ alışmaya çalışıyor.'],
  ['You asked for "just a trim" and lost four centimeters of personality.', 'Sadece uçlarını aldırmak istedin; kişiliğinden dört santim gitti.'],
  ['You bought one good jacket instead of three cheap ones. You stand differently in it.', 'Üç ucuz ceket yerine bir tane iyi ceket aldın. İçinde başka türlü duruyorsun.'],
  ['The hairdresser told you a family secret. Not yours. Theirs. The haircut is great.', 'Kuaför sana bir aile sırrı anlattı. Seninkini değil, kendisininkini. Saçın harika oldu.'],
  ['You got your eyebrows done. You now look permanently, pleasantly surprised.', 'Kaşlarını aldırdın. Artık sürekli hoş bir şekilde şaşırmış görünüyorsun.'],
  ['A sale at the shoe shop changed your life. You walk with purpose now.', 'Ayakkabıcıdaki bir indirim hayatını değiştirdi. Artık kararlı adımlarla yürüyorsun.'],
  ['A hot towel, a head massage, a fresh cut. For ten minutes you were a film star.', 'Sıcak havlu, kafa masajı, yeni bir kesim. On dakikalığına film yıldızıydın.'],
  ['You let a stylist choose everything. You look like a confident stranger. You like this stranger.', 'Her şeyi stiliste bıraktın. Kendinden emin bir yabancıya benziyorsun. Bu yabancıyı sevdin.'],
  ['You cleared out your wardrobe and kept only what you love. Four things. A good start.', 'Gardırobunu boşalttın ve sadece sevdiklerini tuttun. Dört parça. İyi bir başlangıç.'],
  ['The changing-room mirror was very flattering. You suspect a conspiracy. You bought it all anyway.', 'Kabindeki ayna fazla iltifatkârdı. Bir komplodan şüpheleniyorsun. Yine de hepsini aldın.'],
];

// ------------------------------------------------------------------ partner time

interface PartnerX {
  n: string;
  his: string;
  city: string;
  cityTr: string;
  coastal: boolean;
}

/** Dating (any age from 16): no alcohol, no assumptions about kids or homes. */
const PARTNER_NEW: ((x: PartnerX) => Pair)[] = [
  ({ n }) => [`You and ${n} cooked dinner together.`, `${wth(n)} birlikte akşam yemeği yaptınız.`],
  ({ n }) => [`You and ${n} binge-watched a terrible show.`, `${wth(n)} berbat bir diziyi bir oturuşta bitirdiniz.`],
  ({ n, city, cityTr }) => [
    `You and ${n} walked around ${city} until your feet hurt, and neither of you wanted to go home.`,
    `${wth(n)} ayaklarınız ağrıyana kadar ${acc(cityTr)} dolaştınız; ikiniz de eve dönmek istemedi.`,
  ],
  ({ n, his }) => [`${n} played you ${his} favorite album and watched your face the whole time.`, `${n} sana en sevdiği albümü dinletti ve bütün o süre yüzünü izledi.`],
  ({ n }) => [`You and ${n} had a picnic. Ants came. You named them.`, `${wth(n)} piknik yaptınız. Karıncalar geldi. Hepsine isim koydunuz.`],
  ({ n }) => [`You and ${n} talked until the birds started singing. Neither of you remembers falling asleep.`, `${wth(n)} kuşlar ötmeye başlayana kadar konuştunuz. İkiniz de ne zaman uyuduğunuzu hatırlamıyorsunuz.`],
  ({ n }) => [`You and ${n} argued about a film for an hour, then watched it again to settle it. Still unsettled.`, `${wth(n)} bir film hakkında bir saat tartıştınız, çözmek için filmi yeniden izlediniz. Hâlâ çözülmedi.`],
  ({ n, his }) => [`You surprised ${n} with ${his} favorite pastry. The look on ${his} face was worth it.`, `${dat(n)} en sevdiği tatlıyı götürdün. Yüzündeki ifade her şeye değdi.`],
  ({ n }) => [`You and ${n} got lost on purpose on a day trip and found a village with one café and a very old dog.`, `${wth(n)} günübirlik bir gezide bilerek kayboldunuz; tek kahvesi ve çok yaşlı bir köpeği olan bir köy buldunuz.`],
  ({ n }) => [`${n} taught you a card game and then beat you at it eleven times. You are in love, apparently.`, `${n} sana bir kâğıt oyunu öğretti, sonra seni on bir kez yendi. Galiba âşıksın.`],
  ({ n }) => [`You and ${n} went to a museum and invented a life story for every portrait.`, `${wth(n)} bir müzeye gittiniz ve her portre için bir hayat hikâyesi uydurdunuz.`],
  ({ n }) => [`You and ${n} cooked a dish from a country neither of you could find on a map. Delicious, probably.`, `${wth(n)} ikinizin de haritada bulamayacağı bir ülkenin yemeğini pişirdiniz. Muhtemelen lezzetliydi.`],
  ({ n }) => [`${n} fell asleep on your shoulder on the bus. You missed your stop on purpose.`, `${n} otobüste omzunda uyuyakaldı. Durağını bilerek kaçırdın.`],
  ({ n, coastal }) =>
    coastal
      ? [`You and ${n} watched the sunset from the seafront and shared one ice cream, badly.`, `${wth(n)} sahilde gün batımını izlediniz ve bir dondurmayı beceriksizce paylaştınız.`]
      : [`You and ${n} climbed to the best viewpoint in town for the sunset. Worth every step.`, `${wth(n)} gün batımı için şehrin en güzel manzaralı tepesine tırmandınız. Her basamağa değdi.`],
];

/** Married, under 25 years. */
const PARTNER_MARRIED: ((x: PartnerX) => Pair)[] = [
  ({ n }) => [`You and ${n} cooked dinner together and danced in the kitchen while it burned.`, `${wth(n)} birlikte akşam yemeği yaptınız; yemek yanarken mutfakta dans ettiniz.`],
  ({ n }) => [`You and ${n} had a proper date night and talked about the two of you, not the bills.`, `${wth(n)} gerçek bir randevu gecesi yaptınız. Faturaları değil, ikinizi konuştunuz.`],
  ({ n }) => [`You and ${n} assembled a flat-pack wardrobe without a single argument. Practically a miracle.`, `${wth(n)} hiç kavga etmeden demonte bir dolap kurdunuz. Neredeyse bir mucize.`],
  ({ n }) => [`You and ${n} binge-watched a terrible show and blamed each other for pressing "next episode".`, `${wth(n)} berbat bir diziyi bir oturuşta bitirdiniz ve bir sonraki bölümü kimin açtığı konusunda birbirinizi suçladınız.`],
  ({ n }) => [`${n} brought you tea in bed for no reason. You are suspicious, and very happy.`, `${n} sebepsiz yere sana yatağa çay getirdi. Şüphelisin ama çok mutlusun.`],
  ({ n }) => [`You and ${n} went for a long walk and finally made a decision about the curtains.`, `${wth(n)} uzun bir yürüyüşe çıktınız ve sonunda perdeler hakkında bir karar verdiniz.`],
  ({ n }) => [`You and ${n} spent a lazy Sunday doing absolutely nothing together. Highly recommended.`, `${wth(n)} tembel bir pazar günü birlikte hiçbir şey yapmadınız. Şiddetle tavsiye edilir.`],
  ({ n }) => [`You and ${n} went away for a weekend. The hotel was average; the company was not.`, `${wth(n)} hafta sonu kaçamağı yaptınız. Otel vasattı, yol arkadaşın değil.`],
  ({ n }) => [`You and ${n} played a board game and agreed never to speak of the final round.`, `${wth(n)} kutu oyunu oynadınız ve son eli bir daha asla konuşmamaya karar verdiniz.`],
  ({ n }) => [`You told ${n} something you had never told anyone. ${n} just held your hand.`, `${dat(n)} kimseye anlatmadığın bir şeyi anlattın. ${n} sadece elini tuttu.`],
  ({ n }) => [`You and ${n} did the weekly shop together and argued lovingly about cheese.`, `${wth(n)} haftalık alışverişi birlikte yaptınız ve peynir konusunda sevgiyle tartıştınız.`],
  ({ n }) => [`You and ${n} stayed up late planning the future. Then you planned breakfast.`, `${wth(n)} geç saate kadar geleceği planladınız. Sonra da kahvaltıyı.`],
  ({ n }) => [`${n} left a note in your coat pocket. You found it at the worst moment of a bad day. It saved the day.`, `${n} montunun cebine bir not bırakmış. Kötü bir günün en kötü anında buldun. Günü kurtardı.`],
  ({ n }) => [`You and ${n} tried to redo your wedding dance in the living room. Neither of you remembered it, so you made up a new one.`, `${wth(n)} salonda düğün dansınızı yeniden yapmaya çalıştınız. İkiniz de hatırlamıyordunuz, yenisini uydurdunuz.`],
  ({ n, coastal, city, cityTr }) =>
    coastal
      ? [`You took ${n} to the seaside for the day. Sunburn, grilled fish, no complaints.`, `${acc(n)} günübirlik deniz kenarına götürdün. Güneş yanığı, ızgara balık, hiç şikâyet yok.`]
      : [`You took ${n} out of ${city} for a day in the countryside. Fresh air, a long lunch, no phones.`, `${acc(n)} bir günlüğüne ${abl(cityTr)} çıkarıp kırlara götürdün. Temiz hava, uzun bir öğle yemeği, telefon yok.`],
];

/** Married 25+ years (or 10+ years and both in old age). */
const PARTNER_LONG: ((x: PartnerX) => Pair)[] = [
  ({ n }) => [`You and ${n} did the crossword together. You each pretended the other one got the hard clue.`, `${wth(n)} bulmacayı birlikte çözdünüz. Zor soruyu ikiniz de ötekinin bildiğini iddia ettiniz.`],
  ({ n }) => [`You and ${n} finished each other's sentences all day. Some of them wrongly, on purpose.`, `${wth(n)} bütün gün birbirinizin cümlelerini tamamladınız. Bazılarını bilerek yanlış.`],
  ({ n }) => [`You and ${n} looked through the wedding album and agreed the hairstyles were a mistake.`, `${wth(n)} düğün albümüne baktınız ve saç modellerinin hata olduğunda anlaştınız.`],
  ({ n }) => [`${n} still makes your tea exactly the way you like it. You said thank you and meant every word.`, `${n} çayını hâlâ tam sevdiğin gibi demliyor. Teşekkür ettin; her kelimesini içten söyleyerek.`],
  ({ n }) => [`You and ${n} had the same argument you have been having for decades. It was almost comforting.`, `${wth(n)} yıllardır ettiğiniz tartışmayı yine ettiniz. Neredeyse insanın içini rahatlatıyor.`],
  ({ n }) => [`You and ${n} held hands on a bench and commented on everyone who walked past. A perfect afternoon.`, `${wth(n)} bir bankta el ele oturup önünüzden geçen herkes hakkında yorum yaptınız. Mükemmel bir öğleden sonra.`],
  ({ n }) => [`You and ${n} danced to your old song in the kitchen. Slowly. The knees insisted.`, `${wth(n)} mutfakta eski şarkınızla dans ettiniz. Yavaşça. Dizler öyle istedi.`],
  ({ n }) => [`${n} told the story of how you met, wrong again. You let it go: it is a better story that way.`, `${n} nasıl tanıştığınızı yine yanlış anlattı. Düzeltmedin; onun anlattığı hâli daha güzel.`],
  ({ n }) => [`You and ${n} planned a trip you will probably never take. The planning was the trip.`, `${wth(n)} muhtemelen hiç çıkmayacağınız bir geziyi planladınız. Asıl gezi planın kendisiydi.`],
  ({ n }) => [`You and ${n} sat in comfortable silence for an hour. After all these years, it says plenty.`, `${wth(n)} bir saat rahat bir sessizlik içinde oturdunuz. Bunca yıldan sonra o sessizlik çok şey söylüyor.`],
  ({ n }) => [`You and ${n} brought back an old tradition: a Sunday breakfast that lasts until lunch.`, `${wth(n)} eski bir geleneği yeniden başlattınız: öğlene kadar süren pazar kahvaltısı.`],
  ({ n }) => [`You found an old letter ${n} wrote you decades ago and read it out loud. ${n} blushed.`, `${gen(n)} yıllar önce sana yazdığı bir mektubu buldun ve yüksek sesle okudun. ${n} kızardı.`],
  ({ n }) => [`You and ${n} took the evening walk you have taken for years. The neighbors set their clocks by you.`, `${wth(n)} yıllardır yaptığınız akşam yürüyüşüne çıktınız. Komşular saatlerini size göre ayarlıyor.`],
  ({ n }) => [`${n} found your glasses on top of your head. Again. You both laughed until you had to sit down.`, `${n} gözlüğünü yine başının üstünde buldu. Oturmak zorunda kalana kadar güldünüz.`],
  ({ n }) => [`You and ${n} argued about which year you visited that little town. You were both wrong.`, `${wth(n)} o küçük kasabaya hangi yıl gittiğinizi tartıştınız. İkiniz de yanılıyordunuz.`],
  ({ n }) => [`You read the newspaper to ${n} over breakfast. ${n} corrected your pronunciation twice, lovingly.`, `Kahvaltıda ${dat(n)} gazete okudun. ${n} telaffuzunu iki kez, sevgiyle düzeltti.`],
];

// ------------------------------------------------------------------ parents

interface ParentX {
  k: string; // "mom" / "annen"
  accK: string; // "anneni"
  n: string;
  obj: string; // him / her
  age: number; // the player's age
}

/** Under 18: the player still lives at home. */
const PARENTS_MINOR: ((x: ParentX) => Pair)[] = [
  ({ k, accK, n }) => [`You called your ${k} from a friend's house to ask if you could stay for dinner. ${n} said yes, eventually.`, `Bir arkadaşının evinden ${accK} arayıp akşam yemeğine kalıp kalamayacağını sordun. ${n} sonunda izin verdi.`],
  ({ k, accK, n }) => [`You called your ${k} to ask where your sports kit was. ${n} knew. ${n} always knows.`, `Eşofmanın nerede diye ${accK} aradın. ${n} biliyordu. ${n} her zaman bilir.`],
  ({ k, accK, n, obj }) => [`You called your ${k} to tell ${obj} a joke you heard at school. ${n} laughed at the wrong part.`, `Okulda duyduğun bir fıkrayı anlatmak için ${accK} aradın. ${n} yanlış yerde güldü.`],
  ({ k, accK }) => [`You called your ${k} from a school trip. You mostly talked about the food on the bus.`, `Okul gezisinden ${accK} aradın. Çoğunlukla otobüste yediklerini anlattın.`],
  ({ k, accK }) => [`You called your ${k} to ask if you could get a pet. The answer was "we'll see", which means no.`, `Evcil hayvan alıp alamayacağınızı sormak için ${accK} aradın. Cevap "Bakarız" oldu; yani hayır.`],
  ({ k, accK }) => [`You called your ${k} from a sleepover and reported everything you were allowed to eat there.`, `Pijama partisinden ${accK} aradın ve orada yemene izin verilen her şeyi tek tek rapor ettin.`],
  ({ k, accK, obj }) => [`You called your ${k} because you missed ${obj}. You said it was about homework.`, `${cap(accK)} özlediğin için aradın. Ödev için aradığını söyledin.`],
  ({ k, accK, n }) => [`You called your ${k} to ask what was for dinner. ${n} said "food". The classic answer.`, `Akşama ne yemek olduğunu sormak için ${accK} aradın. ${n} "Yemek" dedi. Klasik cevap.`],
];

/** Adult child, parent under 75. */
const PARENTS_ADULT: ((x: ParentX) => Pair)[] = [
  ({ k, accK, n }) => [`You called your ${k}. ${n} talked for an hour about the neighbors.`, `${cap(accK)} aradın. ${n} bir saat boyunca komşuları anlattı.`],
  ({ k, accK, n }) => [`You called your ${k}. ${n} asked if you are eating properly. Three times.`, `${cap(accK)} aradın. ${n} düzgün yemek yiyip yemediğini üç kere sordu.`],
  ({ k, accK, n }) => [`You called your ${k} just to say hi. ${n} assumed something was wrong.`, `${cap(accK)} sadece selam vermek için aradın. ${n} kötü bir şey olduğunu sandı.`],
  ({ k, accK, n }) => [`A video call with your ${k}. You saw a lot of ${n}'s forehead.`, `${cap(accK)} görüntülü aradın. Ekranda çoğunlukla ${gen(n)} alnını gördün.`],
  ({ k, accK, n }) => [`You called your ${k}. ${n} gave you a full report on a cousin you have never met.`, `${cap(accK)} aradın. ${n} hiç tanımadığın bir kuzenin hakkında ayrıntılı bir rapor verdi.`],
  ({ k, accK }) => [`You called your ${k} for a recipe. You got the recipe, a story and a gentle question about your life choices.`, `Bir tarif için ${accK} aradın. Tarifi aldın; yanında bir hikâye ve hayat tercihlerine dair nazik bir soru da.`],
  ({ k, accK, n }) => [`You called your ${k}. ${n} put you on speaker so the whole kitchen could hear you.`, `${cap(accK)} aradın. ${n} bütün mutfak duysun diye seni hoparlöre aldı.`],
  ({ k, accK }) => [`You called your ${k} on the way home. Twenty minutes went by like two.`, `Eve dönerken ${accK} aradın. Yirmi dakika iki dakika gibi geçti.`],
  ({ k, accK, n }) => [`You called your ${k} to complain about your day. ${n} took your side immediately and completely.`, `Gününden dert yanmak için ${accK} aradın. ${n} hemen ve tamamen senin tarafını tuttu.`],
  ({ k, accK, obj }) => [`You called your ${k} to talk ${obj} through the new TV remote. It took forty minutes. You both secretly enjoyed it.`, `Yeni televizyon kumandasını tarif etmek için ${accK} aradın. Kırk dakika sürdü. İkiniz de gizliden gizliye keyif aldınız.`],
  ({ k, accK, n }) => [`You called your ${k}. ${n} wanted to know when you are visiting. You said "soon". ${n} wrote it down.`, `${cap(accK)} aradın. ${n} ne zaman geleceğini sordu. "Yakında" dedin. ${n} not aldı.`],
  ({ k, accK }) => [`You called your ${k} for no reason. You talked about the weather, the news and nothing. Exactly what you needed.`, `Hiçbir sebep yokken ${accK} aradın. Havadan, haberlerden ve hiçbir şeyden konuştunuz. Tam ihtiyacın olan buydu.`],
];

/** Parent 75+. */
const PARENTS_OLD: ((x: ParentX) => Pair)[] = [
  ({ k, accK, n }) => [`You called your ${k}. ${n} took a while to find the phone, then talked for an hour.`, `${cap(accK)} aradın. ${n} telefonu bulana kadar biraz sürdü, sonra bir saat konuştu.`],
  ({ k, accK }) => [`You called your ${k} and heard the same story as last time. You laughed in the same places. It mattered.`, `${cap(accK)} aradın ve geçen seferki hikâyeyi yeniden dinledin. Aynı yerlerde güldün. Önemliydi.`],
  ({ k, accK, n }) => [`You called your ${k} to ask about the medicine. ${n} wanted to talk about the neighbor's new car instead.`, `İlaçlarını sormak için ${accK} aradın. ${n} ise komşunun yeni arabasını anlatmak istedi.`],
  ({ k, accK, n }) => [`You called your ${k}. ${n} said "I'm fine, don't worry" four times. You worried, quietly.`, `${cap(accK)} aradın. ${n} dört kez "İyiyim, merak etme" dedi. Merak ettin; ama sessizce.`],
  ({ k, accK, n }) => [`You called your ${k} and asked about your own childhood. ${n} remembered things you had forgotten.`, `${cap(accK)} aradın ve kendi çocukluğunu sordun. ${n} senin unuttuğun şeyleri hatırlıyordu.`],
  ({ k, accK }) => [`A video call with your ${k}: ten minutes of ceiling, then a face. Worth it.`, `${cap(accK)} görüntülü aradın: on dakika tavan, sonra bir yüz. Değdi.`],
  ({ k, accK, age }) => [`You called your ${k}, who told you to dress warmly. You are ${age}. You dressed warmly.`, `${cap(accK)} aradın; sıkı giyinmeni söyledi. ${age} yaşındasın. Sıkı giyindin.`],
  ({ k, accK, n, obj }) => [`You called your ${k} and read ${obj} the news. ${n} disagreed with most of it.`, `${cap(accK)} aradın ve ona haberleri okudun. ${n} çoğuna katılmadı.`],
  ({ k, accK, n }) => [`You called your ${k} and promised to visit at the weekend. ${n} started cooking immediately.`, `${cap(accK)} aradın ve hafta sonu geleceğine söz verdin. ${n} hemen yemek yapmaya başladı.`],
  ({ k, accK, n, age }) => [`You called your ${k}. ${n} asked if you are eating properly. You are ${age}, and the answer is still no.`, `${cap(accK)} aradın. ${n} düzgün yemek yiyip yemediğini sordu. ${age} yaşındasın ve cevap hâlâ hayır.`],
];

// ------------------------------------------------------------------ siblings

interface SibX {
  k: string;
  n: string;
}

const SIBS_KID: ((x: SibX) => Pair)[] = [
  ({ k, n }) => [`You and your ${k} ${n} built a den behind the sofa and refused to come out for dinner.`, `${cap(k)} ${wth(n)} kanepenin arkasına bir kale kurdunuz ve yemeğe çıkmayı reddettiniz.`],
  ({ n }) => [`You and ${n} had a pillow fight. A lamp was injured. You both blamed the wind.`, `${wth(n)} yastık savaşı yaptınız. Bir lamba yaralandı. İkiniz de rüzgârı suçladınız.`],
  ({ n }) => [`You and ${n} raced bikes around the block. ${n} won and has a speech prepared.`, `${wth(n)} sokakta bisiklet yarışı yaptınız. ${n} kazandı ve hazır bir konuşması var.`],
  ({ n }) => [`You and ${n} swapped secrets under a blanket with a torch. You promised never to tell. You will tell, eventually.`, `${wth(n)} battaniyenin altında el feneriyle sırlarınızı paylaştınız. Kimseye söylememeye söz verdiniz. Er geç söyleyeceksin.`],
  ({ n }) => [`You and ${n} put on a show for the family. The reviews were kind.`, `${wth(n)} aileye bir gösteri sundunuz. Eleştiriler nazikti.`],
  ({ n }) => [`You and ${n} fought over the last slice of cake, then split it exactly in half with a ruler.`, `${wth(n)} son dilim pasta için kavga ettiniz, sonra cetvelle tam ortasından böldünüz.`],
  ({ n }) => [`${n} taught you a card trick. It does not work, but you do it anyway.`, `${n} sana bir kart numarası öğretti. İşe yaramıyor ama yine de yapıyorsun.`],
  ({ n }) => [`You and ${n} spent the afternoon making a comic. You drew, ${n} wrote, nobody finished it.`, `${wth(n)} bütün öğleden sonra çizgi roman yaptınız. Sen çizdin, ${n} yazdı, kimse bitirmedi.`],
  ({ n }) => [`You and ${n} played hide-and-seek. ${n} hid so well that you had dinner first.`, `${wth(n)} saklambaç oynadınız. ${n} o kadar iyi saklandı ki önce akşam yemeğini yedin.`],
  ({ n }) => [`You and ${n} made a pact against bedtime. It held until a quarter past nine.`, `${wth(n)} yatma saatine karşı ittifak kurdunuz. Dokuzu çeyrek geçeye kadar dayandı.`],
];

const SIBS_GROWN: ((x: SibX) => Pair)[] = [
  ({ k, n }) => [`You and your ${k} ${n} played old video games all night.`, `${cap(k)} ${wth(n)} bütün gece eski video oyunları oynadınız.`],
  ({ n }) => [`You and ${n} went through old family photos and laughed until it hurt.`, `${wth(n)} eski aile fotoğraflarına bakıp karnınız ağrıyana kadar güldünüz.`],
  ({ n }) => [`You and ${n} argued about who was the favorite child. Unresolved.`, `${wth(n)} ailenin gözdesinin kim olduğunu tartıştınız. Sonuç çıkmadı.`],
  ({ n }) => [`You and ${n} cooked your grandmother's recipe. It was almost right.`, `${wth(n)} ninenizin tarifini pişirdiniz. Neredeyse aynısı oldu.`],
  ({ n }) => [`You and ${n} went for a long walk and talked honestly about your parents, maybe for the first time.`, `${wth(n)} uzun bir yürüyüşe çıktınız ve belki de ilk kez anne babanızı dürüstçe konuştunuz.`],
  ({ n }) => [`You and ${n} quoted an old family film line by line. Nobody else in the room understood.`, `${wth(n)} eski bir aile filminin repliklerini satır satır söylediniz. Odadaki kimse anlamadı.`],
  ({ n }) => [`${n} borrowed something of yours years ago. You brought it up again. ${n} denied everything again.`, `${n} yıllar önce senden bir şey ödünç almıştı. Konuyu yine açtın. ${n} yine her şeyi inkâr etti.`],
  ({ n }) => [`You and ${n} went to see a band you both loved as kids and sang every word.`, `${wth(n)} çocukken bayıldığınız bir grubun konserine gittiniz ve her şarkıya eşlik ettiniz.`],
  ({ n }) => [`You and ${n} played cards until two in the morning. ${n} still cheats exactly the same way.`, `${wth(n)} gece ikiye kadar kâğıt oynadınız. ${n} hâlâ tıpatıp aynı şekilde hile yapıyor.`],
  ({ n }) => [`You called ${n} for advice. ${n} gave terrible advice, lovingly.`, `Akıl danışmak için ${acc(n)} aradın. ${n} sevgiyle berbat bir tavsiye verdi.`],
  ({ n }) => [`You and ${n} went out to eat and argued for ten minutes about who owed what. Tradition.`, `${wth(n)} dışarıda yemek yediniz ve kimin ne kadar ödeyeceğini on dakika tartıştınız. Gelenek.`],
  ({ n }) => [`You and ${n} laughed so hard about something from childhood that a waiter came to check on you.`, `${wth(n)} çocukluktan bir şeye öyle güldünüz ki garson iyi olup olmadığınızı sormaya geldi.`],
];

const SIBS_OLD: ((x: SibX) => Pair)[] = [
  ({ n }) => [`You and ${n} compared aches over tea. ${n} won, and counts it as a victory.`, `${wth(n)} çay içerken ağrılarınızı karşılaştırdınız. ${n} kazandı ve bunu zafer sayıyor.`],
  ({ n }) => [`You and ${n} visited the street you grew up on. The bakery is a phone shop now. You both stood there a while.`, `${wth(n)} büyüdüğünüz sokağa gittiniz. Fırın şimdi telefoncu olmuş. İkiniz de bir süre orada durdunuz.`],
  ({ n }) => [`You and ${n} told childhood stories to anyone who would listen. Nobody escaped.`, `${wth(n)} çocukluğunuza dair hikâyeleri dinleyen herkese anlattınız. Kimse kaçamadı.`],
  ({ n }) => [`${n} still calls you by your childhood nickname. You still hate it. You would miss it.`, `${n} sana hâlâ çocukluk lakabınla sesleniyor. Hâlâ nefret ediyorsun. Ama söylemese özlerdin.`],
  ({ n }) => [`You and ${n} played cards like you did fifty years ago. Same arguments, same luck.`, `${wth(n)} elli yıl önceki gibi kâğıt oynadınız. Aynı tartışmalar, aynı şans.`],
  ({ n }) => [`You and ${n} cooked your mother's recipe. It was almost right. It is never quite right.`, `${wth(n)} annenizin tarifini pişirdiniz. Neredeyse aynısı oldu. Hiçbir zaman tam aynısı olmuyor.`],
  ({ n }) => [`You and ${n} sat on a bench and agreed that everything was better before. Then you agreed it wasn't.`, `${wth(n)} bir bankta oturup eskiden her şeyin daha güzel olduğuna karar verdiniz. Sonra olmadığına karar verdiniz.`],
  ({ n }) => [`You and ${n} phoned each other every evening this week. Nothing to say. Plenty to say.`, `${wth(n)} bu hafta her akşam telefonlaştınız. Söylenecek bir şey yoktu. Söylenecek çok şey vardı.`],
];

// ------------------------------------------------------------------ kids

interface KidX {
  n: string;
  his: string;
  he: string;
  age: number;
  coastal: boolean;
  parentEn: string; // "Mama" / "Dad"
  parentTr: string; // "Anne" / "Baba"
  g: string; // a grandchild's name (grand bucket only)
  awayEn: string; // the city an emigrated child lives in (abroad lines only)
  awayTr: string;
}

/** Youngest child 0–4. */
const KIDS_BABY: ((x: KidX) => Pair)[] = [
  ({ n }) => [`You read ${n} the same picture book nine times in a row. ${n} wanted a tenth.`, `${dat(n)} aynı resimli kitabı üst üste dokuz kez okudun. ${n} onuncuyu istedi.`],
  ({ n }) => [`You built a tower of blocks and ${n} knocked it down. Again. For an hour. Bliss.`, `Tahta bloklardan kule yaptın, ${n} yıktı. Yine. Bir saat boyunca. Saf mutluluk.`],
  ({ n }) => [`You took ${n} to the playground. ${n} went down the slide forty times and cried when it was time to go.`, `${acc(n)} parka götürdün. ${n} kaydıraktan kırk kez kaydı ve eve dönme vakti gelince ağladı.`],
  ({ n }) => [`${n} fell asleep on your chest. You did not move for two hours. Your arm is still asleep.`, `${n} göğsünde uyuyakaldı. İki saat kımıldamadın. Kolun hâlâ uyuşuk.`],
  ({ n }) => [`Bath time with ${n}. Most of the water ended up on you.`, `${gen(n)} banyo saati. Suyun çoğu senin üstüne sıçradı.`],
  ({ n }) => [`You and ${n} fed the ducks. ${n} ate some of the bread too. Everyone was happy.`, `${wth(n)} ördeklere ekmek attınız. ${n} ekmeğin bir kısmını da kendisi yedi. Herkes mutluydu.`],
  ({ n, parentEn, parentTr }) => [`${n} said a new word today. You decided it was "${parentEn}". It was "ball".`, `${n} bugün yeni bir kelime söyledi. "${parentTr}" dediğine karar verdin. "Top" demişti.`],
  ({ n }) => [`You sang every song you know to get ${n} to sleep, then made some up. One of them is a household hit now.`, `${acc(n)} uyutmak için bildiğin bütün şarkıları söyledin, sonra yenilerini uydurdun. Biri artık evin hiti.`],
  ({ n }) => [`You and ${n} played peekaboo until you both had the giggles.`, `${wth(n)} ce-e oynadınız; ikiniz de gülmekten kırıldınız.`],
  ({ n }) => [`${n} "helped" you cook. The kitchen will recover.`, `${n} yemek yaparken sana "yardım etti". Mutfak toparlanır.`],
];

/** Youngest child 5–12. */
const KIDS_SCHOOL: ((x: KidX) => Pair)[] = [
  ({ n }) => [`You helped ${n} with homework. You also learned something about fractions.`, `${dat(n)} ödevinde yardım ettin. Kesirler hakkında sen de bir şey öğrendin.`],
  ({ n }) => [`You and ${n} built a blanket fort. Nobody wanted to leave it.`, `${wth(n)} battaniyeden kale yaptınız. Kimse çıkmak istemedi.`],
  ({ n }) => [`Board game night with ${n}. Someone flipped the board. It was you.`, `${wth(n)} kutu oyunu oynadınız. Biri tahtayı devirdi. O kişi sendin.`],
  ({ n }) => [`You taught ${n} to ride a bike. You ran behind for an hour and let go at the perfect moment.`, `${dat(n)} bisiklet sürmeyi öğrettin. Bir saat arkasından koştun ve tam doğru anda bıraktın.`],
  ({ n }) => [`You went to ${n}'s school play. ${n} was Tree Number Three and nailed it.`, `${gen(n)} okul gösterisine gittin. ${n} Üçüncü Ağaç rolündeydi ve hakkını verdi.`],
  ({ n }) => [`You and ${n} baked cookies. Half the dough never made it to the oven.`, `${wth(n)} kurabiye yaptınız. Hamurun yarısı fırına hiç ulaşamadı.`],
  ({ n }) => [`${n} asked why the sky is blue. You said "science", then looked it up together.`, `${n} gökyüzünün neden mavi olduğunu sordu. "Bilim" dedin, sonra birlikte araştırdınız.`],
  ({ n }) => [`You took ${n} to the park. ${n} ended up in the fountain. You were not far behind.`, `${acc(n)} parka götürdün. ${n} kendini fıskiyeli havuzun içinde buldu. Sen de hemen arkasından.`],
  ({ n, age }) => [`You and ${n} played football in the yard. You lost on penalties to ${aNum(age)}-year-old.`, `${wth(n)} bahçede top oynadınız. ${age} yaşında birine penaltılarla yenildin.`],
  ({ n }) => [`You and ${n} made a volcano for the science fair. It erupted early, on the bus.`, `${wth(n)} bilim fuarı için yanardağ yaptınız. Erken patladı, otobüste.`],
  ({ n, coastal }) =>
    coastal
      ? [`A day at the beach with ${n}: sunburn, sand everywhere, perfect.`, `${wth(n)} denizde bir gün: güneş yanığı, her yerde kum, mükemmel.`]
      : [`A picnic in the countryside with ${n}: one wasp, many sandwiches, perfect.`, `${wth(n)} kırda piknik: bir eşek arısı, bolca sandviç, mükemmel.`],
];

/** Youngest child 13–17. */
const KIDS_TEEN: ((x: KidX) => Pair)[] = [
  ({ n }) => [`You took ${n} and three friends to the cinema. You were told not to speak. You did not speak.`, `${acc(n)} ve üç arkadaşını sinemaya götürdün. Konuşmaman söylendi. Konuşmadın.`],
  ({ n, his }) => [`${n} let you listen to ${his} music. You said "not bad". Correct answer.`, `${n} sana kendi müziğini dinletti. "Fena değil" dedin. Doğru cevap.`],
  ({ n }) => [`You and ${n} had a real conversation in the car. You both pretended it was not happening, so it kept happening.`, `${wth(n)} arabada gerçek bir sohbet ettiniz. İkiniz de olmuyormuş gibi davrandınız, o yüzden sürdü.`],
  ({ n }) => [`You taught ${n} to cook one proper dish. ${n} now makes it for everyone, badly and proudly.`, `${dat(n)} doğru dürüst bir yemek yapmayı öğrettin. ${n} artık herkese yapıyor; kötü ama gururla.`],
  ({ n }) => [`You helped ${n} revise for exams. You remembered nothing, but you made excellent tea.`, `${dat(n)} sınavlarına çalışırken yardım ettin. Hiçbir şey hatırlamıyordun ama çok güzel çay demledin.`],
  ({ n }) => [`${n} beat you at a video game and has not stopped talking about it.`, `${n} seni bir video oyununda yendi ve hâlâ bundan bahsediyor.`],
  ({ n }) => [`You went to ${n}'s match and cheered so loudly that ${n} asked you to cheer less. You cheered slightly less.`, `${gen(n)} maçına gittin ve öyle bağırdın ki ${n} biraz daha az bağırmanı istedi. Biraz daha az bağırdın.`],
  ({ n, his, he }) => [`${n} rolled ${his} eyes at your joke, then laughed when ${he} thought you were not looking.`, `${n} şakana gözlerini devirdi, sonra bakmadığını sanınca güldü.`],
  ({ n }) => [`You and ${n} stayed up watching an old film you loved at that age. ${n} admitted it was "okay".`, `${wth(n)} senin o yaşta bayıldığın eski bir filmi gece geç saate kadar izlediniz. ${n} filmin "idare eder" olduğunu kabul etti.`],
  ({ n }) => [`You and ${n} went for a long walk and ${n} told you about a crush. You said all the right things. Probably.`, `${wth(n)} uzun bir yürüyüşe çıktınız ve ${n} sana hoşlandığı birinden bahsetti. Doğru şeyleri söyledin. Herhalde.`],
];

/** All children grown up. */
const KIDS_ADULT: ((x: KidX) => Pair)[] = [
  ({ n }) => [`${n} came over for Sunday lunch and left with three boxes of leftovers.`, `${n} pazar yemeğine geldi ve üç kap artan yemekle gitti.`],
  ({ n }) => [`You and ${n} had a long phone call about nothing. It was about everything, really.`, `${wth(n)} hiçbir şey hakkında uzun uzun telefonda konuştunuz. Aslında her şey hakkındaydı.`],
  ({ n }) => [`${n} asked for your advice and actually took it. You need to sit down.`, `${n} senden tavsiye istedi ve gerçekten dinledi. Biraz oturman lazım.`],
  ({ n }) => [`You helped ${n} move house. You carried the light boxes and gave the heavy opinions.`, `${dat(n)} taşınırken yardım ettin. Hafif kolileri sen taşıdın, ağır fikirleri de sen verdin.`],
  ({ n }) => [`You and ${n} cooked an old family recipe together. This time ${n} wrote it down.`, `${wth(n)} eski bir aile tarifini birlikte pişirdiniz. ${n} bu sefer tarifi yazdı.`],
  ({ n }) => [`${n} took you out for dinner and paid. You pretended to be offended. You were proud.`, `${n} seni yemeğe çıkardı ve hesabı ödedi. Alınmış gibi yaptın. Gurur duydun.`],
  ({ n }) => [`You and ${n} went through a box of childhood drawings. ${n} wants to burn some. You refused.`, `${wth(n)} bir kutu dolusu çocukluk resmine baktınız. ${n} bazılarını yakmak istiyor. İzin vermedin.`],
  ({ n }) => [`${n} fixed something on your phone and explained it twice. You will call ${n} next week about the same thing.`, `${n} telefonundaki bir şeyi düzeltti ve iki kez anlattı. Gelecek hafta aynı şey için yine arayacaksın.`],
  ({ n }) => [`You and ${n} went to a match together, just like when ${n} was little. You both shouted at the referee.`, `${wth(n)}, tıpkı onun küçüklüğündeki gibi birlikte maça gittiniz. İkiniz de hakeme bağırdınız.`],
  ({ n }) => [`${n} called just to hear your voice, and said so. You had to pretend there was something in your eye.`, `${n} sırf sesini duymak için aradı; öyle de söyledi. Gözüne bir şey kaçmış gibi yapmak zorunda kaldın.`],
  ({ n }) => [`${n} sent you a photo of a dish made from your recipe. It looked better than yours. You said so.`, `${n} senin tarifinle yaptığı yemeğin fotoğrafını gönderdi. Seninkinden güzel görünüyordu. Söyledin de.`],
  ({ n }) => [`You and ${n} went for a walk and talked about work. ${n} sounds more like you every year.`, `${wth(n)} yürüyüşe çıkıp iş üzerine konuştunuz. ${n} her yıl biraz daha sana benziyor.`],
  ({ n }) => [`${n} came to fix a shelf and stayed all afternoon. The shelf is still crooked. Nobody minded.`, `${n} bir rafı tamir etmeye geldi ve bütün öğleden sonra kaldı. Raf hâlâ eğri. Kimsenin umurunda değil.`],
  ({ n }) => [`You and ${n} rewatched a film you used to watch together and said the same line at the same moment.`, `${wth(n)} eskiden birlikte izlediğiniz bir filmi yeniden izlediniz ve aynı repliği aynı anda söylediniz.`],
];

/** Grown children with a grandchild aged 3–14. */
const KIDS_GRAND: ((x: KidX) => Pair)[] = [
  ({ n }) => [`${n} brought the grandkids for the weekend. You filled them with sugar and sent them home.`, `${n} torunları hafta sonu sana getirdi. Onları şekere boğup evlerine yolladın.`],
  ({ n, g }) => [`You looked after ${g} so ${n} could have an evening off. You and ${g} both stayed up far too late.`, `${n} bir akşam dinlensin diye ${dat(g)} sen baktın. ${wth(g)} ikiniz de çok geç yattınız.`],
  ({ n }) => [`Sunday lunch with ${n} and the grandkids: three conversations at once, one gravy boat, total chaos. Perfect.`, `${n} ve torunlarla pazar yemeği: aynı anda üç sohbet, bir sos kabı, tam bir kaos. Mükemmel.`],
  ({ n, g }) => [`You told ${g} a story about ${n} as a child. ${n} begged you to stop. ${g} begged for more.`, `${dat(g)} ${gen(n)} çocukluğundan bir hikâye anlattın. ${n} susman için yalvardı, ${g} devamı için.`],
  ({ n }) => [`${n} asked how you ever managed with small kids. You laughed for a long time.`, `${n} küçük çocuklarla nasıl başa çıktığını sordu. Uzun süre güldün.`],
  ({ n, g }) => [`You and ${n} watched ${g} play and said nothing for a while. Some moments do not need words.`, `${wth(n)} oynayan ${acc(g)} izlediniz ve bir süre hiçbir şey demediniz. Bazı anların söze ihtiyacı yok.`],
  ({ g }) => [`${g} drew a picture of the whole family. You are the tallest. It is on your fridge.`, `${g} bütün ailenin resmini çizdi. En uzun sensin. Resim buzdolabının üstünde.`],
  ({ n, g }) => [`${n} rang to say ${g} has your stubborn streak. You took it as a compliment.`, `${n} arayıp ${gen(g)} senin inatçılığını aldığını söyledi. İltifat olarak kabul ettin.`],
  ({ n, g }) => [`You taught ${g} a card game ${n} used to love. Now three generations cheat at it.`, `${dat(g)} vaktiyle ${gen(n)} çok sevdiği bir kâğıt oyununu öğrettin. Artık üç kuşak birden hile yapıyor.`],
  ({ n, g }) => [`You bought ice cream for ${n} and ${g}. ${n} still orders the same flavor as at six.`, `${wth(n)} ${dat(g)} dondurma ısmarladın. ${n} hâlâ altı yaşındaki gibi aynı çeşidi söylüyor.`],
];

/** A grown child who lives abroad (base.child_abroad): calls, parcels and flights, never "came over". */
const KIDS_ABROAD: ((x: KidX) => Pair)[] = [
  ({ n, awayEn, awayTr }) => [`A video call with ${n} in ${awayEn}. It was breakfast there and midnight here. You both ate something.`, `${loc(awayTr)} yaşayan ${wth(n)} görüntülü konuştunuz. Orada kahvaltı, burada gece yarısıydı. İkiniz de bir şeyler atıştırdınız.`],
  ({ n }) => [`${n} gave you a video tour of the new flat. You mostly saw the ceiling.`, `${n} yeni evini görüntülü gezdirdi. Sen çoğunlukla tavanı gördün.`],
  ({ n }) => [`You posted ${n} a parcel of home food. Customs opened it. Customs kept the jam.`, `${dat(n)} koli koli ev yemeği yolladın. Gümrük açtı. Reçeli gümrük aldı.`],
  ({ n, awayEn, awayTr }) => [`You flew to ${awayEn} to see ${n}. You got lost twice and loved every minute.`, `${acc(n)} görmek için ${dat(awayTr)} uçtun. İki kez kayboldun ve her dakikasına bayıldın.`],
  ({ n }) => [`${n} called to ask how you make your soup. You talked for an hour, mostly not about soup.`, `${n} çorbanın tarifini sormak için aradı. Bir saat konuştunuz; çoğu çorba hakkında değildi.`],
  ({ n }) => [`You learned three words of the language where ${n} lives and used all three on the phone. ${n} cried laughing.`, `${gen(n)} yaşadığı ülkenin dilinden üç kelime öğrendin ve telefonda üçünü de kullandın. ${n} gülmekten ağladı.`],
  ({ n }) => [`${n} sent a photo of a local dish that "tastes almost like yours". It did not look like yours at all.`, `${n} "neredeyse seninki gibi" olan yerel bir yemeğin fotoğrafını attı. Hiç de seninkine benzemiyordu.`],
  ({ n }) => [`You and ${n} watched the same film at the same time in two different countries and texted the whole way through.`, `${wth(n)} aynı filmi aynı anda, iki ayrı ülkede izlediniz ve baştan sona mesajlaştınız.`],
];
/** A grown child abroad with a grandchild aged 3–14. */
const KIDS_ABROAD_GRAND: ((x: KidX) => Pair)[] = [
  ({ n, g }) => [`${g} held the phone so close on the video call from ${n}'s that you mostly saw a nostril. Best call of the year.`, `${n} aradığında ${g} telefonu o kadar yakın tuttu ki çoğunlukla bir burun deliği gördün. Yılın en güzel görüşmesi.`],
  ({ g }) => [`You read ${g} a bedtime story over a video call. ${g} fell asleep; you kept reading.`, `${dat(g)} görüntülü aramada uyku masalı okudun. ${g} uyudu; sen okumaya devam ettin.`],
  ({ n, g }) => [`${n} brought ${g} home for the summer. ${g} now speaks to you in two languages and argues in both.`, `${n} yazın ${acc(g)} buraya getirdi. ${g} artık seninle iki dilde konuşuyor, iki dilde de itiraz ediyor.`],
  ({ g }) => [`${g} sent a drawing of you by post. You are very tall and next to an aeroplane.`, `${g} postayla senin resmini yolladı. Çok uzunsun ve bir uçağın yanındasın.`],
];

// ------------------------------------------------------------------ work, lottery, baby

/** Flag (year) of the last promotion earned by working extra hard. */
const WORK_HARD_PROMO = 'work_hard_promo';

const WORK_OFFICE: Pair[] = [
  ['You stayed late every night this month. Your boss nodded at you once.', 'Bu ay her gece mesaiye kaldın. Patronun sana bir kere başıyla selam verdi.'],
  ['You answered emails on a Sunday. Nobody noticed. Except your back.', 'Pazar günü e-postalara cevap verdin. Kimse fark etmedi. Belin hariç.'],
  ['You fixed a problem nobody else could. Someone else presented it.', 'Kimsenin çözemediği bir sorunu çözdün. Sunumu başkası yaptı.'],
  ['You became the person who knows where everything is. A blessing and a curse.', 'Her şeyin nerede olduğunu bilen kişi oldun. Hem nimet hem bela.'],
  ['You color-coded the shared calendar. Your colleagues fear and respect you.', 'Ortak takvimi renk renk düzenledin. İş arkadaşların senden hem korkuyor hem saygı duyuyor.'],
  ['You skipped lunch for a deadline. You made the deadline. The deadline did not say thank you.', 'Bir teslim tarihi için öğle yemeğini atladın. Yetiştirdin. Teslim tarihi teşekkür etmedi.'],
  ['You came in early all month. The cleaner now greets you as a colleague.', 'Bütün ay erkenden geldin. Temizlik görevlisi artık seni iş arkadaşı gibi selamlıyor.'],
  ['You volunteered for the project nobody wanted. Now it is your project. Nobody else wants it still.', 'Kimsenin istemediği projeye gönüllü oldun. Artık senin projen. Hâlâ başka kimse istemiyor.'],
  ['You stayed late for a meeting about why meetings run late.', 'Toplantıların neden uzadığı üzerine geç saatte bir toplantıya kaldın.'],
  ['You rewrote a report three times. The final version was the first one. Your boss loved it.', 'Bir raporu üç kez baştan yazdın. Son hâli ilk hâliydi. Patronun bayıldı.'],
  ['You trained the new hire. They are now faster than you. You are proud and a little worried.', 'Yeni gelen çalışanı yetiştirdin. Artık senden hızlı. Hem gururlusun hem biraz endişeli.'],
  ['You worked every weekend this month. Your laptop knows your face better than your neighbors do.', 'Bu ay bütün hafta sonları çalıştın. Dizüstü bilgisayarın yüzünü komşularından iyi tanıyor.'],
  ['You stayed so late that the motion-sensor lights gave up on you.', 'O kadar geç saate kadar kaldın ki hareket sensörlü ışıklar senden ümidi kesti.'],
  ['You got your inbox down to zero. It lasted eleven minutes. You took a screenshot.', 'Gelen kutunu sıfırladın. On bir dakika sürdü. Ekran görüntüsünü aldın.'],
  ['You worked through a cold instead of staying home. Half the office has it now. Teamwork.', 'Evde kalmak yerine soğuk algınlığıyla çalıştın. Ofisin yarısı da kaptı. Takım çalışması.'],
  ['You fixed the printer. Word spread. You are now the IT department.', 'Yazıcıyı tamir ettin. Haber yayıldı. Artık bilgi işlem departmanı sensin.'],
  ['You made a spreadsheet so beautiful that a colleague asked for a copy just to look at it.', 'O kadar güzel bir tablo hazırladın ki bir iş arkadaşın sırf bakmak için bir kopyasını istedi.'],
  ['You took work home every evening this month. Your sofa is now an office with cushions.', 'Bu ay her akşam eve iş götürdün. Kanepen artık minderli bir ofis.'],
  ['A client called with an impossible request. You made it possible, then lay on the floor for ten minutes.', 'Bir müşteri imkânsız bir istekle aradı. Sen imkânlı hâle getirdin, sonra on dakika yere uzandın.'],
  ['You prepared so well for a meeting that it was cancelled. You will use those slides one day.', 'Toplantıya o kadar iyi hazırlandın ki toplantı iptal oldu. O sunumu bir gün kullanacaksın.'],
  ['You ate lunch at your desk every day this month. The keyboard holds crumbs from three different sandwiches.', 'Bu ay her gün öğle yemeğini masanda yedin. Klavyede üç farklı sandviçin kırıntısı var.'],
  ['Your boss wrote "good job" in an email. Two words. You read them twenty times.', 'Patronun bir e-postada "Eline sağlık" yazdı. İki kelime. Yirmi kez okudun.'],
];

/** Farmers, fishers, soldiers, athletes, taxi drivers… */
const WORK_HANDS: Pair[] = [
  ['You took every extra shift going. You now sleep in your clothes, for efficiency.', 'Bulduğun her fazla mesaiyi aldın. Artık verimli olsun diye kıyafetlerinle uyuyorsun.'],
  ['You worked through a holiday. Someone brought you a plate of food and called you a hero.', 'Bayramda bile çalıştın. Biri sana bir tabak yemek getirip kahraman dedi.'],
  ['You started before sunrise all month. You have seen more dawns than most poets.', 'Bütün ay güneş doğmadan işe başladın. Çoğu şairden fazla şafak gördün.'],
  ['Your hands ache and your work has never been better. The two might be related.', 'Ellerin sızlıyor ve işin hiç bu kadar iyi olmamıştı. İkisi arasında bir bağ olabilir.'],
  ['You fixed someone else\'s mistake before anyone noticed. Nobody noticed. That was the point.', 'Başkasının hatasını kimse fark etmeden düzelttin. Kimse fark etmedi. Amaç da buydu.'],
  ['You worked so hard this month that your tools need a holiday.', 'Bu ay o kadar çok çalıştın ki aletlerinin tatile ihtiyacı var.'],
  ['You stayed late to finish properly instead of quickly. It shows.', 'Çabuk değil düzgün bitirmek için geç saate kadar kaldın. Belli oluyor.'],
  ['An old hand watched you work and said, "Not bad." From them, that is a medal.', 'Kıdemli biri seni çalışırken izledi ve "Fena değil" dedi. Ondan bu bir madalya sayılır.'],
  ['You skipped the tea break three days in a row. Your colleagues staged an intervention with biscuits.', 'Üç gün üst üste çay molasını atladın. Arkadaşların bisküviyle müdahale etti.'],
  ['You came home too tired to talk, proud of a long, honest day. Then another. Then another.', 'Eve konuşamayacak kadar yorgun ama uzun ve dürüst bir günün gururuyla döndün. Sonra bir gün daha. Bir gün daha.'],
  ['You did the work of two people this month. The second person was also you, slightly more tired.', 'Bu ay iki kişinin işini yaptın. İkinci kişi de sendin, biraz daha yorgun hâlin.'],
  ['You worked in the rain all week and did not complain once. Out loud.', 'Bütün hafta yağmurda çalıştın ve bir kez bile şikâyet etmedin. Sesli olarak.'],
  ['You taught a newcomer the tricks of the trade. By Friday they were calling you "the master".', 'Yeni gelen birine işin inceliklerini öğrettin. Cuma gününe kadar sana "usta" demeye başladı.'],
  ['You came in on your day off because something needed doing. Something always needs doing.', 'Bir işin yapılması gerektiği için izin gününde geldin. Hep yapılması gereken bir iş vardır.'],
  ['You beat your own record this month. Nobody else keeps track. You do.', 'Bu ay kendi rekorunu kırdın. Kimse takip etmiyor. Sen ediyorsun.'],
  ['You ate lunch standing up every day this week. Efficient, and bad for the soul.', 'Bu hafta her gün öğle yemeğini ayakta yedin. Verimli ama ruha zararlı.'],
];

const LOTTERY_LOSE: Pair[] = [
  ['You lost. The ticket is now a bookmark.', 'Kaybettin. Bilet artık kitap ayracı.'],
  ['Not a single matching number. Impressive, in a way.', 'Tek bir rakam bile tutmadı. Bir bakıma etkileyici.'],
  ['You lost, but you spent a lovely evening planning how to spend it.', 'Kaybettin ama parayı nasıl harcayacağını planlarken çok güzel bir akşam geçirdin.'],
  ['You lost. The cashier said "maybe next time" with the confidence of someone who says it every day.', 'Kaybettin. Kasiyer "Belki bir dahaki sefere" dedi; bunu her gün söyleyen birinin rahatlığıyla.'],
  ['You played your family\'s birthdays. Your family let you down.', 'Ailenin doğum günlerini oynadın. Ailen seni yüzüstü bıraktı.'],
  ['One number off. One. You will be thinking about that number for a week.', 'Bir rakamla kaçırdın. Tek bir rakamla. Bir hafta o rakamı düşüneceksin.'],
  ['You lost, but you were a millionaire for the whole ride home.', 'Kaybettin ama eve dönüş yolu boyunca milyonerdin.'],
  ['You checked the numbers four times. They did not change their minds.', 'Numaraları dört kez kontrol ettin. Fikirlerini değiştirmediler.'],
  ['You let a child pick the numbers for luck. The child has no luck.', 'Şans getirsin diye numaraları bir çocuğa seçtirdin. Çocuğun hiç şansı yokmuş.'],
  ['You lost. You had already promised half of it to a cousin, so that conversation will be awkward.', 'Kaybettin. Yarısını bir kuzenine çoktan söz vermiştin; o konuşma tuhaf olacak.'],
  ['Nothing. You wrote a shopping list on the back of the ticket. Small win.', 'Hiçbir şey çıkmadı. Biletin arkasına alışveriş listesi yazdın. Küçük bir zafer.'],
  ['You lost. Somewhere a stranger won, and you are genuinely happy for them. Mostly.', 'Kaybettin. Bir yerlerde bir yabancı kazandı; onun adına içtenlikle sevindin. Çoğunlukla.'],
];

const BABY_NOT_YET: ((n: string) => Pair)[] = [
  () => ['No baby news this year. Maybe next year.', 'Bu yıl bebek haberi yok. Belki seneye.'],
  (n) => [`No baby this year. ${n} says the spare room can stay a study a little longer.`, `Bu yıl bebek yok. ${n}, boş odanın bir süre daha çalışma odası kalabileceğini söylüyor.`],
  () => ['Not this year. You bought a tiny pair of socks anyway and hid them in a drawer.', 'Bu yıl olmadı. Yine de minicik bir çift çorap alıp çekmeceye sakladın.'],
  (n) => [`The test was negative again. ${n} made your favorite dinner and you talked about everything else.`, `Test yine negatif çıktı. ${n} en sevdiğin yemeği yaptı ve başka her şeyden konuştunuz.`],
  () => ['No luck this year. The doctor said to relax. Nothing is less relaxing than being told to relax.', 'Bu yıl şans yüzünüze gülmedi. Doktor rahat olun dedi. Rahat ol denmesinden daha gergin bir şey yok.'],
  (n) => [`No baby yet. You and ${n} took a holiday instead and tried not to count days.`, `Henüz bebek yok. ${wth(n)} tatile çıktınız ve günleri saymamaya çalıştınız.`],
  () => ['Not this year. A relative asked "So, when?" at dinner. You smiled very hard.', 'Bu yıl olmadı. Bir akraba sofrada "Eee, ne zaman?" diye sordu. Çok sıkı gülümsedin.'],
  (n) => [`Still no baby. ${n} said, "We have time." You held on to that.`, `Hâlâ bebek yok. ${n} "Vaktimiz var" dedi. Sen de buna tutundun.`],
  () => ['No news this year. You looked at baby names anyway, "just for later".', 'Bu yıl haber yok. Yine de bebek isimlerine baktın, "ileride lazım olur" diye.'],
  () => ["Nothing yet. The neighbors' baby waved at you from the balcony. You waved back for a long time.", 'Henüz bir şey yok. Komşunun bebeği balkondan sana el salladı. Uzun uzun el salladın.'],
];

// ------------------------------------------------------------------ toddlers (1–5)

interface ParentNear {
  k: string; // "mom" / "annen"
  withK: string; // "annenle"
  datK: string; // "annene"
  his: string;
}

/** A living parent for the toddler activities, rotating by year (no rng). */
function nearParent(c: Ctx): { person: Person; x: ParentNear } | undefined {
  const ps = c.h.relatives(['mother', 'father']);
  if (!ps.length) return undefined;
  const r = ps[c.s.year % ps.length];
  const mom = r.rel.kind === 'mother';
  return {
    person: r.person,
    x: {
      k: kin(c, r.person, r.rel.kind),
      withK: mom ? 'annenle' : 'babanla',
      datK: mom ? 'annene' : 'babana',
      his: c.h.his(r.person),
    },
  };
}

const TODDLER_BLOCKS: Pair[] = [
  ['You built a tower of blocks as tall as your knee, then knocked it down. Best day ever.', 'Dizine kadar boyunda bir blok kulesi yaptın, sonra yıktın. Hayatının en güzel günü.'],
  ['You put every red block in a row. Nobody knows why. You know why.', 'Bütün kırmızı blokları yan yana dizdin. Kimse nedenini bilmiyor. Sen biliyorsun.'],
  ['You built a house for your teddy. The teddy seemed pleased.', 'Oyuncak ayına bloklardan bir ev yaptın. Ayıcık memnun göründü.'],
  ['You built a bridge for a toy car. The car fell off. You built a better bridge.', 'Oyuncak araba için bir köprü yaptın. Araba düştü. Daha iyi bir köprü yaptın.'],
  ['You stacked three blocks, then four, then five. Everyone clapped. You clapped too.', 'Üç blok üst üste koydun, sonra dört, sonra beş. Herkes alkışladı. Sen de alkışladın.'],
  ['You built a wall across the living room. Grown-ups now need a password.', 'Salonun ortasına bloklardan bir duvar ördün. Büyüklerin geçmesi için artık şifre lazım.'],
  ['You sorted the blocks by color, then by size, then threw them all in the box. Done.', 'Blokları önce renklerine, sonra boylarına göre ayırdın, sonra hepsini kutuya attın. Bitti.'],
  ['A block rolled under the sofa. You told everyone about it all day.', 'Bir blok kanepenin altına kaçtı. Bütün gün herkese bunu anlattın.'],
  ['You built a tall tower and guarded it from everyone, including your own feet.', 'Yüksek bir kule yaptın ve onu herkesten, hatta kendi ayaklarından korudun.'],
  ['You made a castle with a door. The door is a missing block. Very modern.', 'Kapısı olan bir şato yaptın. Kapı dediğin, eksik bir blok. Çok modern.'],
];

const TODDLER_PLAYGROUND: Pair[] = [
  ['You went down the slide forty times. You would have done forty more.', 'Kaydıraktan kırk kez kaydın. Kırk kez daha kayardın.'],
  ["You made a friend in the sandpit. You never learned each other's names. Best friends.", 'Kum havuzunda bir arkadaş edindin. Birbirinizin adını hiç öğrenmediniz. En iyi arkadaşsınız.'],
  ['You shouted "higher!" on the swings until the grown-up\'s arms gave out.', 'Salıncakta, sallayan büyüğün kolları yorulana kadar "Daha yüksek!" diye bağırdın.'],
  ['You found a stick. It was the best stick. You took it home.', 'Bir dal buldun. En güzel dal oydu. Eve götürdün.'],
  ['You made a sand cake and served it to everyone. Nobody ate it, but everyone said "yum".', 'Kumdan bir pasta yapıp herkese ikram ettin. Kimse yemedi ama herkes "Mmm" dedi.'],
  ['You chased the pigeons. The pigeons did not mind. They are professionals.', 'Güvercinleri kovaladın. Güvercinler aldırmadı. Profesyoneller.'],
  ['You climbed the little climbing frame all by yourself and waved at everyone from the top.', 'Küçük tırmanma oyuncağına tek başına tırmandın ve tepeden herkese el salladın.'],
  ['You fell over, looked around to see if it hurt, and decided it did not. Brave.', 'Düştün, canının yanıp yanmadığını anlamak için etrafa bakındın ve yanmadığına karar verdin. Cesur.'],
  ['You refused to leave the playground and were carried out like a sack of potatoes, waving.', 'Parktan çıkmayı reddettin. Patates çuvalı gibi taşınarak, el sallayarak çıkarıldın.'],
  ['You rode the seesaw with a bigger kid and spent most of it in the air. Wonderful.', 'Tahterevallide senden büyük bir çocukla oynadın ve çoğu zaman havada kaldın. Harika.'],
];

const TODDLER_SONGS: ((x: ParentNear) => Pair)[] = [
  ({ k, withK }) => [`You and your ${k} sang the animal song. You did all the animal noises, twice.`, `${cap(withK)} hayvanlar şarkısını söylediniz. Bütün hayvan seslerini sen yaptın, hem de iki kez.`],
  ({ k, his }) => [`Your ${k} sang you a song from ${his} own childhood. You demanded it nine more times.`, `${cap(k)} sana kendi çocukluğundan bir şarkı söyledi. Dokuz kez daha istedin.`],
  ({ k, withK }) => [`You and your ${k} sang in the bath. The neighbors heard. Now they know all the words too.`, `${cap(withK)} banyoda şarkı söylediniz. Komşular duydu. Artık onlar da bütün sözleri biliyor.`],
  ({ k }) => [`You sang a song you made up about a sock. Your ${k} called it a masterpiece.`, `Bir çorap hakkında kendi uydurduğun bir şarkı söyledin. ${cap(k)} buna başyapıt dedi.`],
  ({ k, withK }) => [`You and your ${k} did the clapping song. You clapped in all the wrong places and it was perfect.`, `${cap(withK)} el çırpma şarkısını söylediniz. Hep yanlış yerlerde el çırptın ve mükemmeldi.`],
  ({ k }) => [`Your ${k} sang the bus song and you did the wheels. Round and round, for an hour.`, `${cap(k)} otobüs şarkısını söyledi, sen de tekerlekleri yaptın. Bir saat boyunca dönüp durdunuz.`],
  ({ k }) => [`You danced while your ${k} sang. You fell over twice, on purpose, for the applause.`, `${cap(k)} şarkı söylerken dans ettin. Alkış için iki kez bilerek düştün.`],
  ({ k, withK }) => [`You and your ${k} sang the counting song. You got to seven and declared it finished.`, `${cap(withK)} sayı şarkısını söylediniz. Yediye kadar sayıp şarkının bittiğini ilan ettin.`],
  ({ k }) => [`Your ${k} sang you to sleep. You fought it bravely for one whole verse.`, `${cap(k)} şarkı söyleyerek seni uyuttu. Koca bir kıta boyunca kahramanca direndin.`],
  ({ k }) => [`You sang loudly at the shops. Your ${k} pretended not to know you, then joined in.`, `Markette yüksek sesle şarkı söyledin. ${cap(k)} önce seni tanımıyormuş gibi yaptı, sonra o da katıldı.`],
];

const TODDLER_STORY: ((x: ParentNear) => Pair)[] = [
  ({ k }) => [`Your ${k} read you a story about a bear who could not sleep. You fell asleep on page two.`, `${cap(k)} sana uyuyamayan bir ayının hikâyesini okudu. İkinci sayfada uyudun.`],
  ({ k }) => [`You chose the same book as yesterday. And the day before. Your ${k} knows it by heart now.`, `Dünkü kitabın aynısını seçtin. Önceki günkünü de. ${cap(k)} artık ezbere biliyor.`],
  ({ k }) => [`Your ${k} did a different voice for every animal. You laughed so much you got hiccups.`, `${cap(k)} her hayvan için başka bir ses yaptı. O kadar güldün ki hıçkırık tuttu.`],
  ({ k, datK }) => [`You "read" a story to your ${k} from the pictures. The plot was very original.`, `Resimlere bakarak ${datK} bir masal "okudun". Konusu çok özgündü.`],
  ({ k }) => [`Your ${k} tried to skip a page. You noticed. You always notice.`, `${cap(k)} bir sayfayı atlamaya çalıştı. Fark ettin. Hep fark edersin.`],
  ({ k }) => [`Your ${k} told a story about a dragon who was scared of the dark. You said the dragon could sleep in your bed.`, `${cap(k)} karanlıktan korkan bir ejderhanın hikâyesini anlattı. Ejderhanın senin yatağında uyuyabileceğini söyledin.`],
  ({ k }) => [`One more story. And one more. Your ${k} fell asleep before you did.`, `Bir masal daha. Bir tane daha. ${cap(k)} senden önce uyudu.`],
  ({ k }) => [`Your ${k} made up a story where you were the hero. You saved the town from a giant spoon.`, `${cap(k)} kahramanı sen olan bir masal uydurdu. Kasabayı dev bir kaşıktan kurtardın.`],
  ({ k, withK }) => [`You and your ${k} read a book about the moon, then looked at the real one through the window.`, `${cap(withK)} ay hakkında bir kitap okudunuz, sonra pencereden gerçeğine baktınız.`],
  ({ k }) => [`Your ${k} read a story with a sad part. You were very brave and only cried a little.`, `${cap(k)} sana içinde üzücü bir yer olan bir masal okudu. Çok cesurdun, sadece birazcık ağladın.`],
];

/** The prison pools, for tests. */
export const PRISON_LINES: Record<string, readonly Pair[]> = { gym: GYM_JAIL, library: LIB_JAIL, meditate: MEDITATE_JAIL, doctor: DOC_JAIL };

// ------------------------------------------------------------------ helpers

function partnerBucket(c: Ctx, kind: string, sinceYear: number, partnerAge: number): 'new' | 'married' | 'long' {
  if (kind !== 'spouse') return 'new';
  const years = c.s.year - sinceYear;
  if (years >= 25 || (years >= 10 && c.age >= 65 && partnerAge >= 60)) return 'long';
  return 'married';
}

type KidBucket = 'baby' | 'school' | 'teen' | 'adult' | 'grand';
const kidBucket = (age: number): KidBucket => (age < 5 ? 'baby' : age < 13 ? 'school' : age < 18 ? 'teen' : 'adult');
const KID_LINES: Record<KidBucket, ((x: KidX) => Pair)[]> = {
  baby: KIDS_BABY,
  school: KIDS_SCHOOL,
  teen: KIDS_TEEN,
  adult: KIDS_ADULT,
  grand: KIDS_GRAND,
};

export const baseActivities: ActivityDef[] = [
  // ------------------------------------------------ Mind & Body
  {
    id: 'gym',
    label: (c) => (inPrison(c) ? c.t('Work out in the yard', 'Havalandırmada spor yap') : c.t('Go to the gym', 'Spor salonuna git')),
    description: (c) => c.t('+Health, +Looks', '+Sağlık, +Görünüş'),
    group: 'Mind & Body',
    minAge: 12,
    perYear: 2,
    jailOk: true,
    run: (c) => {
      const jail = inPrison(c);
      const senior = c.age >= 65;
      if (c.rng.chance(0.06)) {
        c.h.stat('health', -4);
        if (jail)
          return c.t('You twisted an ankle on the uneven yard. The infirmary gave you an aspirin and a shrug.', 'Havalandırmanın bozuk zemininde ayak bileğini burktun. Revirde bir aspirin ve bir omuz silkme verdiler.');
        if (senior) return say(c, 'gym.hurt.senior', GYM_HURT_SENIOR);
        return say(c, 'gym.hurt', GYM_HURT);
      }
      c.h.stat('health', c.rng.int(3, 6));
      c.h.stat('looks', 1);
      if (jail) return say(c, 'gym.jail', GYM_JAIL);
      if (c.age < 18) return say(c, 'gym.teen', GYM_TEEN);
      if (senior) return say(c, 'gym.senior', GYM_SENIOR);
      return say(c, 'gym.adult', GYM_ADULT);
    },
  },
  {
    id: 'library',
    label: (c) => (inPrison(c) ? c.t('Read in the prison library', 'Cezaevi kütüphanesinde oku') : c.t('Read at the library', 'Kütüphanede kitap oku')),
    description: (c) => c.t('+Smarts', '+Zekâ'),
    group: 'Mind & Body',
    minAge: 6,
    perYear: 2,
    jailOk: true,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 4));
      if (inPrison(c)) return say(c, 'library.jail', LIB_JAIL);
      if (c.age < 12) return say(c, 'library.kid', LIB_KID);
      if (c.age < 18) return say(c, 'library.teen', LIB_TEEN);
      if (c.age >= 65) return say(c, 'library.senior', LIB_SENIOR);
      return say(c, 'library', LIB_GEN);
    },
  },
  {
    id: 'meditate',
    label: (c) => c.t('Meditate', 'Meditasyon yap'),
    description: (c) => c.t('+Happiness', '+Mutluluk'),
    group: 'Mind & Body',
    minAge: 10,
    jailOk: true,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 8));
      if (inPrison(c)) return say(c, 'meditate.jail', MEDITATE_JAIL);
      return say(c, 'meditate', MEDITATE);
    },
  },
  {
    id: 'doctor',
    label: (c) => (inPrison(c) ? c.t('Visit the infirmary', 'Revire çık') : c.t('See a doctor', 'Doktora görün')),
    description: (c) => c.t('+Health', '+Sağlık'),
    group: 'Mind & Body',
    minAge: 0,
    jailOk: true,
    run: (c) => {
      const jail = inPrison(c);
      if (c.age >= 18 && !jail) c.h.money(-wage(c, 300));
      c.h.stat('health', c.rng.int(6, 12));
      if (jail) return say(c, 'doctor.jail', DOC_JAIL);
      if (c.age < 3) return say(c, 'doctor.baby', DOC_BABY);
      if (c.age < 6) return say(c, 'doctor.little', DOC_LITTLE);
      if (c.age < 18) return say(c, 'doctor.kid', DOC_KID);
      if (c.age < 65) return say(c, 'doctor.adult', DOC_ADULT);
      return say(c, 'doctor.elder', DOC_ELDER);
    },
  },
  {
    id: 'salon',
    label: (c) => c.t('Get a makeover', 'Tarzını yenile'),
    description: (c) => c.t('+Looks', '+Görünüş'),
    group: 'Mind & Body',
    minAge: 14,
    jailOk: false,
    run: (c) => {
      c.h.money(-wage(c, 120));
      c.h.stat('looks', c.rng.int(3, 6));
      return say(c, 'salon', SALON);
    },
  },

  // ------------------------------------------------ Toddlers (1–5)
  {
    id: 'toddler_blocks',
    label: (c) => c.t('Play with blocks', 'Bloklarla oyna'),
    description: (c) => c.t('+Smarts, +Happiness', '+Zekâ, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 1,
    maxAge: 5,
    jailOk: false,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(1, 2));
      c.h.stat('happiness', 2);
      return say(c, 'toddler_blocks', TODDLER_BLOCKS);
    },
  },
  {
    id: 'toddler_playground',
    label: (c) => c.t('Go to the playground', 'Parka git'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 1,
    maxAge: 5,
    jailOk: false,
    run: (c) => {
      c.h.stat('health', 2);
      c.h.stat('happiness', 3);
      return say(c, 'toddler_playground', TODDLER_PLAYGROUND);
    },
  },
  {
    id: 'toddler_songs',
    label: (c) => c.t('Sing songs together', 'Birlikte şarkı söyle'),
    description: (c) => c.t('+Happiness, +Family closeness', '+Mutluluk, +Aile bağı'),
    group: 'Family',
    minAge: 1,
    maxAge: 5,
    jailOk: false,
    hideWhenUnavailable: true,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    run: (c) => {
      const par = nearParent(c)!;
      c.h.closeness(par.person.id, 4);
      c.h.stat('happiness', 3);
      return sayWith(c, 'toddler_songs', TODDLER_SONGS, par.x);
    },
  },
  {
    id: 'toddler_story',
    label: (c) => c.t('Ask for a bedtime story', 'Uyku masalı iste'),
    description: (c) => c.t('+Smarts, +Family closeness', '+Zekâ, +Aile bağı'),
    group: 'Family',
    minAge: 1,
    maxAge: 5,
    jailOk: false,
    hideWhenUnavailable: true,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    run: (c) => {
      const par = nearParent(c)!;
      c.h.closeness(par.person.id, 4);
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      return sayWith(c, 'toddler_story', TODDLER_STORY, par.x);
    },
  },

  // ------------------------------------------------ Love
  {
    id: 'date',
    label: (c) => c.t('Go on a date', 'Randevuya çık'),
    description: (c) => c.t('Meet someone new', 'Yeni biriyle tanış'),
    group: 'Love',
    minAge: 16,
    available: (c) => single(c) && c.p.jailYears === 0,
    run: () => ({ event: 'base.date_match' }),
  },
  {
    id: 'partner_time',
    label: (c) => c.t('Spend time with your partner', 'Sevdiğinle vakit geçir'),
    description: (c) => c.t('+Love', '+Aşk'),
    group: 'Love',
    minAge: 16,
    jailOk: false,
    available: (c) => !!c.h.partner(),
    run: (c) => {
      const p = c.h.partner()!;
      c.h.closeness(p.person.id, 8);
      c.h.stat('happiness', 3);
      const bucket = partnerBucket(c, p.rel.kind, p.rel.sinceYear, c.h.ageOf(p.person));
      const x: PartnerX = { n: p.person.firstName, his: c.h.his(p.person), city: c.p.city, cityTr: cityTr(c), coastal: coastal(c) };
      const lines = bucket === 'new' ? PARTNER_NEW : bucket === 'married' ? PARTNER_MARRIED : PARTNER_LONG;
      return sayWith(c, `partner_time.${bucket}`, lines, x);
    },
  },
  {
    id: 'propose',
    label: (c) => c.t('Propose', 'Evlenme teklif et'),
    description: (c) => c.t('Ask your partner to marry you', 'Diz çök, yüzüğü çıkar'),
    group: 'Love',
    minAge: 18,
    available: (c) => c.h.relatives('partner').length > 0 && c.s.year - c.h.relatives('partner')[0].rel.sinceYear >= 1,
    run: () => ({ event: 'base.proposal' }),
  },
  {
    id: 'baby',
    label: (c) => c.t('Try for a baby', 'Bebek yapmayı dene'),
    description: (c) => c.t('Grow the family', 'Aileyi büyüt'),
    group: 'Love',
    minAge: 20,
    maxAge: 55,
    available: (c) => {
      const p = c.h.partner();
      if (!p) return false;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      return (c.p.gender === 'female' || p.person.gender === 'female') && herAge <= 45;
    },
    run: (c) => {
      const p = c.h.partner()!;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      if (c.rng.chance(herAge < 35 ? 0.6 : 0.35)) return { event: 'base.baby_name' };
      return sayWith(c, 'baby', BABY_NOT_YET, p.person.firstName);
    },
  },

  // ------------------------------------------------ Family
  {
    id: 'call_parents',
    label: (c) => c.t('Call your parents', 'Anneni babanı ara'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 8,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    run: (c) => {
      const ps = c.h.relatives(['mother', 'father']);
      ps.forEach((r) => c.h.closeness(r.person.id, 6));
      // the parent on the line alternates by year (no rng)
      const r = ps[c.s.year % ps.length];
      const x: ParentX = {
        k: kin(c, r.person, r.rel.kind),
        accK: r.rel.kind === 'mother' ? 'anneni' : 'babanı',
        n: r.person.firstName,
        obj: him(r.person),
        age: c.age,
      };
      if (c.age < 18) return sayWith(c, 'call_parents.minor', PARENTS_MINOR, x);
      if (c.h.ageOf(r.person) >= 75) return sayWith(c, 'call_parents.old', PARENTS_OLD, x);
      return sayWith(c, 'call_parents', PARENTS_ADULT, x);
    },
  },
  {
    id: 'siblings',
    label: (c) => c.t('Hang out with siblings', 'Kardeşlerinle takıl'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 6,
    available: (c) => c.h.relatives('sibling').length > 0,
    run: (c) => {
      const s = c.rng.pick(c.h.relatives('sibling'));
      c.h.closeness(s.person.id, 8);
      c.h.stat('happiness', 2);
      const x: SibX = { k: kin(c, s.person, 'sibling'), n: s.person.firstName };
      if (c.age < 13) return sayWith(c, 'siblings.kid', SIBS_KID, x);
      if (c.age < 60) return sayWith(c, 'siblings', SIBS_GROWN, x);
      return sayWith(c, 'siblings.old', SIBS_OLD, x);
    },
  },
  {
    id: 'kids',
    label: (c) => c.t('Spend time with your kids', 'Çocuklarınla vakit geçir'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 18,
    available: (c) => c.h.relatives('child').length > 0,
    run: (c) => {
      const kids = c.h.relatives('child');
      kids.forEach((k) => c.h.closeness(k.person.id, 6));
      c.h.stat('happiness', 4);
      // lines follow the youngest child's age: toddlers, school kids, teens, grown-ups (with grandkids)
      const youngest = Math.min(...kids.map((k) => c.h.ageOf(k.person)));
      let bucket: KidBucket = kidBucket(youngest);
      const pool = kids.filter((k) => kidBucket(c.h.ageOf(k.person)) === bucket);
      let g = '';
      if (bucket === 'adult') {
        const gk = grandkids(c).find((x) => gkAge(c, x) >= 3 && gkAge(c, x) <= 14);
        if (gk) {
          bucket = 'grand';
          g = gk.n;
        }
      }
      // whose turn: the grandchild's parent in the grand bucket, otherwise rotate by year (no rng)
      const gkParent = bucket === 'grand' ? pool.find((k) => grandkids(c).some((x) => x.n === g && x.p === k.person.id)) : undefined;
      const child = (gkParent ?? pool[c.s.year % pool.length]).person;
      const away = isAbroad(c, child.id);
      const awayIdx = (c.p.ext?.abroad as Record<string, number> | undefined)?.[child.id] ?? 0;
      const x: KidX = {
        awayEn: (ABROAD_CITIES[awayIdx] ?? ABROAD_CITIES[0])[0],
        awayTr: (ABROAD_CITIES[awayIdx] ?? ABROAD_CITIES[0])[1],
        n: child.firstName,
        his: c.h.his(child),
        he: c.h.he(child),
        age: c.h.ageOf(child),
        coastal: coastal(c),
        parentEn: c.p.gender === 'female' ? 'Mama' : 'Dada',
        parentTr: c.p.gender === 'female' ? 'Anne' : 'Baba',
        g,
      };
      // an emigrated child calls, sends parcels and flies home in summer; still one rng call
      if (away) return bucket === 'grand' ? sayWith(c, 'kids.abroad.grand', KIDS_ABROAD_GRAND, x) : sayWith(c, 'kids.abroad', KIDS_ABROAD, x);
      return sayWith(c, `kids.${bucket}`, KID_LINES[bucket], x);
    },
  },

  // ------------------------------------------------ Career
  {
    id: 'job_search',
    label: (c) => c.t('Look for a job', 'İş ara'),
    description: (c) => c.t('Browse job listings', 'İş ilanlarına göz at'),
    group: 'Career',
    minAge: 16,
    maxAge: MAX_HIRE_AGE,
    available: (c) => c.p.jailYears === 0 && !c.p.retired && c.p.school !== 'primary',
    run: () => ({ event: 'base.job_search' }),
  },
  {
    id: 'work_hard',
    label: (c) => c.t('Work extra hard', 'Canını dişine tak'),
    description: (c) => c.t('Better promotion odds, −Health', 'Terfi şansı artar, −Sağlık'),
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      c.h.stat('health', -2);
      // hard work earns at most one promotion every four years, and only after two years in the job
      const last = c.p.flags[WORK_HARD_PROMO];
      const ready = c.p.jobYears >= 2 && (last === undefined || c.s.year - last >= 4);
      if (c.rng.chance(0.12 + c.p.stats.smarts / 600) && ready && c.h.promote()) {
        c.h.flag(WORK_HARD_PROMO);
        c.h.stat('happiness', 6);
        return c.t(
          `Your hard work paid off. You were promoted to ${c.h.jobTitle()}!`,
          `Emeklerin karşılıksız kalmadı. ${c.h.jobTitle()} pozisyonuna terfi ettin!`,
        );
      }
      return officeJob(c) ? say(c, 'work_hard', WORK_OFFICE) : say(c, 'work_hard.hands', WORK_HANDS);
    },
  },
  {
    id: 'university',
    label: (c) => c.t('Go to university', 'Üniversiteye git'),
    description: (c) => c.t('A 4-year degree', '4 yıllık lisans'),
    group: 'Career',
    minAge: 18,
    maxAge: 45,
    // a professional footballer trains full time: no full-time degree alongside it
    available: (c) => c.p.education === 'highschool' && c.p.school === null && c.p.jailYears === 0 && c.p.jobId !== 'athlete',
    run: (c) => {
      c.p.school = 'university';
      c.p.schoolYears = 0;
      if (c.p.stats.smarts >= 80) {
        c.h.flag('scholarship');
        return c.t('You enrolled at university with a scholarship.', 'Üniversiteye burslu kaydoldun.');
      }
      return c.t('You enrolled at university. Back to cheap noodles.', 'Üniversiteye kaydoldun. Yeniden hazır noodle günlerine dönüş.');
    },
  },
  {
    id: 'quit',
    label: (c) => c.t('Quit your job', 'İstifa et'),
    description: (c) => c.t('Walk out', 'Kapıyı çarpıp çık'),
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.h.setJob(null);
      c.h.stat('happiness', 4);
      return c.t(
        `You quit your job as ${title}. It felt amazing for about a day.`,
        `${title} olarak çalıştığın işten istifa ettin. Yaklaşık bir gün boyunca harika hissettirdi.`,
      );
    },
  },
  {
    id: 'retire',
    label: (c) => c.t('Retire', 'Emekli ol'),
    description: (c) => c.t('Live on your pension', 'Emekli maaşıyla yaşa'),
    group: 'Career',
    minAge: 60,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.p.retired = true;
      c.p.jobId = null;
      c.p.jobTitle = title;
      c.h.stat('happiness', 8);
      return c.t(`You retired as ${title}.`, `${title} olarak emekli oldun.`);
    },
  },

  // ------------------------------------------------ Money
  // buying, selling and moving homes live in activities-home.ts (home_search, home_sell, home_renovate)
  {
    id: 'lottery',
    label: (c) => c.t('Buy a lottery ticket', 'Piyango bileti al'),
    description: (c) => c.t('Feeling lucky?', 'Şansına güveniyor musun?'),
    group: 'Money',
    minAge: 18,
    perYear: 3,
    run: (c) => {
      c.h.money(-wage(c, 5));
      if (c.rng.chance(1 / 4000)) {
        const prize = wage(c, 1_000_000);
        c.h.money(prize);
        c.h.achieve('jackpot');
        return c.t(`YOU WON THE JACKPOT! ${c.h.fmt(prize)}!`, `BÜYÜK İKRAMİYE ÇIKTI! ${c.h.fmt(prize)}!`);
      }
      if (c.rng.chance(1 / 40)) {
        c.h.money(wage(c, 300));
        return c.t('You won a small prize. Enough for a nice dinner.', 'Küçük bir ikramiye çıktı. Güzel bir akşam yemeğine yeter.');
      }
      return say(c, 'lottery', LOTTERY_LOSE);
    },
  },
];
