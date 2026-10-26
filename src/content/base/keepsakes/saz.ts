import { dat, gen } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family saz (bağlama): weddings, halay, and strings that snap at the worst moment. */
export const saz: HeirloomTexts = {
  tallTale: ['it once calmed a bear at a village wedding (the bear stayed for the halay)', 'bir köy düğününde bir ayıyı yatıştırdığını (ayı halaya da kaldı)'],
  kidMishap: [
    'plucked every string at once, announced "an earthquake" and bowed.',
    'bütün telleri aynı anda çaldı, "deprem" diye ilan etti ve selam verdi.',
  ],
  borrow: {
    ages: [18, 45],
    ask: (n) => [`${n} asks to borrow the saz for a wedding. "Only for one song."`, `${n} bir düğün için bağlamayı ödünç istiyor. "Sadece bir türkü."`],
    back: (n) => [
      `The saz came back a week later, better tuned than before. ${n} had played all night and, apparently, taught the groom to dance.`,
      `Bağlama bir hafta sonra, eskisinden daha iyi akortlu geri geldi. ${n} bütün gece çalmış, hatta damada halay çektirmiş.`,
    ],
  },
  ritual: [
    'the saz comes out, the family sings the old song, and a new verse is added about whoever is late',
    'bağlama çıkarılıyor, aile eski türküyü söylüyor ve geç kalan kişi hakkında yeni bir dörtlük ekleniyor',
  ],
  notePlace: ["Tucked inside the saz's body", 'Bağlamanın teknesinin içine sıkıştırılmış'],
  lesson: {
    how: [
      'Tune it from the thickest string, never rush the pick, and always play the first song for whoever is asleep.',
      'En kalın telden akort edilir, mızrap asla aceleye getirilmez ve ilk türkü hep uyuyana çalınır.',
    ],
    done: (n) => [
      `You taught ${n} the first tune. ${n}'s fingers found it by the third night and refused to stop.`,
      `${dat(n)} ilk ezgiyi öğrettin. ${gen(n)} parmakları onu üçüncü gece buldu ve durmayı reddetti.`,
    ],
  },
  copy: ["a plain beginner's saz and a promise to play together every Sunday", 'sade bir başlangıç bağlaması ve her pazar birlikte çalma sözü'],
  sitTr: 'bağlamayı kucağına alıp',
  repairs: [
    {
      title: ['A string on the saz has snapped.', 'Bağlamanın bir teli koptu.'],
      text: ['It went with a twang that was heard two flats away.', 'İki daire öteden duyulan bir sesle koptu.'],
      pro: [
        'A luthier replaced it and tuned the whole saz while humming. It sounds like a village morning.',
        'Saz ustası teli değiştirdi ve bütün bağlamayı mırıldanarak akort etti. Bir köy sabahı gibi çalıyor.',
      ],
      ok: [
        'You bought a string at the music shop and spent an evening winding it on. It stays in tune for almost a whole song.',
        'Müzikçiden bir tel aldın ve bir akşamını onu takmakla geçirdin. Neredeyse bir türkü boyunca akortta kalıyor.',
      ],
      bad: [
        'You tied the string on with a knot no saz maker would forgive. It plays, but every note now has an opinion.',
        'Teli hiçbir saz ustasının affetmeyeceği bir düğümle bağladın. Çalıyor ama her notanın artık bir fikri var.',
      ],
    },
    {
      title: ["The saz's neck has warped a little.", 'Bağlamanın sapı hafifçe eğrilmiş.'],
      text: ['The higher up the neck you play, the more nervous it sounds.', 'Sapta yukarı çıktıkça ses daha da tedirgin çıkıyor.'],
      pro: [
        'A luthier steamed the neck back into line over three days. It plays straight and, he said, "with dignity".',
        'Saz ustası sapı üç günde buharla yeniden doğrulttu. Düzgün çalıyor ve ustanın deyişiyle "vakarla".',
      ],
      ok: [
        'You took it to a friend with a workshop. Together you clamped the neck overnight. It is mostly straight, which counts.',
        'Atölyesi olan bir arkadaşına götürdün. Birlikte sapı bütün gece mengenede tuttunuz. Çoğunlukla düz; bu da sayılır.',
      ],
      bad: [
        'You clamped it too hard and heard a small crack. It plays, but one fret now sits at an angle.',
        'Fazla sıktın ve hafif bir çatırtı duydun. Çalıyor ama bir perde artık yan duruyor.',
      ],
    },
    {
      title: ['The saz has dried out and cracked near the edge.', 'Bağlamanın ahşabı kurumuş, kenarı çatlamış.'],
      text: ['A hairline crack runs along the soundboard, like a sleeping river.', 'Kapak boyunca kıl gibi bir çatlak uzanıyor; uyuyan bir nehir gibi.'],
      pro: [
        'A luthier glued it from the inside with a patience that hurt to watch. You cannot find the crack now.',
        'Saz ustası içeriden, izlerken insanın içini acıtan bir sabırla yapıştırdı. Çatlağı artık bulamıyorsun.',
      ],
      ok: [
        'You glued it with the right glue (after the wrong glue). It now has a thin, shiny line that you call a signature.',
        'Doğru yapıştırıcıyla yapıştırdın (yanlış yapıştırıcıdan sonra). Artık ince, parlak bir çizgisi var; sen ona imza diyorsun.',
      ],
      bad: [
        'The wrong glue held, but the sound changed: sweeter, but a little nasal. The family says it sings through its nose now.',
        'Yanlış yapıştırıcı tuttu ama ses değişti: daha tatlı ama biraz genizden. Aile artık burnundan şarkı söylediğini söylüyor.',
      ],
    },
  ],
  scares: [
    {
      what: ['The saz was left on a minibus after a wedding.', 'Bağlama bir düğün dönüşü minibüste kaldı.'],
      search: [
        'You phoned the driver, then his cousin, then the cousin\'s friend. At midnight someone knocked, saz in hand, humming.',
        'Şoförü, sonra kuzenini, sonra kuzenin arkadaşını aradın. Gece yarısı biri bağlama elinde, mırıldanarak kapıyı çaldı.',
      ],
      reward: [
        'The driver had played it for his passengers the whole route and returned it with a full report on the repertoire.',
        'Şoför bütün yol boyunca yolcularına çalmış ve repertuvar hakkında tam bir raporla geri getirdi.',
      ],
    },
    {
      what: ['A guest took the saz "for a quick tune" and vanished into a crowd of dancing relatives.', 'Bir misafir bağlamayı "bir türkü çalıp vereceğim" diye alıp dans eden akrabaların arasında kayboldu.'],
      search: [
        'You followed the sound across three rooms and a balcony. It was in the hands of a six-year-old, who was playing it very seriously.',
        'Sesi izleyerek üç oda ve bir balkon geçtin. Altı yaşında bir çocuğun elindeydi; çok ciddi bir yüzle çalıyordu.',
      ],
      reward: [
        "The guest's mother found it behind a sofa the next morning and sent it back with a note: \"Sorry. It is very catchy.\"",
        'Misafirin annesi ertesi sabah onu kanepenin arkasında bulup bir notla geri gönderdi: "Kusura bakmayın. Çok akılda kalıcı."',
      ],
    },
    {
      what: ['The saz was left on a balcony in the rain.', 'Bağlama yağmurda balkonda kaldı.'],
      search: [
        'You ran out in your socks and carried it in like a baby. After three days beside the radiator it was a little sulky but sound.',
        'Çoraplarınla koşup bebek gibi içeri taşıdın. Üç gün kaloriferin yanında kalınca biraz küstü ama sağlam çıktı.',
      ],
      reward: [
        'A neighbour had seen the rain, climbed over the railing and carried it in. "A saz must not cry," she said.',
        'Bir komşu yağmuru görmüş, korkuluğun üstünden aşıp içeri almış. "Saz ağlamaz" dedi.',
      ],
    },
    {
      what: ['The saz went missing after a family move, and nobody remembered packing it.', 'Taşınmadan sonra bağlama ortadan kayboldu; kimse onu kolilediğini hatırlamıyordu.'],
      search: [
        'You looked in the cellar, the car and the wardrobe. It was inside the sofa bed, lying like a sleeping animal.',
        'Kileri, arabayı ve gardırobu aradın. Çekyatın içindeydi; uyuyan bir hayvan gibi yatıyordu.',
      ],
      reward: [
        'The old landlord called: it had been left behind a curtain rail. He had kept the saz warm for you and wanted a song as payment.',
        'Eski ev sahibi aradı: perde rayının arkasında kalmış. Sana bağlamayı sıcak tutmuş ve ücret olarak bir türkü istedi.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year the oldest told how the saz came to the family. The story has grown a camel since last time.',
      'Bu yıl en büyük, bağlamanın aileye nasıl geldiğini anlattı. Hikâyeye geçen seferden beri bir de deve eklenmiş.',
    ],
    [
      'This year every person added one line to the family song. It now has eleven verses and no ending.',
      'Bu yıl herkes aile türküsüne bir dize ekledi. Artık on bir kıtası var ve sonu yok.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants to hang the saz on the wall "so it can look at us".`, `${n}, bağlamayı duvara asmak istiyor: "bize baksın diye".`],
      yes: [
        'The saz hangs on the living-room wall now. People look at it, then at you, then ask for a song.',
        'Bağlama artık oturma odası duvarında. İnsanlar ona, sonra sana bakıp bir türkü istiyor.',
      ],
    },
    {
      idea: (n) => [`${n} has signed you both up for a beginners' saz evening.`, `${n} ikinizi bir başlangıç bağlama akşamına yazdırmış.`],
      yes: [
        'Twelve strangers, one patient teacher and an unbelievable amount of tea. You both came home humming.',
        'On iki yabancı, sabırlı bir hoca ve inanılmaz miktarda çay. İkiniz de mırıldanarak eve döndünüz.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to play the saz at the school talent show.', 'Okul yetenek yarışmasında bağlama çalmak istiyorsun.'],
      ok: [
        'You played one slow song. The hall went quiet, then loud. A teacher cried and denied it.',
        'Ağır bir türkü çaldın. Salon önce sessizleşti, sonra gürledi. Bir öğretmen ağladı ve inkâr etti.',
      ],
      bad: [
        'A string snapped in the middle of the second verse. You finished on three strings and the crowd decided it was on purpose.',
        'İkinci kıtanın ortasında bir tel koptu. Üç telle bitirdin ve seyirci bunun kasıtlı olduğuna karar verdi.',
      ],
    },
    {
      plan: ["You want to take the saz to a friend's bonfire.", 'Bağlamayı bir arkadaşının kamp ateşine götürmek istiyorsun.'],
      ok: [
        'Under the stars everybody sang the one chorus they knew, again and again. It was perfect.',
        'Yıldızların altında herkes bildiği tek nakaratı defalarca söyledi. Mükemmeldi.',
      ],
      bad: [
        'A spark landed on the case. You spent the rest of the night with a bucket and your heart in your throat. The saz has a tiny scorch mark now, like a freckle.',
        'Bir kıvılcım kasaya düştü. Gecenin kalanını elinde bir kovayla, yüreğin ağzında geçirdin. Bağlamada artık minik, çil gibi bir yanık izi var.',
      ],
    },
  ],
  quiet: [
    ['You plucked a single string and let the note fade until the room was quiet again.', 'Bir teli çalıp oda yeniden sessizleşene kadar sesinin sönmesini bekledin.'],
    ['You ran a thumb over the worn spot on the neck where every keeper\'s hand has rested.', 'Başparmağını sapta, her sahibinin elinin dinlendiği aşınmış yerin üstünde gezdirdin.'],
    ['You played the old song so softly that you could hear the wood answer.', 'Eski türküyü o kadar kısık çaldın ki ahşabın cevap verdiğini duydun.'],
  ],
};
