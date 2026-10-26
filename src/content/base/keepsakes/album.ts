import { dat } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family photo album: faces with the names written underneath, and the one picture nobody can explain. */
export const album: HeirloomTexts = {
  tallTale: ['it holds a picture of every relative at once, none of whom agree who stands where', 'her akrabanın aynı karede olduğu, kimsenin kimin nerede durduğu konusunda anlaşamadığı bir fotoğraf barındırdığını'],
  kidMishap: [
    'drew moustaches on all the faces with a marker and called it "improvements".',
    'bütün yüzlere keçeli kalemle bıyık çizdi ve buna "iyileştirme" dedi.',
  ],
  borrow: {
    ages: [20, 80],
    ask: (n) => [`${n} asks to borrow the album "to scan a few pages for the cousins".`, `${n} albümü "kuzenler için birkaç sayfayı taramak üzere" ödünç istiyor.`],
    back: (n) => [
      `The album came back with a new page inside: ${n} had added a picture of the family reunion, and labelled every face. Even the dog.`,
      `Albüm içinde yeni bir sayfayla geri geldi: ${n} aile buluşmasının bir fotoğrafını eklemiş ve her yüzün altına isim yazmış. Köpeğin bile.`,
    ],
  },
  ritual: [
    'the album comes out at the end of the evening, and everyone argues about who is who in the oldest pictures',
    'akşamın sonunda albüm çıkarılıyor ve herkes en eski fotoğraflardaki kişilerin kim olduğu konusunda tartışıyor',
  ],
  notePlace: ['Slipped behind the last page of the album', 'Albümün son sayfasının arkasına sıkıştırılmış'],
  lesson: {
    how: [
      'Always write the name and the year on the back, in pencil, and never trust anyone who says "everyone knows who that is".',
      'Arkasına hep isim ve yıl yaz, kurşun kalemle, ve "bunun kim olduğunu herkes bilir" diyene asla güvenme.',
    ],
    done: (n) => [
      `You taught ${n} how to label the pictures. They have started with the ones from last week, "just to be safe".`,
      `${dat(n)} fotoğrafları nasıl etiketleyeceğini öğrettin. Geçen haftaki fotoğraflardan başladı: "ne olur ne olmaz".`,
    ],
  },
  copy: ['a new album with the best pictures printed fresh and a name pencilled under every face', 'en iyi fotoğrafların yeniden basıldığı ve her yüzün altına isim yazılmış yeni bir albüm'],
  sitTr: 'fotoğraf albümünü kucağına alıp',
  repairs: [
    {
      title: ['The pages of the album have started to stick.', 'Albümün sayfaları birbirine yapışmaya başladı.'],
      text: ['Faces peel off in strips. Grandfather is now half a grandfather.', 'Yüzler şeritler hâlinde soyuluyor. Dede artık yarım dede.'],
      pro: [
        'A conservator separated the pages with a steam and a spatula, and then put the pictures into archival sleeves. You can see every face again.',
        'Bir restoratör sayfaları buhar ve spatulayla ayırdı, sonra fotoğrafları arşiv kılıflarına yerleştirdi. Her yüzü yeniden görebiliyorsun.',
      ],
      ok: [
        'You separated the pages slowly, with dental floss, and a lot of held breath. Grandfather is almost whole.',
        'Sayfaları diş ipiyle ve bolca tuttuğun nefesle yavaşça ayırdın. Dede neredeyse bütün.',
      ],
      bad: [
        'You tried to peel them apart. Three pictures tore. They are now very modern, abstract portraits.',
        'Sayfaları soymaya çalıştın. Üç fotoğraf yırtıldı. Artık çok modern, soyut portreler.',
      ],
    },
    {
      title: ['The pictures in the album have started to fade.', 'Albümdeki fotoğraflar solmaya başladı.'],
      text: ['Everyone is getting paler, as if they were slowly leaving the room.', 'Herkes soluyor; sanki yavaşça odadan çıkıyorlar.'],
      pro: [
        'A studio scanned the originals and restored the colour. The family looks younger than ever, and so does the dog.',
        'Bir stüdyo orijinalleri tarayıp rengi geri getirdi. Aile her zamankinden genç görünüyor, köpek de.',
      ],
      ok: [
        'You scanned the pages at home and saved copies for everyone. The originals are going back in the dark, where they like it.',
        'Sayfaları evde taradın ve herkese birer kopya yaptın. Orijinaller sevdikleri yere, karanlığa geri dönüyor.',
      ],
      bad: [
        'You touched them up with a free app. Everyone now has the same suspiciously smooth skin, and Uncle Selim has a new nose.',
        'Ücretsiz bir uygulamayla rötuş yaptın. Artık herkesin cildi aynı şüpheli pürüzsüzlükte ve Selim amcanın yeni bir burnu var.',
      ],
    },
    {
      title: ['The spine of the album is coming apart.', 'Albümün sırtı ayrılıyor.'],
      text: ['The cover hangs by a thread, and each page now turns with a sigh.', 'Kapak bir iplikle tutunuyor ve her sayfa artık bir iç çekişle dönüyor.'],
      pro: [
        'A binder restitched the spine and re-covered it in the same blue cloth. It opens with a sigh of relief.',
        'Bir cilt ustası sırtı yeniden dikip aynı mavi kumaşla kapladı. Rahatlama iç çekişiyle açılıyor.',
      ],
      ok: [
        'You sewed the spine back with strong thread and a tapestry needle. It is lumpy, but it holds.',
        'Sırtı kalın iplik ve bir goblen iğnesiyle diktin. Yumru yumru ama tutuyor.',
      ],
      bad: [
        'You taped the spine and the tape yellowed within a month. The album now looks as if it has a mild cold.',
        'Sırtı bantladın ve bant bir ay içinde sarardı. Albüm şimdi hafif nezle olmuş gibi görünüyor.',
      ],
    },
  ],
  scares: [
    {
      what: ['The album was left on a train seat.', 'Albüm trende bir koltukta unutuldu.'],
      search: [
        'You called the station, then the next station, then the one after. The album was waiting in lost property, with the cover turned toward the door.',
        'İstasyonu, sonra bir sonrakini, sonra onu da aradın. Albüm kayıp eşya bürosunda, kapağı kapıya dönük, seni bekliyordu.',
      ],
      reward: [
        'A stranger had found it, looked through every page, and sent it back with a letter saying how much they liked your grandmother.',
        'Bir yabancı onu bulmuş, bütün sayfalara bakmış ve büyükannene ne kadar hayran kaldığını yazan bir mektupla geri göndermiş.',
      ],
    },
    {
      what: ['A cousin took the album "to copy a few pages" and went silent.', 'Bir kuzen albümü "birkaç sayfa kopyalamak için" aldı ve sesini kesti.'],
      search: [
        'It took six calls and an unannounced visit. It was on his table under a cup, half-copied. He had gone quiet because he had found a picture of his own father as a boy.',
        'Altı telefon ve habersiz bir ziyaret gerekti. Masasında, bir bardağın altında, yarım kopyalanmış hâlde duruyordu. Sesini kesmişti çünkü babasının çocukken bir fotoğrafını bulmuştu.',
      ],
      reward: [
        'He returned it with every picture copied, labelled, and a new one added: you, aged six, with a missing tooth and a fierce expression.',
        'Albümü her fotoğraf kopyalanmış, etiketlenmiş ve yeni bir tanesi eklenmiş olarak geri verdi: altı yaşında, dişi eksik, öfkeli bir yüzle sen.',
      ],
    },
    {
      what: ['Water got into the box where the album was stored.', 'Albümün saklandığı kutuya su girdi.'],
      search: [
        'You lifted it out, dried it page by page with paper towels and prayed. The family survived, with a few extra freckles.',
        'Onu kaldırıp sayfa sayfa kâğıt havluyla kuruttun ve dua ettin. Aile birkaç ekstra çille hayatta kaldı.',
      ],
      reward: [
        'A neighbour who works at an archive heard the news, arrived in twenty minutes with blotting paper and saved the lot.',
        'Bir arşivde çalışan komşu haberi duyup yirmi dakikada kurutma kâğıtlarıyla geldi ve hepsini kurtardı.',
      ],
    },
    {
      what: ['After a house clear-out, the album could not be found.', 'Bir ev boşaltmasından sonra albüm bulunamadı.'],
      search: [
        'You went through every box twice. It was in the freezer bag you had marked "do not touch", under frozen peas.',
        'Her kutuyu iki kez karıştırdın. "Dokunma" yazdığın dondurucu poşetinin içinde, dondurulmuş bezelyelerin altındaydı.',
      ],
      reward: [
        'The removal man found it, wrapped in a blanket on the seat of his van. "I thought it looked important," he said.',
        'Nakliyeci onu minibüsünün koltuğunda battaniyeye sarılı buldu. "Önemli görünüyordu" dedi.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year everybody brought one new picture to add. The album now needs a second album.',
      'Bu yıl herkes eklemek için yeni bir fotoğraf getirdi. Albümün artık bir ikinci albüme ihtiyacı var.',
    ],
    [
      'This year the oldest solved the mystery of the man in the hat. He was a lodger. Nobody has stopped talking since.',
      'Bu yıl en büyük, şapkalı adamın gizemini çözdü. Kiracıymış. O günden beri kimse susmadı.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants to put the best pictures from the album on the wall in frames.`, `${n}, albümdeki en güzel fotoğrafları çerçeveleyip duvara asmak istiyor.`],
      yes: [
        'The hallway now has twelve frames. Guests walk slowly, and every one of them asks about the man in the hat.',
        'Koridorda artık on iki çerçeve var. Misafirler yavaş yürüyor ve her biri şapkalı adamı soruyor.',
      ],
    },
    {
      idea: (n) => [`${n} wants to add you both to the album, properly, with names.`, `${n} ikinizi de albüme, isimleriyle düzgünce eklemek istiyor.`],
      yes: [
        'You chose the picture together. The two of you are at a wedding, laughing at something outside the frame. It goes on the first empty page.',
        'Fotoğrafı birlikte seçtiniz. Bir düğünde, çerçevenin dışındaki bir şeye gülüyorsunuz. İlk boş sayfaya yerleşti.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to show the album to your friends and tell the stories behind the pictures.', 'Albümü arkadaşlarına gösterip fotoğrafların arkasındaki hikâyeleri anlatmak istiyorsun.'],
      ok: [
        'You told the stories of the best five. By the end, your friends knew your family better than their own, and one asked to be adopted.',
        'En iyi beşinin hikâyesini anlattın. Sonunda arkadaşların ailenizi kendi ailelerinden iyi tanıyordu ve biri evlatlık alınmak istedi.',
      ],
      bad: [
        'You told the story about the aunt and the goat at exactly the moment she walked in. She has not stopped being offended.',
        'Teyze ve keçi hikâyesini tam teyzenin içeri girdiği anda anlattın. Teyze hâlâ kırgın.',
      ],
    },
    {
      plan: ['You want to find the oldest picture in the album and work out who it is.', 'Albümdeki en eski fotoğrafı bulup kim olduğunu çözmek istiyorsun.'],
      ok: [
        'With a magnifying glass, a lamp and an elderly aunt, you worked it out: it is your great-grandmother, aged nine, refusing to smile.',
        'Büyüteç, lamba ve yaşlı bir teyzeyle çözdün: büyük annenin annesi, dokuz yaşında, gülmeyi reddediyor.',
      ],
      bad: [
        'Three relatives gave three answers, each with total confidence. The picture remains a mystery, and the argument remains loud.',
        'Üç akraba üç ayrı cevap verdi, her biri tam bir güvenle. Fotoğraf gizemini koruyor, tartışma da gürültüsünü.',
      ],
    },
  ],
  quiet: [
    ['You turned the pages slowly, saying each name out loud, so that they would not be forgotten.', 'Sayfaları yavaşça çevirdin, unutulmasınlar diye her ismi yüksek sesle söyledin.'],
    ['You found a face you had not looked at for years and looked at it for a long time.', 'Yıllardır bakmadığın bir yüz buldun ve ona uzun uzun baktın.'],
    ['You closed the album gently, as one closes a door on a sleeping room.', 'Albümü, uyuyan bir odanın kapısını kapatır gibi nazikçe kapattın.'],
  ],
};
