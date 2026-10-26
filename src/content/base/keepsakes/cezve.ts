import { dat } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family copper coffee pot (cezve): slow mornings, fortunes in the grounds, and foam that must never be rushed. */
export const cezve: HeirloomTexts = {
  tallTale: ['it once boiled over during a proposal and the answer was "yes, please clean that first"', 'bir evlenme teklifi sırasında taştığını ve cevabın "evet, önce şunu sil" olduğunu'],
  kidMishap: [
    'filled it with sugar, "to make it sweet for everyone", and stirred for an hour.',
    '"herkes için tatlı olsun" diye içini şekerle doldurdu ve bir saat karıştırdı.',
  ],
  borrow: {
    ages: [20, 70],
    ask: (n) => [`${n} asks to borrow the coffee pot "for a very important guest".`, `${n} cezveyi "çok önemli bir misafir için" ödünç istiyor.`],
    back: (n) => [
      `The coffee pot came back shining, with a note from ${n}: "The guest said yes. To everything."`,
      `Cezve parlayarak geri geldi; ${n} bir not bırakmış: "Misafir evet dedi. Her şeye."`,
    ],
  },
  ritual: [
    'the coffee pot goes on the stove, the grounds are read, and every cup foretells something different about the person who drank it',
    'cezve ocağa konuyor, fincanlar okunuyor ve her fincan onu içen hakkında başka bir şey söylüyor',
  ],
  notePlace: ['Wrapped in a cloth under the coffee pot', 'Cezvenin altındaki bezin içine sarılmış'],
  lesson: {
    how: [
      'Cold water, slow flame, never stir after the foam rises, and wait until it just lifts. Then pour as if nobody were watching.',
      'Soğuk su, kısık ateş, köpük çıkınca asla karıştırma ve yalnızca kabarana kadar bekle. Sonra kimse bakmıyormuş gibi dök.',
    ],
    done: (n) => [
      `You taught ${n} to make coffee the slow way. The first batch boiled over. The second was close. The third silenced the kitchen.`,
      `${dat(n)} kahveyi yavaş yoldan yapmayı öğrettin. İlki taştı. İkincisi az kaldı. Üçüncüsü mutfağı susturdu.`,
    ],
  },
  copy: ['a small new copper pot and a tin of the right grind, wrapped together', 'küçük yeni bir bakır cezve ve doğru çekimde bir kutu kahve, birlikte sarılı'],
  sitTr: 'cezveyi karşına koyup',
  repairs: [
    {
      title: ['The coffee pot has gone dull and dark.', 'Cezve donuklaşıp kararmış.'],
      text: ['The copper has lost its glow, and the coffee tastes a little tired.', 'Bakır parlaklığını yitirmiş, kahvenin tadı da biraz yorgun.'],
      pro: [
        'A coppersmith polished it and retinned the inside. It glows like a small sunset on the shelf.',
        'Bir bakırcı onu parlatıp içini yeniden kalaylattı. Rafta küçük bir gün batımı gibi parlıyor.',
      ],
      ok: [
        'You scrubbed it with lemon and salt for a whole afternoon. It is not new, but it is awake.',
        'Bütün bir öğleden sonra limon ve tuzla ovdun. Yeni değil ama uyanık.',
      ],
      bad: [
        'You used something stronger than lemon. It shines now, but one side is slightly pink, and the family calls it "the blushing one".',
        'Limondan güçlü bir şey kullandın. Artık parlıyor ama bir yanı hafif pembe; aile ona "utangaç olan" diyor.',
      ],
    },
    {
      title: ['The handle of the coffee pot has come loose.', 'Cezvenin sapı gevşemiş.'],
      text: ['It swings like a nervous pendulum when you pour.', 'Dökerken tedirgin bir sarkaç gibi sallanıyor.'],
      pro: [
        'A coppersmith riveted it back on. It is steadier than it ever was, and a little proud.',
        'Bir bakırcı onu perçinleyip yerine taktı. Hiç olmadığı kadar sabit ve biraz da gururlu.',
      ],
      ok: [
        'You tightened the rivet with pliers and patience. It holds, as long as nobody sneezes.',
        'Perçini pense ve sabırla sıktın. Tutuyor, tabii kimse hapşırmadığı sürece.',
      ],
      bad: [
        'You wrapped the handle in wire. It holds, but the wire is hot and the coffee is now served with a warning.',
        'Sapı telle sardın. Tutuyor ama tel sıcak ve kahve artık bir uyarıyla servis ediliyor.',
      ],
    },
    {
      title: ['The coffee pot has sprung a tiny leak.', 'Cezveden minik bir sızıntı başlamış.'],
      text: ['A single drop at the seam, every time. The stove hisses in protest.', 'Dikişten her seferinde tek bir damla. Ocak itirazla tısırdıyor.'],
      pro: [
        'A coppersmith soldered the seam so cleanly that you cannot find where it was. The stove is quiet again.',
        'Bir bakırcı dikişi o kadar temiz lehimledi ki nerede olduğunu bulamıyorsun. Ocak yine sessiz.',
      ],
      ok: [
        'You found a coffee-safe sealant and a free Sunday. The drop stopped, though now and then it considers returning.',
        'Kahveye zarar vermeyen bir macun ve boş bir pazar buldun. Damla durdu, ama arada geri dönmeyi düşünüyor.',
      ],
      bad: [
        'You sealed it with the wrong thing. The coffee holds, but it has a faint taste of a hardware shop.',
        'Yanlış bir şeyle kapattın. Kahve akmıyor ama hafif bir hırdavatçı tadı var.',
      ],
    },
  ],
  scares: [
    {
      what: ['The coffee pot was packed in a picnic basket and left in the park.', 'Cezve piknik sepetine konup parkta kaldı.'],
      search: [
        'You walked back to the bench as the light went. It was where you left it, upside down, drying in the sun like a flag.',
        'Işık giderken banka geri yürüdün. Bıraktığın yerdeydi, ters çevrilmiş, güneşte bayrak gibi kuruyordu.',
      ],
      reward: [
        'The park keeper had washed it and kept it in his hut, and he served you coffee in it before handing it back.',
        'Bekçi onu yıkayıp kulübesinde saklamış ve geri vermeden önce içinde sana kahve ikram etti.',
      ],
    },
    {
      what: ['A guest quietly took the coffee pot home after a gathering.', 'Bir misafir toplantı sonunda cezveyi sessizce eve götürdü.'],
      search: [
        'You phoned round for a day. At last a voice said, "Oh! Is that yours? I thought it was a gift." You collected it with a smile and a firm handshake.',
        'Bir gün boyunca herkesi aradın. Sonunda bir ses "Ay! Bu sizin miydi? Hediye sandım" dedi. Gülümseyerek ve sıkı bir el sıkışmayla geri aldın.',
      ],
      reward: [
        'The guest returned it in person, with a cake, an apology and an enormous bunch of parsley for reasons nobody understood.',
        'Misafir onu bizzat, bir kek, bir özür ve kimsenin anlamadığı sebeplerle kocaman bir demet maydanozla geri getirdi.',
      ],
    },
    {
      what: ['The coffee pot was left on a lit stove and boiled dry.', 'Cezve açık ocakta unutulup kuruyana kadar kaynadı.'],
      search: [
        'You caught the smell just in time. The copper was singed at the bottom, but the coffee pot lived to tell the tale.',
        'Kokuyu tam zamanında aldın. Bakırın dibi yanmıştı ama cezve anlatacak hikâyesiyle kurtuldu.',
      ],
      reward: [
        'A neighbour smelled it through the wall, let herself in with the spare key and rescued it. "You owe me a coffee," she said.',
        'Bir komşu kokuyu duvardan alıp yedek anahtarla içeri girdi ve kurtardı. "Bir kahve borçlusun" dedi.',
      ],
    },
    {
      what: ['The coffee pot got mixed up with a relative\'s kitchen things after a visit.', 'Cezve, bir ziyaretin ardından bir akrabanın mutfak eşyalarına karıştı.'],
      search: [
        'You drove across town with a list of what to look for. It was behind the flour tin, looking smug.',
        'Aranacakların listesiyle şehrin öbür ucuna sürdün. Un kutusunun arkasındaydı, sırıtıyordu.',
      ],
      reward: [
        'Your relative had spotted the initials on the base and called you at once. She even kept the grounds inside as a small joke.',
        'Akrabanız tabandaki baş harfleri görüp hemen aradı. Hatta küçük bir şaka olsun diye içindeki telveyi bile saklamış.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year the grounds were read for the whole table, and every single cup promised "a long journey". Nobody is going anywhere.',
      'Bu yıl bütün masa için fincanlar okundu ve her fincan "uzun bir yol" vaat etti. Kimse hiçbir yere gitmiyor.',
    ],
    [
      'This year the youngest was trusted with the pot for the first time. The foam rose. Everybody held their breath. It did not boil over.',
      'Bu yıl cezve ilk kez en küçüğe emanet edildi. Köpük yükseldi. Herkes nefesini tuttu. Taşmadı.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants to start every weekend with coffee from the old pot, "just the two of us".`, `${n}, her hafta sonuna eski cezveden kahveyle başlamak istiyor: "sadece ikimiz".`],
      yes: [
        'Saturday mornings now smell of cardamom and slow flame. You have never been in such a good mood on a weekend.',
        'Cumartesi sabahları artık kakule ve kısık ateş kokuyor. Hafta sonları hiç bu kadar keyifli olmamıştı.',
      ],
    },
    {
      idea: (n) => [`${n} wants to have the coffee pot cleaned and shined for a family portrait.`, `${n}, bir aile portresi için cezvenin temizlenip parlatılmasını istiyor.`],
      yes: [
        'In the picture the coffee pot sits in the middle, glowing. Nobody remembers who else was in it.',
        'Fotoğrafta cezve ortada, parlıyor. Başka kimin olduğunu kimse hatırlamıyor.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to make coffee for a friend who is having a terrible week.', 'Berbat bir hafta geçiren bir arkadaşına kahve yapmak istiyorsun.'],
      ok: [
        'You made it slowly, as taught, and said nothing. Your friend drank it, stared at the grounds and started to laugh.',
        'Öğretildiği gibi yavaşça yaptın ve hiçbir şey söylemedin. Arkadaşın kahveyi içti, telvesine baktı ve gülmeye başladı.',
      ],
      bad: [
        'It boiled over twice and the kitchen needed an hour. Your friend drank it anyway, bravely, then laughed so hard they cried.',
        'İki kez taştı ve mutfak bir saat uğraştırdı. Arkadaşın yine de cesurca içti, sonra gülmekten ağladı.',
      ],
    },
    {
      plan: ['You want to try to read the grounds at a party.', 'Bir partide telvenin falına bakmayı denemek istiyorsun.'],
      ok: [
        'You predicted "a surprise next week" for everyone. A surprising number of surprises happened.',
        'Herkese "önümüzdeki hafta bir sürpriz" dedin. Şaşırtıcı sayıda sürpriz yaşandı.',
      ],
      bad: [
        'You told a guest he would soon move house. He had just signed a ten-year lease. The party went very quiet.',
        'Bir misafire yakında taşınacağını söyledin. Adam az önce on yıllık kira sözleşmesi imzalamıştı. Parti çok sessizleşti.',
      ],
    },
  ],
  quiet: [
    ['You made a small, slow coffee and sat with it until it had gone cold.', 'Küçük, yavaş bir kahve yapıp soğuyana kadar yanında oturdun.'],
    ['You held the handle where so many hands have warmed it, and the room smelled faintly of cardamom.', 'Sapı, onca elin ısıttığı yerinden tuttun ve oda hafifçe kakule koktu.'],
    ['You set the coffee pot on the table, still, and let the morning be quiet around it.', 'Cezveyi masaya, hareketsiz koydun ve sabahın etrafında sessiz kalmasına izin verdin.'],
  ],
};
