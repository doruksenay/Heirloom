import type { Ctx, EventDef } from '../types';
import { cap, kin, wage, who } from '../base/util';
import { inCountry, line } from './common';

// Brazil, Mexico, Spain and Japan: everyday local-life events, gated to characters living there.

const br = inCountry('br');
const mx = inCountry('mx');
const es = inCountry('es');
const jp = inCountry('jp');

const money = (c: Ctx, usd: number) => c.p.money >= wage(c, usd);

const FAMILY = ['mother', 'father', 'sibling', 'child', 'spouse'] as const;

function familySetup(c: Ctx) {
  const r = c.h.relatives([...FAMILY])[0];
  if (r) {
    c.vars.pid = r.person.id;
    c.vars.k = r.rel.kind;
  }
}

const hasFamily = (c: Ctx) => c.h.relatives([...FAMILY]).length > 0;

export const worldEvents: EventDef[] = [
  // ====================================================================== BRAZIL
  {
    id: 'br.festa_junina',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    weight: 25,
    when: br,
    title: (c) => c.t('The festa junina', 'Festa junina'),
    text: (c) =>
      c.t(
        'June has come, and the school courtyard is full of paper flags, corn cake and a bonfire made of cardboard. You have been drafted into the quadrilha, the square dance.',
        'Haziran geldi; okul bahçesi kâğıt bayraklar, mısır keki ve kartondan yapılmış bir ateşle dolu. Kadril dansına, yani quadrilha’ya seni de yazmışlar.',
      ),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Dance in the quadrilha, straw hat and all', 'Hasır şapkanla kadrile katıl'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 3);
            return c.t(
              'You went left when everyone went right, and the whole line followed you out of pure trust. The teacher called it choreography.',
              'Herkes sağa giderken sen sola gittin, bütün sıra güvenle peşinden geldi. Öğretmen buna koreografi dedi.',
            );
          }
          c.h.stat('happiness', 6);
          return c.t(
            'Painted freckles, plaid shirt, perfect steps. Somebody’s grandmother filmed all of it, upside down.',
            'Boyalı çiller, ekose gömlek, kusursuz adımlar. Birinin büyükannesi hepsini çekti, ters çevirerek.',
          );
        },
      },
      {
        id: 'food',
        label: (c) => c.t('Work the food stalls', 'Yemek tezgâhlarına dal'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'Pamonha, canjica and popcorn, in that order, twice. You still call it dinner.',
            'Pamonha, canjica ve patlamış mısır; bu sırayla, iki tur. Hâlâ buna akşam yemeği diyorsun.',
          );
        },
      },
      {
        id: 'fishing',
        label: (c) => c.t('Play the fishing game for the prizes', 'Balık tutma oyununu oyna, ödüller için'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return line(c, [
            ['Every tug on the line brought up a tiny prize. You left with a pencil, a whistle and a plastic ring you still keep.', 'Oltanın her çekişinde küçük bir ödül çıktı. Bir kalem, bir düdük ve hâlâ sakladığın plastik bir yüzükle ayrıldın.'],
            ['You caught the same plush toy three times, because the volunteers were being kind. It was the best night of June.', 'Gönüllüler tatlılık yaptığı için aynı peluşu üç kez tuttun. Haziranın en güzel gecesiydi.'],
          ]);
        },
      },
    ],
  },
  {
    id: 'br.pelada',
    category: 'childhood',
    minAge: 8,
    maxAge: 17,
    weight: 25,
    when: br,
    title: (c) => c.t('The street pelada', 'Sokak maçı'),
    text: (c) =>
      c.t(
        'The goalposts are two flip-flops on each side, and the pitch is the end of your street. The only rule is that the ball goes in when the bus is not coming.',
        'Kale direkleri iki yandaki birer çift terlik, saha da sokağının sonu. Tek kural, otobüs gelmiyorken topun içeri girmesi.',
      ),
    choices: [
      {
        id: 'striker',
        label: (c) => c.t('Play up front and go for glory', 'Forvet oyna, şan için koş'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -3);
            c.h.stat('happiness', 3);
            return c.t(
              'You scored an overhead kick, then met the curb. Your knee has been telling the story ever since.',
              'Röveşata attın, sonra kaldırımla tanıştın. Dizin o günden beri hikâyeyi anlatıp duruyor.',
            );
          }
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          return c.t(
            'Three goals, one dribble past a boy twice your size, and a neighbor shouting your name from a window.',
            'Üç gol, senin iki katın bir çocuğu çalımla geçmek ve pencereden adını bağıran bir komşu.',
          );
        },
      },
      {
        id: 'goalie',
        label: (c) => c.t('Take the goal, between the flip-flops', 'Terlikler arasında kaleye geç'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'They say the weakest player goes in goal. You saved so much that they wondered who had said that.',
            'En zayıf oyuncu kaleye geçermiş derler. O kadar çok kurtardın ki bunu kimin söylediğini merak ettiler.',
          );
        },
      },
      {
        id: 'cheer',
        label: (c) => c.t('Sit on the wall and referee loudly', 'Duvara otur, yüksek sesle hakemlik yap'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'Nobody asked you to referee, and every decision was final. Both teams hated you, then asked you back next Sunday.',
            'Senden hakemlik isteyen olmadı, her kararın kesindi. İki takım da sana kızdı, sonra gelecek pazar için yine çağırdı.',
          );
        },
      },
    ],
  },
  {
    id: 'br.enem',
    category: 'school',
    minAge: 17,
    maxAge: 19,
    once: true,
    weight: 40,
    when: br,
    title: (c) => c.t('ENEM weekend', 'ENEM hafta sonu'),
    text: (c) =>
      c.t(
        'Two Sundays in November decide which university will take you: ENEM, with a famous essay and a lot of pencils. Everyone you know has a theory about the topic.',
        'Kasımda iki pazar, hangi üniversitenin seni alacağını belirliyor: ENEM; ünlü kompozisyonu ve bir sürü kurşun kalemiyle. Tanıdığın herkesin konu hakkında bir teorisi var.',
      ),
    choices: [
      {
        id: 'cursinho',
        label: (c) => c.t('Join a cursinho, the prep course', 'Hazırlık kursuna yazıl'),
        badge: 'Costs more',
        requires: (c) => money(c, 300),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('smarts', 3);
          c.h.stat('happiness', -1);
          return c.t(
            'Songs to remember chemistry, a teacher in a costume and a mock essay every week. You wrote about everything, including a topic that never came up.',
            'Kimyayı ezberletmek için şarkılar, kostümlü bir öğretmen ve her hafta bir deneme kompozisyonu. Çıkmayan bir konu dahil her şeyi yazdın.',
          );
        },
      },
      {
        id: 'alone',
        label: (c) => c.t('Study alone from old exams', 'Eski sınavlardan tek başına çalış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('smarts', 4);
            c.h.stat('happiness', 4);
            return c.t(
              'Old exams, free videos online and one very patient cousin. The score was good enough to dream about.',
              'Eski sınavlar, internette ücretsiz videolar ve çok sabırlı bir kuzen. Puan, hayal kurdurmaya yetecek kadar iyiydi.',
            );
          }
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -3);
          return c.t(
            'The essay topic was one you had never practiced. Your score was fine, and a little less fine than you hoped.',
            'Kompozisyon konusu hiç çalışmadığın bir konuydu. Puanın idare eder çıktı, umduğundan biraz daha az.',
          );
        },
      },
      {
        id: 'work',
        label: (c) => c.t('Take the exam, but start working first', 'Sınava gir ama önce çalışmaya başla'),
        resolve: (c) => {
          c.h.money(wage(c, 500));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 1);
          return c.t(
            'You took the test in the morning and your first shift in the afternoon. The university can wait one more year; the rent cannot.',
            'Sabah sınava girdin, öğleden sonra ilk vardiyana. Üniversite bir yıl daha bekleyebilir; kira bekleyemez.',
          );
        },
      },
    ],
  },
  {
    id: 'br.carnaval',
    category: 'random',
    minAge: 18,
    maxAge: 45,
    weight: 8,
    when: br,
    title: (c) => c.t('Carnaval is here', 'Karnaval başlıyor'),
    text: (c) =>
      c.t(
        'For a few days the whole country seems to move to a street party. Your friends have glitter in their bags and plans in six different neighborhoods.',
        'Birkaç gün boyunca bütün ülke sokak partisine taşınmış gibi. Arkadaşlarının çantasında simler, altı ayrı mahallede planlar var.',
      ),
    choices: [
      {
        id: 'bloco',
        label: (c) => c.t('Follow a bloco through the streets', 'Bir blokonun peşinden sokaklara düş'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 80));
          c.h.stat('happiness', 7);
          c.h.stat('health', -2);
          return c.t(
            'Seven hours of drums, sunscreen and someone else’s sandal. You lost your voice and found a song you will hum until June.',
            'Yedi saat davul, güneş kremi ve başkasının sandaleti. Sesini kaybettin ama Hazirana kadar mırıldanacağın bir şarkı buldun.',
          );
        },
      },
      {
        id: 'beach',
        label: (c) => c.t('Escape to a quiet beach town', 'Sakin bir sahil kasabasına kaç'),
        requires: (c) => money(c, 250),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', 4);
          c.h.stat('health', 3);
          return c.t(
            'Four days of coconut water and silence. It turned out that half the city had the same plan, but they were quiet too.',
            'Dört gün hindistan cevizi suyu ve sessizlik. Meğer şehrin yarısı aynı planı yapmış ama onlar da sessizmiş.',
          );
        },
      },
      {
        id: 'holiday',
        label: (c) => c.t('Sleep through the holiday at home', 'Tatili evde uyuyarak geçir'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 2);
          return c.t(
            'The drums went by under the window, and you waved from the couch like a retired king.',
            'Davullar pencerenin altından geçti, sen de kanepeden emekli bir kral gibi el salladın.',
          );
        },
      },
    ],
  },
  {
    id: 'br.jeitinho',
    category: 'random',
    minAge: 22,
    maxAge: 65,
    weight: 7,
    when: br,
    title: (c) => c.t('A paper at the cartório', 'Noterde bir evrak'),
    text: (c) =>
      c.t(
        'You need one stamped paper, and the line at the notary office wraps around the block. A cousin says he knows someone who knows a person inside.',
        'Mühürlü bir evraka ihtiyacın var ve noterin kuyruğu sokağı dolanıyor. Bir kuzenin, içeride birini tanıyan birini tanıdığını söylüyor.',
      ),
    choices: [
      {
        id: 'favor',
        label: (c) => c.t('Use the cousin’s connection, the jeitinho', 'Kuzenin tanıdığını kullan, jeitinho yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 4);
            return c.t(
              'The friend of the friend was kind, and the paper was ready in ten minutes. Now you owe the cousin a churrasco, and a lot of gratitude.',
              'Tanıdığın tanıdığı nazikti, evrak on dakikada hazırdı. Şimdi kuzene bir churrasco ve epey minnet borcun var.',
            );
          }
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t(
            'The person had moved to another office last month. You stood in the same line, now with an extra story to tell.',
            'O kişi geçen ay başka bir şubeye geçmişti. Aynı kuyrukta durdun; yanında anlatacak fazladan bir hikâyeyle.',
          );
        },
      },
      {
        id: 'queue',
        label: (c) => c.t('Wait in line with a thermos', 'Termosla kuyrukta bekle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.stat('smarts', 1);
          return c.t(
            'Three hours, one thermos of coffee and a deep friendship with the woman in front of you. Rules are rules.',
            'Üç saat, bir termos kahve ve önündeki kadınla derin bir dostluk. Kural kuraldır.',
          );
        },
      },
      {
        id: 'despachante',
        label: (c) => c.t('Hire a despachante to handle it', 'Bir despachante tut, o halletsin'),
        badge: 'Costs more',
        requires: (c) => money(c, 120),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', 3);
          return c.t(
            'A man in a polo shirt took your papers, walked into the building like it was his house and came out with a stamp.',
            'Polo tişörtlü bir adam evraklarını aldı, binaya kendi evine girer gibi girdi, elinde mühürle çıktı.',
          );
        },
      },
    ],
  },
  {
    id: 'br.churrasco',
    category: 'family',
    minAge: 25,
    maxAge: 75,
    weight: 8,
    cooldown: 3,
    when: br,
    title: (c) => c.t('Sunday churrasco', 'Pazar churrascosu'),
    text: (c) =>
      c.t(
        'The grill is lit, the farofa is ready and the whole family has an opinion about how the meat should be cooked. The uncle in charge has stepped away for a beer.',
        'Izgara yandı, farofa hazır ve bütün ailenin etin nasıl pişmesi gerektiği hakkında bir fikri var. Izgaranın başındaki amca bira almaya gitti.',
      ),
    choices: [
      {
        id: 'grill',
        label: (c) => c.t('Take over the grill', 'Izgarayı devral'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 6);
            return c.t(
              'The picanha came out pink inside and crisp outside. The uncle looked at it, nodded once and never mentioned it again.',
              'Picanha içi pembe, dışı çıtır çıktı. Amca baktı, bir kez başını salladı ve bir daha hiç bahsetmedi.',
            );
          }
          c.h.stat('happiness', 1);
          return c.t(
            'The meat was a little too well done. The family ate it with extra vinaigrette and called it "rustic."',
            'Et biraz fazla pişti. Aile üstüne bolca vinagrete koyup yedi ve buna “rustik” dedi.',
          );
        },
      },
      {
        id: 'drinks',
        label: (c) => c.t('Run out for ice and drinks', 'Buz ve içecek almaya koş'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 4);
          return c.t(
            'The ice bag was the hero of the day. You were thanked more than the man with the tongs.',
            'Buz torbası günün kahramanıydı. Maşalı adamdan daha çok teşekkür aldın.',
          );
        },
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Help with the salads and pão de alho', 'Salatalara ve sarımsaklı ekmeğe yardım et'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 1);
          return c.t(
            'In the kitchen the real talk was happening. By dessert you knew three secrets and a better way to cut onions.',
            'Asıl sohbet mutfaktaydı. Tatlıya kadar üç sır ve soğan doğramanın daha iyi bir yolunu öğrendin.',
          );
        },
      },
    ],
  },
  {
    id: 'br.whatsapp_familia',
    category: 'family',
    minAge: 28,
    maxAge: 85,
    weight: 7,
    cooldown: 5,
    when: (c) => br(c) && hasFamily(c),
    setup: familySetup,
    title: (c) => c.t('The family WhatsApp group', 'Aile WhatsApp grubu'),
    text: (c) => {
      const w = kin(c, who(c), String(c.vars.k));
      return c.t(
        `Every morning at 6:12 your ${w} posts "Bom dia, family!" over a picture of roses. By lunch there are 214 messages, and nobody has said anything.`,
        `Her sabah 6.12’de ${w} gül resimli bir “günaydın” gönderiyor. Öğlene kadar 214 mesaj birikiyor ve kimse bir şey söylememiş oluyor.`,
      );
    },
    choices: [
      {
        id: 'answer',
        label: (c) => c.t('Answer with a heart and a flower', 'Kalp ve çiçekle cevap ver'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 3);
          c.h.stat('happiness', 3);
          return c.t(
            'One small heart cost you nothing. By evening, the whole group had added hearts to your heart.',
            'Küçük bir kalp sana bir şeye mal olmadı. Akşama bütün grup kalbinin üstüne kalp ekledi.',
          );
        },
      },
      {
        id: 'mute',
        label: (c) => c.t('Mute the group for a quiet year', 'Grubu sessize al, sakin bir yıl geçir'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -2);
          c.h.stat('happiness', 3);
          return c.t(
            'Your phone is finally quiet. You missed a family lunch announced only in the group, and that took a week to be forgiven.',
            'Telefonun sonunda sessiz. Yalnızca grupta duyurulan bir aile yemeğini kaçırdın ve bunun affedilmesi bir hafta sürdü.',
          );
        },
      },
      {
        id: 'verify',
        label: (c) => c.t('Politely check the scary forwarded news', 'Korkutucu haberleri nazikçe doğrula'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), 2);
            c.h.stat('smarts', 2);
            return c.t(
              'You sent the link that explained everything, with a smile. For once someone replied, "Oh, thank you."',
              'Her şeyi açıklayan bağlantıyı gülücükle gönderdin. Bir kez olsun biri “Ay, teşekkürler” yazdı.',
            );
          }
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', -2);
          return c.t(
            'Your fact-check started a forty-message debate that ended with voice notes. Nobody changed their mind.',
            'Doğrulaman kırk mesajlık bir tartışma başlattı ve sesli mesajlarla bitti. Kimse fikrini değiştirmedi.',
          );
        },
      },
    ],
  },

  // ====================================================================== MEXICO
  {
    id: 'mx.posada',
    category: 'childhood',
    minAge: 5,
    maxAge: 12,
    weight: 25,
    when: mx,
    title: (c) => c.t('The posada piñata', 'Posada piñatası'),
    text: (c) =>
      c.t(
        'It is December, and the neighbors are holding a posada in the courtyard, with candles, hot ponche and a star-shaped piñata. You are first in line with the stick.',
        'Aralık ayı; komşular avluda posada yapıyor: mumlar, sıcak ponche ve yıldız biçimli bir piñata. Sopayla ilk sırada sen varsın.',
      ),
    choices: [
      {
        id: 'swing',
        label: (c) => c.t('Take a big swing, blindfolded', 'Gözün bağlı, var gücünle vur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.stat('happiness', 7);
            return c.t(
              'Crack! Candy and oranges rained down, and you stood in the middle of a stampede of delighted cousins.',
              'Çat! Şekerler ve portakallar yağdı, sen de sevinçli kuzenlerin izdihamının tam ortasında kaldın.',
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            'You hit the air, a bush and your uncle’s hat. The song said "dale, dale, dale", and you still gave it your all.',
            'Havaya, bir çalıya ve amcanın şapkasına vurdun. Şarkı “dale, dale, dale” diyordu, sen de elinden geleni yaptın.',
          );
        },
      },
      {
        id: 'bag',
        label: (c) => c.t('Stay by the candy bags and hand them out', 'Şeker poşetlerinin başında kal, dağıt'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'Each guest got a paper bag with peanuts, tangerine and a sugar candy. You counted them and made an extra one for yourself.',
            'Her konuğa fıstıklı, mandalinalı, şekerli bir kâğıt poşet düştü. Saydın ve kendine de bir tane fazla yaptın.',
          );
        },
      },
      {
        id: 'sing',
        label: (c) => c.t('Join the pilgrims’ song at the door', 'Kapıdaki yolcu şarkısına katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'The posada tradition is to knock and ask for shelter in song. Your voice cracked and the neighbors opened the door anyway.',
            'Posada geleneği, şarkıyla kapı çalıp barınak istemek. Sesin çatladı, komşular yine de kapıyı açtı.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.quince',
    category: 'family',
    minAge: 10,
    maxAge: 40,
    weight: 6,
    cooldown: 6,
    when: mx,
    title: (c) => c.t('A cousin’s quinceañera', 'Kuzenin on beşinci yaş partisi'),
    text: (c) =>
      c.t(
        'Your cousin is turning fifteen, and the family has been planning the quinceañera for two years: a church mass, a choreographed waltz and three hundred guests. You are asked to be in the court.',
        'Kuzenin on beş yaşına giriyor ve aile iki yıldır quinceañera’yı planlıyor: kilisede ayin, koreografili bir vals ve üç yüz davetli. Senden onur kortejinde yer almanı istiyorlar.',
      ),
    choices: [
      {
        id: 'court',
        label: (c) => c.t('Join the waltz rehearsals', 'Vals provalarına katıl'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', 5);
          return c.t(
            'Twelve rehearsals, matching outfits and one unforgettable moment when everybody stepped left. The photos are framed in three homes.',
            'On iki prova, uyumlu kıyafetler ve herkesin sola adım attığı unutulmaz bir an. Fotoğraflar üç evde çerçevede.',
          );
        },
      },
      {
        id: 'gift',
        label: (c) => c.t('Give a generous gift and sit at the table', 'Cömert bir hediye ver, masaya otur'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 100));
          c.h.stat('happiness', 4);
          return c.t(
            'You sat with the uncles and the cake, ate everything twice and clapped for the entrance. Dancing could wait until the banda started.',
            'Amcaların ve pastanın yanında oturdun, her şeyi iki kez yedin, girişi alkışladın. Dans, bandonun başlamasını bekleyebilirdi.',
          );
        },
      },
      {
        id: 'dj',
        label: (c) => c.t('Offer to help with music and photos', 'Müzik ve fotoğraf işine yardım et'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 3);
          return c.t(
            'You were the hero of the evening when the speaker broke and your phone saved the party. Nobody remembered who the quinceañera girl’s dress designer was.',
            'Hoparlör bozulunca telefonun partiyi kurtardı ve akşamın kahramanı oldun. Kimse elbiseyi kimin diktiğini hatırlamadı.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.fiestas_patrias',
    category: 'random',
    minAge: 18,
    maxAge: 70,
    weight: 7,
    when: mx,
    title: (c) => c.t('The night of the Grito', 'Grito gecesi'),
    text: (c) =>
      c.t(
        'It is the night of September 15, and every plaza in the country will shout "¡Viva México!" at eleven. Your friends are in green, white and red, and you have a voice left for one shout.',
        'Eylülün on beşi gecesi; ülkenin her meydanı saat on birde “¡Viva México!” diye bağıracak. Arkadaşların yeşil, beyaz, kırmızı giyinmiş ve senin bir çığlık kadar sesin kaldı.',
      ),
    choices: [
      {
        id: 'plaza',
        label: (c) => c.t('Join the crowd in the main plaza', 'Ana meydandaki kalabalığa karış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.money(-wage(c, 60));
            c.h.stat('happiness', 3);
            return c.t(
              'The crowd was huge, the bells rang and a pickpocket enjoyed the show too. You went home with a lighter wallet and a heavier heart.',
              'Kalabalık kocamandı, çanlar çaldı ve bir yankesici de gösteriyi seyretti. Eve hafif bir cüzdan ve ağır bir kalple döndün.',
            );
          }
          c.h.stat('happiness', 7);
          return c.t(
            'Fireworks, mariachi and a stranger who handed you a flag and a cup of atole. You shouted until you had no voice.',
            'Havai fişekler, mariachi ve sana bir bayrak ve bir bardak atole uzatan bir yabancı. Sesin çıkmayana kadar bağırdın.',
          );
        },
      },
      {
        id: 'pozole',
        label: (c) => c.t('Host a pozole night at home', 'Evde pozole gecesi ver'),
        badge: 'Costs more',
        requires: (c) => money(c, 90),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 90));
          c.h.stat('happiness', 5);
          return c.t(
            'A giant pot, a small TV and eleven neighbors with strong opinions about the chiles. You shouted from the living room, and the grito was the loudest in the building.',
            'Kocaman bir tencere, küçük bir televizyon ve acı biberler hakkında güçlü görüşleri olan on bir komşu. Oturma odasından bağırdın, binanın en gür çığlığı seninkiydi.',
          );
        },
      },
      {
        id: 'work',
        label: (c) => c.t('Work the evening shift, selling food', 'Akşam vardiyasında yemek sat'),
        resolve: (c) => {
          c.h.money(wage(c, 150));
          c.h.stat('happiness', 1);
          return c.t(
            'Business was brisk, since a holiday makes the whole street hungry. You heard the grito over the sizzle of the griddle.',
            'İş canlıydı; tatil bütün sokağı aç bırakır. Çığlığı ızgaranın cızırtısının üstünden duydun.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.tanda',
    category: 'money',
    minAge: 20,
    maxAge: 60,
    weight: 7,
    when: mx,
    title: (c) => c.t('The tanda', 'Tanda'),
    text: (c) =>
      c.t(
        'A coworker is organizing a tanda: twelve people each put in the same amount every two weeks, and each takes a turn with the whole pot. It runs on trust and a notebook.',
        'Bir iş arkadaşın tanda düzenliyor: on iki kişi iki haftada bir aynı parayı koyuyor ve sırayla bütün havuzu alıyor. Güvenle ve bir defterle işliyor.',
      ),
    choices: [
      {
        id: 'early',
        label: (c) => c.t('Ask for turn number one', 'Birinci sırayı iste'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.money(wage(c, 700));
          if (c.rng.chance(0.25)) {
            c.h.money(-wage(c, 250));
            c.h.stat('happiness', -2);
            return c.t(
              'You got the pot first, and then one member quietly stopped paying. You covered their share and the notebook now has a red page.',
              'Havuzu ilk sen aldın, sonra bir üye sessizce ödemeyi bıraktı. Payını sen tamamladın, defterin artık kırmızı bir sayfası var.',
            );
          }
          c.h.stat('happiness', 4);
          return c.t(
            'The pot arrived just when the refrigerator died. You paid the rest on time, because no one wants to be the one who owes.',
            'Havuz, buzdolabı bozulunca tam zamanında geldi. Kalanı da vaktinde ödedin; kimse borçlu olmak istemez.',
          );
        },
      },
      {
        id: 'late',
        label: (c) => c.t('Take the last turn and save steadily', 'Son sırayı al, düzenli biriktir'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 350));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            'At the end you got a pot you had forgotten about, like a gift from a more organized version of yourself.',
            'Sonunda unuttuğun bir havuz elinde belirdi; kendinin daha düzenli bir halinden gelen bir hediye gibi.',
          );
        },
      },
      {
        id: 'organize',
        label: (c) => c.t('Run the tanda yourself', 'Tandayı kendin yönet'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.money(wage(c, 250));
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 3);
            return c.t(
              'You kept the notebook, sent the reminders and delivered every pot on time. The group gave you the first mole of the season.',
              'Defteri sen tuttun, hatırlatmaları sen yolladın, her havuzu vaktinde teslim ettin. Grup sana sezonun ilk molesini ikram etti.',
            );
          }
          c.h.stat('happiness', -4);
          c.h.stat('health', -1);
          return c.t(
            'Chasing payments is a real job. By the end you knew everyone’s excuses by heart, and none of them was a lie.',
            'Ödeme kovalamak gerçek bir iş. Sonunda herkesin bahanesini ezbere biliyordun ve hiçbiri yalan değildi.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.comida_domingo',
    category: 'family',
    minAge: 25,
    maxAge: 80,
    weight: 8,
    cooldown: 3,
    when: (c) => mx(c) && hasFamily(c),
    setup: familySetup,
    title: (c) => c.t('Sunday comida', 'Pazar comidası'),
    text: (c) => {
      const w = kin(c, who(c), String(c.vars.k));
      return c.t(
        `The big meal starts at three and ends when the light goes. Your ${w} asks if you want a little more, which means a lot more, and the aunts are already asking about your plans.`,
        `Büyük öğle yemeği üçte başlıyor, ışık gidince bitiyor. ${cap(w)} biraz daha ister misin diye soruyor, yani çok daha fazla; teyzeler de planlarını sormaya başladı bile.`,
      );
    },
    choices: [
      {
        id: 'stay',
        label: (c) => c.t('Stay for the long sobremesa', 'Uzun sohbete kal'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', 6);
          c.h.stat('health', -1);
          return c.t(
            'Dessert became coffee, coffee became stories and the stories became the old photos. You left at nine, with a container of leftovers for tomorrow.',
            'Tatlı kahveye, kahve hikâyelere, hikâyeler eski fotoğraflara dönüştü. Dokuzda, yarın için bir kap artıkla ayrıldın.',
          );
        },
      },
      {
        id: 'cook',
        label: (c) => c.t('Help in the kitchen and learn the recipe', 'Mutfakta yardım et, tarifi öğren'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 4);
          return c.t(
            'The recipe was "a little of this and enough of that." You wrote it down anyway and the first try was nearly right.',
            'Tarif “biraz şundan, yeterince bundan” idi. Yine de yazdın ve ilk denemen neredeyse tutturdu.',
          );
        },
      },
      {
        id: 'early',
        label: (c) => c.t('Leave early, you have things to do', 'Erken ayrıl, işin var'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', -1);
          return c.t(
            'You got your work done, and a plate was sent after you in foil, with a note that said only "just in case."',
            'İşlerini bitirdin; arkandan folyoya sarılı bir tabak gönderildi, üstünde yalnızca “ne olur ne olmaz” yazan bir not.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.dia_de_muertos',
    category: 'family',
    minAge: 7,
    maxAge: 90,
    weight: 8,
    cooldown: 5,
    when: mx,
    title: (c) => c.t('The ofrenda', 'Ofrenda'),
    text: (c) =>
      c.t(
        'It is the first days of November. The family is building an ofrenda with marigolds, candles, pan de muerto and the favorite things of those who are gone. Someone has put out a small glass of mezcal and a very old photograph.',
        'Kasımın ilk günleri. Aile; kadife çiçekleri, mumlar, pan de muerto ve gidenlerin sevdiği şeylerle bir ofrenda kuruyor. Biri küçük bir kadeh mezkal ve çok eski bir fotoğraf koymuş.',
      ),
    choices: [
      {
        id: 'build',
        label: (c) => c.t('Help build the ofrenda', 'Ofrenda’yı kurmaya yardım et'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return line(c, [
            ['You cut paper banners for hours and learned that your great-grandmother liked her coffee with cinnamon. The house smelled of marigolds for a week.', 'Saatlerce kâğıt bayrak kestin ve büyük büyükannenin kahvesini tarçınla sevdiğini öğrendin. Ev bir hafta kadife çiçeği koktu.'],
            ['You placed the candles and the photographs. Somebody told a funny story about the person in the picture, and everybody laughed. That is what the day is for.', 'Mumları ve fotoğrafları yerleştirdin. Biri fotoğraftaki kişi hakkında komik bir hikâye anlattı ve herkes güldü. Bu günün anlamı da bu.'],
          ]);
        },
        tone: 'good',
      },
      {
        id: 'cemetery',
        label: (c) => c.t('Spend the night at the cemetery', 'Geceyi mezarlıkta geçir'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t(
            'Candles on every grave, guitars in the dark and tamales passed over a stone. It was less sad than you expected, and more beautiful.',
            'Her mezarda mumlar, karanlıkta gitarlar ve bir taşın üstünden uzatılan tamaller. Beklediğinden daha az hüzünlü, daha güzeldi.',
          );
        },
      },
      {
        id: 'parade',
        label: (c) => c.t('Go see the parade and the catrinas', 'Geçit törenini ve catrina’ları görmeye git'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'Skeleton makeup, giant puppets and a drum that you felt in your ribs. A child in a tiny hat asked if you also had a story to tell.',
            'İskelet makyajları, dev kuklalar ve kaburgalarında hissettiğin bir davul. Minik şapkalı bir çocuk senin de anlatacak bir hikâyen var mı diye sordu.',
          );
        },
      },
    ],
  },
  {
    id: 'mx.negocio_familiar',
    category: 'work',
    minAge: 30,
    maxAge: 65,
    weight: 6,
    cooldown: 6,
    when: mx,
    title: (c) => c.t('The family stall at the market', 'Pazardaki aile tezgâhı'),
    text: (c) =>
      c.t(
        'The family has sold fruit and chiles at the same stall of the tianguis for three generations. A cousin wants to open a second one across town, and an aunt wants everything to remain as it is.',
        'Aile, tianguis’teki aynı tezgâhta üç kuşaktır meyve ve biber satıyor. Bir kuzen şehrin öbür ucunda ikinci tezgâh açmak istiyor, bir teyze her şeyin olduğu gibi kalmasını.',
      ),
    choices: [
      {
        id: 'expand',
        label: (c) => c.t('Invest in the second stall', 'İkinci tezgâha yatırım yap'),
        badge: 'Risky',
        requires: (c) => money(c, 1200),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          if (c.rng.chance(0.55)) {
            c.h.money(wage(c, 3200));
            c.h.stat('happiness', 5);
            return c.t(
              'The new stall quickly had its own regulars. The aunt came to inspect it, tasted a mango and approved.',
              'Yeni tezgâh çabucak kendi müdavimlerini edindi. Teyze denetlemeye geldi, bir mango tattı ve onayladı.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'The location was quiet on the days nobody expected. You closed it after a season; the cousin learned a lot, expensively.',
            'Konum, kimsenin beklemediği günlerde sessizdi. Bir sezon sonra kapattın; kuzen çok şey öğrendi, pahalıya.',
          );
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it small and keep the old regulars', 'Küçük kal, eski müdavimleri koru'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 400));
          c.h.stat('happiness', 4);
          return c.t(
            'The old customers asked for "the usual" before you even said hello. That is a kind of wealth, too.',
            'Eski müşteriler daha merhaba demeden “her zamankinden” istedi. Bu da bir tür zenginlik.',
          );
        },
      },
      {
        id: 'online',
        label: (c) => c.t('Start taking orders by phone', 'Telefonla sipariş almaya başla'),
        resolve: (c) => {
          c.h.money(wage(c, 150));
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'A group chat, a photo of the day’s fruit and a little bike for deliveries. The aunt said it was nonsense, then ordered three kilos of limes.',
            'Bir mesaj grubu, günün meyvelerinin fotoğrafı ve teslimat için küçük bir bisiklet. Teyze saçmalık dedi, sonra üç kilo limon sipariş etti.',
          );
        },
      },
    ],
  },

  // ====================================================================== SPAIN
  {
    id: 'es.reyes',
    category: 'childhood',
    minAge: 4,
    maxAge: 11,
    weight: 25,
    when: es,
    title: (c) => c.t('The night of the Three Kings', 'Üç Kral gecesi'),
    text: (c) =>
      c.t(
        'It is January 5. You watched the parade, filled your pockets with candy thrown from the floats, and put out your shoes with a plate of cookies for the Kings and a bowl of water for the camels.',
        'Ocağın beşi. Geçit törenini izledin, arabalardan atılan şekerlerle ceplerini doldurdun, ayakkabılarını Kralların kurabiyeleri ve develerin su kabıyla yerleştirdin.',
      ),
    choices: [
      {
        id: 'sleep',
        label: (c) => c.t('Go to bed early so the Kings can come', 'Krallar gelsin diye erken yat'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'You never slept a minute, of course. At seven you ran down the hall and found shoes full of presents and an empty plate with crumbs.',
            'Tabii ki bir dakika uyumadın. Yediyi geçe koridorda koştun; ayakkabılar hediye doluydu, tabakta yalnızca kırıntılar kalmıştı.',
          );
        },
      },
      {
        id: 'spy',
        label: (c) => c.t('Stay up to catch the Kings', 'Kralları yakalamak için uyanık kal'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            c.h.stat('smarts', 1);
            return c.t(
              'You heard a suspicious rustle and the smell of your father’s aftershave. You decided never to tell anyone.',
              'Şüpheli bir hışırtı duydun ve babanın tıraş losyonu koktu. Kimseye söylememeye karar verdin.',
            );
          }
          c.h.stat('happiness', 6);
          return c.t(
            'You fell asleep at ten past eleven, face down on the sofa. In the morning the sofa had a new bicycle on it.',
            'Onbirü on geçe kanepede yüzüstü uyuyakaldın. Sabah kanepenin üstünde yeni bir bisiklet vardı.',
          );
        },
      },
      {
        id: 'roscon',
        label: (c) => c.t('Dig into the roscón for the hidden bean', 'Roscón’da saklı baklayı bul'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return line(c, [
            ['You found the figurine and became king for the day, crown included. The bean went to your uncle, who has to buy next year’s roscón.', 'Heykelciği buldun ve tacıyla birlikte günün kralı oldun. Bakla amcana düştü, gelecek yılın roscón’unu o alacak.'],
            ['You bit into the bean, and everyone shouted. You will be paying for next year’s roscón, with great honor.', 'Baklayı ısırdın ve herkes bağırdı. Gelecek yılın roscón’unu büyük bir onurla sen alacaksın.'],
          ]);
        },
      },
    ],
  },
  {
    id: 'es.san_juan',
    category: 'random',
    minAge: 12,
    maxAge: 40,
    weight: 8,
    when: es,
    title: (c) => c.t('The night of San Juan', 'San Juan gecesi'),
    text: (c) =>
      c.t(
        'It is June 23, one of the shortest nights of the year. Everyone is heading to the beach with bonfires, sardines, a speaker and a piece of paper on which to write what they want to leave behind.',
        'Haziranın yirmi üçü, yılın en kısa gecelerinden biri. Herkes kumsala gidiyor: ateşler, sardalyeler, bir hoparlör ve geride bırakmak istediğini yazmak için bir parça kâğıt.',
      ),
    choices: [
      {
        id: 'waves',
        label: (c) => c.t('Jump seven waves at midnight', 'Gece yarısı yedi dalgadan atla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -2);
            c.h.stat('happiness', 3);
            return c.t(
              'The sea was colder than the tradition suggested. You jumped all seven anyway, and your wish came true in the form of a blanket.',
              'Deniz geleneğin ima ettiğinden soğuktu. Yine de yedisini de atladın ve dileğin battaniye olarak gerçekleşti.',
            );
          }
          c.h.stat('happiness', 6);
          c.h.stat('health', 1);
          return c.t(
            'Seven waves, seven wishes and a friend who lost count at four. The water was cold, and the night was brilliant.',
            'Yedi dalga, yedi dilek ve dördünde sayıyı şaşıran bir arkadaş. Su soğuktu, gece muhteşemdi.',
          );
        },
      },
      {
        id: 'paper',
        label: (c) => c.t('Write down what you want to let go and burn it', 'Bırakmak istediğini yaz ve yak'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return c.t(
            'You wrote a whole page, then burned it. The fire popped, and you felt very light, as if you had left your bag on the sand.',
            'Bir sayfa yazdın, sonra yaktın. Ateş çıtırdadı ve çantanı kumda bırakmış gibi çok hafifledin.',
          );
        },
      },
      {
        id: 'sardines',
        label: (c) => c.t('Stay by the fire with sardines and friends', 'Ateşin başında sardalye ve arkadaşlarla kal'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'You grilled fish, played guitar badly and watched the sky go pale at six. Sand is still in your pockets.',
            'Balık ızgara yaptın, gitarı kötü çaldın ve gökyüzünün altıda solmasını izledin. Ceplerinde hâlâ kum var.',
          );
        },
      },
    ],
  },
  {
    id: 'es.selectividad',
    category: 'school',
    minAge: 17,
    maxAge: 18,
    once: true,
    weight: 40,
    when: es,
    title: (c) => c.t('Selectividad week', 'Selectividad haftası'),
    text: (c) =>
      c.t(
        'Your whole last year of school comes down to a few days of exams, still called Selectividad by everyone (it is officially the PAU now). Your future degree depends on a cut-off mark that nobody knows until the results come out.',
        'Lisenin son yılı birkaç günlük bir sınava iniyor; herkes ona hâlâ Selectividad diyor (resmî adı artık PAU). Gelecekteki bölümün, sonuçlar açıklanana kadar kimsenin bilmediği bir taban puana bağlı.',
      ),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Study all night with coffee', 'Kahveyle sabaha kadar çalış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('smarts', 3);
            c.h.stat('happiness', 4);
            c.h.stat('health', -2);
            return c.t(
              'You knew the whole syllabus and a few things that were not on it. The mark was high enough for your first choice.',
              'Bütün konuları ve konuların dışında da birkaç şeyi biliyordun. Not, ilk tercihine yetecek kadar yüksekti.',
            );
          }
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -4);
          c.h.stat('health', -3);
          return c.t(
            'You were so tired by the third exam that you nearly wrote your own name wrong. The mark was a few decimals short.',
            'Üçüncü sınavda o kadar yorgundun ki neredeyse kendi adını yanlış yazacaktın. Not, birkaç ondalık eksik kaldı.',
          );
        },
      },
      {
        id: 'steady',
        label: (c) => c.t('Keep a calm schedule with rest', 'Dinlenmeli sakin bir program tut'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'You slept eight hours, ate a proper lunch and answered everything calmly. Your friends called you a machine; you called yourself rested.',
            'Sekiz saat uyudun, düzgün öğle yemeği yedin, hepsini sakince cevapladın. Arkadaşların sana makine dedi; sen dinlenmiş dedin.',
          );
        },
      },
      {
        id: 'academia',
        label: (c) => c.t('Pay for a private academy crash course', 'Özel bir akademide hızlandırılmış kursa yazıl'),
        badge: 'Costs more',
        requires: (c) => money(c, 250),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('smarts', 3);
          return c.t(
            'Three weeks of tricks for every possible question. The teacher predicted two of the exam topics exactly.',
            'Çıkabilecek her soru için üç haftalık püf noktalar. Öğretmen sınav konularından ikisini tam olarak tahmin etti.',
          );
        },
      },
    ],
  },
  {
    id: 'es.semana_santa',
    category: 'random',
    minAge: 14,
    maxAge: 85,
    weight: 7,
    when: es,
    title: (c) => c.t('Holy Week', 'Kutsal Hafta'),
    text: (c) =>
      c.t(
        'It is Semana Santa. The streets are closed for the processions, the drums echo among the buildings and every bakery window shows torrijas. You have a few days off.',
        'Semana Santa geldi. Sokaklar alaylar için kapalı, davullar binalar arasında yankılanıyor ve her fırının vitrininde torrijas var. Birkaç gün izinlisin.',
      ),
    choices: [
      {
        id: 'procession',
        label: (c) => c.t('Watch the procession in the old town', 'Eski şehirde alayı izle'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'The floats swayed past in silence, with candles, incense and penitents in pointed hoods. Whatever you believe, it moved you.',
            'Sessizlik içinde, mumlar, tütsü ve sivri başlıklı tövbekârlarla kutsal heykellerin taşındığı platformlar salınarak geçti. Neye inanırsan inan, seni etkiledi.',
          );
        },
      },
      {
        id: 'escape',
        label: (c) => c.t('Take the long weekend at the coast', 'Uzun hafta sonunu sahilde geçir'),
        badge: 'Costs more',
        requires: (c) => money(c, 200),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('happiness', 4);
          c.h.stat('health', 2);
          return c.t(
            'The beach was cold, the bars were open and every other family had the same idea. You ate rice by the sea and called it spring.',
            'Plaj soğuktu, barlar açıktı ve her ailenin aynı fikri vardı. Deniz kıyısında pilav yedin ve buna bahar dedin.',
          );
        },
      },
      {
        id: 'torrijas',
        label: (c) => c.t('Bake torrijas with the family', 'Aileyle torrijas yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          return c.t(
            'Milk, bread, egg, cinnamon and a frying pan that was never quite hot enough. The first batch disappeared before the second began.',
            'Süt, ekmek, yumurta, tarçın ve hiçbir zaman yeterince ısınmayan bir tava. İlk parti, ikincisi başlamadan yok oldu.',
          );
        },
      },
    ],
  },
  {
    id: 'es.oposiciones',
    category: 'work',
    minAge: 24,
    maxAge: 38,
    once: true,
    weight: 8,
    when: es,
    title: (c) => c.t('The oposiciones', 'Kamu sınavı: oposiciones'),
    text: (c) =>
      c.t(
        'A permanent public post, a "plaza," means a safe job for life. It also means a syllabus with eighty topics, two thousand applicants and an exam held once a year, if you are lucky.',
        'Kadrolu bir kamu görevi, yani “plaza”, ömür boyu güvenli bir iş demek. Aynı zamanda seksen konuluk bir müfredat, iki bin aday ve şanslıysan yılda bir yapılan bir sınav demek.',
      ),
    choices: [
      {
        id: 'full',
        label: (c) => c.t('Study full time with a tutor', 'Hoca tutup tam zamanlı çalış'),
        badge: 'Costs more',
        requires: (c) => money(c, 500),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 500));
          c.h.stat('smarts', 3);
          c.h.stat('happiness', -3);
          if (c.rng.chance(0.3)) {
            c.h.money(wage(c, 2500));
            c.h.stat('happiness', 7);
            return c.t(
              'A year in a library, a tutor on speed dial and then your name on the list. You got a plaza, and a long holiday you can finally afford to enjoy.',
              'Bir yıl kütüphanede, hızlı aramada bir hoca ve sonra listede senin adın. Bir plaza kaptın; sonunda keyfini çıkarabileceğin uzun bir tatil de.',
            );
          }
          return c.t(
            'You came close, a few places short, and that is how it often goes. The next call is in two years, and you know the whole syllabus now.',
            'Çok yaklaştın, birkaç sıra eksik kaldın; çoğu zaman böyle olur. Bir sonraki sınav iki yıl sonra ve artık müfredatın tamamını biliyorsun.',
          );
        },
      },
      {
        id: 'part',
        label: (c) => c.t('Study evenings after work', 'Akşamları işten sonra çalış'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('health', -2);
          if (c.rng.chance(0.15)) {
            c.h.money(wage(c, 2000));
            c.h.stat('happiness', 6);
            return c.t(
              'Evenings at the kitchen table, topics on index cards, and one lucky draw of questions. You passed.',
              'Mutfak masasında akşamlar, fişlere yazılmış konular ve bir şanslı soru çekilişi. Geçtin.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'You did not make it this time. The index cards are on the fridge, waiting for another round.',
            'Bu sefer olmadı. Fişler buzdolabının üstünde, bir tura daha hazır bekliyor.',
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Decide it is not for you', 'Bunun sana göre olmadığına karar ver'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.money(wage(c, 150));
          return c.t(
            'Eighty topics were not your idea of life. You kept your evenings and took a job where you could be yourself.',
            'Seksen konu senin yaşam fikrin değildi. Akşamlarını korudun ve kendin olabileceğin bir işi seçtin.',
          );
        },
      },
    ],
  },
  {
    id: 'es.sobremesa',
    category: 'random',
    minAge: 26,
    maxAge: 80,
    weight: 8,
    when: es,
    title: (c) => c.t('The long lunch', 'Uzun öğle yemeği'),
    text: (c) =>
      c.t(
        'Lunch is at two, and the "menú del día" has arrived: three courses, bread, a drink and coffee for the price of a sandwich. The table is not even thinking about leaving.',
        'Öğle yemeği ikide ve “günün menüsü” geldi: üç yemek, ekmek, içecek ve kahve, bir sandviç fiyatına. Masa kalkmayı düşünmüyor bile.',
      ),
    choices: [
      {
        id: 'sobremesa',
        label: (c) => c.t('Stay for the sobremesa', 'Sohbet için masada kal'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('smarts', 1);
          return c.t(
            'Coffee turned into an hour, an hour into the world’s problems and a solution for each of them. Then somebody remembered the afternoon.',
            'Kahve bir saate, bir saat dünyanın sorunlarına ve her birinin çözümüne dönüştü. Sonra biri öğleden sonrayı hatırladı.',
          );
        },
      },
      {
        id: 'siesta',
        label: (c) => c.t('Go home for a short siesta', 'Eve git, kısa bir siesta yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          return c.t(
            'Twenty minutes on the sofa with the blinds half closed and the television murmuring. You returned with energy the rest of the office envied.',
            'Panjurlar yarı kapalı, televizyon mırıldanırken kanepede yirmi dakika. Ofisin geri kalanının imrendiği bir enerjiyle döndün.',
          );
        },
      },
      {
        id: 'sandwich',
        label: (c) => c.t('Eat at your desk and finish early', 'Masanda ye, erken bitir'),
        resolve: (c) => {
          c.h.money(wage(c, 60));
          c.h.stat('happiness', -2);
          c.h.stat('health', -1);
          return c.t(
            'You left early with a sandwich in one hand and a feeling that you missed something. You did: three courses and a story.',
            'Bir elinde sandviçle, bir şeyi kaçırdığın hissiyle erken çıktın. Gerçekten de kaçırdın: üç yemek ve bir hikâye.',
          );
        },
      },
    ],
  },
  {
    id: 'es.paga_extra',
    category: 'money',
    minAge: 26,
    maxAge: 64,
    weight: 7,
    cooldown: 5,
    needs: ['employed'],
    when: es,
    title: (c) => c.t('The extra pay', 'Ekstra maaş: paga extra'),
    text: (c) =>
      c.t(
        'December is here, and with it the extra payment: a double paycheck that everyone in the office has been planning to spend since September.',
        'Aralık geldi, yanında ekstra maaş da: ofisteki herkesin eylülden beri harcamayı planladığı çifte maaş.',
      ),
    choices: [
      {
        id: 'trip',
        label: (c) => c.t('Spend it on a trip', 'Bir gezide harca'),
        badge: 'Costs more',
        requires: (c) => money(c, 600),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.stat('happiness', 7);
          return c.t(
            'A weekend in a new city, a bag of strange cheese and a photo on the fridge. Nobody regretted it.',
            'Yeni bir şehirde hafta sonu, bir poşet tuhaf peynir ve buzdolabında bir fotoğraf. Kimse pişman olmadı.',
          );
        },
      },
      {
        id: 'save',
        label: (c) => c.t('Put it straight into savings', 'Doğrudan birikime at'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 900));
          c.h.stat('happiness', 1);
          c.h.stat('smarts', 1);
          return c.t(
            'It felt grown-up and a little bit boring, as it should. The account liked it.',
            'Büyük insan işiydi ve biraz sıkıcıydı, olması gerektiği gibi. Hesabın hoşuna gitti.',
          );
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Help the family with big bills', 'Aileye büyük faturalarda yardım et'),
        resolve: (c) => {
          c.h.money(wage(c, 300));
          c.h.stat('happiness', 4);
          return c.t(
            'The heating bill disappeared and the dinner at your parents’ was extra long that night. Nobody counted the euros.',
            'Isınma faturası kayboldu ve o gece ailenin yemeği fazladan uzun sürdü. Kimse parayı saymadı.',
          );
        },
      },
    ],
  },

  // ====================================================================== JAPAN
  {
    id: 'jp.bunkasai',
    category: 'school',
    minAge: 12,
    maxAge: 17,
    weight: 25,
    when: jp,
    needs: ['student'],
    title: (c) => c.t('The school festival', 'Okul festivali'),
    text: (c) =>
      c.t(
        'Your class is putting on a stall for the bunkasai: a haunted house, a takoyaki counter or a café. The class chat has gone into overdrive, and the rules are in a very long document.',
        'Sınıfın bunkasai için bir stant açıyor: hayalet evi, takoyaki tezgâhı ya da bir kafe. Sınıf grubu hız kesmedi, kurallar da çok uzun bir belgede.',
      ),
    choices: [
      {
        id: 'lead',
        label: (c) => c.t('Volunteer to lead the class project', 'Sınıf projesine liderlik etmeyi üstlen'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            c.h.stat('smarts', 2);
            return c.t(
              'You made the schedule, ordered the costumes and managed the line of forty visitors. The class won best stall and cried a little.',
              'Programı yaptın, kostümleri ısmarladın, kırk ziyaretçilik kuyruğu yönettin. Sınıf en iyi stant ödülünü aldı ve biraz ağladı.',
            );
          }
          c.h.stat('happiness', -2);
          c.h.stat('health', -2);
          return c.t(
            'The gas stove failed, the batter ran out and a teacher had to calm everybody. You still stayed late to clean.',
            'Gaz ocağı bozuldu, hamur bitti ve bir öğretmen herkesi sakinleştirmek zorunda kaldı. Yine de temizlik için geç saate kadar kaldın.',
          );
        },
      },
      {
        id: 'helper',
        label: (c) => c.t('Quietly do whatever is needed', 'Sessizce ne gerekiyorsa yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'You painted signs, carried tables and fixed the costume that tore. No one gave a speech, but everybody knew.',
            'Tabelaları boyadın, masaları taşıdın, yırtılan kostümü diktin. Kimse konuşma yapmadı ama herkes biliyordu.',
          );
        },
      },
      {
        id: 'visit',
        label: (c) => c.t('Slip away to see the other classes’ stalls', 'Sıvış, diğer sınıfların stantlarına bak'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 4);
          return c.t(
            'You found a crepe stand, a very scary haunted house and a girl from the music club playing a song that stayed with you.',
            'Bir krep standı, çok korkutucu bir hayalet evi ve müzik kulübünden bir kızın çaldığı, aklında kalan bir şarkı buldun.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.juku_exam',
    category: 'school',
    minAge: 15,
    maxAge: 18,
    once: true,
    weight: 40,
    when: jp,
    needs: ['student'],
    title: (c) => c.t('Entrance exam season', 'Giriş sınavı sezonu'),
    text: (c) =>
      c.t(
        'After school you go straight to juku, the evening cram school, with a bento box and a notebook full of colored pens. The exam is in February, and your mother has made katsudon, which sounds like "win."',
        'Okuldan sonra doğruca juku’ya, yani akşam etüt kursuna gidiyorsun; bento kutusu ve renkli kalemlerle dolu bir defterle. Sınav şubatta ve annen katsudon yaptı; adı “kazanmak” sözcüğüne benziyor.',
      ),
    choices: [
      {
        id: 'grind',
        label: (c) => c.t('Study at juku until the last train', 'Son trene kadar juku’da çalış'),
        badge: 'Costs more',
        requires: (c) => money(c, 300),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('smarts', 4);
          c.h.stat('health', -3);
          c.h.stat('happiness', -2);
          return c.t(
            'Practice tests, tea in a thermos and a rank on a board. The exam day felt oddly familiar, like another evening at juku.',
            'Deneme sınavları, termosta çay ve tahtada bir sıralama. Sınav günü tuhaf biçimde tanıdık geldi, juku’daki başka bir akşam gibi.',
          );
        },
      },
      {
        id: 'shrine',
        label: (c) => c.t('Visit the shrine for a lucky charm', 'Şanslı bir tılsım için tapınağa git'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 10));
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'You bought an omamori for exams and tied a wish on the wooden board. It made the pencil case feel a little holier.',
            'Sınav için bir omamori satın aldın ve tahta levhaya bir dilek astın. Kalem kutusu biraz daha kutsal oldu.',
          );
        },
      },
      {
        id: 'self',
        label: (c) => c.t('Rely on your own routine and sleep', 'Kendi düzenine ve uykuna güven'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 4);
            return c.t(
              'Eight hours of sleep and a calm morning did better than three extra evenings of cramming. Your friends looked slightly betrayed.',
              'Sekiz saat uyku ve sakin bir sabah, üç fazladan etüt akşamından iyi iş gördü. Arkadaşların hafifçe ihanete uğramış gibi baktı.',
            );
          }
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -3);
          return c.t(
            'The paper had questions you only saw in juku handouts. You still got a place, though it was a second choice.',
            'Kağıtta yalnızca juku çıktılarında gördüğün sorular vardı. Yine de bir yer kazandın, ama ikinci tercihti.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.hanami',
    category: 'random',
    minAge: 18,
    maxAge: 80,
    weight: 8,
    when: jp,
    title: (c) => c.t('Cherry blossom picnic', 'Kiraz çiçeği pikniği'),
    text: (c) =>
      c.t(
        'The blossoms are at their best for about one week. Someone has already put a blue tarp on the best spot in the park, and the rest of the plan is food, drinks and weather forecasts.',
        'Çiçekler yaklaşık bir hafta boyunca en güzel hâlinde. Biri parkın en iyi yerine mavi branda sermiş bile; planın kalanı yemek, içecek ve hava durumu.',
      ),
    choices: [
      {
        id: 'spot',
        label: (c) => c.t('Arrive at dawn and guard the spot', 'Şafakta git, yeri bekle'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 2);
            c.h.stat('health', -2);
            return c.t(
              'It rained from noon, and you sat under an umbrella next to a tarp full of puddles. The blossoms fell on your head anyway.',
              'Öğleden itibaren yağmur yağdı, su birikintisiyle dolu bir brandanın yanında şemsiyenin altında oturdun. Çiçekler yine de başına döküldü.',
            );
          }
          c.h.stat('happiness', 7);
          return c.t(
            'You sat in the sun while the park filled, and for the rest of the day your group had the best spot and the best view.',
            'Park dolarken güneşte oturdun; günün geri kalanında grubunun en iyi yeri ve en iyi manzarası vardı.',
          );
        },
      },
      {
        id: 'night',
        label: (c) => c.t('Go for the night viewing with lanterns', 'Fenerli gece manzarası için git'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 6);
          return c.t(
            'Lit-up branches over a river, street food and the air smelling of spring. You bought something sweet and pink and did not ask what it was.',
            'Nehrin üstünde aydınlatılmış dallar, sokak yemekleri ve bahar kokan hava. Tatlı ve pembe bir şey aldın ve ne olduğunu sormadın.',
          );
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Take a slow walk alone', 'Tek başına yavaş bir yürüyüşe çık'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 2);
          return c.t(
            'Petals drifted down on the path like slow snow. You thought, "this is exactly one week," and slowed down even more.',
            'Petaller patikada ağır bir kar gibi yağdı. “Bu tam bir hafta sürer” diye düşündün ve daha da yavaşladın.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.shukatsu',
    category: 'work',
    minAge: 20,
    maxAge: 23,
    once: true,
    weight: 40,
    when: (c) => jp(c) && (c.p.education === 'university' || c.p.school === 'university'),
    title: (c) => c.t('Shūkatsu season', 'Shūkatsu mevsimi'),
    text: (c) =>
      c.t(
        'Every student in the country is suddenly wearing the same black suit and the same hairstyle. Welcome to shūkatsu, the job-hunting season, with group interviews and an excess of polite emails.',
        'Ülkedeki bütün öğrenciler birden aynı siyah takımı ve aynı saç stilini takındı. Shūkatsu, yani iş avı mevsimine hoş geldin: grup mülakatları ve fazlasıyla kibar e-postalar.',
      ),
    choices: [
      {
        id: 'big',
        label: (c) => c.t('Apply to the big famous companies', 'Büyük, ünlü şirketlere başvur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.money(wage(c, 400));
            c.h.stat('happiness', 7);
            return c.t(
              'After thirty applications and eleven interviews, one company said yes. The unofficial offer arrived in October, like a bouquet.',
              'Otuz başvuru ve on bir mülakattan sonra bir şirket evet dedi. Gayriresmî teklif, bir buket gibi ekimde geldi.',
            );
          }
          c.h.stat('happiness', -4);
          c.h.stat('health', -2);
          return c.t(
            'Thirty polite rejections arrived, each one beginning with "we pray for your continued success." You collected them like stamps.',
            'Otuz kibar ret geldi, her biri “bundan sonraki başarılarınız için dua ediyoruz” diye başlıyordu. Onları pul gibi biriktirdin.',
          );
        },
      },
      {
        id: 'smaller',
        label: (c) => c.t('Aim for a smaller company you actually like', 'Gerçekten sevdiğin daha küçük bir şirketi hedefle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          c.h.money(wage(c, 150));
          return c.t(
            'A small firm with a friendly manager gave you tea and an honest answer. You got an offer the same week.',
            'Samimi bir müdürü olan küçük bir firma sana çay ve dürüst bir cevap verdi. Aynı hafta teklif aldın.',
          );
        },
      },
      {
        id: 'own',
        label: (c) => c.t('Skip the suit and take your own path', 'Takımı bırak, kendi yolunu çiz'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 2);
          c.h.money(-wage(c, 100));
          return c.t(
            'You hung the black suit at the back of the closet. Your parents took a deep breath, then asked you to explain slowly.',
            'Siyah takımı dolabın en arkasına astın. Ailen derin bir nefes aldı, sonra yavaşça anlatmanı istedi.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.nomikai',
    category: 'work',
    minAge: 24,
    maxAge: 60,
    weight: 8,
    needs: ['employed'],
    when: jp,
    title: (c) => c.t('The nomikai', 'İş arkadaşlarıyla nomikai'),
    text: (c) =>
      c.t(
        'The department is going out for drinks tonight. Everybody says "toriaezu beer" in unison, someone makes a speech and the section chief is clearly going to pour for you.',
        'Departman bu gece içmeye çıkıyor. Herkes bir ağızdan “önce bira” diyor, biri konuşma yapıyor ve şefin sana ikram edeceği belli.',
      ),
    choices: [
      {
        id: 'all',
        label: (c) => c.t('Stay for the second round and karaoke', 'İkinci tura ve karaokeye kal'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 90));
          c.h.stat('happiness', 5);
          c.h.stat('health', -3);
          return line(c, [
            ['The manager sang a ballad from 1988 and cried. On Monday he acted like nothing happened, and you did too.', 'Müdür 1988’den bir baladı söyleyip ağladı. Pazartesi hiçbir şey olmamış gibi davrandı, sen de öyle.'],
            ['You sang the only song everybody knows and got an ovation. The last train was an optional matter.', 'Herkesin bildiği tek şarkıyı söyledin ve alkış aldın. Son tren isteğe bağlı bir konuydu.'],
          ]);
        },
      },
      {
        id: 'first',
        label: (c) => c.t('Leave after the first round', 'İlk turdan sonra ayrıl'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 2);
          c.h.stat('health', 1);
          return c.t(
            'You thanked everyone politely, bowed and caught the last train with a calm face. Nobody said anything, but the ties were a little less loose.',
            'Herkese kibarca teşekkür ettin, eğildin ve son treni sakin bir yüzle yakaladın. Kimse bir şey demedi ama kravatlar biraz daha az gevşekti.',
          );
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Politely decline and go home', 'Kibarca reddet, eve git'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 3);
            c.h.stat('health', 2);
            return c.t(
              'You said you had a prior engagement. Nobody minded, and one coworker whispered that she envied you.',
              'Önceden bir sözün olduğunu söyledin. Kimse aldırmadı, bir iş arkadaşın sana gıpta ettiğini fısıldadı.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The following Monday, the best joke at the office was one you missed. It was quite funny.',
            'Ertesi pazartesi ofisin en iyi şakası senin kaçırdığın şakaydı. Epey komikmiş.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.obon',
    category: 'family',
    minAge: 25,
    maxAge: 85,
    weight: 7,
    when: (c) => jp(c) && hasFamily(c),
    setup: familySetup,
    title: (c) => c.t('Obon in the hometown', 'Memlekette Obon'),
    text: (c) => {
      const w = kin(c, who(c), String(c.vars.k));
      return c.t(
        `It is mid-August, Obon, when the ancestors are said to come home. Your ${w} has already asked whether you will return to the old house. The trains are full.`,
        `Ağustosun ortası, Obon; atalar eve dönermiş derler. ${cap(w)} eski eve dönüp dönmeyeceğini sordu bile. Trenler dolu.`,
      );
    },
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Join the crowd heading home', 'Eve dönen kalabalığa katıl'),
        badge: 'Costs more',
        requires: (c) => money(c, 200),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', 6);
          return c.t(
            'Four hours on a packed train, a small fire at the doorstep to welcome the spirits and a bon dance in the evening. You slept in your childhood room.',
            'Dolu bir trende dört saat, ruhları karşılamak için eşikte küçük bir ateş ve akşam bon dansı. Çocukluk odanda uyudun.',
          );
        },
      },
      {
        id: 'grave',
        label: (c) => c.t('Visit the family grave and clean it', 'Aile mezarını ziyaret et, temizle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 3);
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'You scrubbed the stone, lit incense and poured water. You told the stone about your year, out loud, and the cicadas listened.',
            'Taşı fırçaladın, tütsü yaktın, su döktün. Taşa yılını yüksek sesle anlattın, ağustos böcekleri dinledi.',
          );
        },
      },
      {
        id: 'call',
        label: (c) => c.t('Stay in the city and call instead', 'Şehirde kal, telefonla ara'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -2);
          c.h.stat('happiness', 1);
          c.h.money(wage(c, 100));
          return c.t(
            'The city was strangely empty, and the video call lasted an hour. Your relatives passed the phone around like a hot dish.',
            'Şehir tuhaf biçimde boştu ve görüntülü arama bir saat sürdü. Akrabaların telefonu sıcak bir tabak gibi elden ele dolaştırdı.',
          );
        },
      },
    ],
  },
  {
    id: 'jp.koban',
    category: 'random',
    minAge: 20,
    maxAge: 80,
    weight: 6,
    cooldown: 8,
    when: jp,
    title: (c) => c.t('The lost wallet', 'Kayıp cüzdan'),
    text: (c) =>
      c.t(
        'You realize on the train that your wallet is gone. In many countries that would be the end of the story. At the nearest koban, a police officer in white gloves asks you to describe it.',
        'Trende cüzdanının olmadığını fark ettin. Birçok ülkede hikâye burada biterdi. En yakın koban’da, beyaz eldivenli bir polis memuru ondan söz etmeni istiyor.',
      ),
    choices: [
      {
        id: 'describe',
        label: (c) => c.t('Describe it and wait', 'Anlat ve bekle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'An hour later, someone had turned it in with every yen and every card. The officer made you check them one by one.',
            'Bir saat sonra biri, her yen ve her kartıyla teslim etmişti. Memur her birini tek tek saydırdı.',
          );
        },
      },
      {
        id: 'sweets',
        label: (c) => c.t('Thank the finder with a box of sweets', 'Bulana bir kutu tatlıyla teşekkür et'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 25));
          c.h.stat('happiness', 6);
          return c.t(
            'The finder declined the reward, as it often happens, and accepted only the sweets, with a bow. Bowing back felt like a conversation.',
            'Bulan kişi ödülü geri çevirdi, çoğu zaman olduğu gibi; yalnızca tatlıyı aldı, eğilerek. Karşılık olarak eğilmek bir sohbet gibiydi.',
          );
        },
      },
      {
        id: 'forms',
        label: (c) => c.t('Fill out the forms and go home', 'Formları doldur, eve git'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t(
            'The form took twenty minutes and a surprising number of stamps. Your wallet arrived by courier two days later, and your faith in people went up.',
            'Form yirmi dakika ve şaşırtıcı sayıda mühür aldı. Cüzdanın iki gün sonra kuryeyle geldi, insanlara inancın arttı.',
          );
        },
      },
    ],
  },
];
