import type { Ctx, EventDef } from '../types';
import { atParents, inTr, settled } from './events-flavour';
import { single, wth } from './util';
import { aliveKin } from './kin';
import {
  Kw,
  alive,
  hasParent,
  allParents,
  atUni,
  befriend,
  cash,
  gamble,
  hasFriend,
  hasGrand,
  hasSibling,
  kw,
  near,
  newAdult,
  newKid,
  nmc,
  opt,
  out,
  pickFriend,
  pickGrand,
  tt,
  working,
  ys,
  ysPeek,
} from './young-kit';

// Round 4: young adults, 18–29. University (without the Campus pack), first flats, first jobs, weddings of
// friends, and callbacks to childhood: the bully, the teacher, the pen pal, the time capsule, the old club.

const movedOut = (c: Ctx) => !atParents(c);

export const youngAdultEvents: EventDef[] = [
  // ================================================================ university (base game)
  {
    id: 'base.ya_uni_8am',
    category: 'school',
    minAge: 18,
    maxAge: 26,
    once: true,
    when: atUni,
    title: tt('You have an 8 a.m. lecture. Every week. All year.', 'Sabah sekizde dersin var. Her hafta. Bütün yıl.'),
    text: tt('The lecturer reads the slides aloud. Slowly.', 'Hoca slaytları yüksek sesle okuyor. Yavaş yavaş.'),
    choices: [
      opt('go', ['Go every single time', 'Her seferinde git'], (c) =>
        out(c, { sma: 3, hap: -2 }, 'You went every week. By spring you and the lecturer were the only two there, and he started bringing biscuits.', 'Her hafta gittin. Bahara doğru derste sadece sen ve hoca kalmıştınız; o da bisküvi getirmeye başladı.'),
      ),
      opt('notes', ['Borrow notes from a friend', 'Bir arkadaştan not al'], (c) => {
        const f = newKid(c, 'kid', 1);
        befriend(c, 'kid', 45);
        return out(c, { hap: 2 }, `${f.firstName} had beautiful notes and a price: coffee, every week. A friendship built on caffeine.`, `${f.firstName} harika notlar tutuyordu ve bir bedeli vardı: her hafta kahve. Kafein üzerine kurulu bir arkadaşlık.`);
      }),
      opt('sleep', ['Sleep and watch the recordings', 'Uyu, kayıtları izle'], (c) =>
        out(c, { hap: 3, sma: 1 }, 'You watched the recordings at double speed. The lecturer sounds like a cartoon. You learned it all anyway.', 'Kayıtları iki kat hızda izledin. Hoca çizgi film karakteri gibi konuşuyor. Yine de hepsini öğrendin.'),
      ),
    ],
  },
  {
    id: 'base.ya_uni_presentation',
    category: 'school',
    minAge: 18,
    maxAge: 27,
    once: true,
    when: atUni,
    title: tt('You have to give a twenty-minute presentation.', 'Yirmi dakikalık bir sunum yapman gerekiyor.'),
    text: tt('Your laptop has just decided to update.', 'Dizüstü bilgisayarın tam şimdi güncellemeye karar verdi.'),
    choices: [
      opt('wing', ['Present without slides', 'Slaytsız sun'], (c) =>
        gamble(
          c,
          0.5 + c.p.stats.smarts / 300,
          (c) => out(c, { sma: 2, hap: 6 }, 'You drew on the whiteboard and talked like a human. Best presentation of the term, said the professor.', 'Beyaz tahtaya çizdin ve insan gibi konuştun. Hoca dönemin en iyi sunumu olduğunu söyledi.'),
          (c) => out(c, { hap: -3 }, 'You talked for six minutes and then ran out of everything. The silence lasted forever. You passed, just.', 'Altı dakika konuştun, sonra her şey bitti. Sessizlik sonsuza kadar sürdü. Zar zor geçtin.'),
        ),
      ),
      opt('wait', ['Wait for the update', 'Güncellemeyi bekle'], (c) =>
        out(c, { hap: -1 }, 'The update finished at 94 percent of your time slot. You presented one slide. It was a good slide.', 'Güncelleme sürenin neredeyse sonunda bitti. Tek bir slayt sundun. İyi bir slayttı.'),
      ),
      opt('friend', ['Borrow a classmate\'s laptop', 'Bir sınıf arkadaşının bilgisayarını ödünç al'], (c) =>
        out(c, { sma: 1, hap: 3 }, 'A stranger handed you their laptop without a word. You owe them forever. You do not know their name.', 'Bir yabancı tek kelime etmeden bilgisayarını uzattı. Ona ömür boyu borçlusun. Adını bile bilmiyorsun.'),
      ),
    ],
  },
  {
    id: 'base.ya_uni_free_pizza',
    category: 'school',
    minAge: 18,
    maxAge: 26,
    once: true,
    when: atUni,
    title: tt('A poster says: "Free pizza! Seminar on soil chemistry."', 'Bir afiş: "Bedava pizza! Toprak kimyası semineri."'),
    text: tt('You know nothing about soil chemistry. You know a lot about pizza.', 'Toprak kimyasından hiç anlamazsın. Pizzadan çok anlarsın.'),
    choices: [
      opt('go', ['Go, sit at the back, eat', 'Git, arkaya otur, ye'], (c) =>
        out(c, { hap: 3, sma: 1 }, 'You ate four slices and accidentally learned something about worms. You now care about soil.', 'Dört dilim yedin ve kazara solucanlar hakkında bir şey öğrendin. Artık toprağı önemsiyorsun.'),
      ),
      opt('question', ['Ask a question to look legit', 'Ciddi görünmek için bir soru sor'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { sma: 2, hap: 4 }, 'Your question was so good that the speaker offered you a summer job in her lab. All for pizza.', 'Sorun o kadar iyiydi ki konuşmacı sana laboratuvarında yaz işi teklif etti. Hepsi bir pizza için.'),
          (c) => out(c, { hap: -2 }, 'Your question revealed you had no idea what soil was. The room went quiet. The pizza tasted of shame.', 'Sorun, toprağın ne olduğunu bilmediğini ortaya koydu. Salon sustu. Pizzanın tadı utanç gibiydi.'),
        ),
      ),
      opt('skip', ['Have some dignity', 'Biraz onurlu ol'], (c) =>
        out(c, { hap: -1 }, 'You stayed home with dignity and dry crackers. Your flatmate came back with three boxes.', 'Onurunla ve kuru krakerlerle evde kaldın. Ev arkadaşın üç kutuyla döndü.'),
      ),
    ],
  },
  {
    id: 'base.ya_uni_fire_alarm',
    category: 'school',
    minAge: 18,
    maxAge: 26,
    once: true,
    when: atUni,
    title: tt('The dorm fire alarm goes off at 3 a.m. Again.', 'Yurdun yangın alarmı gece üçte yine çaldı.'),
    text: tt('Somebody on your floor has been making toast.', 'Sizin katta biri yine tost yapıyormuş.'),
    choices: [
      opt('out', ['Go outside like a good citizen', 'İyi bir vatandaş gibi dışarı çık'], (c) => {
        newKid(c, 'kid', 2);
        befriend(c, 'kid', 45);
        return out(c, { hap: 2, hea: -1 }, `You stood in the cold in pyjamas and met ${nmc(c, 'kid')}, who was holding a cat that is definitely not allowed.`, `Pijamalarla soğukta beklerken ${nmc(c, 'kid', 'wth')} tanıştın; kucağında kesinlikle yasak olan bir kedi vardı.`);
      }),
      opt('stay', ['Stay in bed with a pillow over your head', 'Başında yastıkla yatakta kal'], (c) =>
        out(c, { hap: 1 }, 'You stayed in bed. A warden knocked. You now have a "fire safety" certificate you had to earn on a Saturday.', 'Yatakta kaldın. Bir görevli kapını çaldı. Artık bir cumartesi günü kazanmak zorunda kaldığın bir "yangın güvenliği" belgen var.'),
      ),
      opt('toast', ['Find the toast criminal', 'Tost suçlusunu bul'], (c) =>
        out(c, { hap: 3 }, 'You tracked down the toaster. It was your own flatmate. You made a sign for the kitchen: TOAST IS A PRIVILEGE.', 'Tost makinesinin izini sürdün. Kendi ev arkadaşın çıktı. Mutfağa bir tabela astın: TOST BİR AYRICALIKTIR.'),
      ),
    ],
  },
  {
    id: 'base.ya_uni_library_seat',
    category: 'school',
    minAge: 18,
    maxAge: 26,
    once: true,
    when: atUni,
    title: tt('Exam season. Someone has left a coat on "your" library seat.', 'Sınav dönemi. Biri kütüphanedeki "senin" yerine montunu bırakmış.'),
    text: tt('It has been there for four hours. The owner has not.', 'Mont dört saattir orada. Sahibi değil.'),
    choices: [
      opt('move', ['Move the coat politely', 'Montu kibarca kaldır'], (c) =>
        out(c, { sma: 2, hap: 1 }, 'You moved it to the next chair. The owner came back, nodded, and you studied side by side in silent respect.', 'Yanındaki sandalyeye koydun. Sahibi geldi, başıyla selam verdi ve sessiz bir saygıyla yan yana çalıştınız.'),
      ),
      opt('note', ['Leave a sharp note on it', 'Üstüne iğneleyici bir not bırak'], (c) =>
        out(c, { hap: 2 }, 'The note became a long correspondence. You have not met. You are basically pen pals now.', 'Not uzun bir yazışmaya dönüştü. Hiç tanışmadınız. Artık neredeyse mektup arkadaşısınız.'),
      ),
      opt('cafe', ['Study at a café instead', 'Bir kafede çalış'], (c) =>
        out(c, { sma: 1, hap: 2, usd: -15 }, 'You studied at a café and spent more on tea than on textbooks. Still, the chair was yours.', 'Kafede çalıştın ve kitaplardan çok çaya para verdin. Ama sandalye seninti.'),
      ),
    ],
  },
  {
    id: 'base.ya_uni_office_hours',
    category: 'school',
    minAge: 18,
    maxAge: 27,
    once: true,
    when: atUni,
    setup: (c) => newAdult(c, 'prof', 40, 66),
    title: tt('You finally went to a professor\'s office hours.', 'Sonunda bir hocanın görüşme saatine gittin.'),
    text: (c) => c.t(`Professor ${who(c).lastName} seems shocked that anyone came.`, `${who(c).firstName} Hoca birinin gelmesine şaşırmış görünüyor.`),
    choices: [
      opt('question', ['Ask about the hardest topic', 'En zor konuyu sor'], (c) =>
        out(c, { sma: 4, hap: 2 }, 'You spent an hour on one question. The professor drew diagrams on an envelope. You understand it now. Forever.', 'Bir soru üzerine bir saat geçirdiniz. Hoca bir zarfın arkasına şemalar çizdi. Artık anladın. Sonsuza kadar.'),
        { tone: 'good' },
      ),
      opt('career', ['Ask for career advice', 'Kariyer tavsiyesi iste'], (c) =>
        out(c, { sma: 2, hap: 3 }, 'The professor told you about every wrong turn of their own life. Oddly, it was the most encouraging talk you have ever had.', 'Hoca sana kendi hayatındaki bütün yanlış dönemeçleri anlattı. Tuhaftır, hayatında duyduğun en cesaret verici konuşmaydı.'),
      ),
      opt('chat', ['Talk about anything but the course', 'Ders dışında her şeyden konuş'], (c) =>
        out(c, { hap: 4 }, 'You talked about cats for forty minutes. The professor is now nicer to you in lectures, and once winked.', 'Kırk dakika kedilerden konuştunuz. Hoca derste artık sana daha nazik; bir kez göz bile kırptı.'),
      ),
    ],
  },

  // ================================================================ first flats, first jobs, money
  {
    id: 'base.ya_deposit',
    category: 'money',
    minAge: 19,
    maxAge: 29,
    once: true,
    when: movedOut,
    setup: (c) => newAdult(c, 'll', 45, 75),
    title: tt('Your landlord wants to keep your whole deposit.', 'Ev sahibin depozitonun tamamını geri vermek istemiyor.'),
    text: tt('For "a mark on the wall". The mark was there when you moved in. You think.', '"Duvardaki bir iz" yüzünden. O iz sen taşındığında da vardı. Galiba.'),
    choices: [
      opt('photos', ['Find your move-in photos', 'Taşınırken çektiğin fotoğrafları bul'], (c) =>
        gamble(
          c,
          0.65,
          (c) => out(c, { usd: 600, hap: 5, sma: 1 }, 'The photos showed the mark, with a date. You got the whole deposit back and a new respect for photographs.', 'Fotoğraflarda iz tarihiyle birlikte görünüyordu. Depozitonun tamamını geri aldın; fotoğraflara saygın da arttı.'),
          (c) => out(c, { usd: 250, hap: -1 }, 'The photos were mostly of your lunch. You got half back after a long argument.', 'Fotoğrafların çoğu öğle yemeğindenmiş. Uzun bir tartışmadan sonra yarısını geri aldın.'),
        ),
      ),
      opt('paint', ['Repaint the wall yourself', 'Duvarı kendin boya'], (c) =>
        out(c, { usd: 450, hea: -1, hap: 1 }, 'You painted the whole wall in the wrong white. The landlord sighed and gave most of it back.', 'Bütün duvarı yanlış bir beyazla boyadın. Ev sahibi iç çekti ve çoğunu geri verdi.'),
      ),
      opt('let', ['Let it go', 'Boş ver'], (c) =>
        out(c, { hap: -3 }, 'You let it go. You think about that mark more than you think about some people.', 'Boş verdin. O izi bazı insanlardan daha çok düşünüyorsun.'),
      ),
    ],
  },
  {
    id: 'base.ya_flatpack',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    when: movedOut,
    title: tt('You bought a flat-pack wardrobe.', 'Kendin kurulan bir gardırop aldın.'),
    text: tt('The instructions have no words. Just a cartoon man who looks worried.', 'Kılavuzda tek kelime yok. Sadece endişeli görünen çizgi bir adam var.'),
    choices: [
      opt('alone', ['Build it alone, tonight', 'Bu gece tek başına kur'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 5, sma: 1 }, 'It took five hours and one scream, but it stands. Four screws are left over. You will never know where they go.', 'Beş saat ve bir çığlık sürdü ama ayakta. Dört vida arttı. Nereye gittiklerini asla bilmeyeceksin.'),
          (c) => out(c, { hap: -3 }, 'You built it inside out. The doors open onto the wall. You have decided this is a feature.', 'Ters kurdun. Kapaklar duvara açılıyor. Bunun bir özellik olduğuna karar verdin.'),
        ),
      ),
      opt('friend', ['Bribe a friend with dinner', 'Bir arkadaşını yemekle kandır'], (c) => {
        if (hasFriend(c)) pickFriend(c);
        if (c.vars.fr) near(c, 'fr', 4);
        return out(c, { hap: 3, usd: -30 }, 'Your friend read the instructions, you held things. A perfect division of labour. It stands straight.', 'Arkadaşın kılavuzu okudu, sen parçaları tuttun. Kusursuz bir iş bölümü. Dimdik duruyor.');
      }),
      opt('chair', ['Use the box as furniture instead', 'Onun yerine kutuyu mobilya olarak kullan'], (c) =>
        out(c, { hap: 1 }, 'The box is a table now. The wardrobe parts are under your bed. It has been a year.', 'Kutu artık bir masa. Gardırop parçaları yatağının altında. Bir yıl oldu.'),
      ),
    ],
  },
  {
    id: 'base.ya_houseplant',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    title: tt('Your houseplant is dying.', 'Saksı çiçeğin ölüyor.'),
    text: tt('You have had it for three weeks. It was the one thing you were responsible for.', 'Üç haftadır sende. Sorumlu olduğun tek şey oydu.'),
    choices: [
      opt('research', ['Research plant care for hours', 'Saatlerce bitki bakımı araştır'], (c) =>
        aliveKin(c, 'mother')
          ? out(c, { sma: 2, hap: 4 }, 'You moved it to the window, stopped drowning it and spoke to it gently. It grew a new leaf. You told your mum.', 'Pencereye taşıdın, boğmayı bıraktın ve onunla yumuşak bir sesle konuştun. Yeni bir yaprak çıkardı. Annene anlattın.')
          : out(c, { sma: 2, hap: 4 }, 'You moved it to the window, stopped drowning it and spoke to it gently. It grew a new leaf. You sent a photo of it to everyone you know.', 'Pencereye taşıdın, boğmayı bıraktın ve onunla yumuşak bir sesle konuştun. Yeni bir yaprak çıkardı. Fotoğrafını tanıdığın herkese attın.'),
        { tone: 'good' },
      ),
      opt('replace', ['Secretly replace it with an identical one', 'Gizlice aynısıyla değiştir'], (c) =>
        out(c, { hap: 2, usd: -15 }, 'You replaced it. Nobody knows. You know.', 'Değiştirdin. Kimse bilmiyor. Sen biliyorsun.'),
      ),
      opt('plastic', ['Buy a plastic one', 'Plastik bir tane al'], (c) =>
        out(c, { hap: 1 }, 'The plastic plant is thriving. You dust it on Sundays. It is the healthiest relationship in your flat.', 'Plastik çiçek harika gidiyor. Pazarları tozunu alıyorsun. Evindeki en sağlıklı ilişki bu.'),
      ),
    ],
  },
  {
    id: 'base.ya_tax_form',
    category: 'money',
    minAge: 19,
    maxAge: 27,
    once: true,
    when: working,
    title: tt('Your first tax form has arrived.', 'İlk vergi formun geldi.'),
    text: tt('Box 14 asks about box 9, which refers you to box 14.', '14. kutu 9. kutuyu soruyor; 9. kutu seni 14. kutuya yolluyor.'),
    choices: [
      opt('do', ['Work it out yourself', 'Kendin çöz'], (c) =>
        gamble(
          c,
          0.55,
          (c) => out(c, { sma: 3, hap: 3, usd: 200 }, 'After a whole Sunday, you understood it. You even got a small refund. You are an adult now, apparently.', 'Bütün bir pazar gününden sonra anladın. Küçük bir vergi iadesi bile aldın. Anlaşılan artık yetişkinsin.'),
          (c) => out(c, { sma: 1, hap: -2, usd: -100 }, 'You put a number in the wrong box and got a small fine and a long letter. Next year, help.', 'Bir rakamı yanlış kutuya yazdın; küçük bir ceza ve uzun bir mektup geldi. Seneye yardım alacaksın.'),
        ),
      ),
      opt('parent', ['Call a parent', 'Annene ya da babana telefon et'], (c) => {
        allParents(c, 3);
        return out(c, { hap: 2 }, 'Your parent did it over the phone in eight minutes and then talked about pensions for forty.', 'Ailenden biri telefonda sekiz dakikada halletti, sonra kırk dakika emeklilikten bahsetti.');
      }, { hidden: (c) => !aliveKin(c, 'parents') }),
      opt('pay', ['Pay someone to do it', 'Birine para verip yaptır'], (c) =>
        out(c, { hap: 3, usd: -150 }, 'An accountant did it in five minutes while eating a sandwich. Worth every penny.', 'Bir muhasebeci sandviç yerken beş dakikada halletti. Her kuruşuna değdi.'),
      ),
    ],
  },
  {
    id: 'base.ya_first_day',
    category: 'work',
    minAge: 18,
    maxAge: 28,
    once: true,
    when: (c) => working(c) && c.p.jobYears === 0,
    title: tt('First day at your new job. It is lunchtime.', 'Yeni işinde ilk gün. Öğle arası.'),
    text: tt('Everyone seems to know where to go except you.', 'Senden başka herkes nereye gideceğini biliyor gibi.'),
    choices: [
      opt('follow', ['Follow the loudest group', 'En gürültülü grubun peşine takıl'], (c) => {
        newKid(c, 'kid', 4);
        befriend(c, 'kid', 45);
        return out(c, { hap: 4 }, `You followed them to a tiny place with the best soup in the city. ${nmc(c, 'kid')} saved you a seat the next day.`, `Peşlerinden şehrin en güzel çorbasını yapan küçük bir yere gittin. Ertesi gün ${nmc(c, 'kid')} sana yer tuttu.`);
      }, { tone: 'good' }),
      opt('desk', ['Eat at your desk, looking busy', 'Masanda, meşgul görünerek ye'], (c) =>
        out(c, { hap: -1, sma: 1 }, 'You ate at your desk and read the whole staff handbook. You now know the policy on goats. There is one.', 'Masanda yemek yedin ve bütün personel el kitabını okudun. Artık keçilerle ilgili kuralı biliyorsun. Gerçekten var.'),
      ),
      opt('boss', ['Ask the boss to lunch', 'Patronu öğle yemeğine davet et'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 4 }, 'The boss said yes, and talked about fishing for an hour. You are now "the new one who likes fishing". You do not.', 'Patron kabul etti ve bir saat balıkçılıktan bahsetti. Artık "balığı seven yeni çocuk" sensin. Sevmiyorsun.'),
          (c) => out(c, { hap: -2 }, 'The boss looked at you as if you had asked to borrow their car. "Maybe some other time."', 'Patron sana arabasını ödünç istemişsin gibi baktı. "Belki başka zaman."'),
        ),
      ),
    ],
  },
  {
    id: 'base.ya_savings',
    category: 'money',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: working,
    title: tt('A colleague swears by the "no-spend month".', 'Bir iş arkadaşın "hiç harcamasız ay"a yemin ediyor.'),
    text: tt('Nothing but rent, bills and basic food for thirty days.', 'Otuz gün boyunca kira, faturalar ve temel gıda dışında hiçbir şey yok.'),
    choices: [
      opt('try', ['Try it seriously', 'Ciddi ciddi dene'], (c) =>
        gamble(
          c,
          0.55,
          (c) => out(c, { usd: 500, hap: 2, sma: 1 }, 'You made it. You learned to cook lentils eleven ways and you saved a real amount of money.', 'Başardın. Mercimeği on bir şekilde pişirmeyi öğrendin ve gerçekten para biriktirdin.'),
          (c) => out(c, { usd: 200, hap: -1 }, 'You lasted nineteen days, then bought a lamp shaped like a mushroom. Still, you saved something.', 'On dokuz gün dayandın, sonra mantar şeklinde bir lamba aldın. Yine de bir şey biriktirdin.'),
        ),
      ),
      opt('auto', ['Set up an automatic savings transfer instead', 'Onun yerine otomatik birikim talimatı ver'], (c) =>
        out(c, { usd: 350, sma: 2 }, 'You set it and forgot it. A year later you found money you did not know you had. Boring and brilliant.', 'Ayarladın ve unuttun. Bir yıl sonra olduğunu bilmediğin bir para buldun. Sıkıcı ve parlak.'),
        { tone: 'good' },
      ),
      opt('no', ['Life is short', 'Hayat kısa'], (c) =>
        out(c, { hap: 3, usd: -150 }, 'You celebrated not doing the challenge with a nice dinner. Your colleague watched in silent judgement.', 'Bu meydan okumaya katılmamanı güzel bir akşam yemeğiyle kutladın. İş arkadaşın sessizce seni yargıladı.'),
      ),
    ],
  },
  {
    id: 'base.ya_bill_split',
    category: 'random',
    minAge: 18,
    maxAge: 29,
    once: true,
    when: hasFriend,
    title: (c) => c.t('Brunch with friends. The bill has arrived.', inTr(c) ? 'Arkadaşlarla serpme kahvaltı. Hesap geldi.' : 'Arkadaşlarla kahvaltı. Hesap geldi.'),
    text: tt('You had tea and an egg. Someone else had three cocktails and a steak.', 'Sen bir çay ve bir yumurta yedin. Biri üç kokteyl ve bir biftek götürdü.'),
    choices: [
      opt('even', ['Split it evenly, for peace', 'Huzur için eşit bölün'], (c) =>
        out(c, { usd: -45, hap: 1 }, 'You split it evenly. Your egg cost as much as a steak. Friendship has a price, and this is it.', 'Eşit böldünüz. Yumurtan sana biftek fiyatına geldi. Arkadaşlığın bir bedeli var; işte bu.'),
      ),
      opt('own', ['Pay for what you had', 'Sadece yediğini öde'], (c) =>
        out(c, { usd: -10, hap: 1 }, 'You paid for your egg. There was a short silence. Then everyone else did the same, relieved.', 'Yumurtanın parasını ödedin. Kısa bir sessizlik oldu. Sonra herkes rahatlayarak aynısını yaptı.'),
      ),
      opt('all', ['Pay for everyone', 'Herkesinkini öde'], (c) =>
        out(c, { usd: -140, hap: 4 }, (inTr(c) ? 'You grabbed the bill first. It was a wrestling match, and you won.' : 'You grabbed the bill first. Everyone protested, briefly.'), inTr(c) ? 'Hesabı ilk sen kaptın. "Olmaz öyle şey!" diye bir güreş başladı ve sen kazandın.' : 'Hesabı ilk sen kaptın. Herkes kısa bir süre itiraz etti.'),
      ),
    ],
  },
  {
    id: 'base.ya_night_bus',
    category: 'random',
    minAge: 18,
    maxAge: 26,
    once: true,
    title: tt('You missed the last bus home.', 'Eve giden son otobüsü kaçırdın.'),
    text: tt('It is 1 a.m. Your phone is on 4 percent.', 'Saat gece bir. Telefonun yüzde dörtte.'),
    choices: [
      opt('walk', ['Walk home', 'Eve yürü'], (c) =>
        out(c, { hea: 2, hap: 2 }, 'You walked for an hour through a sleeping city. A fox crossed your path and looked at you as if you were the strange one.', 'Uyuyan bir şehirde bir saat yürüdün. Önünden bir tilki geçti ve sana asıl tuhaf olan senmişsin gibi baktı.'),
      ),
      opt('taxi', ['Take a taxi', 'Taksiye bin'], (c) =>
        out(c, { usd: -35, hap: 2 }, 'The driver told you his whole life story in twenty minutes. You tipped him for the plot twist.', 'Şoför yirmi dakikada bütün hayat hikâyesini anlattı. Beklenmedik son için bahşiş verdin.'),
      ),
      opt('friend', ['Sleep on a friend\'s sofa', 'Bir arkadaşının kanepesinde uyu'], (c) =>
        out(c, { hap: 3 }, 'You slept on a sofa under a coat and woke up to the smell of eggs. A friend in need is a friend with a sofa.', 'Bir kanepede, üstünde bir montla uyudun ve yumurta kokusuyla uyandın. Dost kara günde değil, gece yarısı belli olur.'),
      ),
    ],
  },
  {
    id: 'base.ya_found_phone',
    category: 'random',
    minAge: 18,
    maxAge: 29,
    once: true,
    title: tt('You found a phone on the train seat.', 'Trende koltukta bir telefon buldun.'),
    text: tt('It is ringing. The screen says "Mum".', 'Çalıyor. Ekranda "Annem" yazıyor.'),
    choices: [
      opt('answer', ['Answer it', 'Aç'], (c) =>
        out(c, { hap: 5 }, 'You told the mum. She cried with relief, phoned her son at work and they came to meet you with a cake. An actual cake.', 'Anneye haber verdin. Rahatlamaktan ağladı, oğlunu işte aradı ve sana bir pastayla geldiler. Gerçek bir pasta.'),
        { tone: 'good' },
      ),
      opt('hand', ['Hand it in at the station', 'İstasyondaki kayıp eşya bürosuna ver'], (c) =>
        out(c, { hap: 2 }, 'You handed it in. You will never know what happened. You choose to imagine a happy ending.', 'Teslim ettin. Ne olduğunu asla bilmeyeceksin. Mutlu bir son hayal etmeyi seçiyorsun.'),
      ),
      opt('ignore', ['Leave it', 'Bırak'], (c) =>
        out(c, { hap: -2 }, 'You left it there. It rang twice more before your stop. You still hear it sometimes.', 'Orada bıraktın. Senin durağına kadar iki kez daha çaldı. Bazen hâlâ duyuyorsun.'),
      ),
    ],
  },
  {
    id: 'base.ya_package',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    when: movedOut,
    title: tt('A neighbour\'s parcel was delivered to you.', 'Komşunun kargosu sana teslim edildi.'),
    text: tt('It is enormous and soft. The label says "Inflatable flamingo, 2 m".', 'Kocaman ve yumuşak. Etikette "Şişme flamingo, 2 m" yazıyor.'),
    choices: [
      opt('deliver', ['Take it round', 'Götür'], (c) =>
        out(c, { hap: 3 }, 'The neighbour turned out to be a quiet accountant with a pool party planned. You were invited. You went.', 'Komşu, havuz partisi planlayan sessiz bir muhasebeci çıktı. Davet edildin. Gittin.'),
        { tone: 'good' },
      ),
      opt('note', ['Leave a note and wait', 'Not bırakıp bekle'], (c) =>
        out(c, { hap: 1 }, 'The flamingo lived in your hall for a week. You started saying good morning to it.', 'Flamingo bir hafta koridorunda yaşadı. Ona günaydın demeye başladın.'),
      ),
      opt('inflate', ['Inflate it, just to see', 'Sırf görmek için şişir'], (c) =>
        out(c, { hap: 5 }, 'It filled your entire living room. The neighbour knocked at that exact moment. You both laughed for a long time.', 'Bütün salonunu kapladı. Komşu tam o anda kapıyı çaldı. İkiniz de uzun uzun güldünüz.'),
      ),
    ],
  },
  {
    id: 'base.ya_transfer',
    category: 'work',
    minAge: 22,
    maxAge: 29,
    once: true,
    when: (c) => working(c) && !settled(c),
    title: tt('Your employer offers you six months in another city.', 'İşyerin sana başka bir şehirde altı aylık bir görev teklif ediyor.'),
    text: (c) => c.t(`A small flat is included, plus ${cash(c, 2000)} extra.`, `Küçük bir daire ve üstüne ${cash(c, 2000)} veriyorlar.`),
    choices: [
      opt('go', ['Go', 'Git'], (c) =>
        out(c, { usd: 2000, hap: 5, sma: 1 }, 'Six months of new streets, new people and eating alone in good restaurants. You came back with stories and a bit of money.', 'Altı ay yeni sokaklar, yeni insanlar ve iyi restoranlarda tek başına yemekler. Hikâyelerle ve biraz parayla döndün.'),
        { badge: 'Big change' },
      ),
      opt('stay', ['Stay where your people are', 'Sevdiklerinin yanında kal'], (c) => {
        allParents(c, 2);
        return out(c, { hap: 1 }, 'You stayed. Someone else went and came back with a tan. You have a garden and a Sunday routine. Fair trade.', 'Kaldın. Başkası gidip bronzlaşarak döndü. Senin bir bahçen ve pazar alışkanlıkların var. Adil takas.');
      }),
      opt('negotiate', ['Ask for three months instead', 'Üç ay olsun diye pazarlık et'], (c) =>
        out(c, { usd: 900, hap: 3 }, 'They agreed to three months. Just enough to miss home and not enough to forget it.', 'Üç aya razı oldular. Evi özlemeye yetecek ama unutmaya yetmeyecek kadar.'),
      ),
    ],
  },
  {
    id: 'base.ya_interview_fruit',
    category: 'work',
    minAge: 19,
    maxAge: 27,
    once: true,
    title: tt('A job interviewer asks: "If you were a fruit, which would you be?"', 'İş görüşmesinde soruyorlar: "Bir meyve olsaydınız hangisi olurdunuz?"'),
    text: tt('There is a right answer. Nobody knows what it is.', 'Doğru bir cevabı var. Ne olduğunu kimse bilmiyor.'),
    choices: [
      opt('apple', ['"An apple. Reliable."', '"Elma. Güvenilir."'], (c) =>
        out(c, { hap: 1 }, 'The interviewer wrote something down. You will never know what. You did not get the job, but you got lunch.', 'Görüşmeci bir şey not aldı. Ne olduğunu asla bilmeyeceksin. İşi alamadın ama öğle yemeği yedin.'),
      ),
      opt('pineapple', ['"A pineapple. Tough outside, sweet inside."', '"Ananas. Dışı sert, içi tatlı."'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 5 }, 'The interviewer laughed and said that was the best answer all week. You got a second interview.', 'Görüşmeci güldü ve bunun bütün haftanın en iyi cevabı olduğunu söyledi. İkinci görüşmeye çağrıldın.'),
          (c) => out(c, { hap: -1 }, 'The interviewer said "interesting" in a voice that meant the opposite.', 'Görüşmeci tam tersini anlatan bir sesle "İlginç" dedi.'),
        ),
      ),
      opt('ask', ['"Which fruit is the company?"', '"Peki şirket hangi meyve?"'], (c) =>
        out(c, { sma: 2, hap: 3 }, 'The interviewer thought about it seriously and said "a tired banana". You both laughed. You liked them a lot.', 'Görüşmeci ciddi ciddi düşündü ve "yorgun bir muz" dedi. İkiniz de güldünüz. Onu çok sevdin.'),
      ),
    ],
  },
  {
    id: 'base.ya_startup',
    category: 'money',
    minAge: 22,
    maxAge: 29,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`${nmc(c, 'fr')} is starting a company and wants you to invest.`, `${nmc(c, 'fr')} bir şirket kuruyor ve senin de yatırım yapmanı istiyor.`),
    text: (c) => c.t(`It is an app that tells you when your plants are sad. They need ${cash(c, 1000)}.`, `Bitkileriniz üzüldüğünde size haber veren bir uygulama. ${cash(c, 1000)} lazım.`),
    choices: [
      opt('invest', ['Invest', 'Yatırım yap'], (c) =>
        gamble(
          c,
          0.25,
          (c) => {
            near(c, 'fr', 6);
            return out(c, { usd: 4000, hap: 8 }, 'The plant app was bought by a bigger company. Your share came back four times over. You are now insufferable about plants.', 'Bitki uygulamasını daha büyük bir şirket satın aldı. Payın dört katı olarak geri döndü. Artık bitkiler konusunda çekilmez birisin.');
          },
          (c) => {
            near(c, 'fr', 3);
            return out(c, { usd: -1000, hap: -2 }, 'The app closed after a year. The plants remain sad. Your friend gave you a cactus as an apology.', 'Uygulama bir yıl sonra kapandı. Bitkiler hâlâ üzgün. Arkadaşın özür olarak sana bir kaktüs verdi.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('help', ['Help for free instead', 'Onun yerine bedavaya yardım et'], (c) => {
        near(c, 'fr', 5);
        return out(c, { sma: 2, hap: 2 }, 'You spent weekends testing the app on your own plants. You learned a lot about apps and more about plants.', 'Hafta sonlarını uygulamayı kendi bitkilerinde deneyerek geçirdin. Uygulamalar hakkında çok, bitkiler hakkında daha çok şey öğrendin.');
      }),
      opt('no', ['Politely decline', 'Kibarca reddet'], (c) => {
        near(c, 'fr', -2);
        return out(c, { hap: 0 }, 'You said no. Your friend said they understood, in the voice people use when they understand very little.', 'Hayır dedin. Arkadaşın anladığını söyledi; pek bir şey anlamayan insanların ses tonuyla.');
      }),
    ],
  },

  // ================================================================ friends, love, family
  {
    id: 'base.ya_dating_app',
    category: 'love',
    minAge: 19,
    maxAge: 29,
    once: true,
    // the engine's own dating nudge (base.nudge_date) covers this moment once it has fired
    when: (c) => single(c) && c.p.eventLastAge['base.nudge_date'] === undefined,
    title: tt('A friend makes you sign up for a dating app.', 'Bir arkadaşın seni bir tanışma uygulamasına kaydettirdi.'),
    text: tt('Now you need a profile photo.', 'Şimdi bir profil fotoğrafı lazım.'),
    choices: [
      opt('real', ['An honest, normal photo', 'Dürüst, sıradan bir fotoğraf'], (c) =>
        out(c, { hap: 3 }, 'Honest photo, honest bio. Fewer matches, better conversations. One of them was about bread for two hours.', 'Dürüst fotoğraf, dürüst tanıtım. Daha az eşleşme, daha iyi sohbetler. Biri iki saat ekmek üzerineydi.'),
        { tone: 'good' },
      ),
      opt('fish', ['You holding a big fish', 'Elinde kocaman bir balıkla'], (c) =>
        out(c, { hap: 1 }, 'Everyone else also had a fish. It was a sea of fish. You deleted the app in a week.', 'Herkesin elinde balık vardı. Balık denizi gibiydi. Bir haftada uygulamayı sildin.'),
      ),
      opt('pet', ['A photo of your pet instead of you', 'Kendin yerine evcil hayvanının fotoğrafı'], (c) =>
        out(c, { hap: 3 }, 'Lots of people messaged to ask about the pet. Nobody asked about you. You understood completely.', 'Çok kişi hayvanı sormak için yazdı. Seni soran olmadı. Gayet anladın.'),
      ),
    ],
  },
  {
    id: 'base.ya_ex_text',
    category: 'love',
    minAge: 19,
    maxAge: 29,
    once: true,
    when: (c) => single(c) && c.p.relations.some((r) => r.kind === 'ex'),
    setup: (c) => {
      const ex = c.p.relations.filter((r) => r.kind === 'ex' && c.s.people[r.personId]?.deathYear === undefined);
      if (ex.length) c.vars.ex = c.rng.pick(ex).personId;
    },
    title: (c) => (c.vars.ex ? c.t(`Your ex, ${nmc(c, 'ex')}, texts at midnight: "Are you awake?"`, `Eski sevgilin ${nmc(c, 'ex')} gece yarısı yazdı: "Uyanık mısın?"`) : c.t('An old flame texts at midnight: "Are you awake?"', 'Eski bir aşk gece yarısı yazdı: "Uyanık mısın?"')),
    text: tt('You are, unfortunately, awake.', 'Ne yazık ki uyanıksın.'),
    choices: [
      opt('reply', ['Reply', 'Cevap ver'], (c) =>
        gamble(
          c,
          0.35,
          (c) => out(c, { hap: 4 }, 'You talked until three, kindly and honestly, and finally said the goodbye you never got to say. It felt like closing a door gently.', 'Saat üçe kadar nazikçe ve dürüstçe konuştunuz; hiç söyleyemediğin vedayı sonunda söyledin. Bir kapıyı usulca kapatmak gibiydi.'),
          (c) => out(c, { hap: -4 }, 'It was the same old argument, now with typos. You put the phone in a drawer.', 'Aynı eski kavgaydı, bu kez yazım hatalarıyla. Telefonu bir çekmeceye koydun.'),
        ),
      ),
      opt('sleep', ['Turn the phone off and sleep', 'Telefonu kapat ve uyu'], (c) =>
        out(c, { hap: 2, hea: 1 }, 'You turned it off. In the morning, there was a sunrise and no regrets.', 'Kapattın. Sabah bir gün doğumu vardı ve hiç pişmanlık yoktu.'),
        { tone: 'good' },
      ),
      opt('friend', ['Screenshot it to the group chat', 'Ekran görüntüsünü grup sohbetine at'], (c) =>
        out(c, { hap: 3 }, 'The group chat woke up instantly. The analysis lasted until dawn. You never replied. You were very well supported.', 'Grup sohbeti anında uyandı. Analiz sabaha kadar sürdü. Hiç cevap vermedin. Çok iyi desteklendin.'),
      ),
    ],
  },
  {
    id: 'base.ya_best_man',
    category: 'family',
    minAge: 22,
    maxAge: 29,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) =>
      c.p.gender === 'male'
        ? c.t(`${nmc(c, 'fr')} asks you to be best man.`, `${nmc(c, 'fr')} düğününde sağdıcı olmanı istiyor.`)
        : c.t(`${nmc(c, 'fr')} asks you to be maid of honour.`, `${nmc(c, 'fr')} düğününde nedimesi olmanı istiyor.`),
    text: (c) => c.t(`The outfit, the party and the trip will cost about ${cash(c, 900)}.`, `Kıyafet, eğlence ve yol, hepsi aşağı yukarı ${cash(c, 900)} tutacak.`),
    choices: [
      opt('yes', ['Say yes and do it properly', 'Evet de ve hakkını ver'], (c) => {
        near(c, 'fr', 10);
        return out(c, { hap: 6, usd: -900 }, 'You gave a speech that made the groom\'s grandmother laugh and the bride\'s father cry. Perfect balance.', 'Yaptığın konuşma damadın büyükannesini güldürdü, gelinin babasını ağlattı. Kusursuz denge.');
      }, { tone: 'good' }),
      opt('cheap', ['Say yes, on a budget', 'Evet de ama bütçeyle'], (c) => {
        near(c, 'fr', 5);
        return out(c, { hap: 3, usd: -300 }, 'You borrowed the outfit, organised a picnic instead of a trip, and everyone said it was the best part.', 'Kıyafeti ödünç aldın, gezi yerine piknik düzenledin; herkes en güzel kısmın o olduğunu söyledi.');
      }),
      opt('no', ['Say you cannot afford it', 'Karşılayamayacağını söyle'], (c) => {
        near(c, 'fr', -3);
        return out(c, { hap: -2 }, 'You were honest. Your friend understood, mostly. You were a very good guest instead.', 'Dürüst davrandın. Arkadaşın çoğunlukla anladı. Sen de onun yerine çok iyi bir misafir oldun.');
      }),
    ],
  },
  {
    id: 'base.ya_aunt_uncle',
    category: 'family',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: (c) => hasSibling(c) && c.h.relatives('sibling').some((s) => c.h.ageOf(s.person) >= 22),
    setup: (c) => {
      const older = c.h.relatives('sibling').filter((s) => c.h.ageOf(s.person) >= 22);
      c.vars.sib = c.rng.pick(older).person.id;
    },
    title: (c) => c.t(`${nmc(c, 'sib')} just had a baby. You are ${auntWord(c)[0]}!`, `${nmc(c, 'sib', 'gen')} bebeği oldu. Artık ${auntWord(c)[1]} oldun!`),
    text: tt('The baby is small, red and furious. You are in love.', 'Bebek minicik, kıpkırmızı ve çok sinirli. Âşık oldun.'),
    choices: [
      opt('fun', ['Be the fun one', 'Eğlenceli olan sen ol'], (c) => {
        near(c, 'sib', 5);
        return out(c, { hap: 6 }, 'You bought the loudest toy in the shop. The parents will never forgive you. The baby will never forget you.', 'Dükkândaki en gürültülü oyuncağı aldın. Anne babası seni asla affetmeyecek. Bebek seni asla unutmayacak.');
      }),
      opt('help', ['Offer to babysit every week', 'Her hafta bakıcılık teklif et'], (c) => {
        near(c, 'sib', 10);
        return out(c, { hap: 4, hea: -1 }, `${nmc(c, 'sib')} cried with gratitude. You learned to change a nappy in nine seconds.`, `${nmc(c, 'sib')} minnettarlıktan ağladı. Dokuz saniyede bez değiştirmeyi öğrendin.`);
      }, { tone: 'good' }),
      opt('gift', ['Open a small savings account for the baby', 'Bebek için küçük bir birikim hesabı aç'], (c) => {
        near(c, 'sib', 6);
        return out(c, { usd: -200, hap: 3 }, 'You opened a savings account for the baby. By the time they are eighteen, it will buy a bicycle. A good bicycle.', 'Bebek için bir birikim hesabı açtın. On sekizine geldiğinde bir bisiklet alacak kadar olacak. İyi bir bisiklet.');
      }),
    ],
  },
  {
    id: 'base.ya_parents_anniversary',
    category: 'family',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: (c) => c.h.relatives(['mother', 'father']).filter((r) => !r.rel.step).length >= 2,
    title: tt('Your parents\' thirtieth wedding anniversary is coming up.', 'Annenle babanın otuzuncu evlilik yıl dönümü yaklaşıyor.'),
    text: tt('They say they "don\'t want any fuss". They do.', '"Hiç uğraşmayın" diyorlar. Uğraşılsın istiyorlar.'),
    choices: [
      opt('party', ['Throw a surprise party', 'Sürpriz parti düzenle'], (c) => {
        allParents(c, 8);
        return out(c, { hap: 6, usd: -300 }, 'You found their old wedding song and played it as they walked in. Your dad cried first. Your mum pretended she did not.', 'Eski düğün şarkılarını bulup içeri girerken çaldın. Önce baban ağladı. Annen ağlamamış gibi yaptı.');
      }, { tone: 'good' }),
      opt('album', ['Make a photo album of their life', 'Hayatlarının fotoğraf albümünü yap'], (c) => {
        allParents(c, 7);
        return out(c, { hap: 4, sma: 1 }, 'You found photos of them before you existed. They were young and ridiculous and so in love. You cannot stop looking.', 'Sen doğmadan önceki fotoğraflarını buldun. Genç, gülünç ve çok âşıklardı. Bakmaktan kendini alamıyorsun.');
      }),
      opt('call', ['Call them on the day', 'O gün telefon et'], (c) => {
        allParents(c, 2);
        return out(c, { hap: 1 }, 'You called. They were pleased. They also mentioned that the neighbours\' son had organised a boat trip.', 'Aradın. Sevindiler. Komşunun oğlunun tekne turu ayarladığından da bahsettiler.');
      }),
    ],
  },
  {
    id: 'base.ya_grandparent_birthday',
    category: 'family',
    minAge: 18,
    maxAge: 29,
    once: true,
    when: hasGrand,
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} is turning eighty. You are asked to make a speech.`, `${Kw(c, 'gp')} seksen yaşına giriyor. Senden bir konuşma yapman isteniyor.`),
    text: tt('The whole family will be there, including the cousins who still owe you a bike.', 'Bütün aile orada olacak; sana hâlâ bir bisiklet borçlu olan kuzenler dahil.'),
    choices: [
      opt('story', ['Tell a story only you know', 'Sadece senin bildiğin bir hikâyeyi anlat'], (c) => {
        near(c, 'gp', 10);
        return out(c, { hap: 6 }, `You told the story of the summer ${kw(c, 'gp')} taught you to swim. The whole room went quiet, then clapped for a long time.`, `${Kw(c, 'gp', 'gen')} sana yüzmeyi öğrettiği yazı anlattın. Bütün salon sustu, sonra uzun uzun alkışladı.`);
      }, { tone: 'good' }),
      opt('funny', ['Make it funny', 'Komik olsun'], (c) => {
        near(c, 'gp', 5);
        return out(c, { hap: 5 }, 'You did ten minutes of jokes. The birthday star laughed hardest. One aunt did not. She never does.', 'On dakika şaka yaptın. En çok doğum günü sahibi güldü. Bir teyze gülmedi. O hiç gülmez.');
      }),
      opt('short', ['Keep it to one sentence', 'Tek cümleyle bitir'], (c) => {
        near(c, 'gp', 3);
        return out(c, { hap: 2 }, `You said: "Thank you for everything." ${Kw(c, 'gp')} said it was the best speech, because it left time for cake.`, `"Her şey için teşekkür ederim" dedin. ${Kw(c, 'gp')} bunun en iyi konuşma olduğunu söyledi, çünkü pastaya vakit kaldı.`);
      }),
    ],
  },
  {
    id: 'base.ya_language_exchange',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    setup: (c) => newKid(c, 'kid', 3),
    title: tt('You went to a language exchange night at a café.', 'Bir kafedeki dil değişim buluşmasına gittin.'),
    text: (c) => c.t(`${nmc(c, 'kid')} wants to practise your language. You want to practise theirs.`, `${nmc(c, 'kid')} senin dilini çalışmak istiyor. Sen de onunkini.`),
    choices: [
      opt('swap', ['Switch languages every half hour', 'Her yarım saatte dil değiştirin'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { sma: 3, hap: 3 }, `You and ${nmc(c, 'kid')} talked for three hours in two broken languages and understood each other perfectly.`, `${nmc(c, 'kid', 'wth')} iki yarım yamalak dilde üç saat konuştunuz ve birbirinizi mükemmel anladınız.`);
      }, { tone: 'good' }),
      opt('slang', ['Teach each other only slang', 'Birbirinize sadece argo öğretin'], (c) => {
        befriend(c, 'kid', 45);
        return out(c, { hap: 5 }, 'You learned eleven ways to say "no way". None of them are in any textbook. All of them are useful.', '"Hadi oradan" demenin on bir yolunu öğrendin. Hiçbiri ders kitaplarında yok. Hepsi işe yarar.');
      }),
      opt('listen', ['Mostly listen', 'Çoğunlukla dinle'], (c) =>
        out(c, { sma: 1, hap: 1 }, 'You listened, nodded a lot and said "yes" in the new language eleven times, sometimes correctly.', 'Dinledin, bolca başını salladın ve yeni dilde on bir kez "evet" dedin; bazen doğru yerde.'),
      ),
    ],
  },
  {
    id: 'base.ya_half_marathon',
    category: 'health',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`${nmc(c, 'fr')} signed you both up for a half marathon.`, `${nmc(c, 'fr')} ikinizi de yarı maratona yazdırdı.`),
    text: tt('It is in four months. You get out of breath on stairs.', 'Dört ay sonra. Sen merdivende bile nefes nefese kalıyorsun.'),
    choices: [
      opt('train', ['Train properly', 'Düzgünce antrenman yap'], (c) => {
        near(c, 'fr', 5);
        return out(c, { hea: 6, hap: 6 }, 'You trained every week and finished in two hours and thirty minutes, holding hands with your friend across the line.', 'Her hafta antrenman yaptın ve iki saat otuz dakikada bitirdin; çizgiyi arkadaşınla el ele geçtiniz.');
      }, { tone: 'good' }),
      opt('wing', ['Wing it on the day', 'O gün nasılsa koşarsın'], (c) =>
        gamble(
          c,
          0.4,
          (c) => out(c, { hea: 2, hap: 4 }, 'You walked most of it, ran the last kilometre for the photos and got a medal. A medal is a medal.', 'Çoğunu yürüdün, fotoğraflar için son kilometreyi koştun ve madalya aldın. Madalya madalyadır.'),
          (c) => out(c, { hea: -4, hap: -2 }, 'Your knees gave up at kilometre nine. You watched the rest from a first-aid tent with a banana.', 'Dizlerin dokuzuncu kilometrede pes etti. Gerisini bir ilk yardım çadırından, elinde bir muzla izledin.'),
        ),
      ),
      opt('cheer', ['Go as their cheerleader instead', 'Onun yerine amigosu ol'], (c) => {
        near(c, 'fr', 4);
        return out(c, { hap: 4 }, 'You made a sign that said "RUN LIKE YOUR EX IS BEHIND YOU". It went viral among the runners.', '"ESKİ SEVGİLİN ARKANDAYMIŞ GİBİ KOŞ" yazan bir pankart yaptın. Koşucular arasında bir anda yayıldı.');
      }),
    ],
  },
  {
    id: 'base.ya_wisdom_teeth',
    category: 'health',
    minAge: 18,
    maxAge: 26,
    once: true,
    title: tt('Your wisdom teeth have to come out.', 'Yirmilik dişlerinin çekilmesi gerekiyor.'),
    text: tt('All four. On the same day. The dentist says "you will barely feel it".', 'Dördü birden. Aynı gün. Diş hekimi "Neredeyse hiçbir şey hissetmeyeceksin" diyor.'),
    choices: [
      opt('all', ['All four at once', 'Dördünü birden çektir'], (c) =>
        out(c, { hea: -2, hap: 1, usd: -300 }, 'You looked like a hamster for a week and ate only soup. But it is done, and you said some very strange things under the anaesthetic.', 'Bir hafta hamster gibi göründün ve sadece çorba içtin. Ama bitti; bir de narkozun etkisiyle çok tuhaf şeyler söyledin.'),
      ),
      opt('two', ['Two now, two later', 'İkisi şimdi, ikisi sonra'], (c) =>
        out(c, { hea: -1, usd: -350 }, 'You did it in two rounds. Twice the soup weeks, half the hamster face each time. Mathematically the same.', 'İki seferde yaptırdın. İki kat çorba haftası, her seferinde yarım hamster yüzü. Matematiksel olarak aynı.'),
      ),
      opt('later', ['Put it off', 'Ertele'], (c) =>
        out(c, { hea: -3, hap: -1 }, 'You put it off until one of them got angry on its own. The emergency appointment was a Sunday. Lesson learned.', 'Biri kendi kendine azana kadar erteledin. Acil randevu pazar gününe denk geldi. Ders alındı.'),
        { tone: 'bad' },
      ),
    ],
  },
  {
    id: 'base.ya_food_poisoning',
    category: 'health',
    minAge: 18,
    maxAge: 29,
    once: true,
    title: (c) => c.t('A street food stall is open at 2 a.m.', inTr(c) ? 'Gece ikide bir kokoreççi hâlâ açık.' : 'Gece ikide bir sokak yemeği tezgâhı hâlâ açık.'),
    text: tt('It smells amazing. The cook is asleep standing up.', 'Kokusu harika. Aşçı ayakta uyuyor.'),
    choices: [
      opt('eat', ['Eat', 'Ye'], (c) =>
        gamble(
          c,
          0.7,
          (c) => out(c, { hap: 5 }, 'It was the best thing you have ever eaten. You go back every time you are out late. You know the cook\'s name now.', 'Hayatında yediğin en güzel şeydi. Ne zaman geç kalsan oraya gidiyorsun. Artık aşçının adını biliyorsun.'),
          (c) => out(c, { hea: -5, hap: -3 }, 'It was delicious for one hour and terrible for two days. You cannot look at that stall any more.', 'Bir saat boyunca enfesti, iki gün boyunca berbat. Artık o tezgâha bakamıyorsun.'),
        ),
        { badge: 'Risky' },
      ),
      opt('half', ['Share a half portion with a friend', 'Bir arkadaşınla yarım porsiyon paylaş'], (c) =>
        out(c, { hap: 3 }, 'Half the risk, all the joy. You both sat on the curb and agreed this was what being young was for.', 'Yarı risk, tam keyif. Kaldırıma oturdunuz ve gençliğin tam da bunun için olduğu konusunda anlaştınız.'),
      ),
      opt('home', ['Go home and eat toast', 'Eve git, kızarmış ekmek ye'], (c) =>
        out(c, { hea: 1 }, 'You ate toast at home. Your stomach thanked you. Your soul did not.', 'Evde kızarmış ekmek yedin. Miden teşekkür etti. Ruhun etmedi.'),
      ),
    ],
  },
  {
    id: 'base.ya_lost_luggage',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    title: tt('The airline lost your suitcase on holiday.', 'Tatilde havayolu bavulunu kaybetti.'),
    text: tt('You have what you are wearing and a toothbrush from the hotel.', 'Üstündekiler ve otelden bir diş fırçası var.'),
    choices: [
      opt('shop', ['Buy a whole new holiday wardrobe', 'Baştan aşağı yeni tatil kıyafetleri al'], (c) =>
        out(c, { usd: -250, loo: 2, hap: 3 }, 'You bought local clothes and looked better than you ever have. The suitcase arrived on your last day. You barely noticed.', 'Yerel kıyafetler aldın ve hiç olmadığın kadar iyi göründün. Bavul son gün geldi. Neredeyse fark etmedin.'),
      ),
      opt('complain', ['Fight the airline', 'Havayoluyla uğraş'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { usd: 300, sma: 1, hap: 2 }, 'You filled in every form. Three months later, they paid you compensation. Patience wins.', 'Bütün formları doldurdun. Üç ay sonra tazminat ödediler. Sabır kazanır.'),
          (c) => out(c, { hap: -2 }, 'Hours on hold. The hold music is now permanently in your head. No compensation.', 'Saatlerce hatta bekledin. Bekleme müziği artık kalıcı olarak kafanda. Tazminat yok.'),
        ),
      ),
      opt('same', ['Wear the same thing all week', 'Bütün hafta aynı şeyi giy'], (c) =>
        out(c, { hap: 2, loo: -1 }, 'You washed your one outfit in the sink every night. You have never felt so free. Or so crumpled.', 'Tek kıyafetini her gece lavaboda yıkadın. Hiç bu kadar özgür hissetmemiştin. Ya da bu kadar buruşuk.'),
      ),
    ],
  },
  {
    id: 'base.ya_haircut',
    category: 'random',
    minAge: 18,
    maxAge: 29,
    once: true,
    title: tt('You asked the hairdresser for "something different".', 'Kuaföre "farklı bir şey" yap dedin.'),
    text: tt('You are looking in the mirror. It is different.', 'Aynaya bakıyorsun. Gerçekten farklı.'),
    choices: [
      opt('own', ['Own it completely', 'Tamamen sahiplen'], (c) =>
        out(c, { loo: 2, hap: 4 }, 'You walked out as if you had planned it for years. Three people asked where you had it done.', 'Yıllardır planlıyormuşsun gibi çıktın. Üç kişi nerede yaptırdığını sordu.'),
        { tone: 'good' },
      ),
      opt('hat', ['Buy a hat', 'Bir şapka al'], (c) =>
        out(c, { hap: 1, usd: -25 }, 'You wore a hat for six weeks. It is a very nice hat. You are now known for the hat.', 'Altı hafta şapka taktın. Çok güzel bir şapka. Artık şapkanla tanınıyorsun.'),
      ),
      opt('cry', ['Cry a little in the car', 'Arabada biraz ağla'], (c) =>
        out(c, { hap: -2 }, 'You cried a little in the car. It grew back. Hair always does. Pride, slower.', 'Arabada biraz ağladın. Uzadı. Saç hep uzar. Gurur daha yavaş.'),
      ),
    ],
  },
  {
    id: 'base.ya_grey_hair',
    category: 'health',
    minAge: 27,
    maxAge: 29,
    once: true,
    title: tt('You found your first grey hair.', 'İlk beyaz saçını buldun.'),
    text: tt('It is shining at you under the bathroom light.', 'Banyo ışığının altında sana parlıyor.'),
    choices: [
      opt('pull', ['Pull it out', 'Kopar'], (c) =>
        aliveKin(c, 'grandparent', 'female')
          ? out(c, { hap: 1 }, 'You pulled it out. Your grandmother says two will come to its funeral. You do not believe her. Yet.', 'Kopardın. Ninen cenazesine iki tane geleceğini söylüyor. Henüz inanmıyorsun.')
          : out(c, { hap: 1 }, 'You pulled it out. An old saying has it that two will come to its funeral. You do not believe it. Yet.', 'Kopardın. Eskiler cenazesine iki tane gelir der. Henüz inanmıyorsun.'),
      ),
      opt('name', ['Name it', 'Ona bir isim ver'], (c) =>
        out(c, { hap: 3 }, 'You named it Gerald. Gerald is distinguished. Gerald stays.', 'Adını Nuri koydun. Nuri çok ağırbaşlı. Nuri kalıyor.'),
      ),
      opt('wise', ['Decide you are now wise', 'Artık bilge olduğuna karar ver'], (c) =>
        out(c, { sma: 1, hap: 2 }, 'You started giving advice to younger cousins. It was mostly about tax. They did not ask.', 'Küçük kuzenlerine tavsiye vermeye başladın. Çoğu vergiyle ilgiliydi. Sormamışlardı.'),
      ),
    ],
  },
  {
    id: 'base.ya_bike_commute',
    category: 'health',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: working,
    title: tt('You are thinking of cycling to work.', 'İşe bisikletle gitmeyi düşünüyorsun.'),
    text: tt('It is twelve kilometres. There is one big hill. There is always one big hill.', 'On iki kilometre. Bir büyük yokuş var. Her zaman bir büyük yokuş vardır.'),
    choices: [
      opt('do', ['Start on Monday', 'Pazartesi başla'], (c) =>
        out(c, { hea: 6, hap: 3, usd: 200 }, 'By spring the hill was nothing and you had saved a fortune on bus fares. You arrive at work glowing and slightly smug.', 'Bahara kadar yokuş hiçbir şey olmuştu ve otobüs parasından ciddi tasarruf etmiştin. İşe pırıl pırıl ve biraz kendini beğenmiş geliyorsun.'),
        { tone: 'good' },
      ),
      opt('electric', ['Get an electric bike', 'Elektrikli bisiklet al'], (c) =>
        out(c, { hea: 2, hap: 4, usd: -600 }, 'The electric bike flies up the hill. Real cyclists glare at you. You wave.', 'Elektrikli bisiklet yokuşu uçarak çıkıyor. Gerçek bisikletçiler sana dik dik bakıyor. Sen el sallıyorsun.'),
      ),
      opt('think', ['Keep thinking about it', 'Düşünmeye devam et'], (c) =>
        out(c, { hap: 0 }, 'You thought about it for a year. You bought a helmet. It is lovely. It is in the hall.', 'Bir yıl düşündün. Bir kask aldın. Çok güzel. Koridorda duruyor.'),
      ),
    ],
  },
  {
    id: 'base.ya_dinner_party',
    category: 'random',
    minAge: 21,
    maxAge: 29,
    once: true,
    when: (c) => movedOut(c) && hasFriend(c),
    title: tt('You are hosting your first proper dinner party.', 'İlk düzgün akşam yemeği davetini veriyorsun.'),
    text: tt('Six guests. You have four chairs and five forks.', 'Altı misafir. Dört sandalyen ve beş çatalın var.'),
    choices: [
      opt('cook', ['Cook something you have never cooked', 'Hiç yapmadığın bir şey pişir'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 6, usd: -80 }, 'It worked! People asked for the recipe. You said it was a family secret, which is what you call a video.', 'Oldu! Tarifini istediler. Aile sırrı dedin; bir videoya böyle diyorsun.'),
          (c) => out(c, { hap: 2, usd: -110 }, 'It failed spectacularly. You ordered pizza and everyone said it was the best night in ages. It was.', 'Muhteşem bir şekilde batırdın. Pizza söyledin ve herkes yıllardır böyle güzel bir gece geçirmediğini söyledi. Doğruydu.'),
        ),
      ),
      opt('potluck', ['Make it a potluck', 'Herkes bir şey getirsin'], (c) =>
        out(c, { hap: 5, usd: -20 }, 'Everyone brought something. Three people brought hummus. Nobody minded. It was a hummus night.', 'Herkes bir şey getirdi. Üç kişi humus getirdi. Kimse umursamadı. Humus gecesiydi.'),
        { tone: 'good' },
      ),
      opt('floor', ['Eat on the floor like a picnic', 'Piknik gibi yerde yiyin'], (c) =>
        out(c, { hap: 4, usd: -50 }, 'Cushions, candles and a tablecloth on the floor. Your friends now call it "the floor dinner" and want it every year.', 'Minderler, mumlar ve yere serilmiş bir örtü. Arkadaşların buna "yer sofrası" diyor ve her yıl istiyor.'),
      ),
    ],
  },
  {
    id: 'base.ya_bayram_harclik',
    category: 'family',
    minAge: 18,
    maxAge: 25,
    once: true,
    when: (c) => inTr(c) && hasParent(c),
    title: tt('It is bayram, and an aunt is pressing money into your hand.', 'Bayram ve bir teyzen eline zorla para sıkıştırıyor.'),
    text: tt('You are twenty-something. She does not care.', 'Yirmili yaşlardasın. Onun umurunda değil.'),
    choices: [
      opt('take', ['Accept, kiss her hand', 'Kabul et, elini öp'], (c) =>
        out(c, { usd: 40, hap: 4 }, 'You kissed her hand and took the money. She looked deeply satisfied. Some traditions are about the giver.', 'Elini öptün ve parayı aldın. Derin bir memnuniyetle baktı. Bazı gelenekler veren için vardır.'),
        { tone: 'good' },
      ),
      opt('refuse', ['Refuse politely', 'Kibarca reddet'], (c) =>
        out(c, { hap: 1 }, 'You refused. She put the money in your coat pocket while you were hugging her. Undefeated.', 'Reddettin. Sen ona sarılırken parayı montunun cebine koydu. Yenilmez.'),
      ),
      opt('kids', ['Give it to the little cousins', 'Küçük kuzenlere ver'], (c) =>
        c.p.gender === 'female'
          ? out(c, { hap: 5 }, 'You passed it on to the little cousins. Now you are the aunt in their story. The circle of bayram.', 'Küçük kuzenlere verdin. Artık onların hikâyesinde teyze sensin. Bayramın döngüsü.')
          : out(c, { hap: 5 }, 'You passed it on to the little cousins. Now you are the uncle in their story. The circle of bayram.', 'Küçük kuzenlere verdin. Artık onların hikâyesinde amca sensin. Bayramın döngüsü.'),
      ),
    ],
  },
  {
    id: 'base.ya_wedding_plus_one',
    category: 'love',
    minAge: 22,
    maxAge: 29,
    once: true,
    when: single,
    title: tt('A wedding invitation says "plus one".', 'Bir düğün davetiyesinde "ve eşi" yazıyor.'),
    text: tt('You do not have a plus one. You have three weeks.', 'Bir eşin yok. Üç haftan var.'),
    choices: [
      opt('alone', ['Go alone and dance with everyone', 'Yalnız git ve herkesle dans et'], (c) =>
        out(c, { hap: 6 }, 'You danced with the bride\'s grandmother, two cousins and a waiter. Best night of the year.', 'Gelinin büyükannesiyle, iki kuzenle ve bir garsonla dans ettin. Yılın en güzel gecesi.'),
        { tone: 'good' },
      ),
      opt('friend', ['Bring a friend', 'Bir arkadaşını götür'], (c) =>
        out(c, { hap: 4 }, 'You brought a friend, who caught the bouquet. Everyone assumed things. You both let them.', 'Bir arkadaşını götürdün; çiçeği o tuttu. Herkes bir şeyler sandı. İkiniz de sanmalarına izin verdiniz.'),
      ),
      opt('meet', ['Hope to meet someone there', 'Orada biriyle tanışmayı um'], (c) => {
        const p = newKid(c, 'kid', 3, c.p.gender === 'female' ? 'male' : 'female');
        return gamble(
          c,
          0.35,
          (c) => {
            befriend(c, 'kid', 50);
            return out(c, { hap: 6 }, `You met ${p.firstName} at the cake table. You talked until the band packed up. You swapped numbers.`, `Pasta masasında ${wth(p.firstName)} tanıştın. Orkestra toparlanana kadar konuştunuz. Numaralarınızı aldınız.`);
          },
          (c) => out(c, { hap: 1 }, 'You met nobody, but you ate three slices of cake. Some nights the cake is the romance.', 'Kimseyle tanışmadın ama üç dilim pasta yedin. Bazı geceler romantizm pastadır.'),
        );
      }),
    ],
  },

  // ================================================================ callbacks to childhood
  {
    id: 'base.ya_capsule',
    category: 'childhood',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: (c) => !!ysPeek(c).capsule,
    title: tt('You remembered the time capsule.', 'Zaman kapsülünü hatırladın.'),
    text: tt('The old tree is still there. So, probably, is the biscuit tin.', 'Yaşlı ağaç hâlâ orada. Bisküvi kutusu da muhtemelen.'),
    choices: [
      opt('dig', ['Dig it up', 'Kazıp çıkar'], (c) =>
        out(c, { hap: 7 }, 'The letter was damp but readable. "Dear future me, do you still hate peas?" You do. Some things are forever.', 'Mektup nemliydi ama okunuyordu. "Sevgili gelecekteki ben, bezelyeden hâlâ nefret ediyor musun?" Ediyorsun. Bazı şeyler sonsuzdur.'),
        { tone: 'good' },
      ),
      opt('add', ['Dig it up and add a new letter', 'Çıkar, yeni bir mektup ekle, yeniden göm'], (c) => {
        ys(c).capsule = c.s.year;
        return out(c, { hap: 5, sma: 1 }, 'You added a letter to your forty-year-old self and buried it again. You wrote "please be kind to yourself". You meant it.', 'Kırk yaşındaki kendine bir mektup ekleyip yeniden gömdün. "Lütfen kendine iyi davran" yazdın. İçtendi.');
      }),
      opt('leave', ['Leave it buried', 'Gömülü kalsın'], (c) =>
        out(c, { hap: 2 }, 'You decided some things should stay where you left them. You walked past the tree and smiled.', 'Bazı şeylerin bırakıldığı yerde kalması gerektiğine karar verdin. Ağacın önünden gülümseyerek geçtin.'),
      ),
    ],
  },
  {
    id: 'base.ya_penpal',
    category: 'random',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: (c) => alive(c, ysPeek(c).penpal),
    setup: (c) => {
      c.vars.pal = String(ysPeek(c).penpal);
    },
    title: (c) => c.t(`Your old pen pal ${nmc(c, 'pal')} is visiting your city.`, `Eski mektup arkadaşın ${nmc(c, 'pal')} şehrine geliyor.`),
    text: tt('You have never met. You have exchanged about two hundred drawings of goats.', 'Hiç yüz yüze görüşmediniz. Aşağı yukarı iki yüz keçi çizimi alışverişi yaptınız.'),
    choices: [
      opt('meet', ['Meet for coffee', 'Kahve içmek için buluşun'], (c) => {
        befriend(c, 'pal', 70);
        return out(c, { hap: 7 }, `${nmc(c, 'pal')} walked into the café holding a drawing of a goat. You laughed until the waiter asked if you were all right.`, `${nmc(c, 'pal')} kafeye elinde bir keçi çizimiyle girdi. Garson iyi olup olmadığınızı soracak kadar güldünüz.`);
      }, { tone: 'good' }),
      opt('host', ['Let them stay at your place', 'Sende kalsın'], (c) => {
        befriend(c, 'pal', 75);
        return out(c, { hap: 6, usd: -100 }, `${nmc(c, 'pal')} stayed a week. It felt like you had known each other forever, because you had.`, `${nmc(c, 'pal')} bir hafta kaldı. Birbirinizi sonsuzdan beri tanıyor gibiydiniz; çünkü tanıyordunuz.`);
      }),
      opt('nervous', ['Get nervous and cancel', 'Heyecanlanıp iptal et'], (c) =>
        out(c, { hap: -3 }, 'You cancelled. They sent a goat drawing anyway, with a sad face. You will make it up to them.', 'İptal ettin. Yine de üzgün suratlı bir keçi çizimi yolladı. Telafi edeceksin.'),
      ),
    ],
  },
  {
    id: 'base.ya_bully_again',
    category: 'random',
    minAge: 20,
    maxAge: 29,
    once: true,
    when: (c) => alive(c, ysPeek(c).bully),
    setup: (c) => {
      c.vars.bully = String(ysPeek(c).bully);
    },
    title: (c) => c.t(`${nmc(c, 'bully')}, the bully from school, is serving you at a café.`, `Okuldaki zorba ${nmc(c, 'bully')}, bir kafede sana servis yapıyor.`),
    text: tt('They recognise you. They go very red.', 'Seni tanıdı. Kıpkırmızı oldu.'),
    choices: [
      opt('kind', ['Be kind', 'Nazik ol'], (c) => {
        ys(c).bully = undefined;
        return out(c, { hap: 5 }, `You said hello like an old classmate. ${nmc(c, 'bully')} apologised, quietly, for everything. You accepted. You left a big tip.`, `Eski bir sınıf arkadaşı gibi selam verdin. ${nmc(c, 'bully')} her şey için sessizce özür diledi. Kabul ettin. Büyük bir bahşiş bıraktın.`);
      }, { tone: 'good' }),
      opt('cold', ['Be polite and cold', 'Kibar ama soğuk ol'], (c) =>
        out(c, { hap: 2 }, 'You ordered, paid and left without a word more than needed. It felt like a door closing. Fine by you.', 'Sipariş verdin, ödedin ve gerekenden fazla tek kelime etmeden çıktın. Bir kapının kapanması gibiydi. Sana uyar.'),
      ),
      opt('remind', ['Remind them, loudly', 'Yüksek sesle hatırlat'], (c) =>
        out(c, { hap: -1 }, 'You reminded them about the bin, in front of everyone. It did not feel the way you hoped it would.', 'Herkesin önünde çöp kutusunu hatırlattın. Umduğun gibi hissettirmedi.'),
      ),
    ],
  },
  {
    id: 'base.ya_teacher_retires',
    category: 'random',
    minAge: 21,
    maxAge: 29,
    once: true,
    when: (c) => alive(c, ysPeek(c).teacher),
    setup: (c) => {
      c.vars.tch = String(ysPeek(c).teacher);
    },
    title: (c) => {
      const p = c.h.person(String(c.vars.tch));
      return c.t(`${p.gender === 'female' ? 'Ms.' : 'Mr.'} ${p.lastName}, who once read your story, is retiring.`, `Bir zamanlar hikâyeni okuyan ${p.firstName} Öğretmen emekli oluyor.`);
    },
    text: tt('Old students are writing letters for a farewell book.', 'Eski öğrenciler bir veda kitabı için mektup yazıyor.'),
    choices: [
      opt('letter', ['Write a long letter', 'Uzun bir mektup yaz'], (c) =>
        out(c, { hap: 6, sma: 1 }, 'You wrote about the three books and the note that said "keep going". You heard later that it was read out at the party, and that it made the room cry.', 'Üç kitabı ve "devam et" yazan notu anlattın. Sonradan mektubunun vedada okunduğunu ve salonu ağlattığını duydun.'),
        { tone: 'good' },
      ),
      opt('visit', ['Go to the farewell in person', 'Vedaya bizzat git'], (c) =>
        out(c, { hap: 7 }, 'You walked in and your old teacher recognised you instantly, and said your full name the way they used to when you talked in class.', 'İçeri girdin ve eski öğretmenin seni hemen tanıdı; derste konuştuğunda söylediği gibi tam adınla seslendi.'),
      ),
      opt('busy', ['Mean to, but miss it', 'Niyetin var ama kaçır'], (c) =>
        out(c, { hap: -2 }, 'You meant to write. The book was printed without you. You still have the note that said "keep going".', 'Yazmayı düşündün. Kitap sensiz basıldı. "Devam et" yazan not hâlâ sende.'),
      ),
    ],
  },
  {
    id: 'base.ya_old_club',
    category: 'random',
    minAge: 19,
    maxAge: 29,
    once: true,
    when: (c) => !!ysPeek(c).club,
    title: (c) => {
      switch (ysPeek(c).club) {
        case 'chess':
          return c.t('An old man in the park is playing chess against himself.', 'Parkta yaşlı bir adam kendi kendine satranç oynuyor.');
        case 'drama':
          return c.t('A local amateur theatre is holding auditions.', 'Mahalledeki amatör tiyatro seçmeler yapıyor.');
        case 'football':
          return c.t('A Sunday league team is one player short.', 'Pazar ligindeki bir takımın bir oyuncusu eksik.');
        case 'robotics':
          return c.t('There is a weekend hackathon in town.', 'Şehirde bir hafta sonu yazılım maratonu var.');
        case 'choir':
          return c.t('A friend\'s wedding singer has cancelled.', 'Bir arkadaşının düğününde şarkı söyleyecek kişi son anda iptal etti.');
        default:
          return c.t('A café owner asks if anyone can paint a mural on her wall.', 'Bir kafenin sahibi duvarına resim yapabilecek birini arıyor.');
      }
    },
    text: tt('Something from your school club days wakes up.', 'Okul kulübü günlerinden bir şey içinde uyanıyor.'),
    choices: [
      opt('yes', ['Do it', 'Yap'], (c) =>
        gamble(
          c,
          0.65,
          (c) => out(c, { hap: 7, sma: 1 }, 'You still had it, all of it. It felt like meeting an old friend who happened to be you.', 'Hepsi hâlâ sendeydi. Tesadüfen sen olan eski bir dostla karşılaşmak gibiydi.'),
          (c) => out(c, { hap: 2 }, 'You were rustier than you hoped, and you loved every clumsy minute.', 'Umduğundan paslıydın ama her sakar dakikasını sevdin.'),
        ),
        { tone: 'good' },
      ),
      opt('watch', ['Just watch', 'Sadece izle'], (c) =>
        out(c, { hap: 2 }, 'You watched for a while, smiled and walked on, humming. Not today. Maybe soon.', 'Bir süre izledin, gülümsedin ve mırıldanarak yürüdün. Bugün değil. Belki yakında.'),
      ),
      opt('teach', ['Offer to teach kids instead', 'Onun yerine çocuklara öğretmeyi teklif et'], (c) =>
        out(c, { hap: 5, sma: 1 }, 'You ended up running a Saturday group for kids. They are terrible and wonderful, just like you were.', 'Sonunda çocuklar için bir cumartesi grubu yürütmeye başladın. Berbatlar ve harikalar; tıpkı senin olduğun gibi.'),
      ),
    ],
  },
  {
    id: 'base.ya_school_reunion',
    category: 'random',
    minAge: 27,
    maxAge: 29,
    once: true,
    title: tt('Ten-year school reunion.', 'Okuldan on yıllık mezunlar buluşması.'),
    text: tt('The group chat has eighty people and one organiser who is clearly exhausted.', 'Grup sohbetinde seksen kişi ve belli ki tükenmiş bir organizatör var.'),
    choices: [
      opt('go', ['Go and see everyone', 'Git, herkesi gör'], (c) => {
        const kid = newKid(c, 'kid', 0);
        befriend(c, 'kid', 45);
        return out(c, { hap: 6 }, `The cool kids were tired, the quiet kids were thriving, and ${kid.firstName} remembered something kind you did in fourth grade. You did not.`, `Havalı çocuklar yorgundu, sessiz olanlar parlıyordu ve ${kid.firstName} senin dördüncü sınıfta yaptığın iyi bir şeyi hatırladı. Sen hatırlamıyordun.`);
      }, { tone: 'good' }),
      opt('impress', ['Go, and exaggerate your life a little', 'Git ve hayatını biraz abart'], (c) =>
        out(c, { hap: 3 }, 'You said you were "in logistics". Everyone else was also "in logistics". Nobody knows what anyone does.', '"Lojistikteyim" dedin. Herkes "lojistikteydi". Kimse kimin ne iş yaptığını bilmiyor.'),
      ),
      opt('skip', ['Skip it and look at the photos', 'Gitme, fotoğraflara bak'], (c) =>
        out(c, { hap: 1 }, 'You looked at the photos for an hour. Everyone looked older and exactly the same.', 'Bir saat fotoğraflara baktın. Herkes daha yaşlı ve tıpatıp aynı görünüyordu.'),
      ),
    ],
  },
];

/** The person in vars.prof (setup of the office-hours event). */
function who(c: Ctx) {
  return c.h.person(String(c.vars.prof));
}

/** What the player becomes when a sibling has a baby: Turkish names the side (teyze/hala, dayı/amca). */
function auntWord(c: Ctx): [string, string] {
  const sib = c.h.person(String(c.vars.sib));
  const sisBaby = sib?.gender === 'female';
  if (c.p.gender === 'female') return ['an aunt', sisBaby ? 'teyze' : 'hala'];
  return ['an uncle', sisBaby ? 'dayı' : 'amca'];
}
