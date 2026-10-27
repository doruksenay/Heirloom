import type { EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';
import { atUni, bumpGpa, free, inGrad, peekCampus } from './state';

// More Campus moments: the small, funny and stressful parts of student life. Quick events (base/quick-event.ts): no rng,
// so nobody's seed shifts. Every event keeps at least one free option. GPA moves through `apply` (bumpGpa).

const S = { category: 'school' } as const;
const onCampus = (c: Parameters<NonNullable<QuickEvent['when']>>[0]) => atUni(c) && free(c);
const gradStudent = (c: Parameters<NonNullable<QuickEvent['when']>>[0]) => inGrad(c) && free(c);
const U: [number, number] = [18, 30];

const MORE: QuickEvent[] = [
  {
    ...S, id: 'campus.library_ghost', ages: U, once: true, when: onCampus,
    title: ['People say the library basement is haunted.', 'Kütüphanenin bodrumunun perili olduğu söyleniyor.'],
    text: ['A third-year swears a shelf moves by itself after midnight. You need a quiet place to study. This is, apparently, the quietest.', 'Üçüncü sınıftan biri gece yarısından sonra bir rafın kendi kendine kıpırdadığına yemin ediyor. Sessiz bir çalışma yerine ihtiyacın var. Görünüşe göre en sessizi burası.'],
    options: [
      { id: 'stay', label: ['Study there anyway', 'Yine de orada çalış'], stats: { smarts: 2, happiness: -1 }, apply: (c) => bumpGpa(c, 0.08), tone: 'good', result: ['At 1 a.m. the shelf did move. It turned out to be a very tired librarian, pushing a trolley. You now have a friend and an excellent seat.', 'Gece birde raf gerçekten kıpırdadı. Çok yorgun bir kütüphaneci ve bir arabaydı. Artık bir arkadaşın ve mükemmel bir koltuğun var.'] },
      { id: 'upstairs', label: ['Study upstairs, in the noise', 'Yukarıda, gürültüde çalış'], stats: { happiness: 1 }, result: ['You read the same paragraph nine times and learned an impressive amount about other people’s weekends.', 'Aynı paragrafı dokuz kez okudun ve başkalarının hafta sonları hakkında etkileyici miktarda şey öğrendin.'] },
    ],
  },
  {
    ...S, id: 'campus.dorm_cooking', ages: U, cooldown: 6, light: true, when: onCampus,
    title: ['It is your turn to cook for the whole corridor.', 'Bütün koridor için yemek yapma sırası sende.'],
    text: ['Nine people, one hob, three pans. You have exactly one recipe, and it is pasta.', 'Dokuz kişi, bir ocak, üç tava. Tek bir tarifin var, o da makarna.'],
    options: [
      { id: 'brave', label: ['Try something ambitious', 'İddialı bir şey dene'], usd: -25, stats: { happiness: 4, smarts: 1 }, tone: 'good', result: ['It was a curry from your grandmother’s notebook. The corridor fell silent, then asked for seconds. A boy from the next floor proposed on the spot, jokingly, you think.', 'Büyükannenin defterinden bir köriydi. Koridor sustu, sonra ikinci porsiyon istedi. Alt kattan bir çocuk anında evlenme teklif etti, şaka olarak, sanırız.'] },
      { id: 'pasta', label: ['Make the pasta, with great confidence', 'Makarnayı büyük bir özgüvenle yap'], stats: { happiness: 2 }, result: ['The pasta was fine. Your confidence was excellent. You were thanked warmly by people who had expected much worse.', 'Makarna idare ederdi. Özgüvenin mükemmeldi. Çok daha kötüsünü bekleyen insanlar sana sıcak bir şekilde teşekkür etti.'] },
    ],
  },
  {
    ...S, id: 'campus.group_project', ages: U, cooldown: 5, when: onCampus,
    title: ['A group project: four people, one grade, one doer.', 'Grup ödevi: dört kişi, tek not, tek çalışan.'],
    text: ['One member sends memes. One has “a lot on”. One is brilliant and invisible. The deadline is Friday.', 'Bir üye meme gönderiyor. Biri “çok işi var”. Biri parlak ve görünmez. Son tarih cuma.'],
    options: [
      { id: 'lead', label: ['Take charge, split it fairly, chase everyone', 'Liderliği al, adil böl, herkesin peşinden koş'], stats: { smarts: 2, happiness: -2 }, apply: (c) => bumpGpa(c, 0.1), tone: 'good', result: ['A shared document, three reminders and one very polite threat. The final result was good. The meme-sender, to everyone’s surprise, did the slides well.', 'Ortak bir belge, üç hatırlatma ve çok kibar bir tehdit. Sonuç iyiydi. Meme gönderen, herkesin şaşkınlığına, slaytları iyi yaptı.'] },
      { id: 'alone', label: ['Do it all yourself, quickly', 'Hepsini kendin, hızlıca yap'], stats: { happiness: -3, smarts: 1 }, apply: (c) => bumpGpa(c, 0.05), result: ['You wrote the whole thing in a night. It was good, and you were bitter about it for a month, which was also good, in its way.', 'Hepsini bir gecede yazdın. İyiydi ve bir ay boyunca buna içerledin; bu da kendince iyiydi.'] },
    ],
  },
  {
    ...S, id: 'campus.midterm_panic', ages: U, cooldown: 4, when: onCampus,
    title: ['Your midterm is tomorrow, and you have studied the wrong chapter.', 'Vizen yarın ve yanlış bölümü çalışmışsın.'],
    text: ['A friend breaks the news at 11 p.m. in the voice of someone describing a car accident they were nearby for.', 'Bir arkadaş haberi gece on birde, yakınında olduğu bir kazayı anlatan birinin sesiyle veriyor.'],
    options: [
      { id: 'night', label: ['Learn the right chapter overnight', 'Doğru bölümü bir gecede öğren'], stats: { health: -3, smarts: 2 }, apply: (c) => bumpGpa(c, 0.08), result: ['Six coffees, one friend with perfect notes and a sunrise. You passed with a mark that did not deserve the amount of suffering behind it.', 'Altı kahve, mükemmel notları olan bir arkadaş ve bir gün doğumu. Arkasındaki acıyı hak etmeyen bir notla geçtin.'] },
      { id: 'sleep', label: ['Sleep, and hope for the best', 'Uyu ve en iyisini um'], stats: { happiness: 2 }, apply: (c) => bumpGpa(c, -0.12), tone: 'bad', result: ['You slept deeply, which was the best part of the next 24 hours. The paper asked, mostly, about the other chapter.', 'Derin uyudun; sonraki 24 saatin en güzel kısmıydı. Sınav çoğunlukla öbür bölümü soruyordu.'] },
    ],
  },
  {
    ...S, id: 'campus.tuition', ages: U, once: true, when: onCampus,
    title: ['A letter: tuition is going up next year.', 'Bir mektup: harç gelecek yıl artıyor.'],
    text: ['By an amount that suggests someone has discovered how much students will pay. The student union calls a meeting.', 'Öğrencilerin ne kadar ödeyeceğini biri keşfetmiş gibi bir miktarla. Öğrenci birliği toplantı çağrısı yapıyor.'],
    options: [
      { id: 'protest', label: ['Join the protest outside the rectorate', 'Rektörlük önündeki eyleme katıl'], stats: { happiness: 3, smarts: 1 }, tone: 'good', result: ['A thousand students, a megaphone that kept cutting out and a banner with a spelling mistake. The increase was halved. The banner became a legend.', 'Bin öğrenci, sürekli kesilen bir megafon ve yazım hatalı bir pankart. Zam yarıya indi. Pankart efsane oldu.'] },
      { id: 'work', label: ['Take extra shifts at the café', 'Kafede ekstra mesai al'], usd: 400, stats: { health: -1, happiness: -1 }, result: ['You pulled thirty extra hours, learned the true meaning of the word “oat-milk” and paid the new fee. It is a grown-up sort of victory.', 'Otuz ek saat çalıştın, “yulaf sütü” kelimesinin gerçek anlamını öğrendin ve yeni harcı ödedin. Yetişkin türünden bir zafer.'] },
    ],
  },
  {
    ...S, id: 'campus.hackathon', ages: [18, 28], once: true, when: onCampus,
    title: ['A 36-hour hackathon is announced.', '36 saatlik bir hackathon duyuruldu.'],
    text: ['Free pizza, a prize, and a team in search of a fourth member. “Anyone can come,” says the poster. “Even you,” says your friend.', 'Bedava pizza, bir ödül ve dördüncü üyesini arayan bir takım. Afiş “herkes gelebilir” diyor. Arkadaşın “sen bile” diyor.'],
    options: [
      { id: 'join', label: ['Join the team and stay awake', 'Takıma katıl ve uyanık kal'], stats: { smarts: 3, health: -2, happiness: 4 }, apply: (c) => bumpGpa(c, 0.04), tone: 'good', result: ['At hour 29, the demo broke. At hour 33, it worked, without explanation. You came second and won a monitor. Your team is now a group chat that never sleeps.', '29. saatte demo bozuldu. 33. saatte açıklamasız çalıştı. İkinci oldun ve bir monitör kazandın. Takımın artık hiç uyumayan bir grup.'] },
      { id: 'watch', label: ['Drop by for the pizza', 'Pizza için uğra'], stats: { happiness: 2 }, result: ['You ate three slices and gave unsolicited advice for an hour. Someone asked you to leave, politely. The pizza was excellent.', 'Üç dilim yedin ve bir saat boyunca istenmemiş tavsiye verdin. Biri senden kibarca gitmeni istedi. Pizza mükemmeldi.'] },
    ],
  },
  {
    ...S, id: 'campus.first_flat', ages: [19, 28], once: true, when: onCampus,
    title: ['You and three friends are looking for a flat off campus.', 'Üç arkadaşınla kampüs dışında daire arıyorsun.'],
    text: ['The ad says “cosy”. The landlord says “character”. The bathroom says very little, because the door will not close.', 'İlanda “sevimli” yazıyor. Ev sahibi “karakterli” diyor. Banyo çok az şey söylüyor, çünkü kapısı kapanmıyor.'],
    options: [
      { id: 'take', label: ['Take the cheap flat with character', 'Karakterli ucuz daireyi tut'], usd: -120, stats: { happiness: 4, health: -1 }, tone: 'good', result: ['It had a draught, a view of a bin and a ceiling with a crack shaped like a giraffe. You lived there for three years and describe them as the best of your life.', 'Bir esinti, çöp kutusu manzarası ve zürafa biçiminde bir çatlağı olan tavan. Orada üç yıl yaşadın ve hayatının en güzel yılları dedin.'] },
      { id: 'dorm', label: ['Stay in halls for another year', 'Bir yıl daha yurtta kal'], stats: { happiness: 1 }, result: ['The walls were thin, the food was bad and everyone you knew lived within thirty metres. It was, strangely, fine.', 'Duvarlar ince, yemek kötüydü ve tanıdığın herkes otuz metre içinde yaşıyordu. Garip şekilde iyiydi.'] },
    ],
  },
  {
    ...S, id: 'campus.imposter', ages: [18, 32], once: true, when: onCampus,
    title: ['You are sure everyone else belongs here, and you do not.', 'Herkesin burada olmayı hak ettiğinden, senin ise etmediğinden eminsin.'],
    text: ['They speak in terms you have to look up. They seem to know where the good bookshop is. They have, you think, never been confused.', 'Senin sözlükten bakman gereken terimlerle konuşuyorlar. İyi kitapçının nerede olduğunu biliyor gibiler. Sence hiç kafaları karışmamış.'],
    options: [
      { id: 'confess', label: ['Tell a friend honestly how you feel', 'Bir arkadaşına nasıl hissettiğini dürüstçe söyle'], stats: { happiness: 4, smarts: 1 }, tone: 'good', result: ['“Me too,” said your friend, almost before you had finished. “All the time.” You stood there for a long while, two people who were both secretly drowning, and then you went for a coffee.', '“Ben de,” dedi arkadaşın, daha bitirmeden. “Hep.” İkiniz de gizlice boğulan iki kişi olarak uzun süre orada durdunuz ve sonra kahve içmeye gittiniz.'] },
      { id: 'hide', label: ['Work twice as hard to hide it', 'Gizlemek için iki kat çalış'], stats: { smarts: 2, happiness: -3, health: -1 }, apply: (c) => bumpGpa(c, 0.06), result: ['Your grades went up. So did your shoulders. You were applauded for something that felt like a long, quiet panic.', 'Notların yükseldi. Omuzların da. Uzun ve sessiz bir paniğe benzeyen bir şey için alkışlandın.'] },
    ],
  },
  {
    ...S, id: 'campus.exchange_friend', ages: [18, 30], once: true, when: onCampus,
    title: ['An exchange student is sitting alone in the cafeteria.', 'Bir değişim öğrencisi kafeteryada tek başına oturuyor.'],
    text: ['They have a tray, a phrasebook and the expression of someone who would like to be invited to something.', 'Elinde bir tepsi, bir konuşma kılavuzu ve bir yere davet edilmek isteyen birinin ifadesi var.'],
    options: [
      { id: 'sit', label: ['Sit down and say hello', 'Yanına otur ve selam ver'], stats: { happiness: 5, smarts: 1 }, tone: 'good', result: ['Their accent was lovely and their grammar was better than yours. They taught you to swear in their language, and you taught them the shortcut to the library.', 'Aksanı güzel, dilbilgisi seninkinden iyiydi. Sana kendi dilinde küfretmeyi öğrettiler, sen onlara kütüphane kestirmesini öğrettin.'] },
      { id: 'nod', label: ['Smile and keep walking', 'Gülümse ve yürümeye devam et'], stats: { happiness: -1 }, result: ['You told yourself you had a lecture. You did. You thought about the tray for the rest of the day.', 'Dersin olduğunu kendine söyledin. Vardı. Günün geri kalanında tepsiyi düşündün.'] },
    ],
  },
  {
    ...S, id: 'campus.match', ages: [18, 26], cooldown: 8, light: true, when: onCampus,
    title: ['The big inter-faculty match is on Saturday.', 'Fakülteler arası büyük maç cumartesi günü.'],
    text: ['Law versus Engineering. The banners are better than the football. Someone has brought a drum.', 'Hukuk Mühendisliğe karşı. Pankartlar futboldan iyi. Biri davul getirmiş.'],
    options: [
      { id: 'cheer', label: ['Paint your face and shout', 'Yüzünü boya ve bağır'], stats: { happiness: 6, health: -1 }, tone: 'good', result: ['Your voice was gone by half-time. The match ended 4–4 and was declared “a moral victory” by both sides, simultaneously.', 'Devre arasında sesin gitmişti. Maç 4–4 bitti ve iki taraf da aynı anda “manevi zafer” ilan etti.'] },
      { id: 'library', label: ['Take advantage of the empty library', 'Boş kütüphaneden yararlan'], stats: { smarts: 2 }, apply: (c) => bumpGpa(c, 0.05), result: ['It was blissfully quiet. You finished a chapter and a half. At dusk, you heard a roar from the pitch and knew someone had scored, probably by accident.', 'Muhteşem derecede sessizdi. Bir buçuk bölüm bitirdin. Akşamüstü sahadan bir kükreme duydun ve birinin, muhtemelen yanlışlıkla, gol attığını anladın.'] },
    ],
  },
  {
    ...S, id: 'campus.mentor', ages: [19, 30], once: true, when: onCampus,
    title: ['A final-year student offers to show you the ropes.', 'Son sınıftan bir öğrenci sana işin inceliklerini göstermeyi öneriyor.'],
    text: ['“Which professors to avoid, which exams are fair, which cafeteria sells the proper tea.” She hands you a folded map with notes.', '“Hangi hocalardan kaçınacağın, hangi sınavların adil olduğu, hangi kafeteryanın düzgün çay sattığı.” Sana notlu katlanmış bir harita uzatıyor.'],
    options: [
      { id: 'listen', label: ['Listen to everything and take notes', 'Her şeyi dinle ve not al'], stats: { smarts: 2, happiness: 2 }, apply: (c) => bumpGpa(c, 0.1), tone: 'good', result: ['The map saved you from two disasters and a bad sandwich. Years later you handed one of your own to a nervous first-year, with the same tea recommendation.', 'Harita seni iki felaketten ve kötü bir sandviçten kurtardı. Yıllar sonra aynı çay tavsiyesiyle gergin bir birinci sınıfa kendi haritanı verdin.'] },
      { id: 'own', label: ['Prefer to find your own way', 'Kendi yolunu bulmayı tercih et'], stats: { smarts: 1, happiness: 1 }, result: ['You walked into the wrong lecture hall for a whole month. You are not sure it was a mistake.', 'Bir ay boyunca yanlış amfiye girdin. Hata olup olmadığından emin değilsin.'] },
    ],
  },
  {
    ...S, id: 'campus.sick_exam', ages: U, once: true, when: onCampus,
    title: ['You have a fever on the morning of an important exam.', 'Önemli bir sınavın sabahı ateşin var.'],
    text: ['A thermometer says 38.6. Your body says go back to bed. Your calendar says it is the only date.', 'Termometre 38,6 gösteriyor. Vücudun yatağa dön diyor. Takvimin tek tarihin bu diyor.'],
    options: [
      { id: 'note', label: ['See a doctor and ask for a make-up date', 'Doktora git ve mazeret sınavı iste'], stats: { health: 2, smarts: 1 }, tone: 'good', result: ['A note, a stamp and a polite email. The make-up exam was a fortnight later, and you were healthy and clear-headed and passed with comfortable ease.', 'Bir rapor, bir kaşe ve kibar bir e-posta. Mazeret sınavı iki hafta sonraydı ve sağlıklı ve net kafayla rahatça geçtin.'] },
      { id: 'go', label: ['Go in and sweat it out', 'Gir ve terle çık'], stats: { health: -3 }, apply: (c) => bumpGpa(c, -0.1), tone: 'bad', result: ['You wrote in a fog and sneezed on question 14. The mark was exactly as foggy. You were very ill all weekend.', 'Sis içinde yazdın ve 14. soruda hapşurdun. Not tam olarak o kadar sisliydi. Hafta sonu çok hastaydın.'] },
    ],
  },
  {
    ...S, id: 'campus.cafeteria_job', ages: [18, 26], once: true, when: onCampus,
    title: ['The cafeteria needs someone for the evening shift.', 'Kafeterya akşam vardiyası için birini arıyor.'],
    text: ['The pay is small, the hours are awkward and the perk is a free hot meal. Your budget has opinions about the meal.', 'Ücret küçük, saatler uygunsuz ve avantajı bedava sıcak yemek. Bütçenin yemek hakkında fikirleri var.'],
    options: [
      { id: 'work', label: ['Take the shift', 'Vardiyayı al'], usd: 350, stats: { happiness: -1, health: 1 }, tone: 'good', result: ['You learned the real names of the cooks, how to carry nine plates and that the best shepherd’s pie is made on Thursdays. You were paid and fed.', 'Aşçıların gerçek isimlerini, dokuz tabağın nasıl taşındığını ve en iyi çoban böreğinin perşembe günleri yapıldığını öğrendin. Hem para hem yemek aldın.'] },
      { id: 'pass', label: ['Keep your evenings free', 'Akşamlarını boş tut'], stats: { happiness: 2 }, result: ['You spent them reading, arguing and failing to cook. Money was tight and the evenings were yours.', 'Onları okuyarak, tartışarak ve yemek yapmayı başaramayarak geçirdin. Para sıkıydı ve akşamlar senindi.'] },
    ],
  },
  {
    ...S, id: 'campus.supervisor_meeting', ages: [22, 40], cooldown: 3, when: gradStudent,
    title: ['Your supervisor asks to see you, “just a quick chat”.', 'Danışmanın seni “sadece kısa bir sohbet” için çağırıyor.'],
    text: ['You have been avoiding her emails for two weeks. The chair opposite hers is very low.', 'İki haftadır e-postalarından kaçıyorsun. Karşısındaki sandalye çok alçak.'],
    options: [
      { id: 'honest', label: ['Admit where you really are', 'Gerçekte nerede olduğunu itiraf et'], stats: { smarts: 2, happiness: 1 }, tone: 'good', result: ['“Good,” she said. “Now we can plan.” It was the most useful hour of your term. She drew a timeline on a napkin, a nice one.', '“İyi,” dedi. “Artık plan yapabiliriz.” Dönemin en yararlı saatiydi. Peçeteye bir zaman çizelgesi çizdi, güzel bir tane.'] },
      { id: 'bluff', label: ['Present the best version of the truth', 'Gerçeğin en iyi sürümünü sun'], stats: { happiness: -2 }, result: ['She nodded for forty minutes, then asked one question that unwound everything. “Next Tuesday,” she said, kindly.', 'Kırk dakika başını salladı, sonra her şeyi çözen tek bir soru sordu. “Gelecek salı,” dedi, nazikçe.'] },
    ],
  },
  {
    ...S, id: 'campus.conference', ages: [22, 45], once: true, when: gradStudent,
    title: ['You are asked to present your work at a conference.', 'Çalışmanı bir konferansta sunman isteniyor.'],
    text: ['Twelve minutes, three questions and a lanyard that will not stay put. The audience contains, at the back, the person who wrote your favourite paper.', 'On iki dakika, üç soru ve yerinde durmayan bir yaka kartı. Salonda, arkada, en sevdiğin makaleyi yazan kişi var.'],
    options: [
      { id: 'present', label: ['Rehearse and give it your best', 'Prova yap ve elinden geleni ver'], usd: -150, stats: { smarts: 3, happiness: 3 }, tone: 'good', result: ['It went too fast and then too slowly and then ended, to applause. The person at the back came up afterwards and said, “That second slide.” You have not yet recovered.', 'Çok hızlı, sonra çok yavaş gitti ve alkışla bitti. Arkadaki kişi sonra gelip “O ikinci slayt” dedi. Henüz kendine gelemedin.'] },
      { id: 'poster', label: ['Offer a poster instead', 'Onun yerine poster sun'], stats: { smarts: 1, happiness: 1 }, result: ['A poster, a corridor, an hour of standing next to your own graph. Three people stopped. One asked a question you could answer.', 'Bir poster, bir koridor, kendi grafiğinin yanında bir saat durmak. Üç kişi durdu. Biri cevaplayabileceğin bir soru sordu.'] },
    ],
  },
  {
    ...S, id: 'campus.lab_mishap', ages: [22, 45], once: true, when: gradStudent,
    title: ['Your experiment fails in the third month in a row.', 'Deneyin üçüncü ay üst üste başarısız oluyor.'],
    text: ['The equipment is old. The data are noise. A technician says, in a gentle voice, “It happens to everyone.”', 'Ekipman eski. Veri gürültü. Bir teknisyen yumuşak bir sesle “Herkesin başına gelir” diyor.'],
    options: [
      { id: 'rethink', label: ['Step back and redesign the method', 'Geri çekil ve yöntemi yeniden tasarla'], stats: { smarts: 3, happiness: -1 }, tone: 'good', result: ['It took a month and a long walk. The new design was simpler and, to everyone’s irritation, worked at once. You presented it with the expression of someone who always knew.', 'Bir ay ve uzun bir yürüyüş sürdü. Yeni tasarım daha basitti ve herkesin sinirine, hemen işe yaradı. Hep biliyormuş gibi bir ifadeyle sundun.'] },
      { id: 'repeat', label: ['Repeat it again, with more hope', 'Daha fazla umutla bir daha tekrarla'], stats: { happiness: -3, health: -1 }, result: ['The fourth time, it failed more quietly. You went home and lay on the floor. A lab mate lay down next to you. Neither of you said anything.', 'Dördüncüde daha sessiz başarısız oldu. Eve gidip yere uzandın. Bir laboratuvar arkadaşı yanına uzandı. İkiniz de bir şey söylemediniz.'] },
    ],
  },
  {
    ...S, id: 'campus.teaching', ages: [22, 45], once: true, when: gradStudent,
    title: ['You are asked to teach a first-year seminar.', 'Birinci sınıf bir seminer vermen isteniyor.'],
    text: ['Twenty-two eighteen-year-olds, one projector and the ghost of every teacher who ever said “any questions?” into a silence.', 'Yirmi iki on sekiz yaşında genç, bir projeksiyon ve sessizliğe “soru var mı?” demiş her öğretmenin hayaleti.'],
    options: [
      { id: 'teach', label: ['Prepare carefully and enjoy it', 'Dikkatle hazırlan ve keyfini çıkar'], stats: { smarts: 2, happiness: 4 }, tone: 'good', result: ['A boy at the back asked a question that you couldn’t answer, and you said so. The look on the class was a revelation. You are going to be good at this, you think.', 'Arkadaki bir çocuk cevaplayamadığın bir soru sordu ve bunu söyledin. Sınıfın yüz ifadesi bir vahiydi. Bunda iyi olacaksın, diye düşünüyorsun.'] },
      { id: 'hand', label: ['Hand out reading and leave early', 'Okuma listesi dağıt ve erken çık'], stats: { happiness: -1 }, result: ['Nobody read it. You sat in the corridor with a sandwich, afterwards, feeling slightly like the sort of teacher you didn’t want to be.', 'Kimse okumadı. Sonra koridorda sandviçle oturdun ve olmak istemediğin türden bir öğretmen gibi hissettin.'] },
    ],
  },
  {
    ...S, id: 'campus.graduation_eve', ages: [20, 32], cooldown: 6, light: true, when: (c) => onCampus(c) && (peekCampus(c.p)?.gpa ?? 0) > 0 && c.p.schoolYears >= 3,
    title: ['The night before the last exam of your degree.', 'Diplomanın son sınavından önceki gece.'],
    text: ['The campus is oddly quiet. A few lights are on in the library. You can hear someone practising the violin, badly, in the hall of residence.', 'Kampüs garip derecede sessiz. Kütüphanede birkaç ışık yanıyor. Yurt salonunda birinin kötü kemanla prova yaptığını duyuyorsun.'],
    options: [
      { id: 'walk', label: ['Walk round the campus one last time', 'Kampüste son kez dolaş'], stats: { happiness: 5 }, tone: 'good', result: ['You touched the old tree, looked up at the lit clock tower and thanked a building out loud. A security guard said “good luck”, as though he had said it to a thousand.', 'Yaşlı ağaca dokundun, ışıklı saat kulesine baktın ve yüksek sesle bir binaya teşekkür ettin. Bir güvenlik görevlisi “Bol şans” dedi, binlerce kişiye söylemiş gibi.'] },
      { id: 'sleep', label: ['Go to bed early; be a grown-up', 'Erken yat; yetişkin ol'], stats: { health: 2, smarts: 1 }, apply: (c) => bumpGpa(c, 0.04), result: ['You slept for eight hours, a thing you had not done since freshers’ week. The exam was kind. You woke to a bright morning and a faint sense of leaving.', 'Sekiz saat uyudun; ilk haftadan beri yapmadığın bir şey. Sınav merhametliydi. Parlak bir sabaha ve belli belirsiz bir ayrılma hissiyle uyandın.'] },
    ],
  },
  {
    ...S, id: 'campus.alumni_letter', ages: [24, 80], once: true, when: (c) => (peekCampus(c.p)?.gradYear ?? 0) > 0 && c.s.year - (peekCampus(c.p)?.gradYear ?? 0) >= 8,
    title: ['A letter from your old university: the alumni reunion.', 'Eski üniversitenden bir mektup: mezunlar buluşması.'],
    text: ['Ten years on. The invitation promises a “dinner, speeches and a tour of the new building”. Underneath, in pen: “Please come. We kept the tree.”', 'Aradan on yıl geçmiş. Davetiye “akşam yemeği, konuşmalar ve yeni binanın turu” vaat ediyor. Altında, kalemle: “Lütfen gel. Ağacı koruduk.”'],
    options: [
      { id: 'go', label: ['Go back, and look everyone in the eye', 'Geri dön ve herkesin gözüne bak'], usd: -80, stats: { happiness: 6 }, tone: 'good', result: ['The tree was bigger than you remembered, and so were you, in more ways than one. You found three friends exactly where you had left them, if three years older and now with children and opinions.', 'Ağaç hatırladığından büyüktü, sen de, birden fazla anlamda. Üç arkadaşı bıraktığın yerde buldun; üç yaş büyük, artık çocuklu ve fikirli.'] },
      { id: 'email', label: ['Send a warm reply and your regrets', 'Sıcak bir cevap ve özür gönder'], stats: { happiness: 1 }, result: ['You wrote a note full of affection. A friend sent you a photograph of the tree with a banner round it saying “WE MISS YOU”. You put it on the fridge.', 'Sevgi dolu bir not yazdın. Bir arkadaş sana ağacın etrafına “SENİ ÖZLEDİK” pankartı sarılı bir fotoğrafını gönderdi. Buzdolabına astın.'] },
    ],
  },
  {
    ...S, id: 'campus.dropout_friend', ages: [18, 26], once: true, when: onCampus,
    title: ['Your friend says they are dropping out.', 'Arkadaşın okulu bırakacağını söylüyor.'],
    text: ['“It is not for me.” They say it lightly, with their coat already on. There are tears in a place you cannot see.', '“Bana göre değil.” Hafifçe söylüyor, paltosu çoktan üstünde. Göremediğin bir yerde gözyaşları var.'],
    options: [
      { id: 'support', label: ['Hear them out and say you are with them', 'Dinle ve yanlarında olduğunu söyle'], stats: { happiness: 2, smarts: 1 }, tone: 'good', result: ['They told you what they actually wanted to do, which was not what anyone else had been told. You helped them make a list, and kept in touch. It was one of the best talks of your degree.', 'Gerçekte ne yapmak istediklerini söylediler; bu, kimseye söylenenden farklıydı. Bir liste yapmalarına yardım ettin ve görüşmeye devam ettin. Diplomanın en güzel konuşmalarından biriydi.'] },
      { id: 'convince', label: ['Try to talk them out of it', 'Vazgeçirmeye çalış'], stats: { happiness: -2 }, result: ['You gave a very good speech. They thanked you, and left anyway. You still wonder whether the speech was for them.', 'Çok iyi bir konuşma yaptın. Teşekkür ettiler ve yine de gittiler. Konuşmanın onlar için olup olmadığını hâlâ merak ediyorsun.'] },
    ],
  },
  {
    ...S, id: 'campus.cheap_eats', ages: [18, 26], cooldown: 8, light: true, when: onCampus,
    title: ['A tiny restaurant near the campus gate does a “student special”.', 'Kampüs kapısının yanındaki küçük bir lokanta “öğrenci menüsü” yapıyor.'],
    text: ['The owner has a rule: “Never leave hungry, never leave without saying thank you.” The portions are enormous.', 'Sahibinin bir kuralı var: “Aç gitme, teşekkür etmeden gitme.” Porsiyonlar kocaman.'],
    options: [
      { id: 'regular', label: ['Become a regular', 'Müdavim ol'], usd: -30, stats: { happiness: 5, health: 1 }, tone: 'good', result: ['By the third week the owner brought you the dish without asking. By the end of the term she had told you the story of her village, her husband and her recipe for the best lentil soup in the district.', 'Üçüncü haftada sahibi yemeği sormadan getirdi. Dönemin sonunda köyünün, kocasının ve bölgenin en iyi mercimek çorbasının tarifini anlattı.'] },
      { id: 'cook', label: ['Admire it and eat at home', 'Beğen ve evde ye'], stats: { happiness: 1 }, result: ['You cooked your own noodles and thought of her soup. On the last day of term you visited and ate the biggest bowl, which she charged you for exactly half.', 'Kendi eriştelerini pişirdin ve onun çorbasını düşündün. Dönemin son günü ziyaret edip en büyük kâseyi yedin; sana tam yarı fiyatına hesap kesti.'] },
    ],
  },
  {
    ...S, id: 'campus.sleep_in', ages: [18, 26], cooldown: 5, light: true, when: onCampus,
    title: ['You slept through your 9 a.m. lecture, again.', 'Sabah dokuz dersini yine uyuyarak kaçırdın.'],
    text: ['A friend texts: “Prof asked where you were. I said, ‘Library.’” You are touched and, in a small way, offended.', 'Bir arkadaş mesaj atıyor: “Hoca nerede olduğunu sordu. ‘Kütüphane’ dedim.” Duygulandın ve küçük bir şekilde de gücendin.'],
    options: [
      { id: 'catch', label: ['Get the notes and promise to change', 'Notları al ve değişeceğine söz ver'], stats: { smarts: 1, happiness: 1 }, apply: (c) => bumpGpa(c, 0.03), result: ['You borrowed the notes and set three alarms. You woke for the next one, and did well, and felt unreasonably proud of yourself.', 'Notları ödünç aldın ve üç alarm kurdun. Bir sonrakine kalktın, iyi gittin ve kendinle haksızca gurur duydun.'] },
      { id: 'sleep', label: ['Go back to sleep; it’s fine', 'Tekrar uyu; sorun yok'], stats: { happiness: 3, health: 1 }, apply: (c) => bumpGpa(c, -0.04), result: ['It was a good sleep. By the third such morning, the professor had stopped asking, which is not the same as not noticing.', 'İyi bir uykuydu. Üçüncü sabaha hoca sormayı bıraktı; bu, fark etmemekle aynı şey değil.'] },
    ],
  },
];

export const campusMoreEvents: EventDef[] = MORE.map(quickEvent);
