import type { EventDef } from '../types';
import { inTr } from './events-flavour';
import { da } from './util';
import {
  Kw,
  allParents,
  befriend,
  cash,
  gamble,
  hasFriend,
  hasGrand,
  hasParent,
  hasSibling,
  inHigh,
  inSchool,
  kw,
  near,
  newAdult,
  newKid,
  nmc,
  nudgeGrades,
  opt,
  out,
  pickFriend,
  pickGrand,
  pickParent,
  pickSibling,
  tt,
} from './young-kit';
import { bothParents } from './kin';

// Round 4: teen years, 13–19. Home, friends, first money, first responsibilities.

export const youngTeenEvents: EventDef[] = [
  {
    id: 'base.yt_babysit',
    category: 'work',
    minAge: 13,
    maxAge: 16,
    once: true,
    title: tt('The neighbours ask you to babysit their twins.', 'Komşular ikizlerine bakmanı istiyor.'),
    text: (c) => c.t(`They are four. They pay ${cash(c, 40)} for the evening.`, `Dört yaşındalar. Akşam için ${cash(c, 40)} veriyorlar.`),
    choices: [
      opt('games', ['Wear them out with games', 'Oyunlarla yor'], (c) =>
        out(c, { hap: 3, usd: 40 }, 'You played tag for two hours. The twins slept like stones. You did too, on the sofa, until the parents came home.', 'İki saat kovalamaca oynadınız. İkizler taş gibi uyudu. Sen de kanepede, anne babaları gelene kadar.'),
        { tone: 'good' },
      ),
      opt('screens', ['Put a film on and hope', 'Bir film açıp dua et'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 2, usd: 40 }, 'They watched quietly. You did your homework. Easiest money of your life.', 'Sessizce izlediler. Sen ödevini yaptın. Hayatının en kolay parası.'),
          (c) => out(c, { hap: -3, usd: 40 }, 'They used the quiet to paint the bathroom with toothpaste. You got paid. You will not be asked back.', 'Sessizlikten faydalanıp banyoyu diş macunuyla boyadılar. Paranı aldın. Bir daha çağrılmayacaksın.'),
        ),
      ),
      opt('no', ['Say you are busy', 'Meşgul olduğunu söyle'], (c) =>
        out(c, { hap: 1 }, 'You said no. Through the wall that night you heard what sounded like a small war. Good call.', 'Hayır dedin. O gece duvarın öbür tarafından küçük bir savaş gibi sesler geldi. İyi karar.'),
      ),
    ],
  },
  {
    id: 'base.yt_screen_time',
    category: 'family',
    minAge: 13,
    maxAge: 15,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`${Kw(c, 'par')} has set a two-hour screen limit.`, `${Kw(c, 'par')} ekran süresine iki saat sınır koydu.`),
    text: tt('The router now turns off at ten. This is a dictatorship.', 'Modem artık saat onda kapanıyor. Bu bir diktatörlük.'),
    choices: [
      opt('hack', ['Find the router password', 'Modemin şifresini bul'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { sma: 2, hap: 4 }, 'The password was the dog\'s name and your birth year. Freedom. Quiet, careful freedom.', 'Şifre köpeğin adı ve senin doğum yılınmış. Özgürlük. Sessiz, dikkatli bir özgürlük.'),
          (c) => {
            near(c, 'par', -4);
            return out(c, { hap: -3 }, 'You were caught at 1 a.m. with the router in your room. The limit is now one hour.', 'Gece birde modem odandayken yakalandın. Sınır artık bir saat.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('deal', ['Negotiate a deal', 'Pazarlık yap'], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: 2 }, 'You agreed: weekends are free if your grades hold. Your first successful negotiation.', 'Anlaştınız: notların düşmezse hafta sonları serbest. İlk başarılı pazarlığın.');
      }, { tone: 'good' }),
      opt('book', ['Read books out of spite', 'İnadına kitap oku'], (c) =>
        out(c, { sma: 3, hap: 1 }, 'You read eleven books in a month to make a point. The point was made. You also liked them.', 'Bir şeyi kanıtlamak için bir ayda on bir kitap okudun. Kanıtladın. Üstelik sevdin de.'),
      ),
    ],
  },
  {
    id: 'base.yt_first_concert',
    category: 'random',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`${nmc(c, 'fr')} has two tickets to your favourite band.`, `${nmc(c, 'fr')} en sevdiğin grubun konserine iki bilet buldu.`),
    text: tt('It is a school night. Of course it is.', 'Ertesi gün okul var. Tabii ki var.'),
    choices: [
      opt('go', ['Go, and scream every word', 'Git ve her şarkıyı bağırarak söyle'], (c) => {
        near(c, 'fr', 5);
        nudgeGrades(c, -1);
        return out(c, { hap: 8 }, 'You screamed every word and lost your voice for three days. You do not regret a single second.', 'Her şarkıyı bağırarak söyledin ve üç gün sesin çıkmadı. Tek bir saniyesine bile pişman değilsin.');
      }, { tone: 'good' }),
      opt('ask', ['Ask your parents properly', 'Ailenden düzgünce izin iste'], (c) =>
        gamble(
          c,
          0.6,
          (c) => out(c, { hap: 6 }, 'They said yes, on the condition that you text every hour. You texted every hour. Mostly photos of the stage.', 'Her saat mesaj atman şartıyla izin verdiler. Her saat attın. Çoğu sahne fotoğrafıydı.'),
          (c) => out(c, { hap: -4 }, 'They said no. You heard the concert was legendary. You will mention this at every family dinner for twenty years.', 'Hayır dediler. Konserin efsane olduğunu duydun. Bunu yirmi yıl boyunca her aile yemeğinde anacaksın.'),
        ),
      ),
      opt('sell', ['Sell your ticket', 'Biletini sat'], (c) =>
        out(c, { usd: 60, hap: -2 }, 'You sold it for a profit. The band played your favourite song. A friend sent you a video. It hurt.', 'Kârla sattın. Grup en sevdiğin şarkıyı çaldı. Bir arkadaşın video yolladı. Acıttı.'),
      ),
    ],
  },
  {
    id: 'base.yt_online_friend',
    category: 'random',
    minAge: 13,
    maxAge: 16,
    once: true,
    title: tt('Someone you only know from an online game wants to meet.', 'Sadece bir çevrim içi oyundan tanıdığın biri buluşmak istiyor.'),
    text: tt('They say they are your age. They have been very nice. Maybe too nice.', 'Senin yaşında olduğunu söylüyor. Çok kibar davrandı. Belki fazla kibar.'),
    choices: [
      opt('tell', ['Tell a parent before anything else', 'Her şeyden önce ailene söyle'], (c) => {
        allParents(c, 4);
        return out(c, { sma: 2, hap: 1 }, 'You told your parents. They checked, calmly. The profile was fake. You blocked and reported it. You did exactly the right thing.', 'Ailene söyledin. Sakince araştırdılar. Profil sahteymiş. Engelleyip bildirdin. Tam olarak doğru olanı yaptın.');
      }, { tone: 'good' }),
      opt('video', ['Ask for a video call first', 'Önce görüntülü arama iste'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 3 }, 'They turned out to be a real kid from another city, who also had to ask their mum. You still play together.', 'Gerçekten başka bir şehirde yaşayan bir çocuk çıktı; o da annesine sormak zorundaymış. Hâlâ birlikte oynuyorsunuz.'),
          (c) => out(c, { sma: 2, hap: -1 }, 'They made excuses and then vanished. You blocked them and told a parent. A lesson learned cheaply.', 'Bahaneler uydurdu, sonra ortadan kayboldu. Engelledin ve ailene söyledin. Ucuz atlatılmış bir ders.'),
        ),
      ),
      opt('block', ['Block them', 'Engelle'], (c) =>
        out(c, { sma: 1 }, 'You blocked them. Maybe they were nice. Maybe not. You will never wonder enough to regret it.', 'Engelledin. Belki iyi biriydi, belki değil. Pişman olacak kadar merak etmeyeceksin.'),
      ),
    ],
  },
  {
    id: 'base.yt_growth_spurt',
    category: 'health',
    minAge: 13,
    maxAge: 15,
    once: true,
    title: tt('You grew ten centimetres over the summer.', 'Yaz boyunca on santim uzadın.'),
    text: tt('Your trousers stop at your ankles. Your knees ache. You hit your head on the kitchen lamp twice a day.', 'Pantolonların bileğinde bitiyor. Dizlerin ağrıyor. Mutfak lambasına günde iki kez kafanı çarpıyorsun.'),
    choices: [
      opt('shop', ['Get new clothes', 'Yeni kıyafet al'], (c) =>
        out(c, { loo: 3, hap: 2, usd: -80 }, 'New clothes that fit. You looked in the mirror and briefly did not recognise the tall stranger.', 'Üstüne olan yeni kıyafetler. Aynaya baktın ve bir an o uzun yabancıyı tanıyamadın.'),
      ),
      opt('basket', ['Try out for basketball', 'Basketbol seçmelerine katıl'], (c) =>
        out(c, { hea: 3, hap: 3 }, 'The coach looked at you the way a farmer looks at rain. You are on the team.', 'Hoca sana çiftçinin yağmura baktığı gibi baktı. Takımdasın.'),
      ),
      opt('wear', ['Wear your old clothes proudly', 'Eski kıyafetlerini gururla giy'], (c) =>
        out(c, { loo: -2, hap: 1 }, 'You wore your old trousers all term. Everyone could see your socks. They were very good socks.', 'Bütün dönem eski pantolonlarını giydin. Herkes çoraplarını görebiliyordu. Çok güzel çoraplardı.'),
      ),
    ],
  },
  {
    id: 'base.yt_first_shave',
    category: 'health',
    minAge: 13,
    maxAge: 16,
    once: true,
    title: (c) => (c.p.gender === 'male' ? c.t('There is fuzz on your upper lip.', 'Üst dudağında tüyler belirdi.') : c.t('You want to try eyeliner for the first time.', 'İlk kez göz kalemi denemek istiyorsun.')),
    text: (c) => (c.p.gender === 'male' ? c.t('It is either a moustache or a smudge. Opinions differ.', 'Ya bıyık ya da leke. Görüşler farklı.') : c.t('There is a video that makes it look easy. It is not easy.', 'Kolay gösteren bir video var. Kolay değil.')),
    choices: [
      opt('diy', ['Do it yourself, secretly', 'Gizlice kendin yap'], (c) =>
        c.p.gender === 'male'
          ? out(c, { hea: -1, hap: 1 }, 'You shaved with a borrowed razor and came out with three plasters and a sense of achievement.', 'Ödünç bir jiletle tıraş oldun; üç yara bandı ve büyük bir başarı duygusuyla çıktın.')
          : out(c, { loo: -1, hap: 1 }, 'One eye looked like a film star. The other looked like a raccoon. Practice continues.', 'Bir gözün film yıldızı gibiydi. Öbürü rakun gibi. Çalışmaya devam.'),
      ),
      opt('ask', ['Ask a parent or older sibling for help', 'Annenden, babandan ya da büyük kardeşinden yardım iste'], (c) => {
        allParents(c, 3);
        return out(c, { loo: 2, hap: 3 }, 'You got a proper lesson and a long, embarrassing, loving talk about growing up.', 'Düzgün bir ders aldın; üstüne de büyümek üzerine uzun, utandırıcı ve sevgi dolu bir konuşma.');
      }, { tone: 'good' }),
      opt('wait', ['Leave it for now', 'Şimdilik bırak'], (c) =>
        out(c, { hap: 1 }, 'You decided you were in no hurry. You were right. There is a lot of time for all of that.', 'Acelen olmadığına karar verdin. Haklıydın. Bütün bunlara daha çok zaman var.'),
      ),
    ],
  },
  {
    id: 'base.yt_diary',
    category: 'family',
    minAge: 13,
    maxAge: 16,
    once: true,
    when: hasSibling,
    setup: (c) => pickSibling(c),
    title: (c) => c.t(`${nmc(c, 'sib')} found your diary.`, `${nmc(c, 'sib')} günlüğünü buldu.`),
    text: (c) => c.t(`${nmc(c, 'sib')} is reading it aloud in the hallway, doing voices.`, `${nmc(c, 'sib')} koridorda yüksek sesle, taklit yaparak okuyor.`),
    choices: [
      opt('chase', ['Chase them around the house', 'Evin içinde kovala'], (c) => {
        near(c, 'sib', -2);
        return out(c, { hea: 1, hap: -1 }, 'You chased them around the house four times. The diary got wet in the bath. Both of you were grounded.', 'Evin içinde dört tur kovaladın. Günlük küvete düşüp ıslandı. İkiniz de cezalandınız.');
      }),
      opt('trade', ['Threaten to reveal THEIR secret', 'Onun sırrını açıklamakla tehdit et'], (c) =>
        out(c, { sma: 1, hap: 2 }, `You said one word: "the vase". ${nmc(c, 'sib')} handed the diary back immediately. Peace, through mutual destruction.`, `Tek kelime söyledin: "Vazo." ${nmc(c, 'sib')} günlüğü hemen geri verdi. Karşılıklı yıkım dehşetiyle gelen barış.`),
      ),
      opt('laugh', ['Laugh along with it', 'Sen de gül'], (c) => {
        near(c, 'sib', 4);
        return out(c, { hap: 2 }, 'You laughed so hard at your own poems that it stopped being fun for them. They gave it back. Some of those poems are terrible.', 'Kendi şiirlerine öyle güldün ki onun için eğlencesi kalmadı. Geri verdi. Şiirlerin bazıları gerçekten berbat.');
      }),
    ],
  },
  {
    id: 'base.yt_rumour',
    category: 'school',
    minAge: 13,
    maxAge: 17,
    once: true,
    when: inSchool,
    setup: (c) => newKid(c),
    title: (c) => c.t(`A rumour says you are secretly dating ${nmc(c, 'kid')}.`, `${nmc(c, 'kid', 'wth')} gizlice çıktığınıza dair bir dedikodu dolaşıyor.`),
    text: tt('You have spoken to them twice. Once about a pencil.', 'Onunla iki kez konuştun. Bir keresinde bir kalem hakkında.'),
    choices: [
      opt('deny', ['Deny it loudly', 'Yüksek sesle yalanla'], (c) =>
        out(c, { hap: -2 }, 'The louder you denied it, the more true it sounded. Rumours work like that.', 'Ne kadar yüksek sesle yalanladıysan o kadar doğru gibi geldi. Dedikodu böyle işler.'),
      ),
      opt('talk', [`Talk to them about it`, 'Onunla konuş'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { hap: 4 }, `You and ${nmc(c, 'kid')} laughed about it and decided to sit together at lunch to confuse everyone further. Now you are actually friends.`, `${nmc(c, 'kid', 'wth')} buna güldünüz ve herkesin kafası daha çok karışsın diye öğle yemeğinde birlikte oturmaya karar verdiniz. Artık gerçekten arkadaşsınız.`);
      }, { tone: 'good' }),
      opt('ignore', ['Ignore it completely', 'Hiç umursama'], (c) =>
        out(c, { hap: 1, sma: 1 }, 'You ignored it. Three days later there was a new rumour about someone else. That is the cycle.', 'Umursamadın. Üç gün sonra başka biri hakkında yeni bir dedikodu çıktı. Döngü böyle.'),
      ),
    ],
  },
  {
    id: 'base.yt_tech_support',
    category: 'family',
    minAge: 13,
    maxAge: 19,
    once: true,
    when: hasGrand,
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} has a new phone and some questions.`, `${Kw(c, 'gp')} yeni telefon aldı ve birkaç sorusu var.`),
    text: tt('The font is enormous. The volume is at maximum. Every message is in capital letters.', 'Yazılar kocaman. Ses sonuna kadar açık. Her mesaj büyük harfle.'),
    choices: [
      opt('teach', ['Teach patiently, step by step', 'Sabırla, adım adım öğret'], (c) => {
        near(c, 'gp', 6);
        return out(c, { hap: 3 }, `It took three Sundays. Now ${kw(c, 'gp')} sends you a photo of every meal and a flower emoji every morning.`, `Üç pazar sürdü. Artık ${kw(c, 'gp')} her sabah bir çiçek emojisi ve her yemeğinin fotoğrafını yolluyor.`);
      }, { tone: 'good' }),
      opt('fix', ['Just fix everything yourself', 'Her şeyi kendin hallet'], (c) => {
        near(c, 'gp', 2);
        return out(c, { hap: 1 }, 'You fixed it in two minutes. A week later it was all broken again in new and creative ways.', 'İki dakikada hallettin. Bir hafta sonra her şey yeni ve yaratıcı şekillerde yine bozulmuştu.');
      }),
      opt('note', ['Write instructions on a card', 'Bir karta talimat yaz'], (c) => {
        near(c, 'gp', 4);
        return out(c, { sma: 1, hap: 2 }, 'You wrote big clear instructions. The card is laminated now and kept next to the phone like a sacred text.', 'Büyük ve net talimatlar yazdın. Kart artık plastik kaplı ve kutsal bir metin gibi telefonun yanında duruyor.');
      }),
    ],
  },
  {
    id: 'base.yt_cook_dinner',
    category: 'family',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: hasParent,
    title: tt('You offered to cook dinner for the whole family.', 'Bütün aileye akşam yemeği yapmayı teklif ettin.'),
    text: tt('You have watched a lot of cooking videos. You have cooked nothing.', 'Çok yemek videosu izledin. Hiçbir şey pişirmedin.'),
    choices: [
      opt('ambitious', ['Make something ambitious', 'İddialı bir şey yap'], (c) =>
        gamble(
          c,
          0.45,
          (c) => {
            allParents(c, 5);
            return out(c, { hap: 6, sma: 1 }, 'It worked! The family went quiet in that good way. You have been cooking every Sunday since.', 'Oldu! Aile o güzel sessizliğe gömüldü. O günden beri her pazar sen pişiriyorsun.');
          },
          (c) => out(c, { hap: -1 }, 'The smoke alarm reviewed it first. You all had toast and laughed a lot.', 'İlk yorumu duman alarmı yaptı. Hep birlikte kızarmış ekmek yediniz ve bolca güldünüz.'),
        ),
      ),
      opt('pasta', ['Make pasta. Safe.', 'Makarna yap. Garanti.'], (c) => {
        allParents(c, 3);
        return out(c, { hap: 3 }, 'Pasta, perfectly fine. Everyone said it was delicious. Everyone also added a lot of salt.', 'Makarna, gayet iyi. Herkes çok lezzetli olduğunu söyledi. Herkes bolca tuz da ekledi.');
      }),
      opt('order', ['"Cook" by ordering in', 'Dışarıdan söyleyerek "pişir"'], (c) =>
        out(c, { hap: 2, usd: -30 }, 'You put the takeaway in your own bowls. Nobody was fooled. Everybody was fed.', 'Gelen yemeği kendi kaplarınıza boşalttın. Kimse kanmadı. Herkes doydu.'),
      ),
    ],
  },
  {
    id: 'base.yt_meteor',
    category: 'random',
    minAge: 15,
    maxAge: 17,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`${nmc(c, 'fr')} wants to sneak out to watch a meteor shower.`, `${nmc(c, 'fr')} meteor yağmurunu izlemek için gece gizlice çıkmak istiyor.`),
    text: tt('Peak time is 3 a.m., on the hill outside town.', 'En yoğun saat gece üç, şehrin dışındaki tepede.'),
    choices: [
      opt('sneak', ['Sneak out', 'Gizlice çık'], (c) =>
        gamble(
          c,
          0.65,
          (c) => {
            near(c, 'fr', 6);
            return out(c, { hap: 8 }, 'You lay on the cold grass and counted forty shooting stars. You made the same wish every time.', 'Soğuk çimlere uzanıp kırk kayan yıldız saydınız. Her seferinde aynı dileği tuttun.');
          },
          (c) => {
            allParents(c, -4);
            return out(c, { hap: -2 }, 'You came back at 4 a.m. and the whole house was awake, waiting in the kitchen. Grounded.', 'Sabah dörtte döndün; bütün ev ayaktaydı ve mutfakta seni bekliyordu. Ceza.');
          },
        ),
        { badge: 'Risky' },
      ),
      opt('roof', ['Watch from your own roof', 'Kendi damından izle'], (c) =>
        out(c, { hap: 5 }, 'You watched from the roof with a blanket and a flask of tea. Fewer stars, zero trouble.', 'Bir battaniye ve bir termos çayla damdan izledin. Daha az yıldız, sıfır bela.'),
      ),
      opt('ask', ['Ask to go, with a parent driving', 'Bir büyük götürsün diye izin iste'], (c) => {
        allParents(c, 4);
        return out(c, { hap: 5 }, 'Your parent drove you both and turned out to know every constellation. Unexpected, and lovely.', 'Ailenden biri ikinizi götürdü ve bütün takımyıldızları bildiği ortaya çıktı. Beklenmedik ve çok güzeldi.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.yt_fashion',
    category: 'random',
    minAge: 13,
    maxAge: 16,
    once: true,
    title: tt('You are entering a fashion phase.', 'Bir moda dönemine giriyorsun.'),
    text: tt('Which one will haunt your photo albums forever?', 'Fotoğraf albümlerine sonsuza kadar hangisi musallat olacak?'),
    choices: [
      opt('black', ['All black, always', 'Her zaman simsiyah'], (c) =>
        out(c, { loo: 1, hap: 3 }, 'You wore black for two years. Your grandmother asked who died. Nobody, Grandma. Just the old you.', 'İki yıl siyah giydin. Büyükannen kim öldü diye sordu. Kimse, nine. Sadece eski sen.'),
      ),
      opt('retro', ['Your parents\' old clothes', 'Annenle babanın eski kıyafetleri'], (c) => {
        allParents(c, 3);
        return out(c, { loo: 2, hap: 3 }, 'You raided the old wardrobe. Your parents were delighted, then horrified when you made it look cool.', 'Eski dolabı yağmaladın. Annenle baban önce çok sevindi, sonra sen onları havalı gösterince dehşete düştü.');
      }, { hidden: (c) => !bothParents(c) }),
      opt('sport', ['Sportswear for every occasion', 'Her durumda eşofman'], (c) =>
        out(c, { hea: 1, hap: 2 }, 'You wore a tracksuit to a wedding. You were the most comfortable person there.', 'Bir düğüne eşofmanla gittin. Oradaki en rahat kişi sendin.'),
      ),
    ],
  },
  {
    id: 'base.yt_attic_guitar',
    category: 'random',
    minAge: 13,
    maxAge: 17,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You found an old guitar in the storage room.', 'Depoda eski bir gitar buldun.'),
    text: tt('It has five strings and a sticker that says "Rock lives forever".', 'Beş teli var ve üstünde "Rock yaşatır!" yazan bir çıkartma.'),
    choices: [
      opt('learn', ['Teach yourself from videos', 'Videolardan kendi kendine öğren'], (c) =>
        out(c, { sma: 1, hap: 5 }, 'Your fingertips hurt for a month. Then one day you played a whole song, badly and beautifully.', 'Bir ay parmak uçların acıdı. Sonra bir gün bütün bir şarkıyı çaldın; kötü ve çok güzel.'),
      ),
      opt('ask', ['Ask whose it was', 'Kimin olduğunu sor'], (c) => {
        near(c, 'par', 6);
        return out(c, { hap: 4 }, `It was ${kw(c, 'par', 'gen')}. There had been a band, a van and one concert in a car park. You heard the whole story, twice.`, `${Kw(c, 'par', 'gen')} çıktı. Bir grup, bir minibüs ve bir otoparkta verilmiş tek bir konser varmış. Bütün hikâyeyi iki kez dinledin.`);
      }, { tone: 'good' }),
      opt('wall', ['Hang it on your wall for the look', 'Görüntüsü için duvarına as'], (c) =>
        out(c, { loo: 1, hap: 2 }, 'It looks great on the wall. Visitors ask you to play. You say it is "being restored".', 'Duvarda harika duruyor. Gelenler çalmanı istiyor. Sen "restorasyonda" diyorsun.'),
      ),
    ],
  },
  {
    id: 'base.yt_care_home',
    category: 'random',
    minAge: 14,
    maxAge: 17,
    once: true,
    setup: (c) => newAdult(c, 'old', 80, 95),
    title: tt('Your school sends you to volunteer at a care home.', 'Okul seni bir huzurevinde gönüllü çalışmaya gönderdi.'),
    text: (c) => c.t(`${nmc(c, 'old')}, who is ninety, challenges you to backgammon.`, `Doksan yaşındaki ${nmc(c, 'old')} seni tavlaya davet ediyor.`),
    choices: [
      opt('play', ['Play, and try to win', 'Oyna ve kazanmaya çalış'], (c) =>
        out(c, { hap: 5, sma: 1 }, `${nmc(c, 'old')} destroyed you, three games in a row, telling stories about being young the whole time. You came back every week.`, `${nmc(c, 'old')} seni üst üste üç oyunda ezdi; bir yandan da gençlik yıllarını anlattı. Her hafta geri geldin.`),
        { tone: 'good' },
      ),
      opt('lose', ['Let them win', 'Kazanmasına izin ver'], (c) =>
        out(c, { hap: 3 }, `${nmc(c, 'old')} noticed immediately and was deeply offended. "Play properly, child." You did, and lost anyway.`, `${nmc(c, 'old')} hemen fark etti ve çok alındı. "Doğru dürüst oyna evladım." Oynadın, yine kaybettin.`),
      ),
      opt('listen', ['Skip the game and just listen', 'Oyunu bırak, sadece dinle'], (c) =>
        out(c, { sma: 2, hap: 3 }, `${nmc(c, 'old')} told you about a first love from seventy years ago. You wrote it down that night so it would not be lost.`, `${nmc(c, 'old')} sana yetmiş yıl önceki ilk aşkını anlattı. Kaybolmasın diye o gece yazdın.`),
      ),
    ],
  },
  {
    id: 'base.yt_exchange',
    category: 'family',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: hasParent,
    setup: (c) => newKid(c, 'ex'),
    title: (c) => c.t(`Your family is hosting an exchange student, ${nmc(c, 'ex')}.`, `Ailen bir değişim öğrencisine ev sahipliği yapıyor: ${nmc(c, 'ex')}.`),
    text: tt('They will sleep in your room. You will sleep on the sofa. For a month.', 'Senin odanda kalacak. Sen kanepede yatacaksın. Bir ay boyunca.'),
    choices: [
      opt('show', ['Show them the whole city', 'Bütün şehri gezdir'], (c) => {
        befriend(c, 'ex', 60);
        return out(c, { hap: 5, sma: 1 }, `You showed ${nmc(c, 'ex', 'dat')} everything, including places you had never been yourself. You still write to each other.`, `${nmc(c, 'ex', 'dat')} her yeri gezdirdin, kendinin bile hiç gitmediği yerleri. Hâlâ yazışıyorsunuz.`);
      }, { tone: 'good' }),
      opt('words', ['Teach them all the wrong words', 'Ona bütün yanlış kelimeleri öğret'], (c) => {
        befriend(c, 'ex', 45);
        return out(c, { hap: 4 }, `${nmc(c, 'ex')} thanked your grandmother for dinner with a phrase you taught them. Your grandmother has not recovered.`, `${nmc(c, 'ex')} büyükannene yemek için senin öğrettiğin bir cümleyle teşekkür etti. Büyükannen hâlâ kendine gelemedi.`);
      }),
      opt('sulk', ['Sulk about the sofa', 'Kanepe yüzünden surat as'], (c) =>
        out(c, { hap: -2 }, 'You sulked for a month. On the last day they gave you a present and you felt terrible.', 'Bir ay surat astın. Son gün sana bir hediye verdi ve kendini berbat hissettin.'),
      ),
    ],
  },
  {
    id: 'base.yt_car_wash',
    category: 'school',
    minAge: 13,
    maxAge: 16,
    once: true,
    when: inSchool,
    title: tt('Charity car wash for the school trip fund.', 'Okul gezisi fonu için hayır amaçlı araba yıkama.'),
    text: tt('You have a bucket, a sponge and a hose that nobody can control.', 'Bir kova, bir sünger ve kimsenin zapt edemediği bir hortum var.'),
    choices: [
      opt('wash', ['Wash cars with real dedication', 'Arabaları büyük bir özveriyle yıka'], (c) =>
        out(c, { hap: 3, hea: 1 }, 'You washed twenty cars. The trip fund grew. A teacher gave you a bigger sponge as a promotion.', 'Yirmi araba yıkadın. Gezi fonu büyüdü. Bir öğretmen terfi olarak sana daha büyük bir sünger verdi.'),
        { tone: 'good' },
      ),
      opt('sign', ['Hold the sign and dance', 'Tabelayı tutup dans et'], (c) =>
        out(c, { hap: 5 }, 'You danced with the sign at the roundabout all day. Traffic slowed. Business boomed. A local paper took your photo.', 'Bütün gün kavşakta tabelayla dans ettin. Trafik yavaşladı. İşler patladı. Yerel bir gazete fotoğrafını çekti.'),
      ),
      opt('hose', ['Take control of the hose', 'Hortumun kontrolünü al'], (c) =>
        out(c, { hap: 4, hea: -1 }, 'You turned out to be very bad at controlling the hose. Everyone was soaked, including the head teacher\'s car, inside.', 'Hortumu kontrol etmekte çok kötü olduğun ortaya çıktı. Herkes sırılsıklam oldu; müdürün arabasının içi de.'),
      ),
    ],
  },
  {
    id: 'base.yt_captain',
    category: 'school',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: (c) => inSchool(c) && hasFriend(c),
    setup: (c) => pickFriend(c),
    title: tt('You have been made team captain.', 'Takım kaptanı yapıldın.'),
    text: (c) => c.t(`The coach says you must drop one player for the final. It is between ${nmc(c, 'fr')} and a better player.`, `Hoca final için bir oyuncuyu kadro dışı bırakman gerektiğini söylüyor. Ya ${nmc(c, 'fr')} ya da daha iyi bir oyuncu.`),
    choices: [
      opt('best', ['Pick the better player', 'Daha iyi oyuncuyu seç'], (c) =>
        gamble(
          c,
          0.6,
          (c) => {
            near(c, 'fr', -6);
            return out(c, { hap: 3 }, `You won the final. ${nmc(c, 'fr')} congratulated you, a little stiffly. It took a while.`, `Finali kazandınız. ${nmc(c, 'fr')} seni biraz soğuk bir şekilde tebrik etti. Zaman aldı.`);
          },
          (c) => {
            near(c, 'fr', -6);
            return out(c, { hap: -4 }, `You lost anyway, and ${nmc(c, 'fr')} watched from the stands. The worst of both worlds.`, `Yine de kaybettiniz ve ${nmc(c, 'fr')} tribünden izledi. İki dünyanın da en kötüsü.`);
          },
        ),
      ),
      opt('friend', ['Pick your friend', 'Arkadaşını seç'], (c) => {
        near(c, 'fr', 6);
        return gamble(
          c,
          0.4,
          (c) => out(c, { hap: 7 }, `${nmc(c, 'fr')} scored the winner. You will both tell this story at each other's weddings.`, `Galibiyet golünü ${nmc(c, 'fr')} attı. İkiniz de bu hikâyeyi birbirinizin düğününde anlatacaksınız.`),
          (c) => out(c, { hap: -1 }, 'You lost, but nobody blamed you, and your friend never forgot it.', 'Kaybettiniz ama kimse seni suçlamadı; arkadaşın da bunu hiç unutmadı.'),
        );
      }),
      opt('self', ['Drop yourself', 'Kendini kadro dışı bırak'], (c) => {
        near(c, 'fr', 4);
        return out(c, { hap: 2 }, 'You dropped yourself and cheered from the bench. The coach called it the most captain thing he had ever seen.', 'Kendini çıkardın ve yedek kulübesinden tezahürat yaptın. Hoca bunun gördüğü en kaptanca şey olduğunu söyledi.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.yt_lost_bet',
    category: 'random',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`You lost a bet to ${nmc(c, 'fr')}.`, `${nmc(c, 'fr', 'wth')} girdiğin iddiayı kaybettin.`),
    text: tt('The forfeit: wear a full dinosaur costume to school for a day.', 'Ceza: bir gün boyunca okula kocaman bir dinozor kostümüyle gitmek.'),
    choices: [
      opt('commit', ['Commit fully. Roar.', 'Tamamen gir. Kükre.'], (c) =>
        out(c, { hap: 6 }, 'You roared in every lesson. By lunch it was a school event. Three teachers took photos.', 'Her derste kükredin. Öğle yemeğinde bu bir okul etkinliğine dönmüştü. Üç öğretmen fotoğraf çekti.'),
        { tone: 'good' },
      ),
      opt('half', ['Wear only the head', 'Sadece kafasını tak'], (c) =>
        out(c, { hap: 2 }, 'You wore only the head. Somehow this was more disturbing. People moved seats.', 'Sadece kafasını taktın. Nedense bu daha ürkütücüydü. İnsanlar yer değiştirdi.'),
      ),
      opt('renegotiate', ['Renegotiate the terms', 'Şartları yeniden müzakere et'], (c) => {
        near(c, 'fr', -1);
        return out(c, { sma: 1, hap: 1 }, `You negotiated it down to dinosaur socks. ${nmc(c, 'fr')} calls you a lawyer now, and not kindly.`, `Pazarlıkla dinozor çoraplarına indirdin. ${nmc(c, 'fr')} sana artık "avukat" diyor; pek de sevgiyle değil.`);
      }),
    ],
  },
  {
    id: 'base.yt_big_tip',
    category: 'work',
    minAge: 15,
    maxAge: 19,
    once: true,
    when: (c) => !!c.p.jobId,
    title: tt('A customer left a huge tip by mistake.', 'Bir müşteri yanlışlıkla çok büyük bir bahşiş bıraktı.'),
    text: (c) => c.t(`${cash(c, 100)} for a coffee. They are getting into a taxi.`, `Bir kahve için ${cash(c, 100)}. Taksiye binmek üzere.`),
    choices: [
      opt('run', ['Run after them', 'Arkasından koş'], (c) =>
        out(c, { hap: 4, hea: 1 }, 'You caught the taxi at the lights. The customer laughed, kept most of it, and gave you a real tip. Fair.', 'Taksiye ışıklarda yetiştin. Müşteri güldü, çoğunu geri aldı ve sana gerçek bir bahşiş verdi. Adil.'),
        { tone: 'good' },
      ),
      opt('keep', ['Keep it', 'Al'], (c) =>
        out(c, { usd: 100, hap: 2 }, 'You kept it. You bought new trainers. Every time you wear them, you think of the taxi.', 'Aldın. Yeni spor ayakkabı aldın. Her giydiğinde o taksiyi düşünüyorsun.'),
      ),
      opt('jar', ['Put it in the staff tip jar', 'Çalışanların bahşiş kavanozuna koy'], (c) =>
        out(c, { hap: 3, usd: 15 }, 'You shared it with the whole shift. The cook now gives you the good leftovers.', 'Bütün vardiyayla paylaştın. Aşçı artık sana en güzel artıkları ayırıyor.'),
      ),
    ],
  },
  {
    id: 'base.yt_same_crush',
    category: 'love',
    minAge: 14,
    maxAge: 17,
    once: true,
    when: hasFriend,
    setup: (c) => {
      pickFriend(c);
      newKid(c, 'kid', 1, c.p.gender === 'female' ? 'male' : 'female');
    },
    title: (c) => c.t(`Your friend ${nmc(c, 'fr')} also likes ${nmc(c, 'kid')}.`, `Arkadaşın ${da(nmc(c, 'fr'))} ${nmc(c, 'kid', 'acc')} beğeniyor.`),
    text: tt('You found out by text, at midnight, with three crying emojis.', 'Gece yarısı, üç ağlayan emojili bir mesajla öğrendin.'),
    choices: [
      opt('step', ['Step aside for your friend', 'Arkadaşın için geri çekil'], (c) => {
        near(c, 'fr', 7);
        return out(c, { hap: -1 }, `You stepped aside. ${nmc(c, 'fr')} never asked them out anyway. You both laughed about it a year later.`, `Geri çekildin. ${nmc(c, 'fr')} zaten hiç açılmadı. Bir yıl sonra ikiniz de buna güldünüz.`);
      }, { tone: 'good' }),
      opt('honest', ['Be honest with each other', 'Birbirinize dürüst olun'], (c) => {
        near(c, 'fr', 3);
        return out(c, { hap: 2, sma: 1 }, 'You agreed that no crush is worth the friendship. You made a pact. It held.', 'Hiçbir hoşlantının bu arkadaşlığa değmeyeceğinde anlaştınız. Bir yemin ettiniz. Tuttu da.');
      }),
      opt('race', ['Get there first', 'İlk sen davran'], (c) =>
        gamble(
          c,
          0.4,
          (c) => {
            near(c, 'fr', -8);
            return out(c, { hap: 3 }, `${nmc(c, 'kid')} said yes. ${nmc(c, 'fr')} did not speak to you for a term.`, `${nmc(c, 'kid')} evet dedi. ${nmc(c, 'fr')} bir dönem seninle konuşmadı.`);
          },
          (c) => {
            near(c, 'fr', -5);
            return out(c, { hap: -4 }, `${nmc(c, 'kid')} said no, kindly. ${nmc(c, 'fr')} found out anyway. A bad week.`, `${nmc(c, 'kid')} kibarca hayır dedi. ${nmc(c, 'fr')} yine de öğrendi. Kötü bir hafta.`);
          },
        ),
        { badge: 'Risky' },
      ),
    ],
  },
  {
    id: 'base.yt_valentine',
    category: 'love',
    minAge: 13,
    maxAge: 16,
    once: true,
    title: tt('An anonymous card is in your locker.', 'Dolabında imzasız bir kart var.'),
    text: tt('"I like how you laugh." No name. Just a drawing of a cat.', '"Gülüşünü seviyorum." İsim yok. Sadece bir kedi çizimi.'),
    choices: [
      opt('investigate', ['Compare handwriting with the whole class', 'Bütün sınıfın el yazısıyla karşılaştır'], (c) =>
        out(c, { sma: 2, hap: 3 }, 'You ran a week-long investigation. You narrowed it down to four people. You never found out. You are still a bit pleased.', 'Bir hafta süren bir soruşturma yürüttün. Dört kişiye indirdin. Hiç öğrenemedin. Hâlâ biraz seviniyorsun.'),
      ),
      opt('keep', ['Keep it and smile', 'Sakla ve gülümse'], (c) =>
        out(c, { hap: 5, loo: 1 }, 'You kept the card in your wallet for years. It turned up when you moved house, and you smiled again.', 'Kartı yıllarca cüzdanında taşıdın. Taşınırken ortaya çıktı ve yine gülümsedin.'),
        { tone: 'good' },
      ),
      opt('reply', ['Leave a reply card on your locker', 'Dolabına bir cevap kartı bırak'], (c) =>
        out(c, { hap: 4 }, 'You left a card: "Thanks. I like your cat." The next day someone had drawn the cat a hat.', 'Bir kart bıraktın: "Teşekkürler. Kedini sevdim." Ertesi gün biri kediye şapka çizmişti.'),
      ),
    ],
  },
  {
    id: 'base.yt_bus_lady',
    category: 'random',
    minAge: 13,
    maxAge: 19,
    once: true,
    title: tt('An old lady on the bus is staring at your seat.', 'Otobüste yaşlı bir teyze oturduğun koltuğa bakıyor.'),
    text: tt('You are very tired. She has a very large bag.', 'Çok yorgunsun. Onun da çok büyük bir çantası var.'),
    choices: [
      opt('give', ['Give her your seat', 'Yerini ver'], (c) =>
        out(c, { hap: 4 }, 'She sat down and gave you a lemon sweet and some advice about marriage you did not ask for. Both were excellent.', 'Oturdu, sana bir limonlu şeker ve hiç sormadığın evlilik tavsiyeleri verdi. İkisi de harikaydı.'),
        { tone: 'good' },
      ),
      opt('bag', ['Offer to hold her bag', 'Çantasını tutmayı teklif et'], (c) =>
        out(c, { hea: -1, hap: 2 }, 'The bag contained what felt like six watermelons. She stood perfectly comfortably. You did not.', 'Çantanın içinde altı karpuz varmış gibiydi. O gayet rahat ayakta durdu. Sen durmadın.'),
      ),
      opt('sleep', ['Pretend to be asleep', 'Uyuyor numarası yap'], (c) =>
        out(c, { hap: -3 }, 'You pretended to sleep. She told the whole bus about "young people today". You heard every word.', 'Uyuyor numarası yaptın. Bütün otobüse "bu zamanın gençleri"ni anlattı. Her kelimesini duydun.'),
      ),
    ],
  },
  {
    id: 'base.yt_language_course',
    category: 'school',
    minAge: 15,
    maxAge: 17,
    once: true,
    when: hasParent,
    title: tt('A summer language course is on offer.', 'Bir yaz dil kursu fırsatı var.'),
    text: (c) => c.t(`Four weeks abroad costs ${cash(c, 1500)}. The local evening course is almost free.`, `Yurt dışında dört hafta ${cash(c, 1500)}. Mahalledeki akşam kursu neredeyse bedava.`),
    choices: [
      opt('abroad', ['Go abroad', 'Yurt dışına git'], (c) =>
        out(c, { sma: 4, hap: 6, usd: -1500 }, 'Four weeks of host families, new friends and bravely ordering the wrong food. You came home a slightly different person.', 'Dört hafta ev sahibi aileler, yeni arkadaşlar ve cesurca yanlış yemek siparişleri. Biraz farklı biri olarak döndün.'),
        { badge: 'Costs more' },
      ),
      opt('local', ['Take the evening course', 'Akşam kursuna git'], (c) =>
        out(c, { sma: 3, hap: 1 }, 'The evening course was you, a retired pilot and two nurses. You all became surprisingly fluent and surprisingly close.', 'Akşam kursunda sen, emekli bir pilot ve iki hemşire vardınız. Hepiniz şaşırtıcı derecede akıcı ve şaşırtıcı derecede yakın oldunuz.'),
      ),
      opt('films', ['Learn from films with subtitles', 'Altyazılı filmlerle öğren'], (c) =>
        out(c, { sma: 2, hap: 3 }, 'You learned a lot of words for "detective" and "betrayal". Not much for ordering coffee.', '"Dedektif" ve "ihanet" için bir sürü kelime öğrendin. Kahve sipariş etmek için pek yok.'),
      ),
    ],
  },
  {
    id: 'base.yt_market_stall',
    category: 'work',
    minAge: 14,
    maxAge: 17,
    once: true,
    title: (c) => c.t('A stallholder at the market needs a Saturday helper.', inTr(c) ? 'Semt pazarındaki bir tezgâhçı cumartesileri yardımcı arıyor.' : 'Pazardaki bir tezgâhçı cumartesileri yardımcı arıyor.'),
    text: tt('Shouting prices is part of the job.', 'Fiyat bağırmak işin bir parçası.'),
    choices: [
      opt('shout', ['Shout the loudest in the market', 'Pazarın en yüksek sesi ol'], (c) =>
        inTr(c)
          ? out(c, { hap: 4, usd: 120 }, 'You invented a rhyme about tomatoes. The whole market knows it now. The stall sold out by noon.', 'Domatesler üzerine bir tekerleme uydurdun: "Gel abla gel, domatesin dibi bu!" Bütün pazar ezberledi. Tezgâh öğlene boşaldı.')
          : out(c, { hap: 4, usd: 120 }, 'You invented a rhyme about tomatoes. The whole market knows it now. The stall sold out by noon.', 'Domatesler üzerine bir tekerleme uydurdun. Bütün pazar ezberledi. Tezgâh öğlene boşaldı.'),
        { tone: 'good' },
      ),
      opt('count', ['Handle the money', 'Kasaya geç'], (c) =>
        out(c, { sma: 2, usd: 100 }, 'You counted change faster than the calculator. The stallholder offered you a job for life.', 'Para üstünü hesap makinesinden hızlı saydın. Tezgâhçı sana ömür boyu iş teklif etti.'),
      ),
      opt('no', ['Keep your Saturdays', 'Cumartesilerini koru'], (c) =>
        out(c, { hap: 2 }, 'You slept until noon every Saturday. It was perfect and you were poor.', 'Her cumartesi öğlene kadar uyudun. Mükemmeldi ve meteliksizdin.'),
      ),
    ],
  },
  {
    id: 'base.yt_mock_exam',
    category: 'school',
    minAge: 16,
    maxAge: 17,
    once: true,
    when: inHigh,
    title: tt('Your mock exam results are… not good.', 'Deneme sınavı sonuçların… iyi değil.'),
    text: tt('The real exams are in five months.', 'Gerçek sınavlara beş ay var.'),
    choices: [
      opt('plan', ['Make a real study plan and stick to it', 'Gerçek bir çalışma planı yap ve uy'], (c) => {
        nudgeGrades(c, 10);
        return out(c, { sma: 4, hap: -2 }, 'You studied every evening for five months. It was dull and hard and it worked.', 'Beş ay her akşam çalıştın. Sıkıcıydı, zordu ve işe yaradı.');
      }, { tone: 'good' }),
      opt('tutor', ['Ask for a tutor', 'Özel ders iste'], (c) => {
        nudgeGrades(c, 7);
        return out(c, { sma: 3, usd: -400 }, 'The tutor was a tired student who explained everything in five minutes that school had taken a year to confuse.', 'Özel hocan, okulun bir yılda kafanı karıştırdığı her şeyi beş dakikada anlatan yorgun bir üniversiteliydi.');
      }),
      opt('panic', ['Panic quietly', 'Sessizce panikle'], (c) =>
        out(c, { hap: -4 }, 'You panicked for four months and studied for one. It was close.', 'Dört ay panik yaptın, bir ay çalıştın. Kıl payıydı.'),
      ),
    ],
  },
  {
    id: 'base.yt_job_shadow',
    category: 'school',
    minAge: 15,
    maxAge: 17,
    once: true,
    when: inSchool,
    title: tt('Job shadowing day. Where do you go?', 'Meslek tanıma günü. Nereye gideceksin?'),
    text: tt('One day following a real adult at a real job.', 'Gerçek bir işte, gerçek bir yetişkinin peşinde bir gün.'),
    choices: [
      opt('hospital', ['The hospital', 'Hastane'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'You followed a nurse for ten hours. She never sat down once. You sat down at home for three days.', 'On saat bir hemşirenin peşinden gittin. Bir kez bile oturmadı. Sen eve gelince üç gün oturdun.'),
      ),
      opt('garage', ['A car garage', 'Bir oto tamirhanesi'], (c) =>
        out(c, { sma: 1, hap: 3 }, 'You changed a tyre, broke nothing and came home black to the elbows and very happy.', 'Bir lastik değiştirdin, hiçbir şey kırmadın ve dirseklerine kadar kapkara, çok mutlu döndün.'),
      ),
      opt('newsroom', ['A newsroom', 'Bir gazete'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'Your one job was getting the coffee. You overheard three stories and decided you love deadlines.', 'Tek görevin kahve getirmekti. Üç haberi kulak misafiri olarak duydun ve teslim tarihlerini sevdiğine karar verdin.'),
      ),
      opt('bakery', ['A bakery, from 4 a.m.', 'Sabah dörtten itibaren bir fırın'], (c) =>
        out(c, { hea: 1, hap: 4 }, 'You saw the city before it woke up, and ate the first loaf of the day. You will never forget how it smelled.', 'Şehri uyanmadan önce gördün ve günün ilk ekmeğini yedin. O kokuyu asla unutmayacaksın.'),
      ),
    ],
  },
  {
    id: 'base.yt_friend_moves',
    category: 'random',
    minAge: 13,
    maxAge: 16,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`${nmc(c, 'fr')} is moving to another city.`, `${nmc(c, 'fr')} başka bir şehre taşınıyor.`),
    text: tt('The van comes on Saturday.', 'Kamyon cumartesi geliyor.'),
    choices: [
      opt('party', ['Throw a goodbye party', 'Veda partisi ver'], (c) => {
        near(c, 'fr', 6);
        return out(c, { hap: 3 }, 'You threw a party in the park with crisps and a speaker. Everyone cried at the same song.', 'Parkta cips ve bir hoparlörle parti verdin. Herkes aynı şarkıda ağladı.');
      }, { tone: 'good' }),
      opt('gift', ['Make a scrapbook of your friendship', 'Arkadaşlığınızın albümünü yap'], (c) => {
        near(c, 'fr', 8);
        return out(c, { hap: 2, sma: 1 }, 'You made a scrapbook of every stupid thing you did together. It is the first thing they unpacked.', 'Birlikte yaptığınız her saçmalığın albümünü hazırladın. Taşınınca ilk açtıkları şey o oldu.');
      }),
      opt('avoid', ['Avoid saying goodbye', 'Vedalaşmaktan kaç'], (c) => {
        near(c, 'fr', -4);
        return out(c, { hap: -3 }, 'You did not go on Saturday. You watched the van leave from your window. You regret it.', 'Cumartesi gitmedin. Kamyonun gidişini pencereden izledin. Pişmansın.');
      }),
    ],
  },
  {
    id: 'base.yt_piercing',
    category: 'family',
    minAge: 15,
    maxAge: 17,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You want to get your ears pierced.', 'Kulağını deldirmek istiyorsun.'),
    text: (c) => c.t(`${Kw(c, 'par')} says "over my dead body". It is a negotiating position.`, `${Kw(c, 'par')} "Benim cesedimi çiğnemeden olmaz" diyor. Bu bir pazarlık pozisyonu.`),
    choices: [
      opt('wait', ['Wait until you are eighteen', 'On sekizi bekle'], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: -1 }, 'You agreed to wait. By eighteen, you had changed your mind twice. Wisdom.', 'Beklemeyi kabul ettin. On sekizine geldiğinde iki kez fikir değiştirmiştin. Bilgelik.');
      }),
      opt('clip', ['Wear clip-on earrings to make a point', 'Mesaj vermek için klipsli küpe tak'], (c) =>
        out(c, { loo: 1, hap: 2 }, 'You wore clip-ons every day until your parent got used to the look. Then you asked again. Strategy.', 'Ailen bu görüntüye alışana kadar her gün klipsli küpe taktın. Sonra yeniden sordun. Strateji.'),
      ),
      opt('do', ['Just do it', 'Yap gitsin'], (c) => {
        near(c, 'par', -5);
        return out(c, { loo: 2, hap: 3 }, 'You came home with one earring and a very straight face. The silence at dinner could be heard from the street.', 'Eve bir küpeyle ve son derece ciddi bir yüzle geldin. Yemekteki sessizlik sokaktan duyuluyordu.');
      }),
    ],
  },
  {
    id: 'base.yt_personal_statement',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    when: (c) => inHigh(c) && !inTr(c),
    title: tt('You have to write a personal statement for university applications.', 'Üniversite başvurusu için bir niyet mektubu yazman gerekiyor.'),
    text: tt('"Tell us who you are." In five hundred words.', '"Bize kim olduğunu anlat." Beş yüz kelimede.'),
    choices: [
      opt('honest', ['Write something honest', 'Dürüst bir şey yaz'], (c) => {
        nudgeGrades(c, 4);
        return out(c, { sma: 2, hap: 3 }, 'You wrote about the summer you learned to fix bikes. It was honest and small and it worked.', 'Bisiklet tamir etmeyi öğrendiğin yazı anlattın. Dürüst ve küçüktü; işe yaradı.');
      }, { tone: 'good' }),
      opt('big', ['Make it sound impressive', 'Etkileyici görünsün'], (c) =>
        out(c, { sma: 1 }, 'You described your lemonade stand as "an early venture in beverage logistics". It sort of worked.', 'Limonata tezgâhını "içecek lojistiğinde erken bir girişim" olarak tanımladın. Bir yere kadar işe yaradı.'),
      ),
      opt('help', ['Ask a teacher to read it', 'Bir öğretmene okut'], (c) => {
        nudgeGrades(c, 3);
        return out(c, { sma: 2, hap: 1 }, 'The teacher crossed out half of it and wrote "MORE YOU" in the margin. The second draft was much better.', 'Öğretmen yarısının üstünü çizdi ve kenara "DAHA ÇOK SEN" yazdı. İkinci taslak çok daha iyiydi.');
      }),
    ],
  },
];
