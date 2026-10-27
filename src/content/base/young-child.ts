import type { EventDef } from '../types';
import { inTr } from './events-flavour';
import { da } from './util';
import {
  Kw,
  allParents,
  befriend,
  gamble,
  hasFriend,
  hasGrand,
  hasParent,
  hasSibling,
  heK,
  kw,
  near,
  newKid,
  nmc,
  opt,
  out,
  pickFriend,
  pickGrand,
  pickParent,
  pickSibling,
  tt,
  ys,
} from './young-kit';

// Round 4: early childhood and primary-school years (1–12), outside the classroom.
// Every event is once per life; school interactions live in young-school.ts.

export const youngChildEvents: EventDef[] = [
  // ================================================================ 1–3
  {
    id: 'base.yc_pot_drum',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    title: tt('You have discovered the pot cupboard.', 'Tencere dolabını keşfettin.'),
    text: tt('There is a wooden spoon right there. Destiny.', 'Hemen yanında tahta bir kaşık duruyor. Kader.'),
    choices: [
      opt('bang', ['Bang the biggest pot', 'En büyük tencereye vur'], (c) =>
        out(c, { hap: 4 }, 'You played a forty-minute drum solo. The neighbours learned your name.', 'Kırk dakikalık bir davul solosu attın. Komşular adını öğrendi.'),
      ),
      opt('rhythm', ['Tap out a careful rhythm', 'Özenle bir ritim tuttur'], (c) => {
        allParents(c, 3);
        return out(c, { sma: 2, hap: 2 }, 'You tapped a real rhythm. Your family started talking about music lessons.', 'Gerçek bir ritim tutturdun. Evde müzik kursu lafları başladı.');
      }),
      opt('chew', ['Chew the spoon instead', 'Kaşığı kemir, olsun bitsin'], (c) =>
        out(c, { hap: 2 }, 'You chewed the spoon thoughtfully. You were not a drummer. You were a critic.', 'Kaşığı düşünceli düşünceli kemirdin. Davulcu değildin, eleştirmendin.'),
      ),
    ],
  },
  {
    id: 'base.yc_no_shoes',
    category: 'childhood',
    minAge: 1,
    maxAge: 3,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You have decided shoes are not for you.', 'Ayakkabının sana göre olmadığına karar verdin.'),
    text: (c) => c.t(`${Kw(c, 'par')} is holding one small shoe and losing hope.`, `${Kw(c, 'par')} elinde minicik bir ayakkabıyla umudunu yitirmek üzere.`),
    choices: [
      opt('kick', ['Kick both shoes off in the pram', 'Pusette ikisini de fırlat'], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 3 }, 'One shoe was never seen again. A pigeon may be wearing it.', 'Bir teki bir daha bulunmadı. Bir güvercin giyiyor olabilir.');
      }),
      opt('wrong', ['Wear them on the wrong feet', 'Ters giy'], (c) =>
        out(c, { hap: 2, sma: 1 }, 'You put them on yourself, on the wrong feet, and walked like a proud duck.', 'Kendin giydin, ters giydin ve gururlu bir ördek gibi yürüdün.'),
      ),
      opt('give', ['Give in', 'Pes et'], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: -1 }, (`${Kw(c, 'par')} won. You sulked in your shoes for one full minute.`), `${Kw(c, 'par')} kazandı. Ayakkabılarının içinde tam bir dakika surat yaptın.`);
      }),
    ],
  },
  {
    id: 'base.yc_daycare_block',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    setup: (c) => newKid(c),
    title: (c) => c.t(`${nmc(c, 'kid')} took your red block.`, `${nmc(c, 'kid')} kırmızı bloğunu aldı.`),
    text: tt('It was the best block. Everyone knows it was the best block.', 'En güzel bloktu. Herkes biliyor, en güzel oydu.'),
    choices: [
      opt('bite', ['Bite', 'Isır'], (c) =>
        out(c, { hap: 1 }, `You bit. The nursery called home. You were "having a hard week".`, 'Isırdın. Kreşten eve telefon geldi. "Zor bir hafta geçiriyormuşsun."'),
        { tone: 'bad' },
      ),
      opt('cry', ['Cry as loud as possible', 'Avazın çıktığı kadar ağla'], (c) =>
        out(c, { hap: -1 }, 'You cried so well that three other children joined in. A choir.', 'Öyle güzel ağladın ki üç çocuk daha katıldı. Koro oldunuz.'),
      ),
      opt('share', ['Hand over the blue block too', 'Mavi bloğu da ver'], (c) => {
        befriend(c, 'kid', 60);
        return out(c, { hap: 3 }, `${nmc(c, 'kid')} stared at you, then built you a tower. Best friends, at least until lunch.`, `${nmc(c, 'kid')} sana bir süre baktı, sonra sana bir kule yaptı. En iyi arkadaşsınız; en azından öğle yemeğine kadar.`);
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.yc_phone_call',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`You got hold of ${kw(c, 'par', 'gen')} phone.`, `${Kw(c, 'par', 'gen')} telefonunu ele geçirdin.`),
    text: tt('It is ringing someone. You did that.', 'Birini arıyor. Sen yaptın bunu.'),
    choices: [
      opt('talk', ['Tell them all about your day', 'Gününü uzun uzun anlat'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 3 }, `It was ${kw(c, 'par', 'gen')} boss. You talked about ducks for six minutes. ${Kw(c, 'par')} got a raise. Coincidence?`, `Arayan değil, aranan ${kw(c, 'par', 'gen')} patronuymuş. Altı dakika ördeklerden bahsettin. ${Kw(c, 'par')} zam aldı. Tesadüf mü?`),
          (c) => out(c, { hap: 3 }, 'It was a great-aunt you had never met. She cried with joy and sent a parcel of socks.', 'Hiç görmediğin bir büyük teyzeymiş. Sevincinden ağladı, koli dolusu çorap yolladı.'),
        ),
      ),
      opt('buttons', ['Press every button', 'Bütün tuşlara bas'], (c) => {
        near(c, 'par', -2);
        return out(c, { sma: 1 }, 'The phone is now in a language nobody in the house speaks.', 'Telefon artık evde kimsenin konuşmadığı bir dilde.');
      }),
      opt('hide', ['Hide it in the bread bin', 'Ekmek dolabına sakla'], (c) =>
        out(c, { hap: 2 }, 'The phone was found three days later, ringing inside a loaf.', 'Telefon üç gün sonra bir somunun içinde çalarken bulundu.'),
      ),
    ],
  },
  {
    id: 'base.yc_potty',
    category: 'childhood',
    minAge: 2,
    maxAge: 3,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('Potty training has begun.', 'Tuvalet eğitimi başladı.'),
    text: (c) => c.t(`${Kw(c, 'par')} has bought a potty shaped like a frog. It stares at you.`, `${Kw(c, 'par')} kurbağa şeklinde bir lazımlık aldı. Sana bakıyor.`),
    choices: [
      opt('try', ['Give it a go', 'Bir dene'], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 4, sma: 1 }, 'Success. There was applause. There was a sticker. There was a phone call to your grandmother.', 'Başardın. Alkış oldu, çıkartma oldu, büyükanneye telefon oldu.');
      }, { tone: 'good' }),
      opt('hat', ['Wear it as a hat', 'Şapka olarak tak'], (c) =>
        out(c, { hap: 3 }, 'You wore the frog as a hat for a week. Training was postponed.', 'Kurbağayı bir hafta şapka olarak taktın. Eğitim ertelendi.'),
      ),
      opt('refuse', ['Refuse on principle', 'İlke olarak reddet'], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: -1 }, 'You held out for a month. In the end the frog won, as frogs do.', 'Bir ay direndin. Sonunda kurbağa kazandı; kurbağalar hep kazanır.');
      }),
    ],
  },
  {
    id: 'base.yc_fridge',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    title: tt('You worked out how to open the fridge.', 'Buzdolabını açmayı çözdün.'),
    text: tt('A cold, bright world full of possibilities.', 'Soğuk, ışıl ışıl, olasılıklarla dolu bir dünya.'),
    choices: [
      opt('butter', ['Lick the butter', 'Tereyağını yala'], (c) =>
        out(c, { hap: 3 }, 'You left a perfect tongue print in the butter. It was served to guests anyway.', 'Tereyağında kusursuz bir dil izi bıraktın. Yine de misafirlere ikram edildi.'),
      ),
      opt('eggs', ['Count the eggs (by dropping them)', 'Yumurtaları say (düşürerek)'], (c) =>
        out(c, { sma: 1, hap: 1 }, 'You counted to six. The floor counted with you.', 'Altıya kadar saydın. Yer de seninle saydı.'),
        { tone: 'bad' },
      ),
      opt('sit', ['Sit inside to cool off', 'İçine oturup serinle'], (c) =>
        out(c, { hea: -1, hap: 2 }, 'You were found sitting next to the yogurt, very calm. A lock was bought the next day.', 'Yoğurdun yanında, son derece sakin otururken bulundun. Ertesi gün kilit alındı.'),
      ),
    ],
  },
  {
    id: 'base.yc_vacuum',
    category: 'childhood',
    minAge: 1,
    maxAge: 3,
    once: true,
    title: tt('The vacuum cleaner is coming.', 'Elektrik süpürgesi geliyor.'),
    text: tt('It roars. It eats. It is clearly alive.', 'Kükrüyor. Yutuyor. Belli ki canlı.'),
    choices: [
      opt('flee', ['Run to the bedroom', 'Yatak odasına kaç'], (c) =>
        out(c, { hap: -2 }, 'You hid under the bed until the beast went back to its cupboard.', 'Canavar dolabına dönene kadar yatağın altında saklandın.'),
      ),
      opt('ride', ['Try to ride it', 'Üstüne binmeye çalış'], (c) =>
        out(c, { hap: 4 }, 'You rode the vacuum like a horse. It was the start of a lifelong friendship.', 'Süpürgeye at gibi bindin. Ömür boyu sürecek bir dostluğun başlangıcıydı.'),
      ),
      opt('feed', ['Feed it a sock', 'Bir çorap yedir'], (c) =>
        out(c, { sma: 1, hap: 1 }, 'It ate the sock and made a terrible noise. You now know who is in charge.', 'Çorabı yedi ve korkunç bir ses çıkardı. Artık evin patronu kim, biliyorsun.'),
      ),
    ],
  },

  // ================================================================ 3–7
  {
    id: 'base.yc_pigeons',
    category: 'childhood',
    minAge: 3,
    maxAge: 5,
    once: true,
    title: (c) => c.t('The square is full of pigeons.', inTr(c) ? 'Meydan güvercin dolu.' : 'Meydan güvercin dolu.'),
    text: tt('Hundreds of them. They do not know what is coming.', 'Yüzlercesi. Başlarına ne geleceğinden haberleri yok.'),
    choices: [
      opt('chase', ['Charge!', 'Hücum!'], (c) =>
        out(c, { hap: 5, hea: 1 }, 'You charged. They rose like a grey cloud. Best day of your life so far.', 'Hücum ettin. Gri bir bulut gibi havalandılar. Şimdiye kadarki en güzel günün.'),
      ),
      opt('feed', ['Share your bread with them', 'Ekmeğini onlarla paylaş'], (c) =>
        out(c, { hap: 3 }, 'They loved you. One followed you home. It is still on the balcony.', 'Sana bayıldılar. Biri eve kadar peşinden geldi. Hâlâ balkonda.'),
        { tone: 'good' },
      ),
      opt('talk', ['Try to speak pigeon', 'Güvercince konuşmayı dene'], (c) =>
        out(c, { sma: 1, hap: 2 }, 'You cooed for ten minutes. A pigeon cooed back. You are fluent now.', 'On dakika guruldadın. Bir güvercin karşılık verdi. Artık akıcı konuşuyorsun.'),
      ),
    ],
  },
  {
    id: 'base.yc_seed',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    title: tt('You planted a bean in a yogurt cup.', 'Bir yoğurt kabına fasulye ektin.'),
    text: tt('The teacher said to water it "a little". How little is little?', 'Öğretmen "azıcık" sulayın dedi. Azıcık ne kadar?'),
    choices: [
      opt('care', ['Water it every morning', 'Her sabah sula'], (c) =>
        out(c, { sma: 2, hap: 3 }, 'It sprouted. You named it and told it about your day. It grew taller than the window.', 'Filizlendi. Ona bir isim verdin, her gün gününü anlattın. Pencereden uzun oldu.'),
        { tone: 'good' },
      ),
      opt('flood', ['Give it a big drink', 'Bol bol su ver'], (c) =>
        out(c, { sma: 1 }, 'The bean drowned. You held a small, sincere funeral by the radiator.', 'Fasulye boğuldu. Kaloriferin yanında küçük ama içten bir cenaze töreni yaptın.'),
      ),
      opt('dig', ['Dig it up to check on it', 'Kontrol için kazıp çıkar'], (c) =>
        out(c, { sma: 2 }, 'You dug it up every day to see how it was doing. Science learned a lot. The bean did not.', 'Nasıl olduğunu görmek için her gün kazıp çıkardın. Bilim çok şey öğrendi. Fasulye öğrenemedi.'),
      ),
    ],
  },
  {
    id: 'base.yc_whistle',
    category: 'childhood',
    minAge: 4,
    maxAge: 7,
    once: true,
    title: tt('Everyone can whistle except you.', 'Senden başka herkes ıslık çalabiliyor.'),
    text: tt('All you can produce is a damp hiss.', 'Senin çıkarabildiğin tek şey nemli bir fıs.'),
    choices: [
      opt('practise', ['Practise all week', 'Bütün hafta çalış'], (c) =>
        gamble(
          c,
          0.65,
          (c) => out(c, { hap: 5 }, 'On day six, a real whistle came out. You whistled until bedtime and then, quietly, in bed.', 'Altıncı gün gerçek bir ıslık çıktı. Yatma saatine kadar ıslık çaldın, sonra da yatakta sessizce.'),
          (c) => out(c, { hap: -1 }, 'A week of practice. Still just the hiss. It is a very confident hiss now.', 'Bir hafta çalıştın. Hâlâ fıs. Ama artık çok kendinden emin bir fıs.'),
        ),
      ),
      opt('fingers', ['Use your fingers like the big kids', 'Büyük çocuklar gibi parmakla dene'], (c) =>
        out(c, { hap: 2 }, 'You put four fingers in your mouth and blew. Only spit. So much spit.', 'Ağzına dört parmak sokup üfledin. Sadece tükürük çıktı. Çok fazla tükürük.'),
      ),
      opt('hum', ['Hum instead, louder', 'Onun yerine daha yüksek sesle mırıldan'], (c) =>
        out(c, { hap: 2 }, 'You decided humming is better. You hummed at everyone, to make the point.', 'Mırıldanmanın daha iyi olduğuna karar verdin. Kanıtlamak için herkese mırıldandın.'),
      ),
    ],
  },
  {
    id: 'base.yc_dinosaur',
    category: 'childhood',
    minAge: 4,
    maxAge: 6,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You want a pet dinosaur.', 'Evcil bir dinozor istiyorsun.'),
    text: (c) => c.t(`You have explained this to ${kw(c, 'par')} eleven times today.`, `Bunu bugün ${kw(c, 'par', 'dat')} on bir kez anlattın.`),
    choices: [
      opt('plan', ['Draw a detailed care plan', 'Ayrıntılı bir bakım planı çiz'], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 2, hap: 2 }, `Your plan included a "dinosaur room". ${Kw(c, 'par')} framed it. You got a goldfish called T-Rex.`, `Planında bir "dinozor odası" bile vardı. ${Kw(c, 'par')} onu çerçeveletti. Sana T-Rex adında bir japon balığı alındı.`);
      }),
      opt('egg', ['Find an egg and wait', 'Bir yumurta bul ve bekle'], (c) =>
        out(c, { hap: 1 }, 'You sat on a potato for two days. Nothing hatched. You remain hopeful.', 'İki gün bir patatesin üstünde oturdun. Hiçbir şey çıkmadı. Umudunu koruyorsun.'),
      ),
      opt('be', ['Become the dinosaur', 'Dinozor sen ol'], (c) =>
        out(c, { hap: 4 }, 'You roared at the postman for a month. He started roaring back.', 'Bir ay boyunca postacıya kükredin. O da sana kükremeye başladı.'),
      ),
    ],
  },
  {
    id: 'base.yc_snow_day',
    category: 'childhood',
    minAge: 4,
    maxAge: 10,
    once: true,
    when: (c) => c.p.countryId !== 'br',
    title: tt('Snow day! School is closed.', 'Kar tatili! Okullar kapalı.'),
    text: tt('The whole street is white and silent. Not for long.', 'Bütün sokak bembeyaz ve sessiz. Uzun sürmeyecek.'),
    choices: [
      opt('sled', ['Go sledding on a tray', 'Tepsiyle kaymaya git'], (c) =>
        gamble(
          c,
          0.8,
          (c) => out(c, { hap: 6, hea: 1 }, 'You flew down the hill on a kitchen tray. Fastest thing in the neighbourhood.', 'Mutfak tepsisiyle yokuştan uçtun. Mahallenin en hızlısı sendin.'),
          (c) => out(c, { hap: 2, hea: -3 }, 'You met a tree at full speed. The tree won. You still say it was worth it.', 'Tam hızla bir ağaçla tanıştın. Ağaç kazandı. Yine de değdi diyorsun.'),
        ),
      ),
      opt('snowman', ['Build a snowman', 'Kardan adam yap'], (c) =>
        out(c, { hap: 4 }, 'Your snowman had a carrot nose and the good scarf from the hallway. Only one of those came back.', 'Kardan adamın havuçtan bir burnu ve evin en güzel atkısı vardı. Bunlardan sadece biri geri döndü.'),
      ),
      opt('window', ['Watch from the window with cocoa', 'Pencereden kakao içerek izle'], (c) =>
        out(c, { hap: 3 }, 'You watched the snow fall with a mug of cocoa. Some days are for watching.', 'Elinde bir kupa kakaoyla karın yağışını izledin. Bazı günler izlemek içindir.'),
      ),
    ],
  },
  {
    id: 'base.yc_magic',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    title: tt('You learned a magic trick.', 'Bir sihirbazlık numarası öğrendin.'),
    text: tt('A coin vanishes and reappears behind an ear. Mostly.', 'Bozuk para kayboluyor, sonra bir kulağın arkasından çıkıyor. Çoğu zaman.'),
    choices: [
      opt('show', ['Perform it at the family dinner', 'Aile yemeğinde göster'], (c) =>
        gamble(
          c,
          0.6,
          (c) => {
            allParents(c, 2);
            return out(c, { hap: 5 }, 'The coin appeared behind your grandpa\'s ear. He gave you a real one for your trouble.', 'Para dedenin kulağının arkasından çıktı. Zahmetin için sana gerçek bir para verdi.');
          },
          (c) => out(c, { hap: -1 }, 'The coin rolled under the sofa. "That was the trick," you said. Nobody believed you.', 'Para kanepenin altına yuvarlandı. "Numara buydu zaten" dedin. Kimse inanmadı.'),
        ),
      ),
      opt('practise', ['Practise in the mirror', 'Aynanın karşısında çalış'], (c) =>
        out(c, { sma: 2, hap: 1 }, 'You practised until even the mirror was fooled.', 'Ayna bile kanana kadar çalıştın.'),
      ),
      opt('secret', ['Never reveal the secret', 'Sırrı asla açıklama'], (c) =>
        out(c, { hap: 3 }, 'You refused to explain it, even under torture by tickling. A true magician.', 'Gıdıklama işkencesi altında bile açıklamadın. Gerçek bir sihirbaz.'),
      ),
    ],
  },
  {
    id: 'base.yc_ice_cream_van',
    category: 'childhood',
    minAge: 4,
    maxAge: 8,
    once: true,
    title: (c) => c.t('The ice cream van is playing its song.', inTr(c) ? 'Dondurmacının zili çalıyor.' : 'Dondurma arabasının müziği çalıyor.'),
    text: tt('You have no money. You have charm.', 'Paran yok. Ama cazibe sende.'),
    choices: [
      opt('beg', ['Beg at the door with big eyes', 'Kapıda kocaman gözlerle yalvar'], (c) =>
        out(c, { hap: 3 }, 'It worked. It always works. You got two scoops and a lecture about money.', 'İşe yaradı. Hep yarar. İki top dondurma ve para üzerine bir nutuk kazandın.'),
      ),
      opt('piggy', ['Raid your piggy bank', 'Kumbaranı boşalt'], (c) =>
        out(c, { hap: 4, sma: 1 }, 'You paid in coins, one at a time, while the queue waited. You felt very grown up.', 'Bozuk paralarla tek tek ödedin, arkadaki sıra bekledi. Kendini kocaman hissettin.'),
      ),
      opt('chase', ['Chase the van down the street', 'Arabayı sokak boyunca kovala'], (c) =>
        out(c, { hea: 2, hap: -1 }, 'You chased it for three streets. It never stopped. Your first lesson in heartbreak.', 'Üç sokak kovaladın. Hiç durmadı. Kalp kırıklığıyla ilk tanışman.'),
      ),
    ],
  },
  {
    id: 'base.yc_nightlight',
    category: 'childhood',
    minAge: 3,
    maxAge: 5,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('Your night light broke.', 'Gece lamban bozuldu.'),
    text: tt('The dark is very dark tonight.', 'Karanlık bu gece çok karanlık.'),
    choices: [
      opt('call', ['Call for help', 'Yardım çağır'], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 2 }, (`${Kw(c, 'par')} came and sat with you until you fell asleep, telling stories about a brave torch.`), `${Kw(c, 'par')} geldi ve uyuyana kadar yanında oturup cesur bir el feneri masalı anlattı.`);
      }, { tone: 'good' }),
      opt('brave', ['Be brave alone', 'Tek başına cesur ol'], (c) =>
        out(c, { hap: 1, sma: 1 }, 'You lay there with your eyes wide open for an hour, then slept like a hero.', 'Bir saat gözlerin fal taşı gibi açık yattın, sonra bir kahraman gibi uyudun.'),
      ),
      opt('torch', ['Find the torch and read under the blanket', 'Feneri bul, yorganın altında kitap oku'], (c) =>
        out(c, { sma: 2 }, 'You read picture books by torchlight until two. A reader is born.', 'Gece ikiye kadar fener ışığında resimli kitap okudun. Bir okur doğdu.'),
      ),
    ],
  },
  {
    id: 'base.yc_car_trip',
    category: 'family',
    minAge: 5,
    maxAge: 9,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('A six-hour drive to see relatives.', 'Akrabalara altı saatlik yolculuk.'),
    text: tt('You have asked "Are we there yet?" four times. It has been eleven minutes.', '"Geldik mi?" diye dört kez sordun. On bir dakika oldu.'),
    choices: [
      opt('game', ['Start a game of I-spy', 'Bir "gözüm görüyor" oyunu başlat'], (c) => {
        allParents(c, 3);
        return out(c, { hap: 3, sma: 1 }, 'Everyone played. You chose "road" every time and won every time.', 'Herkes oynadı. Sen her seferinde "yol"u seçtin ve her seferinde kazandın.');
      }),
      opt('ask', ['Keep asking', 'Sormaya devam et'], (c) => {
        near(c, 'par', -2);
        return out(c, { hap: 1 }, 'By hour three the answer was "yes, we are there, this is it, we live in the car now".', 'Üçüncü saatte cevap "Evet geldik, burası, artık arabada yaşıyoruz" oldu.');
      }),
      opt('sleep', ['Sleep with your face on the window', 'Yüzün cama yapışık uyu'], (c) =>
        out(c, { hap: 2 }, 'You slept the whole way and woke up with the seat belt printed on your cheek.', 'Bütün yolu uyudun ve yanağında emniyet kemerinin iziyle uyandın.'),
      ),
    ],
  },
  {
    id: 'base.yc_hide_seek',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    title: tt('Hide and seek. You found the perfect spot.', 'Saklambaç. Mükemmel yeri buldun.'),
    text: tt('Inside the laundry basket, under the towels. Nobody will ever find you.', 'Çamaşır sepetinin içi, havluların altı. Seni kimse bulamaz.'),
    choices: [
      opt('stay', ['Stay hidden no matter what', 'Ne olursa olsun çıkma'], (c) =>
        out(c, { hap: 1 }, 'You stayed hidden for two hours. Everyone else had gone home. You won, technically.', 'İki saat saklandın. Herkes evine gitmişti. Teknik olarak kazandın.'),
      ),
      opt('peek', ['Peek out after ten minutes', 'On dakika sonra bir göz at'], (c) =>
        out(c, { hap: 3 }, 'You peeked right as the seeker passed. You both screamed. Best round ever.', 'Tam ebe geçerken başını uzattın. İkiniz de çığlık attınız. En güzel turdu.'),
      ),
      opt('snack', ['Sneak to the kitchen for a snack', 'Mutfağa sıvışıp bir şey atıştır'], (c) =>
        out(c, { hap: 3 }, 'You were caught with a biscuit in your mouth. It was worth it.', 'Ağzında bisküviyle yakalandın. Değdi.'),
      ),
    ],
  },
  {
    id: 'base.yc_bad_word',
    category: 'family',
    minAge: 5,
    maxAge: 8,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You heard a new word from an uncle stuck in traffic.', 'Trafikte sıkışan bir amcandan yeni bir kelime duydun.'),
    text: tt('It sounded powerful. Dinner is in an hour.', 'Kulağa çok güçlü geldi. Akşam yemeğine bir saat var.'),
    choices: [
      opt('say', ['Use it at dinner', 'Yemekte kullan'], (c) => {
        near(c, 'par', -2);
        return out(c, { hap: 2 }, 'The table went silent. Then your uncle laughed into his soup and got into far more trouble than you.', 'Masada çıt çıkmadı. Sonra amcan çorbasına gülmeye başladı ve senden çok daha büyük azar yedi.');
      }),
      opt('ask', ['Ask what it means', 'Ne demek olduğunu sor'], (c) => {
        near(c, 'par', 2);
        return out(c, { sma: 1 }, (`${Kw(c, 'par')} said it means "a very tired person". You used it for your teacher. That went badly.`), `${Kw(c, 'par')} "çok yorgun insan" demek olduğunu söyledi. Sen de öğretmenine söyledin. Kötü oldu.`);
      }),
      opt('keep', ['Keep it for emergencies', 'Acil durumlar için sakla'], (c) =>
        out(c, { sma: 1, hap: 1 }, 'You kept the word in a secret place in your head, like a firework.', 'Kelimeyi kafanın gizli bir köşesinde, havai fişek gibi sakladın.'),
      ),
    ],
  },
  {
    id: 'base.yc_blanket_fort',
    category: 'family',
    minAge: 5,
    maxAge: 9,
    once: true,
    when: hasSibling,
    setup: (c) => pickSibling(c),
    title: (c) => c.t(`It is raining. You and ${nmc(c, 'sib')} have every blanket in the house.`, `Yağmur yağıyor. ${nmc(c, 'sib', 'wth')} evdeki bütün battaniyeler sizde.`),
    text: tt('The sofa cushions are walls now.', 'Kanepe minderleri artık duvar.'),
    choices: [
      opt('castle', ['Build a castle with a moat', 'Hendekli bir kale yap'], (c) => {
        near(c, 'sib', 5);
        return out(c, { hap: 4 }, `You built a castle. ${nmc(c, 'sib')} was the dragon. The moat was a towel. You slept in it.`, `Bir kale yaptınız. ${nmc(c, 'sib')} ejderhaydı. Hendek bir havluydu. İçinde uyudunuz.`);
      }, { tone: 'good' }),
      opt('rules', ['Make rules for who can enter', 'Kimin girebileceğine dair kurallar koy'], (c) => {
        near(c, 'sib', -2);
        return out(c, { hap: 1, sma: 1 }, `You wrote a constitution. ${nmc(c, 'sib')} declared independence and built a rival fort.`, `Bir anayasa yazdın. ${nmc(c, 'sib')} bağımsızlığını ilan edip rakip bir kale kurdu.`);
      }),
      opt('cave', ['Turn it into a dark cave with a torch', 'Fenerle karanlık bir mağaraya çevir'], (c) => {
        near(c, 'sib', 3);
        return out(c, { hap: 3 }, 'You told ghost stories by torchlight until you both had to sleep with the big light on.', 'Fener ışığında hayalet hikâyeleri anlattınız; sonunda ikiniz de büyük ışık açık uyumak zorunda kaldınız.');
      }),
    ],
  },
  {
    id: 'base.yc_toy_ad',
    category: 'childhood',
    minAge: 6,
    maxAge: 9,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('You saw an advert for the Mega Robo Dragon.', 'Reklamda Mega Robo Ejderha\'yı gördün.'),
    text: tt('It breathes smoke, it talks, it costs more than the fridge.', 'Duman üflüyor, konuşuyor, buzdolabından pahalı.'),
    choices: [
      opt('save', ['Save your pocket money for it', 'Harçlığını biriktir'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'You saved for eight months. By then you liked a different toy. You bought a bike bell and kept the rest.', 'Sekiz ay biriktirdin. O zamana kadar başka bir oyuncak sevmiştin. Bir bisiklet zili aldın, gerisini sakladın.'),
        { tone: 'good' },
      ),
      opt('nag', ['Mention it at every meal', 'Her yemekte lafını aç'], (c) =>
        gamble(
          c,
          0.4,
          (c) => out(c, { hap: 5 }, 'It worked. You got the dragon for your birthday. It broke on day three. You loved it anyway.', 'İşe yaradı. Doğum gününde ejderha geldi. Üçüncü gün bozuldu. Yine de çok sevdin.'),
          (c) => {
            near(c, 'par', -2);
            return out(c, { hap: -2 }, `${Kw(c, 'par')} banned the word "dragon" from the dinner table.`, `${Kw(c, 'par')} yemek masasında "ejderha" kelimesini yasakladı.`);
          },
        ),
      ),
      opt('make', ['Build your own from boxes', 'Kutulardan kendin yap'], (c) =>
        out(c, { sma: 3, hap: 3 }, 'Your cardboard dragon had a torch for a mouth. It was better than the real one and everyone said so.', 'Karton ejderhanın ağzı el fenerindendi. Gerçeğinden güzeldi, herkes de öyle dedi.'),
      ),
    ],
  },

  // ================================================================ 7–12
  {
    id: 'base.yc_treehouse',
    category: 'childhood',
    minAge: 7,
    maxAge: 11,
    once: true,
    setup: (c) => (hasFriend(c) ? pickFriend(c, 'kid') : newKid(c)),
    title: (c) => c.t(`You and ${nmc(c, 'kid')} want to build a hideout.`, `${nmc(c, 'kid', 'wth')} bir gizli sığınak yapmak istiyorsunuz.`),
    text: tt('You have four planks, a rope and no permission.', 'Dört tahta, bir ip var. İzin yok.'),
    choices: [
      opt('tree', ['Build it up a tree', 'Ağacın tepesine kur'], (c) =>
        gamble(
          c,
          0.75,
          (c) => {
            befriend(c, 'kid', 60);
            return out(c, { hap: 6 }, `The hideout held. Mostly. You and ${nmc(c, 'kid')} spent the whole summer up there.`, `Sığınak dayandı. Çoğunlukla. ${nmc(c, 'kid', 'wth')} bütün yazı orada geçirdiniz.`);
          },
          (c) => out(c, { hap: 1, hea: -4 }, 'The floor gave way on day one. You have a cast and a great story.', 'Zemin ilk gün çöktü. Kolunda alçı, dilinde harika bir hikâye var.'),
        ),
      ),
      opt('ground', ['Build it behind the shed', 'Barakanın arkasına kur'], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 4, sma: 1 }, `It was not high, but it had a door, a sign that said KEEP OUT and a biscuit tin. Perfect.`, 'Yüksek değildi ama bir kapısı, "GİRMEK YASAK" yazan bir tabelası ve bir bisküvi kutusu vardı. Mükemmel.');
      }),
      opt('ask', ['Ask a grown-up to help', 'Bir büyükten yardım iste'], (c) =>
        out(c, { hap: 3, sma: 1 }, 'A neighbour with a drill took over completely. It was his hideout now. He let you visit.', 'Matkaplı bir komşu işi tamamen devraldı. Sığınak artık onundu. Ziyaret etmene izin verdi.'),
      ),
    ],
  },
  {
    id: 'base.yc_time_capsule',
    category: 'childhood',
    minAge: 8,
    maxAge: 11,
    once: true,
    title: tt('You are making a time capsule.', 'Bir zaman kapsülü hazırlıyorsun.'),
    text: tt('A biscuit tin, a letter to your future self, and a spade.', 'Bir bisküvi kutusu, gelecekteki kendine bir mektup ve bir kürek.'),
    choices: [
      opt('letter', ['Write an honest letter', 'Dürüst bir mektup yaz'], (c) => {
        ys(c).capsule = c.s.year;
        return out(c, { sma: 1, hap: 3 }, 'You wrote: "Dear future me, are you a pilot yet? Do you still hate peas?" Then you buried it under the old tree.', '"Sevgili gelecekteki ben, pilot oldun mu? Bezelyeden hâlâ nefret ediyor musun?" diye yazdın. Sonra yaşlı ağacın altına gömdün.');
      }, { tone: 'good' }),
      opt('treasure', ['Fill it with your best treasures', 'En değerli hazinelerinle doldur'], (c) => {
        ys(c).capsule = c.s.year;
        return out(c, { hap: 2 }, 'You buried a shiny stone, a toy car and your best marble. It hurt a little.', 'Parlak bir taş, oyuncak bir araba ve en güzel misketini gömdün. Biraz acıttı.');
      }),
      opt('dig', ['Dig it up again the next day', 'Ertesi gün geri çıkar'], (c) =>
        out(c, { hap: 1 }, 'The future was too far away. You dug it up after one night. It was exactly as you left it.', 'Gelecek çok uzaktı. Bir gece sonra kazıp çıkardın. Bıraktığın gibiydi.'),
      ),
    ],
  },
  {
    id: 'base.yc_pen_pal',
    category: 'school',
    minAge: 8,
    maxAge: 11,
    once: true,
    setup: (c) => newKid(c, 'pal'),
    title: tt('Your class is getting pen pals from another country.', 'Sınıfına başka bir ülkeden mektup arkadaşları geliyor.'),
    text: (c) => c.t(`Yours is called ${nmc(c, 'pal')}. The first letter has a drawing of a goat.`, `Seninkinin adı ${nmc(c, 'pal')}. İlk mektupta bir keçi resmi var.`),
    choices: [
      opt('write', ['Write back every month', 'Her ay cevap yaz'], (c) => {
        befriend(c, 'pal', 50);
        ys(c).penpal = String(c.vars.pal);
        return out(c, { sma: 2, hap: 3 }, `You and ${nmc(c, 'pal')} wrote for years about goats, school and the meaning of life.`, `${nmc(c, 'pal', 'wth')} yıllarca keçiler, okul ve hayatın anlamı üzerine yazıştınız.`);
      }, { tone: 'good' }),
      opt('goat', ['Send a drawing of a better goat', 'Daha iyi bir keçi çizip yolla'], (c) => {
        befriend(c, 'pal', 40);
        ys(c).penpal = String(c.vars.pal);
        return out(c, { hap: 3 }, 'A goat-drawing war began across borders. Neither side surrendered.', 'Sınırları aşan bir keçi çizme savaşı başladı. İki taraf da teslim olmadı.');
      }),
      opt('forget', ['Forget to reply', 'Cevap yazmayı unut'], (c) =>
        out(c, { hap: -1 }, 'The letter stayed in your bag until it turned into a fossil.', 'Mektup çantanda fosilleşene kadar kaldı.'),
      ),
    ],
  },
  {
    id: 'base.yc_kite',
    category: 'childhood',
    minAge: 6,
    maxAge: 10,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: tt('It is windy. Perfect kite weather.', 'Rüzgâr var. Tam uçurtma havası.'),
    text: (c) => c.t(`${Kw(c, 'par')} has newspaper, sticks and glue.`, `${Kw(c, 'par')} gazete, çıta ve tutkal getirdi.`),
    choices: [
      opt('make', ['Make one together', 'Birlikte yapın'], (c) => {
        near(c, 'par', 5);
        return out(c, { hap: 5, sma: 1 }, 'Your kite flew higher than the bank, the blocks of flats and a very surprised seagull.', 'Uçurtman bankadan, apartmanlardan ve çok şaşırmış bir martıdan yükseğe uçtu.');
      }, { tone: 'good' }),
      opt('run', ['Just run with it', 'Alıp koşmaya başla'], (c) =>
        out(c, { hea: 2, hap: 2 }, 'You ran until your lungs burned. The kite stayed one metre above the ground, loyal as a dog.', 'Ciğerlerin yanana kadar koştun. Uçurtma yerden bir metre yukarıda, köpek gibi sadakatle peşinden geldi.'),
      ),
      opt('tree', ['Fly it near the big tree', 'Büyük ağacın yanında uçur'], (c) =>
        out(c, { hap: -1 }, 'The tree took it. It is still up there, a flag of your defeat.', 'Ağaç onu aldı. Hâlâ orada, yenilginin bayrağı gibi.'),
      ),
    ],
  },
  {
    id: 'base.yc_bird',
    category: 'childhood',
    minAge: 6,
    maxAge: 11,
    once: true,
    title: tt('A baby bird has fallen out of its nest.', 'Bir yavru kuş yuvasından düşmüş.'),
    text: tt('It is tiny, bald and furious.', 'Minicik, tüysüz ve çok sinirli.'),
    choices: [
      opt('box', ['Raise it in a shoebox', 'Ayakkabı kutusunda büyüt'], (c) =>
        gamble(
          c,
          0.55,
          (c) => out(c, { hap: 6, sma: 2 }, 'You fed it with a dropper for three weeks. One morning it flew off the balcony. You cried and cheered at once.', 'Üç hafta damlalıkla besledin. Bir sabah balkondan uçup gitti. Hem ağladın hem alkışladın.'),
          (c) => out(c, { hap: -4 }, 'You tried so hard. It did not make it. You buried it under the rose bush with a speech.', 'Çok uğraştın. Yaşamadı. Gül fidanının altına, bir konuşmayla gömdün.'),
        ),
      ),
      opt('nest', ['Climb up and put it back', 'Tırmanıp yuvasına koy'], (c) =>
        out(c, { hap: 4, hea: -1 }, 'You climbed, scraped both knees and put it back. Its mother shouted at you. You took it as thanks.', 'Tırmandın, iki dizini de sıyırdın, yerine koydun. Annesi sana bağırdı. Teşekkür olarak kabul ettin.'),
        { tone: 'good' },
      ),
      opt('call', ['Call the animal rescue', 'Hayvan kurtarmayı ara'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'A volunteer came and took it away. They sent you a photo a month later: a proper sparrow.', 'Bir gönüllü gelip aldı. Bir ay sonra sana fotoğraf yolladılar: koca bir serçe olmuş.'),
      ),
    ],
  },
  {
    id: 'base.yc_secret_club',
    category: 'childhood',
    minAge: 8,
    maxAge: 11,
    once: true,
    setup: (c) => (hasFriend(c) ? pickFriend(c, 'kid') : newKid(c)),
    title: (c) => c.t(`${nmc(c, 'kid')} has started a secret club.`, `${nmc(c, 'kid')} gizli bir kulüp kurdu.`),
    text: tt('There is a password, a handshake and a strict no-little-brothers policy.', 'Bir parolası, bir tokalaşması ve sıkı bir "küçük kardeş giremez" kuralı var.'),
    choices: [
      opt('join', ['Join and take the oath', 'Katıl ve yemin et'], (c) => {
        befriend(c, 'kid', 60);
        return out(c, { hap: 4 }, 'You swore the oath on a comic book. The password is "pickle". Please forget it.', 'Bir çizgi roman üstüne yemin ettin. Parola "turşu". Lütfen unut.');
      }),
      opt('rival', ['Start a rival club', 'Rakip bir kulüp kur'], (c) =>
        out(c, { hap: 3, sma: 1 }, 'Your rival club had snacks. Within a week, everyone had defected to you.', 'Senin kulübünde atıştırmalık vardı. Bir haftada herkes sana geçti.'),
      ),
      opt('leak', ['Tell everyone the password', 'Parolayı herkese söyle'], (c) =>
        out(c, { hap: 1 }, 'The password became public knowledge. A crisis meeting was held. You were not invited.', 'Parola herkesin bildiği bir şey oldu. Kriz toplantısı yapıldı. Sen çağrılmadın.'),
        { tone: 'bad' },
      ),
    ],
  },
  {
    id: 'base.yc_haunted',
    category: 'childhood',
    minAge: 8,
    maxAge: 12,
    once: true,
    title: tt('Everyone says the empty house on the corner is haunted.', 'Herkes köşedeki boş evin perili olduğunu söylüyor.'),
    text: tt('Your friends dare you to touch the front door.', 'Arkadaşların ön kapıya dokunman için iddiaya giriyor.'),
    choices: [
      opt('door', ['Touch the door', 'Kapıya dokun'], (c) =>
        out(c, { hap: 5 }, 'You touched it. Something inside meowed. Everyone ran. You are a legend now.', 'Dokundun. İçeriden bir şey miyavladı. Herkes kaçtı. Artık efsanesin.'),
        { tone: 'good' },
      ),
      opt('inside', ['Go inside', 'İçeri gir'], (c) =>
        gamble(
          c,
          0.6,
          (c) => out(c, { hap: 6, sma: 1 }, 'Inside: dust, old newspapers and a family of cats. You came out to applause.', 'İçeride toz, eski gazeteler ve bir kedi ailesi vardı. Alkışlarla çıktın.'),
          (c) => out(c, { hea: -3, hap: -2 }, 'A floorboard snapped and you scraped your leg. The ghost story got bigger, your leg got a plaster.', 'Bir döşeme tahtası kırıldı, bacağını sıyırdın. Hayalet hikâyesi büyüdü, bacağına yara bandı yapıştırıldı.'),
        ),
        { badge: 'Risky' },
      ),
      opt('no', ['Say ghosts are not real and go home', 'Hayalet diye bir şey yok de, eve git'], (c) =>
        out(c, { sma: 1, hap: -1 }, 'You were right, and you slept with the light on anyway.', 'Haklıydın. Yine de ışık açık uyudun.'),
      ),
    ],
  },
  {
    id: 'base.yc_marbles',
    category: 'childhood',
    minAge: 7,
    maxAge: 10,
    once: true,
    setup: (c) => newKid(c),
    title: (c) => c.t(`${nmc(c, 'kid')} challenges you to marbles, for keeps.`, `${nmc(c, 'kid')} seni kazanan alır usulü misket oynamaya çağırıyor.`),
    text: tt('Your best marble is the blue one with a swirl. Everyone wants it.', 'En güzel misketin içi kıvrımlı mavi olan. Herkes onu istiyor.'),
    choices: [
      opt('blue', ['Bet the blue one', 'Maviyi ortaya koy'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 6 }, `You won all of ${nmc(c, 'kid', 'gen')} marbles. Your pockets clinked all the way home.`, `${nmc(c, 'kid', 'gen')} bütün misketlerini kazandın. Eve kadar ceplerin şıngırdadı.`),
          (c) => out(c, { hap: -5 }, `${nmc(c, 'kid')} won the blue one. You still think about it.`, `Maviyi ${nmc(c, 'kid')} kazandı. Hâlâ aklına geliyor.`),
        ),
        { badge: 'Risky' },
      ),
      opt('friendly', ['Play just for fun', 'Sadece eğlencesine oyna'], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { hap: 3 }, `You played until dark. Nobody won, nobody lost, and ${nmc(c, 'kid')} became a friend.`, `Hava kararana kadar oynadınız. Kimse kazanmadı, kimse kaybetmedi; ${da(nmc(c, 'kid'))} arkadaşın oldu.`);
      }),
      opt('practise', ['Practise first, alone', 'Önce tek başına çalış'], (c) =>
        out(c, { sma: 1, hap: 1 }, 'You practised in the hallway all week. Your aim is deadly. Your mother found eleven marbles under the fridge.', 'Bütün hafta koridorda çalıştın. Nişanın artık ölümcül. Buzdolabının altından on bir misket çıktı.'),
      ),
    ],
  },
  {
    id: 'base.yc_room_swap',
    category: 'family',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: (c) => hasSibling(c) && hasParent(c),
    setup: (c) => pickSibling(c),
    title: (c) => c.t(`${nmc(c, 'sib')} wants the bigger bedroom.`, `${nmc(c, 'sib')} büyük yatak odasını istiyor.`),
    text: tt('The grown-ups say: sort it out between yourselves. A mistake.', 'Büyükler "Kendi aranızda halledin" dedi. Büyük hata.'),
    choices: [
      opt('rps', ['Rock, paper, scissors. Best of three.', 'Taş, kâğıt, makas. Üçte iki.'], (c) =>
        gamble(
          c,
          0.5,
          (c) => {
            near(c, 'sib', -2);
            return out(c, { hap: 5 }, 'You won with scissors. You moved in that evening and lay on the floor just to feel the space.', 'Makasla kazandın. O akşam taşındın ve sırf genişliği hissetmek için yere uzandın.');
          },
          (c) => out(c, { hap: -3 }, `${nmc(c, 'sib')} won with paper. Paper! You demand a rematch every year.`, `${nmc(c, 'sib')} kâğıtla kazandı. Kâğıtla! Her yıl rövanş istiyorsun.`),
        ),
      ),
      opt('give', ['Let them have it', 'Ona bırak'], (c) => {
        near(c, 'sib', 6);
        return out(c, { hap: -1 }, `${nmc(c, 'sib')} was so surprised that they let you keep the good lamp. A fair trade.`, `${nmc(c, 'sib')} öyle şaşırdı ki güzel lambayı sana bıraktı. Adil bir takas.`);
      }, { tone: 'good' }),
      opt('share', ['Suggest sharing it with a curtain in the middle', 'Ortasına perde çekip paylaşmayı öner'], (c) => {
        near(c, 'sib', 3);
        return out(c, { hap: 2, sma: 1 }, 'You shared it with a curtain down the middle. The border disputes lasted for years.', 'Ortasından perde çekip paylaştınız. Sınır anlaşmazlıkları yıllarca sürdü.');
      }),
    ],
  },
  {
    id: 'base.yc_fishing',
    category: 'family',
    minAge: 7,
    maxAge: 11,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`${Kw(c, 'par')} takes you fishing at dawn.`, `${Kw(c, 'par')} seni şafakta balığa götürüyor.`),
    text: tt('Two rods, a flask of tea, and a lot of silence.', 'İki olta, bir termos çay ve bolca sessizlik.'),
    choices: [
      opt('wait', ['Wait patiently', 'Sabırla bekle'], (c) => {
        near(c, 'par', 5);
        return gamble(
          c,
          0.5,
          (c) => out(c, { hap: 5 }, 'You caught a fish the size of your hand and talked about it for a month.', 'Avuç içi kadar bir balık tuttun ve bir ay ondan bahsettin.'),
          (c) => out(c, { hap: 3 }, 'You caught nothing, but the sun came up over the water and nobody needed to talk.', 'Hiçbir şey tutmadın ama güneş suyun üstünden doğdu ve kimsenin konuşmasına gerek kalmadı.'),
        );
      }, { tone: 'good' }),
      opt('talk', ['Talk the whole time', 'Bütün süre konuş'], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 3 }, 'You scared away every fish in the lake, but you learned how your parents met.', 'Göldeki bütün balıkları kaçırdın ama annenle babanın nasıl tanıştığını öğrendin.');
      }),
      opt('boot', ['Reel in something heavy', 'Ağır bir şey çek'], (c) =>
        out(c, { hap: 4 }, 'It was a boot. A single, ancient boot. It is on your shelf now.', 'Bir botmuş. Tek, antika bir bot. Şimdi rafında duruyor.'),
      ),
    ],
  },
  {
    id: 'base.yc_dough',
    category: 'family',
    minAge: 6,
    maxAge: 11,
    once: true,
    when: hasGrand,
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} is teaching you to make dough.`, `${Kw(c, 'gp')} sana hamur yoğurmayı öğretiyor.`),
    text: tt('"Not too much flour. Feel it with your hands."', '"Unu fazla koyma. Elinle hisset."'),
    choices: [
      opt('learn', ['Follow every instruction', 'Her talimata uy'], (c) => {
        near(c, 'gp', 6);
        return out(c, { sma: 1, hap: 4 }, 'Your bread came out lopsided and perfect. You know the secret now. You will not tell anyone.', 'Ekmeğin yamuk ve kusursuz çıktı. Artık sırrı biliyorsun. Kimseye söylemeyeceksin.');
      }, { tone: 'good' }),
      opt('flour', ['Have a flour fight', 'Un savaşı başlat'], (c) => {
        near(c, 'gp', 3);
        return out(c, { hap: 5 }, `The kitchen turned white. So did ${kw(c, 'gp')}, who laughed until ${heK(c, 'gp')} had to sit down.`, `Mutfak bembeyaz oldu, ${da(kw(c, 'gp'))}. Oturmak zorunda kalana kadar güldü.`);
      }),
      opt('shape', ['Make dough animals', 'Hamurdan hayvanlar yap'], (c) =>
        out(c, { hap: 3, sma: 1 }, 'You baked a bread turtle. Nobody had the heart to eat it.', 'Ekmekten bir kaplumbağa pişirdin. Kimse yemeye kıyamadı.'),
      ),
    ],
  },
  {
    id: 'base.yc_cinema',
    category: 'childhood',
    minAge: 9,
    maxAge: 12,
    once: true,
    when: hasFriend,
    setup: (c) => pickFriend(c),
    title: (c) => c.t(`You and ${nmc(c, 'fr')} are allowed to go to the cinema alone.`, `${nmc(c, 'fr', 'wth')} ilk kez sinemaya yalnız gidiyorsunuz.`),
    text: tt('You have money for one ticket each and one bucket of popcorn.', 'Kişi başı bir bilet ve bir kova patlamış mısırlık paranız var.'),
    choices: [
      opt('scary', ['Sneak into the scary film', 'Korku filmine sızın'], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { hap: 4 }, 'You saw the whole thing through your fingers. You did not sleep for three days. Worth it.', 'Bütün filmi parmaklarının arasından izledin. Üç gün uyuyamadın. Değdi.'),
          (c) => out(c, { hap: -1 }, 'The usher sent you to the cartoon instead. It was about a talking sock. It was quite good.', 'Görevli sizi çizgi filme yolladı. Konuşan bir çorap hakkındaydı. Fena değildi.'),
        ),
      ),
      opt('cartoon', ['Watch the cartoon', 'Çizgi filmi izle'], (c) => {
        near(c, 'fr', 3);
        return out(c, { hap: 4 }, 'You laughed so hard that popcorn came out of your nose. Your friend will never let it go.', 'Öyle güldün ki patlamış mısır burnundan çıktı. Arkadaşın bunu asla unutturmayacak.');
      }),
      opt('snacks', ['Spend everything on snacks', 'Bütün parayı atıştırmalığa ver'], (c) =>
        out(c, { hap: 2, hea: -1 }, 'You watched nothing and ate everything. You both felt sick on the bus home. A classic.', 'Hiçbir şey izlemediniz, her şeyi yediniz. Dönüş otobüsünde ikinizin de midesi bulandı. Klasik.'),
      ),
    ],
  },
  {
    id: 'base.yc_lost_dog',
    category: 'childhood',
    minAge: 7,
    maxAge: 12,
    once: true,
    title: tt('You found the dog from the LOST posters.', 'KAYIP ilanlarındaki köpeği buldun.'),
    text: tt('It is eating a sandwich behind the bakery. There is a reward.', 'Fırının arkasında sandviç yiyor. Ödül de var.'),
    choices: [
      opt('return', ['Take it home to its family', 'Ailesine götür'], (c) =>
        out(c, { hap: 6, usd: 30 }, 'The family cried. The dog licked your whole face. They gave you the reward and a slice of cake.', 'Aile ağladı. Köpek bütün yüzünü yaladı. Ödülü ve bir dilim pastayı sana verdiler.'),
        { tone: 'good' },
      ),
      opt('refuse', ['Return it but refuse the reward', 'Götür ama ödülü kabul etme'], (c) =>
        out(c, { hap: 7 }, 'You said you did not want money. The owner told the whole street. You were a hero for a month.', 'Para istemediğini söyledin. Sahibi bütün sokağa anlattı. Bir ay kahraman oldun.'),
        { tone: 'good' },
      ),
      opt('keep', ['Keep it for one more day', 'Bir gün daha yanında tut'], (c) =>
        out(c, { hap: 3 }, 'You had the best day of your life with that dog, then gave it back with a heavy heart.', 'O köpekle hayatının en güzel gününü geçirdin, sonra içini çekerek geri verdin.'),
      ),
    ],
  },
  {
    id: 'base.yc_eclipse',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    once: true,
    title: tt('There is a solar eclipse today.', 'Bugün güneş tutulması var.'),
    text: tt('The whole school is outside. The sky is getting strange.', 'Bütün okul bahçede. Gökyüzü tuhaflaşıyor.'),
    choices: [
      opt('box', ['Watch through a pinhole box', 'İğne delikli kutudan izle'], (c) =>
        out(c, { sma: 3, hap: 3 }, 'You watched a tiny sun turn into a crescent inside a cereal box. You felt like a scientist.', 'Bir mısır gevreği kutusunun içinde minik bir güneşin hilale dönüşünü izledin. Kendini bilim insanı gibi hissettin.'),
        { tone: 'good' },
      ),
      opt('look', ['Just look straight at it', 'Doğrudan bak'], (c) =>
        out(c, { hea: -3, hap: -1 }, 'You saw purple spots for a whole afternoon. The teacher said "I told you" four times.', 'Bütün öğleden sonra mor benekler gördün. Öğretmen dört kez "Ben söylemiştim" dedi.'),
        { tone: 'bad' },
      ),
      opt('birds', ['Watch the birds instead', 'Onun yerine kuşları izle'], (c) =>
        out(c, { sma: 2, hap: 2 }, 'The birds went quiet and flew home, as if it were night. You noticed what everyone else missed.', 'Kuşlar sustu ve gece olmuş gibi yuvalarına döndü. Herkesin kaçırdığını sen fark ettin.'),
      ),
    ],
  },
  {
    id: 'base.yc_birthday_money',
    category: 'money',
    minAge: 8,
    maxAge: 12,
    once: true,
    title: tt('Your relatives showered you with birthday money.', 'Akrabalar doğum gününde sana harçlık yağdırdı.'),
    text: tt('It is the most money you have ever held.', 'Elinde tuttuğun en çok para bu.'),
    choices: [
      opt('save', ['Put it in the bank', 'Bankaya yatır'], (c) =>
        out(c, { sma: 2, usd: 60 }, 'You opened your first savings account. The bank gave you a pen. You still have the pen.', 'İlk birikim hesabını açtın. Banka sana bir kalem hediye etti. Kalem hâlâ sende.'),
        { tone: 'good' },
      ),
      opt('spend', ['Spend it all in one afternoon', 'Bir öğleden sonrada hepsini harca'], (c) =>
        out(c, { hap: 6 }, 'Comics, sweets, a water pistol and a hat. By evening you had nothing left except joy.', 'Çizgi roman, şeker, su tabancası ve bir şapka. Akşam elinde neşeden başka bir şey kalmamıştı.'),
      ),
      opt('gift', ['Buy presents for your family', 'Ailene hediye al'], (c) => {
        allParents(c, 6);
        return out(c, { hap: 4 }, 'You bought everyone something small and strange. Your mum still uses the egg-shaped keyring.', 'Herkese küçük ve tuhaf bir şey aldın. Yumurta biçimli anahtarlık hâlâ kullanılıyor.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.yc_sleepwalk',
    category: 'childhood',
    minAge: 6,
    maxAge: 10,
    once: true,
    title: tt('You woke up in the kitchen holding a spoon.', 'Elinde bir kaşıkla mutfakta uyandın.'),
    text: tt('Apparently you sleepwalk. Apparently you were looking for jam.', 'Anlaşılan uyurgezersin. Anlaşılan reçel arıyordun.'),
    choices: [
      opt('jam', ['Finish the jam, since you are here', 'Madem buradasın, reçeli bitir'], (c) =>
        out(c, { hap: 3 }, 'You ate the jam and went back to bed. At breakfast, nobody could prove anything.', 'Reçeli bitirip yatağa döndün. Kahvaltıda kimse bir şey kanıtlayamadı.'),
      ),
      opt('tell', ['Tell your family in the morning', 'Sabah ailene anlat'], (c) => {
        allParents(c, 2);
        return out(c, { hap: 1 }, 'They put a bell on your bedroom door. It rang twice that month. Both times, jam.', 'Yatak odanın kapısına zil astılar. O ay iki kez çaldı. İkisinde de reçel.');
      }),
      opt('sleep', ['Go back to bed and pretend nothing happened', 'Yatağına dön, hiçbir şey olmamış gibi yap'], (c) =>
        out(c, { hap: 1 }, 'You decided it was a dream. The spoon on your pillow said otherwise.', 'Bunun bir rüya olduğuna karar verdin. Yastığındaki kaşık başka şey söylüyordu.'),
      ),
    ],
  },
  {
    id: 'base.yc_glasses',
    category: 'health',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: (c) => c.p.stats.smarts > 40 || c.p.stats.health < 70,
    title: tt('The eye doctor says you need glasses.', 'Göz doktoru gözlük takman gerektiğini söylüyor.'),
    text: tt('So THAT is what trees look like up close.', 'Demek ağaçlar yakından böyle görünüyormuş.'),
    choices: [
      opt('big', ['Pick the big round frames', 'Kocaman yuvarlak çerçeveyi seç'], (c) =>
        out(c, { sma: 2, loo: -1, hap: 2 }, 'You look like a wise owl. You decided to be one.', 'Bilge bir baykuşa benziyorsun. Öyle olmaya karar verdin.'),
      ),
      opt('cool', ['Pick the coolest frames in the shop', 'Dükkândaki en havalı çerçeveyi seç'], (c) =>
        out(c, { loo: 2, hap: 3 }, 'The new frames suited you so well that two classmates started squinting on purpose.', 'Yeni gözlük sana öyle yakıştı ki iki sınıf arkadaşın bilerek gözlerini kısmaya başladı.'),
      ),
      opt('hide', ['Refuse to wear them at school', 'Okulda takmayı reddet'], (c) =>
        out(c, { sma: -2, hap: -1 }, 'You squinted at the board for a whole term and copied the wrong homework twice.', 'Bütün dönem tahtaya gözlerini kısarak baktın ve iki kez yanlış ödevi yazdın.'),
        { tone: 'bad' },
      ),
    ],
  },
  {
    id: 'base.yc_neighbor_dog',
    category: 'childhood',
    minAge: 6,
    maxAge: 11,
    once: true,
    title: tt('The neighbour\'s dog keeps squeezing under the fence into your garden.', 'Komşunun köpeği her gün çitin altından sizin bahçeye giriyor.'),
    text: tt('It is enormous, gentle and very interested in your football.', 'Kocaman, uysal ve topuna çok meraklı.'),
    choices: [
      opt('play', ['Play with it every afternoon', 'Her öğleden sonra onunla oyna'], (c) =>
        out(c, { hap: 5, hea: 2 }, 'You and the dog became a team. The neighbour started calling it "your dog, part-time".', 'Köpekle bir takım oldunuz. Komşu ona "yarı zamanlı senin köpeğin" demeye başladı.'),
        { tone: 'good' },
      ),
      opt('return', ['Walk it back every time', 'Her seferinde geri götür'], (c) =>
        out(c, { hap: 2, usd: 10 }, 'The neighbour gave you a coin each time. You were briefly the richest child on the street.', 'Komşu her seferinde sana bozuk para verdi. Kısa bir süre sokağın en zengin çocuğu oldun.'),
      ),
      opt('fence', ['Help fix the fence', 'Çiti onarmaya yardım et'], (c) =>
        out(c, { sma: 1, hap: -1 }, 'You fixed the fence. The dog looked at you through the gap with deep betrayal.', 'Çiti onardın. Köpek aralıktan sana derin bir ihanete uğramış gibi baktı.'),
      ),
    ],
  },
  {
    id: 'base.yc_grandparent_stories',
    category: 'family',
    minAge: 8,
    maxAge: 12,
    once: true,
    when: hasGrand,
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} starts a story with "When I was your age…"`, `${Kw(c, 'gp')} söze "Ben senin yaşındayken…" diye başladı.`),
    text: tt('You know this could take two hours.', 'Bunun iki saat sürebileceğini biliyorsun.'),
    choices: [
      opt('listen', ['Listen and ask questions', 'Dinle ve soru sor'], (c) => {
        near(c, 'gp', 7);
        return out(c, { sma: 2, hap: 2 }, `You learned about the winter the river froze and the time ${heK(c, 'gp')} outran a goose. You will tell your own grandchildren.`, 'Nehrin donduğu kışı ve bir kazdan kaçtığı günü öğrendin. Sen de torunlarına anlatacaksın.');
      }, { tone: 'good' }),
      opt('record', ['Record it on a phone', 'Telefona kaydet'], (c) => {
        near(c, 'gp', 5);
        return out(c, { sma: 1, hap: 2 }, 'You recorded the whole thing. Years later, this recording will be priceless.', 'Hepsini kaydettin. Yıllar sonra bu kayıt paha biçilmez olacak.');
      }),
      opt('escape', ['Escape to the garden', 'Bahçeye kaç'], (c) => {
        near(c, 'gp', -2);
        return out(c, { hap: 1 }, `You escaped. ${Kw(c, 'gp')} told the story to the cat instead. The cat stayed.`, `Kaçtın. ${Kw(c, 'gp')} hikâyeyi kediye anlattı. Kedi sonuna kadar dinledi.`);
      }),
    ],
  },
  {
    id: 'base.yc_shop_errand',
    category: 'childhood',
    minAge: 7,
    maxAge: 10,
    once: true,
    when: hasParent,
    setup: (c) => pickParent(c),
    title: (c) => c.t(`${Kw(c, 'par')} sends you to the shop alone for the first time.`, `${Kw(c, 'par')} seni ilk kez tek başına markete yolluyor.`),
    text: tt('Bread, milk, and "nothing else". There will be change.', 'Ekmek, süt ve "başka hiçbir şey". Para üstü de olacak.'),
    choices: [
      opt('exact', ['Buy exactly the list', 'Tam olarak listedekileri al'], (c) => {
        near(c, 'par', 4);
        return out(c, { sma: 1, hap: 2 }, 'You came back with everything and the right change. You were promoted to "the reliable one".', 'Her şeyle ve doğru para üstüyle döndün. "Güvenilir olan" rütbesine terfi ettin.');
      }, { tone: 'good' }),
      opt('treat', ['Spend the change on sweets', 'Para üstüne şeker al'], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 4 }, 'You said the bread had gone up. The chocolate on your chin said otherwise.', 'Ekmeğe zam geldiğini söyledin. Çenendeki çikolata başka şey söylüyordu.');
      }),
      opt('forget', ['Forget what you came for', 'Ne için geldiğini unut'], (c) =>
        out(c, { hap: 1 }, 'You came back with a lemon, a pencil and no idea why.', 'Bir limon, bir kurşun kalem ve hiçbir fikirle döndün.'),
      ),
    ],
  },
  {
    id: 'base.yc_swing',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    title: tt('You are on the swing. Higher. Higher.', 'Salıncaktasın. Daha yükseğe. Daha yükseğe.'),
    text: tt('You could jump off at the top. People have done it. Legends say.', 'En tepede atlayabilirsin. Yapanlar varmış. Efsaneler öyle diyor.'),
    choices: [
      opt('jump', ['Jump!', 'Atla!'], (c) =>
        gamble(
          c,
          0.65,
          (c) => out(c, { hap: 6 }, 'You flew. You landed. Three children saw it. Your name will be spoken in this playground forever.', 'Uçtun. Kondun. Üç çocuk gördü. Adın bu parkta sonsuza kadar anılacak.'),
          (c) => out(c, { hea: -4, hap: 1 }, 'You flew. You landed on your face. Three children saw it. Still legendary, just differently.', 'Uçtun. Yüzüstü kondun. Üç çocuk gördü. Yine efsanesin, sadece başka türlü.'),
        ),
        { badge: 'Risky' },
      ),
      opt('higher', ['Just go higher', 'Sadece daha yükseğe çık'], (c) =>
        out(c, { hap: 4 }, 'You swung so high the chains went slack for a second. Your stomach is still up there.', 'Öyle yükseğe çıktın ki zincirler bir an gevşedi. Miden hâlâ orada.'),
      ),
      opt('push', ['Get off and push a smaller kid', 'İnip küçük bir çocuğu salla'], (c) =>
        out(c, { hap: 3 }, 'You pushed a tiny stranger for twenty minutes. Their mother thanked you like you had saved a life.', 'Minicik bir yabancıyı yirmi dakika salladın. Annesi hayat kurtarmışsın gibi teşekkür etti.'),
        { tone: 'good' },
      ),
    ],
  },
  {
    id: 'base.yc_wobbly_tooth',
    category: 'childhood',
    minAge: 6,
    maxAge: 8,
    once: true,
    when: hasSibling,
    setup: (c) => pickSibling(c),
    title: (c) => c.t(`${nmc(c, 'sib')} has a plan for your wobbly tooth: a string and a door.`, `${nmc(c, 'sib')} sallanan dişin için bir plan yaptı: bir ip ve bir kapı.`),
    text: tt('The string is already tied.', 'İp çoktan bağlandı.'),
    choices: [
      opt('door', ['Let them slam the door', 'Kapıyı çarpsın'], (c) => {
        near(c, 'sib', 3);
        return out(c, { hap: 3 }, 'Slam. The tooth flew across the hall. You both screamed, then cheered.', 'Güm! Diş koridorun öbür ucuna uçtu. İkiniz de önce çığlık attınız, sonra sevindiniz.');
      }),
      opt('apple', ['Bite an apple instead', 'Onun yerine bir elma ısır'], (c) =>
        out(c, { hap: 2 }, 'The tooth came out in the apple. You kept both, for science.', 'Diş elmada kaldı. Bilim adına ikisini de sakladın.'),
      ),
      opt('run', ['Run away with the string still tied', 'İp bağlıyken kaç'], (c) => {
        near(c, 'sib', 1);
        return out(c, { hap: 1 }, `You ran. ${nmc(c, 'sib')} held on. The tooth stayed in. The string went missing. Nobody won.`, `Kaçtın. ${nmc(c, 'sib')} ipi bırakmadı. Diş yerinde kaldı, ip kayboldu. Kazanan olmadı.`);
      }),
    ],
  },
];

