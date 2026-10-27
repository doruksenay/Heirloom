import type { Ctx, EventDef } from '../types';
import { dat, wage, wth } from './util';
import { inTr } from './events-flavour';
import { ensureGrandkids, gkAge, grandkids, type Grandkid } from './events-elder';
import { T, ch, num, nmv, noMourn, all, afford, partnered, setPartner, married, kidsAged } from './adult-kit';

// Round 4, ages 60+: old age, grandchildren and the end of life, told warmly and without hurry.

// ------------------------------------------------ grandchildren (names come from events-elder.ts)

const gkAlive = (c: Ctx, g: Grandkid) => !g.id || c.s.people[g.id]?.deathYear === undefined;
const hasGk = (lo: number, hi: number) => (c: Ctx) => grandkids(c).some((g) => gkAlive(c, g) && gkAge(c, g) >= lo && gkAge(c, g) <= hi);
/** Picks a grandchild aged lo..hi into vars.gk (index into the saved list). One rng call. */
function pickGk(c: Ctx, lo: number, hi: number) {
  const all = ensureGrandkids(c);
  const idx = all.map((g, i) => [g, i] as const).filter(([g]) => gkAlive(c, g) && gkAge(c, g) >= lo && gkAge(c, g) <= hi);
  c.vars.gk = idx.length ? idx[c.rng.int(0, idx.length - 1)][1] : 0;
}
const gk = (c: Ctx): Grandkid => ensureGrandkids(c)[num(c, 'gk')] ?? { n: '', g: 'female', by: c.s.year, p: '' };
const gkn = (c: Ctx) => gk(c).n;
const gkWord = (c: Ctx) => (gk(c).g === 'female' ? 'granddaughter' : 'grandson');
/** Closeness to the grandchild's parent (your child), the person the engine tracks. */
const gkParent = (c: Ctx, d: number) => {
  const p = gk(c).p;
  if (p) c.h.closeness(p, d);
};

const old = (lo: number, hi?: number) => ({ minAge: lo, maxAge: hi });

export const elderMoreEvents: EventDef[] = [
  {
    id: 'base.ad_old_licence',
    category: 'family',
    ...old(76),
    once: true,
    weight: 6,
    when: (c) => kidsAged(c, 30, 80).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 30, 80)).person.id;
    },
    title: (c) => c.t(`${nmv(c)} thinks it is time you stopped driving.`, `${nmv(c)} artık araba kullanmayı bırakman gerektiğini düşünüyor.`),
    text: T('There was a small incident with a bollard. The bollard is fine. Mostly.', 'Bir babayla küçük bir olay yaşandı. Babanın bir şeyi yok. Neredeyse.'),
    choices: [
      ch('keys', 'Hand over the keys', 'Anahtarları teslim et', (c) => {
        c.h.closeness(String(c.vars.pid), 6);
        c.h.stat('happiness', -3);
        return c.t(`You handed over the keys with great ceremony. ${nmv(c)} now drives you everywhere and you criticise every turn. It is a new hobby.`, `Anahtarları büyük bir törenle teslim ettin. Artık seni her yere ${nmv(c)} götürüyor ve sen her dönemeci eleştiriyorsun. Yeni bir hobi.`);
      }, { tone: 'good' }),
      ch('test', 'Agree to a driving test', 'Sürüş testine girmeyi kabul et', (c) => {
        if (c.p.stats.health >= 55 && c.rng.chance(0.6)) {
          c.h.stat('happiness', 4);
          return c.t('You passed, with a comment about "very careful parking". You drive only in daylight now, by choice.', '"Çok dikkatli park" notuyla geçtin. Artık sadece gündüz kullanıyorsun; kendi tercihin.');
        }
        c.h.stat('happiness', -4);
        return c.t('You did not pass. The examiner was kind about it. You were not kind about the examiner.', 'Geçemedin. Sınav görevlisi bu konuda nazikti. Sen görevli hakkında nazik değildin.');
      }, { badge: 'Risky' }),
      ch('refuse', 'Refuse', 'Reddet', (c) => {
        c.h.closeness(String(c.vars.pid), -6);
        if (c.rng.chance(0.25)) {
          c.h.stat('health', -6);
          c.h.money(-wage(c, 1500));
          return c.t('You kept driving, until the day you misjudged a junction. Nobody was badly hurt. You gave up the keys that week.', 'Bir kavşağı yanlış hesapladığın güne kadar kullanmaya devam ettin. Kimse ağır yaralanmadı. O hafta anahtarları bıraktın.');
        }
        return c.t('You kept driving, slowly, in the right-hand lane, with your hazard lights on "just in case".', 'Kullanmaya devam ettin; yavaşça, sağ şeritte, "ne olur ne olmaz" diye dörtlüleri yakarak.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_old_care_home',
    category: 'family',
    ...old(80),
    once: true,
    weight: 6,
    when: (c) => !partnered(c) && c.p.stats.health < 55,
    setup: (c) => {
      c.vars.pid = c.h.relatives('child')[0]?.person.id ?? '';
    },
    title: T('Living alone is getting harder. The family is talking about what comes next.', 'Yalnız yaşamak zorlaşıyor. Aile bundan sonrasını konuşuyor.'),
    text: T('The stairs are steeper than they used to be. So is everything.', 'Merdivenler eskisinden dik. Her şey öyle.'),
    choices: [
      ch('child', 'Move in with one of your children', 'Çocuklarından birinin yanına taşın', (c) => {
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 4));
        c.h.stat('happiness', 3);
        return c.t('You took the small room at the back. You tell the grandchildren stories at bedtime and supervise the cooking from a chair.', 'Arka taraftaki küçük odayı aldın. Yatmadan önce torunlara hikâye anlatıyor, yemekleri bir sandalyeden denetliyorsun.');
      }, { tone: 'good', requires: (c) => c.h.relatives('child').length > 0, requiresLabel: 'No opening' }),
      ch('home', 'Move to a good care home', 'İyi bir bakımevine taşın', (c) => {
        c.h.money(-wage(c, 6000));
        c.h.stat('health', 4);
        return c.t('A bright room, a garden, three meals and a quiz on Thursdays. You won the quiz in your second week and made an enemy.', 'Aydınlık bir oda, bir bahçe, üç öğün ve perşembeleri bilgi yarışması. İkinci haftanda yarışmayı kazandın ve bir düşman edindin.');
      }),
      ch('stay', 'Stay put, with a carer who visits', 'Evinde kal, bakıcı gelsin', (c) => {
        c.h.money(-wage(c, 3500));
        c.h.stat('happiness', 2);
        return c.t('A carer comes every morning. She is cheerful, firm and has opinions about your fridge. You would not swap her for anything.', 'Her sabah bir bakıcı geliyor. Neşeli, kararlı ve buzdolabın hakkında fikirleri var. Onu hiçbir şeye değişmezsin.');
      }),
    ],
  },
  {
    id: 'base.ad_old_gk_video',
    category: 'family',
    ...old(62),
    once: true,
    weight: 6,
    when: all(noMourn, hasGk(12, 19)),
    setup: (c) => pickGk(c, 12, 19),
    title: (c) => c.t(`Your ${gkWord(c)} ${gkn(c)} wants to film you for a video.`, `Torunun ${gkn(c)} seni bir video için çekmek istiyor.`),
    text: T('The concept: you react to modern things. You are not sure what "react" means.', 'Konsept: modern şeylere tepki veriyorsun. "Tepki vermek"in ne demek olduğundan emin değilsin.'),
    choices: [
      ch('yes', 'Do it, with total sincerity', 'Yap, tam bir içtenlikle', (c) => {
        c.h.stat('happiness', 5);
        gkParent(c, 3);
        return c.t(`You reviewed a dance trend with great seriousness. The video was watched by half a million people. ${gkn(c)} is now treating you like a celebrity.`, `Bir dans akımını büyük bir ciddiyetle değerlendirdin. Video yarım milyon kez izlendi. ${gkn(c)} artık sana ünlüymüşsün gibi davranıyor.`);
      }, { tone: 'good' }),
      ch('story', 'Tell an old story instead', 'Onun yerine eski bir hikâye anlat', (c) => {
        c.h.stat('happiness', 3);
        return c.t(`You told the story of the winter it snowed for a month. ${gkn(c)} forgot to film it and just listened.`, `Bir ay boyunca kar yağan o kışın hikâyesini anlattın. ${gkn(c)} çekmeyi unuttu, sadece dinledi.`);
      }),
      ch('no', 'Refuse to be "content"', '"İçerik" olmayı reddet', (c) => c.t('You refused to be content. This was filmed and became content.', '"İçerik" olmayı reddettin. Bu da çekildi ve içerik oldu.')),
    ],
  },
  {
    id: 'base.ad_old_gk_secret',
    category: 'family',
    ...old(60),
    once: true,
    weight: 6,
    when: hasGk(13, 19),
    setup: (c) => pickGk(c, 13, 19),
    title: (c) => c.t(`${gkn(c)} tells you a secret: they are in love, and their parents must not know yet.`, `${gkn(c)} sana bir sır veriyor: âşık olmuş ve annesiyle babasının henüz bilmemesi lazım.`),
    text: T('You remember being that age. You remember who you told.', 'O yaşta olmayı hatırlıyorsun. Kime anlattığını da.'),
    choices: [
      ch('keep', 'Keep the secret, and give advice', 'Sırrı sakla ve öğüt ver', (c) => {
        c.h.stat('happiness', 4);
        return c.t(`You kept it, and gave the only advice you are sure of: be kind, even at the end. ${gkn(c)} hugged you for a very long time.`, `Sakladın ve emin olduğun tek öğüdü verdin: sonunda bile nazik ol. ${gkn(c)} sana çok uzun süre sarıldı.`);
      }, { tone: 'good' }),
      ch('tell', 'Gently tell the parents', 'Usulca anne babasına söyle', (c) => {
        gkParent(c, 3);
        c.h.stat('happiness', -2);
        return c.t(`You told the parents gently. ${gkn(c)} felt betrayed for a while and then, years later, understood.`, `Anne babasına usulca söyledin. ${gkn(c)} bir süre ihanete uğramış hissetti; yıllar sonra da anladı.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_gk_car',
    category: 'family',
    ...old(62),
    once: true,
    weight: 5,
    when: hasGk(18, 26),
    setup: (c) => {
      pickGk(c, 18, 26);
      c.vars.amt = wage(c, 3000);
    },
    title: (c) => c.t(`${gkn(c)} needs a car for a new job and cannot afford one.`, `${gkn(c)} yeni işi için arabaya ihtiyaç duyuyor ama alacak parası yok.`),
    text: (c) => c.t(`A sensible second-hand one costs ${c.h.fmt(num(c))}.`, `Makul bir ikinci el ${c.h.fmt(num(c))}.`),
    choices: [
      ch('buy', 'Buy it for them', 'Sen al', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 5);
        gkParent(c, 4);
        return c.t(`You bought a small, sensible car. ${gkn(c)} drove you to the sea in it the first weekend.`, `Küçük, makul bir araba aldın. ${gkn(c)} ilk hafta sonu seni onunla denize götürdü.`);
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('yours', 'Give them your old car', 'Eski arabanı ver', (c) => {
        c.h.stat('happiness', 3);
        return c.t(`You gave them your old car, with its smell and its rattle and a cassette stuck in the player. ${gkn(c)} would not change a thing.`, `Kokusu, takırtısı ve teybinde sıkışmış bir kasetiyle eski arabanı verdin. ${gkn(c)} hiçbir şeyini değiştirmedi.`);
      }),
      ch('half', 'Pay half', 'Yarısını öde', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        c.h.stat('happiness', 2);
        return c.t(`You paid half. ${gkn(c)} paid the rest from tips and calls it "our car".`, `Yarısını ödedin. Kalanını ${gkn(c)} bahşişlerinden ödedi ve ona "bizim araba" diyor.`);
      }, { requires: (c) => afford(c, Math.round(num(c) / 2)), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    id: 'base.ad_old_gk_sleepover',
    category: 'family',
    ...old(60),
    once: true,
    weight: 6,
    when: all(noMourn, hasGk(4, 10)),
    setup: (c) => pickGk(c, 4, 10),
    title: (c) => c.t(`${gkn(c)} is sleeping over, and wants a ghost story.`, `${gkn(c)} gece sende kalıyor ve bir hayalet hikâyesi istiyor.`),
    text: T('"A real one. Not a baby one."', '"Gerçek bir tane. Bebek hikâyesi değil."'),
    choices: [
      ch('scary', 'Tell a properly scary one', 'Gerçekten korkunç bir tane anlat', (c) => {
        c.h.stat('happiness', 3);
        return c.t(`It was so scary that ${gkn(c)} slept in your bed, and so did you, with the light on.`, `O kadar korkunçtu ki ${gkn(c)} senin yatağında uyudu; sen de ışığı açık bırakıp öyle uyudun.`);
      }),
      ch('family', 'Tell a family story instead', 'Onun yerine bir aile hikâyesi anlat', (c) => {
        c.h.stat('happiness', 4);
        gkParent(c, 2);
        return c.t(`You told the story of how you met your first love. ${gkn(c)} said it was scarier than a ghost.`, `İlk aşkınla nasıl tanıştığını anlattın. ${gkn(c)} bunun hayaletten daha korkunç olduğunu söyledi.`);
      }, { tone: 'good' }),
      ch('pancakes', 'Promise pancakes instead', 'Onun yerine krep sözü ver', (c) => {
        c.h.stat('happiness', 2);
        return c.t('No ghosts, only the promise of pancakes. At six in the morning, the promise was collected.', 'Hayalet yok, sadece krep sözü. Sabahın altısında söz tahsil edildi.');
      }),
    ],
  },
  {
    id: 'base.ad_old_gk_graduation',
    category: 'family',
    ...old(66),
    once: true,
    weight: 6,
    when: hasGk(21, 25),
    setup: (c) => pickGk(c, 21, 25),
    title: (c) => c.t(`${gkn(c)} is graduating from university and has saved you a front-row seat.`, `${gkn(c)} üniversiteden mezun oluyor ve sana ön sırada bir yer ayırmış.`),
    text: T('The hall has a lot of stairs. You are going anyway.', 'Salonda bir sürü merdiven var. Yine de gidiyorsun.'),
    choices: [
      ch('go', 'Go, in your best clothes', 'En güzel kıyafetlerinle git', (c) => {
        c.h.stat('happiness', 6);
        gkParent(c, 4);
        return c.t(`When ${gkn(c)}'s name was called, you stood up and clapped alone for a moment. Then the whole row joined in.`, `${gkn(c)} adı okunduğunda ayağa kalkıp bir an tek başına alkışladın. Sonra bütün sıra sana katıldı.`);
      }, { tone: 'good' }),
      ch('gift', 'Send a gift and a letter', 'Bir hediye ve mektup gönder', (c) => {
        c.h.money(-wage(c, 200));
        c.h.stat('happiness', 3);
        return c.t(`You sent a fountain pen and a letter about what you were doing at that age. ${gkn(c)} framed the letter.`, `Bir dolma kalem ve o yaşta neler yaptığını anlatan bir mektup gönderdin. ${gkn(c)} mektubu çerçeveletti.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_funeral_plan',
    category: 'family',
    ...old(72),
    once: true,
    weight: 5,
    title: T('You decide to plan your own funeral, so nobody else has to.', 'Kimse uğraşmasın diye kendi cenazeni planlamaya karar verdin.'),
    text: T('It is strangely cheerful work. You have strong views on the music.', 'Tuhaf bir şekilde neşeli bir iş. Müzik konusunda kesin fikirlerin var.'),
    choices: [
      ch('party', 'Ask for a party, not a sad day', 'Hüzünlü bir gün değil, bir parti iste', (c) => {
        c.h.stat('happiness', 4);
        return c.t('You wrote "no black, good food, and someone must tell the story about the boat". You sealed it with a smile.', '"Siyah yok, güzel yemek var ve biri mutlaka tekne hikâyesini anlatsın" yazdın. Gülümseyerek mühürledin.');
      }, { tone: 'good' }),
      ch('simple', 'Keep it simple and paid for', 'Basit tut ve parasını öde', (c) => {
        c.h.money(-wage(c, 2000));
        c.h.stat('happiness', 2);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 2));
        return c.t('Simple, paid for and written down. Your children will never have to guess. That is the gift.', 'Basit, parası ödenmiş ve yazıya geçirilmiş. Çocukların asla tahmin etmek zorunda kalmayacak. Hediye bu.');
      }),
      ch('later', 'Put it off', 'Ertele', (c) => c.t('You got as far as choosing the first song, then went to make tea. It can wait. Probably.', 'İlk şarkıyı seçmeye kadar geldin, sonra çay demlemeye gittin. Bekleyebilir. Muhtemelen.')),
    ],
  },
  {
    id: 'base.ad_old_last_trip',
    category: 'random',
    ...old(74, 95),
    once: true,
    weight: 5,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 1200);
    },
    title: (c) =>
      inTr(c)
        ? c.t('You want to see the village where you were born one more time.', 'Doğduğun köyü bir kez daha görmek istiyorsun.')
        : c.t('You want to see the sea where you spent childhood summers one more time.', 'Çocukluk yazlarını geçirdiğin denizi bir kez daha görmek istiyorsun.'),
    text: T('It is a long way. It has been a long time.', 'Uzun bir yol. Uzun zaman oldu.'),
    choices: [
      ch('go', 'Go, with family', 'Aileyle git', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 7);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 4));
        return c.t('Everything was smaller and exactly the same. You showed them the tree you fell out of, the wall you climbed, the spot where you were happiest. They listened to all of it.', 'Her şey daha küçüktü ve tamamen aynıydı. Onlara düştüğün ağacı, tırmandığın duvarı, en mutlu olduğun yeri gösterdin. Hepsini dinlediler.');
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('photos', 'Ask someone to send photos', 'Birinden fotoğraf göndermesini iste', (c) => {
        c.h.stat('happiness', 3);
        return c.t('A cousin sent forty photos. You looked at each one for a long time, and could smell it.', 'Bir kuzen kırk fotoğraf gönderdi. Her birine uzun uzun baktın ve kokusunu duyabildin.');
      }),
    ],
  },
  {
    id: 'base.ad_old_wishes',
    category: 'health',
    ...old(70),
    once: true,
    weight: 5,
    title: T('Your doctor gently asks if you have thought about your wishes for the end.', 'Doktorun nazikçe, son günlerinle ilgili isteklerini düşünüp düşünmediğini soruyor.'),
    text: T('Not now. Just someday. It is good to have it written down.', 'Şimdi değil. Sadece bir gün. Yazılı olması iyi olur.'),
    choices: [
      ch('write', 'Write it down, clearly', 'Açıkça yaz', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You wrote it down: what you want, what you do not, and who decides. You felt lighter afterwards, not heavier.', 'Yazdın: ne istediğini, ne istemediğini ve kimin karar vereceğini. Sonrasında kendini ağır değil, hafif hissettin.');
      }, { tone: 'good' }),
      ch('talk', 'Talk it through with the family', 'Aileyle konuş', (c) => {
        c.h.relatives(['child', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, 5));
        return c.t('A long, honest Sunday conversation. Somebody cried, somebody made a joke, and everybody knows now.', 'Uzun, dürüst bir pazar sohbeti. Biri ağladı, biri espri yaptı ve artık herkes biliyor.');
      }, { tone: 'good' }),
      ch('not', 'Not yet', 'Henüz değil', (c) => c.t('Not yet, you said. The doctor nodded. The form stays in your drawer, under the good scissors.', '"Henüz değil" dedin. Doktor başını salladı. Form çekmecende, iyi makasın altında duruyor.')),
    ],
  },
  {
    id: 'base.ad_old_friend_funeral',
    category: 'family',
    ...old(68),
    once: true,
    weight: 6,
    when: (c) => c.h.relatives('friend').some((f) => c.h.ageOf(f.person) >= 60),
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend').filter((f) => c.h.ageOf(f.person) >= 60)).person.id;
      c.vars.fr = c.h.newPerson({ age: c.age + c.rng.int(-3, 3) }).id;
    },
    title: (c) => c.t(`${nmv(c, 'fr')}, a friend from your youth, has died. The family asks you to speak.`, `Gençlik arkadaşın ${nmv(c, 'fr')} vefat etti. Ailesi senden bir konuşma yapmanı istiyor.`),
    text: T('You have known them for sixty years. You have three minutes.', 'Onu altmış yıldır tanıyordun. Üç dakikan var.'),
    choices: [
      ch('funny', 'Tell the funniest story', 'En komik hikâyeyi anlat', (c) => {
        c.h.stat('happiness', 2);
        c.h.closeness(String(c.vars.pid), 5);
        return c.t(`You told the story of the stolen goat. The whole room laughed, then cried. It was exactly right.`, `Çalınan keçinin hikâyesini anlattın. Bütün salon önce güldü, sonra ağladı. Tam olması gerektiği gibiydi.`);
      }, { tone: 'good' }),
      ch('letter', 'Read a letter you wrote to them', 'Ona yazdığın bir mektubu oku', (c) => {
        c.h.stat('happiness', 1);
        return c.t('You read a letter you had never sent. Your voice shook on the last line. Nobody minded.', 'Hiç göndermediğin bir mektubu okudun. Son satırda sesin titredi. Kimse aldırmadı.');
      }),
      ch('call', 'Afterwards, call every old friend left', 'Ardından hayatta kalan bütün eski dostlarını ara', (c) => {
        c.h.relatives('friend').forEach((f) => c.h.closeness(f.person.id, 6));
        c.h.stat('happiness', 3);
        return c.t(`You went home and called everyone left from those days. ${nmv(c)} talked to you for two hours. You made plans.`, `Eve dönüp o günlerden kalan herkesi aradın. ${nmv(c)} seninle iki saat konuştu. Planlar yaptınız.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_skydive',
    category: 'random',
    ...old(65, 85),
    once: true,
    weight: 4,
    when: (c) => noMourn(c) && c.p.stats.health >= 60,
    setup: (c) => {
      c.vars.amt = wage(c, 400);
    },
    title: T('For your birthday, you want to jump out of a plane.', 'Doğum günün için bir uçaktan atlamak istiyorsun.'),
    text: T('Your children have formed a committee to stop you.', 'Çocukların seni durdurmak için bir komite kurdu.'),
    choices: [
      ch('jump', 'Jump', 'Atla', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 8);
        return c.t('Strapped to a calm young man named Ozzy, you fell for a minute and floated for five. You screamed the whole way. Joy, mostly.', 'Ozzy adında sakin bir gence bağlı olarak bir dakika düştün, beş dakika süzüldün. Bütün yol boyunca bağırdın. Çoğunlukla sevinçten.');
      }, { tone: 'good', badge: 'Risky' }),
      ch('wind', 'Do the indoor wind tunnel instead', 'Onun yerine kapalı rüzgâr tünelini dene', (c) => {
        c.h.money(-Math.round(num(c) / 2));
        c.h.stat('happiness', 4);
        return c.t('You flew in a wind tunnel, cheeks flapping. The committee watched through the glass and cheered.', 'Rüzgâr tünelinde, yanakların dalgalanarak uçtun. Komite camın arkasından izledi ve alkışladı.');
      }),
      ch('committee', 'Let the committee win', 'Komitenin kazanmasına izin ver', (c) => c.t('The committee won. They took you for cake instead. You mention the plane at every family dinner.', 'Komite kazandı. Onun yerine seni pastaya götürdüler. Her aile yemeğinde uçağı hatırlatıyorsun.')),
    ],
  },
  {
    id: 'base.ad_old_90',
    category: 'milestone',
    ...old(90, 90),
    once: true,
    weight: 40,
    title: T('You are ninety.', 'Doksan yaşındasın.'),
    text: T('The family has planned a surprise party. You heard about it in March.', 'Aile sürpriz bir parti planladı. Martta duydun.'),
    choices: [
      ch('surprised', 'Act very surprised', 'Çok şaşırmış gibi yap', (c) => {
        c.h.stat('happiness', 6);
        c.h.relatives(['child', 'sibling']).forEach((k) => c.h.closeness(k.person.id, 4));
        return c.t('You acted so surprised that a great-grandchild burst into tears of joy. Ninety candles were not attempted. Nine were.', 'O kadar şaşırmış gibi yaptın ki bir torun çocuğu sevinçten ağlamaya başladı. Doksan mum denenmedi. Dokuz tane yakıldı.');
      }, { tone: 'good' }),
      ch('speech', 'Give a speech', 'Bir konuşma yap', (c) => {
        c.h.stat('happiness', 5);
        return c.t('"I have no regrets. Well, two." You told them both. It was the best speech anyone in the family has heard.', '"Hiçbir pişmanlığım yok. Yani iki tane var." İkisini de anlattın. Ailede kimsenin duymadığı kadar güzel bir konuşmaydı.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_old_100',
    category: 'milestone',
    ...old(100, 100),
    once: true,
    weight: 60,
    title: T('You are one hundred years old.', 'Yüz yaşındasın.'),
    text: (c) =>
      inTr(c)
        ? c.t('The mayor came with flowers and a photographer. The local news wants your secret.', 'Belediye başkanı çiçek ve bir fotoğrafçıyla geldi. Yerel haberler sırrını öğrenmek istiyor.')
        : c.t('A letter of congratulations came from the head of state. The local news wants your secret.', 'Devlet başkanından bir tebrik mektubu geldi. Yerel haberler sırrını öğrenmek istiyor.'),
    choices: [
      ch('honest', '"Walking, and not worrying"', '"Yürümek ve dert etmemek"', (c) => {
        c.h.stat('happiness', 6);
        return c.t('"Walk every day and do not worry about things you cannot fix." The clip was shared across the country.', '"Her gün yürüyün ve düzeltemeyeceğiniz şeyleri dert etmeyin." Video bütün ülkede paylaşıldı.');
      }, { tone: 'good' }),
      ch('joke', 'Make something up', 'Bir şey uydur', (c) => {
        c.h.stat('happiness', 6);
        return c.t('You told them your secret was a spoon of honey and a nap at four. Honey sales in the town went up.', 'Sırrının bir kaşık bal ve saat dörtte bir şekerleme olduğunu söyledin. Kasabada bal satışları arttı.');
      }),
    ],
  },
  {
    id: 'base.ad_old_stove',
    category: 'health',
    ...old(76),
    once: true,
    weight: 5,
    when: (c) => c.h.relatives('child').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('child')).person.id;
    },
    title: T('You left the stove on again. The neighbour smelled smoke.', 'Ocağı yine açık unuttun. Komşu duman kokusu almış.'),
    text: (c) => c.t(`${nmv(c)} wants you to see a doctor about your memory.`, `${nmv(c)} hafızan için bir doktora görünmeni istiyor.`),
    choices: [
      ch('doctor', 'Go, and take the tests', 'Git ve testleri yaptır', (c) => {
        c.h.closeness(String(c.vars.pid), 6);
        c.h.stat('health', 2);
        return c.t('The tests were careful and kind. Some forgetting, nothing worse yet. A timer on the stove and a notebook by the door.', 'Testler titiz ve nazikti. Biraz unutkanlık, henüz daha kötüsü yok. Ocağa bir zamanlayıcı, kapının yanına bir defter.');
      }, { tone: 'good' }),
      ch('tricks', 'Fit an automatic shut-off', 'Otomatik kapanan ocak taktır', (c) => {
        c.h.money(-wage(c, 250));
        return c.t('The stove turns itself off now. You resent it, and you are glad of it, in equal measure.', 'Ocak artık kendi kendine kapanıyor. Ona hem kızıyor hem de şükrediyorsun; eşit ölçüde.');
      }),
      ch('deny', 'Insist it was a one-off', 'Bir kerelik olduğunda ısrar et', (c) => {
        c.h.closeness(String(c.vars.pid), -5);
        return c.t(`You insisted. ${nmv(c)} started calling every evening at six "just to chat". You know why.`, `Israr ettin. ${nmv(c)} her akşam altıda "sadece sohbet için" aramaya başladı. Nedenini biliyorsun.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_student',
    category: 'random',
    ...old(70),
    once: true,
    weight: 5,
    when: noMourn,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(19, 23) }).id;
    },
    title: (c) => c.t(`${nmv(c)}, a student who just moved in downstairs, offers to carry your shopping.`, `Alt kata yeni taşınan öğrenci ${nmv(c)} alışverişini taşımayı teklif ediyor.`),
    text: T('They are polite, hungry-looking and studying something you do not understand.', 'Kibar, aç görünümlü ve senin anlamadığın bir şey okuyor.'),
    choices: [
      ch('feed', 'Accept, and feed them', 'Kabul et ve doyur', (c) => {
        c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', 60);
        c.h.stat('happiness', 5);
        return c.t(`Shopping on Saturdays, dinner on Sundays. ${nmv(c)} fixed your phone, and you taught them to cook three things properly. Friends.`, `Cumartesileri alışveriş, pazarları akşam yemeği. ${nmv(c)} telefonunu düzeltti; sen de ona üç yemeği doğru düzgün pişirmeyi öğrettin. Artık arkadaşsınız.`);
      }, { tone: 'good' }),
      ch('teach', 'Teach them something in return', 'Karşılığında bir şey öğret', (c) => {
        c.h.stat('happiness', 3);
        c.h.stat('smarts', 1);
        return c.t(`You taught ${nmv(c)} chess. They taught you what a meme is. Neither of you fully understands the other's thing.`, `${dat(nmv(c))} satranç öğrettin. O da sana caps'in ne olduğunu öğretti. İkiniz de diğerininkini tam anlamadınız.`);
      }),
      ch('no', 'Say you can manage', 'Kendin halledebileceğini söyle', (c) => {
        c.h.stat('health', 1);
        return c.t('You said you could manage, and did, slowly, stopping on every landing. Pride is good exercise.', 'Halledebileceğini söyledin ve hallettin; yavaşça, her sahanlıkta durarak. Gurur iyi bir egzersizdir.');
      }),
    ],
  },
  {
    id: 'base.ad_old_sibling_call',
    category: 'family',
    ...old(65),
    once: true,
    weight: 6,
    when: (c) => c.h.relatives('sibling').some((r) => r.rel.closeness < 45),
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('sibling').filter((r) => r.rel.closeness < 45)).person.id;
    },
    title: (c) => c.t(`${nmv(c)}, the sibling you have barely spoken to in years, calls out of the blue.`, `Yıllardır neredeyse hiç konuşmadığın kardeşin ${nmv(c)} birden arıyor.`),
    text: T('"I don\'t remember what we fell out about. Do you?"', '"Neden küstüğümüzü hatırlamıyorum. Sen hatırlıyor musun?"'),
    choices: [
      ch('laugh', 'Admit you do not either', 'Senin de hatırlamadığını itiraf et', (c) => {
        c.h.closeness(String(c.vars.pid), 25);
        c.h.stat('happiness', 6);
        return c.t(`You both laughed until you coughed. You talk every Sunday now. You are making up for lost years, fast.`, `İkiniz de öksürene kadar güldünüz. Artık her pazar konuşuyorsunuz. Kaybedilen yılları hızla telafi ediyorsunuz.`);
      }, { tone: 'good' }),
      ch('remember', 'Say you remember exactly', 'Tam olarak hatırladığını söyle', (c) => {
        c.h.closeness(String(c.vars.pid), 5);
        return c.t(`You remembered exactly, and said so. It took an hour, an apology from each of you and a lot of silence. It was worth it.`, `Tam olarak hatırlıyordun ve söyledin. Bir saat, ikinizden de birer özür ve bolca sessizlik aldı. Değdi.`);
      }),
      ch('cold', 'Keep it short', 'Kısa kes', (c) => {
        c.h.closeness(String(c.vars.pid), 2);
        return c.t(`You kept it short and polite. After you hung up, you held the phone for a long time.`, `Kısa ve kibar tuttun. Telefonu kapattıktan sonra uzun süre elinde tuttun.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_dance',
    category: 'random',
    ...old(65, 90),
    once: true,
    weight: 5,
    when: noMourn,
    title: T('The community centre has started a dance afternoon for over-sixty-fives.', 'Semt merkezi altmış beş yaş üstü için bir dans öğleden sonrası başlattı.'),
    text: T('There are four men and thirty women, and one of the men is very popular.', 'Dört erkek ve otuz kadın var; erkeklerden biri çok popüler.'),
    choices: [
      ch('go', 'Go every week', 'Her hafta git', (c) => {
        c.h.stat('health', 3);
        c.h.stat('happiness', 5);
        return c.t('You go every Wednesday. Your hip complains on Thursdays and you do not care at all.', 'Her çarşamba gidiyorsun. Kalçan perşembeleri şikâyet ediyor ve hiç umurunda değil.');
      }, { tone: 'good' }),
      ch('partner', 'Take your partner', 'Eşini de götür', (c) => {
        setPartner(c);
        c.h.closeness(String(c.vars.pid), 7);
        c.h.stat('happiness', 4);
        return c.t(`You and ${nmv(c)} were the best couple on the floor. You remembered steps you thought you had forgotten.`, `${wth(nmv(c))} pistin en iyi çiftiydiniz. Unuttuğunu sandığın adımları hatırladın.`);
      }, { requires: partnered, requiresLabel: 'No opening' }),
      ch('watch', 'Just sit and enjoy the music', 'Sadece oturup müziğin keyfini çıkar', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You sat with tea and tapped your foot. Somebody asked you to dance anyway. You said yes.', 'Çayını alıp oturdun ve ayağınla tempo tuttun. Biri yine de dansa kaldırdı. Evet dedin.');
      }),
    ],
  },
  {
    id: 'base.ad_old_photos',
    category: 'family',
    ...old(70),
    once: true,
    weight: 5,
    title: T('You have four thousand old photographs in boxes, and nobody knows who half the people are.', 'Kutularda dört bin eski fotoğrafın var ve yarısındaki insanların kim olduğunu kimse bilmiyor.'),
    text: T('Except you. For now.', 'Senden başka. Şimdilik.'),
    choices: [
      ch('label', 'Write a name on the back of every one', 'Her birinin arkasına bir isim yaz', (c) => {
        c.h.stat('happiness', 4);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 3));
        return c.t('A whole winter at the kitchen table. Names, years, places, and sometimes "do not ask". The boxes are a family history now.', 'Mutfak masasında koca bir kış. İsimler, yıllar, yerler ve bazen "sormayın". Kutular artık bir aile tarihi.');
      }, { tone: 'good' }),
      ch('gk', 'Do it with a grandchild', 'Bir torunla birlikte yap', (c) => {
        pickGk(c, 8, 30);
        c.h.stat('happiness', 5);
        gkParent(c, 3);
        return c.t(`${gkn(c)} scanned while you talked. They now know more about the family than anyone alive. They asked for more.`, `Sen anlattıkça ${gkn(c)} taradı. Artık aile hakkında hayattaki herkesten fazla şey biliyor. Daha fazlasını istedi.`);
      }, { requires: hasGk(8, 30), requiresLabel: 'No opening' }),
      ch('later', 'Close the box again', 'Kutuyu yeniden kapat', (c) => c.t('You looked at the first photo for an hour, then closed the box. Another day.', 'İlk fotoğrafa bir saat baktın, sonra kutuyu kapattın. Başka bir gün.')),
    ],
  },
  {
    id: 'base.ad_old_spouse_memory',
    category: 'love',
    ...old(70),
    once: true,
    weight: 5,
    when: (c) => married(c) && c.h.ageOf(c.h.partner()!.person) >= 72,
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} has started forgetting things. Names, then rooms.`, `${nmv(c)} bir şeyleri unutmaya başladı. Önce isimleri, sonra odaları.`),
    text: T('The doctor uses a word you were afraid of. Then she talks about what you can do.', 'Doktor korktuğun o kelimeyi söylüyor. Sonra neler yapabileceğinizi anlatıyor.'),
    choices: [
      ch('care', 'Care for them at home, with help', 'Yardım alarak evde bak', (c) => {
        c.h.money(-wage(c, 3000));
        c.h.closeness(String(c.vars.pid), 10);
        c.h.stat('health', -3);
        c.h.stat('happiness', -2);
        return c.t(`Hard days and good hours. On the good ones, ${nmv(c)} still laughs at your jokes, the old ones especially. You tell them every day.`, `Zor günler ve güzel saatler. Güzel olanlarda ${nmv(c)} hâlâ esprilerine gülüyor; özellikle eskilerine. Her gün anlatıyorsun.`);
      }, { tone: 'good' }),
      ch('family', 'Share the care with the children', 'Bakımı çocuklarla paylaş', (c) => {
        c.h.closeness(String(c.vars.pid), 6);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 4));
        return c.t('A rota, a family group chat and a lot of love. Nobody carries it alone.', 'Bir nöbet çizelgesi, bir aile grubu ve bolca sevgi. Kimse yükü tek başına taşımıyor.');
      }, { tone: 'good' }),
      ch('home', 'Find a specialist care home nearby', 'Yakında uzman bir bakımevi bul', (c) => {
        c.h.money(-wage(c, 5000));
        c.h.closeness(String(c.vars.pid), 3);
        c.h.stat('happiness', -3);
        return c.t(`You visit every afternoon at three. Some days ${nmv(c)} knows you. Every day you bring the newspaper and read the weather aloud.`, `Her öğleden sonra üçte gidiyorsun. Bazı günler ${nmv(c)} seni tanıyor. Her gün gazeteyi götürüp hava durumunu yüksek sesle okuyorsun.`);
      }),
    ],
  },
  {
    id: 'base.ad_old_one_more_day',
    category: 'family',
    ...old(85),
    once: true,
    weight: 6,
    title: T('A great-grandchild asks: "If you could live one day again, which would it be?"', 'Bir torununun çocuğu soruyor: "Bir günü yeniden yaşayabilsen hangisi olurdu?"'),
    text: T('The whole table goes quiet to hear the answer.', 'Bütün sofra cevabı duymak için susuyor.'),
    choices: [
      ch('ordinary', 'An ordinary Sunday, long ago', 'Çok eskiden, sıradan bir pazar', (c) => {
        c.h.stat('happiness', 5);
        return c.t('"An ordinary Sunday. Nobody was ill, the bread was warm and everyone was home." Nobody spoke for a while after that.', '"Sıradan bir pazar. Kimse hasta değildi, ekmek sıcaktı ve herkes evdeydi." Ondan sonra bir süre kimse konuşmadı.');
      }, { tone: 'good' }),
      ch('today', '"This one"', '"Bugün"', (c) => {
        c.h.stat('happiness', 6);
        c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 3));
        return c.t('"This one," you said, and meant it. Somebody had to leave the table for a minute.', '"Bugün" dedin ve gerçekten öyle düşünüyordun. Biri bir dakikalığına masadan kalkmak zorunda kaldı.');
      }, { tone: 'good' }),
      ch('secret', 'Say it is a secret', 'Bunun bir sır olduğunu söyle', (c) => {
        c.h.stat('happiness', 3);
        return c.t('"That one is mine," you said, smiling. Everyone guessed. Nobody guessed right.', '"O benim" dedin, gülümseyerek. Herkes tahmin etti. Kimse doğru tahmin edemedi.');
      }),
    ],
  },
  {
    id: 'base.ad_old_hospital_nurse',
    category: 'health',
    ...old(78),
    once: true,
    weight: 4,
    when: (c) => c.p.stats.health < 50,
    title: T('A long stay in hospital. One night nurse sits with you when you cannot sleep.', 'Hastanede uzun bir yatış. Uyuyamadığın gecelerde bir gece hemşiresi yanında oturuyor.'),
    text: T('She has three children, a terrible husband and the best laugh on the ward.', 'Üç çocuğu, berbat bir kocası ve servisin en güzel kahkahası var.'),
    choices: [
      ch('stories', 'Trade stories every night', 'Her gece hikâye değiş tokuş edin', (c) => {
        c.h.stat('happiness', 5);
        c.h.stat('health', 2);
        return c.t('You told each other everything. On your last night she brought you contraband biscuits and cried a little.', 'Birbirinize her şeyi anlattınız. Son gecende sana kaçak bisküvi getirdi ve biraz ağladı.');
      }, { tone: 'good' }),
      ch('thanks', 'Write to the hospital to praise her', 'Onu övmek için hastaneye yaz', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You wrote a letter to the director, three pages long. She was given an award. She sent you a photo of it.', 'Başhekime üç sayfalık bir mektup yazdın. Ona bir ödül verildi. Sana ödülün fotoğrafını gönderdi.');
      }),
    ],
  },
];

