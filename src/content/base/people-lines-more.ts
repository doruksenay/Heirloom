import { abl, acc, dat, gen, wth } from '../../i18n/tr-grammar';
import type { L, Line, Rel, W } from './people-lines';

// Lines for the round-4 interactions (engine/interactions.ts): hug, joke, insult, holiday, cook, ask for help,
// apologise, gossip, play a game, call, introduce your partner. Grown-up targets get lines written for the
// relationship (a mother is not a friend); babies, children and teenagers get lines written for their age, whoever
// they are to you. English uses he/she for a known person, never "they". No line names a relative who may not exist.

/** Life stage of the other person, for the young pools. */
export type Young = 'baby' | 'kid' | 'teen';

/** A line about the player's partner (P) meeting someone (w). */
export type PL = (w: W, P: string) => Line;

// ================================================================ hug

export const HUG_YOUNG: Record<Young, L[]> = {
  baby: [
    ({ N, He }) => [`You hugged ${N}. ${He} grabbed your nose and would not let go.`, `${dat(N)} sarıldın. Burnunu yakaladı ve bir türlü bırakmadı.`],
    ({ N, he }) => [`You cuddled ${N} until ${he} fell asleep on your shoulder.`, `${dat(N)} sarıldın; omzunda uyuyakaldı.`],
    ({ N, He }) => [`You held ${N} close. ${He} purred like a happy kitten.`, `${dat(N)} usulca sarıldın. Mutlu bir yavru kedi gibi mırladı.`],
  ],
  kid: [
    ({ N, He }) => [`You hugged ${N}. ${He} hugged back hard enough to crack a rib.`, `${dat(N)} sarıldın. Öyle sıkı karşılık verdi ki az kalsın kaburgan çatlıyordu.`],
    ({ N, He }) => [`You gave ${N} a hug. ${He} wriggled free, then came back for another.`, `${dat(N)} sarıldın. Kurtulmak için kıpırdandı, sonra bir tane daha almak için geri geldi.`],
    ({ N }) => [`You hugged ${N} and got a sticky cheek for your trouble.`, `${dat(N)} sarıldın; karşılığında yanağına yapış yapış bir şey bulaştı.`],
  ],
  teen: [
    ({ N, He }) => [`You hugged ${N}. ${He} went stiff as a plank and said "okay, okay".`, `${dat(N)} sarıldın. Tahta gibi kaskatı kesildi ve "Tamam, tamam" dedi.`],
    ({ N, He }) => [`You hugged ${N} in public. ${He} checked that nobody from school was watching.`, `Herkesin önünde ${dat(N)} sarıldın. Okuldan kimsenin görmediğinden emin olmak için etrafa baktı.`],
    ({ N, He }) => [`You gave ${N} a quick hug. ${He} pretended to hate it and did not move away.`, `${dat(N)} kısaca sarıldın. Nefret ediyormuş gibi yaptı ama geri çekilmedi.`],
  ],
};

/** The player is a small child (up to 12) hugging someone bigger. */
export const HUG_SMALL: L[] = [
  ({ N, He }) => [`You ran at ${N} and hugged ${N}'s knees. ${He} picked you up and spun you round.`, `Koşup ${gen(N)} bacaklarına sarıldın. Seni kucağına alıp havada döndürdü.`],
  ({ N, He }) => [`You gave ${N} a big, sloppy hug. ${He} pretended to be knocked over.`, `${dat(N)} kocaman, yapış yapış sarıldın. Devriliyormuş gibi yaptı.`],
  ({ N, He }) => [`You hugged ${N} round the middle and would not let go. ${He} walked around the room with you attached.`, `${gen(N)} beline sarıldın ve bırakmadın. Seni üstünde taşıyarak odada dolaştı.`],
];

export const HUG: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You hugged ${N}. ${He} held on longer than you did, like always.`, `${dat(N)} sarıldın. Her zamanki gibi ilk bırakan sen oldun.`],
    ({ N, He }) => [`You hugged ${N}. ${He} smelled of soap and onions, which is to say of home.`, `${dat(N)} sarıldın. Sabun ve soğan kokuyordu; yani ev.`],
    ({ N, He }) => [`You hugged ${N} out of nowhere. ${He} asked if you were ill.`, `Durup dururken ${dat(N)} sarıldın. Hasta olup olmadığını sordu.`],
  ],
  father: [
    ({ N, He, him }) => [`You hugged ${N}. ${He} patted your back three times, which is a lot for ${him}.`, `${dat(N)} sarıldın. Sırtına üç kez vurdu; onun için bu çok fazla.`],
    ({ N, He, his }) => [`You hugged ${N}. ${He} cleared ${his} throat twice and changed the subject to the weather.`, `${dat(N)} sarıldın. İki kez boğazını temizledi ve konuyu havaya getirdi.`],
    ({ N, him }) => [`You hugged ${N} and felt ${him} smile without looking.`, `${dat(N)} sarıldın ve bakmadan gülümsediğini hissettin.`],
  ],
  grandparent: [
    ({ N, He }) => [`You hugged ${N} carefully. ${He} hugged you not carefully at all.`, `${dat(N)} dikkatlice sarıldın. O sana hiç de dikkatli sarılmadı.`],
    ({ N, He }) => [`You hugged ${N}. ${He} said you have grown, although you have not grown in years.`, `${dat(N)} sarıldın. Yıllardır boyun uzamadığı halde "Maşallah, ne kadar büyümüşsün" dedi.`],
    ({ N, he }) => [`You hugged ${N} and ${he} pinched your cheek as if you were still six.`, `${dat(N)} sarıldın; hâlâ altı yaşındaymışsın gibi yanağını sıktı.`],
  ],
  sibling: [
    ({ N, He }) => [`You hugged ${N}. ${He} said "what do you want?" and hugged you back anyway.`, `${dat(N)} sarıldın. "Ne istiyorsun?" dedi ama yine de sarıldı.`],
    ({ N }) => [`You hugged ${N}. It turned into a wrestling match within four seconds, as it always has.`, `${dat(N)} sarıldın. Her zamanki gibi dört saniye içinde güreşe döndü.`],
    ({ N }) => [`You and ${N} hugged at the door for a long time. Neither of you said why.`, `${wth(N)} kapıda uzun uzun sarıldınız. İkiniz de nedenini söylemediniz.`],
  ],
  love: [
    ({ N, He }) => [`You hugged ${N} for no reason at all. ${He} said that is the best reason.`, `Hiçbir sebep yokken ${dat(N)} sarıldın. En güzel sebebin bu olduğunu söyledi.`],
    ({ N }) => [`You and ${N} hugged in the rain like people in a film, then ran for cover like people in real life.`, `${wth(N)} yağmurun altında filmlerdeki gibi sarıldınız, sonra gerçek hayattaki gibi kaçacak yer aradınız.`],
    ({ N, he, He }) => [`You hugged ${N} from behind while ${he} was reading. ${He} turned the page and leaned back into you.`, `${N} kitap okurken arkasından sarıldın. Sayfayı çevirdi ve sana yaslandı.`],
  ],
  child: [
    ({ N, He, his }) => [`You hugged ${N}. ${He} is taller than you now and rests ${his} chin on your head.`, `${dat(N)} sarıldın. Artık senden uzun; çenesini başına yasladı.`],
    ({ N, he }) => [`You hugged ${N} and, for a second, ${he} was small again.`, `${dat(N)} sarıldın; bir saniyeliğine yine küçücük oldu.`],
    ({ N, his }) => [`You hugged ${N} goodbye and watched until ${his} car turned the corner.`, `Vedalaşırken ${dat(N)} sarıldın ve arabası köşeyi dönene kadar arkasından baktın.`],
  ],
  friend: [
    ({ N, He }) => [`You hugged ${N}. ${He} announced it to the whole café.`, `${dat(N)} sarıldın. Bütün kafeye ilan etti.`],
    ({ N }) => [`You hugged ${N} hello, goodbye and once in the middle for no reason.`, `${dat(N)} hem gelirken hem giderken, bir kez de ortada sebepsizce sarıldın.`],
    ({ N, He }) => [`You gave ${N} a hug. ${He} said you are the only one allowed to.`, `${dat(N)} sarıldın. Buna yalnızca senin izinli olduğunu söyledi.`],
  ],
};

// ================================================================ joke

export const JOKE_YOUNG: Record<Young, L[]> = {
  baby: [
    ({ N, He, he }) => [`You made a silly face at ${N}. ${He} laughed so hard ${he} toppled over sideways.`, `${dat(N)} komik bir surat yaptın. Öyle güldü ki yana devrildi.`],
    ({ N }) => [`You pretended to sneeze. ${N} thought it was the funniest thing that has ever happened.`, `Hapşırıyormuş gibi yaptın. ${N} bunun dünyanın en komik şeyi olduğunu düşündü.`],
    ({ N, He }) => [`You put a sock on your hand and made it talk to ${N}. ${He} squealed and tried to eat the sock.`, `Eline bir çorap geçirip ${wth(N)} konuşturdun. Çığlık atıp çorabı yemeye çalıştı.`],
  ],
  kid: [
    ({ N, He }) => [`You told ${N} a joke about a cow. ${He} has been telling it to everyone, wrongly, all week.`, `${dat(N)} bir inek fıkrası anlattın. Bütün hafta herkese yanlış anlattı.`],
    ({ N, He }) => [`You did a knock-knock joke for ${N}. ${He} asked "who's there?" eleven times in a row.`, `${dat(N)} "Tak tak!" şakası yaptın. Üst üste on bir kez "Kim o?" diye sordu.`],
    ({ N }) => [`You told ${N} a joke with a burp in it. Best audience you have ever had.`, `${dat(N)} içinde geğirme geçen bir fıkra anlattın. Hayatının en iyi seyircisiydi.`],
  ],
  teen: [
    ({ N, He }) => [`You told ${N} a joke. ${He} said "that's so bad" and then laughed for a full minute.`, `${dat(N)} bir espri yaptın. "Çok kötü" dedi, sonra tam bir dakika güldü.`],
    ({ N, He }) => [`You sent ${N} a silly picture. ${He} replied with three crying-laughing faces, which is the highest honour.`, `${dat(N)} saçma bir resim yolladın. Üç tane gülmekten ağlayan surat ifadesiyle cevap verdi; bu en büyük onur.`],
  ],
};

export const JOKE: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You told ${N} a joke. ${He} laughed, then told it back to you, better.`, `${dat(N)} bir fıkra anlattın. Güldü, sonra aynı fıkrayı sana daha iyi anlattı.`],
    ({ N, he }) => [`You made ${N} laugh so hard ${he} had to sit down on the stairs.`, `${acc(N)} öyle güldürdün ki merdivene oturmak zorunda kaldı.`],
    ({ N }) => [`You did an impression of a neighbour. ${N} said it was cruel, then asked you to do it again.`, `Bir komşunun taklidini yaptın. ${N} bunun çok ayıp olduğunu söyledi, sonra bir daha yapmanı istedi.`],
  ],
  father: [
    ({ N, He, he }) => [`You told ${N} a joke. ${He} topped it with one ${he} has been telling for forty years.`, `${dat(N)} bir fıkra anlattın. O da kırk yıldır anlattığı bir fıkrayla karşılık verdi.`],
    ({ N }) => [`You made a pun. ${N} groaned, then wrote it down for later.`, `Bir kelime oyunu yaptın. ${N} homurdandı, sonra kullanmak için bir kenara not etti.`],
    ({ N, He, he }) => [`You made ${N} laugh until ${he} coughed. ${He} blamed the coffee.`, `${acc(N)} öksürene kadar güldürdün. Suçu kahveye attı.`],
  ],
  grandparent: [
    ({ N, He }) => [`You told ${N} a joke. ${He} laughed at the wrong bit, which made it funnier.`, `${dat(N)} bir fıkra anlattın. Yanlış yerde güldü; fıkra daha da komik oldu.`],
    ({ N, He }) => [`You told ${N} a joke. ${He} replied with one from sixty years ago that was far cheekier.`, `${dat(N)} bir fıkra anlattın. O da altmış yıl öncesinden kalma, çok daha yaramaz bir fıkrayla karşılık verdi.`],
  ],
  sibling: [
    ({ N }) => [`You told ${N} an old family joke. Only the two of you understood it. That is the point.`, `${dat(N)} eski bir aile şakası yaptın. Sadece ikiniz anladınız. Mesele de bu.`],
    ({ N }) => [`You and ${N} did a routine you invented as kids. It still brings the house down.`, `${wth(N)} çocukken uydurduğunuz skeci yaptınız. Hâlâ ortalığı kırıp geçiriyor.`],
  ],
  love: [
    ({ N, he }) => [`You told ${N} a joke on the sofa and ${he} laughed until ${he} snorted, which made you both laugh more.`, `Kanepede ${dat(N)} bir fıkra anlattın; burnundan ses gelene kadar güldü, bu da ikinizi daha çok güldürdü.`],
    ({ N, He }) => [`You made ${N} laugh at a very serious dinner. ${He} kicked you under the table, smiling.`, `Çok ciddi bir yemekte ${acc(N)} güldürdün. Masanın altından gülümseyerek sana tekme attı.`],
  ],
  child: [
    ({ N, He, his, he }) => [`You told ${N} one of your old jokes. ${He} rolled ${his} eyes and laughed anyway, exactly as ${he} did at ten.`, `${dat(N)} eski fıkralarından birini anlattın. Gözlerini devirdi ama yine güldü; tıpkı on yaşındayken olduğu gibi.`],
    ({ N, He }) => [`You told ${N} a joke you heard on the radio. ${He} said "you're getting funnier with age".`, `${dat(N)} radyoda duyduğun bir fıkrayı anlattın. "Yaşlandıkça komikleşiyorsun" dedi.`],
  ],
  friend: [
    ({ N, he }) => [`You told ${N} a joke so bad that ${he} laughed out of respect.`, `${dat(N)} öyle kötü bir fıkra anlattın ki saygısından güldü.`],
    ({ N }) => [`You and ${N} laughed until the waiter came over to check you were all right.`, `${wth(N)} garson gelip iyi misiniz diye soracak kadar güldünüz.`],
  ],
};

export const JOKE_FLOP: L[] = [
  ({ N, He }) => [`You told ${N} a joke. ${He} waited politely for the funny part. That was the funny part.`, `${dat(N)} bir fıkra anlattın. Kibarca komik kısmı bekledi. Komik kısım oydu.`],
  ({ N }) => [`You started a joke for ${N} and forgot the ending halfway through.`, `${dat(N)} bir fıkra anlatmaya başladın ve sonunu yarıda unuttun.`],
  ({ N }) => [`Your joke fell flat. ${N} patted your arm kindly.`, `Esprin yerde kaldı. ${N} teselli eder gibi koluna dokundu.`],
];
export const JOKE_FLOP_BABY: L[] = [({ N, He }) => [`You made a face at ${N}. ${He} stared back, unimpressed, and burped.`, `${dat(N)} komik bir surat yaptın. Hiç etkilenmeden sana baktı ve geğirdi.`]];

// ================================================================ insult

export const INSULT_YOUNG: Record<Exclude<Young, 'baby'>, L[]> = {
  kid: [
    ({ N, He, his }) => [`You told ${N} ${his} drawing looked like a potato. ${He} cried, then drew you as a potato.`, `${dat(N)} çiziminin patatese benzediğini söyledin. Ağladı, sonra seni patates olarak çizdi.`],
    ({ N, He }) => [`You called ${N} a baby. ${He} said "you're the baby", which is unanswerable.`, `${dat(N)} "Bebek" dedin. O da "Asıl sen bebeksin" dedi; buna cevap yok.`],
  ],
  teen: [
    ({ N, He }) => [`You made fun of ${N}'s hair. ${He} did not speak to you for three days.`, `${gen(N)} saçıyla dalga geçtin. Üç gün seninle konuşmadı.`],
    ({ N, He }) => [`You said ${N}'s music is just noise. ${He} turned it up.`, `${gen(N)} dinlediği müziğin sadece gürültü olduğunu söyledin. Sesini açtı.`],
  ],
};

export const INSULT: Record<Rel, L[]> = {
  mother: [
    ({ N, He, his }) => [`You told ${N} ${his} cooking is not what it was. ${He} put the spoon down very slowly.`, `${dat(N)} yemeklerinin eskisi gibi olmadığını söyledin. Kaşığı çok yavaşça bıraktı.`],
    ({ N, he, He }) => [`You told ${N} ${he} worries too much. ${He} said that was a very worrying thing to say.`, `${dat(N)} çok fazla endişelendiğini söyledin. Bunun çok endişe verici bir laf olduğunu söyledi.`],
  ],
  father: [
    ({ N, He, his }) => [`You told ${N} ${his} jokes are not funny. ${He} told one to prove you wrong. You were right.`, `${dat(N)} esprilerinin komik olmadığını söyledin. Haksız olduğunu kanıtlamak için bir tane yaptı. Haklıydın.`],
    ({ N, He }) => [`You called ${N} stubborn. ${He} refused to accept it, which settled it.`, `${dat(N)} inatçı dedin. Bunu kabul etmeyi reddetti; mesele de böylece çözülmüş oldu.`],
  ],
  grandparent: [
    ({ N, he, He }) => [`You told ${N} ${he} always tells the same stories. ${He} said "did I ever tell you about..." and told one again.`, `${dat(N)} hep aynı hikâyeleri anlattığını söyledin. "Sana hiç şeyi anlattım mı..." diye başlayıp birini yine anlattı.`],
    ({ N, He }) => [`You said ${N}'s house smells of mothballs. ${He} took it as a compliment, which was worse.`, `${gen(N)} evinin naftalin koktuğunu söyledin. İltifat sandı; bu daha da kötüydü.`],
  ],
  sibling: [
    ({ N, he, He }) => [`You reminded ${N} of the most embarrassing thing ${he} ever did. ${He} reminded you of yours. A draw.`, `${dat(N)} hayatındaki en utanç verici anını hatırlattın. O da seninkini hatırlattı. Berabere.`],
    ({ N, he, He }) => [`You told ${N} ${he} was always the difficult one. ${He} listed your childhood crimes in order.`, `${dat(N)} çocukken hep zor olanın o olduğunu söyledin. O da senin çocukluk suçlarını sırasıyla saydı.`],
  ],
  love: [
    ({ N, his }) => [`You made fun of ${N}'s taste in films. You are now watching ${his} favourite, again, as punishment.`, `${gen(N)} film zevkiyle dalga geçtin. Ceza olarak en sevdiği filmi yine izliyorsunuz.`],
    ({ N, he, He }) => [`You told ${N} ${he} snores like a tractor. ${He} recorded you that night. You snore like two.`, `${dat(N)} traktör gibi horladığını söyledin. O gece seni kaydetti. Sen iki traktör gibi horluyorsun.`],
  ],
  child: [
    ({ N, he, He }) => [`You told ${N} that what ${he} does is not a real job. ${He} has not called since.`, `${dat(N)} yaptığı işin gerçek bir iş olmadığını söyledin. O günden beri aramadı.`],
    ({ N, his, He }) => [`You criticised ${N}'s cooking at ${his} own table. ${He} took your plate away.`, `${gen(N)} yemeğini kendi sofrasında eleştirdin. Tabağını önünden aldı.`],
  ],
  friend: [
    ({ N, his, him, He }) => [`You told ${N} ${his} new jacket makes ${him} look like a sofa. ${He} has worn it every day since, out of spite.`, `${dat(N)} yeni ceketinin onu kanepeye benzettiğini söyledin. İnadına o günden beri her gün giyiyor.`],
    ({ N, he, He }) => [`You told ${N} ${he} is always late. ${He} was late to the argument.`, `${dat(N)} hep geç kaldığını söyledin. Tartışmaya bile geç kaldı.`],
  ],
};

export const INSULT_SHRUG: L[] = [
  ({ N, He }) => [`You had a go at ${N}. ${He} laughed and said it was the nicest thing you had said all year.`, `${dat(N)} laf soktun. Güldü ve bunun bütün yıl söylediğin en tatlı şey olduğunu söyledi.`],
  ({ N, He }) => [`You insulted ${N}. ${He} said "nice try" and stole a chip from your plate.`, `${dat(N)} laf soktun. "İyi denemeydi" dedi ve tabağından bir patates kaptı.`],
];

// ================================================================ holiday together

export const HOLIDAY_YOUNG: L[] = [
  ({ N, He }) => [`You took ${N} to the seaside. ${He} built a sandcastle and defended it against the sea all afternoon.`, `${acc(N)} deniz kenarına götürdün. Bir kumdan kale yaptı ve bütün öğleden sonra onu denize karşı savundu.`],
  ({ N, He }) => [`You took ${N} to a theme park. ${He} went on the scariest ride four times. You went once and had to sit down.`, `${acc(N)} bir lunaparka götürdün. En korkunç oyuncağa dört kez bindi. Sen bir kez bindin ve oturman gerekti.`],
  ({ N, He }) => [`You took ${N} camping. ${He} saw a hedgehog and talks about nothing else.`, `${acc(N)} kampa götürdün. Bir kirpi gördü; artık başka hiçbir şeyden bahsetmiyor.`],
];

export const HOLIDAY: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You took ${N} on holiday to the seaside. ${He} packed for a month and complained about the sun every day, happily.`, `${acc(N)} deniz kenarına tatile götürdün. Bir aylık bavul hazırladı ve her gün mutlu mutlu güneşten şikâyet etti.`],
    ({ N, He }) => [`You and ${N} went on a city break. ${He} walked faster than you and saw everything twice.`, `${wth(N)} kısa bir şehir tatiline çıktınız. Senden hızlı yürüdü ve her şeyi iki kez gördü.`],
  ],
  father: [
    ({ N, He }) => [`You took ${N} fishing by a lake for a week. ${He} caught nothing and called it the best week in years.`, `${acc(N)} bir haftalığına göl kenarına balığa götürdün. Hiçbir şey tutmadı ve yıllardır geçirdiği en güzel hafta olduğunu söyledi.`],
    ({ N, he, He }) => [`You took ${N} back to the town where ${he} grew up. ${He} told a story at every corner.`, `${acc(N)} büyüdüğü kasabaya götürdün. Her köşede bir hikâye anlattı.`],
  ],
  grandparent: [
    ({ N, He }) => [`You took ${N} to a spa town. ${He} made friends with everyone in the thermal pool.`, `${acc(N)} bir kaplıca kasabasına götürdün. Termal havuzdaki herkesle arkadaş oldu.`],
    ({ N, He, his }) => [`You and ${N} took a slow train through the mountains. ${He} slept through the best views and called it the trip of ${his} life.`, `${wth(N)} dağların arasından ağır ağır giden bir trene bindiniz. En güzel manzaraları uyuyarak geçirdi ve hayatının yolculuğu olduğunu söyledi.`],
  ],
  sibling: [
    ({ N }) => [`You and ${N} went on holiday together for the first time since you were kids. You fought over the window seat. Some things never change.`, `${wth(N)} çocukluğunuzdan beri ilk kez birlikte tatile çıktınız. Cam kenarı için kavga ettiniz. Bazı şeyler hiç değişmiyor.`],
    ({ N }) => [`You and ${N} rented a little house by the sea and stayed up talking every night.`, `${wth(N)} deniz kenarında küçük bir ev kiraladınız ve her gece sabaha kadar konuştunuz.`],
  ],
  love: [
    ({ N }) => [`You and ${N} went to a small island and lost track of the days.`, `${wth(N)} küçük bir adaya gittiniz ve günlerin hesabını kaybettiniz.`],
    ({ N }) => [`You and ${N} went on a city break and argued about the map in two languages.`, `${wth(N)} bir şehir tatiline çıktınız ve haritayı iki dilde tartıştınız.`],
    ({ N }) => [`You and ${N} went to the mountains, got caught in a storm and laughed about it all the way home.`, `${wth(N)} dağlara gittiniz, fırtınaya yakalandınız ve eve kadar buna güldünüz.`],
  ],
  child: [
    ({ N, He }) => [`You and ${N} went away together, just the two of you. ${He} planned everything and let you think you had.`, `${wth(N)} baş başa tatile çıktınız. Her şeyi o planladı ama senin planladığını düşünmene izin verdi.`],
    ({ N, he, He }) => [`You took ${N} back to the beach where ${he} learned to swim. ${He} pretended not to be moved.`, `${acc(N)} yüzmeyi öğrendiği kumsala geri götürdün. Duygulanmamış gibi yaptı.`],
  ],
  friend: [
    ({ N }) => [`You and ${N} went on a road trip and came back with sunburn and a hundred new private jokes.`, `${wth(N)} yola düştünüz ve güneş yanığı ile yüz tane yeni iç şakayla döndünüz.`],
    ({ N }) => [`You and ${N} went camping. The tent fell down twice. Best holiday ever.`, `${wth(N)} kampa gittiniz. Çadır iki kez çöktü. Gelmiş geçmiş en güzel tatil.`],
  ],
};

// ================================================================ cook for them

export const COOK_YOUNG: L[] = [
  ({ N, He }) => [`You made ${N} pancakes shaped like animals. None of the animals was recognisable. ${He} ate every one.`, `${dat(N)} hayvan şeklinde krep yaptın. Hiçbir hayvan tanınmıyordu. Hepsini yedi.`],
  ({ N, He }) => [`You made ${N} pasta with far too much cheese. ${He} said it was the best thing ever.`, `${dat(N)} fazlasıyla peynirli bir makarna yaptın. Gelmiş geçmiş en güzel şey olduğunu söyledi.`],
  ({ N, He }) => [`You made ${N} a sandwich cut into stars. ${He} ate the stars and left the crusts, as is tradition.`, `${dat(N)} yıldız şeklinde kesilmiş bir sandviç yaptın. Yıldızları yedi, kenarlarını bıraktı; gelenek böyle.`],
];

export const COOK: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You cooked for ${N} for once. ${He} watched from the doorway and said nothing, which took great effort.`, `Bir kereliğine ${N} için sen yemek yaptın. Kapıdan izledi ve hiçbir şey söylemedi; bu ona büyük çaba gerektirdi.`],
    ({ N, his, He }) => [`You made ${N} ${his} own recipe. ${He} said it was very good and added salt.`, `${dat(N)} kendi tarifini yaptın. Çok güzel olduğunu söyledi ve tuz ekledi.`],
  ],
  father: [
    ({ N, He }) => [`You grilled something for ${N}. ${He} took over the grill after four minutes.`, `${N} için mangal yaktın. Dört dakika sonra mangalın başına o geçti.`],
    ({ N, He, he }) => [`You made ${N} a big breakfast. ${He} ate in silence, which means ${he} loved it.`, `${N} için kocaman bir kahvaltı hazırladın. Sessizce yedi; demek ki bayıldı.`],
  ],
  grandparent: [
    ({ N, He }) => [`You made soup for ${N}. ${He} said it needed a little something, then added a lot of something.`, `${N} için çorba yaptın. Bir şey eksik dedi, sonra epey bir şey ekledi.`],
    ({ N, he }) => [`You cooked for ${N}, who told you about every meal ${he} ever cooked for you.`, `${N} için yemek yaptın; o da sana yıllar boyunca senin için pişirdiği her yemeği anlattı.`],
  ],
  sibling: [
    ({ N, He }) => [`You cooked a dish from your childhood for ${N}. ${He} said it tasted exactly wrong, in a good way.`, `${N} için çocukluğunuzdan bir yemek pişirdin. Tadının tam olarak yanlış olduğunu söyledi; iyi anlamda.`],
    ({ N, He }) => [`You made dinner for ${N}. ${He} did the washing up without being asked, which has never happened before.`, `${N} için akşam yemeği yaptın. Kimse söylemeden bulaşıkları yıkadı; bu daha önce hiç olmamıştı.`],
  ],
  love: [
    ({ N }) => [`You cooked ${N} dinner by candlelight. The candles were the best part.`, `${N} için mum ışığında akşam yemeği hazırladın. En güzel kısmı mumlardı.`],
    ({ N }) => [`You made ${N} breakfast in bed. Crumbs everywhere. Worth it.`, `${N} için yatağa kahvaltı götürdün. Her yer kırıntı. Değdi.`],
  ],
  child: [
    ({ N, He }) => [`You cooked ${N}'s childhood favourite. ${He} took the leftovers home in three boxes.`, `${gen(N)} çocukluktan beri en sevdiği yemeği yaptın. Artanları üç kapta evine götürdü.`],
    ({ N, his }) => [`You cooked for ${N} and ${his} friends. You are now famous among people half your age.`, `${N} ve arkadaşları için yemek yaptın. Artık senin yarı yaşındaki insanlar arasında ünlüsün.`],
  ],
  friend: [
    ({ N, He }) => [`You cooked for ${N}. ${He} brought dessert and stayed until midnight.`, `${N} için yemek yaptın. Tatlıyı o getirdi ve gece yarısına kadar kaldı.`],
    ({ N, He }) => [`You tried a new recipe on ${N}. ${He} was very brave about it.`, `Yeni bir tarifi ${N} üzerinde denedin. Çok cesurca karşıladı.`],
  ],
};

export const COOK_FAIL: L[] = [
  ({ N, he }) => [`You tried to cook for ${N} and set off the smoke alarm. You ordered in, and ${he} said it is the thought that counts.`, `${N} için yemek yapmaya çalıştın ve yangın alarmını öttürdün. Dışarıdan sipariş verdiniz; önemli olanın niyet olduğunu söyledi.`],
  ({ N, He }) => [`You made ${N} a soup that was mostly salt. ${He} drank a lot of water and smiled bravely.`, `${N} için çoğu tuzdan oluşan bir çorba yaptın. Bolca su içti ve cesurca gülümsedi.`],
];

// ================================================================ ask for help

export const HELP_YOUNG: L[] = [
  ({ N, He }) => [`You asked ${N} for help with your phone. ${He} fixed it in nine seconds and looked at you with pity.`, `${abl(N)} telefonun için yardım istedin. Dokuz saniyede düzeltti ve sana acıyarak baktı.`],
  ({ N, He }) => [`You asked ${N} to help you carry something heavy. ${He} carried the light end and gave instructions.`, `${abl(N)} ağır bir şeyi taşımak için yardım istedin. Hafif ucundan tuttu ve talimat verdi.`],
];

export const HELP: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You asked ${N} for help with a form. ${He} filled it in, signed it and told you off about your handwriting.`, `${abl(N)} bir form için yardım istedin. Doldurdu, imzaladı, bir de yazın için seni azarladı.`],
    ({ N, He }) => [`You asked ${N} to help you tidy up. ${He} reorganised your entire life.`, `${abl(N)} ortalığı toplamak için yardım istedin. Bütün hayatını yeniden düzenledi.`],
  ],
  father: [
    ({ N, He }) => [`You asked ${N} to help fix a dripping tap. ${He} fixed it, then fixed three things you had not mentioned.`, `${abl(N)} damlayan bir musluğu tamir etmek için yardım istedin. Musluğu tamir etti, sonra senin hiç bahsetmediğin üç şeyi daha.`],
    ({ N, He }) => [`You asked ${N} for help moving a wardrobe. ${He} directed. You carried.`, `${abl(N)} bir dolabı taşımak için yardım istedin. O yönetti, sen taşıdın.`],
  ],
  grandparent: [
    ({ N, He }) => [`You asked ${N} to help you mend a jacket. ${He} sewed it without glasses, faster than a machine.`, `${abl(N)} bir ceketi dikmek için yardım istedin. Gözlüksüz, makineden hızlı dikti.`],
    ({ N, He }) => [`You asked ${N} how to make the family recipe. ${He} showed you, with "a little of this, a pinch of that".`, `${abl(N)} ailenin meşhur tarifini istedin. "Bundan biraz, ondan bir tutam" diye diye gösterdi.`],
  ],
  sibling: [
    ({ N, He, his }) => [`You asked ${N} to help you with something hard. ${He} sighed, rolled up ${his} sleeves and stayed until it was done.`, `${abl(N)} zor bir iş için yardım istedin. İç çekti, kollarını sıvadı ve iş bitene kadar kaldı.`],
    ({ N, He }) => [`You asked ${N} for help. ${He} said "what would you do without me?" and helped.`, `${abl(N)} yardım istedin. "Bensiz ne yapardın?" dedi ve yardım etti.`],
  ],
  love: [
    ({ N, He }) => [`You asked ${N} to help you prepare for something big. ${He} quizzed you all evening.`, `${abl(N)} önemli bir şeye hazırlanmak için yardım istedin. Bütün akşam seni sınava çekti.`],
    ({ N, He }) => [`You asked ${N} to help you clean up a mess you made. ${He} helped, and said "I told you so" only once.`, `Çıkardığın bir karmaşayı toplamak için ${abl(N)} yardım istedin. Yardım etti ve "Ben demiştim" lafını yalnızca bir kez söyledi.`],
  ],
  child: [
    ({ N, He }) => [`You asked ${N} to help with your phone. ${He} sighed the deep sigh of every grown child and fixed it.`, `${abl(N)} telefonun için yardım istedin. Bütün büyümüş çocukların o derin iç çekişiyle iç çekti ve düzeltti.`],
    ({ N, He }) => [`You asked ${N} to drive you to an appointment. ${He} came early and waited outside.`, `${abl(N)} seni bir randevuya götürmesini istedin. Erkenden geldi ve dışarıda bekledi.`],
  ],
  friend: [
    ({ N, he }) => [`You asked ${N} for help and ${he} showed up within the hour, no questions asked.`, `${abl(N)} yardım istedin; bir saat içinde, hiçbir şey sormadan kapındaydı.`],
    ({ N, He }) => [`You asked ${N} to help you study. ${He} made flash cards, colour-coded.`, `${abl(N)} ders çalışmak için yardım istedin. Renk renk çalışma kartları hazırladı.`],
  ],
};

export const HELP_NO: L[] = [
  ({ N, He }) => [`You asked ${N} for help. ${He} was busy, but sent you a very long message of instructions.`, `${abl(N)} yardım istedin. İşi vardı ama sana çok uzun bir talimat mesajı yolladı.`],
  ({ N }) => [`${N} could not help this time, and felt bad about it all week.`, `${N} bu sefer yardım edemedi ve bütün hafta bunun için üzüldü.`],
];

// ================================================================ apologise

export const SORRY_YOUNG: Record<Young, L[]> = {
  baby: [({ N, He }) => [`You said sorry to ${N}. ${He} offered you a soggy biscuit. Forgiven.`, `${abl(N)} özür diledin. Sana ıslak bir bisküvi uzattı. Affedildin.`]],
  kid: [
    ({ N, He }) => [`You said sorry to ${N}. ${He} thought about it very seriously and then forgave you completely.`, `${abl(N)} özür diledin. Çok ciddi ciddi düşündü, sonra seni tamamen affetti.`],
    ({ N, him }) => [`You apologised to ${N} and gave ${him} your last sweet. Peace was restored.`, `${abl(N)} özür diledin ve son şekerini ona verdin. Barış yeniden sağlandı.`],
  ],
  teen: [({ N, He }) => [`You apologised to ${N}. ${He} shrugged and said "it's fine", which in teenager means thank you.`, `${abl(N)} özür diledin. Omuz silkip "Sorun yok" dedi; ergen dilinde bu "teşekkürler" demek.`]],
};

export const SORRY: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You apologised to ${N}. ${He} said there was nothing to forgive, then listed it all.`, `${abl(N)} özür diledin. Affedilecek bir şey olmadığını söyledi, sonra hepsini tek tek saydı.`],
    ({ N, He }) => [`You said sorry to ${N}. ${He} hugged you and put the kettle on, which means it is over.`, `${abl(N)} özür diledin. Sana sarıldı ve çaydanlığı ocağa koydu; demek ki mesele kapandı.`],
  ],
  father: [
    ({ N, He, he }) => [`You apologised to ${N}. ${He} nodded once and said "fine". That is how ${he} forgives.`, `${abl(N)} özür diledin. Başını bir kez sallayıp "Tamam" dedi. Onun affetme şekli bu.`],
    ({ N, He, he }) => [`You said sorry to ${N}. ${He} said ${he} was sorry too. Neither of you had heard the other say it before.`, `${abl(N)} özür diledin. O da senden özür diledi. İkiniz de bunu birbirinizden daha önce hiç duymamıştınız.`],
  ],
  grandparent: [
    ({ N, He, his }) => [`You apologised to ${N}. ${He} said life is too short for grudges and gave you a sweet from ${his} pocket.`, `${abl(N)} özür diledin. Hayatın küslük için çok kısa olduğunu söyledi ve cebinden bir şeker çıkarıp verdi.`],
    ({ N, He }) => [`You said sorry to ${N}. ${He} had forgotten what it was about, and forgave you anyway.`, `${abl(N)} özür diledin. Neyle ilgili olduğunu unutmuştu ama yine de affetti.`],
  ],
  sibling: [
    ({ N, He }) => [`You apologised to ${N}. ${He} made you say it twice, louder.`, `${abl(N)} özür diledin. İki kez, daha yüksek sesle söyletti.`],
    ({ N, He }) => [`You said sorry to ${N} for something from years ago. ${He} said "finally".`, `Yıllar önce olan bir şey için ${abl(N)} özür diledin. "Nihayet" dedi.`],
  ],
  love: [
    ({ N, He }) => [`You apologised to ${N} properly, with no "but". ${He} looked at you as if you were new.`, `${abl(N)} adam akıllı, hiç "ama" demeden özür diledin. Sana yeni tanışıyormuş gibi baktı.`],
    ({ N, He }) => [`You said sorry to ${N} with flowers. ${He} said the flowers were nice and the apology was better.`, `${abl(N)} çiçeklerle özür diledin. Çiçeklerin güzel olduğunu, özrün ise daha güzel olduğunu söyledi.`],
  ],
  child: [
    ({ N, his, He }) => [`You apologised to ${N} for something from ${his} childhood. ${He} was quiet for a long time, then said thank you.`, `Çocukluğundan kalan bir şey için ${abl(N)} özür diledin. Uzun süre sustu, sonra teşekkür etti.`],
    ({ N, He, he }) => [`You told ${N} you were sorry. ${He} said ${he} knew, and always had.`, `${abl(N)} özür diledin. Bildiğini, hep bildiğini söyledi.`],
  ],
  friend: [
    ({ N, He }) => [`You apologised to ${N}. ${He} said "already forgotten" and changed the subject to something better.`, `${abl(N)} özür diledin. "Çoktan unuttum" dedi ve konuyu daha güzel bir şeye getirdi.`],
    ({ N, He }) => [`You said sorry to ${N}. ${He} accepted, on condition that you pay next time.`, `${abl(N)} özür diledin. Bir dahaki sefere hesabı senin ödemen şartıyla kabul etti.`],
  ],
};

// ================================================================ gossip

export const GOSSIP_YOUNG: Record<Exclude<Young, 'baby'>, L[]> = {
  kid: [({ N }) => [`You and ${N} whispered about the teacher. ${N} is sure the teacher is secretly a spy.`, `${wth(N)} öğretmen hakkında fısıldaştınız. ${N}, öğretmenin aslında gizli ajan olduğundan emin.`]],
  teen: [
    ({ N }) => [`You and ${N} gossiped about who likes who at school. The diagram is very complicated.`, `${wth(N)} okulda kimin kimden hoşlandığını konuştunuz. Şeması çok karışık.`],
    ({ N }) => [`You and ${N} went through the group chat drama line by line.`, `${wth(N)} grup sohbetindeki olayları satır satır incelediniz.`],
  ],
};

export const GOSSIP: Record<Rel, L[]> = {
  mother: [
    ({ N }) => [`You and ${N} discussed the neighbours in detail. ${N} knew things the neighbours do not know about themselves.`, `${wth(N)} komşuları en ince ayrıntısına kadar konuştunuz. ${N}, komşuların kendileri hakkında bile bilmediği şeyleri biliyordu.`],
    ({ N }) => [`${N} told you who in the family is not speaking to whom this year. It is a long list.`, `${N} bu yıl ailede kimin kime küs olduğunu anlattı. Uzun bir liste.`],
  ],
  father: [
    ({ N }) => [`${N} told you, very quietly, what really happened at the last family wedding.`, `${N} sana son aile düğününde aslında ne olduğunu çok alçak sesle anlattı.`],
    ({ N, He }) => [`You and ${N} gossiped about the neighbour's new car. ${He} has strong opinions about the colour.`, `${wth(N)} komşunun yeni arabasını çekiştirdiniz. Rengi hakkında çok net fikirleri var.`],
  ],
  grandparent: [
    ({ N }) => [`${N} told you a sixty-year-old scandal. Everyone involved is still not speaking.`, `${N} sana altmış yıllık bir skandal anlattı. İşin içindekiler hâlâ birbirine küs.`],
    ({ N }) => [`${N} went through the whole street, house by house, with the precision of a historian.`, `${N} bütün sokağı, ev ev, bir tarihçi titizliğiyle anlattı.`],
  ],
  sibling: [
    ({ N }) => [`You and ${N} gossiped about the relatives for an hour. You both feel slightly better and slightly worse.`, `${wth(N)} bir saat akrabaları çekiştirdiniz. İkiniz de hem biraz daha iyi hem biraz daha kötü hissediyorsunuz.`],
    ({ N }) => [`You and ${N} compared notes on the family. Your notes matched.`, `${wth(N)} aile hakkındaki notlarınızı karşılaştırdınız. Notlarınız birebir tuttu.`],
  ],
  love: [
    ({ N }) => [`You and ${N} gossiped about the couple next door on the way home and decided you are definitely the happier pair.`, `${wth(N)} eve dönerken yan komşu çifti çekiştirdiniz ve daha mutlu olanın kesinlikle siz olduğuna karar verdiniz.`],
    ({ N }) => [`You and ${N} spent dinner guessing what the people at the next table were arguing about.`, `${wth(N)} bütün yemek boyunca yan masadakilerin ne hakkında tartıştığını tahmin etmeye çalıştınız.`],
  ],
  child: [
    ({ N, his }) => [`${N} told you what ${his} friends really think of each other. You promised not to tell, and you will not.`, `${N} arkadaşlarının birbirleri hakkında aslında ne düşündüğünü anlattı. Kimseye söylemeyeceğine söz verdin; söylemeyeceksin de.`],
    ({ N, He }) => [`You and ${N} gossiped about the family. ${He} has clearly been paying attention for years.`, `${wth(N)} aileyi çekiştirdiniz. Belli ki yıllardır her şeye dikkat ediyormuş.`],
  ],
  friend: [
    ({ N }) => [`You and ${N} gossiped about your old classmates. One is rich, one is in a band, one is both.`, `${wth(N)} eski sınıf arkadaşlarınızı çekiştirdiniz. Biri zengin olmuş, biri grupta çalıyor, biri ikisi birden.`],
    ({ N }) => [`You and ${N} talked about everyone you both know. Nobody was spared.`, `${wth(N)} ikinizin de tanıdığı herkesi konuştunuz. Kimse kurtulamadı.`],
  ],
};

export const GOSSIP_BACKFIRE: L[] = [
  ({ N }) => [`You gossiped with ${N} and it got back to the person you were talking about. Awkward.`, `${wth(N)} dedikodu yaptınız ve laf, hakkında konuştuğunuz kişiye ulaştı. Çok tatsız oldu.`],
  ({ N }) => [`${N} repeated your gossip to exactly the wrong person.`, `${N} senin dedikodunu tam da yanlış kişiye anlattı.`],
];

// ================================================================ play a game

export const GAME_KID: L[] = [
  ({ N, He, his }) => [`You and ${N} played hide-and-seek. ${He} hid behind the curtain with ${his} feet showing.`, `${wth(N)} saklambaç oynadınız. Ayakları dışarıda, perdenin arkasına saklandı.`],
  ({ N, He }) => [`You and ${N} played a board game. ${He} invented a new rule halfway through and won.`, `${wth(N)} kutu oyunu oynadınız. Yarısında yeni bir kural uydurdu ve kazandı.`],
  ({ N }) => [`You and ${N} played tag until both of you were too out of breath to laugh.`, `${wth(N)} gülemeyecek kadar nefes nefese kalana kadar kovalamaca oynadınız.`],
];
export const GAME_TEEN: L[] = [
  ({ N, He }) => [`You and ${N} played a video game. ${He} beat you and explained how, kindly, like a teacher.`, `${wth(N)} video oyunu oynadınız. Seni yendi, sonra bir öğretmen gibi nazikçe nasıl yaptığını anlattı.`],
  ({ N, He }) => [`You and ${N} played cards. ${He} cheated so openly that it was impressive.`, `${wth(N)} kâğıt oynadınız. Öyle açık açık hile yaptı ki takdir etmemek elde değildi.`],
];
export const GAME_GROWN: L[] = [
  ({ N, He }) => [`You and ${N} played chess. ${He} took twenty minutes per move. You read a book in between.`, `${wth(N)} satranç oynadınız. Her hamlesi yirmi dakika sürdü. Arada sen kitap okudun.`],
  ({ N, He }) => [`You and ${N} played cards. ${He} won every hand and pretended to be surprised every time.`, `${wth(N)} kâğıt oynadınız. Her eli kazandı ve her seferinde şaşırmış gibi yaptı.`],
  ({ N }) => [`You and ${N} did a jigsaw together. One piece is missing. You blame each other.`, `${wth(N)} birlikte yapboz yaptınız. Bir parça eksik. Birbirinizi suçluyorsunuz.`],
];
/** Türkiye only: backgammon and okey are what grown-ups play. */
export const GAME_GROWN_TR: L[] = [
  ({ N, He }) => [`You and ${N} played backgammon. ${He} slammed every piece down like thunder.`, `${wth(N)} tavla oynadınız. Her pulu gök gürültüsü gibi tahtaya vurdu.`],
  ({ N, He }) => [`You and ${N} played okey with two neighbours. ${He} won and, for once, was gracious about it.`, `İki komşuyla birlikte ${wth(N)} okey oynadınız. Kazandı ve bir kereliğine kibar davrandı.`],
];
export const GAME_REL: Partial<Record<Rel, L[]>> = {
  grandparent: [({ N, He }) => [`You and ${N} played dominoes. ${He} has been unbeaten since before you were born.`, `${wth(N)} domino oynadınız. Sen doğmadan önce de yenilmezdi, hâlâ öyle.`]],
  love: [({ N }) => [`You and ${N} played a board game and agreed never to play it again, for the sake of the relationship.`, `${wth(N)} kutu oyunu oynadınız ve ilişkinizin selameti için bir daha asla oynamamaya karar verdiniz.`]],
  child: [({ N, him, He }) => [`You and ${N} played the card game you taught ${him} as a child. ${He} beats you every time now.`, `${wth(N)}, ona çocukken öğrettiğin kâğıt oyununu oynadınız. Artık her seferinde o kazanıyor.`]],
};

// ================================================================ call

export const CALL_YOUNG: L[] = [
  ({ N, He }) => [`You called ${N}. ${He} told you everything that happened at school, in no particular order.`, `${acc(N)} aradın. Okulda olan her şeyi, hiçbir sıraya uymadan anlattı.`],
  ({ N, He }) => [`You video-called ${N}. ${He} spent the whole call making faces with a filter.`, `${wth(N)} görüntülü konuştun. Bütün konuşma boyunca filtreyle surat yaptı.`],
];

export const CALL: Record<Rel, L[]> = {
  mother: [
    ({ N, He }) => [`You called ${N}. ${He} picked up on the first ring and asked if you were eating properly.`, `${acc(N)} aradın. İlk çalışta açtı ve düzgün yemek yiyip yemediğini sordu.`],
    ({ N, He, he }) => [`You called ${N} "just to say hello". ${He} told you about every neighbour, the price of tomatoes and a dream ${he} had.`, `${acc(N)} "sadece sesini duymak için" aradın. Bütün komşuları, domatesin fiyatını ve gördüğü bir rüyayı anlattı.`],
  ],
  father: [
    ({ N, He, he }) => [`You called ${N}. ${He} said "everything's fine" four times, which meant ${he} was glad you called.`, `${acc(N)} aradın. Dört kez "Her şey yolunda" dedi; aramana çok sevindiği belliydi.`],
    ({ N, his }) => [`You video-called ${N}. You spent the first five minutes looking at ${his} ear.`, `${wth(N)} görüntülü konuştun. İlk beş dakika kulağına baktın.`],
  ],
  grandparent: [
    ({ N, He, he }) => [`You video-called ${N}. ${He} held the phone so close you mostly saw a nostril, and ${he} was delighted.`, `${wth(N)} görüntülü konuştun. Telefonu öyle yakın tuttu ki çoğunlukla bir burun deliği gördün; o ise çok mutluydu.`],
    ({ N, He, he }) => [`You called ${N}. ${He} thought you were someone else for the first minute and was just as pleased when ${he} found out.`, `${acc(N)} aradın. İlk bir dakika seni başka biri sandı; anlayınca da en az o kadar sevindi.`],
  ],
  sibling: [
    ({ N, he }) => [`You called ${N} and talked for an hour about nothing. Then ${he} called back because ${he} forgot something.`, `${acc(N)} arayıp bir saat boyunca hiçbir şey hakkında konuştun. Sonra bir şeyi unuttuğu için o seni geri aradı.`],
    ({ N, He, his }) => [`You video-called ${N}. ${He} showed you the inside of ${his} fridge, for some reason.`, `${wth(N)} görüntülü konuştun. Nedense sana buzdolabının içini gösterdi.`],
  ],
  love: [
    ({ N, his, He }) => [`You called ${N} in the middle of the day just to hear ${his} voice. ${He} asked what was wrong. Nothing was wrong.`, `Sırf sesini duymak için gün ortasında ${acc(N)} aradın. Bir sorun mu var diye sordu. Hiçbir sorun yoktu.`],
    ({ N }) => [`You and ${N} talked on the phone until you both fell asleep.`, `${wth(N)} ikiniz de uyuyakalana kadar telefonda konuştunuz.`],
  ],
  child: [
    ({ N, He }) => [`You called ${N}. ${He} was busy but stayed on the line anyway.`, `${acc(N)} aradın. İşi vardı ama yine de telefonu kapatmadı.`],
    ({ N, He, his }) => [`You video-called ${N}. ${He} turned the camera round to show you ${his} new kitchen tiles.`, `${wth(N)} görüntülü konuştun. Kamerayı çevirip sana yeni mutfak fayanslarını gösterdi.`],
  ],
  friend: [
    ({ N }) => [`You called ${N}. It was meant to take five minutes. It took ninety.`, `${acc(N)} aradın. Beş dakika sürecekti, doksan sürdü.`],
    ({ N, He }) => [`You sent ${N} a voice message. ${He} sent back one that lasted eleven minutes.`, `${dat(N)} sesli mesaj attın. O da on bir dakikalık bir mesajla cevap verdi.`],
  ],
};

// ================================================================ introduce your partner

export const INTRO_GOOD: Partial<Record<Rel, PL[]>> = {
  mother: [
    ({ N }, P) => [`You introduced ${P} to ${N}. ${N} fed ${P} until ${P} could barely stand.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N}, ${acc(P)} ayakta duramayacak hale gelene kadar doyurdu.`],
    ({ N }, P) => [`You introduced ${P} to ${N}. Within an hour ${N} was showing ${P} your baby photos.`, `${acc(P)} ${wth(N)} tanıştırdın. Bir saat içinde ${N}, ${dat(P)} senin bebeklik fotoğraflarını gösteriyordu.`],
  ],
  father: [
    ({ N }, P) => [`You introduced ${P} to ${N}. ${N} asked ${P} three questions about work and one about football, then nodded. That is a yes.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N}, ${dat(P)} iş hakkında üç, futbol hakkında bir soru sordu, sonra başını salladı. Bu bir "evet" demek.`],
    ({ N }, P) => [`You introduced ${P} to ${N}. By the end of the evening ${N} and ${P} were fixing the gate together.`, `${acc(P)} ${wth(N)} tanıştırdın. Akşamın sonunda ${N} ile ${P} bahçe kapısını birlikte tamir ediyordu.`],
  ],
  grandparent: [
    ({ N }, P) => [`You introduced ${P} to ${N}. ${N} asked when the wedding is. Twice.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N} düğünün ne zaman olduğunu sordu. İki kez.`],
    ({ N }, P) => [`You introduced ${P} to ${N}. ${N} held ${P}'s hand the whole visit and gave a blessing on the way out.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N} ziyaret boyunca ${gen(P)} elini bırakmadı, çıkarken de hayır duası etti.`],
  ],
  sibling: [
    ({ N }, P) => [`You introduced ${P} to ${N}. ${N} told ${P} every embarrassing story from your childhood. ${P} loved it.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N}, ${dat(P)} çocukluğundan bütün utanç verici hikâyeleri anlattı. ${P} bayıldı.`],
  ],
  friend: [
    ({ N }, P) => [`You introduced ${P} to ${N}. Within ten minutes ${N} and ${P} were teaming up against you.`, `${acc(P)} ${wth(N)} tanıştırdın. On dakika içinde ikisi sana karşı ittifak kurmuştu.`],
  ],
};

export const INTRO_AWKWARD: Partial<Record<Rel, PL[]>> = {
  mother: [({ N }, P) => [`You introduced ${P} to ${N}. ${N} was polite in a way that was not polite at all.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N} hiç de kibar olmayan bir kibarlıkla davrandı.`]],
  father: [({ N }, P) => [`You introduced ${P} to ${N}. ${N} shook hands for a very long time without blinking.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N}, gözünü hiç kırpmadan çok uzun süre el sıkıştı.`]],
  grandparent: [({ N }, P) => [`You introduced ${P} to ${N}. ${N} called ${P} by the wrong name all evening, very warmly.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N} bütün akşam ${dat(P)} çok sıcak bir şekilde yanlış isimle hitap etti.`]],
  sibling: [({ N }, P) => [`You introduced ${P} to ${N}. ${N} and ${P} disagreed about everything, loudly, all evening.`, `${acc(P)} ${wth(N)} tanıştırdın. ${N} ile ${P} bütün akşam her konuda yüksek sesle anlaşamadı.`]],
  friend: [({ N }, P) => [`You introduced ${P} to ${N}. The silence after the hellos lasted a very long time.`, `${acc(P)} ${wth(N)} tanıştırdın. Merhabalaşmadan sonraki sessizlik çok uzun sürdü.`]],
};

// ================================================================ the same thing twice in a year

export const AGAIN_MORE: Record<string, L[]> = {
  hug: [
    ({ N, He }) => [`Another hug for ${N}. ${He} said you are getting soft. ${He} did not let go first.`, `${dat(N)} yine sarıldın. "Yaşlandıkça yumuşuyorsun" dedi ama önce o bırakmadı.`],
    ({ N }) => [`You hugged ${N} again. It is becoming a habit, the good kind.`, `${dat(N)} yine sarıldın. Bir alışkanlık oluyor; iyisinden.`],
  ],
  joke: [
    ({ N, He }) => [`You told ${N} another joke. ${He} said "is this going to be a thing now?" It is.`, `${dat(N)} bir fıkra daha anlattın. "Artık hep böyle mi olacak?" dedi. Evet.`],
    ({ N }) => [`Round two of jokes for ${N}. You saved the best for last. It was not the best.`, `${dat(N)} ikinci tur fıkralar. En iyisini sona saklamıştın. En iyisi değilmiş.`],
  ],
  insult: [
    ({ N }) => [`You had another go at ${N}. ${N} has started keeping a list.`, `${dat(N)} yine laf soktun. ${N} artık bir liste tutmaya başladı.`],
    ({ N, He }) => [`You insulted ${N} again. ${He} said "twice in one year, that's a record".`, `${dat(N)} yine laf soktun. "Bir yılda iki kere, rekor" dedi.`],
  ],
  holiday: [({ N }) => [`A second trip with ${N} this year. Your neighbours have stopped asking where you are.`, `Bu yıl ${wth(N)} ikinci tatil. Komşuların artık nerede olduğunu sormuyor.`]],
  cook: [
    ({ N, He }) => [`You cooked for ${N} again. ${He} has started arriving hungry, on purpose.`, `${N} için yine yemek yaptın. Artık bilerek aç geliyor.`],
    ({ N }) => [`Another meal for ${N}. ${N} asked for the recipe this time. You do not have one.`, `${N} için bir yemek daha. Bu sefer tarifini istedi. Tarifin yok.`],
  ],
  help: [({ N, He }) => [`You asked ${N} for help again. ${He} said "what is it this time?" and came anyway.`, `${abl(N)} yine yardım istedin. "Bu sefer ne?" dedi ama yine de geldi.`]],
  sorry: [({ N, He }) => [`You apologised to ${N} again. ${He} said you can stop now; it is really fine.`, `${abl(N)} yine özür diledin. Artık bırakabileceğini, gerçekten sorun olmadığını söyledi.`]],
  gossip: [({ N }) => [`You and ${N} picked up the gossip exactly where you left it. There were developments.`, `${wth(N)} dedikoduya tam kaldığınız yerden devam ettiniz. Gelişmeler vardı.`]],
  game: [({ N, He }) => [`A rematch with ${N}. ${He} won again and asked for a third.`, `${wth(N)} rövanş maçı. Yine o kazandı ve üçüncüsünü istedi.`]],
  call: [({ N, He }) => [`You called ${N} again. ${He} picked up with "twice in one year? Do you need money?" You did not, this time.`, `${acc(N)} yine aradın. "Bir yılda iki kere mi? Para mı lazım?" diye açtı. Bu sefer lazım değildi.`]],
};
