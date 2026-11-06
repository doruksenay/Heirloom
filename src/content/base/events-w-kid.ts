import type { Ctx, EventDef } from '../types';
import { Kw, allParents, befriend, gamble, kw, near, newKid, nmc, opt, out, pickGrand, pickParent, pickSibling, siblingsOf, tt } from './young-kit';

// Kid wave: small, warm, funny moments for ages 1-12 (toddler and preschool firsts, the first school years, the
// last years before the teens). Child-friendly; the choices are what a child (or a parent beside the child) would
// decide. Everything about a parent, a sibling or a grandparent is gated by `needs` and read through young-kit.
// Weights are high on purpose: the first twelve years were thin (one event every two or three years).

const pp = (c: Ctx) => pickParent(c, 'par');
const P = (c: Ctx) => Kw(c, 'par');

/** Siblings small enough to be looked after: 2 to 8 years old. */
const littleSiblings = (c: Ctx) => siblingsOf(c).filter((r) => {
  const a = c.h.ageOf(r.person);
  return a >= 2 && a <= 8;
});

export const kidWaveEvents: EventDef[] = [
  // ================================================================ 1-2: firsts
  {
    id: 'base.kd_peekaboo',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    weight: 140,
    needs: ['parent'],
    setup: pp,
    title: tt(`Peekaboo!`, `Ce-ee!`),
    text: (c) =>
      c.t(
        `${P(c)} hides behind a cushion and pops out. You have never seen anything so astonishing. Again!`,
        `${P(c)} yastığın arkasına saklanıp birden çıkıyor. Hayatında bundan şaşırtıcı bir şey görmedin. Bir daha!`,
      ),
    choices: [
      opt('laugh', [`Shriek with laughter`, `Kahkahayı patlat`], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 3 }, `You laughed so hard you got the hiccups, then demanded it again. Forty-one rounds later the cushion was exhausted.`, `O kadar güldün ki hıçkırığın tuttu, sonra yine istedin. Kırk bir tur sonra yastık bitkin düştü.`);
      }, { tone: 'good' }),
      opt('cover', [`Cover your own eyes`, `Kendi gözlerini kapat`], (c) =>
        out(c, { sma: 1, hap: 2 }, `You covered your eyes and decided that if you cannot see anyone, nobody can see you. In your mind it worked brilliantly.`, `Gözlerini kapatıp kimseyi göremiyorsan kimsenin de seni göremeyeceğine karar verdin. Aklında mükemmel işledi.`),
      ),
      opt('take', [`Grab the cushion and take over`, `Yastığı kap, sıra sende`], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 3, sma: 1 }, `Now you are the one hiding. You have not worked out the "pop out" part yet, so you just lie under the cushion. Your family acts amazed every single time.`, `Şimdi saklanan sensin. "Birden çıkma" kısmını henüz çözemedin, yastığın altında öylece yatıyorsun. Ailen her seferinde ilk kez görüyormuş gibi şaşırıyor.`);
      }),
    ],
  },
  {
    id: 'base.kd_banana',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    weight: 120,
    needs: ['parent'],
    setup: pp,
    title: tt(`Mashed banana: your first big meal.`, `İlk büyük yemeğin: ezilmiş muz.`),
    text: (c) =>
      c.t(
        `${P(c)} holds out a spoon of mashed banana with the confidence of someone who has never been wrong.`,
        `${P(c)} hiç yanılmamış birinin özgüveniyle ezilmiş muzlu bir kaşık uzatıyor.`,
      ),
    choices: [
      opt('eat', [`Open wide`, `Ağzını kocaman aç`], (c) => {
        near(c, 'par', 3);
        return out(c, { hea: 2, hap: 2 }, `Down it went. You looked surprised, then offended when the spoon was empty.`, `Hepsi gitti. Önce şaşırdın, sonra kaşık boşalınca alındın.`);
      }, { tone: 'good' }),
      opt('hat', [`Wear it`, `Başına geçir`], (c) =>
        out(c, { hap: 3 }, `The banana went on your head, in your ears and somewhere inside the high chair. Everyone took a photo. You were very proud of your artwork.`, `Muz kafana, kulaklarına ve mama sandalyesinin bilinmeyen bir yerine gitti. Herkes fotoğraf çekti. Eserinle gurur duydun.`),
      ),
      opt('spit', [`Blow a raspberry`, `Dilini çıkarıp pfff yap`], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 1 }, `A fine yellow mist settled over the table. Your family has decided that you will become a food critic.`, `Masanın üstüne ince bir sarı sis indi. Ailen senin ileride yemek eleştirmeni olacağına karar verdi.`);
      }),
    ],
  },

  // ================================================================ 2-5: toddler chaos
  {
    id: 'base.kd_stairs',
    category: 'childhood',
    minAge: 2,
    maxAge: 3,
    once: true,
    weight: 110,
    needs: ['parent'],
    setup: pp,
    title: tt(`Someone left the stair gate open.`, `Biri merdiven kapısını açık bırakmış.`),
    text: tt(`The staircase is right there. It looks like a mountain, and you are an explorer.`, `Merdiven tam karşında. Bir dağ gibi duruyor, sen de kaşifsin.`),
    choices: [
      opt('climb', [`Climb it on all fours`, `Dört ayak tırman`], (c) => {
        near(c, 'par', 2);
        return out(c, { sma: 2, hap: 3 }, `Step by step you reached the top and looked down like a king. Then you noticed you could not get back. ${P(c)} scooped you up, laughing.`, `Basamak basamak tepeye çıkıp bir kral gibi aşağı baktın. Sonra geri inemeyeceğini fark ettin. ${P(c)} gülerek seni kucağına aldı.`);
      }),
      opt('call', [`Call for help`, `Yardım çağır`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: 1 }, `You shouted until someone came and was carried up in style. Same view, zero effort.`, `Biri gelene kadar bağırdın ve şık bir şekilde kucakla yukarı çıkarıldın. Aynı manzara, sıfır emek.`);
      }, { tone: 'good' }),
      opt('slide', [`Bump down on your bottom`, `Poponla kaya kaya in`], (c) =>
        out(c, { hea: -1, hap: 4 }, `Bump, bump, bump, all the way down. You decided it was the best ride of the year and did it nine more times. Your bottom is slightly sorry.`, `Pat, pat, pat, bütün merdiveni kaya kaya indin. Yılın en iyi eğlencesi olduğuna karar verip dokuz kez daha yaptın. Poponun biraz canı yandı.`),
      ),
    ],
  },
  {
    id: 'base.kd_shop_tantrum',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    maxPerLife: 2,
    cooldown: 2,
    weight: 110,
    needs: ['parent'],
    setup: pp,
    title: tt(`The toy aisle.`, `Oyuncak reyonu.`),
    text: (c) =>
      c.t(
        `${P(c)} says no to the shiny toy rocket. The word lands in the middle of the shop like a dropped saucepan.`,
        `${P(c)} parlak roket oyuncağa "hayır" diyor. O kelime dükkânın ortasına düşen bir tencere gibi yankılanıyor.`,
      ),
    choices: [
      opt('floor', [`Lie flat on the floor`, `Yere uzan`], (c) => {
        near(c, 'par', -3);
        return out(c, { hap: -1 }, `You became a starfish on the tiles. Strangers stepped over you with great sympathy for your family. You did not get the rocket.`, `Fayansın üstünde bir deniz yıldızı oldun. Yabancılar ailene büyük bir anlayışla üstünden atlayıp geçti. Roketi alamadın.`);
      }),
      opt('please', [`Whisper "please"`, `Fısıltıyla "lütfen" de`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: 1 }, `Your tiny "please" worked better than any shout. You did not get the rocket today, but it went on the birthday list, which is how the world works.`, `Minicik "lütfen"in her bağırmadan daha iyi işledi. Roketi bugün alamadın ama doğum günü listesine yazıldı; dünya böyle işliyor.`);
      }, { tone: 'good' }),
      opt('leg', (c) => c.t(`Hug ${kw(c, 'par', 'gen')} leg and sulk`, `${Kw(c, 'par', 'gen')} bacağına sarılıp somurt`), (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 1 }, `A warm hand ruffled your hair. The sulk lasted until the car park, where a puddle came along and changed your whole mind.`, `Sıcak bir el saçını karıştırdı. Surat asmak otoparka kadar sürdü; orada bir su birikintisi çıkıp fikrini tamamen değiştirdi.`);
      }),
    ],
  },
  {
    id: 'base.kd_toddler_no',
    category: 'childhood',
    minAge: 2,
    maxAge: 3,
    once: true,
    weight: 110,
    needs: ['parent'],
    setup: pp,
    title: tt(`Your favourite word is "no".`, `En sevdiğin kelime "hayır".`),
    text: tt(`Do you want a bath? No. Do you want cake? No. Do you want to go to the park? NO. Everything you are asked gets the same answer.`, `Banyo ister misin? Hayır. Pasta ister misin? Hayır. Parka gidelim mi? HAYIR. Sana ne sorulsa aynı cevabı veriyorsun.`),
    choices: [
      opt('no', [`Say no to everything`, `Her şeye hayır de`], (c) => {
        near(c, 'par', -2);
        return out(c, { hap: 2 }, `You said no to the cake, then wept when it was taken away. Logic is something for later.`, `Pastaya hayır dedin, pasta kalkınca da ağladın. Mantık, daha sonraya kalan bir şey.`);
      }),
      opt('yes', [`Say "yes" once, very loudly`, `Bir kez, gür sesle "evet" de`], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: 2 }, `The whole room froze. Then everybody cheered as if you had scored a goal. You went back to "no" immediately, but the record was set.`, `Bütün oda dondu. Sonra herkes gol atmışsın gibi alkışladı. Hemen "hayır"a döndün ama rekor kırılmıştı.`);
      }, { tone: 'good' }),
      opt('giggle', [`Shake your head and giggle`, `Başını sallayıp kıkırda`], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 3 }, `A giggle is a kind of yes, as every grown-up knows. You were in your coat before you had finished refusing.`, `Kıkırdamak bir tür evet demektir, her büyük bunu bilir. Reddetmeyi bitirmeden montunu giymiştin bile.`);
      }),
    ],
  },
  {
    id: 'base.kd_bedtime_book',
    category: 'childhood',
    minAge: 2,
    maxAge: 5,
    once: true,
    weight: 100,
    needs: ['parent'],
    setup: pp,
    title: tt(`The same bedtime book, for the fourteenth time.`, `Aynı uyku öncesi kitabı, on dördüncü kez.`),
    text: (c) =>
      c.t(
        `You know every word by heart. ${P(c)} has learnt every word too, and may be wishing otherwise.`,
        `Her kelimesini ezbere biliyorsun. ${P(c)} de hepsini ezberledi, belki keşke ezberlemeseydi diyor.`,
      ),
    choices: [
      opt('again', [`Ask for it again`, `Bir daha oku de`], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 2 }, `The fifteenth reading came with all the voices, and you fell asleep halfway through the wolf.`, `On beşinci okuma bütün seslendirmelerle geldi ve sen kurdun ortasında uyuyakaldın.`);
      }, { tone: 'good' }),
      opt('recite', [`Tell the story yourself`, `Hikâyeyi kendin anlat`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 3, hap: 2 }, `You "read" it word for word, with the book upside down. Everyone was so proud that they forgot to be tired.`, `Kitap ters dursa da kelimesi kelimesine "okudun". Herkes o kadar gurur duydu ki yorgun olmayı unuttu.`);
      }),
      opt('sleep', [`Curl up and fall asleep`, `Kıvrıl ve uyu`], (c) => {
        near(c, 'par', 1);
        return out(c, { hea: 1, hap: 1 }, `You dropped off by the third page, clutching your toy. A perfect audience, as any author would tell you.`, `Üçüncü sayfada oyuncağına sarılıp uyuyakaldın. Her yazarın hayalindeki dinleyici.`);
      }),
    ],
  },
  {
    id: 'base.kd_playgroup_share',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    weight: 100,
    title: tt(`One red digger, two toddlers.`, `Bir kırmızı kepçe, iki küçük çocuk.`),
    text: tt(`It is the best toy in the room, and another toddler is holding it. You have strong feelings about this.`, `Odadaki en güzel oyuncak bu ve onu başka bir çocuk tutuyor. Bu konuda güçlü duyguların var.`),
    choices: [
      opt('share', [`Share it`, `Paylaş`], (c) =>
        out(c, { hap: 3, sma: 1 }, `You took turns. It took twelve minutes and one small cry, but by the end you were building a road together.`, `Sırayla oynadınız. On iki dakika ve küçük bir ağlama sürdü ama sonunda birlikte yol yapıyordunuz.`),
        { tone: 'good' },
      ),
      opt('grab', [`Grab it and run`, `Kapıp kaç`], (c) =>
        out(c, { hap: -1 }, `The digger was yours for forty seconds. Then a very determined toddler and the playgroup grown-up caught up with you, and the word "turns" was explained at length.`, `Kepçe kırk saniye boyunca senindi. Sonra kararlı bir çocuk ve oyun grubunun büyüğü yetişti, "sıra" kelimesi uzun uzun anlatıldı.`),
      ),
      opt('swap', [`Offer half your biscuit`, `Bisküvinin yarısını teklif et`], (c) =>
        out(c, { sma: 3, hap: 2 }, `Your first deal: one digger for half a biscuit. The other toddler is now a business partner.`, `İlk anlaşman: yarım bisküviye bir kepçe. Öbür çocuk artık iş ortağın.`),
      ),
    ],
  },
  {
    id: 'base.kd_puddle',
    category: 'childhood',
    minAge: 2,
    maxAge: 5,
    maxPerLife: 2,
    cooldown: 3,
    weight: 90,
    title: tt(`After the rain: puddles!`, `Yağmurdan sonra: su birikintileri!`),
    text: tt(`The pavement is covered in shiny puddles, and you are wearing exactly the right boots.`, `Kaldırım parlak su birikintileriyle dolu, ayağında da tam doğru botlar var.`),
    choices: [
      opt('jump', [`Jump in every one`, `Hepsine zıpla`], (c) =>
        out(c, { hap: 4, hea: -1 }, `Splash! Splash! Splash! You were soaked to the knees and shining. Your socks will never forgive you.`, `Şap! Şap! Şap! Dizlerine kadar ıslandın ve ışıl ışıldın. Çoraplarının seni affetmesi mümkün değil.`),
      ),
      opt('boat', [`Float a leaf boat`, `Yapraktan gemi yüzdür`], (c) =>
        out(c, { sma: 2, hap: 3 }, `The leaf sailed across the whole puddle. You named it and waved it off on a long voyage towards the drain.`, `Yaprak bütün su birikintisini geçti. Ona bir ad koyup su giderine uzanan uzun yolculuğunda el salladın.`),
        { tone: 'good' },
      ),
      opt('careful', [`Step around them carefully`, `Dikkatle etrafından dolaş`], (c) =>
        out(c, { hea: 1, sma: 1 }, `You kept your boots dry and your face stern. One day you will want those puddles back.`, `Botlarını kuru, yüzünü ciddi tuttun. Bir gün o su birikintilerini geri isteyeceksin.`),
      ),
    ],
  },
  {
    id: 'base.kd_balloon',
    category: 'childhood',
    minAge: 2,
    maxAge: 5,
    once: true,
    weight: 100,
    needs: ['parent'],
    setup: pp,
    title: tt(`Your balloon floats away.`, `Balonun uçup gidiyor.`),
    text: tt(`The string slipped out of your fingers, and the red balloon is rising, rising over the rooftops.`, `İp parmaklarının arasından kaydı, kırmızı balon çatıların üstüne doğru yükseliyor, yükseliyor.`),
    choices: [
      opt('wave', [`Wave goodbye`, `El salla`], (c) =>
        out(c, { hap: 2, sma: 1 }, `You waved until it was a tiny dot. You decided it was off on an adventure and would send a postcard.`, `Küçük bir nokta olana kadar el salladın. Bir maceraya çıktığına ve kartpostal göndereceğine karar verdin.`),
      ),
      opt('cry', [`Cry about it`, `Ağla`], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: -1 }, `You howled, and ${kw(c, 'par')} held you until the howling turned into hiccups and the hiccups into a snack. Being held turned out to be the best part.`, `Çığlık çığlığa ağladın; ${kw(c, 'par')} ağlama hıçkırığa, hıçkırık da atıştırmalığa dönüşene kadar seni tuttu. Kucakta olmak en güzel kısım çıktı.`);
      }),
      opt('another', [`Ask for another one`, `Bir tane daha iste`], (c) =>
        out(c, { hap: 3 }, `You got a green one, and held the string with both fists and a great deal of determination.`, `Yeşil bir tane aldın ve ipi iki yumruğunla, büyük bir kararlılıkla tuttun.`),
      ),
    ],
  },

  // ================================================================ 3-5: preschool
  {
    id: 'base.kd_finger_paint',
    category: 'childhood',
    minAge: 3,
    maxAge: 5,
    once: true,
    weight: 100,
    title: tt(`Finger-painting day.`, `Parmak boyası günü.`),
    text: tt(`Five pots of paint, one enormous sheet of paper and no rules at all.`, `Beş kavanoz boya, kocaman bir kâğıt ve hiçbir kural yok.`),
    choices: [
      opt('family', [`Paint your family`, `Ailenin resmini yap`], (c) => {
        allParents(c, 3);
        return out(c, { hap: 2, sma: 1 }, `Everyone you love became a colourful circle, and you were a small green dot in the middle. It went on the fridge and stayed there for years.`, `Sevdiğin herkes rengârenk bir daire oldu, sen de ortada küçük yeşil bir nokta. Buzdolabına asıldı ve yıllarca orada kaldı.`);
      }, { tone: 'good' }),
      opt('mix', [`Mix every colour together`, `Bütün renkleri karıştır`], (c) =>
        out(c, { sma: 3, hap: 1 }, `You discovered brown. You discovered that all the colours together are brown. You were furious and thrilled at the same time.`, `Kahverengiyi keşfettin. Bütün renklerin birleşince kahverengi olduğunu keşfettin. Aynı anda hem öfkelendin hem heyecanlandın.`),
      ),
      opt('hands', [`Paint your hands`, `Ellerini boya`], (c) =>
        out(c, { hap: 4 }, `Your blue handprints appeared on the paper, the table, the chair and the teacher's elbow. The teacher sighed with great love.`, `Mavi el izlerin kâğıtta, masada, sandalyede ve öğretmenin dirseğinde belirdi. Öğretmen büyük bir sevgiyle iç çekti.`),
      ),
    ],
  },
  {
    id: 'base.kd_sandpit_friend',
    category: 'childhood',
    minAge: 3,
    maxAge: 5,
    once: true,
    weight: 100,
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: tt(`A stranger with a red bucket.`, `Kırmızı kovalı bir yabancı.`),
    text: (c) =>
      c.t(
        `A child your size is sitting in the sandpit with the best red bucket you have ever seen. ${nmc(c, 'kid')} looks at you, then at your spade.`,
        `Boyunda bir çocuk, hayatında gördüğün en güzel kırmızı kovayla kum havuzunda oturuyor. ${nmc(c, 'kid')} sana, sonra küreğine bakıyor.`,
      ),
    choices: [
      opt('offer', [`Offer your spade`, `Küreğini uzat`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 4 }, `You swapped the spade for the bucket, built one very tall mountain and fell over it together. Best friends, as of 10.15.`, `Küreği kovayla değiştirdiniz, çok yüksek bir dağ yapıp birlikte üstüne yıkıldınız. Saat 10.15 itibarıyla en iyi arkadaşsınız.`);
      }, { tone: 'good' }),
      opt('alone', [`Dig your own hole`, `Kendi çukurunu kaz`], (c) =>
        out(c, { sma: 1, hap: 1 }, `You dug until you were sure you were halfway to the other side of the world. The other child watched with great respect.`, `Dünyanın öbür tarafına yarı yolu geldiğinden emin olana kadar kazdın. Öbür çocuk büyük bir saygıyla seyretti.`),
      ),
      opt('stomp', [`Stomp their sandcastle`, `Kum kalesini çiğne`], (c) => {
        befriend(c, 'kid', 40);
        return out(c, { sma: 1 }, `It was glorious for two seconds, and then it was not. You were asked to say sorry, you did, and you helped rebuild it. A small friendship was born out of repair work.`, `İki saniye muhteşemdi, sonra değildi. Özür dilemen istendi, diledin ve yeniden yapmaya yardım ettin. Küçük bir arkadaşlık tamir işinden doğdu.`);
      }),
    ],
  },
  {
    id: 'base.kd_dress_up',
    category: 'childhood',
    minAge: 3,
    maxAge: 5,
    once: true,
    weight: 90,
    title: tt(`The dress-up box.`, `Kostüm sandığı.`),
    text: tt(`A box of old hats, scarves and a cape that smells of attics. Who will you be today?`, `Eski şapkalar, atkılar ve çatı katı kokan bir pelerin dolu bir sandık. Bugün kim olacaksın?`),
    choices: [
      opt('astro', [`An astronaut`, `Bir astronot`], (c) =>
        out(c, { sma: 2, hap: 2 }, `With a bucket on your head you counted down from ten (which became seven, then nine) and flew to the kitchen. The kitchen was a splendid planet.`, `Kafanda bir kova, ondan geriye saydın (bu yediye, sonra dokuza dönüştü) ve mutfağa uçtun. Mutfak muhteşem bir gezegendi.`),
      ),
      opt('chef', [`A chef`, `Bir aşçı`], (c) =>
        out(c, { sma: 1, hap: 3 }, `You made soup out of nothing and served it with a bow. Everyone had two bowls of air.`, `Hiçten bir çorba yapıp reverans yaparak servis ettin. Herkes iki kase hava içti.`),
      ),
      opt('monster', [`A friendly monster`, `Sevimli bir canavar`], (c) =>
        out(c, { hap: 3 }, `You roared so gently that nobody was scared, not even the plants.`, `O kadar nazikçe kükredin ki kimse korkmadı, saksıdaki çiçekler bile.`),
      ),
    ],
  },
  {
    id: 'base.kd_picky_plate',
    category: 'childhood',
    minAge: 3,
    maxAge: 6,
    once: true,
    weight: 100,
    needs: ['parent'],
    setup: pp,
    title: tt(`The foods must not touch.`, `Yemekler birbirine değmeyecek.`),
    text: (c) =>
      c.t(
        `A pea has rolled into your mashed potato. This is a disaster. ${P(c)} looks at the plate, then at you.`,
        `Bir bezelye yuvarlanıp patates püresine değdi. Bu bir felaket. ${P(c)} tabağa, sonra sana bakıyor.`,
      ),
    choices: [
      opt('wall', [`Build a wall between them`, `Aralarına duvar ör`], (c) => {
        near(c, 'par', 1);
        return out(c, { sma: 2, hap: 1 }, `You built a fence out of carrot sticks. Dinner became engineering, and everything was eaten behind the fence.`, `Havuç çubuklarından bir çit ördün. Akşam yemeği mühendisliğe dönüştü ve her şey çitin arkasında yendi.`);
      }),
      opt('bite', [`Try one bite of everything`, `Her şeyden bir lokma dene`], (c) => {
        near(c, 'par', 3);
        return out(c, { hea: 3, hap: 1 }, `The peas were fine. You took a second helping, and your parent's eyebrows went up to their hairline.`, `Bezelyeler gayet iyiydi. İkinci kez aldın ve ebeveyninin kaşları saç çizgisine kadar yükseldi.`);
      }, { tone: 'good' }),
      opt('refuse', [`Refuse the whole plate`, `Tabağı komple reddet`], (c) => {
        near(c, 'par', -2);
        return out(c, { hea: -1, hap: -1 }, `Dinner became a quiet standoff. In the end you ate a slice of bread, a banana at eight o'clock and an unquestionable amount of toast.`, `Akşam yemeği sessiz bir restleşmeye döndü. Sonunda bir dilim ekmek, saat sekizde bir muz ve tartışılmaz miktarda tost yedin.`);
      }),
    ],
  },
  {
    id: 'base.kd_nightmare',
    category: 'childhood',
    minAge: 3,
    maxAge: 7,
    once: true,
    weight: 100,
    needs: ['parent'],
    setup: pp,
    title: tt(`A bad dream.`, `Kötü bir rüya.`),
    text: tt(`You dreamed that a giant sock chased you around the kitchen. You wake up with your heart bouncing.`, `Rüyanda kocaman bir çorap seni mutfakta kovalıyordu. Kalbin zıplayarak uyandın.`),
    choices: [
      opt('bed', (c) => c.t(`Run to ${kw(c, 'par', 'gen')} bed`, `${Kw(c, 'par', 'gen')} yatağına koş`), (c) => {
        near(c, 'par', 5);
        return out(c, { hap: 2, hea: 1 }, `You were lifted in under the covers, and the sock was told to go home. By the second yawn you were asleep.`, `Yorganın altına alındın ve çoraba eve gitmesi söylendi. İkinci esnemede uyumuştun.`);
      }, { tone: 'good' }),
      opt('light', [`Turn on the light and check`, `Işığı yak ve kontrol et`], (c) =>
        out(c, { sma: 2, hap: 1 }, `No sock under the bed. No sock in the wardrobe. One sock lay on the floor, being a sock. You put it in the laundry basket and went back to sleep.`, `Yatağın altında çorap yok. Dolapta çorap yok. Yerde bir çorap duruyordu, çorap olarak. Onu çamaşır sepetine koyup uykuya döndün.`),
      ),
      opt('toy', [`Hug your toy tight`, `Oyuncağına sıkıca sarıl`], (c) =>
        out(c, { hap: 2 }, `Your toy did not say much, but it felt very brave. Together you out-stared the dark until morning.`, `Oyuncağın pek konuşmadı ama çok cesur hissettirdi. İkiniz sabaha kadar karanlığa gözünüzü dikip baktınız.`),
      ),
    ],
  },
  {
    id: 'base.kd_dentist',
    category: 'health',
    minAge: 4,
    maxAge: 8,
    once: true,
    weight: 90,
    needs: ['parent'],
    setup: pp,
    title: tt(`First time at the dentist.`, `Dişçiye ilk gidiş.`),
    text: (c) =>
      c.t(
        `${P(c)} takes you to the dentist. The chair goes up and down by itself, which is wonderful, and there is a tiny mirror, which is suspicious.`,
        `${P(c)} seni dişçiye götürüyor. Koltuk kendi kendine inip çıkıyor, bu harika; küçücük bir ayna var, bu şüpheli.`,
      ),
    choices: [
      opt('wide', [`Open wide like a lion`, `Aslan gibi ağzını aç`], (c) => {
        near(c, 'par', 2);
        return out(c, { hea: 3, hap: 2 }, `"Teeth of a champion," said the dentist. You got a sticker and wore it for a week.`, `"Şampiyon dişleri," dedi dişçi. Bir çıkartma aldın ve bir hafta boyunca üstünde taşıdın.`);
      }, { tone: 'good' }),
      opt('shut', [`Keep your mouth shut`, `Ağzını sıkıca kapat`], (c) =>
        out(c, { sma: 1 }, `Your mouth was a locked door. After a long negotiation and a puppet show with the tiny mirror, the door opened.`, `Ağzın kilitli bir kapıydı. Uzun bir pazarlık ve küçük aynayla yapılan bir kukla gösterisinden sonra kapı açıldı.`),
      ),
      opt('ask', [`Ask what every tool does`, `Her aletin ne işe yaradığını sor`], (c) =>
        out(c, { sma: 3, hea: 1 }, `You learned the names of six tools and why teeth like to be brushed. At home you gave your toy a check-up. It was fine.`, `Altı aletin adını ve dişlerin neden fırçalanmayı sevdiğini öğrendin. Evde oyuncağına muayene yaptın. Gayet iyiydi.`),
      ),
    ],
  },
  {
    id: 'base.kd_stolen_cookie',
    category: 'childhood',
    minAge: 4,
    maxAge: 8,
    once: true,
    weight: 100,
    needs: ['parent'],
    setup: pp,
    title: tt(`The biscuit tin is a little lighter.`, `Bisküvi kutusu biraz hafiflemiş.`),
    text: (c) =>
      c.t(
        `There are crumbs on your chin and a biscuit-shaped gap in the tin. ${P(c)} comes in and asks, "Does anyone know about the biscuits?"`,
        `Çenende kırıntılar, kutuda bisküvi büyüklüğünde bir boşluk var. ${P(c)} içeri girip "Bisküvilerden haberi olan var mı?" diye soruyor.`,
      ),
    choices: [
      opt('confess', [`Tell the truth`, `Doğruyu söyle`], (c) => {
        near(c, 'par', 4);
        return out(c, { sma: 1, hap: -1 }, `"It was me." Your parent hid a smile and thanked you for telling. You were allowed one biscuit, which tasted better than the stolen ones.`, `"Bendim." Ebeveynin gülümsemesini saklayıp söylediğin için teşekkür etti. Bir bisküvi hakkın verildi; çalınanlardan daha lezzetliydi.`);
      }, { tone: 'good' }),
      opt('blame', [`Blame the invisible burglar`, `Görünmez hırsızı suçla`], (c) => {
        near(c, 'par', -2);
        return out(c, { hap: 1 }, `The burglar had left crumbs in the exact shape of your chin. You are now the lead suspect.`, `Hırsız tam senin çenen şeklinde kırıntılar bırakmış. Artık baş şüphelisin.`);
      }),
      opt('share', [`Offer half of the evidence`, `Delilin yarısını ikram et`], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: 3 }, `Your parent accepted the evidence with a straight face and ate it. Case closed, with crumbs.`, `Ebeveynin delili ciddi bir yüzle kabul edip yedi. Dava kapandı, kırıntılarla birlikte.`);
      }),
    ],
  },
  {
    id: 'base.kd_animal_park',
    category: 'childhood',
    minAge: 3,
    maxAge: 8,
    once: true,
    weight: 90,
    title: tt(`Meet the goats.`, `Keçilerle tanış.`),
    text: tt(`You are at the animal park. A goat has just discovered your sleeve and, in the same moment, your ticket.`, `Hayvan çiftliğindesin. Bir keçi kolunu ve aynı anda cebindeki bileti keşfetti.`),
    choices: [
      opt('feed', [`Feed it from your open hand`, `Açık avucundan yedir`], (c) =>
        out(c, { hap: 3, sma: 1 }, `Its tongue was rough and surprisingly polite. You told everyone for a week that you can speak goat.`, `Dili pürüzlü ve şaşırtıcı derecede kibardı. Bir hafta boyunca herkese keçi dilini bildiğini söyledin.`),
        { tone: 'good' },
      ),
      opt('hide', [`Hide behind the nearest grown-up`, `En yakın büyüğün arkasına saklan`], (c) =>
        out(c, { hap: 1 }, `You watched from behind a coat. Goats, you decided, are best admired from far away. You waved with one finger.`, `Bir paltonun arkasından izledin. Keçilerin en iyi uzaktan beğenildiğine karar verdin. Bir parmağınla el salladın.`),
      ),
      opt('meh', [`Say "meh" back`, `Ona "meee" diye cevap ver`], (c) =>
        out(c, { hap: 4 }, `"Meeeh," you said. "Meeeh," it said. This went on for six minutes and a small crowd gathered. You finally had an audience.`, `"Meee," dedin. "Meee," dedi. Bu altı dakika sürdü ve küçük bir kalabalık toplandı. Sonunda bir seyircin vardı.`),
      ),
    ],
  },
  {
    id: 'base.kd_water_day',
    category: 'childhood',
    minAge: 3,
    maxAge: 9,
    once: true,
    weight: 80,
    title: tt(`Sandcastle versus the waves.`, `Kum kale ve dalgalar.`),
    text: tt(`You are building the greatest castle in the history of sand. The water has plans of its own.`, `Kum tarihinin en büyük kalesini yapıyorsun. Suyun kendi planları var.`),
    choices: [
      opt('moat', [`Dig a deep moat`, `Derin bir hendek kaz`], (c) =>
        out(c, { sma: 3, hap: 2 }, `The moat held for a whole minute and a half. Engineering, you learned, is mostly finding out where things fail.`, `Hendek tam bir buçuk dakika dayandı. Mühendisliğin çoğunlukla bir şeyin nerede çöktüğünü bulmak olduğunu öğrendin.`),
      ),
      opt('splash', [`Run into the water`, `Suya koş`], (c) =>
        out(c, { hea: 2, hap: 4 }, `Cold! Cold! More! You came out blue-lipped and wildly happy and demanded a towel the size of a field.`, `Soğuk! Soğuk! Daha! Dudakların mor, mutluluktan çılgın halde çıktın ve bir tarla büyüklüğünde havlu istedin.`),
      ),
      opt('shells', [`Decorate it with shells`, `Deniz kabuklarıyla süsle`], (c) =>
        out(c, { hap: 3 }, `Fifty shells later it was the most beautiful castle in the world. A wave admired it for a moment, and took it away. You made another.`, `Elli kabuk sonra dünyanın en güzel kalesi olmuştu. Bir dalga bir an hayran hayran baktı ve onu alıp götürdü. Sen bir tane daha yaptın.`),
      ),
    ],
  },

  // ================================================================ 5-9: the first school years
  {
    id: 'base.kd_shoelaces',
    category: 'childhood',
    minAge: 5,
    maxAge: 7,
    once: true,
    weight: 90,
    needs: ['parent'],
    setup: pp,
    title: tt(`Shoelaces.`, `Ayakkabı bağcıkları.`),
    text: tt(`Everyone else seems to know how to tie them. You have two loops and a knot that has gone very wrong.`, `Herkes bağlamayı biliyor gibi. Senin elinde iki kulak ve çok yanlış giden bir düğüm var.`),
    choices: [
      opt('practice', [`Practise until it works`, `Olana kadar dene`], (c) =>
        out(c, { sma: 3, hap: 1 }, `Bunny ears, round the tree, into the hole. On the thirtieth go the bow held. You walked about all day just to show it off.`, `Tavşan kulakları, ağacın etrafı, deliğe. Otuzuncu denemede fiyonk tuttu. Sırf göstermek için bütün gün dolaştın.`),
        { tone: 'good' },
      ),
      opt('help', (c) => c.t(`Ask ${kw(c, 'par')} to help`, `Yardım için ${kw(c, 'par', 'dat')} git`), (c) => {
        near(c, 'par', 3);
        return out(c, { hap: 2 }, `Together you did it twice, slowly. Then you did it alone while nobody was looking and pretended it was easy.`, `Birlikte iki kez, yavaşça yaptınız. Sonra kimse bakmazken tek başına yapıp kolaymış gibi davrandın.`);
      }),
      opt('velcro', [`Insist on velcro forever`, `Sonsuza kadar cırt cırtlı iste`], (c) =>
        out(c, { hap: 2 }, `Velcro has no knots and no politics. You rip your shoes open with the pride of a champion.`, `Cırt cırtın düğümü de yok, kuralı da. Ayakkabılarını bir şampiyon gururuyla açıp kapatıyorsun.`),
      ),
    ],
  },
  {
    id: 'base.kd_tooth_note',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    weight: 100,
    title: tt(`Your tooth fell out!`, `Dişin düştü!`),
    text: tt(`There is a gap where your tooth used to be, and you cannot stop poking it with your tongue. Tonight, the tooth fairy.`, `Dişinin yerinde bir boşluk var ve dilini oraya sokmaktan kendini alamıyorsun. Bu gece diş perisi gelecek.`),
    choices: [
      opt('note', [`Write the fairy a letter`, `Periye mektup yaz`], (c) =>
        out(c, { sma: 3, hap: 2, usd: 1 }, `You asked for three things, in writing: a coin, a sticker and a promise not to take the next tooth too fast. In the morning there was a coin and a very small signature.`, `Yazılı olarak üç şey istedin: bir bozuk para, bir çıkartma ve bir sonraki dişi bu kadar hızlı almayacağına dair söz. Sabah bir bozuk para ve çok küçük bir imza vardı.`),
        { tone: 'good' },
      ),
      opt('hold', [`Sleep holding the tooth tight`, `Dişi sıkı tutarak uyu`], (c) =>
        out(c, { hap: 2, usd: 1 }, `You fell asleep at half past eight with your fist closed around the tooth. The fairy has evidently learned how to open small fingers.`, `Sekiz buçukta, yumruğun dişin etrafında kapalı uyudun. Peri, küçük parmakları açmayı belli ki öğrenmiş.`),
      ),
      opt('show', [`Show everyone the gap`, `Boşluğu herkese göster`], (c) =>
        out(c, { hap: 3, loo: -1 }, `You whistled through it, lisped through it and became a celebrity at lunch. Your smile is now a conversation piece.`, `İçinden ıslık çaldın, peltek konuştun ve öğle yemeğinde ünlü oldun. Gülüşün artık konuşma konusu.`),
      ),
    ],
  },
  {
    id: 'base.kd_goldfish',
    category: 'childhood',
    minAge: 5,
    maxAge: 9,
    once: true,
    weight: 80,
    needs: ['parent'],
    setup: pp,
    title: tt(`You won a goldfish!`, `Bir japon balığı kazandın!`),
    text: (c) =>
      c.t(
        `At the fair you tossed a ball into a cup against all the odds. Now you are holding a bag with one very small fish in it, and ${kw(c, 'par')} has the face of someone doing sums.`,
        `Panayırda olasılıklara rağmen topu bardağa attın. Şimdi elinde içinde minicik bir balık olan bir poşet var; ${kw(c, 'par')} ise hesap yapan birinin yüzüyle bakıyor.`,
      ),
    choices: [
      opt('bowl', [`Name it and find it a bowl`, `Adını koy, kase bul`], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 3, sma: 1 }, `It was named Captain Bubbles and given a bowl, a plant and a lot of love. It swam in circles and looked pleased about it.`, `Adı Kaptan Baloncuk oldu; ona bir kase, bir bitki ve çok sevgi verildi. Daireler çizerek yüzdü ve memnun görünüyordu.`);
      }),
      opt('read', [`Read about fish care first`, `Önce balık bakımını oku`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 3, hap: 1 }, `You learned that a goldfish needs a lot more than a bag. Your care chart went on the fridge, with stickers, and the fish thrived.`, `Bir japon balığının poşetten çok daha fazlasına ihtiyacı olduğunu öğrendin. Bakım çizelgen çıkartmalarla buzdolabına asıldı ve balık gürbüz büyüdü.`);
      }, { tone: 'good' }),
      opt('parade', [`Parade it down the street`, `Sokakta herkese göster`], (c) =>
        out(c, { hap: 3 }, `You carried it home like a trophy, bag held high. The fish handled the attention with dignity.`, `Eve kadar kupa gibi, poşeti havada taşıdın. Balık ilgiyi vakar içinde karşıladı.`),
      ),
    ],
  },
  {
    id: 'base.kd_playground_argument',
    category: 'childhood',
    minAge: 5,
    maxAge: 9,
    maxPerLife: 2,
    cooldown: 3,
    weight: 90,
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: tt(`Who is the pirate captain?`, `Korsan kaptan kim olacak?`),
    text: (c) =>
      c.t(
        `You and ${nmc(c, 'kid')} are playing pirates on the climbing frame. You are both the captain. The ship is not big enough for two.`,
        `${nmc(c, 'kid')} ile tırmanma iskelesinde korsancılık oynuyorsunuz. İkiniz de kaptansınız. Gemi iki kaptana yetmiyor.`,
      ),
    choices: [
      opt('turns', [`Take turns being captain`, `Sırayla kaptan olun`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 3, sma: 1 }, `Captain until the slide, first mate until the swings. You have never had such a good-looking crew.`, `Kaydıraktan önce kaptan, salıncaklara kadar ikinci kaptan. Hiç bu kadar yakışıklı bir mürettebatın olmamıştı.`);
      }, { tone: 'good' }),
      opt('rps', [`Settle it with rock, paper, scissors`, `Taş, kâğıt, makasla halledin`], (c) => {
        befriend(c, 'kid', 45);
        return out(c, { hap: 2, sma: 1 }, `Best of five. You lost three-two, bowed, and became the best ship's cook the harbour has ever seen.`, `Beşte üç. Üç-ikiyle kaybettin, reverans yaptın ve limanın gördüğü en iyi gemi aşçısı oldun.`);
      }),
      opt('storm', [`Storm off to the swings`, `Küsüp salıncağa git`], (c) =>
        out(c, { hap: -1 }, `You sat on the swing with your arms crossed, going back and forth like a very grumpy pendulum. After five long minutes the pirate ship called you back.`, `Kollarını kavuşturup salıncakta, çok huysuz bir sarkaç gibi ileri geri gittin. Uzun beş dakika sonra korsan gemisi seni geri çağırdı.`),
      ),
    ],
  },
  {
    id: 'base.kd_boredom_box',
    category: 'childhood',
    minAge: 5,
    maxAge: 10,
    maxPerLife: 2,
    cooldown: 3,
    weight: 80,
    title: tt(`"I'm bored."`, `"Sıkıldım."`),
    text: tt(`It is raining, the screens are off and there is nothing, absolutely nothing, to do. Except for the enormous cardboard box in the corner.`, `Yağmur yağıyor, ekranlar kapalı ve yapacak hiçbir şey, hiç mi hiç yok. Köşedeki kocaman karton kutu hariç.`),
    choices: [
      opt('ship', [`Turn it into a spaceship`, `Uzay gemisine çevir`], (c) =>
        out(c, { sma: 3, hap: 4 }, `A grown-up cut the windows, a plate became the steering wheel and the launch was at three o'clock. You landed in the hallway, delighted.`, `Pencereleri bir yetişkin kesti, bir tabak direksiyon oldu ve fırlatma saat üçteydi. Koridora, çok mutlu bir şekilde indin.`),
        { tone: 'good' },
      ),
      opt('house', [`Make it a house for your toys`, `Oyuncakların için ev yap`], (c) =>
        out(c, { sma: 1, hap: 3 }, `A door, a doorbell, a tiny sofa made from a sponge. Your toys moved in and complained about the noise.`, `Bir kapı, bir zil, süngerden küçücük bir koltuk. Oyuncakların taşındı ve gürültüden şikâyet etti.`),
      ),
      opt('sigh', [`Lie on the floor and sigh`, `Yere uzanıp iç çek`], (c) =>
        out(c, { hap: -1, sma: 1 }, `You sighed so heavily the box fell over. A great deal of nothing happened, and then, quite unexpectedly, you had an idea.`, `O kadar derin iç çektin ki kutu devrildi. Hiçbir şey olmadı, sonra bir anda aklına bir fikir geldi.`),
      ),
    ],
  },
  {
    id: 'base.kd_birthday_wrong',
    category: 'childhood',
    minAge: 4,
    maxAge: 10,
    once: true,
    weight: 90,
    needs: ['parent'],
    setup: pp,
    title: tt(`The birthday cake hits the floor.`, `Doğum günü pastası yere düştü.`),
    text: (c) =>
      c.t(
        `The cake slid off the table just as everyone started singing. There is a short, enormous silence. ${P(c)} looks at the cake, then at you.`,
        `Herkes şarkıya başlarken pasta masadan kaydı. Kısa ama kocaman bir sessizlik oldu. ${P(c)} pastaya, sonra sana bakıyor.`,
      ),
    choices: [
      opt('eat', [`Eat the top bits anyway`, `Üst kısımları yine de ye`], (c) =>
        out(c, { hap: 3, hea: -1 }, `The top half was perfectly good, according to a rule that lasted five seconds. Your friends applauded.`, `Üst yarısı gayet iyiydi; beş saniye süren bir kurala göre. Arkadaşların alkışladı.`),
      ),
      opt('laugh', [`Laugh until you cry`, `Gülmekten ağla`], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 4 }, `It started with a giggle and spread like a cold. Soon everyone was laughing, grown-ups too. It became the best party story of the year.`, `Bir kıkırdamayla başladı, nezle gibi yayıldı. Kısa sürede herkes, büyükler de dahil, gülüyordu. Yılın en güzel parti hikâyesi oldu.`);
      }, { tone: 'good' }),
      opt('pancakes', [`Make pancakes instead`, `Onun yerine krep yapın`], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 3, sma: 1 }, `Flour on every nose, one pancake on the floor, which seemed only fitting. Everyone ate pancakes with a candle in them.`, `Her burunda un, yerde bir krep; ki bu çok yakışık aldı. Herkes mumlu krep yedi.`);
      }),
    ],
  },
  {
    id: 'base.kd_sibling_gift',
    category: 'family',
    minAge: 5,
    maxAge: 11,
    once: true,
    weight: 100,
    needs: ['sibling'],
    setup: (c) => pickSibling(c, 'sib'),
    title: (c) =>
      c.t(`${nmc(c, 'sib', 'gen')} birthday is tomorrow, and you have no present.`, `${nmc(c, 'sib', 'gen')} doğum günü yarın ve hediyen yok.`),
    text: tt(`You have a button, half a crayon and your whole heart.`, `Elinde bir düğme, yarım bir mum boya ve kocaman bir kalp var.`),
    choices: [
      opt('card', [`Draw a card`, `Bir kart çiz`], (c) => {
        near(c, 'sib', 5);
        return out(c, { hap: 3, sma: 1 }, `You drew the two of you as superheroes. It went straight onto the wall, and it is still there.`, `İkinizi süper kahraman olarak çizdin. Doğruca duvara asıldı, hâlâ da orada duruyor.`);
      }, { tone: 'good' }),
      opt('toy', [`Give your favourite toy`, `En sevdiğin oyuncağı ver`], (c) => {
        near(c, 'sib', 8);
        return out(c, { hap: 1 }, `It hurt a bit, and then it felt wonderful. You played with it together all afternoon, so technically nobody lost it.`, `Biraz acıdı, sonra harika hissettirdi. Bütün öğleden sonra birlikte oynadınız, yani teknik olarak kimse kaybetmedi.`);
      }),
      opt('button', [`Wrap the button in nine layers`, `Düğmeyi dokuz kat kâğıda sar`], (c) => {
        near(c, 'sib', 4);
        return out(c, { hap: 3 }, `The unwrapping took a very long time and built enormous suspense. Then there was a button. It was so ridiculous that both of you laughed until you were sore.`, `Paketi açmak çok uzun sürdü ve müthiş bir merak yarattı. Sonra bir düğme çıktı. O kadar saçmaydı ki ikiniz de karnınız ağrıyana kadar güldünüz.`);
      }),
    ],
  },
  {
    id: 'base.kd_grand_phone',
    category: 'family',
    minAge: 5,
    maxAge: 10,
    once: true,
    weight: 110,
    needs: ['grandparent'],
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} calls on video.`, `${Kw(c, 'gp')} görüntülü arıyor.`),
    text: tt(`First you see a ceiling, then an ear, then a thumb, and at last one very happy eye.`, `Önce bir tavan, sonra bir kulak, sonra bir başparmak ve sonunda çok mutlu bir göz görüyorsun.`),
    choices: [
      opt('show', [`Show your toys, one by one`, `Oyuncaklarını tek tek göster`], (c) => {
        near(c, 'gp', 4);
        return out(c, { hap: 3 }, `Forty minutes, thirty-two toys and a great many "goodness me!"s. ${Kw(c, 'gp')} now knows every one of them by name.`, `Kırk dakika, otuz iki oyuncak ve bir sürü "vay canına!" sürdü. ${Kw(c, 'gp')} artık hepsini adıyla tanıyor.`);
      }, { tone: 'good' }),
      opt('camera', [`Teach them where the camera is`, `Kameranın yerini öğret`], (c) => {
        near(c, 'gp', 3);
        return out(c, { sma: 3, hap: 2 }, `"Look at the little dot!" you said, forty times. Eventually a whole face appeared, and you clapped.`, `"Küçük noktaya bak!" dedin, kırk kez. Sonunda koca bir yüz belirdi ve alkışladın.`);
      }),
      opt('kisses', [`Blow kisses at the screen`, `Ekrana öpücük gönder`], (c) => {
        near(c, 'gp', 4);
        return out(c, { hap: 3 }, `The screen got very smeary and a faraway face glowed. It was the best call of the week.`, `Ekran leke içinde kaldı ve uzaktaki bir yüz ışıl ışıl parladı. Haftanın en güzel görüşmesiydi.`);
      }),
    ],
  },

  // ================================================================ 6-12: school
  {
    id: 'base.kd_class_bear',
    category: 'school',
    minAge: 6,
    maxAge: 8,
    once: true,
    weight: 90,
    needs: ['student'],
    title: tt(`The class bear comes home with you.`, `Sınıfın ayısı bu hafta sonu sende.`),
    text: (c) =>
      c.t(
        `It is your turn to take ${c.lang === 'tr' ? 'Pamuk' : 'Barnaby'} the class bear home, with a notebook in which you must write what the two of you did.`,
        `Sınıfın ayısı Pamuk'u eve götürme sırası sende; birlikte neler yaptığınızı yazacağın bir defteri de var.`,
      ),
    choices: [
      opt('everywhere', [`Take it everywhere`, `Her yere götür`], (c) =>
        out(c, { hap: 4, sma: 1 }, `The bear had a bath (almost), ate spaghetti (nearly) and went to the park. Your diary entry ran to four pages.`, `Ayı banyo yaptı (neredeyse), makarna yedi (sayılır) ve parka gitti. Günlük yazın dört sayfa tuttu.`),
        { tone: 'good' },
      ),
      opt('truth', [`Write only the true parts`, `Yalnızca gerçekleri yaz`], (c) =>
        out(c, { sma: 2, hap: 1 }, `"Bear sat on a chair. Bear watched me eat. Bear slept." Your teacher wrote "Very accurate!" in the margin.`, `"Ayı sandalyeye oturdu. Ayı yemek yememi izledi. Ayı uyudu." Öğretmenin kenara "Çok doğru!" yazdı.`),
      ),
      opt('tuck', [`Tuck the bear in beside you`, `Ayıyı yanına yatır`], (c) =>
        out(c, { hap: 3, hea: 1 }, `Two of you in one bed. The bear snored. You swear it did.`, `Bir yatakta iki kişiydiniz. Ayı horladı. Yemin edebilirsin.`),
      ),
    ],
  },
  {
    id: 'base.kd_teacher_mom',
    category: 'school',
    minAge: 6,
    maxAge: 9,
    once: true,
    weight: 90,
    needs: ['student'],
    title: tt(`You called the teacher "mom".`, `Öğretmene "anne" dedin.`),
    text: tt(`It slipped out in front of the whole class. There is a very particular kind of silence.`, `Bütün sınıfın önünde ağzından kaçtı. Çok özel bir tür sessizlik oldu.`),
    choices: [
      opt('bow', [`Take a bow`, `Reverans yap`], (c) =>
        out(c, { hap: 3 }, `You bowed. The teacher laughed and said it happens to everyone, once. The class gave you a round of applause.`, `Reverans yaptın. Öğretmen güldü ve bunun herkesin başına bir kez geldiğini söyledi. Sınıf seni alkışladı.`),
        { tone: 'good' },
      ),
      opt('hide', [`Slide under the desk`, `Sıranın altına kay`], (c) =>
        out(c, { hap: -2 }, `You stayed down there until the bell. A friend slid your lunchbox under the desk after you, which is true friendship.`, `Zile kadar orada kaldın. Bir arkadaşın beslenme çantanı arkandan sıranın altına itti; gerçek arkadaşlık bu.`),
      ),
      opt('home', [`Tell the story at home`, `Eve gidince anlat`], (c) => {
        allParents(c, 3);
        return out(c, { hap: 2 }, `At dinner you acted it out in all the voices. The table laughed until the soup went cold, and it became a story told for years.`, `Akşam yemeğinde bütün sesleriyle canlandırdın. Masa çorba soğuyana kadar güldü ve bu hikâye yıllarca anlatıldı.`);
      }),
    ],
  },
  {
    id: 'base.kd_lunchbox',
    category: 'school',
    minAge: 6,
    maxAge: 10,
    once: true,
    weight: 90,
    needs: ['student'],
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: tt(`The lunchbox swap.`, `Beslenme çantası takası.`),
    text: (c) =>
      c.t(
        `${nmc(c, 'kid')} opens a lunchbox with something you have never seen: a golden triangle with a pattern inside. Yours holds a sandwich. You have had the sandwich every day of your life.`,
        `${nmc(c, 'kid')} beslenme çantasını açıyor, içinde hiç görmediğin bir şey var: içi desenli altın rengi bir üçgen. Seninkinde sandviç var. Hayatın boyunca her gün sandviç yedin.`,
      ),
    choices: [
      opt('swap', [`Swap lunches`, `Yemekleri değiş`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { sma: 2, hap: 3 }, `The mystery triangle tasted of warm cheese and somebody's love. Your sandwich was, to ${nmc(c, 'kid')}, a thrilling foreign dish. You both went home asking for more of each other's.`, `Gizemli üçgen sıcak peynir ve birinin sevgisi gibi tadıyordu. Senin sandviçin ${nmc(c, 'kid', 'dat')} heyecan verici yabancı bir yemekti. İkiniz de eve gidip birbirinizinkinden istediniz.`);
      }, { tone: 'good' }),
      opt('apple', [`Trade your apple for one bite`, `Elmanı bir ısırığa değiş`], (c) =>
        out(c, { hap: 1, sma: 1 }, `You gave a whole apple for one bite, which a business expert would call a loss. It tasted worth it.`, `Bir ısırık için koca bir elma verdin; bir iş uzmanı buna zarar derdi. Ama değdi.`),
      ),
      opt('keep', [`Eat your own and say nothing`, `Kendininkini ye ve sus`], (c) =>
        out(c, { hap: -1 }, `It was a perfectly good sandwich. You looked at the golden triangle for the rest of the afternoon.`, `Gayet iyi bir sandviçti. Öğleden sonranın geri kalanında altın üçgene baktın durdun.`),
      ),
    ],
  },
  {
    id: 'base.kd_library_card',
    category: 'school',
    minAge: 6,
    maxAge: 10,
    once: true,
    weight: 80,
    title: tt(`Your own library card.`, `Kendi kütüphane kartın.`),
    text: tt(`A real card with your name on it, and permission to take home twelve books at once. That may be a lot of power.`, `Üstünde adın yazan gerçek bir kart ve bir seferde on iki kitap götürme izni. Bu biraz fazla güç olabilir.`),
    choices: [
      opt('dino', [`Borrow every dinosaur book`, `Bütün dinozor kitaplarını al`], (c) =>
        out(c, { sma: 3, hap: 2 }, `You returned them on time and could name nine kinds of dinosaur and two ways to say one of them. Your head was a living museum.`, `Hepsini zamanında iade ettin ve dokuz tür dinozorun adını sayabiliyordun, birinin de iki farklı söylenişini. Kafan yaşayan bir müzeydi.`),
        { tone: 'good' },
      ),
      opt('tower', [`Take twelve and read none`, `On iki tane al, hiçbirini okuma`], (c) =>
        out(c, { sma: 1, hap: 2 }, `The stack by your bed became a tower. You read the first page of each, which is technically twelve books started.`, `Yatağının yanındaki yığın kuleye dönüştü. Her birinin ilk sayfasını okudun; yani teknik olarak on iki kitap başladın.`),
      ),
      opt('ask', [`Ask the librarian to recommend one`, `Kütüphaneciden öneri iste`], (c) =>
        out(c, { sma: 3, hap: 3 }, `The librarian placed a book in your hands as if it were treasure. It was. You finished it in a night and went back asking for "another one like that".`, `Kütüphaneci kitabı eline hazine gibi verdi. Hazineydi de. Bir gecede bitirip "bunun gibi bir tane daha" diye geri döndün.`),
      ),
    ],
  },
  {
    id: 'base.kd_first_book',
    category: 'childhood',
    minAge: 6,
    maxAge: 9,
    once: true,
    weight: 80,
    title: tt(`A book with no pictures.`, `Resimsiz bir kitap.`),
    text: tt(`The book on your bed has chapters and only words. You open it, and the first page looks back at you like a wall.`, `Yatağındaki kitabın bölümleri var ve yalnızca yazıdan oluşuyor. Açıyorsun; ilk sayfa sana bir duvar gibi bakıyor.`),
    choices: [
      opt('page', [`Read a page a day`, `Günde bir sayfa oku`], (c) =>
        out(c, { sma: 4, hap: 2 }, `Seventeen days later you closed the last page and felt taller. You started a second book the next morning.`, `On yedi gün sonra son sayfayı kapadın ve boyunun uzadığını hissettin. Ertesi sabah ikinci kitaba başladın.`),
        { tone: 'good' },
      ),
      opt('torch', [`Read under the blanket with a torch`, `Battaniyenin altında el feneriyle oku`], (c) =>
        out(c, { sma: 3, hap: 3, hea: -1 }, `The torch beam trembled over every dragon. You were caught at midnight and the book was confiscated for ten minutes, then returned with a bookmark.`, `Fener ışığı her ejderhanın üstünde titredi. Gece yarısı yakalandın, kitap on dakika boyunca el konuldu, sonra bir ayraçla geri verildi.`),
      ),
      opt('toys', [`Read it aloud to your toys`, `Oyuncaklarına yüksek sesle oku`], (c) =>
        out(c, { sma: 3, hap: 3 }, `Your teddy was a restless listener, but the giraffe never missed a word. By chapter four you were doing all the voices.`, `Ayıcığın huzursuz bir dinleyiciydi ama zürafa tek kelimeyi bile kaçırmadı. Dördüncü bölümde bütün sesleri yapıyordun.`),
      ),
    ],
  },
  {
    id: 'base.kd_handshake',
    category: 'childhood',
    minAge: 6,
    maxAge: 10,
    once: true,
    weight: 90,
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: (c) => c.t(`You and ${nmc(c, 'kid')} need a secret handshake.`, `${nmc(c, 'kid')} ile aranızda gizli bir tokalaşma olmalı.`),
    text: tt(`Every great friendship has one. This one will be nine steps long.`, `Her büyük arkadaşlığın bir tane vardır. Bu dokuz adım sürecek.`),
    choices: [
      opt('long', [`Make it nine steps long`, `Dokuz adım yap`], (c) => {
        befriend(c, 'kid', 65);
        return out(c, { hap: 4, sma: 1 }, `Clap, elbow, wiggle, thumbs, hip bump. It took a week to get right, and the day you did, you high-fived the air.`, `Alkış, dirsek, kıpırdan, başparmaklar, kalça vuruşu. Doğru yapmak bir hafta sürdü ve başardığın gün havaya çak yaptın.`);
      }, { tone: 'good' }),
      opt('word', [`Add a secret word`, `Gizli bir kelime ekle`], (c) => {
        befriend(c, 'kid', 60);
        return out(c, { sma: 2, hap: 3 }, `The word is "pickle". It has been decided that this is a state secret.`, `Kelime "turşu". Bunun devlet sırrı olduğuna karar verildi.`);
      }),
      opt('forget', [`Forget the middle bit`, `Ortasını unut`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 2 }, `You invented a new bit on the spot. The new bit was a sneeze. ${nmc(c, 'kid')} accepted it as official.`, `Ortasını orada uydurdun. Yeni kısım bir hapşırıktı. ${nmc(c, 'kid')} bunu resmî olarak kabul etti.`);
      }),
    ],
  },
  {
    id: 'base.kd_lie_grows',
    category: 'school',
    minAge: 6,
    maxAge: 10,
    once: true,
    weight: 80,
    needs: ['student'],
    title: tt(`Your story got bigger.`, `Hikâyen büyüdü.`),
    text: tt(`You said you had a pony. Then you said it was a fast pony. Now everyone in class wants to come and meet it.`, `Bir midillin olduğunu söyledin. Sonra hızlı bir midilli olduğunu söyledin. Şimdi sınıftaki herkes onu görmek istiyor.`),
    choices: [
      opt('admit', [`Admit there is no pony`, `Midilli olmadığını itiraf et`], (c) =>
        out(c, { sma: 2, hap: 1 }, `There was a pause, then someone said, "I don't have a dragon either." The truth was a relief, and you found out that half the class had a pony-sized story of their own.`, `Bir sessizlik oldu, sonra biri "Benim de ejderham yok," dedi. Gerçek bir rahatlamaydı ve sınıfın yarısının midilli büyüklüğünde kendi hikâyesi olduğunu öğrendin.`),
        { tone: 'good' },
      ),
      opt('shy', [`Say the pony is shy`, `Midillinin utangaç olduğunu söyle`], (c) =>
        out(c, { sma: 1, hap: -2 }, `It worked for a week, then your friends asked for photos. You have been studying pony pictures ever since, just in case.`, `Bir hafta işe yaradı, sonra arkadaşların fotoğraf istedi. O zamandan beri ne olur ne olmaz diye midilli resimlerine çalışıyorsun.`),
      ),
      opt('draw', [`Draw the pony and call it a story`, `Midilliyi çiz, hikâye de`], (c) =>
        out(c, { sma: 3, hap: 3 }, `You drew it with a rainbow tail and read the story aloud. It was a hit, and the first of many. This is, they say, how authors begin.`, `Gökkuşağı kuyruklu çizdin ve hikâyeyi yüksek sesle okudun. Çok tuttu, ilk de değildi son da. Yazarlar işte böyle başlar derler.`),
      ),
    ],
  },
  {
    id: 'base.kd_new_kid',
    category: 'school',
    minAge: 6,
    maxAge: 11,
    once: true,
    weight: 110,
    needs: ['student'],
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: tt(`A new child joins the class.`, `Sınıfa yeni bir öğrenci geldi.`),
    text: (c) =>
      c.t(
        `${nmc(c, 'kid')} stands at the front, holding a bag and looking at the floor. The teacher asks, "Who will sit with ${nmc(c, 'kid')}?"`,
        `${nmc(c, 'kid')} çantasını tutup yere bakarak sınıfın önünde duruyor. Öğretmen soruyor: "${nmc(c, 'kid')} ile kim oturacak?"`,
      ),
    choices: [
      opt('hand', [`Raise your hand`, `Elini kaldır`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 3, sma: 1 }, `You moved your bag, and ${nmc(c, 'kid')} sat down with a relieved face. By lunch you had shown the new arrival where everything is, including the secret of the water fountain.`, `Çantanı kaldırdın, ${nmc(c, 'kid')} rahatlamış bir yüzle oturdu. Öğle yemeğine kadar her şeyin yerini, su çeşmesinin sırrı dahil, yeni gelene gösterdin.`);
      }, { tone: 'good' }),
      opt('wave', [`Give a small wave`, `Küçük bir el salla`], (c) => {
        befriend(c, 'kid', 40);
        return out(c, { hap: 2 }, `It was only a small wave, but it was seen. At the end of the day a shy wave came back.`, `Sadece küçük bir el sallamaydı ama görüldü. Günün sonunda utangaç bir el sallama geri geldi.`);
      }),
      opt('desk', [`Look hard at your desk`, `Sıranı dikkatle incele`], (c) =>
        out(c, { hap: -2, sma: 1 }, `Someone else raised a hand. You felt a bit bad all day, and decided that tomorrow you would say hello first.`, `Başka biri elini kaldırdı. Bütün gün biraz kötü hissettin ve yarın ilk önce senin merhaba diyeceğine karar verdin.`),
      ),
    ],
  },
  {
    id: 'base.kd_bad_haircut',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 130,
    needs: ['parent'],
    setup: pp,
    title: tt(`The haircut went wrong.`, `Saç kesimi fena gitti.`),
    text: tt(`The barber said "just a trim", and then the scissors went somewhere dark. What the mirror shows is, at best, interesting.`, `Berber "sadece biraz düzeltme" dedi, sonra makas karanlık bir yere gitti. Aynadaki görüntü en iyi ihtimalle ilginç.`),
    choices: [
      opt('hat', [`Wear a hat for three weeks`, `Üç hafta şapka tak`], (c) =>
        out(c, { loo: -1, hap: -1 }, `The hat became your personality. By week three people had forgotten you had hair under it.`, `Şapka kişiliğin oldu. Üçüncü haftada insanlar altında saç olduğunu unuttu.`),
      ),
      opt('own', [`Own it`, `Sahip çık`], (c) =>
        out(c, { hap: 3, loo: 1 }, `You strutted into school like a model. Nobody dared to say a word, and by Friday two other kids asked who had done it.`, `Okula bir model gibi çalımlı girdin. Kimse tek laf etmeye cesaret edemedi, cumaya iki çocuk bunu kimin yaptığını sordu.`),
        { tone: 'good' },
      ),
      opt('laugh', (c) => c.t(`Laugh about it with ${kw(c, 'par')}`, `${Kw(c, 'par', 'wth')} birlikte gül`), (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 2 }, `You looked in the mirror together and could not stop. It grew back in six weeks. The photograph is permanent.`, `Aynaya birlikte bakıp bir türlü duramadınız. Saçın altı haftada çıktı. Fotoğraf kalıcı.`);
      }),
    ],
  },

  // ================================================================ 7-12: the older years
  {
    id: 'base.kd_screen_time',
    category: 'family',
    minAge: 7,
    maxAge: 12,
    maxPerLife: 2,
    cooldown: 3,
    weight: 130,
    needs: ['parent'],
    setup: pp,
    title: tt(`The screen-time negotiation.`, `Ekran süresi pazarlığı.`),
    text: (c) =>
      c.t(
        `${P(c)} holds out a hand for the tablet. You have prepared a speech.`,
        `${P(c)} tablet için elini uzatıyor. Hazırladığın bir konuşma var.`,
      ),
    choices: [
      opt('deal', [`Offer a deal: tidy up first`, `Anlaşma öner: önce topla`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 2, hap: 1 }, `A contract was drawn up in crayon. You tidied for twenty minutes and earned thirty. Everyone was surprisingly happy.`, `Bir sözleşme mum boyayla yazıldı. Yirmi dakika toparladın, otuz dakika kazandın. Herkes şaşırtıcı derecede memnundu.`);
      }, { tone: 'good' }),
      opt('sneak', [`Keep playing under the blanket`, `Battaniyenin altında oynamaya devam et`], (c) => {
        near(c, 'par', -3);
        return out(c, { hap: 1, hea: -2 }, `The glow gave you away within eight minutes. The tablet is now in a very high cupboard for the weekend.`, `Işık sekiz dakikada seni ele verdi. Tablet hafta sonu boyunca çok yüksek bir dolapta.`);
      }),
      opt('outside', [`Hand it over and go outside`, `Teslim et ve dışarı çık`], (c) => {
        near(c, 'par', 2);
        return out(c, { hea: 3, hap: 3 }, `The garden had a stick, a puddle and a snail, which is more than the screen had. By dinner you were muddy and starving.`, `Bahçede bir sopa, bir su birikintisi ve bir salyangoz vardı; ekranda bunlar yoktu. Akşam yemeğinde çamur içinde ve açlıktan ölüyordun.`);
      }),
    ],
  },
  {
    id: 'base.kd_chore_chart',
    category: 'family',
    minAge: 6,
    maxAge: 12,
    maxPerLife: 2,
    cooldown: 3,
    weight: 130,
    needs: ['parent'],
    setup: pp,
    title: tt(`The chore chart.`, `İş çizelgesi.`),
    text: (c) =>
      c.t(
        `${P(c)} has stuck a colourful chart on the fridge. Each job earns a star, and every ten stars earn a little pocket money.`,
        `${P(c)} buzdolabına rengârenk bir çizelge yapıştırdı. Her iş bir yıldız, her on yıldız biraz harçlık getiriyor.`,
      ),
    choices: [
      opt('all', [`Do every job, every day`, `Her işi her gün yap`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: -1, usd: 3 }, `Dishes, bed, plants. You were the most reliable worker in the house, and the stars were gold. You counted the money in a jar every night.`, `Bulaşık, yatak, bitkiler. Evin en güvenilir işçisiydin ve yıldızlar altındı. Parayı her gece kavanozda sayıyordun.`);
      }, { tone: 'good' }),
      opt('bargain', [`Bargain for double stars`, `Çift yıldız için pazarlık yap`], (c) =>
        out(c, { sma: 2, usd: 1 }, `You argued that making your bed twice counts twice. You lost the case and learned the word "precedent".`, `Yatağı iki kez toplamanın iki kez sayılması gerektiğini savundun. Davayı kaybettin ve "emsal" kelimesini öğrendin.`),
      ),
      opt('cheat', [`Stick extra stars on yourself`, `Kendine fazladan yıldız yapıştır`], (c) => {
        near(c, 'par', -3);
        return out(c, { hap: -1 }, `The chart looked like the night sky, which was noticed. You earned the stars back the honest way, with a mop.`, `Çizelge gece gökyüzü gibi görünüyordu ve bu fark edildi. Yıldızları dürüst yoldan, bir paspasla geri kazandın.`);
      }),
    ],
  },
  {
    id: 'base.kd_sports_day',
    category: 'school',
    minAge: 7,
    maxAge: 12,
    once: true,
    weight: 150,
    needs: ['student'],
    title: tt(`Sports day: the egg-and-spoon race.`, `Spor günü: yumurta taşıma yarışı.`),
    text: tt(`You are in the final. The egg is hard-boiled. The spoon is not.`, `Finaldesin. Yumurta haşlanmış. Kaşık değil.`),
    choices: [
      opt('careful', [`Walk very carefully`, `Çok dikkatli yürü`], (c) =>
        out(c, { sma: 1, hap: 3 }, `You came last, but with your egg still on the spoon, and the crowd applauded the most dignified finish ever seen.`, `Sonuncu geldin ama yumurtan hâlâ kaşıktaydı ve kalabalık görülmüş en vakur bitişi alkışladı.`),
        { tone: 'good' },
      ),
      opt('run', [`Run as fast as you can`, `Olabildiğince hızlı koş`], (c) =>
        out(c, { hea: 2, hap: 2 }, `The egg flew into the air at the second bend. You caught it with your other hand, and nobody can prove that was illegal. Third place!`, `Yumurta ikinci virajda havaya uçtu. Öbür elinle yakaladın ve bunun yasadışı olduğunu kimse kanıtlayamaz. Üçüncülük!`),
      ),
      opt('help', [`Stop to help a runner who fell`, `Düşen yarışmacıya yardım için dur`], (c) =>
        out(c, { hap: 3, sma: 1 }, `You picked up their egg and the two of you walked the last stretch together. The crowd cheered louder than for the winner.`, `Onun yumurtasını aldın ve son kısmı birlikte yürüdünüz. Kalabalık kazanan için olduğundan daha çok alkışladı.`),
        { tone: 'good' },
      ),
    ],
  },
  {
    id: 'base.kd_name_calling',
    category: 'school',
    minAge: 7,
    maxAge: 11,
    once: true,
    weight: 130,
    needs: ['student'],
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: (c) => c.t(`Someone is teasing ${nmc(c, 'kid')}.`, `Biri ${nmc(c, 'kid', 'acc')} kızdırıyor.`),
    text: (c) =>
      c.t(
        `A boy in your class keeps calling ${nmc(c, 'kid')} "Shrimp" for being the smallest. ${nmc(c, 'kid')} pretends not to hear.`,
        `Sınıftaki bir çocuk, en ufak olduğu için ${nmc(c, 'kid', 'acc')} "Bücür" diye çağırıp duruyor. ${nmc(c, 'kid')} duymazdan geliyor.`,
      ),
    choices: [
      opt('sit', [`Sit next to them at lunch`, `Öğle yemeğinde yanlarına otur`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 3, sma: 1 }, `You sat down and said nothing about it. After a minute the teaser drifted over too, bored. The three of you ended up arguing about spaceships.`, `Oturdun ve konuyu hiç açmadın. Bir dakika sonra, sıkılmış olan kızdırıcı da yanınıza geldi. Üçünüz uzay gemileri üzerine tartışırken buldunuz kendinizi.`);
      }, { tone: 'good' }),
      opt('speak', [`Say "that is not funny" calmly`, `Sakince "Bu komik değil" de`], (c) => {
        befriend(c, 'kid', 50);
        return out(c, { sma: 2, hap: 2 }, `You said it once, quietly, and it worked better than a shout. The teasing stopped, for now, and ${nmc(c, 'kid')} gave you half a smile.`, `Bir kez, sakince söyledin ve bağırmaktan daha iyi işe yaradı. Kızdırma şimdilik durdu ve ${nmc(c, 'kid')} sana yarım bir gülümseme verdi.`);
      }),
      opt('teacher', [`Tell the teacher`, `Öğretmene söyle`], (c) =>
        out(c, { hap: 1, sma: 1 }, `The teacher had a quiet word, and the teasing stopped by Friday. Telling is not tale-telling when it is kindness, the teacher said.`, `Öğretmen sessizce konuştu ve kızdırma cumaya kadar bitti. Nezaketle söylemek ispiyonculuk değildir, dedi öğretmen.`),
      ),
    ],
  },
  {
    id: 'base.kd_spelling_bee',
    category: 'school',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 150,
    needs: ['student'],
    title: tt(`The spelling bee final.`, `Yazım yarışması finali.`),
    text: (c) =>
      c.t(`Your word is "necessary". Your knees have turned to jelly.`, `Kelimen "yüzyıl". Dizlerin jöle gibi oldu.`),
    choices: [
      opt('slow', [`Say each letter slowly`, `Her harfi yavaşça söyle`], (c) =>
        out(c, { sma: 3, hap: 3 }, `A pause. A bell. Correct! The hall shook with applause and you beat the last speller by one word.`, `Bir sessizlik. Bir zil. Doğru! Salon alkıştan inledi ve son rakibini bir kelimeyle geçtin.`),
        { tone: 'good' },
      ),
      opt('guess', [`Guess and hope`, `Tahmin et ve dile`], (c) =>
        gamble(
          c,
          0.5,
          (c) => out(c, { sma: 2, hap: 4 }, `You guessed. You were right. Nobody in the hall will ever know how close that was.`, `Tahmin ettin. Haklıydın. Salondaki hiç kimse bunun ne kadar yakın olduğunu asla bilemeyecek.`),
          (c) => out(c, { sma: 1, hap: -1 }, `You wrote one extra letter in the air and the bell rang. It is a very common word, and you will never miss it again.`, `Havaya fazladan bir harf yazdın ve zil çaldı. Çok yaygın bir kelime ve bir daha asla yanlış yazmayacaksın.`),
        ),
        { badge: 'Risky' },
      ),
      opt('sentence', [`Ask for it in a sentence`, `Cümle içinde kullanılmasını iste`], (c) =>
        out(c, { sma: 2, hap: 2 }, `"Necessary," said the judge, "as in: it is necessary to have a snack." You laughed, and spelled it right.`, `"Yüzyıl," dedi jüri, "cümle içinde: bir yüzyıl bekledim ama değdi." Güldün ve doğru heceledin.`),
      ),
    ],
  },
  {
    id: 'base.kd_science_fair',
    category: 'school',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 150,
    needs: ['student'],
    title: tt(`The science fair.`, `Bilim fuarı.`),
    text: tt(`Your question: do plants grow better if you sing to them? You have six pots, a notebook and one very patient bean.`, `Sorun: Bitkilere şarkı söylersen daha iyi büyürler mi? Altı saksın, bir defterin ve çok sabırlı bir fasulyen var.`),
    choices: [
      opt('honest', [`Report exactly what happened`, `Tam olarak olanı yaz`], (c) =>
        out(c, { sma: 4, hap: 2 }, `The singing beans grew a little taller, but the quiet beans were greener. Your poster said "inconclusive". The judge read it twice and gave you a ribbon for honesty.`, `Şarkı söylenen fasulyeler biraz daha uzadı ama sessiz olanlar daha yeşildi. Posterinde "sonuçsuz" yazıyordu. Jüri iki kez okudu ve dürüstlüğün için sana bir kurdele verdi.`),
        { tone: 'good' },
      ),
      opt('tweak', [`Measure the singing beans a bit taller`, `Şarkı söyleyenleri biraz uzun ölç`], (c) =>
        out(c, { sma: 1, hap: -2 }, `A slightly taller bean won you a smaller ribbon and the judge's raised eyebrow. You decided that next time you would rather be right than tall.`, `Biraz uzun bir fasulye sana daha küçük bir kurdele ve jürinin kalkmış kaşını kazandırdı. Bir dahaki sefere uzun olmaktansa haklı olmayı yeğlemeye karar verdin.`),
      ),
      opt('colour', [`Make the poster extremely colourful`, `Posteri çok renkli yap`], (c) =>
        out(c, { hap: 3, sma: 2 }, `Nobody understood the graph, but everyone loved the sun in the corner. You won "Best Presentation" and sang to the visitors as well.`, `Grafiği kimse anlamadı ama köşedeki güneşi herkes sevdi. "En İyi Sunum" ödülünü aldın ve ziyaretçilere de şarkı söyledin.`),
      ),
    ],
  },
  {
    id: 'base.kd_crush_partner',
    category: 'love',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 130,
    needs: ['student'],
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: (c) => c.t(`You are paired with ${nmc(c, 'kid')} for a project.`, `Proje için ${nmc(c, 'kid')} ile eşleştirildin.`),
    text: (c) =>
      c.t(
        `${nmc(c, 'kid')} is the one you have been secretly looking at since September. Your ears have just changed colour.`,
        `${nmc(c, 'kid')}, eylülden beri gizlice baktığın kişi. Kulakların az önce renk değiştirdi.`,
      ),
    choices: [
      opt('normal', [`Be your normal self`, `Kendin gibi ol`], (c) => {
        befriend(c, 'kid', 60);
        return out(c, { hap: 3, sma: 1 }, `You laughed at the same jokes. The project got top marks and your ears went back to normal. Mostly.`, `Aynı şakalara güldünüz. Proje tam not aldı ve kulakların normale döndü. Neredeyse.`);
      }, { tone: 'good' }),
      opt('red', [`Say nothing and go very red`, `Hiç konuşma, kıpkırmızı ol`], (c) => {
        befriend(c, 'kid', 40);
        return out(c, { hap: 1 }, `You communicated entirely by nodding. Somehow the project got done, and ${nmc(c, 'kid')} said "See you tomorrow" as if it were an ordinary day. You held on to those words.`, `Tamamen başını sallayarak anlaştın. Proje bir şekilde bitti ve ${nmc(c, 'kid')} "Yarın görüşürüz" dedi, sanki sıradan bir gündü. O sözlere sarıldın.`);
      }),
      opt('swap', [`Ask the teacher to swap partners`, `Öğretmenden eş değiştirmeyi iste`], (c) =>
        out(c, { hap: -1, sma: 1 }, `You were safe, and a little disappointed. Your new partner liked trains, which you discovered you like too.`, `Güvendeydin ve biraz hayal kırıklığına uğradın. Yeni eşin trenleri seviyordu, sen de sevdiğini fark ettin.`),
      ),
    ],
  },
  {
    id: 'base.kd_grand_recipe',
    category: 'family',
    minAge: 7,
    maxAge: 12,
    once: true,
    weight: 140,
    needs: ['grandparent'],
    setup: (c) => pickGrand(c, 'gp'),
    title: (c) => c.t(`${Kw(c, 'gp')} teaches you the family soup.`, `${Kw(c, 'gp')} sana ailenin çorbasını öğretiyor.`),
    text: (c) =>
      c.t(
        `Nobody ever wrote the recipe down properly. ${Kw(c, 'gp')} says: "You do not measure it. You feel it." You have no idea how to feel a spoonful.`,
        `Tarifi kimse düzgünce yazmamış. ${Kw(c, 'gp')} diyor ki: "Ölçmezsin, hissedersin." Bir kaşık dolusunu nasıl hissedeceğini bilmiyorsun.`,
      ),
    choices: [
      opt('taste', [`Stir, taste, repeat`, `Karıştır, tat, tekrarla`], (c) => {
        near(c, 'gp', 6);
        return out(c, { sma: 2, hap: 3 }, `On the sixth taste you added a pinch of salt without being told. A nod. You had just passed a test you did not know you were taking.`, `Altıncı tatta kimse söylemeden bir tutam tuz kattın. Bir baş sallama. Girdiğini bilmediğin bir sınavı geçmiştin.`);
      }, { tone: 'good' }),
      opt('write', [`Write it all down`, `Hepsini deftere yaz`], (c) => {
        near(c, 'gp', 4);
        return out(c, { sma: 3, hap: 2 }, `You wrote "a handful", "until it smells right" and "a bit more". It was the worst recipe ever written, and it has since become a treasure.`, `"Bir avuç", "kokusu tam olana kadar" ve "biraz daha" diye yazdın. Şimdiye kadar yazılmış en kötü tarifti ve o günden beri bir hazine oldu.`);
      }),
      opt('carrots', [`Eat the carrots when nobody is looking`, `Kimse bakmazken havuçları ye`], (c) => {
        near(c, 'gp', 1);
        return out(c, { hap: 2 }, `The soup was one carrot short. Nobody mentioned it, and it tasted better anyway, because of the secret.`, `Çorba bir havuç eksik kaldı. Kimse bundan söz etmedi ve yine de daha lezzetliydi; sır yüzünden.`);
      }),
    ],
  },
  {
    id: 'base.kd_parent_recipe',
    category: 'family',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 130,
    needs: ['parent'],
    setup: pp,
    title: (c) => c.t(`${P(c)} lets you help with the family cake.`, `${P(c)} aile pastasında yardım etmene izin veriyor.`),
    text: tt(`There is a stained card with the recipe on it. Flour is already everywhere, and the oven is not even on.`, `Üstünde tarif yazan lekeli bir kart var. Un şimdiden her yerde, fırın daha açılmadı bile.`),
    choices: [
      opt('crack', [`Crack the eggs`, `Yumurtaları kır`], (c) => {
        near(c, 'par', 3);
        return out(c, { hap: 3, sma: 1 }, `Two eggs went in, one shell went in, and one egg went on the floor, where it stayed. "Perfect," said the cook, fishing out the shell.`, `İki yumurta girdi, bir kabuk girdi, bir yumurta da yere düşüp orada kaldı. "Mükemmel," dedi aşçı, kabuğu çıkarırken.`);
      }),
      opt('lick', [`Lick the spoon`, `Kaşığı yala`], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 4, hea: -1 }, `A quality check of the highest order. The cake needed another one.`, `En üst düzeyde bir kalite kontrolü. Pasta bir tane daha gerektirdi.`);
      }),
      opt('read', [`Read the recipe out loud`, `Tarifi yüksek sesle oku`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 3, hap: 1 }, `You read "teaspoon" as "tablespoon" and the cake rose like a hat. It was a bit tall, a bit sweet and eaten by dinner.`, `"Çay kaşığı"nı "yemek kaşığı" diye okudun ve pasta bir şapka gibi kabardı. Biraz uzun, biraz tatlıydı ve akşama kadar bitti.`);
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.kd_new_baby',
    category: 'family',
    minAge: 3,
    maxAge: 9,
    once: true,
    weight: 110,
    needs: ['parent'],
    when: (c) => {
      const mum = c.h.relatives('mother').filter((r) => !r.rel.step)[0];
      return !!mum && c.h.ageOf(mum.person) <= 41 && siblingsOf(c).length < 3;
    },
    title: tt(`A new baby in the house.`, `Evde yeni bir bebek var.`),
    text: tt(`Somebody very small and very loud has arrived, and everybody is whispering. Your family is a little bigger today.`, `Çok küçük ve çok gürültülü biri geldi, herkes fısıldıyor. Ailen bugün biraz daha büyük.`),
    choices: [
      opt('hold', [`Ask to hold the baby`, `Bebeği kucağına almak iste`], (c) => {
        const baby = c.h.newPerson({ age: 0, lastName: c.p.lastName });
        c.h.addRelation(baby, 'sibling', 75);
        allParents(c, 3);
        return out(c, { hap: 3 }, `You sat very still with your arms like a nest. ${baby.firstName} gripped your finger with the strength of a tiny crane, and you decided on the spot to protect the baby forever.`, `Kollarını bir yuva gibi açıp çok kıpırdamadan oturdun. ${baby.firstName} parmağını küçücük bir vinç gücüyle kavradı ve bebeği sonsuza kadar koruyacağına orada karar verdin.`);
      }, { tone: 'good' }),
      opt('gift', [`Give the baby your second-best toy`, `Bebeğe ikinci en iyi oyuncağını ver`], (c) => {
        const baby = c.h.newPerson({ age: 0, lastName: c.p.lastName });
        c.h.addRelation(baby, 'sibling', 70);
        allParents(c, 2);
        return out(c, { hap: 2 }, `The best toy stays under your own pillow, obviously. ${baby.firstName} threw the gift at once, which you were told is a sign of love.`, `En iyi oyuncak elbette yastığının altında kalıyor. ${baby.firstName} hediyeyi hemen fırlattı; sana bunun sevgi işareti olduğu söylendi.`);
      }),
      opt('sulk', [`Sulk behind the sofa`, `Koltuğun arkasında surat as`], (c) => {
        const baby = c.h.newPerson({ age: 0, lastName: c.p.lastName });
        c.h.addRelation(baby, 'sibling', 55);
        allParents(c, 3);
        return out(c, { hap: -1 }, `After a while a small hand and a big hand drew you out together. You were told that you are still the first, always, and given the important job of "big one".`, `Bir süre sonra küçük bir el ve büyük bir el seni birlikte dışarı çekti. Sana hâlâ ilk olduğun ve hep öyle kalacağın söylendi, bir de "büyük olan" olmanın önemli görevi verildi.`);
      }),
    ],
  },

  {
    id: 'base.kd_first_phone',
    category: 'family',
    minAge: 9,
    maxAge: 12,
    once: true,
    weight: 120,
    needs: ['parent'],
    setup: pp,
    title: tt(`Your first phone.`, `İlk telefonun.`),
    text: (c) =>
      c.t(
        `${P(c)} hands you a small phone with exactly three rules, and says it is for emergencies.`,
        `${P(c)} sana tam üç kuralı olan küçük bir telefon veriyor ve bunun acil durumlar için olduğunu söylüyor.`,
      ),
    choices: [
      opt('emergency', [`Keep it for emergencies`, `Sadece acil durumlar için tut`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: 1 }, `Your first call was from the school gate: "I'm here." Your parent read the message three times.`, `İlk aramanı okul kapısından yaptın: "Geldim." Ebeveynin mesajı üç kez okudu.`);
      }, { tone: 'good' }),
      opt('everyone', [`Call everyone you know`, `Tanıdığın herkesi ara`], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 3 }, `You called nine people, including a wrong number that turned out to be very friendly. The three rules were read to you again.`, `Dokuz kişiyi aradın; çok sevecen çıkan bir yanlış numara da dahil. Üç kural sana yeniden okundu.`);
      }),
      opt('photos', [`Take eighty photos of your shoes`, `Ayakkabılarının seksen fotoğrafını çek`], (c) =>
        out(c, { hap: 3, sma: 1 }, `Eighty photos of your own shoes from every angle. Two of them were great. Do not ask which.`, `Kendi ayakkabılarının her açıdan seksen fotoğrafı. İkisi harikaydı. Hangileri olduğunu sorma.`),
      ),
    ],
  },
  {
    id: 'base.kd_group_project',
    category: 'school',
    minAge: 9,
    maxAge: 12,
    once: true,
    weight: 120,
    needs: ['student'],
    setup: (c) => {
      newKid(c, 'kid', 1);
    },
    title: tt(`A group project, and one member is missing.`, `Bir grup projesi var ve ekipten biri ortada yok.`),
    text: (c) =>
      c.t(
        `${nmc(c, 'kid')} promised to bring the glue, the poster and the idea. ${nmc(c, 'kid')} has brought nothing but a smile.`,
        `${nmc(c, 'kid')} yapıştırıcıyı, posteri ve fikri getireceğine söz vermişti. Getirdiği tek şey bir gülümseme.`,
      ),
    choices: [
      opt('alone', [`Do it all yourself`, `Hepsini kendin yap`], (c) =>
        out(c, { sma: 2, hap: -2 }, `The project was excellent and your wrists were worn out. You learned that doing it all is a trap with a good grade on it.`, `Proje mükemmeldi, bileklerin yorgundu. Her şeyi yapmanın, iyi not taşıyan bir tuzak olduğunu öğrendin.`),
      ),
      opt('ask', [`Ask what they would like to do`, `Ne yapmak istediğini sor`], (c) => {
        befriend(c, 'kid', 55);
        return out(c, { hap: 3, sma: 1 }, `It turned out ${nmc(c, 'kid')} draws brilliantly and is terrified of speaking. You split the job in half and shook on it. The poster ended up on the wall.`, `${nmc(c, 'kid')} harika çiziyor ama konuşmaktan ölesiye korkuyormuş. İşi yarı yarıya bölüp el sıkıştınız. Poster duvara asıldı.`);
      }, { tone: 'good' }),
      opt('teacher', [`Tell the teacher quietly`, `Öğretmene sessizce söyle`], (c) =>
        out(c, { sma: 1, hap: 1 }, `The teacher had a quiet chat, and the glue appeared on Thursday as if by magic.`, `Öğretmen sessizce konuştu ve yapıştırıcı perşembe günü sihirli bir şekilde ortaya çıktı.`),
      ),
    ],
  },
  {
    id: 'base.kd_in_charge',
    category: 'family',
    minAge: 8,
    maxAge: 12,
    once: true,
    weight: 250,
    needs: ['sibling'],
    when: (c) => littleSiblings(c).length > 0,
    setup: (c) => {
      const ss = littleSiblings(c);
      if (ss.length) c.vars.sib = c.rng.pick(ss).person.id;
    },
    title: (c) => c.t(`You are in charge of ${nmc(c, 'sib')} for half an hour.`, `Yarım saat boyunca ${nmc(c, 'sib', 'gen')} sorumluluğu sende.`),
    text: (c) =>
      c.t(
        `The grown-ups have popped out. The rules: no cooking, no scissors, no adventures. ${nmc(c, 'sib')} is staring at the wardrobe.`,
        `Büyükler bir işe çıktı. Kurallar: yemek yok, makas yok, macera yok. ${nmc(c, 'sib')} dolaba bakıyor.`,
      ),
    choices: [
      opt('story', [`Read a story`, `Hikâye oku`], (c) => {
        near(c, 'sib', 5);
        return out(c, { sma: 1, hap: 2 }, `Half an hour of dragons and one very long voice for the giant. When the door opened, ${nmc(c, 'sib')} was asleep on your arm.`, `Yarım saat ejderhalar ve dev için çok uzun bir ses. Kapı açıldığında ${nmc(c, 'sib')} kolunun üstünde uyuyordu.`);
      }, { tone: 'good' }),
      opt('fort', [`Build a blanket fort`, `Battaniyeden kale yap`], (c) => {
        near(c, 'sib', 4);
        return out(c, { hap: 4 }, `The fort had two floors and a password. The grown-ups had to say it to get in. Nothing was broken, apart from the sofa's dignity.`, `Kalenin iki katı ve bir şifresi vardı. Büyükler girmek için şifreyi söylemek zorunda kaldı. Koltuğun onuru dışında hiçbir şey kırılmadı.`);
      }),
      opt('bribe', [`Bribe them with biscuits`, `Bisküviyle ikna et`], (c) => {
        near(c, 'sib', 1);
        return out(c, { hap: 1, hea: -1 }, `It worked, at a cost of eleven biscuits. You are now an expert in economics and crumbs.`, `İşe yaradı; bedeli on bir bisküviydi. Artık ekonomi ve kırıntı uzmanısın.`);
      }),
    ],
  },
  {
    id: 'base.kd_cook_dinner',
    category: 'family',
    minAge: 9,
    maxAge: 12,
    once: true,
    weight: 110,
    needs: ['parent'],
    setup: pp,
    title: tt(`You cook dinner for the family.`, `Aileye akşam yemeği pişiriyorsun.`),
    text: (c) =>
      c.t(
        `${P(c)} sits on a chair in the kitchen and promises not to say a word. Tonight you make dinner. The menu is eggs.`,
        `${P(c)} mutfakta bir sandalyeye oturup tek kelime etmeyeceğine söz veriyor. Bu akşam yemeği sen yapıyorsun. Menü: yumurta.`,
      ),
    choices: [
      opt('steps', [`Follow the steps exactly`, `Adımları aynen izle`], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 3, hap: 2 }, `Soft yolks, no shells, a clean pan. Your parent clapped, then ate in respectful silence.`, `Yumuşak sarılar, kabuk yok, temiz bir tava. Ebeveynin alkışladı, sonra saygılı bir sessizlikle yedi.`);
      }, { tone: 'good' }),
      opt('fridge', [`Add everything in the fridge`, `Buzdolabındaki her şeyi ekle`], (c) =>
        out(c, { hap: 3, sma: 1, hea: -1 }, `The omelette had cheese, a tomato, three olives and a pickle. It was ugly and it was gone in minutes.`, `Omlette peynir, bir domates, üç zeytin ve bir salatalık turşusu vardı. Çirkindi ve dakikalar içinde bitti.`),
      ),
      opt('song', [`Get lost in a song`, `Bir şarkıya dal`], (c) => {
        near(c, 'par', 1);
        return out(c, { hap: 1 }, `The eggs got a very deep tan. You served them as "smoky". Your parent ate every black bit and called it "bold".`, `Yumurtalar çok koyu bir bronzluk edindi. Onları "isli" diye servis ettin. Ebeveynin her siyah parçayı yedi ve "cesur" dedi.`);
      }),
    ],
  },
];
