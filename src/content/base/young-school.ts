import type { ActivityDef, Ctx, EventDef } from '../types';
import { inTr } from './events-flavour';
import { say, sayWith, type Pair } from './lines';
import { gen, who, wth } from './util';
import {
  Kw,
  SCHOOL_GROUP,
  alive,
  fx,
  befriend,
  gamble,
  grades,
  hasFriend,
  hasParent,
  inHigh,
  inPrimary,
  inSchool,
  near,
  newAdult,
  newKid,
  nmc,
  nudgeGrades,
  opt,
  out,
  pickFriend,
  pickParent,
  tt,
  ys,
  ysPeek,
} from './young-kit';
import { aliveKin } from './kin';

// Round 4: school life, 6–17. Random school events, plus school interactions the player starts from the
// Activities screen (talk to a teacher, sit with a classmate, deal with a bully, join a club, study, skip).
// School standing ("grades", young-kit) moves with these and colours a few texts.

// ------------------------------------------------------------------ clubs

export const CLUBS = ['chess', 'drama', 'football', 'robotics', 'choir', 'art'] as const;
export type ClubId = (typeof CLUBS)[number];
/** [English name, Turkish dative ("… katıl"), English "go to", Turkish "go to"]. */
const CLUB_NAME: Record<ClubId, [string, string, string, string]> = {
  chess: ['the chess club', 'Satranç kulübüne', 'Go to chess club', 'Satranç kulübüne git'],
  drama: ['the drama club', 'Tiyatro kulübüne', 'Go to drama club', 'Tiyatro kulübüne git'],
  football: ['the school team', 'Okul takımına', 'Go to football training', 'Takım antrenmanına git'],
  robotics: ['the robotics club', 'Robotik kulübüne', 'Go to robotics club', 'Robotik kulübüne git'],
  choir: ['the choir', 'Koroya', 'Go to choir practice', 'Koro çalışmasına git'],
  art: ['the art club', 'Resim kulübüne', 'Go to art club', 'Resim kulübüne git'],
};
/** The clubs on offer at a sign-up day (two rotating sets, so each day shows four tables). */
const CLUB_SETS: Record<'a' | 'b', ClubId[]> = { a: ['chess', 'drama', 'football', 'choir'], b: ['robotics', 'art', 'football', 'drama'] };
const clubOf = (c: Ctx): ClubId | undefined => {
  const id = ysPeek(c).club;
  return (CLUBS as readonly string[]).includes(id ?? '') ? (id as ClubId) : undefined;
};

const CLUB_LINES: Record<ClubId, Pair[]> = {
  chess: [
    ['Chess club: you lost to a nine-year-old in eleven moves. You shook hands like a grown-up and cried a bit in the corridor.', 'Satranç kulübü: dokuz yaşında birine on bir hamlede yenildin. Büyükler gibi tokalaştın, koridorda biraz ağladın.'],
    ['You finally understood the knight. It moves like a drunk horse, and so now do you.', 'Sonunda atı anladın. Sarhoş bir at gibi gidiyor; artık sen de öyle düşünüyorsun.'],
    ['You won a game by sheer stubbornness. Your opponent ran out of lunch break.', 'Bir oyunu sırf inatla kazandın. Rakibinin teneffüsü bitti.'],
    ['The coach said your opening was "brave". You have since learned that this is not a compliment.', 'Hoca açılışın için "cesur" dedi. Bunun iltifat olmadığını sonradan öğrendin.'],
    ['You played speed chess against the club champion and lasted almost four minutes. A record.', 'Kulüp şampiyonuna karşı yıldırım satranç oynadın ve dört dakikaya yakın dayandın. Rekor.'],
  ],
  drama: [
    ['Drama club: you played a tree. You were the most committed tree the school has ever seen.', 'Tiyatro kulübü: ağaç rolündeydin. Okulun gördüğü en kendini adamış ağaçtın.'],
    ['You did an improvisation exercise as a nervous waiter. The teacher said you were "a natural". At being nervous, probably.', 'Doğaçlama çalışmasında gergin bir garsonu oynadın. Hoca "Doğuştan yeteneklisin" dedi. Gerginlikte herhalde.'],
    ['You learned all your lines and everyone else\'s. You whispered the whole play from the wings.', 'Hem kendi repliklerini hem herkesinkini ezberledin. Bütün oyunu kulisten fısıldadın.'],
    ['The rehearsal ran three hours late because nobody could stop laughing at the sword fight.', 'Prova üç saat uzadı çünkü kılıç dövüşünde kimse gülmeyi durduramadı.'],
    ['You got your first real line: "My lord, the horses have escaped." You said it beautifully.', 'İlk gerçek repliğini aldın: "Efendim, atlar kaçtı." Çok güzel söyledin.'],
  ],
  football: [
    ['Training in the rain. You slid into a tackle and kept sliding for some time.', 'Yağmurda antrenman. Bir müdahaleye kaydın ve epey bir süre kaymaya devam ettin.'],
    ['You scored in training and celebrated like it was a cup final. The coach made you run laps for it.', 'Antrenmanda gol attın ve kupa finaliymiş gibi sevindin. Hoca bunun için sana tur attırdı.'],
    ['You spent the whole match on the bench and cheered so hard you lost your voice. Team player.', 'Bütün maçı yedek kulübesinde geçirdin ve sesin kısılana kadar tezahürat yaptın. Takım oyuncusu.'],
    ['You won an away game 2–1. The bus home was the loudest place on earth.', 'Deplasmanda 2–1 kazandınız. Dönüş otobüsü dünyanın en gürültülü yeriydi.'],
    ['You practised free kicks after training until the caretaker turned off the lights.', 'Antrenmandan sonra hademe ışıkları kapatana kadar serbest vuruş çalıştın.'],
  ],
  robotics: [
    ['Robotics club: your robot drove straight into a wall, reversed and did it again. Progress.', 'Robotik kulübü: robotunuz dosdoğru duvara gitti, geri çekildi ve yine gitti. İlerleme var.'],
    ['You soldered your first circuit. It worked, and so did the smoke alarm.', 'İlk devreni lehimledin. Çalıştı; yangın alarmı da çalıştı.'],
    ['Your team\'s robot can now pick up a ping-pong ball. Sometimes. You are very proud of sometimes.', 'Takımınızın robotu artık pinpon topunu tutabiliyor. Bazen. "Bazen" ile çok gurur duyuyorsunuz.'],
    ['You stayed after school fixing a bug. The bug was a missing semicolon. You will never forget it.', 'Bir hatayı düzeltmek için okulda kaldın. Hata eksik bir noktalı virgülmüş. Bunu hiç unutmayacaksın.'],
    ['The robot entered a regional contest and came ninth out of ten. The tenth one caught fire.', 'Robot bölge yarışmasına katıldı ve on robot arasında dokuzuncu oldu. Onuncusu alev almıştı.'],
  ],
  choir: [
    ['Choir practice: you sang the alto part with total confidence and the wrong words.', 'Koro çalışması: alto partisyonunu tam bir özgüvenle ve yanlış sözlerle söyledin.'],
    ['The choir sang at an old people\'s home. A woman in the front row knew every word and sang louder than all of you.', 'Koro bir huzurevinde şarkı söyledi. Ön sıradaki bir teyze bütün sözleri biliyordu ve hepinizden yüksek söyledi.'],
    ['You hit a high note you have never hit before. The teacher stopped the piano to look at you.', 'Daha önce hiç çıkamadığın bir tiz notaya çıktın. Öğretmen piyanoyu durdurup sana baktı.'],
    ['You were moved to the back row "for balance". You choose to believe it.', '"Denge için" arka sıraya alındın. Buna inanmayı seçiyorsun.'],
    ['The choir did a concert for parents. Somebody\'s baby sang along. It was the best part.', 'Koro velilere konser verdi. Birinin bebeği de eşlik etti. En güzel kısım oydu.'],
  ],
  art: [
    ['Art club: you painted a bowl of fruit. It looks like a bowl of planets. You are keeping it.', 'Resim kulübü: bir meyve tabağı çizdin. Gezegen tabağına benziyor. Saklıyorsun.'],
    ['You tried clay. You made a vase, then an ashtray, then a flat thing you called "Sorrow".', 'Kil denedin. Önce bir vazo, sonra bir küllük, sonra da adını "Hüzün" koyduğun yassı bir şey yaptın.'],
    ['Your drawing went up on the corridor wall. You walked past it nine times that day.', 'Resmin koridor duvarına asıldı. O gün önünden dokuz kez geçtin.'],
    ['The art teacher showed you how to draw hands. You drew nothing but hands for a month.', 'Resim öğretmeni sana el çizmeyi gösterdi. Bir ay boyunca elden başka bir şey çizmedin.'],
    ['You got paint in your hair, on your shoes and somehow inside your bag. Art.', 'Saçına, ayakkabına ve nasıl olduysa çantanın içine boya bulaştı. Sanat bu.'],
  ],
};

// ------------------------------------------------------------------ activity line pools

const STUDY_KID: Pair[] = [
  ['You did your homework at the kitchen table and only asked for help twice. Personal best.', 'Ödevini mutfak masasında yaptın ve sadece iki kez yardım istedin. Senin için büyük başarı.'],
  ['You learned your times tables by singing them in the bath. The neighbours learned them too.', 'Çarpım tablosunu banyoda şarkı söyleyerek ezberledin. Komşular da ezberledi.'],
  ['You read a whole chapter ahead. The next day you knew an answer before the teacher finished the question.', 'Bir bölüm önden okudun. Ertesi gün öğretmen soruyu bitirmeden cevabı bildin.'],
  ['You practised your handwriting until your letters stopped leaning like tired people.', 'Harflerin yorgun insanlar gibi yana yatmayı bırakana kadar el yazısı çalıştın.'],
  ['You made flashcards. Making them took longer than learning them. Still worked.', 'Bilgi kartları hazırladın. Hazırlamak öğrenmekten uzun sürdü. Yine de işe yaradı.'],
  ['You finally understood fractions with the help of a pizza. Then you ate the help.', 'Kesirleri sonunda bir pizza yardımıyla anladın. Sonra yardımı yedin.'],
  ['You studied spelling with your eyes closed, letter by letter, like a spy memorising a code.', 'Yazımı gözlerin kapalı, harf harf çalıştın; şifre ezberleyen bir casus gibi.'],
  ['You learned all the capital cities of a continent and recited them at dinner, uninvited.', 'Bir kıtanın bütün başkentlerini öğrendin ve kimse istemeden yemekte saydın.'],
];
const STUDY_TEEN: Pair[] = [
  ['You studied for three hours with your phone in another room. It felt like a hostage situation.', 'Telefonun başka odadayken üç saat ders çalıştın. Rehine krizi gibiydi.'],
  ['You made a colour-coded revision timetable. Then you actually followed it. Twice.', 'Renk kodlu bir çalışma programı yaptın. Sonra gerçekten uydun. İki kez.'],
  ['You finally understood what the chemistry teacher had been saying since September.', 'Kimya öğretmeninin eylülden beri ne anlattığını sonunda anladın.'],
  ['You did past papers until the questions started appearing in your dreams.', 'Sorular rüyana girene kadar çıkmış soru çözdün.'],
  ['You formed a study group. It was forty minutes of gossip and twenty of real work. Better than nothing.', 'Bir çalışma grubu kurdunuz. Kırk dakika dedikodu, yirmi dakika gerçek çalışma. Hiç yoktan iyi.'],
  ['You explained a maths problem to a friend and, halfway through, finally understood it yourself.', 'Bir arkadaşına matematik sorusu anlattın ve yarısında sonunda kendin de anladın.'],
  ['You studied at the library until closing time. The librarian now nods at you like a colleague.', 'Kapanış saatine kadar kütüphanede çalıştın. Kütüphaneci artık seni meslektaşı gibi selamlıyor.'],
  ['You wrote an essay you were actually proud of. You read it twice before handing it in.', 'Gerçekten gurur duyduğun bir kompozisyon yazdın. Teslim etmeden önce iki kez okudun.'],
  ['You studied history by imagining every king as a teacher at your school. It worked alarmingly well.', 'Tarihi her kralı okulundaki bir öğretmen gibi hayal ederek çalıştın. Korkutucu derecede işe yaradı.'],
  ['You turned off every notification for a week. Your grades went up. Your group chat assumed you had died.', 'Bir hafta bütün bildirimleri kapattın. Notların yükseldi. Grup sohbeti öldüğünü sandı.'],
];
const SKIP_OK: Pair[] = [
  ['You skipped school and spent the day at the park feeding ducks. The ducks will not tell.', 'Okulu kırıp günü parkta ördek besleyerek geçirdin. Ördekler kimseye söylemez.'],
  ['You skipped school and went to the seaside with a friend. Best Tuesday of the year.', 'Okulu kırıp bir arkadaşınla sahile gittin. Yılın en güzel salısıydı.'],
  ['You faked a cough, stayed home and watched films all day. Your acting has improved.', 'Sahte bir öksürükle evde kaldın ve bütün gün film izledin. Oyunculuğun gelişiyor.'],
  ['You skipped the afternoon and wandered the city with nowhere to be. It felt like freedom.', 'Öğleden sonrayı kırdın ve gidecek bir yerin olmadan şehirde dolaştın. Özgürlük gibiydi.'],
  ['You hid in the library during maths and read a whole novel. Technically still education.', 'Matematik dersinde kütüphanede saklanıp koca bir roman okudun. Teknik olarak yine eğitim.'],
];
const SKIP_CAUGHT: Pair[] = [
  ['You skipped school and walked straight into your aunt at the bus stop. The phone call home was immediate.', 'Okulu kırdın ve otobüs durağında teyzene çarptın. Eve telefon anında geldi.'],
  ['You skipped school. The school texted your parents before you had reached the corner.', 'Okulu kırdın. Sen köşeye varmadan okul ailene mesaj atmıştı.'],
  ['You skipped class and the head teacher was waiting at the gate on your way back. Detention for a week.', 'Dersi kırdın; dönüşte müdür kapıda bekliyordu. Bir hafta ceza.'],
  ['You skipped school and missed a surprise test. Zero. The surprise was on you.', 'Okulu kırdın ve sürpriz bir sınavı kaçırdın. Sıfır. Sürpriz sana oldu.'],
];


// ------------------------------------------------------------------ pools for the activity-opened school events
// (these events can open every year, so their outcomes rotate through `sayWith` instead of one fixed line)

/** Teacher name in both languages: ["Ms. Aksoy", "Ayşe Öğretmen"]. */
type TN = { en: string; tr: string };
const tn = (c: Ctx): TN => {
  const p = c.h.person(String(c.vars.tch));
  return { en: `${p?.gender === 'female' ? 'Ms.' : 'Mr.'} ${p?.lastName ?? '?'}`, tr: `${p?.firstName ?? '?'} Öğretmen` };
};
const T_HELP: ((t: TN) => Pair)[] = [
  (t) => [`${t.en} explained it again with a drawing of a pizza. Suddenly it all made sense.`, `${t.tr} bir pizza çizerek yeniden anlattı. Birden her şey yerine oturdu.`],
  (t) => [`${t.en} found the exact step where you got lost. It was step two. Everything after it was fine.`, `${t.tr} kaybolduğun adımı buldu. İkinci adımmış. Sonrası zaten doğruymuş.`],
  (t) => [`${t.en} gave you three extra exercises and a sweet. You did all three. You ate the sweet first.`, `${t.tr} sana üç ek alıştırma ve bir şeker verdi. Üçünü de yaptın. Şekeri önce yedin.`],
  (t) => [`${t.en} explained it with two apples and a ruler. You will never see apples the same way.`, `${t.tr} iki elma ve bir cetvelle anlattı. Elmalara artık eskisi gibi bakamayacaksın.`],
  (t) => [`${t.en} stayed twenty minutes after the bell for you. You got the next test right and looked over at the desk.`, `${t.tr} senin için zil çaldıktan sonra yirmi dakika kaldı. Bir sonraki sınavda doğru yaptın ve gözün masaya kaydı.`],
];
const T_EXTRA: ((t: TN) => Pair)[] = [
  (t) => [`You asked for extra work. ${t.en} looked at you as if you had grown a second head, then gave you a project on volcanoes.`, `Fazladan ödev istedin. ${t.tr} sana ikinci bir kafan çıkmış gibi baktı, sonra yanardağlar hakkında bir proje verdi.`],
  (t) => [`${t.en} gave you a book "for advanced students". You read it on the bus and felt advanced.`, `${t.tr} sana "ileri seviye öğrenciler için" bir kitap verdi. Otobüste okudun ve kendini ileri seviye hissettin.`],
  (t) => [`${t.en} asked you to prepare a short talk for the class. You practised it on the cat.`, `${t.tr} senden sınıfa kısa bir sunum hazırlamanı istedi. Kediye prova ettin.`],
  (t) => [`Your extra project on bridges ended with a bridge made of spaghetti that held four books. ${t.en} took a photo.`, `Köprüler üzerine ek projen, dört kitabı taşıyan makarnadan bir köprüyle bitti. ${t.tr} fotoğrafını çekti.`],
];
const T_THANK: ((t: TN) => Pair)[] = [
  (t) => [`You said it was a good lesson. ${t.en} was quiet for a moment and then said nobody had said that in years.`, `Güzel bir ders olduğunu söyledin. ${t.tr} bir an sustu, sonra yıllardır kimsenin bunu söylemediğini söyledi.`],
  (t) => [`You thanked ${t.en}, who went pink and dropped the board marker.`, `${t.tr} teşekkürüne kızardı ve tahta kalemini düşürdü.`],
  (t) => [`You said thank you. ${t.en} said "go on, out, before I give you homework", smiling.`, `Teşekkür ettin. ${t.tr} gülümseyerek "Hadi çık, yoksa ödev veririm" dedi.`],
  (t) => [`${t.en} nodded at your thanks and wrote something in a small notebook. You hope it was good.`, `${t.tr} teşekkürüne başını salladı ve küçük bir deftere bir şey yazdı. İyi bir şey olduğunu umuyorsun.`],
];
const M_ASK: ((n: string) => Pair)[] = [
  (n) => [`It was a comic about the teacher as a superhero. ${n} let you write the speech bubbles. A partnership is born.`, `Öğretmeni süper kahraman olarak çizdiği bir çizgi romanmış. ${n} konuşma balonlarını sana yazdırdı. Bir ortaklık doğdu.`],
  (n) => [`${n} was drawing a map of a made-up country. By the end of the lesson you were its foreign minister.`, `${n} uydurma bir ülkenin haritasını çiziyormuş. Ders bitmeden sen o ülkenin dışişleri bakanıydın.`],
  (n) => [`${n} was drawing horses, very well. You asked for one. You still have it.`, `${n} at çiziyormuş, hem de çok iyi. Bir tane istedin. Hâlâ sende.`],
  (n) => [`${n} showed you a whole notebook of tiny monsters, each with a name and a favourite food. You are friends now.`, `${n} sana her birinin adı ve en sevdiği yemeği olan minik canavarlarla dolu bir defter gösterdi. Artık arkadaşsınız.`],
];
const M_STUDY: ((n: string) => Pair)[] = [
  (n) => [`You studied together after school. ${n} is good at what you are bad at, and the other way round.`, `Okuldan sonra birlikte çalıştınız. ${n} senin kötü olduğun şeyde iyi, sen de onun kötü olduğunda.`],
  (n) => [`You and ${n} studied at the kitchen table. ${gen(n)} grandmother kept bringing food. Excellent study group.`, `${wth(n)} mutfak masasında çalıştınız. ${gen(n)} büyükannesi durmadan yemek getirdi. Harika bir çalışma grubu.`],
  (n) => [`You quizzed each other on the bus home. ${n} got every answer right and then missed the stop.`, `Eve dönerken otobüste birbirinize soru sordunuz. ${n} hepsini bildi, sonra durağını kaçırdı.`],
  (n) => [`You and ${n} made a song out of the formulas. It is terrible. It works.`, `${wth(n)} formüllerden bir şarkı yaptınız. Berbat. Ama işe yarıyor.`],
];
const M_BALL: ((n: string) => Pair)[] = [
  (n) => [`${n} played in goal and saved everything. You have a new teammate and a new friend.`, `${n} kaleye geçti ve her şeyi kurtardı. Hem yeni bir takım arkadaşın hem yeni bir dostun var.`],
  (n) => [`You and ${n} played until the bell and came back to class red-faced and grinning.`, `${wth(n)} zil çalana kadar oynadınız ve sınıfa kıpkırmızı ve sırıtarak döndünüz.`],
  (n) => [`${n} turned out to be terrible at football and wonderful company. You lost 6–1 and laughed the whole time.`, `${n} futbolda berbat ama sohbette harika çıktı. 6–1 yenildiniz ve baştan sona güldünüz.`],
  (n) => [`${n} taught you a new playground game with rules nobody fully understands. It is your game now.`, `${n} sana kurallarını kimsenin tam anlamadığı yeni bir teneffüs oyunu öğretti. Artık sizin oyununuz.`],
];
const M_QUIET: Pair[] = [
  ['You listened to the lesson instead. You understood it. Some days are like that.', 'Onun yerine dersi dinledin. Anladın da. Bazı günler böyle.'],
  ['You kept to yourself and doodled in the margin. Your doodle is quite good, actually.', 'Kendi hâlinde kaldın ve defterinin kenarına karaladın. Aslında karalaman fena değil.'],
  ['You stayed quiet and took the neatest notes of your life.', 'Sessiz kaldın ve hayatının en düzenli notlarını tuttun.'],
  ['You looked out of the window for most of the lesson. A pigeon looked back. A quiet friendship.', 'Dersin çoğunda pencereden dışarı baktın. Bir güvercin de sana baktı. Sessiz bir dostluk.'],
  ['You said nothing and answered one question correctly at the end. Mysterious. Effective.', 'Hiçbir şey söylemedin ve sonunda bir soruyu doğru cevapladın. Gizemli. Etkili.'],
];

// ------------------------------------------------------------------ events

/** "Ms. Aksoy" / "Ayşe Öğretmen" for the adult in vars[key]. */
const teacher = (c: Ctx, key = 'tch') => {
  const p = c.h.person(String(c.vars[key]));
  return c.t(`${p?.gender === 'female' ? 'Ms.' : 'Mr.'} ${p?.lastName ?? '?'}`, `${p?.firstName ?? '?'} Öğretmen`);
};

export const youngSchoolEvents: EventDef[] = [
  {
    id: 'base.ys_monitor',
    category: 'school',
    minAge: 7,
    maxAge: 11,
    once: true,
    when: inPrimary,
    setup: (c) => pickFriend(c),
    title: tt('The teacher makes you class monitor while she steps out.', 'Öğretmen sınıftan çıkarken seni sınıf başkanı vekili yaptı.'),
    text: tt('Your job: write the names of anyone who talks on the board.', 'Görevin: konuşanların adını tahtaya yazmak.'),
    choices: [
      opt('fair', ['Write every name, friends included', 'Arkadaşlar dahil herkesi yaz'], (c) => {
        nudgeGrades(c, 3);
        return out(c, { sma: 1, hap: -2 }, 'You wrote eleven names, including your best friend. The teacher was impressed. Your friends were not.', 'On bir isim yazdın, en yakın arkadaşın dahil. Öğretmen etkilendi. Arkadaşların etkilenmedi.');
      }),
      opt('soft', ['Write nobody and enjoy the chaos', 'Kimseyi yazma, kaosun tadını çıkar'], (c) =>
        out(c, { hap: 4 }, 'You wrote nobody. A paper aeroplane hit the teacher on her way back in. You were never monitor again.', 'Kimseyi yazmadın. Öğretmen içeri girerken bir kâğıt uçak ona çarptı. Bir daha başkan vekili olmadın.'),
      ),
      opt('self', ['Write your own name first, for fairness', 'Adalet için önce kendi adını yaz'], (c) =>
        out(c, { hap: 2, sma: 1 }, 'You wrote your own name for "talking while writing names". The class has never respected anyone more.', '"İsim yazarken konuştuğun için" kendi adını yazdın. Sınıf hiç kimseye bu kadar saygı duymamıştı.'),
      ),
    ],
  },
  {
    id: 'base.ys_substitute',
    category: 'school',
    minAge: 8,
    maxAge: 15,
    once: true,
    when: inSchool,
    title: tt('There is a substitute teacher today.', 'Bugün dersimize başka bir öğretmen girecek.'),
    text: tt('The class plans to drop their pencils all at once at quarter past.', 'Sınıf, çeyrek geçe herkesin aynı anda kalemini düşürmesini planlıyor.'),
    choices: [
      opt('join', ['Drop your pencil with everyone', 'Herkesle birlikte kalemini düşür'], (c) =>
        out(c, { hap: 4 }, 'Thirty pencils hit the floor. The substitute did not even look up. Somehow that was worse.', 'Otuz kalem yere düştü. Öğretmen başını bile kaldırmadı. Nedense bu daha kötüydü.'),
      ),
      opt('two', ['Drop two pencils, one second late', 'Bir saniye geç, iki kalem düşür'], (c) =>
        out(c, { hap: 3 }, 'Your two pencils clattered alone in the silence. Everyone turned. A star was born.', 'İki kalemin sessizlikte tek başına takırdadı. Herkes döndü. Bir yıldız doğdu.'),
      ),
      opt('help', ['Help the substitute instead', 'Onun yerine öğretmene yardım et'], (c) => {
        nudgeGrades(c, 4);
        return out(c, { sma: 2, hap: -1 }, 'You showed the substitute where everything was. They wrote "very helpful" on a note. Your classmates wrote something else.', 'Öğretmene her şeyin yerini gösterdin. Notuna "çok yardımsever" yazdı. Sınıf arkadaşların başka bir şey yazdı.');
      }),
    ],
  },
  {
    id: 'base.ys_copied',
    category: 'school',
    minAge: 9,
    maxAge: 16,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: (c) => c.t(`The teacher thinks you copied from ${nmc(c, 'kid')}.`, `Öğretmen ${nmc(c, 'kid', 'abl')} kopya çektiğini düşünüyor.`),
    text: (c) => c.t(`Your answers are identical. But it was ${nmc(c, 'kid')} who copied from you.`, `Cevaplarınız birebir aynı. Ama aslında kopyayı ${nmc(c, 'kid')} senden çekti.`),
    choices: [
      opt('truth', ['Tell the truth', 'Doğruyu söyle'], (c) =>
        gamble(
          c,
          0.6,
          (c) => {
            nudgeGrades(c, 2);
            return out(c, { hap: 3 }, `The teacher checked your rough work and believed you. ${nmc(c, 'kid')} got the zero.`, `Öğretmen karalama kâğıtlarına bakıp sana inandı. Sıfırı ${nmc(c, 'kid')} aldı.`);
          },
          (c) => {
            nudgeGrades(c, -4);
            return out(c, { hap: -4 }, 'The teacher said "that is what they all say". You both got zero.', 'Öğretmen "Hepiniz aynısını söylüyorsunuz" dedi. İkiniz de sıfır aldınız.');
          },
        ),
      ),
      opt('cover', ['Take the blame together', 'Suçu birlikte üstlenin'], (c) => {
        befriend(c, 'kid', 60);
        nudgeGrades(c, -3);
        return out(c, { hap: -1 }, `You both got a warning. ${nmc(c, 'kid')} never forgot it and became a loyal friend.`, `İkiniz de uyarı aldınız. ${nmc(c, 'kid')} bunu hiç unutmadı ve sadık bir arkadaşın oldu.`);
      }),
      opt('prove', ['Offer to redo the test on the spot', 'Sınavı hemen yeniden çözmeyi teklif et'], (c) =>
        c.p.stats.smarts >= 50
          ? (nudgeGrades(c, 6), out(c, { sma: 2, hap: 5 }, 'You redid the test in front of the teacher and got a higher mark. She apologised. Teachers never apologise.', 'Sınavı öğretmenin önünde yeniden çözdün ve daha yüksek not aldın. Özür diledi. Öğretmenler özür dilemez.'))
          : (nudgeGrades(c, -2), out(c, { hap: -3 }, 'You redid the test and got a lower mark. That did not help your case.', 'Sınavı yeniden çözdün ve daha düşük aldın. Davana pek yardımı olmadı.')),
      ),
    ],
  },
  {
    id: 'base.ys_new_kid',
    category: 'school',
    minAge: 7,
    maxAge: 16,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: (c) => c.t(`A new student, ${nmc(c, 'kid')}, is eating lunch alone.`, `Yeni gelen öğrenci ${nmc(c, 'kid')} öğle yemeğini tek başına yiyor.`),
    text: tt('They moved here from another city last week.', 'Geçen hafta başka bir şehirden taşınmışlar.'),
    choices: [
      opt('sit', ['Sit with them', 'Yanına otur'], (c) => {
        befriend(c, 'kid', 65);
        return out(c, { hap: 4 }, `You sat down and asked about their old city. By the end of lunch, ${nmc(c, 'kid')} was laughing. A friend for years.`, `Yanına oturup eski şehrini sordun. Teneffüs bitmeden ${nmc(c, 'kid')} gülüyordu. Yıllarca sürecek bir arkadaşlık.`);
      }, { tone: 'good' }),
      opt('invite', ['Invite them to your group\'s table', 'Kendi grubunun masasına çağır'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { hap: 3 }, `${nmc(c, 'kid')} joined your table and turned out to be funnier than all of you. Annoying, but great.`, `${nmc(c, 'kid')} masanıza geldi ve hepinizden komik çıktı. Sinir bozucu ama harika.`);
      }),
      opt('later', ['Mean to, but not today', 'Niyetin var ama bugün değil'], (c) =>
        out(c, { hap: -1 }, 'You kept meaning to say hello. By the time you did, they had other friends.', 'Hep merhaba demeyi düşündün. Dediğinde başka arkadaşları olmuştu.'),
      ),
    ],
  },
  {
    id: 'base.ys_quiz_final',
    category: 'school',
    minAge: 9,
    maxAge: 14,
    once: true,
    when: inSchool,
    title: tt('You reached the final of the school quiz.', 'Okulun bilgi yarışmasında finale kaldın.'),
    text: tt('Last question. The whole school is watching. "What is the capital of Australia?"', 'Son soru. Bütün okul izliyor. "Avustralya\'nın başkenti neresidir?"'),
    choices: [
      opt('canberra', ['Canberra', 'Kanberra'], (c) => {
        nudgeGrades(c, 5);
        return out(c, { sma: 3, hap: 6 }, 'Correct! You won a dictionary and a medal. You wore the medal for a week, including in the shower.', 'Doğru! Bir sözlük ve madalya kazandın. Madalyayı bir hafta taktın, duşta bile.');
      }, { tone: 'good' }),
      opt('sydney', ['Sydney', 'Sidney'], (c) =>
        out(c, { hap: -3 }, 'So close. Everyone says Sydney. You will never, ever forget Canberra now.', 'Çok yaklaştın. Herkes Sidney der. Artık Kanberra\'yı asla unutmayacaksın.'),
      ),
      opt('joke', ['"Australia City"', '"Avustralya Şehri"'], (c) =>
        out(c, { hap: 3 }, 'You lost, but the whole hall laughed and the head teacher wrote it in the newsletter.', 'Kaybettin ama bütün salon güldü ve müdür bunu okul bültenine yazdı.'),
      ),
    ],
  },
  {
    id: 'base.ys_sports_day',
    category: 'school',
    minAge: 6,
    maxAge: 12,
    once: true,
    when: inPrimary,
    title: tt('Sports day. You are in the sack race.', 'Spor şenliği. Çuval yarışındasın.'),
    text: tt('Your family is at the finish line with a camera.', 'Ailen bitiş çizgisinde, elinde kamerayla bekliyor.'),
    choices: [
      opt('hop', ['Hop like your life depends on it', 'Hayatın buna bağlıymış gibi zıpla'], (c) =>
        gamble(
          c,
          0.45,
          (c) => out(c, { hap: 6, hea: 1 }, 'You won by a nose. There is a framed photo of it at home, and you look terrifying.', 'Burun farkıyla kazandın. Evde çerçeveli bir fotoğrafı var ve çok korkutucu görünüyorsun.'),
          (c) => out(c, { hap: 1, hea: -1 }, 'You fell three times and finished fifth, still hopping with total dignity.', 'Üç kez düştün ve beşinci oldun; ama sonuna kadar büyük bir onurla zıpladın.'),
        ),
      ),
      opt('wait', ['Wait for a fallen friend', 'Düşen arkadaşını bekle'], (c) =>
        out(c, { hap: 4 }, 'You stopped to help a friend up and you crossed the line together, last. The crowd went wild.', 'Düşen bir arkadaşını kaldırmak için durdun ve çizgiyi birlikte, en son geçtiniz. Seyirciler çıldırdı.'),
        { tone: 'good' },
      ),
      opt('run', ['Step out of the sack and run', 'Çuvaldan çıkıp koş'], (c) =>
        out(c, { hap: 2 }, 'You were first across the line and immediately disqualified. You still count it.', 'Çizgiyi ilk sen geçtin ve hemen diskalifiye oldun. Sen yine de sayıyorsun.'),
      ),
    ],
  },
  {
    id: 'base.ys_school_photo',
    category: 'school',
    minAge: 6,
    maxAge: 13,
    once: true,
    when: inSchool,
    title: tt('School photo day.', 'Okulda fotoğraf günü.'),
    text: tt('The photographer says "big smile!" in the voice of a man who has said it four hundred times today.', 'Fotoğrafçı bugün dört yüzüncü kez söyleyen birinin sesiyle "Kocaman gülümse!" diyor.'),
    choices: [
      opt('smile', ['Give your best smile', 'En güzel gülümsemeni ver'], (c) =>
        out(c, { loo: 1, hap: 2 }, 'You smiled perfectly. Your grandparents ordered eleven copies.', 'Kusursuz gülümsedin. Büyükannenler on bir kopya sipariş etti.'),
      ),
      opt('face', ['Pull a face at the last second', 'Son saniyede surat yap'], (c) =>
        out(c, { hap: 4 }, 'You crossed your eyes at the exact moment. The photo is now a family legend.', 'Tam o anda gözlerini şaşı yaptın. Fotoğraf artık bir aile efsanesi.'),
      ),
      opt('blink', ['Try very hard not to blink', 'Gözünü kırpmamak için çok uğraş'], (c) =>
        aliveKin(c, 'mother')
          ? out(c, { hap: 1 }, 'You did not blink. You looked like you had seen a ghost. Your mother loves it anyway.', 'Gözünü kırpmadın. Hayalet görmüş gibi çıktın. Annen yine de bayılıyor.')
          : out(c, { hap: 1 }, 'You did not blink. You looked like you had seen a ghost. The family loves it anyway.', 'Gözünü kırpmadın. Hayalet görmüş gibi çıktın. Ailen yine de bayılıyor.'),
      ),
    ],
  },
  {
    id: 'base.ys_fire_drill',
    category: 'school',
    minAge: 9,
    maxAge: 16,
    once: true,
    when: inSchool,
    title: tt('The fire alarm goes off in the middle of a maths test.', 'Matematik sınavının ortasında yangın alarmı çaldı.'),
    text: tt('You were on question two of twelve.', 'On iki sorunun ikincisindeydin.'),
    choices: [
      opt('grateful', ['Thank the universe and walk out', 'Evrene şükret ve çık'], (c) =>
        out(c, { hap: 4 }, 'The test was cancelled. You had never loved a fire drill more.', 'Sınav iptal oldu. Bir yangın tatbikatını hiç bu kadar sevmemiştin.'),
      ),
      opt('memorise', ['Memorise the questions on the way out', 'Çıkarken soruları ezberle'], (c) => {
        nudgeGrades(c, 5);
        return out(c, { sma: 2, hap: 2 }, 'You memorised the questions in the playground. When the test came back, you were ready.', 'Soruları bahçede ezberledin. Sınav tekrarlandığında hazırdın.');
      }),
      opt('stay', ['Keep writing, quickly', 'Hızlı hızlı yazmaya devam et'], (c) =>
        out(c, { hap: -2 }, 'A teacher had to physically remove you from your desk. You were on question three.', 'Bir öğretmen seni sıradan zorla kaldırmak zorunda kaldı. Üçüncü sorudaydın.'),
      ),
    ],
  },
  {
    id: 'base.ys_parent_teacher',
    category: 'school',
    minAge: 7,
    maxAge: 15,
    once: true,
    when: (c) => inSchool(c) && hasParent(c),
    setup: (c) => {
      pickParent(c);
      c.vars.g = grades(c);
    },
    title: (c) => c.t(`${Kw(c, 'par')} is meeting your teacher tonight.`, `${Kw(c, 'par')} bu akşam öğretmeninle görüşecek.`),
    text: (c) =>
      Number(c.vars.g) >= 60
        ? c.t('Your grades are good. Your behaviour is… a matter of opinion.', 'Notların iyi. Davranışların… tartışmaya açık.')
        : c.t('Your grades are not great. You have prepared a speech.', 'Notların pek parlak değil. Bir konuşma hazırladın.'),
    choices: [
      opt('go', ['Go along and sit up straight', 'Sen de git, dik otur'], (c) => {
        near(c, 'par', 3);
        return Number(c.vars.g) >= 60
          ? out(c, { hap: 4 }, `The teacher said you were "a joy, when awake". ${Kw(c, 'par')} took you for ice cream.`, `Öğretmen "uyanıkken çok tatlı" bir öğrenci olduğunu söyledi. ${Kw(c, 'par')} seni dondurmaya götürdü.`)
          : (nudgeGrades(c, 4), out(c, { sma: 1, hap: -1 }, 'The teacher was kind but clear. You left with a study plan and a parent who now checks your homework.', 'Öğretmen nazik ama netti. Bir çalışma planıyla ve artık ödevini kontrol eden bir veliyle çıktın.'));
      }),
      opt('speech', ['Give your speech first, at home', 'Konuşmanı önceden, evde yap'], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 1, sma: 1 }, `You explained everything before they could. ${Kw(c, 'par')} said you should be a lawyer. It was not entirely a compliment.`, `Onlar konuşamadan her şeyi anlattın. ${Kw(c, 'par')} avukat olman gerektiğini söyledi. Tam olarak iltifat değildi.`);
      }),
      opt('hide', ['Hide the invitation letter', 'Davet mektubunu sakla'], (c) =>
        gamble(
          c,
          0.3,
          (c) => out(c, { hap: 2 }, 'Nobody found out. You lived the next month in constant fear anyway.', 'Kimse öğrenmedi. Yine de sonraki bir ayı sürekli korku içinde geçirdin.'),
          (c) => {
            near(c, 'par', -5);
            return out(c, { hap: -5 }, `The school phoned. ${Kw(c, 'par')} found the letter in your sock drawer. A long talk followed.`, `Okul aradı. ${Kw(c, 'par')} mektubu çorap çekmecende buldu. Uzun bir konuşma oldu.`);
          },
        ),
        { badge: 'Risky' },
      ),
    ],
  },
  {
    id: 'base.ys_grading_error',
    category: 'school',
    minAge: 11,
    maxAge: 17,
    once: true,
    when: inSchool,
    title: tt('The teacher added up your marks wrong. In your favour.', 'Öğretmen notunu yanlış toplamış. Senin lehine.'),
    text: tt('Twelve extra points. Nobody else has noticed.', 'On iki puan fazladan. Başka kimse fark etmedi.'),
    choices: [
      opt('tell', ['Point it out', 'Söyle'], (c) => {
        nudgeGrades(c, 2);
        return out(c, { sma: 1, hap: 1 }, 'You pointed it out. The teacher fixed it, then quietly gave you three points back for honesty.', 'Söyledin. Öğretmen düzeltti, sonra dürüstlüğün için sessizce üç puan geri verdi.');
      }, { tone: 'good' }),
      opt('keep', ['Say nothing', 'Hiçbir şey söyleme'], (c) => {
        nudgeGrades(c, 4);
        return out(c, { hap: 2 }, 'You kept the points. It felt good for a day and strange for a week.', 'Puanları sakladın. Bir gün iyi, bir hafta tuhaf hissettirdi.');
      }),
      opt('friend', ['Check if a friend got the same mistake', 'Bir arkadaşında da aynı hata var mı bak'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'You found the teacher had made the same mistake on five papers. You told nobody, but you all bought her a plant.', 'Öğretmenin beş kâğıtta aynı hatayı yaptığını buldun. Kimseye söylemediniz ama hep birlikte ona bir saksı çiçeği aldınız.'),
      ),
    ],
  },
  {
    id: 'base.ys_group_project',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: tt('Group project. Your group has done nothing.', 'Grup ödevi. Grubun hiçbir şey yapmadı.'),
    text: (c) => c.t(`It is due Monday. ${nmc(c, 'kid')} has "shared a link".`, `Teslim pazartesi. ${nmc(c, 'kid')} "bir link paylaştı".`),
    choices: [
      opt('all', ['Do the whole thing yourself', 'Hepsini kendin yap'], (c) => {
        nudgeGrades(c, 4);
        return out(c, { sma: 2, hap: -3 }, 'You did it all over the weekend. The group got an A. Everyone said "teamwork!"', 'Bütün hafta sonu hepsini yaptın. Grup en yüksek notu aldı. Herkes "Takım çalışması!" dedi.');
      }),
      opt('call', ['Call a group meeting', 'Grup toplantısı çağır'], (c) =>
        gamble(
          c,
          0.55,
          (c) => {
            befriend(c, 'kid', 45);
            nudgeGrades(c, 3);
            return out(c, { hap: 2, sma: 1 }, `The meeting worked. ${nmc(c, 'kid')} turned out to be great at drawing charts.`, `Toplantı işe yaradı. ${nmc(c, 'kid')} grafik çizmekte çok iyi çıktı.`);
          },
          (c) => out(c, { hap: -2 }, 'Nobody came to the meeting. You ate both biscuits alone, which helped a little.', 'Toplantıya kimse gelmedi. İki bisküviyi tek başına yedin; biraz iyi geldi.'),
        ),
      ),
      opt('tell', ['Tell the teacher who did what', 'Öğretmene kimin ne yaptığını söyle'], (c) => {
        nudgeGrades(c, 2);
        return out(c, { hap: -1 }, 'The teacher graded everyone separately. Fair. Very, very unpopular.', 'Öğretmen herkese ayrı not verdi. Adil. Çok ama çok sevilmeyen bir hareket.');
      }),
    ],
  },
  {
    id: 'base.ys_school_paper',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    once: true,
    when: inSchool,
    title: tt('You joined the school newspaper.', 'Okul gazetesine katıldın.'),
    text: tt('You have a scoop: the canteen has been serving the same soup for three weeks.', 'Elinde bir haber var: kantin üç haftadır aynı çorbayı veriyor.'),
    choices: [
      opt('expose', ['Publish the soup story', 'Çorba haberini yayımla'], (c) =>
        out(c, { sma: 2, hap: 4 }, 'SOUPGATE. The canteen added a second soup. You have tasted power.', 'ÇORBAGATE. Kantin ikinci bir çorba ekledi. Gücün tadını aldın.'),
        { tone: 'good' },
      ),
      opt('interview', ['Interview the canteen staff first', 'Önce kantin çalışanlarıyla röportaj yap'], (c) =>
        out(c, { sma: 3, hap: 2 }, 'The cook explained the budget. Your story became about school funding. A teacher sent it to the local paper.', 'Aşçı bütçeyi anlattı. Haberin okulun bütçesi üzerine bir habere dönüştü. Bir öğretmen onu yerel gazeteye gönderdi.'),
      ),
      opt('horoscope', ['Write the horoscopes instead', 'Onun yerine burç yorumlarını yaz'], (c) =>
        out(c, { hap: 3 }, 'You wrote horoscopes that were oddly specific. "Scorpio: do not trust the soup." Half the school reads them.', 'Tuhaf derecede net burç yorumları yazdın. "Akrep: çorbaya güvenme." Okulun yarısı okuyor.'),
      ),
    ],
  },
  {
    id: 'base.ys_debate',
    category: 'school',
    minAge: 13,
    maxAge: 17,
    once: true,
    when: inHigh,
    title: tt('Debate club: you must argue that homework should be doubled.', 'Münazara kulübü: ödevlerin iki katına çıkması gerektiğini savunman gerekiyor.'),
    text: tt('You believe the exact opposite. The final is on Friday.', 'Tam tersine inanıyorsun. Final cuma günü.'),
    choices: [
      opt('commit', ['Argue it like you mean it', 'İnanmış gibi savun'], (c) =>
        gamble(
          c,
          0.5 + c.p.stats.smarts / 300,
          (c) => out(c, { sma: 3, hap: 5 }, 'You won. Several students now genuinely want more homework. You have created monsters.', 'Kazandın. Birkaç öğrenci artık gerçekten daha fazla ödev istiyor. Canavarlar yarattın.'),
          (c) => out(c, { sma: 2, hap: -1 }, 'You lost narrowly. The judge said you were "persuasive but visibly suffering".', 'Kıl payı kaybettin. Jüri "ikna edici ama gözle görülür biçimde acı çekiyor" dedi.'),
        ),
      ),
      opt('sabotage', ['Argue it so badly you win the other side', 'O kadar kötü savun ki karşı taraf kazansın'], (c) =>
        out(c, { hap: 3 }, 'Your argument was a masterpiece of quiet sabotage. The other side won. The coach knows.', 'Savunman sessiz bir sabotaj şaheseriydi. Karşı taraf kazandı. Hoca biliyor.'),
      ),
      opt('research', ['Research until you change your mind', 'Fikrin değişene kadar araştır'], (c) => {
        nudgeGrades(c, 3);
        return out(c, { sma: 4 }, 'You read so much that you half believe it now. That is the most dangerous thing debate has done to you.', 'O kadar çok okudun ki artık yarı yarıya inanıyorsun. Münazaranın sana yaptığı en tehlikeli şey bu.');
      }),
    ],
  },
  {
    id: 'base.ys_olympiad',
    category: 'school',
    minAge: 11,
    maxAge: 16,
    once: true,
    when: (c) => inSchool(c) && c.p.stats.smarts >= 60,
    title: tt('You have been picked for the regional maths olympiad.', 'Bölge matematik olimpiyatına seçildin.'),
    text: tt('Saturday mornings of training for three months.', 'Üç ay boyunca cumartesi sabahları hazırlık.'),
    choices: [
      opt('train', ['Train every Saturday', 'Her cumartesi çalış'], (c) => {
        nudgeGrades(c, 6);
        return gamble(
          c,
          0.4,
          (c) => out(c, { sma: 5, hap: 6 }, 'You came home with a bronze medal and a new favourite number.', 'Eve bir bronz madalya ve yeni bir en sevdiğin sayıyla döndün.'),
          (c) => out(c, { sma: 4, hap: 1 }, 'No medal, but you solved a problem the trainer could not. He shook your hand like an adult.', 'Madalya yok ama hocanın çözemediği bir soruyu çözdün. Elini bir yetişkinin elini sıkar gibi sıktı.'),
        );
      }, { tone: 'good' }),
      opt('wing', ['Go without training', 'Hazırlanmadan git'], (c) =>
        out(c, { sma: 1, hap: -1 }, 'You opened the paper and recognised nothing, not even the numbers.', 'Kâğıdı açtın ve hiçbir şeyi tanımadın; rakamları bile.'),
      ),
      opt('decline', ['Keep your Saturdays', 'Cumartesilerini koru'], (c) =>
        out(c, { hap: 3 }, 'You said no and spent Saturdays doing nothing in particular. Also important.', 'Hayır dedin ve cumartesileri özellikle hiçbir şey yapmadan geçirdin. Bu da önemli.'),
      ),
    ],
  },
  {
    id: 'base.ys_teacher_gift',
    category: 'school',
    minAge: 7,
    maxAge: 11,
    once: true,
    when: inPrimary,
    title: (c) => c.t('Your class is collecting money for the teacher\'s birthday.', inTr(c) ? 'Sınıf, öğretmenler günü için para topluyor.' : 'Sınıf, öğretmenin doğum günü için para topluyor.'),
    text: tt('You are in charge of choosing the present.', 'Hediyeyi seçmek senin görevin.'),
    choices: [
      opt('mug', ['A mug that says "World\'s Best Teacher"', '"Dünyanın en iyi öğretmeni" yazan bir kupa'], (c) =>
        out(c, { hap: 2 }, 'She already had four of these mugs. She pretended this was the best one.', 'Ondan zaten dört tane vardı. Bunun en güzeli olduğunu söyledi.'),
      ),
      opt('card', ['A giant card everyone signs', 'Herkesin imzaladığı kocaman bir kart'], (c) => {
        nudgeGrades(c, 2);
        return out(c, { hap: 5 }, 'She read every message out loud and cried at the one from the boy who never talks. So did you.', 'Bütün mesajları yüksek sesle okudu ve hiç konuşmayan çocuğun mesajında ağladı. Sen de.');
      }, { tone: 'good' }),
      opt('plant', ['A cactus, for durability', 'Dayanıklılık için bir kaktüs'], (c) =>
        out(c, { hap: 3 }, 'The cactus is still on her desk, years later, and so is the class photo next to it.', 'Kaktüs yıllar sonra hâlâ masasında. Yanında da sınıf fotoğrafınız.'),
      ),
    ],
  },
  {
    id: 'base.ys_detention',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: (c) => c.t(`Detention. The only other person here is ${nmc(c, 'kid')}, the school legend.`, `Ceza saatindesin. Burada bir tek okulun efsanesi ${nmc(c, 'kid')} var.`),
    text: tt('The teacher has fallen asleep behind a newspaper.', 'Hoca bir gazetenin arkasında uyuyakaldı.'),
    choices: [
      opt('talk', ['Whisper to them', 'Fısıldaşın'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { hap: 4 }, `${nmc(c, 'kid')} turned out to love poetry and hate everyone. You have a lot in common.`, `${nmc(c, 'kid')} şiire bayılan ve herkesten nefret eden biri çıktı. Çok ortak noktanız var.`);
      }),
      opt('escape', ['Escape through the window together', 'Pencereden birlikte kaçın'], (c) =>
        gamble(
          c,
          0.5,
          (c) => {
            befriend(c, 'kid', 60);
            return out(c, { hap: 6 }, 'You were never caught. The two of you still say "the window" and laugh.', 'Hiç yakalanmadınız. İkiniz hâlâ "pencere" deyip gülüyorsunuz.');
          },
          (c) => {
            nudgeGrades(c, -4);
            return out(c, { hap: -4 }, 'You landed in the head teacher\'s flowerbed, in front of the head teacher. A week of detention.', 'Müdürün çiçek tarhına, müdürün gözü önünde düştünüz. Bir hafta daha ceza.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('homework', ['Do your homework quietly', 'Sessizce ödevini yap'], (c) => {
        nudgeGrades(c, 3);
        return out(c, { sma: 1 }, 'You finished all your homework. Detention was the most productive hour of your week.', 'Bütün ödevlerini bitirdin. Ceza saati haftanın en verimli saatiydi.');
      }),
    ],
  },
  {
    id: 'base.ys_overnight_trip',
    category: 'school',
    minAge: 12,
    maxAge: 16,
    once: true,
    when: inSchool,
    title: tt('School trip with an overnight stay.', 'Konaklamalı okul gezisi.'),
    text: tt('Lights out was an hour ago. Someone has a torch and a plan.', 'Işıklar bir saat önce söndü. Birinin elinde fener, kafasında bir plan var.'),
    choices: [
      opt('raid', ['Join the midnight snack raid', 'Gece yarısı atıştırmalık baskınına katıl'], (c) =>
        gamble(
          c,
          0.6,
          (c) => out(c, { hap: 6 }, 'You came back with a whole box of breakfast biscuits. You were heroes until breakfast.', 'Koca bir kutu kahvaltılık bisküviyle döndünüz. Kahvaltıya kadar kahramandınız.'),
          (c) => out(c, { hap: -2 }, 'A teacher was waiting in the kitchen in a dressing gown, eating the biscuits. Busted.', 'Bir öğretmen sabahlığıyla mutfakta bekliyordu; bisküvileri yiyordu. Yakalandınız.'),
        ),
      ),
      opt('stories', ['Tell ghost stories', 'Hayalet hikâyeleri anlat'], (c) =>
        out(c, { hap: 4 }, 'Your story was so good that two people moved their beds closer to the door.', 'Hikâyen o kadar iyiydi ki iki kişi yatağını kapıya yaklaştırdı.'),
      ),
      opt('sleep', ['Actually sleep', 'Gerçekten uyu'], (c) =>
        out(c, { hea: 2, hap: 1 }, 'You slept and were the only one awake on the museum tour. You learned a lot about pottery.', 'Uyudun ve müze gezisinde ayakta kalan tek kişi oldun. Çömlekçilik hakkında çok şey öğrendin.'),
      ),
    ],
  },
  {
    id: 'base.ys_dress_code',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    once: true,
    when: inSchool,
    title: tt('The school has banned hoodies.', 'Okul kapüşonluyu yasakladı.'),
    text: tt('The head teacher calls them "a culture of hiding".', 'Müdür buna "saklanma kültürü" diyor.'),
    choices: [
      opt('protest', ['Organise a polite protest', 'Kibar bir protesto düzenle'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 5, sma: 1 }, 'You collected four hundred signatures. Hoodies are allowed on Fridays now. History.', 'Dört yüz imza topladın. Cumaları kapüşonlu serbest. Tarih yazıldı.'),
          (c) => out(c, { hap: -1, sma: 1 }, 'Nothing changed, but the head teacher now knows your name. You are not sure that is good.', 'Hiçbir şey değişmedi ama müdür artık adını biliyor. İyi mi, emin değilsin.'),
        ),
      ),
      opt('scarf', ['Wear a huge scarf instead', 'Onun yerine kocaman bir atkı tak'], (c) =>
        out(c, { hap: 3, loo: 1 }, 'You found the loophole: the scarf. Half the school followed. The rules got longer.', 'Açığı buldun: atkı. Okulun yarısı seni takip etti. Kurallar uzadı.'),
      ),
      opt('obey', ['Comply', 'Uy'], (c) =>
        out(c, { hap: -1 }, 'You complied. Your ears were cold all winter. Your conscience was clean.', 'Uydun. Bütün kış kulakların üşüdü. Vicdanın rahattı.'),
      ),
    ],
  },
  {
    id: 'base.ys_class_clown',
    category: 'school',
    minAge: 10,
    maxAge: 15,
    once: true,
    when: inSchool,
    title: tt('The teacher has turned to the board. You have a perfect joke.', 'Öğretmen tahtaya döndü. Aklına mükemmel bir espri geldi.'),
    text: tt('It is about the teacher. It is very funny.', 'Öğretmenle ilgili. Çok komik.'),
    choices: [
      opt('say', ['Say it', 'Söyle'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 6 }, 'The class exploded. Even the teacher laughed, turned around and said "Good one. Now, page forty."', 'Sınıf koptu. Öğretmen bile güldü, döndü ve "İyiydi. Şimdi, kırkıncı sayfa" dedi.'),
          (c) => {
            nudgeGrades(c, -3);
            return out(c, { hap: -2 }, 'The teacher heard it. You spent break writing "I will respect the learning environment" fifty times.', 'Öğretmen duydu. Teneffüsü elli kez "Öğrenme ortamına saygı göstereceğim" yazarak geçirdin.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('note', ['Write it on a note and pass it', 'Bir kâğıda yazıp ilet'], (c) =>
        out(c, { hap: 3 }, 'The note travelled the whole room. By the time it came back, someone had drawn a picture to go with it.', 'Not bütün sınıfı dolaştı. Sana döndüğünde biri yanına bir de resim çizmişti.'),
      ),
      opt('save', ['Save it for break', 'Teneffüse sakla'], (c) =>
        out(c, { hap: 1, sma: 1 }, 'At break it was only mildly funny. Timing is everything.', 'Teneffüste sadece biraz komikti. Her şey zamanlama.'),
      ),
    ],
  },
  {
    id: 'base.ys_phone_taken',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    once: true,
    when: inSchool,
    setup: (c) => (hasParent(c) ? pickParent(c) : undefined),
    title: tt('The teacher took your phone and put it on her desk.', 'Öğretmen telefonunu alıp masasına koydu.'),
    text: tt('It is face up. It is buzzing. Everyone can see the screen.', 'Ekranı yukarı bakıyor. Titriyor. Herkes ekranı görebiliyor.'),
    choices: [
      opt('beg', ['Beg for it back', 'Geri vermesi için yalvar'], (c) =>
        out(c, { hap: -2 }, 'She gave it back at the end of the day, after a message saying "Did you take your vitamins, my little lamb?" lit up the whole room.', 'Gün sonunda geri verdi; ama ondan önce "Vitaminini aldın mı kuzum?" mesajı bütün sınıfın gözü önünde ekranda belirdi.'),
      ),
      opt('cool', ['Act like you do not care', 'Umursamıyormuş gibi yap'], (c) =>
        out(c, { hap: 2 }, 'You stayed perfectly calm while your group chat buzzed thirty times. People respect that.', 'Grup sohbetin otuz kez titrerken mükemmel bir sakinlikle oturdun. İnsanlar buna saygı duyar.'),
      ),
      opt('silent', ['Learn to put it on silent', 'Sessize almayı öğren'], (c) => {
        nudgeGrades(c, 2);
        return out(c, { sma: 1 }, 'From that day, your phone lived on silent in your bag. Your grades noticed.', 'O günden sonra telefonun çantanda sessizde yaşadı. Notların fark etti.');
      }),
    ],
  },
  {
    id: 'base.ys_chess',
    category: 'school',
    minAge: 8,
    maxAge: 14,
    once: true,
    when: (c) => inSchool(c) && clubOf(c) !== 'chess',
    setup: (c) => newKid(c),
    title: (c) => c.t(`School chess tournament. Your opponent, ${nmc(c, 'kid')}, has a stopwatch and a scary stare.`, `Okulun satranç turnuvası. Rakibin ${nmc(c, 'kid')}, bir kronometre ve korkutucu bir bakışa sahip.`),
    text: tt('You know how all the pieces move. Mostly.', 'Bütün taşların nasıl gittiğini biliyorsun. Aşağı yukarı.'),
    choices: [
      opt('attack', ['Attack with everything', 'Her şeyle saldır'], (c) =>
        gamble(
          c,
          0.35 + c.p.stats.smarts / 300,
          (c) => out(c, { hap: 6, sma: 2 }, 'Checkmate in fourteen moves. The stopwatch was never pressed again.', 'On dört hamlede mat. Kronometreye bir daha basılmadı.'),
          (c) => out(c, { hap: -2, sma: 1 }, 'You lost your queen on move five and the game on move nine. You learned more than in a year of winning.', 'Beşinci hamlede vezirini, dokuzuncu hamlede oyunu kaybettin. Bir yıl kazanmaktan daha çok şey öğrendin.'),
        ),
      ),
      opt('defend', ['Defend and wait for a mistake', 'Savun ve hatayı bekle'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'You defended for an hour. It ended in a draw. You both needed a nap.', 'Bir saat savundun. Berabere bitti. İkinizin de şekerlemeye ihtiyacı vardı.'),
      ),
      opt('chat', ['Make friends with your opponent', 'Rakibinle arkadaş ol'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { hap: 3 }, `You lost, but ${nmc(c, 'kid')} offered to teach you. You play every Thursday now.`, `Kaybettin ama ${nmc(c, 'kid')} sana öğretmeyi teklif etti. Artık her perşembe oynuyorsunuz.`);
      }),
    ],
  },
  {
    id: 'base.ys_assembly_poem',
    category: 'school',
    minAge: 8,
    maxAge: 14,
    once: true,
    when: inSchool,
    title: (c) => c.t('You have been chosen to read a poem at the school assembly.', inTr(c) ? 'Pazartesi töreninde şiir okumak için seçildin.' : 'Okul toplantısında şiir okumak için seçildin.'),
    text: tt('The whole school will be there. So will the microphone that squeals.', 'Bütün okul orada olacak. Cızırdayan mikrofon da.'),
    choices: [
      opt('practise', ['Practise in front of the mirror all week', 'Bütün hafta ayna karşısında çalış'], (c) =>
        out(c, { sma: 1, hap: 5 }, 'You read it with feeling. A teacher dabbed her eyes. The microphone behaved.', 'Duygu dolu okudun. Bir öğretmen gözlerini sildi. Mikrofon da uslu durdu.'),
        { tone: 'good' },
      ),
      opt('fast', ['Read it as fast as possible', 'Olabildiğince hızlı oku'], (c) =>
        out(c, { hap: 1 }, 'You read a four-minute poem in fifty seconds. It was a new genre: express poetry.', 'Dört dakikalık şiiri elli saniyede okudun. Yeni bir tür doğdu: ekspres şiir.'),
      ),
      opt('forget', ['Hope you remember it on the day', 'O gün hatırlarsın diye umut et'], (c) =>
        gamble(
          c,
          0.4,
          (c) => out(c, { hap: 3 }, 'You remembered it. Barely. Nobody knew how close it was.', 'Hatırladın. Zar zor. Kimse ne kadar yaklaştığını anlamadı.'),
          (c) => out(c, { hap: -4 }, 'Line three vanished from your head. You made up the rest. It rhymed, at least.', 'Üçüncü dize kafandan uçtu. Gerisini uydurdun. En azından kafiyeliydi.'),
        ),
      ),
    ],
  },
  {
    id: 'base.ys_love_courier',
    category: 'school',
    minAge: 9,
    maxAge: 13,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: (c) => c.t(`${nmc(c, 'kid')} asks you to deliver a love letter.`, `${nmc(c, 'kid')} senden bir aşk mektubunu iletmeni istiyor.`),
    text: tt('It is sealed with a sticker shaped like a strawberry.', 'Çilek şeklinde bir çıkartmayla kapatılmış.'),
    choices: [
      opt('deliver', ['Deliver it, sealed', 'Kapalı haliyle teslim et'], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 3 }, 'It worked. They held hands at break for nine whole days. You were the best man at the playground wedding.', 'İşe yaradı. Teneffüste koca dokuz gün el ele tutuştular. Bahçedeki düğünde sağdıç sendin.');
      }, { tone: 'good' }),
      opt('read', ['Read it first', 'Önce oku'], (c) =>
        out(c, { hap: 2 }, 'You read it. It rhymed "love" with "glove" four times. You delivered it with a straight face.', 'Okudun. "Aşk"ı dört kez "köşk"le kafiyelemiş. Yüzünü bozmadan teslim ettin.'),
      ),
      opt('lose', ['Accidentally lose it', 'Yanlışlıkla kaybet'], (c) =>
        out(c, { hap: -2 }, 'You lost it in the playground. It was found by the head teacher, who read it at assembly without names.', 'Bahçede kaybettin. Müdür buldu ve isimleri söylemeden törende okudu.'),
      ),
    ],
  },
  {
    id: 'base.ys_lab',
    category: 'school',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: inHigh,
    title: tt('Chemistry lab. The teacher has stepped out.', 'Kimya laboratuvarı. Öğretmen dışarı çıktı.'),
    text: tt('There are two bottles labelled "DO NOT MIX". Your lab partner is curious.', 'İki şişede "KARIŞTIRMAYIN" yazıyor. Laboratuvar arkadaşın meraklı.'),
    choices: [
      opt('mix', ['Mix a drop', 'Bir damla karıştır'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 4, sma: 1 }, 'It turned bright purple and smelled of eggs. Nothing exploded. You were thrilled and slightly disappointed.', 'Parlak mora döndü ve yumurta gibi kokmaya başladı. Hiçbir şey patlamadı. Hem heyecanlandın hem biraz hayal kırıklığına uğradın.'),
          (c) => {
            nudgeGrades(c, -4);
            return out(c, { hea: -2, hap: -2 }, 'It foamed over the bench and set off the alarm. The whole school stood in the car park because of you.', 'Köpürüp tezgâhtan taştı ve alarmı çaldırdı. Bütün okul senin yüzünden otoparkta bekledi.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('read', ['Read the label properly', 'Etiketi düzgünce oku'], (c) => {
        nudgeGrades(c, 3);
        return out(c, { sma: 3 }, 'You looked it up and explained to your partner exactly why not. You get an A in being sensible.', 'Araştırdın ve arkadaşına neden karıştırılmayacağını tam olarak anlattın. Mantıklılıktan tam not.');
      }),
      opt('goggles', ['Put on goggles and let your partner do it', 'Gözlüğü tak, arkadaşın yapsın'], (c) =>
        out(c, { hap: 2 }, 'Your partner mixed it. You watched from a safe distance with your goggles on. Leadership.', 'Arkadaşın karıştırdı. Sen gözlüğünle güvenli mesafeden izledin. Liderlik bu.'),
      ),
    ],
  },
  {
    id: 'base.ys_yearbook',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    when: inHigh,
    // round 7: the yearbook is American; Türkiye has the graduation album, Germany the Abizeitung, Britain the leavers' book
    title: (c) =>
      c.p.countryId === 'tr'
        ? c.t('The graduation album needs a line from you.', 'Mezuniyet albümüne senden de bir söz isteniyor.')
        : c.p.countryId === 'de'
          ? c.t('The Abi newspaper needs your quote.', 'Okulun mezuniyet dergisi için bir söz lazım.')
          : c.p.countryId === 'uk'
            ? c.t("The leavers' book needs your quote.", 'Mezuniyet defteri için bir söz lazım.')
            : c.t('The yearbook needs your quote.', 'Mezuniyet yıllığı için bir söz lazım.'),
    text: tt('It will be printed forever. Your future children will read it.', 'Sonsuza kadar basılı kalacak. Gelecekteki çocukların okuyacak.'),
    choices: [
      opt('deep', ['Something deep and philosophical', 'Derin ve felsefi bir şey'], (c) =>
        out(c, { sma: 1, hap: 2 }, 'You quoted a philosopher you had not read. It looked great. Nobody checked.', 'Hiç okumadığın bir filozoftan alıntı yaptın. Çok iyi durdu. Kimse kontrol etmedi.'),
      ),
      opt('funny', ['A joke only your friends understand', 'Sadece arkadaşlarının anlayacağı bir şaka'], (c) =>
        out(c, { hap: 4 }, '"Remember the bus." Twenty years from now, it will still make five people laugh until they cry.', '"Otobüsü unutma." Yirmi yıl sonra bile beş kişiyi gözlerinden yaş gelene kadar güldürecek.'),
      ),
      opt('thanks', ['Thank your family', 'Ailene teşekkür et'], (c) =>
        out(c, { hap: 3 }, 'You thanked your family by name. Your grandmother cut it out and keeps it in her purse.', 'Ailene isim isim teşekkür ettin. Büyükannen kesip cüzdanında saklıyor.'),
        { tone: 'good' },
      ),
    ],
  },
  {
    id: 'base.ys_bully_start',
    category: 'school',
    minAge: 8,
    maxAge: 14,
    once: true,
    when: (c) => inSchool(c) && !ysPeek(c).bully,
    setup: (c) => newKid(c, 'bully', 2),
    title: (c) => c.t(`${nmc(c, 'bully')} from the year above has decided you are a target.`, `Bir üst sınıftan ${nmc(c, 'bully')} seni hedef seçti.`),
    text: tt('Your bag ended up in the bin twice this week.', 'Bu hafta çantan iki kez çöp kutusunda bulundu.'),
    choices: [
      opt('stand', ['Stand your ground', 'Geri adım atma'], (c) => {
        ys(c).bully = String(c.vars.bully);
        return gamble(
          c,
          0.55,
          (c) => out(c, { hap: 5 }, `You looked ${nmc(c, 'bully', 'dat')} in the eye and said "No." It was so unexpected that it worked.`, `${nmc(c, 'bully', 'gen')} gözünün içine bakıp "Hayır" dedin. O kadar beklenmedikti ki işe yaradı.`),
          (c) => out(c, { hap: -3, hea: -2 }, 'You stood your ground and got pushed into a hedge. But you stood up again, and everyone saw.', 'Geri adım atmadın ve bir çalılığa itildin. Ama yeniden ayağa kalktın ve herkes gördü.'),
        );
      }),
      opt('tell', ['Tell a teacher', 'Bir öğretmene söyle'], (c) => {
        ys(c).bully = String(c.vars.bully);
        return out(c, { hap: 2 }, `The teacher took it seriously. ${nmc(c, 'bully')} got moved to another lunch table. Telling was brave, whatever anyone says.`, `Öğretmen ciddiye aldı. ${nmc(c, 'bully')} başka bir masaya alındı. Söylemek cesaretti; kim ne derse desin.`);
      }, { tone: 'good' }),
      opt('avoid', ['Take the long way home for a while', 'Bir süre eve uzun yoldan git'], (c) => {
        ys(c).bully = String(c.vars.bully);
        return out(c, { hap: -3, hea: 1 }, 'You took the long way for months. You got fit and quiet. It was not fair.', 'Aylarca uzun yoldan gittin. Hem formda hem sessiz biri oldun. Hiç adil değildi.');
      }),
    ],
  },
  {
    id: 'base.ys_teacher_noticed',
    category: 'school',
    minAge: 9,
    maxAge: 15,
    once: true,
    when: (c) => inSchool(c) && !ysPeek(c).teacher,
    setup: (c) => newAdult(c, 'tch', 30, 55),
    title: (c) => c.t(`${teacher(c)} keeps you behind after the lesson.`, `${teacher(c)} dersten sonra seni sınıfta alıkoydu.`),
    text: tt('"I read your story. Did you really write this yourself?"', '"Hikâyeni okudum. Bunu gerçekten kendin mi yazdın?"'),
    choices: [
      opt('yes', ['"Yes. Was it bad?"', '"Evet. Kötü müydü?"'], (c) => {
        ys(c).teacher = String(c.vars.tch);
        nudgeGrades(c, 4);
        return out(c, { sma: 2, hap: 6 }, `"It was wonderful." ${teacher(c)} lent you three books and told you to keep writing. You did.`, `"Harikaydı." ${teacher(c)} sana üç kitap ödünç verdi ve yazmaya devam etmeni söyledi. Devam ettin.`);
      }, { tone: 'good' }),
      opt('shy', ['Mumble and run', 'Bir şeyler geveleyip kaç'], (c) => {
        ys(c).teacher = String(c.vars.tch);
        return out(c, { hap: 2 }, `You ran. The next day there was a note on your desk: "Keep going." You kept the note.`, 'Kaçtın. Ertesi gün sıranda bir not vardı: "Devam et." Notu sakladın.');
      }),
      opt('copy', ['Admit you borrowed the ending', 'Sonunu bir yerden aldığını itiraf et'], (c) =>
        out(c, { sma: 1, hap: -1 }, 'You admitted it. The teacher said the beginning was all yours and better than the ending anyway.', 'İtiraf ettin. Öğretmen başının tamamen senin olduğunu ve zaten sonundan daha iyi olduğunu söyledi.'),
      ),
    ],
  },
  {
    id: 'base.ys_lost_homework',
    category: 'school',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: inPrimary,
    title: tt('You did your homework. Then it disappeared.', 'Ödevini yaptın. Sonra ortadan kayboldu.'),
    text: tt('The teacher is going round the class collecting it.', 'Öğretmen sırayla topluyor.'),
    choices: [
      opt('truth', ['Tell the truth', 'Doğruyu söyle'], (c) =>
        out(c, { hap: -1 }, 'The teacher gave you one day. You redid it on the bus, and it was better the second time.', 'Öğretmen bir gün süre verdi. Otobüste yeniden yaptın; ikincisi daha iyi oldu.'),
      ),
      opt('dog', ['Blame the dog', 'Köpeğe at'], (c) =>
        out(c, { hap: 2 }, 'You do not have a dog. The teacher knew that. She gave you points for creativity and a zero for homework.', 'Köpeğin yok. Öğretmen bunu biliyordu. Yaratıcılığa puan, ödeve sıfır verdi.'),
      ),
      opt('search', ['Search your bag one more time', 'Çantana bir kez daha bak'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 4 }, 'It was folded inside your lunch box, slightly yoghurty. Accepted.', 'Beslenme çantanın içinde katlanmış duruyordu, hafif yoğurtlu. Kabul edildi.'),
          (c) => out(c, { hap: -2 }, 'You found a banana from last week. No homework.', 'Geçen haftadan kalma bir muz buldun. Ödev yok.'),
        ),
      ),
    ],
  },

  // ---------------------------------------------------------------- opened by school activities
  {
    id: 'base.ys_act_teacher',
    category: 'school',
    scheduled: true,
    setup: (c) => newAdult(c, 'tch', 28, 60),
    title: (c) => c.t(`You stay after class to talk to ${teacher(c)}.`, `Ders bitince ${teacher(c)} ile konuşmak için sınıfta kaldın.`),
    text: (c) => (grades(c) >= 60 ? c.t('Your marks are good. You want more.', 'Notların iyi. Daha fazlasını istiyorsun.') : c.t('Your marks could be better. A lot better.', 'Notların daha iyi olabilir. Çok daha iyi.')),
    choices: [
      opt('help', ['Ask for help with the hard topic', 'Zorlandığın konuda yardım iste'], (c) => {
        nudgeGrades(c, 6);
        fx(c, { sma: 3 });
        return sayWith(c, 'ys.teacher.help', T_HELP, tn(c));
      }, { tone: 'good' }),
      opt('extra', ['Ask for an extra project', 'Ek proje iste'], (c) => {
        nudgeGrades(c, 4);
        fx(c, { sma: 2, hap: 1 });
        return sayWith(c, 'ys.teacher.extra', T_EXTRA, tn(c));
      }),
      opt('grade', ['Argue about your last mark', 'Son notuna itiraz et'], (c) =>
        gamble(
          c,
          0.35,
          (c) => {
            nudgeGrades(c, 3);
            return out(c, { hap: 3 }, `You made your case. ${teacher(c)} reread your answer and gave you two more points.`, `Davanı anlattın. ${teacher(c)} cevabını yeniden okudu ve iki puan daha verdi.`);
          },
          (c) => out(c, { hap: -2 }, `${teacher(c)} reread your answer and found another mistake. You lost a point. Lesson learned.`, `${teacher(c)} cevabını yeniden okudu ve bir hata daha buldu. Bir puan kaybettin. Ders alındı.`),
        ),
      ),
      opt('thank', ['Just say thank you for the lesson', 'Sadece ders için teşekkür et'], (c) => {
        fx(c, { hap: 3 });
        return sayWith(c, 'ys.teacher.thank', T_THANK, tn(c));
      }),
    ],
  },
  {
    id: 'base.ys_act_classmate',
    category: 'school',
    scheduled: true,
    setup: (c) => newKid(c),
    title: (c) => c.t(`You end up next to ${nmc(c, 'kid')} in class.`, `Derste ${nmc(c, 'kid', 'gen')} yanına düştün.`),
    text: (c) => c.t(`You have never really talked. ${nmc(c, 'kid')} is drawing something in the margin.`, `Daha önce pek konuşmadınız. ${nmc(c, 'kid')} defterinin kenarına bir şey çiziyor.`),
    choices: [
      opt('ask', ['Ask what they are drawing', 'Ne çizdiğini sor'], (c) => {
        befriend(c, 'kid', 55);
        fx(c, { hap: 4 });
        return sayWith(c, 'ys.mate.ask', M_ASK, who(c, 'kid').firstName);
      }, { tone: 'good' }),
      opt('study', ['Suggest studying together', 'Birlikte ders çalışmayı öner'], (c) => {
        befriend(c, 'kid', 50);
        nudgeGrades(c, 3);
        fx(c, { sma: 2, hap: 2 });
        return sayWith(c, 'ys.mate.study', M_STUDY, who(c, 'kid').firstName);
      }),
      opt('football', ['Invite them to play at break', 'Teneffüste oynamaya çağır'], (c) => {
        befriend(c, 'kid', 50);
        fx(c, { hea: 2, hap: 3 });
        return sayWith(c, 'ys.mate.ball', M_BALL, who(c, 'kid').firstName);
      }),
      opt('quiet', ['Keep to yourself', 'Kendi hâlinde kal'], (c) => {
        fx(c, { sma: 1 });
        return say(c, 'ys.mate.quiet', M_QUIET);
      }),
    ],
  },
  {
    id: 'base.ys_act_bully',
    category: 'school',
    scheduled: true,
    setup: (c) => {
      // the activity only shows with a bully around; opened any other way (an old save, a test), a new one turns up
      // instead of a nameless "?" at the gate
      if (bullyAlive(c)) c.vars.bully = String(ysPeek(c).bully);
      else ys(c).bully = newKid(c, 'bully', 2).id;
    },
    title: (c) => c.t(`${nmc(c, 'bully')} is waiting at the school gate again.`, `${nmc(c, 'bully')} yine okul kapısında bekliyor.`),
    text: tt('You have had enough.', 'Artık yeter.'),
    choices: [
      opt('talk', ['Ask them why', 'Neden yaptığını sor'], (c) =>
        gamble(
          c,
          0.45,
          (c) => {
            befriend(c, 'bully', 35);
            ys(c).bully = undefined;
            return out(c, { hap: 6 }, `${nmc(c, 'bully')} went quiet, then said things were bad at home. You walked home together. It stopped.`, `${nmc(c, 'bully')} sustu, sonra evde işlerin kötü olduğunu söyledi. Eve birlikte yürüdünüz. Bitti.`);
          },
          (c) => out(c, { hap: -2 }, `${nmc(c, 'bully')} laughed at the question. But a little less than usual.`, `${nmc(c, 'bully')} soruya güldü. Ama her zamankinden biraz az.`),
        ),
      ),
      opt('friends', ['Walk past with your friends', 'Arkadaşlarınla birlikte yanından geç'], (c) =>
        hasFriend(c)
          ? out(c, { hap: 4 }, 'You walked out with four friends around you. Nobody said a word. It is harder to pick on a crowd.', 'Etrafında dört arkadaşınla çıktın. Kimse tek kelime etmedi. Kalabalığa sataşmak zordur.')
          : out(c, { hap: -2 }, 'You looked for your friends and found you had not made many yet. You walked past alone, head high.', 'Arkadaşlarını aradın ve henüz pek arkadaş edinmediğini fark ettin. Tek başına, başın dik geçtin.'),
      ),
      opt('teacher', ['Go straight to the head teacher', 'Doğrudan müdüre git'], (c) => {
        ys(c).bully = undefined;
        return out(c, { hap: 3 }, `The head teacher called ${nmc(c, 'bully', 'gen')} parents in. The gate is just a gate again.`, `Müdür ${nmc(c, 'bully', 'gen')} ailesini okula çağırdı. Kapı artık sadece bir kapı.`);
      }, { tone: 'good' }),
      opt('push', ['Push back', 'Sen de it'], (c) =>
        gamble(
          c,
          0.5,
          (c) => {
            ys(c).bully = undefined;
            return out(c, { hap: 4, hea: -1 }, `${nmc(c, 'bully')} fell over a bin in front of everyone. They never came near you again. You both got detention.`, `${nmc(c, 'bully')} herkesin önünde bir çöp kutusuna takılıp düştü. Bir daha yanına yaklaşmadı. İkiniz de ceza aldınız.`);
          },
          (c) => {
            nudgeGrades(c, -3);
            return out(c, { hap: -4, hea: -4 }, 'It went badly. A black eye, a call home and a long talk about better ways.', 'Kötü gitti. Bir morarmış göz, eve bir telefon ve daha iyi yollar üzerine uzun bir konuşma.');
          },
        ),
        { badge: 'Risky' },
      ),
    ],
  },
  ...(['a', 'b'] as const).map((v): EventDef => ({
    id: `base.ys_act_club_${v}`,
    category: 'school',
    scheduled: true,
    title: tt('Club sign-up day.', 'Kulüp kayıt günü.'),
    text: tt('Four tables, four sign-up sheets, four people trying very hard to look cool.', 'Dört masa, dört kayıt listesi, havalı görünmeye çok çalışan dört kişi.'),
    choices: CLUB_SETS[v].map((id) =>
      opt(id, (c) => c.t(`Join ${CLUB_NAME[id][0]}`, `${CLUB_NAME[id][1]} katıl`), (c) => {
        ys(c).club = id;
        const fxs: Record<ClubId, [number, number, number]> = { chess: [3, 0, 2], drama: [1, 0, 4], football: [0, 4, 3], robotics: [3, 0, 2], choir: [1, 0, 4], art: [1, 0, 4] };
        const [sm, he, hp] = fxs[id];
        return out(
          c,
          { sma: sm, hea: he, hap: hp },
          `You joined ${CLUB_NAME[id][0]}. Your first meeting involved biscuits and a lot of enthusiasm.`,
          `${CLUB_NAME[id][1]} katıldın. İlk toplantıda bisküvi ve bolca heves vardı.`,
        );
      }),
    ),
  })),
];

// ------------------------------------------------------------------ activities

const bullyAlive = (c: Ctx) => alive(c, ysPeek(c).bully);

export const youngSchoolActivities: ActivityDef[] = [
  {
    id: 'school_study',
    label: (c) => c.t('Study for school', 'Derslerine çalış'),
    description: (c) => c.t('+Smarts, better grades', '+Zekâ, notlar yükselir'),
    group: SCHOOL_GROUP,
    minAge: 7,
    maxAge: 17,
    jailOk: false,
    available: inSchool,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 3));
      c.h.stat('happiness', -1);
      nudgeGrades(c, 5);
      return c.age < 13 ? say(c, 'ys.study.kid', STUDY_KID) : say(c, 'ys.study.teen', STUDY_TEEN);
    },
  },
  {
    id: 'school_teacher',
    label: (c) => c.t('Talk to a teacher', 'Bir öğretmenle konuş'),
    description: (c) => c.t('Ask for help, argue a mark…', 'Yardım iste, nota itiraz et…'),
    group: SCHOOL_GROUP,
    minAge: 7,
    maxAge: 17,
    jailOk: false,
    available: inSchool,
    hideWhenUnavailable: true,
    run: () => ({ event: 'base.ys_act_teacher' }),
  },
  {
    id: 'school_classmate',
    label: (c) => c.t('Get to know a classmate', 'Bir sınıf arkadaşını tanı'),
    description: (c) => c.t('Maybe a new friend', 'Belki yeni bir arkadaş'),
    group: SCHOOL_GROUP,
    minAge: 6,
    maxAge: 17,
    jailOk: false,
    available: inSchool,
    hideWhenUnavailable: true,
    run: () => ({ event: 'base.ys_act_classmate' }),
  },
  {
    id: 'school_bully',
    label: (c) => c.t('Deal with the bully', 'Zorbayla yüzleş'),
    description: (c) => c.t('Talk, tell, or push back', 'Konuş, söyle ya da karşılık ver'),
    group: SCHOOL_GROUP,
    minAge: 6,
    maxAge: 17,
    jailOk: false,
    available: (c) => inSchool(c) && bullyAlive(c),
    hideWhenUnavailable: true,
    run: () => ({ event: 'base.ys_act_bully' }),
  },
  {
    id: 'school_club',
    label: (c) => c.t('Join a school club', 'Bir okul kulübüne katıl'),
    description: (c) => c.t('Chess, drama, football, robotics…', 'Satranç, tiyatro, futbol, robotik…'),
    group: SCHOOL_GROUP,
    minAge: 8,
    maxAge: 17,
    jailOk: false,
    available: (c) => inSchool(c) && !clubOf(c),
    hideWhenUnavailable: true,
    run: (c) => ({ event: c.s.year % 2 ? 'base.ys_act_club_a' : 'base.ys_act_club_b' }),
  },
  {
    id: 'school_club_go',
    label: (c) => {
      const id = clubOf(c);
      return id ? c.t(CLUB_NAME[id][2], CLUB_NAME[id][3]) : c.t('Go to your club', 'Kulübüne git');
    },
    description: (c) => c.t('+Happiness, and a skill', '+Mutluluk ve bir beceri'),
    group: SCHOOL_GROUP,
    minAge: 8,
    maxAge: 17,
    jailOk: false,
    available: (c) => inSchool(c) && !!clubOf(c),
    hideWhenUnavailable: true,
    run: (c) => {
      const id = clubOf(c)!;
      if (id === 'football') c.h.stat('health', 3);
      else if (id === 'chess' || id === 'robotics') c.h.stat('smarts', 2);
      else c.h.stat('looks', 1);
      c.h.stat('happiness', 3);
      return say(c, `ys.club.${id}`, CLUB_LINES[id]);
    },
  },
  {
    id: 'school_skip',
    label: (c) => c.t('Skip school', 'Okulu kır'),
    description: (c) => c.t('+Happiness, if nobody finds out', '+Mutluluk; tabii kimse öğrenmezse'),
    group: SCHOOL_GROUP,
    minAge: 10,
    maxAge: 17,
    jailOk: false,
    available: inSchool,
    hideWhenUnavailable: true,
    run: (c) => {
      nudgeGrades(c, -4);
      if (c.rng.chance(0.35)) {
        c.h.stat('happiness', -3);
        c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -3));
        return say(c, 'ys.skip.caught', SKIP_CAUGHT);
      }
      c.h.stat('happiness', 5);
      return say(c, 'ys.skip.ok', SKIP_OK);
    },
  },
];
