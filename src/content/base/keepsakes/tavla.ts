import { dat } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family backgammon set (tavla): coffeehouse rivalries, dice that nobody trusts, and the loser who makes the tea. */
export const tavla: HeirloomTexts = {
  tallTale: ['it once won a house on a single roll of the dice (it was a shed)', 'bir zamanlar tek bir zarla bir ev kazandırdığını (kulübeydi)'],
  kidMishap: [
    'sent every checker flying across the room. You are still finding them, one a year.',
    'bütün pulları odanın dört bir yanına uçurdu. Hâlâ yılda bir tane buluyorsun.',
  ],
  borrow: {
    ages: [18, 80],
    ask: (n) => [`${n} asks to borrow the backgammon set for the coffeehouse tournament.`, `${n} kahvehane turnuvası için tavlayı ödünç istiyor.`],
    back: (n) => [
      `The set came back in perfect order, and ${n} claims three wins and a "moral victory" against a retired judge.`,
      `Tavla kusursuz bir düzenle geri geldi; ${n} emekli bir hâkime karşı üç galibiyet ve bir "manevi zafer" aldığını söylüyor.`,
    ],
  },
  ritual: [
    'the backgammon board comes out after the meal and the oldest challenges the youngest, who always, always loses by one point',
    'yemekten sonra tavla tahtası açılıyor ve en büyük en küçüğe meydan okuyor; en küçük her seferinde bir puanla kaybediyor',
  ],
  notePlace: ['Folded flat under the felt of the backgammon board', 'Tavla tahtasının keçesinin altına düz katlanmış'],
  lesson: {
    how: [
      'Shake the dice with the whole wrist, never blow on them in front of the opponent, and when you win, apologise a little.',
      'Zarlar bütün bileğinle atılır, rakibin önünde üfürülmez ve kazanınca biraz özür dilenir.',
    ],
    done: (n) => [
      `You taught ${n} the opening moves. ${n} blew on the dice anyway, and apologised after winning, exactly as taught.`,
      `${dat(n)} açılış hamlelerini öğrettin. ${n} zarlara yine de üfledi ama kazanınca tam öğrettiğin gibi özür diledi.`,
    ],
  },
  copy: ['a travel board of the same pattern, with checkers made from bottle caps', 'pulları şişe kapağından yapılmış, aynı desenli bir seyahat tavlası'],
  sitTr: 'tavlanın başına',
  repairs: [
    {
      title: ['A checker from the backgammon set has gone missing.', 'Tavladan bir pul kayboldu.'],
      text: [
        'Twenty-nine checkers do not make a game. The family has started playing with a button.',
        'Yirmi dokuz pulla oyun olmuyor. Aile bir düğmeyle oynamaya başladı.',
      ],
      pro: [
        'A carpenter turned a new one from the same kind of wood and aged it with tea. Nobody can tell which one it is, including him.',
        'Bir marangoz aynı cins tahtadan yenisini yontup çayla eskitti. Hangisi olduğunu kimse, kendisi de dahil, bilemiyor.',
      ],
      ok: ['You found it under the radiator, hard as a stone and furious. The button retires.', 'Kaloriferin altında buldun; taş gibi sert ve öfkeli. Düğme emekli oldu.'],
      bad: [
        'You made a new one from a cork and a lot of hope. It is slightly bigger. It always lands on the best point.',
        'Bir mantar ve bolca umutla yenisini yaptın. Biraz büyük. Hep en iyi noktaya iniyor.',
      ],
    },
    {
      title: ["The board's hinge has come loose.", 'Tavlanın menteşesi gevşedi.'],
      text: ['It closes with a little groan and opens with a bigger one.', 'Küçük bir inlemeyle kapanıyor, daha büyük bir inlemeyle açılıyor.'],
      pro: [
        'A carpenter fitted a new brass hinge. The board now closes with a click, like a good decision.',
        'Marangoz yeni bir pirinç menteşe taktı. Tavla artık iyi bir karar gibi tık diye kapanıyor.',
      ],
      ok: [
        'You tightened the screws and added a drop of oil. It opens in silence, which somehow feels disrespectful.',
        'Vidaları sıktın ve bir damla yağ ekledin. Sessizce açılıyor; nedense saygısızlık gibi geliyor.',
      ],
      bad: [
        'You used screws that were slightly too long. The board closes now, but you can see them proudly through the other side.',
        'Biraz fazla uzun vidalar kullandın. Tavla kapanıyor ama vidalar öbür yüzden gururla görünüyor.',
      ],
    },
    {
      title: ['The dice have started to look suspicious.', 'Zarlar şüpheli görünmeye başladı.'],
      text: ['They keep landing on six. Everyone blames everyone.', 'Hep altı geliyor. Herkes herkesi suçluyor.'],
      pro: [
        'A jeweller weighed them and found one air bubble. Fresh dice, same engraved dots. The family blames luck again, as is tradition.',
        'Bir kuyumcu zarları tarttı ve birinde hava kabarcığı buldu. Yeni zarlar, aynı oyma noktalar. Aile yine şansı suçluyor; gelenek bu.',
      ],
      ok: [
        'You rolled them two hundred times and wrote the numbers on a sheet. It was the dice. You bought new ones and kept the sheet.',
        'İki yüz kez attın ve sayıları bir kâğıda yazdın. Suç zarlardaydı. Yenilerini aldın, kâğıdı sakladın.',
      ],
      bad: [
        'You shaved one corner to "fix" them. They now land on three every time, and the family calls that "a quieter kind of cheating".',
        'Bir köşesini "düzeltmek" için rendeledin. Artık hep üç geliyor; aile buna "daha sessiz bir hile" diyor.',
      ],
    },
  ],
  scares: [
    {
      what: ['You left the backgammon set at the coffeehouse after a late game.', 'Geç saatte biten bir oyundan sonra tavlayı kahvehanede unuttun.'],
      search: [
        'The owner had put it on the highest shelf "for safety". You got it back after one humiliating rematch.',
        'Sahibi onu "güvenlik için" en üst rafa koymuş. Utanç verici bir rövanştan sonra geri aldın.',
      ],
      reward: [
        'The regulars had kept playing on it all week, and returned it with a handwritten score sheet and a request for a rematch.',
        'Müdavimler bütün hafta onunla oynamış; elle yazılmış bir skor kâğıdı ve rövanş talebiyle geri getirdiler.',
      ],
    },
    {
      what: ['A relative borrowed the backgammon set "for one evening" and went abroad.', 'Bir akraba tavlayı "tek akşamlığına" ödünç aldı ve yurt dışına gitti.'],
      search: [
        'You phoned across two time zones. He had it in the hall, still in its bag, and promised to post it. Three weeks later a parcel arrived with sweets inside.',
        'İki saat dilimi öteye telefon ettin. Antrede, çantasında duruyordu; postalayacağına söz verdi. Üç hafta sonra içinde tatlılarla bir koli geldi.',
      ],
      reward: [
        'His neighbour, a stranger, had been playing on it for a month. The parcel came with a note: "Your cousin cheats."',
        'Komşusu, bir yabancı, bir aydır onunla oynuyormuş. Koli bir notla geldi: "Kuzenin hile yapıyor."',
      ],
    },
    {
      what: ['The wooden board was left in a hot car all afternoon.', 'Ahşap tavla bütün öğleden sonra sıcak bir arabada kaldı.'],
      search: [
        'You opened the lid and the board had warped like a smile. You pressed it under books for a week, like a flower.',
        'Kapağı açtığında tavla bir gülümseme gibi kıvrılmıştı. Bir hafta boyunca kitapların altında, bir çiçek gibi bastırdın.',
      ],
      reward: [
        'A carpenter flattened it with steam and patience and told you off, very kindly, about cars in July.',
        'Bir marangoz onu buhar ve sabırla düzeltti; temmuzda arabayla ilgili seni çok nazikçe azarladı.',
      ],
    },
    {
      what: ['The dice rolled off the table at a family gathering and disappeared.', 'Aile toplantısında zarlar masadan yuvarlandı ve kayboldu.'],
      search: [
        'You crawled under every sofa. One die was in a slipper, the other in the pocket of a toddler, who guarded it fiercely.',
        'Her kanepenin altına girdin. Zarın biri terliğin içindeydi, öbürü yürümeye yeni başlayan bir çocuğun cebinde; çocuk onu öfkeyle korudu.',
      ],
      reward: [
        'The neighbours across the hall found one in their hallway and knocked. "Does this belong to a fierce family?" they asked.',
        'Karşı komşular zarlardan birini koridorlarında bulup kapıyı çaldı. "Bu, sert bir aileye mi ait?" diye sordular.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year the youngest was allowed to roll first. They rolled double six and have never let anyone forget it.',
      'Bu yıl ilk zarı en küçük attı. Çifte altı geldi ve kimsenin unutmasına izin vermedi.',
    ],
    [
      'This year a new rule was added: the loser makes the tea. It has been the most respected rule in the family ever since.',
      'Bu yıl yeni bir kural eklendi: kaybeden çay yapar. O günden beri ailenin en saygı gören kuralı bu.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants to learn backgammon "properly, from you".`, `${n}, tavlayı "doğru düzgün, senden" öğrenmek istiyor.`],
      yes: [
        'The lessons took a month. The final score was a draw, and you both pretended it was your win.',
        'Dersler bir ay sürdü. Son skor berabereydi ve ikiniz de kazanan sizmişsiniz gibi davrandınız.',
      ],
    },
    {
      idea: (n) => [`${n} thinks the backgammon set should live on the coffee table "so we actually play".`, `${n}, tavlanın "gerçekten oynayalım diye" sehpada durmasını istiyor.`],
      yes: [
        'The board lives on the coffee table now. Guests open it before they have taken their coats off.',
        'Tavla artık sehpada duruyor. Misafirler paltolarını çıkarmadan tavlayı açıyor.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to play backgammon under the desk during a boring lesson.', 'Sıkıcı bir derste sıranın altında tavla oynamak istiyorsun.'],
      ok: [
        'A friend and you played a whole game in silence, passing the dice by sign language. You won by one point and went home glowing.',
        'Bir arkadaşınla bütün bir oyunu sessizce, zarları işaretle uzatarak oynadınız. Bir puanla kazandın ve parlayarak eve gittin.',
      ],
      bad: [
        'The dice cup fell and rolled to the front of the class. The teacher looked at it, looked at you, and asked who was winning.',
        'Zar kabı yere düşüp sınıfın önüne yuvarlandı. Öğretmen ona baktı, sana baktı ve kimin kazandığını sordu.',
      ],
    },
    {
      plan: ['You want to challenge your uncle at the next family dinner.', 'Bir sonraki aile yemeğinde amcana meydan okumak istiyorsun.'],
      ok: [
        'You beat him in four rounds. He demanded a fifth, lost that too, and spoke of nothing else until dessert.',
        'Onu dört turda yendin. Beşincisini istedi, onu da kaybetti ve tatlıya kadar başka bir şeyden bahsetmedi.',
      ],
      bad: [
        'He beat you in four rounds and told the whole table. You were offered sympathy, tea and a rematch, in that order.',
        'Seni dört turda yendi ve bütün masaya anlattı. Sana sırayla taziye, çay ve rövanş önerildi.',
      ],
    },
  ],
  quiet: [
    ['You set the checkers up in their starting places and just looked at the board, as if someone were about to sit down.', 'Pulları başlangıç dizilişine koyup, birazdan biri oturacakmış gibi tavlaya baktın.'],
    ['You rolled the dice once, softly, and the sound filled the whole house.', 'Zarları bir kez, usulca attın ve ses bütün evi doldurdu.'],
    ['You ran a finger along the worn points where decades of hands have hurried a checker home.', 'Parmağını, onlarca yılın elinin bir pulu eve yetiştirmek için acele ettiği aşınmış noktaların üstünde gezdirdin.'],
  ],
};
