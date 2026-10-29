import type { Ctx, EventDef } from '../types';
import { acc, cap, dat, gen, wage, wth } from './util';
import { byCountry, he, him, his, inTr, thinWalls, trHome } from './events-flavour';
import { say, type Pair } from './lines';
import { T, ch, num, nmv, pv, noMourn, pickKid, hasKidAged, afford, partnered, setPartner } from './adult-kit';

// Round 4, ages 25+: raising children, from sleepless newborns to grown-ups who move back home.
// Every event picks one child of the right age (vars.pid) and talks about that child.

const kid = (c: Ctx) => nmv(c);
const kidId = (c: Ctx) => String(c.vars.pid);

/** "she" / "he" for the child (English only). */
const sheHe = (c: Ctx) => he(pv(c));
const herHim = (c: Ctx) => him(pv(c));
const herHis = (c: Ctx) => his(pv(c));

/** A parenting event for one child aged lo..hi. */
function kidEvent(id: string, lo: number, hi: number, def: Omit<EventDef, 'id' | 'category' | 'setup'> & { setup?: (c: Ctx) => void; category?: EventDef['category'] }): EventDef {
  const extra = def.setup;
  const when = def.when;
  return {
    category: 'family',
    minAge: 20,
    once: true,
    weight: 6,
    ...def,
    id,
    when: (c) => hasKidAged(lo, hi)(c) && (when ? when(c) : true),
    setup: (c) => {
      pickKid(c, lo, hi);
      extra?.(c);
    },
  };
}

const NEWBORN_SHIFTS: Pair[] = [
  ['You took night shifts in turns. You learned to sleep standing up, like a horse.', 'Gece nöbetlerini sırayla tuttunuz. At gibi ayakta uyumayı öğrendin.'],
  ['You did shifts. At one point you tried to put the baby in the fridge and the milk in the cot. Nobody was harmed.', 'Nöbetleşe baktınız. Bir ara bebeği buzdolabına, sütü beşiğe koymaya çalıştın. Kimseye bir şey olmadı.'],
];

export const parentingEvents: EventDef[] = [
  kidEvent('base.ad_newborn_nights', 0, 1, {
    title: (c) => c.t(`Baby ${kid(c)} has not slept more than two hours at a time in a month.`, `Bebek ${kid(c)} bir aydır iki saatten fazla aralıksız uyumadı.`),
    text: T('Neither have you. You recently said "thank you" to a lamp post.', 'Sen de. Geçenlerde bir sokak lambasına "teşekkür ederim" dedin.'),
    choices: [
      ch('shifts', 'Take turns at night', 'Geceleri nöbetleşin', (c) => {
        c.h.stat('health', -2);
        c.h.closeness(kidId(c), 4);
        return say(c, 'ad_newborn.shifts', NEWBORN_SHIFTS);
      }),
      ch('expert', 'Pay a sleep consultant', 'Bir uyku danışmanı tut', (c) => {
        c.h.money(-wage(c, 600));
        if (c.rng.chance(0.6)) {
          c.h.stat('health', 3);
          return c.t(`The consultant whispered something to ${kid(c)}. ${cap(sheHe(c))} slept eleven hours. You cried with relief.`, `Danışman ${dat(kid(c))} bir şeyler fısıldadı. On bir saat uyudu. Rahatlamaktan ağladın.`);
        }
        return c.t('The consultant gave you a binder of charts. The baby ate the binder.', 'Danışman sana tablolarla dolu bir dosya verdi. Bebek dosyayı yedi.');
      }),
      ch('noise', 'Try a white-noise app', 'Beyaz gürültü uygulaması dene', (c) => {
        c.h.stat('health', 1);
        return c.t(`The app plays the sound of a hairdryer. ${kid(c)} sleeps. So do you, and so does the dog.`, `Uygulama saç kurutma makinesi sesi çalıyor. ${kid(c)} uyuyor. Sen de; köpek de.`);
      }),
    ],
  }),

  kidEvent('base.ad_first_word', 1, 2, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} has said a first word.`, `${kid(c)} ilk kelimesini söyledi.`),
    text: (c) => byCountry(c, { tr: c.t('It was "no".', '"Hayır" oldu.'), other: c.t('It was "no".', '"Hayır" oldu.') }),
    choices: [
      ch('celebrate', 'Celebrate anyway', 'Yine de kutla', (c) => {
        c.h.stat('happiness', 4);
        c.h.closeness(kidId(c), 4);
        return c.t(`You threw a tiny party. ${kid(c)} said "no" to the cake, the hat and the party.`, `Minicik bir parti verdin. ${kid(c)} pastaya, şapkaya ve partiye "hayır" dedi.`);
      }, { tone: 'good' }),
      ch('teach', 'Drill "mama" and "papa"', '"Anne" ve "baba" çalıştır', (c) => {
        c.h.closeness(kidId(c), 2);
        return c.t(`After a week of drills, ${kid(c)} said the cat's name instead. The cat was unmoved.`, `Bir haftalık çalışmanın ardından ${kid(c)} kedinin adını söyledi. Kedi hiç oralı olmadı.`);
      }),
      ch('film', 'Film everything from now on', 'Bundan sonra her şeyi kaydet', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You now have four hundred videos of a toddler saying "no". You will show them at the wedding.', 'Artık "hayır" diyen bir bebeğin dört yüz videosu var elinde. Düğünde göstereceksin.');
      }),
    ],
  }),

  kidEvent('base.ad_supermarket_meltdown', 2, 5, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} is lying face down in the supermarket, screaming.`, `${kid(c)} markette yüzüstü yatmış, avazı çıktığı kadar bağırıyor.`),
    text: T('The cause: you said no to a chocolate egg. The audience: everyone.', 'Sebep: çikolatalı yumurtaya "hayır" demen. Seyirci: herkes.'),
    choices: [
      ch('calm', 'Kneel down and wait it out', 'Diz çök ve geçmesini bekle', (c) => {
        c.h.closeness(kidId(c), 3);
        c.h.stat('happiness', -1);
        return c.t('You knelt in aisle four for eleven minutes. An old lady gave you a thumbs up. You will remember her forever.', 'Dördüncü reyonda on bir dakika diz çöktün. Yaşlı bir kadın sana başparmağını kaldırdı. Onu hiç unutmayacaksın.');
      }, { tone: 'good' }),
      ch('cave', 'Buy the chocolate egg', 'Çikolatalı yumurtayı al', (c) => {
        c.h.money(-wage(c, 2));
        return c.t(`The screaming stopped at once. ${kid(c)} has learned something. So have you, and it is worse.`, `Çığlıklar anında kesildi. ${kid(c)} bir şey öğrendi. Sen de öğrendin ve seninki daha kötü.`);
      }),
      ch('carry', 'Carry them out like a parcel', 'Bir koli gibi kucaklayıp çık', (c) => {
        c.h.stat('health', -1);
        return c.t('You carried them out under one arm, still screaming, leaving a full trolley behind. You went back for it at nine at night.', 'Kolunun altında, hâlâ bağırırken dışarı taşıdın; dolu bir arabayı arkanda bıraktın. Akşam dokuzda geri dönüp aldın.');
      }),
    ],
  }),

  kidEvent('base.ad_fever_night', 1, 8, {
    title: (c) => c.t(`At three in the morning, ${kid(c)} is burning with fever.`, `Gecenin üçünde ${kid(c)} ateşler içinde yanıyor.`),
    text: T('The thermometer says a number you do not like.', 'Termometre hiç hoşuna gitmeyen bir sayı gösteriyor.'),
    choices: [
      ch('er', 'Go to the emergency room', 'Acile git', (c) => {
        c.h.money(-wage(c, 150));
        c.h.stat('health', -1);
        c.h.closeness(kidId(c), 5);
        return c.t(`Four hours in a plastic chair. It was a virus. ${kid(c)} fell asleep on your chest and was fine by morning. You were not.`, `Plastik bir sandalyede dört saat. Bir virüsmüş. ${kid(c)} göğsünde uyuyakaldı ve sabaha iyiydi. Sen değildin.`);
      }, { tone: 'good' }),
      ch('line', 'Call the doctor on duty', 'Nöbetçi doktoru ara', (c) => {
        c.h.closeness(kidId(c), 3);
        return c.t('The doctor on the phone was calm, kind and clear. You did everything she said. The fever broke at dawn.', 'Telefondaki doktor sakin, nazik ve netti. Söylediği her şeyi yaptın. Ateş şafakta düştü.');
      }),
      ch('wait', 'Cool cloths and wait', 'Ilık bezlerle bekle', (c) => {
        if (c.rng.chance(0.8)) {
          c.h.closeness(kidId(c), 3);
          return c.t('You sat by the bed all night with cool cloths. By morning the fever was gone and you had aged a year.', 'Bütün gece ılık bezlerle yatağın başında oturdun. Sabah ateş düşmüştü; sen bir yaş yaşlanmıştın.');
        }
        c.h.money(-wage(c, 300));
        c.h.stat('happiness', -3);
        return c.t('By morning it was worse, and you went to hospital after all. It was an ear infection. Antibiotics and guilt.', 'Sabaha daha kötüydü ve sonunda hastaneye gittiniz. Kulak enfeksiyonuymuş. Antibiyotik ve vicdan azabı.');
      }, { badge: 'Risky' }),
    ],
  }),

  kidEvent('base.ad_first_school_day', 6, 6, {
    title: (c) => c.t(`It is ${kid(c)}'s first day of school.`, `Bugün ${gen(kid(c))} okulda ilk günü.`),
    text: T('The backpack is bigger than the child.', 'Çanta çocuktan büyük.'),
    choices: [
      ch('brave', 'Wave from the gate, smiling', 'Kapıdan gülümseyerek el salla', (c) => {
        c.h.closeness(kidId(c), 4);
        return c.t(`${kid(c)} marched in without looking back. You cried in the car for twenty minutes.`, `${kid(c)} arkasına bakmadan içeri yürüdü. Sen arabada yirmi dakika ağladın.`);
      }, { tone: 'good' }),
      ch('stay', 'Stay until they settle', 'Alışana kadar kal', (c) => {
        c.h.closeness(kidId(c), 6);
        c.h.stat('happiness', 1);
        return c.t('You stayed at the back of the classroom for an hour. The teacher gave you a crayon so you would stop hovering.', 'Bir saat sınıfın arkasında durdun. Öğretmen etrafta dolanmayı bırakasın diye eline bir boya kalemi verdi.');
      }),
      ch('note', 'Hide a note in the lunchbox', 'Beslenme çantasına not sakla', (c) => {
        c.h.closeness(kidId(c), 5);
        return c.t(`You hid a note in the lunchbox. ${kid(c)} cannot read yet, so the teacher read it out to the whole class. It was a big success.`, `Beslenme çantasına bir not sakladın. ${kid(c)} henüz okuma bilmediği için öğretmen notu bütün sınıfa okudu. Büyük başarıydı.`);
      }),
    ],
  }),

  kidEvent('base.ad_tooth_fairy', 5, 8, {
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 5);
    },
    title: (c) => c.t(`${kid(c)} has lost a tooth and has questions about the tooth fairy's rates.`, `${kid(c)} bir dişini kaybetti ve diş perisinin tarifesi hakkında soruları var.`),
    text: T('Apparently a classmate got a lot more. There is talk of a union.', 'Görünüşe göre bir sınıf arkadaşı çok daha fazlasını almış. Sendika lafları dönüyor.'),
    choices: [
      ch('pay', 'Pay the market rate', 'Piyasa fiyatını öde', (c) => {
        c.h.money(-num(c) * 3);
        c.h.closeness(kidId(c), 3);
        return c.t(`The fairy paid well. ${kid(c)} is now checking every other tooth for wobbles.`, `Peri iyi ödedi. ${kid(c)} şimdi öbür dişlerinin sallanıp sallanmadığını tek tek kontrol ediyor.`);
      }),
      ch('letter', 'Leave a letter from the fairy instead', 'Onun yerine periden bir mektup bırak', (c) => {
        c.h.closeness(kidId(c), 5);
        return c.t(`The tooth fairy wrote a long letter about inflation, in glitter. ${kid(c)} keeps it under the pillow.`, `Diş perisi simli kalemle enflasyon üzerine uzun bir mektup yazdı. ${kid(c)} onu yastığının altında saklıyor.`);
      }, { tone: 'good' }),
      ch('forget', 'Forget completely', 'Tamamen unut', (c) => {
        c.h.closeness(kidId(c), -3);
        return c.t('You forgot. In the morning you claimed the fairy was "on strike". This was believed, and reported at school.', 'Unuttun. Sabah perinin "grevde" olduğunu söyledin. İnanıldı ve okulda anlatıldı.');
      }),
    ],
  }),

  kidEvent('base.ad_school_fight', 8, 14, {
    title: (c) => c.t(`The school calls: ${kid(c)} was in a fight.`, `Okuldan aradılar: ${kid(c)} kavgaya karışmış.`),
    text: (c) => c.t(`${kid(c)} says the other kid started it. ${cap(sheHe(c))} also has a split lip and a very proud expression.`, `${kid(c)} kavgayı öbür çocuğun başlattığını söylüyor. Bir de patlamış bir dudağı ve çok gururlu bir ifadesi var.`),
    choices: [
      ch('listen', 'Listen to the whole story first', 'Önce bütün hikâyeyi dinle', (c) => {
        c.h.closeness(kidId(c), 6);
        return c.t(`It turned out ${kid(c)} stepped in to protect a smaller kid. You backed ${herHim(c)} with the head teacher and bought ice cream on the way home.`, `Meğer ${kid(c)} daha küçük bir çocuğu korumak için araya girmiş. Müdürün yanında arkasında durdun ve dönüşte dondurma aldın.`);
      }, { tone: 'good' }),
      ch('punish', 'Ground them for a month', 'Bir ay ceza ver', (c) => {
        c.h.closeness(kidId(c), -6);
        return c.t(`A month without screens. ${kid(c)} read eleven books out of spite and is now unbearably well read.`, `Bir ay ekran yok. ${kid(c)} inadına on bir kitap okudu ve artık çekilmez derecede kültürlü.`);
      }),
      ch('other', 'Talk to the other parents', 'Öbür ailelerle konuş', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('happiness', 2);
          return c.t('The other parents were lovely. The two kids are now best friends, which is somehow more alarming.', 'Öbür aile çok tatlıydı. İki çocuk artık en iyi arkadaş; bu nedense daha da endişe verici.');
        }
        c.h.stat('happiness', -3);
        return c.t('The other parents were exactly as you imagined. Now the parents are in a fight too.', 'Öbür aile tam hayal ettiğin gibiydi. Şimdi de anne babalar kavgalı.');
      }, { badge: 'Risky' }),
    ],
  }),

  kidEvent('base.ad_bullied', 8, 14, {
    title: (c) => c.t(`${kid(c)} has stopped wanting to go to school.`, `${kid(c)} artık okula gitmek istemiyor.`),
    text: T('After a lot of gentle questions, it comes out: some kids have been making every day miserable.', 'Bir sürü yumuşak sorunun ardından ortaya çıkıyor: birkaç çocuk her günü çekilmez hâle getiriyor.'),
    choices: [
      ch('school', 'Go to the school together', 'Birlikte okula gidin', (c) => {
        c.h.closeness(kidId(c), 8);
        c.h.stat('happiness', 2);
        return c.t(`You went in together and did not leave until there was a plan. It took a term, but ${kid(c)} walks in with friends now.`, `Birlikte gittiniz ve bir plan çıkana kadar okuldan ayrılmadınız. Bir dönem sürdü ama ${kid(c)} artık arkadaşlarıyla birlikte giriyor.`);
      }, { tone: 'good' }),
      ch('club', 'Sign them up for a club outside school', 'Okul dışında bir kulübe yazdır', (c) => {
        c.h.money(-wage(c, 300));
        c.h.closeness(kidId(c), 5);
        return c.t(`A judo club, twice a week. ${kid(c)} has new friends, a belt and a completely different walk.`, `Haftada iki gün judo. ${gen(kid(c))} yeni arkadaşları, bir kuşağı ve bambaşka bir yürüyüşü var.`);
      }),
      ch('toughen', 'Tell them to toughen up', 'Güçlü olmasını söyle', (c) => {
        c.h.closeness(kidId(c), -10);
        return c.t(`${kid(c)} stopped telling you things. It took you years to notice exactly when.`, `${kid(c)} sana bir şey anlatmayı bıraktı. Tam olarak ne zaman bıraktığını fark etmen yıllar aldı.`);
      }),
    ],
  }),

  kidEvent('base.ad_screen_time', 8, 15, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} spent nine hours on a screen yesterday.`, `${kid(c)} dün dokuz saat ekran başındaydı.`),
    text: T('You know because the tablet sent you a weekly report. The tablet seemed worried too.', 'Biliyorsun, çünkü tablet sana haftalık rapor gönderdi. Tablet de endişeli görünüyordu.'),
    choices: [
      ch('limit', 'Set strict limits', 'Sıkı sınırlar koy', (c) => {
        c.h.closeness(kidId(c), -3);
        c.h.stat('smarts', 0);
        return c.t(`Two hours a day. ${kid(c)} negotiated like a trade union and won fifteen minutes on weekends.`, `Günde iki saat. ${kid(c)} sendika gibi pazarlık etti ve hafta sonları on beş dakika kopardı.`);
      }),
      ch('together', 'Play their game with them', 'Onun oyununu birlikte oyna', (c) => {
        c.h.closeness(kidId(c), 7);
        c.h.stat('happiness', 2);
        return c.t(`You were humiliatingly bad. ${kid(c)} taught you patiently and laughed for a week. Screen time went down, oddly.`, `Utanç verici derecede kötüydün. ${kid(c)} sabırla öğretti ve bir hafta güldü. Ekran süresi nedense azaldı.`);
      }, { tone: 'good' }),
      ch('wifi', 'Switch off the Wi-Fi at nine', 'İnterneti dokuzda kapat', (c) => {
        c.h.closeness(kidId(c), -2);
        return c.t('The Wi-Fi goes off at nine. The household now plays cards at nine-oh-one, grumbling. It is the best hour of the day.', 'İnternet dokuzda kapanıyor. Ev ahalisi artık dokuzu bir geçe söylene söylene kâğıt oynuyor. Günün en güzel saati.');
      }),
    ],
  }),

  kidEvent('base.ad_homework_lie', 7, 12, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} swore the homework was done. The teacher's note says otherwise.`, `${kid(c)} ödevini yaptığına yemin etti. Öğretmenin notu başka şey söylüyor.`),
    text: T('The excuse given at school: "Our dog ate the internet."', 'Okulda söylenen bahane: "Köpeğimiz interneti yedi."'),
    choices: [
      ch('talk', 'Talk about why lying is worse', 'Yalanın neden daha kötü olduğunu konuş', (c) => {
        c.h.closeness(kidId(c), 3);
        return c.t(`You talked. ${kid(c)} cried, then did the homework, then asked if you had ever lied. You took a long time to answer.`, `Konuştunuz. ${kid(c)} ağladı, sonra ödevini yaptı, sonra senin hiç yalan söyleyip söylemediğini sordu. Cevap vermen uzun sürdü.`);
      }, { tone: 'good' }),
      ch('sit', 'Sit with them every evening', 'Her akşam başında otur', (c) => {
        c.h.closeness(kidId(c), 4);
        c.h.stat('smarts', 1);
        return c.t('You sat beside them every evening for a month. You relearned fractions. You did not enjoy fractions the first time either.', 'Bir ay boyunca her akşam yanında oturdun. Kesirleri yeniden öğrendin. İlk seferde de sevmemiştin.');
      }),
      ch('laugh', 'Laugh at the excuse', 'Bahaneye gül', (c) => {
        c.h.closeness(kidId(c), 2);
        return c.t('You laughed, which ruined the lecture. You did make it clear the dog must never eat the internet again.', 'Güldün ve nutuk mahvoldu. Yine de köpeğin bir daha asla interneti yememesi gerektiğini açıkça belirttin.');
      }),
    ],
  }),

  kidEvent('base.ad_science_volcano', 9, 13, {
    when: noMourn,
    title: (c) => c.t(`At 21:00, ${kid(c)} remembers the science project is due tomorrow.`, `Akşam dokuzda ${kid(c)} fen projesinin yarın teslim olduğunu hatırlıyor.`),
    text: T('It is supposed to be a working volcano.', 'Çalışan bir yanardağ olması gerekiyor.'),
    choices: [
      ch('build', 'Build it together until midnight', 'Gece yarısına kadar birlikte yapın', (c) => {
        c.h.closeness(kidId(c), 6);
        c.h.stat('health', -1);
        if (c.rng.chance(0.5)) return c.t('The volcano erupted perfectly at school. It also erupted, less perfectly, on your kitchen ceiling.', 'Yanardağ okulda kusursuz patladı. Senin mutfak tavanında da patlamıştı; o kadar kusursuz değil.');
        return c.t('The volcano did not erupt. It sighed. The teacher gave it a B for "effort and atmosphere".', 'Yanardağ patlamadı. İç geçirdi. Öğretmen "emek ve atmosfer" için iyi not verdi.');
      }, { tone: 'good' }),
      ch('consequences', 'Let them face the music', 'Sonucuna katlansın', (c) => {
        c.h.closeness(kidId(c), -2);
        return c.t(`${kid(c)} handed in a drawing of a volcano labelled "dormant". Clever, but not clever enough.`, `${kid(c)} "uyuyan yanardağ" yazılı bir resim teslim etti. Zekice ama yeterince değil.`);
      }),
      ch('takeover', 'Take over and do it yourself', 'Devral ve kendin yap', (c) => {
        c.h.stat('happiness', 2);
        return c.t(`Your volcano won second prize. ${kid(c)} slept through its construction. You are very proud and slightly ashamed.`, `Senin yanardağın ikincilik ödülü aldı. ${kid(c)} yapımı boyunca uyudu. Çok gururlusun ve biraz utanıyorsun.`);
      }),
    ],
  }),

  kidEvent('base.ad_drums', 8, 15, {
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 500);
    },
    title: (c) => c.t(`${kid(c)} wants a drum kit. Desperately.`, `${kid(c)} bir davul seti istiyor. Hem de deli gibi.`),
    text: (c) =>
      thinWalls(c)
        ? c.t('You live in a building with thin walls and a neighbour who already complains about footsteps.', 'İnce duvarlı bir apartmanda oturuyorsun ve komşun ayak seslerinden bile şikâyetçi.')
        : c.t('The house has room for it. Your nerves may not.', 'Evde yer var. Senin sinirlerinde var mı, orası belli değil.'),
    choices: [
      ch('buy', 'Buy the drums', 'Davulu al', (c) => {
        c.h.money(-num(c));
        c.h.closeness(kidId(c), 8);
        c.h.stat('happiness', -1);
        return thinWalls(c)
          ? c.t(`The drums arrived. So did a letter from the building manager. ${kid(c)} is actually getting good.`, `Davul geldi. Apartman yöneticisinden bir mektup da geldi. ${kid(c)} gerçekten iyi çalmaya başlıyor.`)
          : c.t(`The drums arrived. The neighbours two gardens away now know every song ${kid(c)} is learning. ${kid(c)} is actually getting good.`, `Davul geldi. İki bahçe ötedeki komşular bile ${gen(kid(c))} öğrendiği her şarkıyı biliyor. ${kid(c)} gerçekten iyi çalmaya başlıyor.`);
      }, { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('electric', 'Electric drums with headphones', 'Kulaklıklı elektronik davul', (c) => {
        c.h.money(-Math.round(num(c) * 1.4));
        c.h.closeness(kidId(c), 6);
        return c.t('Silent drums. All you hear is a thudding of sticks on rubber, at all hours, like a polite woodpecker.', 'Sessiz davul. Duyduğun tek şey her saat lastiğe vuran bagetlerin tok sesi; kibar bir ağaçkakan gibi.');
      }, { tone: 'good', requires: (c) => afford(c, Math.round(num(c) * 1.4)), requiresLabel: 'Not enough money' }),
      ch('recorder', 'Suggest the recorder instead', 'Onun yerine blok flüt öner', (c) => {
        c.h.closeness(kidId(c), -4);
        return c.t(`${kid(c)} took the recorder and played it with such fury that you bought the drums within a month.`, `${kid(c)} flütü aldı ve öyle bir hırsla çaldı ki bir ay içinde davulu aldın.`);
      }),
    ],
  }),

  kidEvent('base.ad_talent_show', 6, 12, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} is in the school talent show, with an act nobody has seen.`, `${kid(c)} okulun yetenek yarışmasına katılıyor; numarasını kimse görmedi.`),
    text: T('Rehearsals happen behind a locked door. You have heard a kazoo.', 'Provalar kilitli bir kapının arkasında yapılıyor. Bir düdük sesi duydun.'),
    choices: [
      ch('front', 'Sit in the front row and film it all', 'Ön sıraya otur, her şeyi kaydet', (c) => {
        c.h.closeness(kidId(c), 6);
        c.h.stat('happiness', 4);
        return c.t(`It was a magic trick, a song and a kazoo solo, all at once. ${kid(c)} came third and bowed like a champion.`, `Aynı anda bir sihir numarası, bir şarkı ve bir düdük solosuydu. ${kid(c)} üçüncü oldu ve şampiyon gibi eğilip selam verdi.`);
      }, { tone: 'good' }),
      ch('coach', 'Offer some coaching', 'Biraz koçluk teklif et', (c) => {
        c.h.closeness(kidId(c), -1);
        return c.t('Your coaching was not welcome. The act went on exactly as planned, kazoo included. It was better than your ideas.', 'Koçluğun hiç makbule geçmedi. Numara tam planlandığı gibi, düdüğüyle birlikte sahnelendi. Senin fikirlerinden iyiydi.');
      }),
      ch('work', 'Miss it for work', 'İş yüzünden kaçır', (c) => {
        c.h.closeness(kidId(c), -7);
        return c.t(`You watched the video later. ${kid(c)} looked at the empty seat twice during the song.`, `Videoyu sonra izledin. ${kid(c)} şarkı boyunca iki kez boş sandalyeye baktı.`);
      }),
    ],
  }),

  kidEvent('base.ad_vegetarian', 12, 17, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} has gone vegetarian, effective immediately.`, `${kid(c)} vejetaryen oldu; hem de hemen şu andan itibaren.`),
    text: (c) =>
      inTr(c)
        ? c.t('This was announced over a plate of köfte.', 'Bu karar bir tabak köftenin başında açıklandı.')
        : c.t('This was announced over a Sunday roast.', 'Bu karar pazar sofrasındaki fırın etinin başında açıklandı.'),
    choices: [
      ch('support', 'Learn new recipes', 'Yeni yemekler öğren', (c) => {
        c.h.closeness(kidId(c), 6);
        c.h.stat('health', 2);
        return c.t('You learned eleven lentil dishes. The whole family eats better now. Nobody admits it.', 'On bir çeşit mercimek yemeği öğrendin. Bütün aile artık daha sağlıklı besleniyor. Kimse kabul etmiyor.');
      }, { tone: 'good' }),
      ch('cook', 'Say "cook for yourself, then"', '"O zaman kendin pişir" de', (c) => {
        c.h.closeness(kidId(c), 1);
        c.h.stat('happiness', 1);
        return c.t(`${kid(c)} did. ${cap(herHis(c))} chickpea curry is now the most requested dish in the house.`, `${kid(c)} pişirdi. Nohut körisi artık evde en çok istenen yemek.`);
      }),
      ch('phase', 'Call it a phase', 'Bunun bir heves olduğunu söyle', (c) => {
        c.h.closeness(kidId(c), -5);
        return c.t(`You called it a phase. Ten years on, ${kid(c)} still brings it up every time you eat meat.`, `Buna heves dedin. On yıl sonra bile ${kid(c)} ne zaman et yesen bunu hatırlatıyor.`);
      }),
    ],
  }),

  kidEvent('base.ad_curfew', 15, 17, {
    title: (c) => c.t(`${kid(c)} came home at three in the morning, through the window.`, `${kid(c)} sabahın üçünde, pencereden eve girdi.`),
    text: T('You were sitting in the dark in the armchair, like in a film. It felt great, then terrible.', 'Filmlerdeki gibi karanlıkta koltukta oturuyordun. Önce harika, sonra berbat hissettirdi.'),
    choices: [
      ch('calm', 'Ask, calmly, what happened', 'Sakin sakin ne olduğunu sor', (c) => {
        c.h.closeness(kidId(c), 5);
        return c.t(`It was a party, a missed bus and a dead phone. You agreed on a rule: call, any time, no questions that night. ${kid(c)} has used it twice since.`, `Bir parti, kaçırılmış bir otobüs ve şarjı bitmiş bir telefon. Bir kural koydunuz: ne zaman olursa ara, o gece soru yok. ${kid(c)} o günden beri iki kez kullandı.`);
      }, { tone: 'good' }),
      ch('ground', 'Ground them for the summer', 'Bütün yaz ceza ver', (c) => {
        c.h.closeness(kidId(c), -8);
        return c.t('A whole summer at home. The window was nailed shut. A different window was discovered.', 'Bütün yaz evde. Pencere çivilendi. Başka bir pencere keşfedildi.');
      }),
      ch('pretend', 'Pretend you were asleep', 'Uyuyormuş gibi yap', (c) => {
        c.h.closeness(kidId(c), -1);
        return c.t(`You pretended to snore. ${kid(c)} said "goodnight" to the armchair. You both know.`, `Horluyormuş gibi yaptın. ${kid(c)} koltuğa "iyi geceler" dedi. İkiniz de biliyorsunuz.`);
      }),
    ],
  }),

  kidEvent('base.ad_driving_lesson', 17, 19, {
    title: (c) => c.t(`${kid(c)} wants you to teach ${kidPron(c)} to drive.`, `${kid(c)}, kendisine araba kullanmayı öğretmeni istiyor.`),
    text: T('You have seen how this child parks a bicycle.', 'Bu çocuğun bisikleti nasıl park ettiğini gördün.'),
    choices: [
      ch('teach', 'Teach them yourself', 'Kendin öğret', (c) => {
        c.h.closeness(kidId(c), 6);
        c.h.stat('health', -1);
        if (c.rng.chance(0.3)) {
          c.h.money(-wage(c, 400));
          return c.t('Lesson three ended against a recycling bin. Lesson four went beautifully. You aged a decade in a month.', 'Üçüncü ders bir geri dönüşüm kutusunda bitti. Dördüncü ders harika geçti. Bir ayda on yaş yaşlandın.');
        }
        return c.t(`You gripped the door handle for six weeks. ${kid(c)} passed first time and now criticises your driving.`, `Altı hafta boyunca kapı koluna yapıştın. ${kid(c)} ilk seferde geçti ve artık senin araba kullanışını eleştiriyor.`);
      }, { tone: 'good' }),
      ch('school', 'Pay for a driving school', 'Sürücü kursuna yazdır', (c) => {
        c.h.money(-wage(c, 900));
        c.h.closeness(kidId(c), 2);
        return c.t('A professional with nerves of steel did it. You took them out to celebrate, and let them drive home.', 'Çelik sinirli bir profesyonel halletti. Kutlamaya çıktınız ve eve arabayı ona kullandırdın.');
      }),
      ch('wait', 'Say "next year"', '"Seneye" de', (c) => {
        c.h.closeness(kidId(c), -3);
        return c.t(`"Next year." ${kid(c)} learned from a friend's older brother instead. You do not want to know the details.`, `"Seneye." ${kid(c)} onun yerine bir arkadaşının ağabeyinden öğrendi. Ayrıntıları bilmek istemiyorsun.`);
      }),
    ],
  }),

  kidEvent('base.ad_exam_stress', 17, 18, {
    title: (c) => c.t(`${kid(c)} is cracking under the pressure of the university entrance exam.`, `${kid(c)} üniversite sınavının baskısı altında eziliyor.`),
    text: T('Twelve hours of study a day, no sleep, and a stack of practice tests taller than the fridge.', 'Günde on iki saat ders, uykusuzluk ve buzdolabından yüksek bir deneme yığını.'),
    choices: [
      ch('perspective', 'Remind them it is not everything', 'Her şeyin bu olmadığını hatırlat', (c) => {
        c.h.closeness(kidId(c), 7);
        return c.t(`You took ${kid(c)} out for breakfast by the water and talked about everything except the exam. The results were good. The breakfast was better.`, `${acc(kid(c))} su kenarında kahvaltıya götürdün ve sınav dışında her şeyi konuştunuz. Sonuçlar iyiydi. Kahvaltı daha iyiydi.`);
      }, { tone: 'good' }),
      ch('tutor', 'Hire a private tutor', 'Özel ders tut', (c) => {
        c.h.money(-wage(c, 2500));
        c.h.closeness(kidId(c), 2);
        return c.t(`The tutor was expensive and excellent. ${kid(c)} did well, and now sends you the tutor's memes.`, `Hoca pahalı ve mükemmeldi. ${kid(c)} iyi bir sonuç aldı ve artık sana hocanın caps'lerini atıyor.`);
      }),
      ch('push', 'Push harder', 'Daha çok yüklen', (c) => {
        c.h.closeness(kidId(c), -8);
        return c.t(`You pushed. ${kid(c)} did fine and has not quite forgiven you. The house was very quiet that year.`, `Yüklendin. ${kid(c)} fena yapmadı ama seni tam olarak affetmedi. O yıl ev çok sessizdi.`);
      }),
    ],
  }),

  kidEvent('base.ad_dropout', 19, 23, {
    title: (c) => c.t(`${kid(c)} wants to drop out of university to follow a dream.`, `${kid(c)} bir hayalin peşinden gitmek için üniversiteyi bırakmak istiyor.`),
    text: T('The dream involves a food truck, a business partner called "Dodo", and your garage.', 'Hayalin içinde bir yemek kamyoneti, adı "Dodo" olan bir ortak ve senin garajın var.'),
    choices: [
      ch('back', 'Back them, and lend the garage', 'Arkasında dur, garajı ver', (c) => {
        c.h.closeness(kidId(c), 8);
        c.h.money(-wage(c, 2000));
        if (c.rng.chance(0.45)) return c.t('The food truck is a local hit. Dodo turned out to be a genius. You get free lunch for life.', 'Yemek kamyoneti mahallede çok tuttu. Dodo’nun dahi olduğu ortaya çıktı. Ömür boyu bedava öğle yemeği hakkın var.');
        return c.t(`The truck closed after a year. ${kid(c)} went back to university, older and wiser and very good at chips.`, `Kamyonet bir yıl sonra kapandı. ${kid(c)} üniversiteye döndü; daha olgun, daha akıllı ve patates kızartmasında çok iyi.`);
      }, { badge: 'Risky' }),
      ch('finish', 'Ask them to finish the degree first', 'Önce okulu bitirmesini iste', (c) => {
        c.h.closeness(kidId(c), -2);
        return c.t(`${kid(c)} finished the degree, grumbling, and started the truck the week after graduation. Dodo had waited.`, `${kid(c)} söylene söylene okulu bitirdi ve mezuniyetten bir hafta sonra kamyoneti açtı. Dodo beklemişti.`);
      }),
      ch('forbid', 'Forbid it', 'Yasakla', (c) => {
        c.h.closeness(kidId(c), -10);
        return c.t(`You forbade it. ${kid(c)} is twenty and did it anyway, just without telling you anything for a year.`, `Yasakladın. ${kid(c)} yirmi yaşında ve yine de yaptı; sadece bir yıl boyunca sana hiçbir şey anlatmadan.`);
      }),
    ],
  }),

  kidEvent('base.ad_boomerang', 23, 33, {
    title: (c) => c.t(`${kid(c)} is moving back home "for a few months".`, `${kid(c)} "birkaç aylığına" eve geri dönüyor.`),
    text: T('There are eleven boxes in the hall and a houseplant called Gerald.', 'Koridorda on bir koli ve adı Gerald olan bir saksı çiçeği var.'),
    choices: [
      ch('welcome', 'Welcome them home', 'Kucak aç', (c) => {
        c.h.closeness(kidId(c), 7);
        c.h.money(-wage(c, 1500));
        return c.t(`The few months became two years. You cooked together, argued about the thermostat and became friends. Gerald thrived.`, `Birkaç ay iki yıl oldu. Birlikte yemek yaptınız, kombi ayarı yüzünden tartıştınız ve arkadaş oldunuz. Gerald serpildi.`);
      }, { tone: 'good' }),
      ch('rent', 'Charge a small rent', 'Küçük bir kira iste', (c) => {
        c.h.money(wage(c, 1200));
        c.h.closeness(kidId(c), -1);
        return c.t(`${kid(c)} paid rent on time every month. On moving out, you gave it all back as a deposit for the new flat.`, `${kid(c)} kirayı her ay zamanında ödedi. Taşınırken hepsini yeni evin depozitosu olarak geri verdin.`);
      }),
      ch('deadline', 'Set a firm moving-out date', 'Kesin bir çıkış tarihi koy', (c) => {
        c.h.closeness(kidId(c), -4);
        return c.t(`Six months, on the calendar, in red. ${kid(c)} moved out on the very day, with Gerald, slightly offended.`, `Altı ay, takvimde, kırmızıyla. ${kid(c)} tam o gün Gerald’la birlikte, biraz alınmış olarak taşındı.`);
      }),
    ],
  }),

  kidEvent('base.ad_kid_partner', 20, 34, {
    setup: (c) => {
      c.vars.kp = c.h.newPerson({ age: c.rng.int(22, 34) }).id;
    },
    title: (c) => c.t(`${kid(c)} is serious about someone called ${nmv(c, 'kp')}. You do not like ${nmv(c, 'kp')}.`, `${kid(c)}, ${nmv(c, 'kp')} adında biriyle ciddi. Sen ${acc(nmv(c, 'kp'))} hiç sevmiyorsun.`),
    text: (c) => c.t(`${nmv(c, 'kp')} called your cooking "brave" and checked their phone during the toast.`, `${nmv(c, 'kp')} yemeklerine "cesur" dedi ve kadeh kaldırılırken telefonuna baktı.`),
    choices: [
      ch('chance', 'Give them a real chance', 'Gerçekten bir şans ver', (c) => {
        c.h.closeness(kidId(c), 6);
        return c.t(`You invited ${nmv(c, 'kp')} fishing. It turned out they were terrified of you. Now you get on fine, mostly over fish.`, `${acc(nmv(c, 'kp'))} balığa davet ettin. Meğer senden ödü kopuyormuş. Artık iyi anlaşıyorsunuz; çoğunlukla balık üzerinden.`);
      }, { tone: 'good' }),
      ch('honest', 'Tell your child how you feel', 'Çocuğuna ne hissettiğini söyle', (c) => {
        if (c.rng.chance(0.4)) {
          c.h.closeness(kidId(c), 3);
          return c.t(`${kid(c)} listened, thought about it and broke up with ${nmv(c, 'kp')} a month later. You were careful not to look pleased.`, `${kid(c)} dinledi, düşündü ve bir ay sonra ${wth(nmv(c, 'kp'))} ayrıldı. Sevindiğini belli etmemeye dikkat ettin.`);
        }
        c.h.closeness(kidId(c), -9);
        return c.t(`${kid(c)} took it badly and defended ${nmv(c, 'kp')} fiercely. Christmas, birthdays and every holiday since have had a chill.`, `${kid(c)} çok kötü karşıladı ve ${acc(nmv(c, 'kp'))} hararetle savundu. O günden beri her ${trHome(c) ? 'bayramda' : 'yılbaşında'}, her doğum gününde bir soğukluk var.`);
      }, { badge: 'Risky' }),
      ch('silent', 'Keep quiet and be polite', 'Sus ve kibar ol', (c) => {
        c.h.stat('happiness', -1);
        return c.t(`You stayed polite for years. ${nmv(c, 'kp')} never knew. Your jaw did.`, `Yıllarca kibar kaldın. ${nmv(c, 'kp')} hiç anlamadı. Çenen anladı.`);
      }),
    ],
  }),

  kidEvent('base.ad_kid_house_loan', 25, 42, {
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(8000, 20000));
    },
    title: (c) => c.t(`${kid(c)} asks for help with the deposit on a first home.`, `${kid(c)} ilk evinin peşinatı için yardım istiyor.`),
    text: (c) => c.t(`${c.h.fmt(num(c))} would make the difference. ${kid(c)} has a spreadsheet and a very hopeful face.`, `${c.h.fmt(num(c))} her şeyi değiştirecek. ${gen(kid(c))} bir tablosu ve çok umutlu bir yüzü var.`),
    choices: [
      ch('gift', 'Give it as a gift', 'Hediye olarak ver', (c) => {
        c.h.money(-num(c));
        c.h.closeness(kidId(c), 12);
        c.h.stat('happiness', 4);
        return c.t(`You handed over the keys to their future. At the housewarming, ${kid(c)} gave you the first slice of cake and a spare key.`, `Geleceğinin anahtarını teslim ettin. Ev hayrında ${kid(c)} pastanın ilk dilimini ve bir yedek anahtarı sana verdi.`);
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough savings' }),
      ch('loan', 'Lend it, with a plan', 'Planlı bir borç olarak ver', (c) => {
        c.h.money(-num(c));
        c.h.closeness(kidId(c), 6);
        if (c.rng.chance(0.75)) {
          c.h.money(Math.round(num(c) * 0.9));
          return c.t(`${kid(c)} paid back nearly all of it over the years, on time, with little notes. You kept the notes.`, `${kid(c)} yıllar içinde neredeyse hepsini, zamanında ve küçük notlarla geri ödedi. Notları sakladın.`);
        }
        return c.t(`The repayments stopped after a year. You decided it was a gift after all and never mentioned it.`, `Ödemeler bir yıl sonra durdu. Sonunda bunun bir hediye olduğuna karar verdin ve hiç açmadın.`);
      }, { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough savings' }),
      ch('no', 'Say you cannot', 'Yapamayacağını söyle', (c) => {
        c.h.closeness(kidId(c), -4);
        return c.t(`${kid(c)} understood, mostly. It took three more years of saving. The house is smaller, and entirely theirs.`, `${kid(c)} anladı, büyük ölçüde. Üç yıl daha biriktirmek gerekti. Ev daha küçük ama tamamen onun.`);
      }),
    ],
  }),

  kidEvent('base.ad_parent_teacher', 7, 15, {
    when: noMourn,
    title: (c) => c.t(`At the parent-teacher meeting, ${kid(c)}'s teacher asks if you have "a minute".`, `Veli toplantısında ${gen(kid(c))} öğretmeni "bir dakikanız var mı" diye soruyor.`),
    text: T('Nothing good has ever followed "a minute".', '"Bir dakikanız var mı"dan sonra hiç iyi bir şey gelmemiştir.'),
    choices: [
      ch('listen', 'Listen carefully', 'Dikkatle dinle', (c) => {
        c.h.closeness(kidId(c), 3);
        if (c.rng.chance(0.5)) return c.t(`It was good news: ${kid(c)} wrote a story the teacher cannot stop thinking about. You read it in the car and had to sit for a while.`, `İyi haberdi: ${kid(c)} öğretmenin aklından çıkmayan bir öykü yazmış. Arabada okudun ve bir süre öylece oturdun.`);
        return c.t(`${kid(c)} has been running a sweet-trading business from the back row. The profit margins were impressive.`, `${kid(c)} arka sıradan bir şeker ticareti yürütüyormuş. Kâr marjları etkileyiciymiş.`);
      }, { tone: 'good' }),
      ch('defend', 'Defend your child before she finishes', 'Öğretmen bitirmeden çocuğunu savun', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You defended your child against an accusation that turned out to be praise. You apologised twice.', 'Çocuğunu, sonradan bir övgü olduğu anlaşılan bir suçlamaya karşı savundun. İki kez özür diledin.');
      }),
      ch('send', 'Send your partner next time', 'Bir dahakine eşini gönder', (c) => {
        if (partnered(c)) {
          setPartner(c, 'pp');
          c.h.closeness(String(c.vars.pp), -2);
        }
        return c.t('You have quietly arranged to never attend another one. It is noticed.', 'Bir daha hiçbirine gitmemenin yolunu sessizce ayarladın. Fark edildi.');
      }),
    ],
  }),

  kidEvent('base.ad_grandparents_spoil', 3, 10, {
    when: (c) => noMourn(c) && c.h.relatives(['mother', 'father']).length > 0,
    setup: (c) => {
      c.vars.gp = c.rng.pick(c.h.relatives(['mother', 'father'])).person.id;
    },
    title: (c) => c.t(`${kid(c)} came back from a weekend with your ${pGP(c)} on a sugar high, with a new bike.`, `${kid(c)}, ${pGPtr(c)} yanında geçen bir hafta sonundan şekeri fazla kaçırmış, yerinde duramaz hâlde ve yeni bir bisikletle döndü.`),
    text: T('The rules you set apparently do not apply "at Grandma and Grandpa\'s".', 'Koyduğun kuralların "babaannenin, dedenin evinde" geçerli olmadığı anlaşılıyor.'),
    choices: [
      ch('let', 'Let them have their fun', 'Bırak keyiflerini sürsünler', (c) => {
        c.h.closeness(String(c.vars.gp), 6);
        c.h.closeness(kidId(c), 2);
        return c.t('You let it go. Grandparents are for spoiling. Your own childhood bike came from the same place.', 'Ses etmedin. Dedeler, nineler şımartmak içindir. Senin çocukluk bisikletin de aynı yerden gelmişti.');
      }, { tone: 'good' }),
      ch('talk', 'Have a gentle word', 'Usulca konuş', (c) => {
        c.h.closeness(String(c.vars.gp), -3);
        return c.t('You had a gentle word. They nodded seriously and bought a trampoline the next weekend.', 'Usulca konuştun. Ciddi ciddi başlarını salladılar ve ertesi hafta sonu bir trambolin aldılar.');
      }),
      ch('join', 'Ask what they got you', 'Sana ne aldıklarını sor', (c) => {
        c.h.closeness(String(c.vars.gp), 4);
        c.h.stat('happiness', 2);
        return c.t('They had got you something too: a jar of jam and a long story about when you were small. Better than a bike.', 'Sana da bir şey almışlardı: bir kavanoz reçel ve senin küçüklüğünü anlatan uzun bir hikâye. Bisikletten iyi.');
      }),
    ],
  }),

  kidEvent('base.ad_road_trip', 5, 15, {
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 700);
    },
    title: T('The family road trip has reached hour four of "are we there yet?".', 'Aile yolculuğunda "daha gelmedik mi?" sorusunun dördüncü saatine girildi.'),
    text: (c) => c.t(`${kid(c)} has also announced an urgent need for the toilet, a snack and a different family.`, `${kid(c)} ayrıca acil tuvalet, atıştırmalık ve başka bir aile ihtiyacını da duyurdu.`),
    choices: [
      ch('game', 'Start a car game', 'Araba oyunu başlat', (c) => {
        c.h.money(-num(c));
        c.h.closeness(kidId(c), 5);
        c.h.stat('happiness', 3);
        return c.t('"I spy" became a ninety-minute epic with rules nobody understood. It is now the best memory of the whole holiday.', '"Gözüm bir şey görüyor" doksan dakikalık, kimsenin kurallarını anlamadığı bir destana dönüştü. Şimdi bütün tatilin en güzel anısı.');
      }, { tone: 'good' }),
      ch('stop', 'Stop at a roadside diner', 'Yol kenarında bir lokantada mola ver', (c) => {
        c.h.money(-num(c) - wage(c, 40));
        c.h.closeness(kidId(c), 3);
        return c.t(
          inTr(c) ? 'You stopped for gözleme and ayran. Everyone came back to the car a nicer person.' : 'You stopped for pancakes. Everyone came back to the car a nicer person.',
          inTr(c) ? 'Gözleme ve ayran için mola verdiniz. Herkes arabaya daha iyi bir insan olarak döndü.' : 'Krep için mola verdiniz. Herkes arabaya daha iyi bir insan olarak döndü.',
        );
      }),
      ch('headphones', 'Hand out headphones', 'Kulaklık dağıt', (c) => {
        c.h.money(-num(c));
        c.h.closeness(kidId(c), -1);
        return c.t('Silence. Blessed, slightly sad silence. You arrived without having spoken to each other for three hours.', 'Sessizlik. Mübarek, biraz da hüzünlü bir sessizlik. Üç saat birbirinizle konuşmadan vardınız.');
      }),
    ],
  }),

  kidEvent('base.ad_kid_first_job', 16, 18, {
    when: noMourn,
    title: (c) => c.t(`${kid(c)} got a first job, and wants advice for day one.`, `${kid(c)} ilk işini buldu ve ilk gün için tavsiye istiyor.`),
    text: T('It is a weekend job. The uniform is a visor.', 'Hafta sonu işi. Üniforması bir siperlik.'),
    choices: [
      ch('advice', 'Give your best advice', 'En iyi tavsiyeni ver', (c) => {
        c.h.closeness(kidId(c), 5);
        return c.t(`"Be early, learn names, and never microwave fish at work." ${kid(c)} wrote it down. You felt like a philosopher.`, `"Erken git, isimleri öğren ve işyerinde asla balık ısıtma." ${kid(c)} not aldı. Kendini filozof gibi hissettin.`);
      }, { tone: 'good' }),
      ch('drive', 'Drive them there and wait outside', 'Oraya bırak ve dışarıda bekle', (c) => {
        c.h.closeness(kidId(c), -1);
        return c.t('You waited in the car park for six hours. Your child waved at you once, through the window, mortified.', 'Otoparkta altı saat bekledin. Çocuğun utancından kıpkırmızı olmuş hâlde camdan bir kez el salladı.');
      }),
      ch('story', 'Tell them about your own first job', 'Kendi ilk işini anlat', (c) => {
        c.h.closeness(kidId(c), 3);
        return c.t('You told the story of your first job. It got longer and more heroic in the telling. Your child listened anyway.', 'Kendi ilk işinin hikâyesini anlattın. Anlattıkça uzadı ve kahramanlaştı. Çocuğun yine de dinledi.');
      }),
    ],
  }),

  // base.ad_kid_wedding_cost moved to kid-milestones.ts (round 7): it now marks the child as married
];

/** "her" / "him" as the object of "teach ___ to drive". */
const kidPron = (c: Ctx) => herHim(c);
/** "mom" / "dad" for the grandparent in vars.gp (English). */
const pGP = (c: Ctx) => (c.h.person(String(c.vars.gp))?.gender === 'female' ? 'mom' : 'dad');
/** "annenin" / "babanın" (Turkish genitive) for the grandparent in vars.gp. */
const pGPtr = (c: Ctx) => (c.h.person(String(c.vars.gp))?.gender === 'female' ? 'annenin' : 'babanın');


