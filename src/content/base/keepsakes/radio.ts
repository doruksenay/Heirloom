import { dat } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family radio: crackle, news, matches and the one song nobody admits to loving. */
export const radio: HeirloomTexts = {
  tallTale: ['it once picked up a station that had not been on the air for fifty years', 'bir zamanlar elli yıldır yayın yapmayan bir istasyonu yakaladığını'],
  kidMishap: [
    'twisted the dial all the way round and found a station that plays only accordion. Finding the old one again took a week.',
    'düğmeyi sonuna kadar çevirdi ve sadece akordeon çalan bir istasyon buldu. Eskisini yeniden bulmak bir hafta sürdü.',
  ],
  borrow: {
    ages: [20, 70],
    ask: (n) => [`${n} asks to borrow the radio for a picnic by the river. "Just for the match."`, `${n} nehir kenarındaki piknik için radyoyu ödünç istiyor. "Sadece maç için."`],
    back: (n) => [
      `The radio came back with a fresh battery and a crackle that was not there before. ${n} calls it "character".`,
      `Radyo yeni bir pille ve eskiden olmayan bir cızırtıyla geri geldi. ${n} buna "karakter" diyor.`,
    ],
  },
  ritual: [
    'the radio is switched on for the one song everybody knows and nobody admits to loving',
    'radyo, herkesin bildiği ama kimsenin sevdiğini itiraf etmediği o şarkı için açılıyor',
  ],
  notePlace: ["Taped inside the radio's back panel", 'Radyonun arka kapağının içine bantlanmış'],
  lesson: {
    how: [
      'Hold the aerial like a flower, turn the dial slowly, and never change the station while someone is listening.',
      'Anteni bir çiçek gibi tut, düğmeyi yavaş çevir ve biri dinlerken asla istasyonu değiştirme.',
    ],
    done: (n) => [
      `You taught ${n} to find the old station. ${n} turned the dial so slowly that the crackle itself seemed to wait.`,
      `${dat(n)} eski istasyonu bulmayı öğrettin. ${n} düğmeyi öyle yavaş çevirdi ki cızırtı bile bekliyor gibiydi.`,
    ],
  },
  copy: ['a little pocket radio from a market stall, tuned to the same station', 'pazar tezgâhından aynı istasyona ayarlanmış küçük bir cep radyosu'],
  sitTr: 'radyonun başına',
  repairs: [
    {
      title: ['The radio has gone silent.', 'Radyo sustu.'],
      text: [
        'The dial lights up, the needle moves, and nothing comes out. The kitchen feels like a room with the sound turned off.',
        'Düğmenin ışığı yanıyor, ibre oynuyor ama ses çıkmıyor. Mutfak, sesi kapatılmış bir oda gibi.',
      ],
      pro: [
        'A repairman opened the back, blew out forty years of dust and one very surprised spider. It sings again.',
        'Tamirci arka kapağı açtı, kırk yıllık tozu ve çok şaşırmış bir örümceği üfleyip çıkardı. Yeniden şarkı söylüyor.',
      ],
      ok: [
        'You tapped the side twice, the way your family always did. It crackled and came back. Nobody has ever found out why.',
        'Yanına iki kez vurdun; ailen hep öyle yapardı. Cızırdadı ve geri geldi. Nedenini kimse bilmiyor.',
      ],
      bad: [
        'You swapped in a part from a drawer. It plays now, but only one station, for ever. Luckily, it is a good one.',
        'Çekmecede bulduğun bir parçayı taktın. Artık çalışıyor ama sadece tek bir istasyon, sonsuza dek. Neyse ki iyi bir istasyon.',
      ],
    },
    {
      title: ['The radio hums louder than it plays.', 'Radyo çaldığından çok vızıldıyor.'],
      text: ['Under every song there is a low buzz, as if a bee had moved in.', 'Her şarkının altında alçak bir vızıltı var; sanki içeriye bir arı taşınmış.'],
      pro: [
        'The repairman replaced one tired little part. The silence between songs is now clean and almost holy.',
        'Tamirci yorgun düşmüş küçücük bir parçayı değiştirdi. Şarkıların arasındaki sessizlik artık tertemiz, neredeyse kutsal.',
      ],
      ok: ['You turned it round and found a loose wire. You pressed it back, and the bee left.', 'Çevirip gevşemiş bir kablo buldun. Yerine bastırdın ve arı gitti.'],
      bad: [
        'You pressed the wire back and the buzz stopped, but so did the bass. Every song now sounds as if it is playing in a cupboard.',
        'Kabloyu yerine bastırdın; vızıltı kesildi ama bas sesler de gitti. Her şarkı artık dolabın içinden geliyormuş gibi.',
      ],
    },
    {
      title: ["The radio's dial has gone stiff.", 'Radyonun düğmesi sertleşti.'],
      text: [
        'It sticks halfway between two stations, and you keep hearing a newsreader argue with a singer.',
        'İki istasyonun arasında takılı kalıyor; bir spikerle bir şarkıcının tartıştığını duyup duruyorsun.',
      ],
      pro: ['The repairman cleaned the dial with a tiny brush and a patient face. It turns like silk.', 'Tamirci düğmeyi minik bir fırçayla ve sabırlı bir yüzle temizledi. İpek gibi dönüyor.'],
      ok: [
        'A drop of oil, a tissue and a lot of care. It turns now, with only a faint squeak that you have started to like.',
        'Bir damla yağ, bir mendil ve bol özen. Artık dönüyor; sadece hafif bir gıcırtısı var ve sen onu sevmeye başladın.',
      ],
      bad: [
        'You used far too much oil. The dial now turns so freely that the station changes whenever anybody laughs.',
        'Fazla yağ döktün. Düğme o kadar rahat dönüyor ki biri her güldüğünde istasyon değişiyor.',
      ],
    },
  ],
  scares: [
    {
      what: ['You left the radio on a bench at the bus stop.', 'Radyoyu otobüs durağındaki bankta unuttun.'],
      search: [
        'You went back in a panic. A stranger was sitting beside it, listening to the match, and handed it over only after the final whistle.',
        'Panikle geri döndün. Yanında bir yabancı oturmuş maç dinliyordu; son düdük çalınca radyoyu sana uzattı.',
      ],
      reward: [
        'The bus driver had put it behind his seat and tuned it to his own station. He gave it back with a small, sad look.',
        'Şoför onu koltuğunun arkasına koymuş ve kendi istasyonuna ayarlamıştı. Küçük, mahzun bir bakışla geri verdi.',
      ],
    },
    {
      what: ['The radio went missing in the middle of a house move.', 'Radyo taşınma sırasında ortadan kayboldu.'],
      search: [
        'You opened every box twice. It was in the one marked "winter blankets", wrapped in a scarf that was not yours.',
        'Her koliyi iki kez açtın. "Kışlık battaniyeler" yazan kutudaydı; sana ait olmayan bir atkıya sarılıydı.',
      ],
      reward: [
        'The movers called back, embarrassed. It had gone to the wrong flat, where it was already a favourite.',
        'Nakliyeciler mahcup bir sesle geri aradı. Yanlış daireye gitmiş; orada şimdiden sevilen biri olmuş.',
      ],
    },
    {
      what: ['Someone put the radio in a charity bag by mistake.', 'Biri radyoyu yanlışlıkla yardım çuvalına koymuş.'],
      search: [
        'You drove to three charity shops. In the third, it sat on a shelf with a price sticker that said "works, probably". You paid and carried it out like a baby.',
        'Üç yardım dükkânına gittin. Üçüncüsünde, üstünde "çalışıyor, herhalde" yazan fiyat etiketiyle rafta duruyordu. Parasını ödeyip bebek gibi kucağında taşıdın.',
      ],
      reward: [
        'The shop manager recognised the family name on the back and called you before she put it out. "It sounded too lovely to sell," she said.',
        'Dükkân sorumlusu arkasındaki aile adını tanıdı ve rafa koymadan seni aradı. "Çalışırken fazla güzeldi, satamazdım" dedi.',
      ],
    },
    {
      what: ['The window above the radio leaked in a storm.', 'Radyonun üstündeki pencere fırtınada su sızdırdı.'],
      search: [
        'You unplugged it and dried it for three days beside a warm radiator. When you plugged it back in, it coughed once and sang.',
        'Fişini çektin ve üç gün sıcak bir kaloriferin yanında kuruttun. Yeniden taktığında bir kere öksürdü ve şarkı söylemeye başladı.',
      ],
      reward: [
        'A neighbour who repairs old sets dried it out properly and refused any money. "It would be a crime," he said, and brought a plant instead.',
        'Eski cihazlar tamir eden bir komşu onu usulüne uygun kuruttu ve para almayı reddetti. "Yazık olurdu" dedi, onun yerine bir saksı çiçek getirdi.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year the youngest was allowed to find the station. It took four minutes and everyone pretended not to mind.',
      'Bu yıl istasyonu bulma işini en küçüğe verdiler. Dört dakika sürdü ve herkes sorun değilmiş gibi yaptı.',
    ],
    [
      'This year someone brought a notebook and wrote down every song that played. The list is now taped to the wall.',
      'Bu yıl biri bir defter getirip çalan her şarkıyı yazdı. Liste artık duvara yapıştırılmış.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants the radio moved to the kitchen windowsill "so it can see the street".`, `${n}, radyonun mutfaktaki pencere kenarına taşınmasını istiyor: "sokağı görsün diye".`],
      yes: [
        'The radio sits by the window now. It picks up two new stations and, according to the family, a new accent.',
        'Radyo artık pencerenin kenarında. İki yeni istasyon yakalıyor; ailenin dediğine göre yeni bir şive de edinmiş.',
      ],
    },
    {
      idea: (n) => [`${n} suggests a "radio hour" every evening: no screens, only the radio and tea.`, `${n}, her akşam bir "radyo saati" yapmayı öneriyor: ekran yok, sadece radyo ve çay.`],
      yes: [
        'Radio hour became the best hour of the day. You learned things about each other that no phone ever asked.',
        'Radyo saati günün en güzel saati oldu. Birbirinizle ilgili, hiçbir telefonun sormadığı şeyler öğrendiniz.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to smuggle the radio into school for the big match.', 'Büyük maç için radyoyu okula sokmak istiyorsun.'],
      ok: [
        'You listened under a scarf, one earphone shared between three friends. The goal made all of you jump, and nobody was caught.',
        'Atkının altında, üç arkadaş tek kulaklıkla dinlediniz. Gol hepinizi zıplattı ve kimse yakalanmadı.',
      ],
      bad: [
        'It crackled into the middle of a silent exam. The teacher confiscated it until the end of term and listened to the rest of the match herself.',
        'Sessiz bir sınavın ortasında cızırdadı. Öğretmen dönem sonuna kadar elinden aldı ve maçın kalanını kendisi dinledi.',
      ],
    },
    {
      plan: ['You want to take the radio on a school trip.', 'Radyoyu okul gezisine götürmek istiyorsun.'],
      ok: [
        'On the coach every song became a sing-along. Even the driver turned his own radio off, out of respect.',
        'Otobüste her şarkı bir koroya dönüştü. Şoför bile saygısından kendi radyosunu kapattı.',
      ],
      bad: [
        'It fell under the seats and played one forgotten song on a loop until somebody found it behind a lunchbox.',
        'Koltukların altına düştü ve biri onu beslenme çantasının arkasında bulana kadar unutulmuş tek bir şarkıyı çalıp durdu.',
      ],
    },
  ],
  quiet: [
    ['You turned the dial very slowly and caught a song you had not heard since you were small.', 'Düğmeyi çok yavaş çevirdin ve küçüklüğünden beri duymadığın bir şarkıyı yakaladın.'],
    ['You listened to the night station, where strangers call in to talk about nothing. It felt like company.', 'Gece istasyonunu dinledin; yabancılar arayıp hiçbir şey hakkında konuşuyor. Arkadaşlık gibi geldi.'],
    [
      'You rested your hand on the warm case and listened to the crackle between two stations, the sound of everyone who ever listened here.',
      'Elini ılık gövdeye koyup iki istasyon arasındaki cızırtıyı dinledin; burada daha önce dinleyen herkesin sesi gibi.',
    ],
  ],
};
