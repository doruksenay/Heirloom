import { acc, dat, gen, wth } from '../../i18n/tr-grammar';

// Lines for the relative interactions (engine/interactions.ts), written per relationship (playtest 3, problem 2:
// every relative handed out the same twenty proverbs, and "your laugh is my favourite sound" was said to a
// father, a mother, a sibling and a friend). A mother's advice is not a friend's; an argument with a spouse is
// not one with a teenager. Each entry builds one [English, Turkish] pair from the other person's words.

/** The other person: name and English pronouns (Turkish has none). */
export interface W {
  N: string;
  he: string;
  He: string;
  his: string;
  him: string;
  /** The player as the other person's parent: "mum"/"dad", "annesi"/"babası". */
  parEn: string;
  parTr: string;
}
export type Line = [string, string];
export type L = (w: W) => Line;

/** Relationship groups for the pools. */
export type Rel = 'mother' | 'father' | 'grandparent' | 'sibling' | 'love' | 'child' | 'friend';

const says =
  (en: string, tr: string): L =>
  ({ N }) => [`${N} told you: "${en}"`, `${N} dedi ki: "${tr}"`];

// ================================================================ advice

export const ADVICE: Record<string, L[]> = {
  /** A parent or grandparent to a child of 10–12. */
  'grownup:kid': [
    says('If the teacher is angry, look sorry, not cool.', 'Öğretmen kızgınsa havalı değil, mahcup görün.'),
    says('Never lend anyone your good pen.', 'İyi kalemini kimseye ödünç verme.'),
    says('Make friends with the kid who shares snacks.', 'Yiyeceğini paylaşan çocukla arkadaş ol.'),
    says('If you ever see yellow snow, do not eat it.', 'Sarı kar görürsen sakın yeme.'),
    says('Double-knot your shoelaces. Trust me.', 'Ayakkabı bağcığına çift düğüm at. Bana güven.'),
    says('Say sorry first. It is a superpower.', 'Önce sen özür dile. Bu bir süper güç.'),
    says('Brush every tooth as if it owes you money.', 'Dişlerini sana borcu varmış gibi fırçala.'),
    says('If you are scared in the dark, sing. Monsters hate singing.', 'Karanlıkta korkarsan şarkı söyle. Canavarlar şarkıdan nefret eder.'),
    says('Be nice to the new kid. One day the new kid will be you.', 'Yeni gelen çocuğa iyi davran. Bir gün yeni gelen sen olacaksın.'),
    says('Homework first, then football. Football is not going anywhere.', 'Önce ödev, sonra top. Top bir yere kaçmıyor.'),
  ],
  /** A sibling or friend, both children. */
  'peer:kid': [
    says('Never eat the last biscuit. It is a trap.', 'Son bisküviyi asla yeme. Tuzak.'),
    says('Grown-ups cannot see you if you keep very still.', 'Kıpırdamadan durursan büyükler seni göremez.'),
    says('If you want the window seat, call it before you get in the car.', 'Cam kenarını istiyorsan arabaya binmeden önce kap.'),
    says('Never tell the teacher something was easy. Next time it will be harder.', 'Öğretmene kolay olduğunu asla söyleme. Zorlaştırıyorlar.'),
    says('If you hide the vegetables under the rice, nobody checks.', 'Sebzeleri pilavın altına saklarsan kimse bakmaz.'),
    says('Pretend to be asleep in the car and someone carries you in.', 'Arabada uyuyor numarası yaparsan biri seni taşıyarak içeri götürür.'),
    says('Always say you are "nearly done". Nobody checks.', 'Her zaman \'Bitmek üzere\' de. Kimse kontrol etmiyor.'),
  ],
  /** A parent to a teenager. */
  'parent:teen': [
    says("Don't send a message you'd hate to see on a billboard.", 'Bir reklam panosunda görmek istemeyeceğin mesajı kimseye atma.'),
    says('Nobody remembers who was cool at school. Everyone remembers who was kind.', 'Okulda kimin havalı olduğunu kimse hatırlamaz, kimin iyi olduğunu herkes hatırlar.'),
    says('Go to sleep. Whatever it is, it will look smaller in the morning.', 'Yat uyu. Ne olursa olsun, sabah daha küçük görünür.'),
    says("If you're going to be late, call. Lying takes longer.", 'Geç kalacaksan ara. Yalan söylemek daha uzun sürer.'),
    says('Homework first, hair second.', 'Önce ödevin, sonra saçın.'),
    says('Friends who make you feel small are not friends. Just an audience.', 'Seni küçük düşüren arkadaşlar arkadaş değil, seyirci.'),
    says('You can tell me anything. I might shout, but you can tell me.', 'Bana her şeyi anlatabilirsin. Belki bağırırım ama anlatabilirsin.'),
    says('Never get into a car with someone who has had a drink. Call me instead, any hour.', 'İçki içmiş biri kullanıyorsa o arabaya asla binme. Beni ara, saat kaç olursa olsun.'),
  ],
  /** A sibling, friend or sweetheart to a teenager. */
  'peer:teen': [
    says('Never trust anyone with two phones.', 'İki telefonu olan kimseye asla güvenme.'),
    says('Anyone who leaves you on read gets left on read twice.', 'Seni görüldüde bıraktıysa sen onu iki kere bırak.'),
    says('Teachers can smell fear. Walk in like you did the homework.', 'Öğretmenler korkunun kokusunu alır. Ödevi yapmış gibi gir içeri.'),
    says('Never cut your own fringe. I am begging you.', 'Kendi kâkülünü kesme. Yalvarırım.'),
    says('Never trust a quiet group chat. Something is happening in another one.', 'Sessiz bir grup sohbetine asla güvenme. Başka bir grupta bir şeyler dönüyor demektir.'),
    says('Act like you know where you are going. Works everywhere.', 'Nereye gittiğini biliyormuş gibi yürü. Her yerde işe yarar.'),
    says('Do the exam questions you know first. Panic later.', 'Sınavda önce bildiklerini yap. Panik sonra.'),
  ],
  mother: [
    says('Eat something. You look thin.', 'Bir şeyler ye. Zayıflamışsın.'),
    says('Never go to bed angry. Go to bed, wake up, then be angry if you still want to.', 'Küs yatma. Yat, kalk; hâlâ istiyorsan sonra küs.'),
    says('Whatever you do, do it properly or let someone else do it.', 'Ne yaparsan adam gibi yap, yoksa bırak başkası yapsın.'),
    ({ N }) => [`${N} told you to take a cardigan because it would get cold. It was July.`, `${N} "Yanına bir hırka al, akşam serin olur" dedi. Temmuz ayıydı.`],
    says("Don't tell everyone everything. Some things stay at home.", 'Her şeyi herkese anlatma. Bazı şeyler evde kalır.'),
    says('Call when you get home. I do not care how old you are.', 'Eve varınca ara. Kaç yaşında olduğun umurumda değil.'),
    says('Put a little aside every month, even if it is only a little.', 'Her ay biraz kenara koy; azıcık da olsa.'),
    says('If you cannot say something kind, say it to me, not to the people involved.', 'Güzel bir şey söyleyemeyeceksen bana söyle, onlara değil.'),
    says('You can always come home. That is what home is for.', 'Her zaman eve dönebilirsin. Ev bunun için var.'),
    says('Never lend money you want back.', 'Geri isteyeceğin parayı borç verme.'),
    says('Tidy as you cook and you will never face a mountain of dishes.', 'Yemek yaparken topla; o zaman hiçbir zaman bulaşık dağıyla karşılaşmazsın.'),
    ({ N }) => [`${N} said nothing, made you tea and waited. By the second glass you had worked it out yourself.`, `${N} hiçbir şey demedi; çay koydu ve bekledi. İkinci bardakta kendin çözmüştün.`],
  ],
  father: [
    says('Buy cheap, cry twice.', 'Ucuz etin yahnisi yavan olur.'),
    says('Measure twice, cut once.', 'Yedi kere ölç, bir kere biç.'),
    says('Never sign anything you have not read twice.', 'İki kere okumadığın hiçbir şeyi imzalama.'),
    says('Shake hands like you mean it.', 'Tokalaşırken eli sıkı tut.'),
    says('If you borrow a car, give it back with a full tank.', 'Ödünç aldığın arabayı depo dolu geri ver.'),
    says('Do the hard thing first thing in the morning. The rest of the day is a gift.', 'Zor işi sabah ilk iş yap. Günün geri kalanı hediye.'),
    says('A boss who smiles too much is planning a meeting.', 'Çok gülümseyen patron bir toplantı planlıyordur.'),
    says('Respect is earned in small things: being on time, keeping your word.', 'Saygı küçük şeylerle kazanılır: vaktinde gelmek, sözünü tutmak.'),
    ({ N, he, He }) => [`${N} said nothing for a long time, then: "You'll work it out. I did, eventually." ${He} went back to the paper as if ${he} had said nothing.`, `${N} uzun süre sustu, sonra "Bulursun bir yolunu. Ben de buldum, sonunda" dedi. Hiçbir şey dememiş gibi gazetesine döndü.`],
    says('Check the oil. In the car and in life.', 'Yağını kontrol et. Arabanın da hayatın da.'),
    says('Never argue with anyone tired or hungry. Feed first, argue later.', 'Yorgun ya da aç biriyle tartışma. Önce doyur, sonra tartış.'),
    says('Keep the receipt. Of everything.', 'Her şeyin fişini sakla.'),
  ],
  grandparent: [
    says('Do not rush. Another bus always comes after the one you miss.', 'Acele etme. Kaçırdığın otobüsün arkasından hep bir başkası gelir.'),
    says('Your parents were trouble too, you know. Worse than you.', 'Annenle baban da az değildi, bilesin. Senden beterdi.'),
    says('Eat bread with everything. It soaks up the worry.', 'Her şeyi ekmekle ye. Derdi de çeker.'),
    says('Keep a little money in your shoe. I never needed it. I always had it.', 'Ayakkabının içinde biraz para tut. Hiç lazım olmadı ama hep vardı.'),
    says('Be kind to the shopkeeper, the bus driver and the cleaner. Those are the people who see who you really are.', 'Bakkala, şoföre ve temizlikçiye iyi davran. Kim olduğunu en iyi onlar görür.'),
    says('When you are sad, clean a window. You feel better, and so does the window.', 'Canın sıkılınca bir cam sil. Sen de rahatlarsın, cam da.'),
    says('Do not marry for looks. Looks leave. Laughing stays.', 'Güzelliğe bakıp evlenme. Güzellik gider, kahkaha kalır.'),
    says('Learn one song by heart. One day you will need it at a wedding.', 'Bir şarkıyı ezbere öğren. Bir gün bir düğünde lazım olacak.'),
    says('Nobody ever regretted going for a walk.', 'Yürüyüşe çıktığına pişman olan görülmemiştir.'),
    says('Visit the old people while you still can. I am talking about me.', 'Yaşlıları hâlâ buradayken ziyaret et. Kendimden bahsediyorum.'),
    says('Wear a vest. Your kidneys will thank you.', 'Atlet giy. Böbreklerin sana teşekkür edecek.'),
    says('Never leave the house without a handkerchief and an excuse.', 'Evden mendilsiz ve bahanesiz çıkma.'),
  ],
  sibling: [
    says('Whatever it is, tell me before you tell the family.', 'Ne olursa olsun, aileye söylemeden önce bana anlat.'),
    says('You always overthink it. Do the first thing you thought of.', 'Hep fazla düşünüyorsun. Aklına ilk geleni yap.'),
    says('You cannot fix everyone. You can barely fix yourself, and I say that with love.', 'Herkesi düzeltemezsin. Kendini bile zar zor düzeltiyorsun; bunu sevgiyle söylüyorum.'),
    says('Remember when you broke the window and blamed me? Be braver than that.', 'Camı kırıp suçu bana attığın günü hatırlıyor musun? Ondan daha cesur ol.'),
    says('Just ask. The worst answer is no, and you have heard worse from me.', 'Sor gitsin. En kötü ihtimalle hayır derler; benden daha kötüsünü duydun.'),
    says('Stop apologising for things that are not your fault. Save it for the ones that are.', 'Senin suçun olmayan şeyler için özür dilemeyi bırak. Onu suçlu olduğun şeylere sakla.'),
    says('Life is short. Buy the shoes.', 'Hayat kısa. Al o ayakkabıyı.'),
    says('Our parents worried about everything and nothing happened. Worry less.', 'Annemle babam her şey için endişelendi ve hiçbir şey olmadı. Daha az endişelen.'),
    says('You were always the brave one. Act like it.', 'Cesur olan hep sendin. Öyle davran.'),
    ({ N }) => [`${N} listened to the whole thing, then said, "So what are you going to do?" Annoyingly, that helped.`, `${N} her şeyi dinledi, sonra "Peki ne yapacaksın?" dedi. Sinir bozucu bir şekilde, işe yaradı.`],
  ],
  love: [
    says('Stop checking your phone in bed. I mean it this time.', 'Yatakta telefona bakmayı bırak. Bu sefer ciddiyim.'),
    says('You are allowed to say no to people. Practise on me, just not tonight.', 'İnsanlara hayır diyebilirsin. Bende pratik yap; ama bu gece değil.'),
    says('Go and see a doctor about that cough. Not next month. Now.', 'O öksürük için doktora git. Gelecek ay değil, şimdi.'),
    says('You are kinder to strangers than to yourself. Swap that round for a week.', 'Yabancılara kendinden daha iyi davranıyorsun. Bir haftalığına yerlerini değiştir.'),
    says('Whatever you decide, I am on your side. Unless it is a motorbike.', 'Ne karar verirsen ver, senin tarafındayım. Motosiklet değilse.'),
    says('Eat breakfast. You are unbearable without it.', 'Kahvaltı et. Kahvaltısız çekilmiyorsun.'),
    says('You have been talking about it for a year. Do it or let it go.', 'Bir yıldır bundan bahsediyorsun. Ya yap ya bırak.'),
    says('Stop apologising to the furniture when you bump into it. It is a chair.', 'Çarptığın eşyalardan özür dilemeyi bırak. O bir sandalye.'),
    says('Let us not decide anything after nine in the evening.', 'Akşam dokuzdan sonra hiçbir şeye karar vermeyelim.'),
    ({ N, he }) => [`${N} took your face in both hands and said "breathe". It was very good advice, and ${he} knew it.`, `${N} yüzünü iki elinin arasına alıp "Nefes al" dedi. Çok iyi bir öğüttü ve bunu biliyordu.`],
  ],
  friend: [
    says('Never trust anyone with two phones.', 'İki telefonu olan kimseye asla güvenme.'),
    says("Don't sign anything on a Friday.", 'Cuma günü hiçbir şey imzalama.'),
    says('Never go grocery shopping hungry.', 'Markete asla aç karnına gitme.'),
    says('Keep one good coat and one good friend. You have the friend.', 'Bir iyi paltonla bir iyi dostun olsun. Dost hazır.'),
    says('If it costs you your sleep, it costs too much.', 'Uykuna mal oluyorsa, pahalıdır.'),
    says("Reply to the message. Or don't. But decide.", 'Ya cevap yaz ya yazma. Ama bir karar ver.'),
    says('Go. Worst case, it makes a good story.', 'Git. En kötü ihtimalle güzel bir hikâye olur.'),
    says('Leave the party while it is still good.', 'Partiden tam güzelken ayrıl.'),
    says('Say yes more. Not to everything. To more.', 'Daha çok evet de. Her şeye değil. Daha çoğuna.'),
    says('Nobody is thinking about you as much as you think. That is good news.', 'Kimse seni senin sandığın kadar düşünmüyor. Bu iyi haber.'),
    says('Life is too short for bad coffee and people who make you feel small.', 'Hayat, kötü kahveye ve seni küçük düşüren insanlara harcanmayacak kadar kısa.'),
  ],
  /** A grown child to an older parent. */
  child: [
    ({ N }) => [`${N} told you to stop answering calls from numbers you don't know.`, `${N} bilinmeyen numaralardan gelen aramalara artık cevap vermemeni söyledi.`],
    says('Please use the phone I set up for you. It also makes calls.', 'Kurduğum telefonu kullan lütfen. Arama da yapabiliyor.'),
    says('Rest more. You have done enough for everyone.', 'Biraz dinlen. Herkes için yeterince şey yaptın.'),
    says("Don't climb ladders any more. Call me. I will come and climb it badly.", 'Artık merdivene çıkma. Beni ara; gelip ben beceriksizce çıkarım.'),
    says('You can tell me when something is wrong. You taught me that.', 'Bir şey olunca bana söyleyebilirsin. Bunu bana sen öğrettin.'),
    says('Write the old stories down. I want to read every one to my own kids.', 'Eski hikâyeleri yaz. Kendi çocuklarım için istiyorum.'),
    says('Take the holiday. The house will not fall down without you.', 'Tatile çık. Ev sensiz yıkılmaz.'),
    says('Stop giving us money. We are fine. Buy yourself something.', 'Bize para vermeyi bırak. İyiyiz. Kendine bir şey al.'),
  ],
  /** Friends and siblings once the player is 65 or older. */
  'peer:elder': [
    says("Walk every day, even if it's only to the bakery.", 'Her gün yürü, fırına kadar bile olsa.'),
    says('Write the recipes down while you still remember.', 'Tarifleri unutmadan bir yere yaz.'),
    says('Stop reading the obituaries first.', 'Gazetede önce vefat ilanlarına bakmayı bırak.'),
    says('Spend it. The grandchildren will be fine.', 'Harca gitsin. Torunlar idare eder.'),
    says('Say yes to every invitation. Fewer come every year.', 'Her davete evet de. Her yıl biraz daha azalıyorlar.'),
    says('Get the hearing aid. Pride is deaf too.', 'O işitme cihazını tak. Gurur da sağırdır.'),
    says('Never tell the doctor everything at once. Save some for the next visit.', 'Doktora her şeyi bir kerede anlatma. Bir sonraki muayeneye de bir şey kalsın.'),
  ],
};

// ================================================================ arguments

const forgettable: L = ({ N }) => [`You argued with ${N} about something neither of you will remember next week.`, `${wth(N)} haftaya ikinizin de hatırlamayacağı bir şey yüzünden tartıştınız.`];

export const ARGUE: Record<string, L[]> = {
  baby: [
    ({ N }) => [`You tried to argue with ${N} about bedtime. ${N} won without saying a word.`, `${wth(N)} yatma saati konusunda tartışmaya çalıştın. ${N} tek kelime etmeden kazandı.`],
    ({ N }) => [`You and ${N} had a standoff over a spoonful of peas. The peas lost.`, `${wth(N)} bir kaşık bezelye yüzünden inatlaştınız. Kaybeden bezelyeler oldu.`],
    ({ N }) => [`You told ${N} "no". ${N} said "no" back, louder. It is ${N}'s favourite word now.`, `${dat(N)} "Hayır" dedin. ${N} daha yüksek sesle "Hayır" dedi. Artık en sevdiği kelime bu.`],
    ({ N }) => [`You and ${N} disagreed about whether socks are necessary. ${N} removed both, twice.`, `${wth(N)} çorabın gerekli olup olmadığı konusunda anlaşamadınız. ${N} ikisini de çıkardı, iki kez.`],
  ],
  'kid:grown': [
    forgettable,
    ({ N }) => [`You argued with ${N} about bedtime. You lost, but you lost slowly.`, `${wth(N)} yatma saati yüzünden tartıştın. Kaybettin ama yavaş yavaş kaybettin.`],
    ({ N }) => [`You and ${N} had a standoff over a plate of broccoli. The broccoli is still there.`, `${wth(N)} bir tabak brokoli yüzünden inatlaştınız. Brokoli hâlâ orada.`],
    ({ N, He }) => [`You told ${N} it was "not fair". ${He} agreed it was not fair and changed nothing.`, `${dat(N)} bunun "haksızlık" olduğunu söyledin. Haksızlık olduğunu kabul etti ve hiçbir şeyi değiştirmedi.`],
    ({ N }) => [`You argued with ${N} about tidying your room. You pushed everything under the bed. Technically tidy.`, `${wth(N)} odanı toplama meselesini tartıştın. Her şeyi yatağın altına tıktın. Teknik olarak toplu.`],
    ({ N }) => [`You stamped your feet at ${N} over screen time. The stamping was excellent. The screen stayed off.`, `Ekran süresi yüzünden ${N} karşısında tepindin. Tepinmen harikaydı. Ekran yine de kapalı kaldı.`],
    ({ N }) => [`You announced you were running away. ${N} offered to pack you a sandwich. You stayed.`, `Evden kaçacağını ilan ettin. ${N} sana sandviç hazırlamayı teklif etti. Kaldın.`],
    ({ N }) => [`You won the argument with ${N} about not wearing a coat. You also won a cold.`, `${wth(N)} mont giymeme tartışmasını kazandın. Bir de nezle kazandın.`],
  ],
  'kid:peer': [
    forgettable,
    ({ N }) => [`You and ${N} argued about whose turn it was. It was nobody's turn.`, `${wth(N)} sıranın kimde olduğu yüzünden kavga ettiniz. Sıra kimsede değildi.`],
    ({ N }) => [`You and ${N} fought over the TV remote until a grown-up confiscated it.`, `${wth(N)} kumanda için kavga ettiniz; sonunda bir büyük gelip kumandaya el koydu.`],
    ({ N }) => [`You and ${N} fought over the front seat. You both ended up in the back.`, `${wth(N)} ön koltuk için kavga ettiniz. İkiniz de arkaya oturdunuz.`],
    ({ N }) => [`You and ${N} had a fight about who started it. Nobody started it. It started itself.`, `${wth(N)} kimin başlattığı konusunda kavga ettiniz. Kimse başlatmamıştı. Kendi kendine başlamıştı.`],
    ({ N }) => [`You told ${N} you were not best friends any more. By dinner time you were again.`, `${dat(N)} artık en iyi arkadaş olmadığınızı söyledin. Akşam yemeğine kadar yine olmuştunuz.`],
    ({ N }) => [`You and ${N} drew a line down the middle of the room. Then you both needed something on the other side.`, `${wth(N)} odanın ortasından bir çizgi çektiniz. Sonra ikinizin de öbür taraftan bir şey alması gerekti.`],
    ({ N }) => [`You and ${N} stopped speaking for a whole afternoon. It was the longest afternoon of your life.`, `${wth(N)} koca bir öğleden sonra boyunca konuşmadınız. Hayatının en uzun öğleden sonrasıydı.`],
  ],
  'teen:parent': [
    forgettable,
    ({ N }) => [`You slammed a door in ${N}'s face. It felt great for four seconds.`, `${gen(N)} yüzüne kapıyı çarptın. Dört saniye boyunca harika hissettirdi.`],
    ({ N }) => [`You and ${N} argued about your curfew. You won an extra half hour and then came home an hour late.`, `${wth(N)} eve dönüş saatini tartıştınız. Yarım saat fazladan kopardın, sonra bir saat geç geldin.`],
    ({ N }) => [`${N} said you were "not going out dressed like that". You went out dressed like that, under a coat.`, `${N} "O kılıkla dışarı çıkmıyorsun" dedi. O kılıkla çıktın; üstüne bir mont giyerek.`],
    ({ N }) => [`You told ${N} "you just don't understand". ${N} said "try me". You did not try.`, `${dat(N)} "Sen anlamazsın" dedin. "Bir dene" dedi. Denemedin.`],
    ({ N }) => [`${N} asked who your new friends are. You said "people". It did not go well.`, `${N} yeni arkadaşlarının kim olduğunu sordu. "İnsanlar" dedin. İyi gitmedi.`],
    ({ N, his }) => [`You and ${N} argued about your music. You found photos of ${his} hair at your age and won.`, `${wth(N)} dinlediğin müzik yüzünden tartıştınız. Sonra onun senin yaşındayken çekilmiş fotoğraflarını buldun ve kazandın.`],
    ({ N }) => [`You and ${N} fell out over your school report. You blamed the teacher, the timetable and the moon.`, `${wth(N)} karne yüzünden bozuştunuz. Suçu öğretmene, ders programına ve aya attın.`],
    () => ['You refused to come on the family trip. You came. You sulked in the back seat for three hours, beautifully.', 'Aile gezisine gelmeyeceğini söyledin. Geldin. Arka koltukta üç saat boyunca, hakkını vererek surat astın.'],
  ],
  'teen:peer': [
    forgettable,
    ({ N }) => [`You and ${N} fell out over a message that was "obviously a joke."`, `${wth(N)} "belli ki şaka olan" bir mesaj yüzünden bozuştunuz.`],
    ({ N }) => [`You and ${N} argued about who liked the band first. You both liked it first.`, `${wth(N)} o grubu ilk kimin sevdiği konusunda tartıştınız. İkiniz de ilk siz sevmiştiniz.`],
    ({ N }) => [`You stopped talking to ${N} for a week. You both kept watching each other's stories.`, `${wth(N)} bir hafta konuşmadınız. İkiniz de birbirinizin hikâyelerine bakmaya devam ettiniz.`],
    ({ N }) => [`You and ${N} argued about borrowing clothes without asking. The jumper in question is still missing.`, `${wth(N)} sormadan kıyafet almak yüzünden tartıştınız. Söz konusu kazak hâlâ kayıp.`],
    ({ N }) => [`You and ${N} argued about the ending of a film so loudly that the whole bus went quiet.`, `${wth(N)} bir filmin sonu hakkında o kadar yüksek sesle tartıştınız ki bütün otobüs sustu.`],
    ({ N }) => [`You and ${N} had a fight in the group chat. Twelve people watched. Nobody has recovered.`, `${wth(N)} grup sohbetinde kavga ettiniz. On iki kişi izledi. Kimse kendine gelemedi.`],
    ({ N, his }) => [`You told ${N} ${his} secret was safe with you. It was not. You are working on it.`, `${dat(N)} sırrının sende güvende olduğunu söylemiştin. Değildi. Üzerinde çalışıyorsun.`],
  ],
  parent: [
    forgettable,
    ({ N }) => [`You and ${N} argued about politics at dinner. Dessert was cancelled.`, `${wth(N)} akşam yemeğinde siyaset tartıştınız. Tatlı iptal edildi.`],
    ({ N }) => [`${N} asked why you never visit. You pointed out that you were standing in the kitchen.`, `${N} neden hiç uğramadığını sordu. O sırada mutfağında durduğunu hatırlattın.`],
    ({ N, he }) => [`${N} commented on your job, your hair and your car, in that order. You left before ${he} reached your shoes.`, `${N} önce işine, sonra saçına, sonra arabana laf etti. Sıra ayakkabılarına gelmeden kalktın.`],
    ({ N, He }) => [`You and ${N} argued about the thermostat. ${He} has been winning this one for decades.`, `${wth(N)} kombinin derecesi yüzünden tartıştınız. Bu tartışmayı yıllardır o kazanıyor.`],
    ({ N }) => [`You told ${N} you are an adult now. ${N} said "then act like one" and put more food on your plate.`, `${dat(N)} artık yetişkin olduğunu söyledin. "O zaman öyle davran" dedi ve tabağına yemek koydu.`],
    ({ N }) => [`You and ${N} argued about an old family story. You were both there and you both remember it differently.`, `${wth(N)} eski bir aile hikâyesi yüzünden tartıştınız. İkiniz de oradaydınız ve ikiniz de farklı hatırlıyorsunuz.`],
    ({ N }) => [`You and ${N} argued about money. A loan from twenty years ago came up, with interest.`, `${wth(N)} para yüzünden tartıştınız. Yirmi yıl önceki bir borç, faiziyle birlikte gündeme geldi.`],
    ({ N }) => [`${N} gave you advice you had not asked for. You gave some back. Nobody took any.`, `${N} sana istemediğin bir öğüt verdi. Sen de ona bir tane verdin. Kimse kimseninkini dinlemedi.`],
    ({ N }) => [`You and ${N} argued about how to fold a towel. It is a family matter with deep roots.`, `${wth(N)} havlunun nasıl katlanacağını tartıştınız. Kökleri derinlere uzanan bir aile meselesi.`],
  ],
  grandparent: [
    forgettable,
    ({ N }) => [`${N} said young people today have it easy. You mentioned your rent. ${N} said "in my day", and the rest is history.`, `${N} bugünün gençlerinin rahat olduğunu söyledi. Kiranı söyledin. ${N} "Bizim zamanımızda" diye başladı; gerisi tarih.`],
    ({ N }) => [`You and ${N} argued about politics. ${N} was arguing about politics before today's parties existed.`, `${wth(N)} siyaset tartıştınız. ${N}, bugünkü partiler kurulmadan önce de siyaset tartışıyordu.`],
    ({ N }) => [`${N} said your jeans had holes in. You said that was the point. ${N} offered to mend the holes anyway.`, `${N} kotunun yırtık olduğunu söyledi. Öyle olması gerektiğini anlattın. ${N} yine de dikmeyi teklif etti.`],
    ({ N, his }) => [`You argued with ${N} about taking ${his} pills. ${N} won by pretending not to hear.`, `${wth(N)} ilaçlarını içmesi konusunda tartıştın. ${N} duymuyormuş gibi yaparak kazandı.`],
    ({ N }) => [`You told ${N} to stop climbing on chairs. ${N} told you to mind your own business, then climbed on a chair.`, `${dat(N)} sandalyelere çıkmayı bırakmasını söyledin. ${N} sana karışmamanı söyledi, sonra bir sandalyeye çıktı.`],
    ({ N }) => [`You and ${N} disagreed about salt. ${N} believes salt is a food group.`, `${wth(N)} tuz konusunda anlaşamadınız. ${N}, tuzun ayrı bir besin grubu olduğuna inanıyor.`],
  ],
  sibling: [
    forgettable,
    ({ N }) => [`You and ${N} argued about who forgot whose birthday first. It goes back decades.`, `${wth(N)} ilk kimin kimin doğum gününü unuttuğunu tartıştınız. Mesele on yıllar öncesine dayanıyor.`],
    ({ N, him }) => [`You brought up the time ${N} broke your bike. ${N} brought up the time you blamed ${him} for the window.`, `${gen(N)} bisikletini kırdığı günü açtın. O da camı kırıp suçu ona attığın günü açtı.`],
    ({ N }) => [`You and ${N} argued about who was the favourite. You were both very sure, and opposite.`, `${wth(N)} evin gözdesinin kim olduğunu tartıştınız. İkiniz de çok emindiniz; ama tam tersinden.`],
    ({ N, him, he }) => [`You and ${N} fell out over money you lent ${him} and ${he} remembers as a gift.`, `${wth(N)}, ona borç verdiğin ama onun hediye diye hatırladığı para yüzünden bozuştunuz.`],
    ({ N }) => [`You and ${N} argued in the family group chat. Everyone else replied with one thumbs-up, which made it worse.`, `${wth(N)} aile grubunda tartıştınız. Ailenin geri kalanı tek bir başparmak emojisiyle cevap verdi; daha da kötü oldu.`],
    ({ N }) => [`You and ${N} argued about a board game from your childhood. The rules have been in dispute for thirty years.`, `${wth(N)} çocukluğunuzdan kalma bir kutu oyunu yüzünden tartıştınız. Kurallar otuz yıldır bir türlü netleşmedi.`],
    ({ N, he }) => [`You told ${N} ${he} sounds exactly like your mother. That ended the conversation.`, `${dat(N)} aynı anneniz gibi konuştuğunu söyledin. Konuşma orada bitti.`],
    ({ N }) => [`You and ${N} argued about who should take the old sofa. Neither of you wanted it. Both of you were offended.`, `${wth(N)} eski kanepeyi kimin alacağını tartıştınız. İkiniz de istemiyordunuz. İkiniz de alındınız.`],
  ],
  love: [
    forgettable,
    ({ N }) => [`You and ${N} argued about how to load the dishwasher. Nobody won.`, `${wth(N)} bulaşık makinesinin nasıl dizileceği konusunda tartıştınız. Kazanan olmadı.`],
    ({ N }) => [`You and ${N} argued about directions. You were both wrong.`, `${wth(N)} yol tarifi yüzünden tartıştınız. İkiniz de yanılıyordunuz.`],
    ({ N }) => [`You and ${N} argued about the thermostat. One of you is always cold. It is always the same one.`, `${wth(N)} kombinin derecesini tartıştınız. Biriniz hep üşüyor. Hep aynı kişi.`],
    ({ N }) => [`You and ${N} argued about whose family to visit for the holidays. You compromised by upsetting both.`, `${wth(N)} tatilde kimin ailesine gideceğinizi tartıştınız. İkisini birden kırarak orta yolu buldunuz.`],
    ({ N }) => [`${N} said you never listen. You said "what?" It did not help.`, `${N} onu hiç dinlemediğini söyledi. Sen "Ne?" dedin. Hiç iyi olmadı.`],
    ({ N }) => [`You and ${N} argued about money, then went out to dinner to make up. Which cost money.`, `${wth(N)} para yüzünden tartıştınız, sonra barışmak için yemeğe çıktınız. O da para tuttu.`],
    ({ N }) => [`You and ${N} argued about the TV volume. You turned it down, ${N} turned it up, and a cold war began.`, `${wth(N)} televizyonun sesi yüzünden tartıştınız. Sen kıstın, o açtı; soğuk savaş başladı.`],
    ({ N }) => [`You and ${N} argued about something you said at a dinner party. You maintain it was funny.`, `${wth(N)} bir davette söylediğin bir laf yüzünden tartıştınız. Komik olduğunu savunmaya devam ediyorsun.`],
    ({ N }) => [`You and ${N} fought in whispers so the neighbours would not hear. The neighbours heard the whispering.`, `Komşular duymasın diye ${wth(N)} fısıltıyla kavga ettiniz. Komşular fısıltıyı duydu.`],
    ({ N }) => [`You and ${N} argued about cupboard doors left open. ${N} says you live as if a burglar has just left.`, `${wth(N)} açık bırakılan dolap kapakları yüzünden tartıştınız. ${N}, evde sanki hırsız yeni çıkmış gibi yaşadığını söylüyor.`],
    ({ N }) => [`You and ${N} argued about how to fold the towels. There are two schools of thought, and both live in this house.`, `${wth(N)} havluların nasıl katlanacağını tartıştınız. İki ekol var ve ikisi de bu evde yaşıyor.`],
  ],
  'child:kid': [
    forgettable,
    ({ N }) => [`You argued with ${N} about bedtime. ${N} negotiated like a union leader and got ten minutes.`, `${wth(N)} yatma saati yüzünden tartıştın. ${N} bir sendika lideri gibi pazarlık edip on dakika kopardı.`],
    ({ N, parEn, parTr }) => [`${N} said you are "the meanest ${parEn} in the world". You took it as a sign you are doing it right.`, `${N} senin "dünyanın en kötü ${parTr}" olduğunu söyledi. Bunu doğru yaptığının işareti saydın.`],
    ({ N }) => [`You and ${N} argued about screen time. ${N} cried, you held firm, then you watched one more episode together.`, `${wth(N)} ekran süresi yüzünden tartıştınız. ${N} ağladı, sen direndin; sonra birlikte bir bölüm daha izlediniz.`],
    ({ N }) => [`You told ${N} to tidy up. ${N} tidied by moving everything one metre to the left.`, `${dat(N)} odasını toplamasını söyledin. ${N} her şeyi bir metre sola kaydırarak topladı.`],
    ({ N }) => [`${N} refused to wear a coat. You carried the coat all afternoon. At five, ${N} asked for it.`, `${N} mont giymeyi reddetti. Bütün öğleden sonra montu sen taşıdın. Saat beşte istedi.`],
    ({ N, he, his }) => [`You and ${N} argued about whether ${he} had brushed ${his} teeth. The dry toothbrush gave evidence.`, `${wth(N)} dişlerini fırçalayıp fırçalamadığını tartıştınız. Kupkuru diş fırçası tanıklık etti.`],
    ({ N }) => [`You and ${N} had a standoff over a plate of peas. You both lost.`, `${wth(N)} bir tabak bezelye yüzünden inatlaştınız. İkiniz de kaybettiniz.`],
  ],
  'child:teen': [
    forgettable,
    ({ N, his, He }) => [`You and ${N} argued about ${his} curfew. ${He} came home exactly on time, to make a point.`, `${wth(N)} eve dönüş saatini tartıştınız. Tam zamanında eve geldi; sırf inadına.`],
    ({ N }) => [`${N} slammed a door. You remembered slamming doors at that age and said nothing.`, `${N} kapıyı çarptı. Senin de o yaşta kapı çarptığın aklına geldi; hiçbir şey demedin.`],
    ({ N, his, He }) => [`You and ${N} argued about ${his} phone at dinner. ${He} pointed out that you are always on yours. ${He} had a point.`, `${wth(N)} sofrada telefon yüzünden tartıştınız. Senin de hep telefonda olduğunu söyledi. Haksız da sayılmazdı.`],
    ({ N, his, He }) => [`You asked ${N} who ${his} new friends are. ${He} said "people". You recognised the answer.`, `${dat(N)} yeni arkadaşlarının kim olduğunu sordun. "İnsanlar" dedi. Bu cevabı bir yerden hatırladın.`],
    ({ N }) => [`${N} said "you just don't understand". You understood perfectly, which was the problem.`, `${N} "Sen anlamazsın" dedi. Gayet iyi anlıyordun; sorun da buydu.`],
    ({ N, his, He }) => [`You and ${N} argued about the state of ${his} room. ${He} called it "organised chaos". It was the ordinary kind.`, `${wth(N)} odasının hâli yüzünden tartıştınız. "Düzenli bir kaos" olduğunu söyledi. Sıradan kaostu.`],
    ({ N, He }) => [`You and ${N} fell out over a party you said no to. ${He} will still be bringing it up at your eightieth birthday.`, `İzin vermediğin bir parti yüzünden ${wth(N)} bozuştunuz. Bunu seksenci yaş gününde bile anacak.`],
  ],
  'child:grown': [
    forgettable,
    ({ N, his }) => [`You gave ${N} advice about ${his} job. ${N} said the world has changed. You said people have not.`, `${dat(N)} işiyle ilgili öğüt verdin. ${N} dünyanın değiştiğini söyledi. Sen de insanların değişmediğini.`],
    ({ N }) => [`${N} tried to set up your new phone and ran out of patience in four minutes. You had run out in three.`, `${N} yeni telefonunu kurmaya çalıştı ve dördüncü dakikada sabrı tükendi. Seninki üçüncü dakikada tükenmişti.`],
    ({ N }) => [`You and ${N} argued about politics at a family dinner. Everyone else stared at the food.`, `${wth(N)} bir aile yemeğinde siyaset tartıştınız. Masadaki herkes tabağına baktı.`],
    ({ N, he }) => [`${N} said you never visit. You said ${he} never invites you. You were both right and both a little hurt.`, `${N} hiç gelmediğini söyledi. Sen de seni hiç çağırmadığını. İkiniz de haklıydınız, ikiniz de biraz kırgındınız.`],
    ({ N }) => [`You and ${N} argued about the money ${N} wanted to borrow. You lent it anyway. Of course you did.`, `${wth(N)} senden istediği borç yüzünden tartıştınız. Sonunda yine verdin. Elbette verdin.`],
    ({ N }) => [`You and ${N} argued about a family story. ${N} remembers it as a tragedy. You remember it as a comedy.`, `${wth(N)} bir aile hikâyesi yüzünden tartıştınız. ${N} onu bir trajedi olarak hatırlıyor; sen komedi olarak.`],
    ({ N, his }) => [`You told ${N} how to cook your dish properly. ${N} said ${his} version is better. It was. You will never say so.`, `${dat(N)} senin yemeğinin doğrusunu anlattın. ${N} kendi versiyonunun daha güzel olduğunu söyledi. Öyleydi. Bunu asla söylemeyeceksin.`],
  ],
  friend: [
    forgettable,
    ({ N }) => [`You and ${N} argued about politics at dinner. Dessert was cancelled.`, `${wth(N)} akşam yemeğinde siyaset tartıştınız. Tatlı iptal edildi.`],
    ({ N }) => [`You and ${N} argued about the ending of a film. You both left the café sure you were right.`, `${wth(N)} bir filmin sonunu tartıştınız. İkiniz de haklı olduğunuzdan emin bir şekilde kafeden çıktınız.`],
    ({ N }) => [`You and ${N} argued about football. Your teams have not played each other in years. It does not matter.`, `${wth(N)} futbol tartıştınız. Takımlarınız yıllardır karşılaşmadı. Fark etmiyor.`],
    ({ N }) => [`${N} was forty minutes late again. You argued about it for ten and forgave the other thirty.`, `${N} yine kırk dakika geç kaldı. On dakika tartıştınız, kalan otuzunu affettin.`],
    ({ N }) => [`You and ${N} argued over who paid last time. Apparently you both did.`, `${wth(N)} geçen sefer hesabı kimin ödediğini tartıştınız. Anlaşılan ikiniz de ödemiştiniz.`],
    ({ N }) => [`You and ${N} argued about a holiday plan. The holiday never happened; the argument is still going.`, `${wth(N)} bir tatil planı yüzünden tartıştınız. Tatile hiç gidilmedi; tartışma hâlâ sürüyor.`],
    ({ N, his }) => [`You told ${N} the truth about ${his} new haircut. ${N} told you the truth about your old one.`, `${dat(N)} yeni saçı hakkındaki gerçeği söyledin. O da sana eski saçın hakkındaki gerçeği söyledi.`],
    ({ N }) => [`You and ${N} fell out over a message you sent at midnight. Never send messages at midnight.`, `Gece yarısı attığın bir mesaj yüzünden ${wth(N)} bozuştunuz. Gece yarısı mesaj atılmaz.`],
    ({ N }) => [`You and ${N} argued about which of you is the bad influence. The answer was both.`, `${wth(N)} hanginizin diğerini yoldan çıkardığını tartıştınız. Cevap: ikiniz de.`],
  ],
};

/** The 15% of fights that collapse into laughing. */
export const MAKE_UP: L[] = [
  ({ N }) => [`You started an argument with ${N}, but you both ended up laughing.`, `${wth(N)} tartışma başlattın ama sonunda ikiniz de gülmekten kırıldınız.`],
  ({ N }) => [`You started an argument with ${N} and forgot halfway what it was about. You had tea instead.`, `${wth(N)} tartışma başlattın, yarısında konuyu unuttun. Onun yerine çay içtiniz.`],
  ({ N }) => [`You and ${N} squared up over nothing, then ${N} pulled a face and the whole thing collapsed.`, `${wth(N)} boş yere atıştınız, sonra ${N} bir surat yaptı ve her şey çöktü.`],
  ({ N }) => [`You tried to pick a fight with ${N}. ${N} agreed with everything you said. You had nowhere to go.`, `${wth(N)} kavga çıkarmaya çalıştın. ${N} söylediğin her şeye hak verdi. Gidecek yerin kalmadı.`],
  ({ N }) => [`You argued with ${N} until you both realised you were on the same side. Awkward, then funny.`, `${wth(N)} aynı tarafta olduğunuzu fark edene kadar tartıştınız. Önce tuhaf oldu, sonra komik.`],
];

// ================================================================ compliments

export const COMPLIMENT: Record<Rel, L[]> = {
  mother: [
    ({ N, He, him }) => [`You told ${N} nobody cooks like ${him}. ${He} said it was nothing and packed you leftovers.`, `${dat(N)} kimsenin onun gibi yemek yapamadığını söyledin. "Ne olacak canım" dedi ve sana yemek koydu.`],
    ({ N, He }) => [`You told ${N} you finally understand everything ${N} did for you. ${He} had to sit down.`, `${dat(N)} senin için yaptığı her şeyi artık anladığını söyledin. Oturması gerekti.`],
    ({ N, he, He }) => [`You told ${N} ${he} was right about almost everything. ${He} asked you to put it in writing.`, `${dat(N)} neredeyse her konuda haklı olduğunu söyledin. Yazılı olarak istedi.`],
    ({ N, he, He }) => [`You told ${N} ${he} looks lovely today. ${He} said "this old thing?" and wore it every week after.`, `${dat(N)} bugün çok güzel göründüğünü söyledin. "Bu eski şey mi?" dedi ve sonra her hafta onu giydi.`],
    ({ N, He }) => [`You told ${N} that ${N}'s hugs still fix things. ${He} tested the theory immediately.`, `${dat(N)} sarılmasının hâlâ her şeye iyi geldiğini söyledin. Teoriyi hemen test etti.`],
  ],
  father: [
    ({ N, him, He, his }) => [`You told ${N} you learned how to fix things from watching ${him}. ${He} cleared ${his} throat for a long time.`, `${dat(N)} bir şeyleri tamir etmeyi onu izleyerek öğrendiğini söyledin. Uzun süre boğazını temizledi.`],
    ({ N, he, He }) => [`You told ${N} ${he} tells the best stories. ${He} immediately told you one you have heard forty times.`, `${dat(N)} en güzel hikâyeleri onun anlattığını söyledin. Hemen kırk kez duyduğun birini anlattı.`],
    ({ N, him, He, his }) => [`You told ${N} you are proud of ${him}. ${He} did not know what to do with ${his} hands.`, `${dat(N)} onunla gurur duyduğunu söyledin. Ellerini nereye koyacağını bilemedi.`],
    ({ N, his, He }) => [`You told ${N} ${his} terrible jokes are actually funny. ${He} now tells twice as many.`, `${dat(N)} berbat esprilerinin aslında komik olduğunu söyledin. Artık iki kat sık yapıyor.`],
    ({ N, he }) => [`You told ${N} ${he} is the calmest person you know. ${N} said "someone has to be" and winked.`, `${dat(N)} tanıdığın en sakin insan olduğunu söyledin. "Birinin olması lazım" deyip göz kırptı.`],
  ],
  grandparent: [
    ({ N, he, He }) => [`You told ${N} ${he} makes the best tea in the world. ${He} poured you four more to be sure.`, `${dat(N)} dünyanın en güzel çayını onun demlediğini söyledin. Emin olmak için dört bardak daha doldurdu.`],
    ({ N, his, He }) => [`You told ${N} you love ${his} stories. ${He} started one that lasted until dinner.`, `${dat(N)} hikâyelerine bayıldığını söyledin. Akşam yemeğine kadar süren birine başladı.`],
    ({ N, he }) => [`You told ${N} ${he} looks younger every year. ${N} said "liar" and slipped you some money.`, `${dat(N)} her yıl daha genç göründüğünü söyledin. "Yalancı" dedi ve cebine harçlık sıkıştırdı.`],
    ({ N, his, He }) => [`You told ${N} ${his} hands smell like home. ${He} cupped your face in both hands for a while.`, `${dat(N)} ellerinin ev gibi koktuğunu söyledin. Bir süre yüzünü avuçlarının arasında tuttu.`],
    ({ N, he, He }) => [`You told ${N} ${he} is the cleverest person in the family. ${He} said "obviously" and went back to the crossword.`, `${dat(N)} ailenin en akıllısı olduğunu söyledin. "Tabii ki" dedi ve bulmacasına döndü.`],
  ],
  sibling: [
    ({ N, he }) => [`You told ${N} ${he} turned out better than you expected. It was the nicest thing either of you has ever said.`, `${dat(N)} beklediğinden çok daha iyi biri olduğunu söyledin. Bugüne kadar birbirinize söylediğiniz en güzel şey buydu.`],
    ({ N, him, He }) => [`You told ${N} you would not have survived childhood without ${him}. ${He} said "same" and stole your chips.`, `${dat(N)} o olmasa çocukluğundan sağ çıkamayacağını söyledin. "Aynen" dedi ve patatesini çaldı.`],
    ({ N, he, He }) => [`You told ${N} ${he} was always the brave one. ${He} admitted to being terrified the whole time.`, `${dat(N)} cesur olanın hep o olduğunu söyledin. Aslında hep ödünün koptuğunu itiraf etti.`],
    ({ N, he, He }) => [`You told ${N} ${he} has great taste. ${He} has still never lent you anything.`, `${dat(N)} çok zevkli olduğunu söyledin. Sana hâlâ hiçbir şeyini ödünç vermiyor.`],
    ({ N, his, He }) => [`You told ${N} ${his} laugh sounds exactly like it did when you were kids. ${He} laughed, to check.`, `${dat(N)} kahkahasının hâlâ çocukluğunuzdaki gibi olduğunu söyledin. Kontrol etmek için güldü.`],
  ],
  love: [
    ({ N, he, He, his }) => [`You told ${N} ${he} is the best decision you ever made. ${He} reminded you it was ${his} decision too.`, `${dat(N)} hayatında verdiğin en iyi kararın o olduğunu söyledin. Bunun onun da kararı olduğunu hatırlattı.`],
    ({ N, he, He }) => [`You told ${N} ${he} looks wonderful. ${He} was in pyjamas. You meant it.`, `${dat(N)} harika göründüğünü söyledin. Pijamalarıyla oturuyordu. Ciddiydin.`],
    ({ N, his }) => [`You told ${N} ${his} laugh is your favourite sound in the world.`, `${dat(N)} dünyada en sevdiğin sesin onun kahkahası olduğunu söyledin.`],
    ({ N, him }) => [`You told ${N} you would choose ${him} again. ${N} said "you'd better" and kissed your forehead.`, `${dat(N)} onu yine seçeceğini söyledin. "Seçsen iyi edersin" deyip alnından öptü.`],
    ({ N, he, He }) => [`You told ${N} that ${he} makes ordinary days better. ${He} pretended not to blush.`, `${dat(N)} sıradan günleri güzelleştirdiğini söyledin. Kızarmamış gibi yaptı.`],
    ({ N }) => [`You left ${N} a note on the mirror: "You are lovely." ${N} left one back: "I know. You too."`, `Aynaya ${dat(N)} bir not bıraktın: "Çok tatlısın." O da cevap bıraktı: "Biliyorum. Sen de."`],
  ],
  child: [
    ({ N, him, He, his }) => [`You told ${N} you are proud of ${him}. ${He} rolled ${his} eyes and smiled for the rest of the day.`, `${dat(N)} onunla gurur duyduğunu söyledin. Gözlerini devirdi ve günün geri kalanında gülümsedi.`],
    ({ N, he, He }) => [`You told ${N} ${he} is the funniest person in the family. ${He} has been doing "bits" ever since.`, `${dat(N)} ailenin en komiği olduğunu söyledin. O günden beri durmadan gösteri yapıyor.`],
    ({ N, he, He }) => [`You told ${N} ${he} is braver than you were at that age. ${He} stood a little taller.`, `${dat(N)} o yaşta senden cesur olduğunu söyledin. Biraz daha dik durdu.`],
    ({ N, he }) => [`You told ${N} you love the way ${he} treats people. ${N} said "I learned it from you." You had to leave the room.`, `${dat(N)} insanlara davranışını çok sevdiğini söyledin. "Senden öğrendim" dedi. Odadan çıkman gerekti.`],
  ],
  friend: [
    ({ N, he, He }) => [`You told ${N} ${he} is the friend everyone should have. ${He} said "I know" and paid for the coffee.`, `${dat(N)} herkesin onun gibi bir arkadaşı olması gerektiğini söyledin. "Biliyorum" dedi ve kahveleri ödedi.`],
    ({ N, he, He }) => [`You told ${N} ${he} gives the best advice. ${He} advised you to say that more often.`, `${dat(N)} en iyi tavsiyeleri onun verdiğini söyledin. Bunu daha sık söylemeni tavsiye etti.`],
    ({ N, him, He }) => [`You told ${N} you would trust ${him} with anything. ${He} went quiet, then said, "Same."`, `${dat(N)} ona her konuda güvendiğini söyledin. Bir an sustu, sonra "Ben de sana" dedi.`],
    ({ N, he, He }) => [`You told ${N} ${he} makes every party better. ${He} has been unbearable about it ever since.`, `${dat(N)} her partiyi onun güzelleştirdiğini söyledin. O günden beri çekilmez oldu.`],
    ({ N, He }) => [`You told ${N} you are glad you met. ${He} told you the exact date. You did not know it. ${N} did.`, `${dat(N)} tanıştığınıza çok sevindiğini söyledin. Sana tanıştığınız günün tarihini söyledi. Sen bilmiyordun. O biliyordu.`],
  ],
};

/** Child-voice compliments to a parent or grandparent (the player is 4–12). */
export const COMPLIMENT_KID: L[] = [
  ({ N, he }) => [`You told ${N} ${he} is the best in the whole world, including everyone else's.`, `${dat(N)} bütün dünyanın en iyisi olduğunu söyledin; herkesinkinden de.`],
  ({ N, he, He }) => [`You told ${N} ${he} is stronger than anyone. ${He} carried all the shopping in one go to prove it.`, `${dat(N)} herkesten güçlü olduğunu söyledin. Kanıtlamak için bütün poşetleri tek seferde taşıdı.`],
  ({ N, his, He }) => [`You told ${N} ${his} pancakes are better than a restaurant's. ${He} made more on the spot.`, `${dat(N)} krepinin lokantadakinden güzel olduğunu söyledin. Hemen bir tabak daha yaptı.`],
];

// ================================================================ spending time together (grown-ups)

export const TIME_GROWN: Record<Rel, L[]> = {
  mother: [],
  father: [],
  grandparent: [
    ({ N }) => [`You and ${N} played backgammon. ${N} won and explained why, slowly.`, `${wth(N)} tavla oynadınız. ${N} kazandı ve nedenini yavaş yavaş anlattı.`],
    ({ N }) => [`${N} told you what your parents were like as children. You will use this information wisely.`, `${N} sana annenle babanın çocukken nasıl olduğunu anlattı. Bu bilgiyi akıllıca kullanacaksın.`],
    ({ N, He }) => [`You took ${N} for a drive round the old neighbourhood. ${He} named every shop that used to be there.`, `${acc(N)} eski mahalleye bir tur atmaya götürdün. Orada eskiden olan her dükkânın adını tek tek saydı.`],
    ({ N, he }) => [`You sat with ${N} while ${he} shelled beans and told you about a dance, sixty years ago, and a very handsome stranger.`, `${N} fasulye ayıklarken yanında oturdun; sana altmış yıl önceki bir baloyu ve çok yakışıklı bir yabancıyı anlattı.`],
  ],
  sibling: [
    ({ N }) => [`You and ${N} told childhood stories until you both cried laughing. Nobody else at the table understood a word.`, `${wth(N)} çocukluk hikâyeleri anlatıp gözünüzden yaş gelene kadar güldünüz. Masadaki kimse bir şey anlamadı.`],
    ({ N }) => [`You and ${N} did the same impression of a teacher you both had. It still works.`, `${wth(N)} ikinizin de öğrencisi olduğunuz bir öğretmenin taklidini yaptınız. Hâlâ tutuyor.`],
    ({ N }) => [`You helped ${N} move house. You carried the heavy things; ${N} carried the opinions.`, `${dat(N)} taşınırken yardım ettin. Ağır şeyleri sen taşıdın; fikirleri o.`],
    ({ N }) => [`You and ${N} cooked a dish from your childhood. It tasted almost right. Almost was enough.`, `${wth(N)} çocukluğunuzdan bir yemek pişirdiniz. Tadı neredeyse aynıydı. Neredeyse yetti.`],
    ({ N }) => [`You and ${N} went to a match together and shouted at the same referee.`, `${wth(N)} birlikte maça gittiniz ve aynı hakeme bağırdınız.`],
  ],
  love: [
    ({ N }) => [`You and ${N} slow-danced in the kitchen to a song on the radio.`, `${wth(N)} mutfakta radyodaki bir şarkıyla ağır ağır dans ettiniz.`],
    ({ N }) => [`You and ${N} planned a holiday you will probably never take. It was still lovely.`, `${wth(N)} muhtemelen hiç gitmeyeceğiniz bir tatilin planını yaptınız. Yine de çok güzeldi.`],
    ({ N }) => [`You and ${N} cooked dinner together and nothing burned. A first.`, `${wth(N)} birlikte akşam yemeği yaptınız ve hiçbir şey yanmadı. Bir ilk.`],
    ({ N }) => [`You and ${N} stayed in bed on a Sunday and did the crossword badly.`, `${wth(N)} pazar günü yataktan çıkmadınız ve bulmacayı beceriksizce çözdünüz.`],
    ({ N }) => [`You and ${N} drove off with no destination and found a village with the best bread you have ever eaten.`, `${wth(N)} belli bir yere gitmeden arabaya atladınız ve hayatınızda yediğiniz en güzel ekmeği yapan bir köy buldunuz.`],
    ({ N }) => [`You and ${N} rearranged the living room. Then you put it back. Then you kissed.`, `${wth(N)} salonu yeniden düzenlediniz. Sonra eski hâline getirdiniz. Sonra öpüştünüz.`],
    ({ N }) => [`You and ${N} watched the rain from the window and planned nothing at all.`, `${wth(N)} pencereden yağmuru izlediniz ve hiçbir şey planlamadınız.`],
  ],
  child: [
    ({ N }) => [`${N} took you out to lunch and would not let you pay. You paid for dessert out of pride.`, `${N} seni öğle yemeğine çıkardı ve hesabı ödetmedi. Gururundan tatlıları sen ısmarladın.`],
    ({ N, He }) => [`${N} came round to fix your internet. It took five minutes. ${He} stayed three hours.`, `${N} internetini düzeltmeye geldi. Beş dakika sürdü. Üç saat kaldı.`],
    ({ N, his, He, he }) => [`You and ${N} cooked ${his} favourite childhood meal. ${He} ate as if ${he} were eight.`, `${wth(N)} onun çocukluktan kalma en sevdiği yemeği pişirdiniz. Sekiz yaşındaymış gibi yedi.`],
    ({ N }) => [`You and ${N} went through boxes in the attic and argued about what counts as rubbish.`, `${wth(N)} tavan arasındaki kutuları karıştırdınız ve neyin çöp sayıldığını tartıştınız.`],
    ({ N, he, him }) => [`${N} asked about your life before ${he} was born. You told ${him} a few things. Not everything.`, `${N} o doğmadan önceki hayatını sordu. Birkaç şey anlattın. Hepsini değil.`],
  ],
  friend: [
    ({ N }) => [`You and ${N} went to a concert and sang every word, badly, together.`, `${wth(N)} bir konsere gittiniz ve bütün şarkıları kötü ama birlikte söylediniz.`],
    ({ N }) => [`You and ${N} sat in a café until the staff stacked the chairs on every table around you.`, `${wth(N)} bir kafede, etrafınızdaki masalara sandalyeler kaldırılana kadar oturdunuz.`],
    ({ N }) => [`You and ${N} went for a long walk and talked about everything you would never tell your families.`, `${wth(N)} uzun bir yürüyüşe çıkıp ailelerinize asla anlatmayacağınız her şeyi konuştunuz.`],
    ({ N }) => [`You helped ${N} put together a wardrobe. Three screws were left over. It is still standing. For now.`, `${dat(N)} bir gardırop kurmasına yardım ettin. Üç vida arttı. Hâlâ ayakta. Şimdilik.`],
    ({ N }) => [`You and ${N} tried a new restaurant, both ordered the wrong thing and swapped plates.`, `${wth(N)} yeni bir restoran denediniz; ikiniz de yanlış şeyi söyleyip tabakları değiştirdiniz.`],
  ],
};
/** A grown-up visiting a parent (mother or father). */
const TIME_PARENT: L[] = [
  ({ N, He }) => [`You took ${N} to the market. ${He} haggled for both of you and won.`, `${acc(N)} pazara götürdün. İkiniz adına pazarlık etti ve kazandı.`],
  ({ N, He, he }) => [`You and ${N} looked through the old photo albums. ${He} told you who everyone was, including people you suspect ${he} made up.`, `${wth(N)} eski fotoğraf albümlerine baktınız. Herkesin kim olduğunu anlattı; uydurduğundan şüphelendiğin kişiler dahil.`],
  ({ N, He, he }) => [`You fixed something in ${N}'s house. ${He} stood over you and explained how ${he} would have done it.`, `${gen(N)} evinde bir şey tamir ettin. O başında durup kendisi olsa nasıl yapacağını anlattı.`],
  ({ N }) => [`You had Sunday lunch at ${N}'s. You left with three boxes of leftovers and a jar of something.`, `Pazar öğlen yemeğini ${gen(N)} evinde yedin. Üç kap yemek ve ne olduğu belirsiz bir kavanozla çıktın.`],
  ({ N }) => [`You and ${N} watched the news together and disagreed with it in perfect harmony.`, `${wth(N)} birlikte haberleri izlediniz ve kusursuz bir uyum içinde haberlere itiraz ettiniz.`],
  ({ N, he, He }) => [`${N} taught you a recipe ${he} had never written down. You wrote it down. ${He} said you wrote it wrong.`, `${N} sana hiç yazıya geçirmediği bir tarifi öğretti. Sen yazdın. Yanlış yazdığını söyledi.`],
  ({ N }) => [`You and ${N} drove past the house you grew up in. You both went quiet at exactly the same moment.`, `${wth(N)} büyüdüğün evin önünden geçtiniz. İkiniz de tam aynı anda sustunuz.`],
];
TIME_GROWN.mother = TIME_PARENT;
TIME_GROWN.father = TIME_PARENT;

// ================================================================ gifts (grown-ups)

/** What a grown-up gets: [English, Turkish object as it reads before "hediye ettin"]. */
export const GIFT_ITEMS_GROWN: Line[] = [
  ['a scarf', 'bir atkı'],
  ['a book', 'bir kitap'],
  ['a plant', 'bir saksı çiçeği'],
  ['concert tickets', 'konser bileti'],
  ['a framed photo of you two', 'ikinizin çerçeveli bir fotoğrafını'],
  ['a good bottle of olive oil', 'iyi bir şişe zeytinyağı'],
  ['a cookbook', 'bir yemek kitabı'],
  ['a good fountain pen', 'güzel bir dolma kalem'],
  ['a box of pastries from the good bakery', 'iyi pastaneden bir kutu baklava'],
  ['a jar of mountain honey', 'bir kavanoz dağ balı'],
  ['a warm pair of slippers', 'sıcacık bir çift terlik'],
  ['a thousand-piece jigsaw', 'bin parçalık bir yapboz'],
];

export const GIFT_REACT: Record<Rel, L[]> = {
  mother: [
    ({ He }) => [`${He} said you shouldn't have, then hugged you anyway.`, '"Hiç gerek yoktu" dedi, sonra yine de sana sarıldı.'],
    ({ He, he }) => [`${He} put it somewhere safe. So safe that ${he} will never find it again.`, 'Onu güvenli bir yere kaldırdı. O kadar güvenli ki bir daha asla bulamayacak.'],
    ({ He }) => [`${He} showed it to the neighbours before you had even left.`, 'Sen daha kapıdan çıkmadan komşulara gösterdi.'],
  ],
  father: [
    ({ He, his }) => [`${He} said "what's this for?", then kept it right next to ${his} armchair.`, '"Bu ne için?" dedi; sonra hep koltuğunun yanında tuttu.'],
    ({ He }) => [`${He} said "very nice", nodded, and read the label twice.`, '"Çok güzel" deyip başını salladı ve etiketini iki kez okudu.'],
    ({ He }) => [`${He} asked what it cost, then told you that you had overpaid.`, 'Kaça aldığını sordu, sonra kazıklandığını söyledi.'],
  ],
  grandparent: [
    ({ He, him }) => [`${He} said you shouldn't spend money on ${him} and slipped you twice as much back.`, 'Onun için para harcamamanı söyledi ve cebine iki katını sıkıştırdı.'],
    ({ He }) => [`${He} kept the wrapping paper, folded, for next time.`, 'Ambalaj kâğıdını katlayıp bir dahaki sefere sakladı.'],
    ({ He, he }) => [`${He} held it up to the light, approved, and told you about a present ${he} was given sixty years ago.`, 'Işığa tutup inceledi, beğendi, sonra sana altmış yıl önce aldığı bir hediyeyi anlattı.'],
  ],
  sibling: [
    ({ He }) => [`${He} said "you remembered!" in a tone that suggested you usually don't.`, '"Hatırlamışsın!" dedi; genelde hatırlamadığını ima eden bir tonla.'],
    ({ He, he }) => [`${He} said it was exactly what ${he} wanted. ${He} had already bought one.`, 'Tam istediği şey olduğunu söyledi. Kendisi zaten bir tane almıştı.'],
    ({ He }) => [`${He} said thank you and asked, suspiciously, what you wanted in return.`, 'Teşekkür etti ve şüpheyle karşılığında ne istediğini sordu.'],
  ],
  love: [
    ({ He }) => [`${He} kissed you on the forehead and found it the perfect spot straight away.`, 'Alnından öptü ve hemen ona evde en güzel yeri buldu.'],
    ({ He }) => [`${He} loved it, then asked what you were apologising for.`, 'Çok sevdi, sonra neyin özrü olduğunu sordu.'],
    ({ He, him }) => [`${He} said you know ${him} better than anyone. It was true.`, 'Onu herkesten iyi tanıdığını söyledi. Doğruydu.'],
  ],
  child: [
    ({ He }) => [`${He} said "you didn't have to" and put it where everyone could see it.`, '"Hiç zahmet etmeseydin" dedi ve onu herkesin görebileceği bir yere koydu.'],
    ({ He }) => [`${He} sent you a photo of it in its new home that same evening.`, 'Aynı akşam onu yeni yerinde çekip fotoğrafını yolladı.'],
  ],
  friend: [
    ({ He, he }) => [`${He} said ${he} owes you one. You are keeping count.`, 'Sana borçlu olduğunu söyledi. Sen sayıyorsun.'],
    ({ He }) => [`${He} laughed out loud. It was the right gift.`, 'Kahkahayı bastı. Doğru hediyeydi.'],
    ({ He }) => [`${He} loved it.`, 'Çok sevdi.'],
  ],
};

// ================================================================ the same thing twice in a year

/** A second interaction of the same kind with the same person in one year folds into an "again" line. */
export const AGAIN: Record<string, L[]> = {
  time: [
    ({ N }) => [`Second time with ${N} this year. You picked up exactly where you left off.`, `Bu yıl ${wth(N)} ikinci kez bir araya geldiniz. Tam kaldığınız yerden devam ettiniz.`],
    ({ N, He }) => [`You saw ${N} again. ${He} said "twice in one year?" and looked genuinely pleased.`, `${acc(N)} yine gördün. "Bir yılda iki kere mi?" dedi ve gerçekten sevindi.`],
    ({ N }) => [`Another afternoon with ${N}, just like the last one. That is the whole point.`, `${wth(N)} bir öğleden sonra daha; bir öncekinin aynısı. Bütün mesele de bu.`],
    ({ N }) => [`You and ${N} again. You are becoming a habit, the good kind.`, `Yine ${N} ve sen. Bir alışkanlık oluyorsunuz; iyisinden.`],
  ],
  gift: [
    ({ N, He }) => [`A second present for ${N} this year. ${He} asked if something was wrong. Nothing was; you just saw the perfect thing.`, `Bu yıl ${dat(N)} ikinci hediyeyi aldın. Bir sorun mu var diye sordu. Yoktu; sadece tam ona göre bir şey gördün.`],
    ({ N, He, him }) => [`Another gift for ${N}. ${He} said you are spoiling ${him}. ${He} did not ask you to stop.`, `${dat(N)} bir hediye daha aldın. Onu şımarttığını söyledi. Durmanı da istemedi.`],
    ({ N }) => [`You got ${N} something again. ${N} is running out of shelf space.`, `${dat(N)} yine bir şey aldın. ${gen(N)} rafında yer kalmıyor.`],
  ],
  compliment: [
    ({ N, He }) => [`You complimented ${N} again. ${He} asked what you want.`, `${dat(N)} yine iltifat ettin. Ne istediğini sordu.`],
    ({ N, He }) => [`Twice in one year you told ${N} something kind. ${He} wrote down the date.`, `Bir yıl içinde ikinci kez ${dat(N)} güzel bir şey söyledin. Tarihi bir yere not etti.`],
    ({ N, He }) => [`You said something nice to ${N} again. ${He} pretended to be suspicious and was clearly delighted.`, `${dat(N)} yine güzel bir şey söyledin. Şüphelenmiş gibi yaptı ama belli ki çok sevindi.`],
  ],
  advice: [
    ({ N }) => [`You went back to ${N} for more advice. ${N} asked what you did with the last lot.`, `${dat(N)} yine akıl danışmaya gittin. Geçen seferki öğütleri ne yaptığını sordu.`],
    ({ N, He }) => [`You asked ${N} for advice again. ${He} gave you the same advice, louder.`, `${dat(N)} yine akıl danıştın. Aynı öğüdü bu sefer daha yüksek sesle verdi.`],
    ({ N, He }) => [`Your second consultation with ${N} this year. ${He} is thinking of charging.`, `Bu yıl ${dat(N)} ikinci kez danıştın. Ücret almayı düşünüyor.`],
  ],
  argue: [
    ({ N }) => [`You and ${N} picked the argument up exactly where you left it. Neither of you had changed your mind.`, `${wth(N)} tartışmaya tam kaldığınız yerden devam ettiniz. İkiniz de fikrinizi değiştirmemiştiniz.`],
    ({ N }) => [`Round two with ${N}. Same argument, louder.`, `${wth(N)} ikinci raunt. Aynı tartışma, daha yüksek sesle.`],
    ({ N }) => [`You and ${N} fought again. The family has started taking sides and bringing snacks.`, `${wth(N)} yine kavga ettiniz. Aile taraf tutmaya ve çerez getirmeye başladı.`],
  ],
  story: [
    ({ N }) => [`${N} demanded the same story again. You did the voices better this time.`, `${N} aynı masalı yine istedi. Bu sefer sesleri daha iyi yaptın.`],
    ({ N, He }) => [`Another bedtime story for ${N}. ${He} corrected you twice and was asleep by the third page.`, `${dat(N)} bir masal daha okudun. İki kez seni düzeltti, üçüncü sayfada uyumuştu.`],
  ],
};
