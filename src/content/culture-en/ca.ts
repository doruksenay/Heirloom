import type { Ctx, EventDef } from '../types';
import { getCountry } from '../../engine/world';
import { loc, wage } from '../base/util';
import { inCA, line } from './common';

// Canada: everyday life for characters living in Canada (country id 'ca').
// Spelling is Canadian (colour, washroom, toque, cottage); amounts are USD-based and shown in Canadian dollars.

/** A Canadian city other than the one the player lives in (Canada's own list in world.ts). */
const otherCities = (c: Ctx) => getCountry('ca').cities.filter((x) => x !== c.p.city);

/** Where the black ice or the long winter drive gets its colour: one row, both languages. */
const ROAD_LINES: readonly (readonly [string, string])[] = [
  ['A salt truck passed you going the other way. You felt seen.', 'Karşıdan geçen bir tuzlama kamyonu sana el sallar gibi oldu. Kendini anlaşılmış hissettin.'],
  ['A moose-crossing sign watched you the whole way. Nothing crossed. You stayed alert anyway.', 'Yol boyunca "yabani geyik geçebilir" levhaları seni izledi. Hiçbir şey geçmedi ama sen yine de tetikte kaldın.'],
  ['The only open place for two hours was the coffee drive-through. You took it as a sign.', 'İki saattir açık tek yer arabadan servis veren kahveciydi. Bunu bir işaret saydın.'],
];

const rinkWin: readonly (readonly [string, string])[] = [
  ['You scored once, by accident, into your own net. The cheering was still loud.', 'Bir gol attın, kazara, kendi kalene. Alkış yine de gürdü.'],
  ['You stayed upright for a whole drill. Somebody called it "a breakthrough".', 'Bütün bir antrenman boyunca ayakta kaldın. Biri buna "atılım" dedi.'],
  ['You stopped a puck with your shin. It hurt, and it was the proudest moment of your week.', 'Bir diski kaval kemiğinle durdurdun. Acıdı ama haftanın en gurur verici anıydı.'],
];

export const caEvents: EventDef[] = [
  // ------------------------------------------------------------------ childhood
  {
    id: 'ca.rink_6am',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    weight: 8,
    cooldown: 5,
    when: inCA,
    title: (c) => c.t('Rink practice at 6 a.m.', 'Sabah altıda buz pisti'),
    text: (c) =>
      c.t(
        'The rink opens before the sun does, and somebody has decided that you will be on it. Your skates are frozen stiff and so is your nose.',
        'Buz pisti güneşten önce açılıyor ve biri senin orada olacağına karar vermiş. Patenlerin buz kesmiş, burnun da.',
      ),
    choices: [
      {
        id: 'hustle',
        label: (c) => c.t('Give it everything', 'Her şeyini ortaya koy'),
        badge: 'Risky',
        resolve: (c) => {
          const hurt = c.rng.chance(0.25);
          const l = line(c, rinkWin);
          if (hurt) {
            c.h.stat('health', -3);
            c.h.stat('happiness', 1);
            return c.t('You went for the puck, met the boards instead, and left with an ice pack and a story.', 'Diske atıldın, bunun yerine korkuluklara çarptın ve elinde buz torbası, kafanda bir hikâyeyle ayrıldın.');
          }
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          return l;
        },
      },
      {
        id: 'cocoa',
        label: (c) => c.t('Skate for the hot chocolate', 'Sıcak çikolata için kay'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Goals scored: zero. Marshmallows eaten: six. You call it a good morning.', 'Atılan gol: sıfır. Yenen pamuk şeker: altı. Sen buna iyi bir sabah diyorsun.');
        },
        tone: 'good',
      },
      {
        id: 'figure',
        label: (c) => c.t('Ask to try figure skating', 'Artistik patinajı denemek iste'),
        resolve: (c) => {
          c.h.stat('looks', 3);
          c.h.stat('happiness', 2);
          return c.t('You spent the hour spinning until the ceiling lights became a single ring. You were dizzy, graceful and a little bit smug.', 'Bir saat boyunca, tavandaki ışıklar tek bir halka olana dek döndün. Başın dönüyordu ama zarifti ve biraz da kurumluydu.');
        },
      },
      {
        id: 'fake',
        label: (c) => c.t('Fake a stomach ache', 'Karnın ağrıyormuş gibi yap'),
        resolve: (c) => {
          const caught = c.rng.chance(0.4);
          if (caught) {
            c.h.stat('happiness', -3);
            return c.t('Your acting was fine. Then you asked about breakfast. You were on the ice by 6:20.', 'Oyunculuğun fena değildi. Sonra kahvaltıyı sordun. Altıyı yirmi geçe buzun üstündeydin.');
          }
          c.h.stat('happiness', 2);
          return c.t('You were excused. The bed was warm, and the guilt lasted until about 7:15.', 'Mazur görüldün. Yatak sıcaktı, suçluluk yedi buçuğa kadar bile dayanmadı.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ teen
  {
    id: 'ca.camp_job',
    category: 'work',
    minAge: 15,
    maxAge: 18,
    once: true,
    weight: 10,
    when: inCA,
    title: (c) => c.t('A summer job at the camp', 'Yaz kampında bir iş'),
    text: (c) =>
      c.t(
        'A lakeside summer camp needs staff, and the posting promises "fresh air and memories". It does not mention the mosquitoes.',
        'Göl kıyısındaki bir yaz kampı eleman arıyor; ilanda "temiz hava ve anılar" yazıyor. Sivrisineklerden söz etmiyor.',
      ),
    choices: [
      {
        id: 'canoe',
        label: (c) => c.t('Teach canoeing', 'Kano öğret'),
        badge: 'Risky',
        resolve: (c) => {
          const tipped = c.rng.chance(0.3);
          c.h.money(wage(c, 1300));
          c.h.stat('health', 3);
          if (tipped) {
            c.h.stat('happiness', 1);
            return c.t('You tipped the whole beginner group into the lake in week one. In week two they could all paddle, mostly out of spite.', 'İlk hafta bütün acemi grubu göle devirdin. İkinci hafta hepsi kürek çekmeyi öğrendi, çoğunlukla inat olsun diye.');
          }
          c.h.stat('happiness', 4);
          return c.t('You came home tanned, paid, and able to say "J-stroke" with authority.', 'Evine bronzlaşmış, paranı almış ve "J vuruşu" lafını otoriteyle söyleyebilir halde döndün.');
        },
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Work the kitchen', 'Mutfakta çalış'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 1500));
          c.h.stat('happiness', 1);
          return c.t('You made four hundred grilled cheese sandwiches by Friday. You have opinions about bread now.', 'Cumaya kadar dört yüz kaşarlı tost yaptın. Artık ekmek hakkında fikirlerin var.');
        },
      },
      {
        id: 'night',
        label: (c) => c.t('Run the campfire nights', 'Kamp ateşi gecelerini yönet'),
        resolve: (c) => {
          c.h.money(wage(c, 1000));
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return c.t('Your ghost story about the lake was so good that nobody went to the washroom alone until August.', 'Gölle ilgili hayalet hikâyen o kadar iyiydi ki ağustosa kadar kimse tuvalete tek başına gitmedi.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'ca.winter_road_trip',
    category: 'random',
    minAge: 17,
    maxAge: 21,
    once: true,
    weight: 10,
    when: inCA,
    title: (c) => c.t('Your first winter road trip', 'İlk kış yol yolculuğun'),
    text: (c) =>
      c.t(
        'The highway is a long white ribbon, the gas station coffee is lava, and the sky is deciding whether to snow. You are two hundred kilometres from anywhere.',
        'Otoyol upuzun beyaz bir şerit, benzinlik kahvesi lav gibi, gökyüzü kar yağıp yağmayacağına karar vermeye çalışıyor. Hiçbir yere iki yüz kilometre uzaktasın.',
      ),
    choices: [
      {
        id: 'push',
        label: (c) => c.t('Push on to get there tonight', 'Bu gece varmak için devam et'),
        badge: 'Risky',
        resolve: (c) => {
          const ice = c.rng.chance(0.35);
          const l = line(c, ROAD_LINES);
          if (ice) {
            c.h.stat('health', -5);
            c.h.stat('happiness', -3);
            c.h.money(-wage(c, 400));
            return c.t(
              'Black ice. The car did a slow, graceful spin and stopped in a snowbank, facing the way you came. A tow truck and a stiff neck later, you were done with heroics.',
              'Kara buz. Araba yavaş ve zarif bir dönüş yapıp kar yığınında, geldiğin yöne bakarak durdu. Bir çekici ve tutulmuş bir boyun sonra kahramanlıktan vazgeçtin.',
            );
          }
          c.h.stat('happiness', 4);
          return c.t(`You made it at midnight, hoarse from singing. ${l}`, `Gece yarısı vardın, şarkıdan sesin kısılmıştı. ${l}`);
        },
      },
      {
        id: 'slow',
        label: (c) => c.t('Slow down and take it easy', 'Yavaşla, sakin git'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t('You arrived late but intact, having learned what the "winter tires" people were on about.', 'Geç ama sağ salim vardın ve kışlık lastik meraklılarının neden bu kadar ısrar ettiğini anladın.');
        },
      },
      {
        id: 'motel',
        label: (c) => c.t('Pull over at a roadside motel', 'Yol kenarındaki bir motelde dur'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 90));
          c.h.stat('happiness', 3);
          return c.t('The room smelled of the 1980s and the pancakes were enormous. Honestly, the best part of the trip.', 'Oda seksenlerin kokuyordu, pankekler dev gibiydi. Dürüst olmak gerekirse yolculuğun en güzel kısmıydı.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ young adult
  {
    id: 'ca.october_thanksgiving',
    category: 'family',
    minAge: 19,
    maxAge: 32,
    weight: 8,
    cooldown: 5,
    when: inCA,
    title: (c) => c.t('Thanksgiving, in October', 'Ekim ayında Şükran Günü'),
    text: (c) =>
      c.t(
        'Thanksgiving lands on the second Monday of October, which is early, cold and a long way from anyone who would cook for you. The cranberry sauce is already on sale.',
        'Şükran Günü ekimin ikinci pazartesisine denk geliyor; erken, soğuk ve sana yemek yapacak kimseden uzak. Kızılcık sosu şimdiden indirimde.',
      ),
    choices: [
      {
        id: 'friendsgiving',
        label: (c) => c.t('Host a dinner for friends', 'Arkadaşlara yemek ver'),
        badge: 'Risky',
        resolve: (c) => {
          const disaster = c.rng.chance(0.3);
          c.h.money(-wage(c, 70));
          if (disaster) {
            c.h.stat('happiness', 3);
            return c.t('The turkey was still frozen at 6 p.m., so you served a feast of sides and called it "a plant-forward tradition". Nobody complained.', 'Hindi akşam altıda hâlâ donuktu; sen de garnitürlerden bir ziyafet çekip buna "bitki ağırlıklı gelenek" dedin. Kimse şikâyet etmedi.');
          }
          c.h.stat('happiness', 6);
          return c.t('The turkey was golden, the apartment was warm, and someone brought a pie. You were thankful, as advertised.', 'Hindi altın sarısıydı, ev sıcaktı, biri de turta getirdi. Tam istendiği gibi minnettardın.');
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Take the long bus home', 'Uzun otobüsle eve git'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 130));
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t('Nine hours, one sleeping stranger on your shoulder, and then a plate piled so high you needed a plan.', 'Dokuz saat, omzunda uyuyan bir yabancı ve sonra bir plan gerektirecek kadar dolu bir tabak.');
        },
      },
      {
        id: 'shift',
        label: (c) => c.t('Take the holiday shift for extra pay', 'Tatil mesaisini al, fazla ücret kazan'),
        badge: 'Big money',
        resolve: (c) => {
          c.h.money(wage(c, 160));
          c.h.stat('happiness', -2);
          return c.t('Double time on a quiet Monday. You ate leftover stuffing from a plastic container and felt oddly professional.', 'Sessiz bir pazartesi günü çift ücret. Plastik kapta artık hindi dolgusu yedin ve tuhaf biçimde kendini ciddi hissettin.');
        },
      },
    ],
  },
  {
    id: 'ca.move_province',
    category: 'work',
    minAge: 22,
    maxAge: 36,
    weight: 7,
    cooldown: 8,
    needs: ['employed', 'single'],
    when: (c) => inCA(c) && !c.p.home.owned && c.h.relatives('child').length === 0 && otherCities(c).length > 0,
    setup: (c) => {
      const list = otherCities(c);
      c.vars.city = list[c.rng.int(0, list.length - 1)];
    },
    title: (c) => c.t(`A job offer in ${c.vars.city}`, `${loc(String(c.vars.city))} bir iş teklifi`),
    text: (c) =>
      c.t(
        `A company in ${c.vars.city} wants you, with more pay, a bigger title and a different climate. Most of your friends live somewhere else.`,
        `${loc(String(c.vars.city))} bir şirket seni istiyor: daha yüksek maaş, daha büyük unvan ve başka bir iklim. Arkadaşlarının çoğu başka yerde yaşıyor.`,
      ),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Pack up and move', 'Toparlan ve taşın'),
        badge: 'Big change',
        resolve: (c) => {
          const city = String(c.vars.city);
          const loved = c.rng.chance(0.55);
          c.p.city = city;
          c.h.money(-wage(c, 1500));
          if (loved) {
            c.h.stat('happiness', 6);
            return c.t(`You drove your whole life to ${city} in a rented van. By spring, it felt like you had always lived there.`, `Bütün hayatını kiralık bir kamyonetle yeni şehrine taşıdın. Bahara doğru sanki hep orada yaşıyormuşsun gibi hissettin.`);
          }
          c.h.stat('happiness', -3);
          c.h.stat('smarts', 2);
          return c.t(`The pay was better and the winter was longer. You spent the first six months learning the transit map and missing your old coffee shop.`, `Maaş daha iyiydi, kış daha uzun. İlk altı ayı toplu taşıma haritasını öğrenmekle ve eski kahveciyi özlemekle geçirdin.`);
        },
      },
      {
        id: 'counter',
        label: (c) => c.t('Use the offer to ask for a raise', 'Teklifi zam pazarlığında kullan'),
        badge: 'Risky',
        resolve: (c) => {
          const win = c.rng.chance(0.5);
          if (win) {
            c.h.money(wage(c, 2200));
            c.h.stat('happiness', 3);
            return c.t('Your boss discovered a budget you had not known existed. You stayed, and the couch approved.', 'Patronun, varlığından haberin olmayan bir bütçe buldu. Kaldın, kanepe de onayladı.');
          }
          c.h.stat('happiness', -2);
          return c.t('"We wish you all the best in your new role," they said, and meant it a little too warmly. You stayed anyway, awkwardly.', '"Yeni görevinde başarılar," dediler ve biraz fazla sıcak söylediler. Yine de kaldın, ortam biraz gergin.');
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay where your people are', 'Insanlarının olduğu yerde kal'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You turned it down. You can stay close to the people who know your coffee order and your weak spots.', 'Teklifi reddettin. Kahve siparişini ve zayıf noktalarını bilen insanların yakınında kalabiliyorsun.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ adult / midlife
  {
    id: 'ca.cottage_weekend',
    category: 'random',
    minAge: 28,
    maxAge: 60,
    weight: 8,
    cooldown: 5,
    when: inCA,
    title: (c) => c.t('A weekend at the cottage', 'Göl evinde bir hafta sonu'),
    text: (c) =>
      c.t(
        'A friend lends you the cottage: a dock, a canoe, a screen door that slams like a gunshot and no cell signal worth mentioning. The loons are already gossiping.',
        'Bir arkadaşın göl evini sana ödünç veriyor: bir iskele, bir kano, silah sesi gibi çarpan sineklik kapısı ve sözü edilmeye değer bir çekim yok. Dalgıç kuşları şimdiden dedikodu yapıyor.',
      ),
    choices: [
      {
        id: 'swim',
        label: (c) => c.t('Jump off the dock', 'İskeleden suya atla'),
        badge: 'Risky',
        resolve: (c) => {
          const cold = c.rng.chance(0.25);
          if (cold) {
            c.h.stat('health', -2);
            c.h.stat('happiness', 1);
            return c.t('The lake was colder than expected. You surfaced making a noise you did not know you could make.', 'Göl beklediğinden soğuktu. Kendinde olduğunu bilmediğin bir sesle yüzeye çıktın.');
          }
          c.h.stat('health', 2);
          c.h.stat('happiness', 5);
          return c.t('Cold, clear water, then a towel and a lawn chair. Your worries sank with the sun.', 'Soğuk, berrak su, sonra bir havlu ve bir şezlong. Dertlerin güneşle birlikte battı.');
        },
      },
      {
        id: 'fish',
        label: (c) => c.t('Fish from the canoe at dawn', 'Şafakta kanodan balık tut'),
        resolve: (c) => {
          const catchIt = c.rng.chance(0.5);
          if (catchIt) {
            c.h.stat('happiness', 5);
            return c.t('You caught a real fish. You told the story more times than the fish deserved.', 'Gerçek bir balık yakaladın. Hikâyeyi balığın hak ettiğinden çok kez anlattın.');
          }
          c.h.stat('happiness', 2);
          return c.t('You fed three worms to the lake and caught a sunrise. It was a fair trade.', 'Göle üç solucan yedirdin, karşılığında bir gün doğumu yakaladın. Adil bir takastı.');
        },
      },
      {
        id: 'laptop',
        label: (c) => c.t('Check email "just once"', 'E-postalara "sadece bir kez" bak'),
        badge: 'Big money',
        resolve: (c) => {
          c.h.money(wage(c, 250));
          c.h.stat('happiness', -3);
          return c.t('The only signal was at the far end of the dock. You answered work emails with your feet in the water. The loons judged you.', 'Tek çekim iskelenin ucundaydı. İş e-postalarını ayakların suda yanıtladın. Dalgıç kuşları seni yargıladı.');
        },
      },
    ],
  },
  {
    id: 'ca.walk_in_clinic',
    category: 'health',
    minAge: 25,
    maxAge: 75,
    weight: 8,
    cooldown: 4,
    when: inCA,
    title: (c) => c.t('The walk-in clinic waiting room', 'Muayenehane bekleme salonu'),
    text: (c) =>
      c.t(
        'You have a cough that has overstayed its welcome, and no family doctor to take it to. The walk-in clinic is three hours long and the magazines are older than some of the patients.',
        'Misafirliği uzatan bir öksürüğün var ve gidecek bir aile doktorun yok. Yürüyerek gidilen klinikte bekleme üç saat sürüyor ve dergiler bazı hastalardan daha yaşlı.',
      ),
    choices: [
      {
        id: 'wait',
        label: (c) => c.t('Wait your turn', 'Sıranı bekle'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', -2);
          return c.t('Three hours later a doctor listened for ninety seconds and prescribed rest. It cost nothing, and it cost an afternoon.', 'Üç saat sonra bir doktor doksan saniye dinleyip dinlenmeyi önerdi. Para ödemedin ama bir öğleden sonranı verdin.');
        },
      },
      {
        id: 'pharmacy',
        label: (c) => c.t('Ask the pharmacist instead', 'Onun yerine eczacıya sor'),
        badge: 'Safe',
        resolve: (c) => {
          const sorted = c.rng.chance(0.6);
          c.h.money(-wage(c, 25));
          if (sorted) {
            c.h.stat('health', 2);
            c.h.stat('happiness', 1);
            return c.t('The pharmacist sorted you out in ten minutes with a lozenge and a firm look. You almost proposed.', 'Eczacı seni on dakikada bir pastil ve kararlı bir bakışla halletti. Neredeyse evlenme teklif edecektin.');
          }
          c.h.stat('health', -1);
          return c.t('The pharmacist said "if it is not better in a week, see a doctor". It was not. You are in the waiting room next week.', 'Eczacı "bir haftada geçmezse doktora git" dedi. Geçmedi. Gelecek hafta bekleme salonundasın.');
        },
      },
      {
        id: 'tough',
        label: (c) => c.t('Tough it out with soup', 'Çorbayla idare et'),
        badge: 'Risky',
        resolve: (c) => {
          const worse = c.rng.chance(0.4);
          if (worse) {
            c.h.stat('health', -4);
            c.h.stat('happiness', -2);
            return c.t('The cough did not go away. Eventually you went in anyway, tireder, with a longer prescription.', 'Öksürük geçmedi. Sonunda yine gittin; daha yorgun ve daha uzun bir reçeteyle.');
          }
          c.h.stat('health', 1);
          c.h.stat('happiness', 1);
          return c.t('It cleared up on its own after a week, and you felt smug about the money and the afternoon you saved.', 'Bir haftada kendiliğinden geçti; kazandığın para ve öğleden sonra için kendinle gurur duydun.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ elder
  {
    id: 'ca.shovel_out',
    category: 'random',
    minAge: 60,
    maxAge: 92,
    weight: 10,
    cooldown: 5,
    when: inCA,
    title: (c) => c.t('Shovelling out after the storm', 'Fırtınadan sonra kar küreme'),
    text: (c) =>
      c.t(
        'The storm left a metre of snow and a plough-made wall around your car. The shovel leans by the door like it knows.',
        'Fırtına bir metre kar ve arabanın etrafında kar temizleme aracının yaptığı bir duvar bıraktı. Kürek kapının yanında, her şeyi biliyormuş gibi dayanıyor.',
      ),
    choices: [
      {
        id: 'self',
        label: (c) => c.t('Shovel it yourself', 'Kendin küre'),
        badge: 'Risky',
        resolve: (c) => {
          const strain = c.rng.chance(0.25);
          if (strain) {
            c.h.stat('health', -6);
            c.h.stat('happiness', -2);
            return c.t('Halfway through, your back sent a firm message. You finished anyway, then lay on the couch for two days like a retired hero.', 'Yarıda belin sert bir mesaj gönderdi. Yine de bitirdin, sonra emekli bir kahraman gibi iki gün kanepede yattın.');
          }
          c.h.stat('health', 2);
          c.h.stat('happiness', 3);
          return c.t('You cleared the lot with a toque on your head and a plan in your heart. The path looked like a tidy trench.', 'Başında beresi, kalbinde planla her yeri temizledin. Patika derli toplu bir siper gibi görünüyordu.');
        },
      },
      {
        id: 'hire',
        label: (c) => c.t("Pay the neighbour's teenager", 'Komşunun gencine para ver'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 45));
          c.h.stat('happiness', 2);
          return c.t('The teenager did it in forty minutes and asked for a toonie extra for "style". You paid it.', 'Genç kırk dakikada bitirdi ve "tarz" için bir toonie fazladan istedi. Ödedin.');
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait for the thaw', 'Çözülmeyi bekle'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You stayed in with soup and a good book for three days. The snow melted in April, as scheduled.', 'Üç gün çorba ve iyi bir kitapla evde kaldın. Kar nisanda, tam zamanında eridi.');
        },
      },
    ],
  },
];
