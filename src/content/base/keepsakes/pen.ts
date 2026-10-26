import { dat, gen } from '../../../i18n/tr-grammar';
import type { HeirloomTexts } from './types';

/** The family fountain pen: signatures, letters that mattered, and ink on every cuff. */
export const pen: HeirloomTexts = {
  tallTale: ['it once signed a treaty between two neighbours who had not spoken for forty years (over a fence)', 'kırk yıldır konuşmayan iki komşu arasında bir barış anlaşması imzaladığını (bir çit yüzünden)'],
  kidMishap: [
    'drew a very detailed cat on the wall and signed it with a flourish.',
    'duvara çok ayrıntılı bir kedi çizdi ve büyük bir süsle imzaladı.',
  ],
  borrow: {
    ages: [18, 50],
    ask: (n) => [`${n} asks to borrow the fountain pen "for an important signature".`, `${n} dolma kalemi "önemli bir imza için" ödünç istiyor.`],
    back: (n) => [
      `The fountain pen came back full of ink and a little prouder. ${n} said the signature went perfectly, and also that the lawyer wanted to know where to buy one.`,
      `Dolma kalem mürekkep dolu ve biraz daha gururlu geri geldi. ${n} imzanın mükemmel geçtiğini, avukatın da bir tane nereden alınacağını sorduğunu söyledi.`,
    ],
  },
  ritual: [
    'the fountain pen comes out, and each person writes a line to the next year on a sheet that is sealed until the same evening',
    'dolma kalem çıkarılıyor ve herkes bir sonraki yıla bir satır yazıyor; kâğıt aynı akşama kadar mühürleniyor',
  ],
  notePlace: ["Slipped into the pen's case, under the cloth", 'Kalemin kutusuna, bezin altına sıkıştırılmış'],
  lesson: {
    how: [
      'Hold it lightly, let the nib do the work, never press, and always cap it before you answer the phone.',
      'Hafif tut, işi uca bırak, asla bastırma ve telefona cevap vermeden önce hep kapağını kapat.',
    ],
    done: (n) => [
      `You taught ${n} to write with a nib. The first page was a blot. By the last page, ${n} had developed a handwriting, and an opinion about paper.`,
      `${dat(n)} uçla yazmayı öğrettin. İlk sayfa bir lekeydi. Son sayfada ${gen(n)} bir el yazısı ve kâğıt hakkında bir fikri oluşmuştu.`,
    ],
  },
  copy: ['a simple new fountain pen and a bottle of blue ink, tied together with a ribbon', 'şeritle birbirine bağlanmış sade yeni bir dolma kalem ve bir şişe mavi mürekkep'],
  sitTr: 'dolma kalemi avucuna alıp',
  repairs: [
    {
      title: ['The nib of the fountain pen has gone scratchy.', 'Dolma kalemin ucu kaşıntılı yazmaya başladı.'],
      text: ['Every letter now sounds like a small argument with the page.', 'Her harf kâğıtla küçük bir tartışma gibi ses çıkarıyor.'],
      pro: [
        'A pen specialist ground and polished the nib for an afternoon. It glides now, and the letters seem to write themselves.',
        'Bir kalem uzmanı ucu bir öğleden sonra boyunca eğeleyip parlattı. Artık kayıyor ve harfler kendiliğinden yazılıyor gibi.',
      ],
      ok: [
        'You smoothed the nib on a sheet of fine paper, very gently, over many evenings. It is quieter and almost forgiving.',
        'Ucu ince bir kâğıtta, çok nazikçe, birkaç akşam boyunca yumuşattın. Daha sessiz ve neredeyse bağışlayıcı.',
      ],
      bad: [
        'You pressed too hard and spread the tines. It now writes in double lines, which the family calls "a very confident style".',
        'Fazla bastırıp uçları açtın. Artık çift çizgiyle yazıyor; aile buna "çok kendinden emin bir üslup" diyor.',
      ],
    },
    {
      title: ['The fountain pen has leaked ink all over its case.', 'Dolma kalem kutusunun içine mürekkep sızdırmış.'],
      text: ['The cloth lining is the colour of a stormy sky, and so are your fingers.', 'Kumaş astar fırtınalı bir gökyüzü renginde; parmakların da öyle.'],
      pro: [
        'A pen specialist replaced the seal and cleaned the cloth. The case smells of nothing but old leather now.',
        'Bir kalem uzmanı contayı değiştirip kumaşı temizledi. Kutu artık yalnızca eski deri kokuyor.',
      ],
      ok: [
        'You cleaned it with a soft cloth and patience, and swapped the seal for a new one. Your fingers were blue for a week.',
        'Yumuşak bir bez ve sabırla temizledin, contayı yenisiyle değiştirdin. Parmakların bir hafta mavi kaldı.',
      ],
      bad: [
        'You tried a stain remover. The stain left, and so did most of the cloth. The case now has a pleasingly worn lining.',
        'Leke çıkarıcı denedin. Leke gitti, kumaşın çoğu da. Kutunun astarı artık hoş bir şekilde yıpranmış.',
      ],
    },
    {
      title: ['The cap of the fountain pen has cracked.', 'Dolma kalemin kapağı çatlamış.'],
      text: ['It no longer clicks shut, and the ink has begun to dry out inside.', 'Artık tık diye kapanmıyor ve içindeki mürekkep kurumaya başlamış.'],
      pro: [
        'A pen specialist made a new cap from the same material and fitted it precisely. It clicks like a good argument ending.',
        'Bir kalem uzmanı aynı malzemeden yeni bir kapak yapıp tam oturttu. İyi bir tartışmanın bitişi gibi tık diye kapanıyor.',
      ],
      ok: [
        'You glued the crack and wound a thread around it. It closes, mostly, and you have learned to be gentle.',
        'Çatlağı yapıştırıp çevresine bir iplik sardın. Çoğunlukla kapanıyor ve nazik olmayı öğrendin.',
      ],
      bad: [
        'You used a too-strong glue and now the cap is fixed on forever. The fountain pen is, in effect, always ready to write.',
        'Fazla güçlü bir yapıştırıcı kullandın ve kapak artık sonsuza dek sabit. Dolma kalem bir bakıma her an yazmaya hazır.',
      ],
    },
  ],
  scares: [
    {
      what: ['You left the fountain pen on the counter of a bank.', 'Dolma kalemi bir bankanın tezgâhında unuttun.'],
      search: [
        'You rushed back, past a queue and a security guard, and found it in a clerk\'s drawer. "We were keeping it safe for you," she said, with a look of immense importance.',
        'Bir sıranın ve bir güvenlik görevlisinin önünden koşarak geri döndün ve onu bir memurun çekmecesinde buldun. "Sizin için saklıyorduk" dedi, çok önemli bir yüzle.',
      ],
      reward: [
        'The clerk had used it to sign something important, found it so pleasant to write with that she mailed it back with a thank-you note.',
        'Memur onunla önemli bir şey imzalamış, yazması o kadar hoşuna gitmiş ki teşekkür notuyla posta ile geri göndermiş.',
      ],
    },
    {
      what: ['A colleague borrowed the fountain pen and then moved departments.', 'Bir iş arkadaşı dolma kalemi ödünç aldı ve sonra bölüm değiştirdi.'],
      search: [
        'You wandered a long corridor to a different floor and found it in his top pocket, a little chewed. He returned it with an apology and an excuse about a crossword.',
        'Uzun bir koridordan başka bir kata yürüdün ve onu üst cebinde, biraz çiğnenmiş hâlde buldun. Özür dileyip bulmacayla ilgili bir bahane uydurarak geri verdi.',
      ],
      reward: [
        'He returned it by hand, with a new bottle of ink and the strange confession that he had become a better person with it.',
        'Onu elden, yeni bir mürekkep şişesiyle ve onunla daha iyi bir insan olduğu garip itirafıyla geri getirdi.',
      ],
    },
    {
      what: ['The fountain pen rolled off the desk and vanished under the furniture.', 'Dolma kalem masadan yuvarlanıp mobilyaların altında kayboldu.'],
      search: [
        'You lay on the floor with a torch for an hour. It was under the wardrobe, next to a sock and three old receipts.',
        'Bir saat boyunca el feneriyle yerde yattın. Gardırobun altındaydı; bir çorabın ve üç eski fişin yanında.',
      ],
      reward: [
        'A child crawled under, retrieved it in seconds and held it up like a prize. "I am an excellent detective," they said.',
        'Bir çocuk altına süründü, saniyeler içinde çıkardı ve bir ödül gibi havaya kaldırdı. "Ben mükemmel bir dedektifim" dedi.',
      ],
    },
    {
      what: ['The fountain pen went through the wash in a shirt pocket.', 'Dolma kalem bir gömleğin cebinde çamaşır makinesine girdi.'],
      search: [
        'You fished it out of the drum, blue and dripping, and found everything inside blue, too. The fountain pen was fine. The shirts were abstract art.',
        'Tamburdan, mavi ve damlayarak çıkardın ve içindeki her şeyin de mavi olduğunu gördün. Kalem iyiydi. Gömlekler soyut sanattı.',
      ],
      reward: [
        'The shirt, not the pen, took the damage. A neighbour taught you a trick with milk and vinegar, and most of the blue came out.',
        'Zarar gören kalem değil gömlek oldu. Bir komşu sana süt ve sirkeyle bir numara öğretti ve mavinin çoğu çıktı.',
      ],
    },
  ],
  ritualNew: [
    [
      'This year everyone wrote their line, and the oldest wrote two. "Just in case," they said, and refused to say what for.',
      'Bu yıl herkes satırını yazdı, en büyük iki tane yazdı. "Ne olur ne olmaz" dedi ve neden olduğunu söylemeyi reddetti.',
    ],
    [
      'This year the sealed sheets from last year were opened. Most were promises. Three had already come true. One was just a drawing of a cat.',
      'Bu yıl geçen yılın mühürlü kâğıtları açıldı. Çoğu sözdü. Üçü şimdiden gerçek olmuştu. Biri yalnızca bir kedi çizimiydi.',
    ],
  ],
  partnerIdea: [
    {
      idea: (n) => [`${n} wants to exchange letters with you, properly, with the fountain pen, once a month.`, `${n}, seninle ayda bir, dolma kalemle, doğru dürüst mektuplaşmak istiyor.`],
      yes: [
        'The letters arrive on paper that smells faintly of ink. You keep every one in a drawer you pretend not to open.',
        'Mektuplar hafifçe mürekkep kokan kâğıtlarla geliyor. Hepsini açmıyormuş gibi yaptığın bir çekmecede saklıyorsun.',
      ],
    },
    {
      idea: (n) => [`${n} thinks you should write down the family stories with the fountain pen, "before they get any taller".`, `${n}, aile hikâyelerini "daha da uzamadan" dolma kalemle yazman gerektiğini düşünüyor.`],
      yes: [
        'You filled forty pages in a winter. The best story, about the goat, took four evenings. Nobody believed it, and that is why it is true.',
        'Bir kışta kırk sayfa doldurdun. En iyi hikâye, keçiyle ilgili olan, dört akşam sürdü. Kimse inanmadı ve bu yüzden doğru.',
      ],
    },
  ],
  sneak: [
    {
      plan: ['You want to use the fountain pen for your school exam.', 'Okul sınavında dolma kalemi kullanmak istiyorsun.'],
      ok: [
        'Your handwriting looked like it belonged to a much older, much wiser person. The teacher gave you extra marks for "presentation".',
        'El yazın çok daha yaşlı, çok daha bilge birine ait gibi görünüyordu. Öğretmen "sunum" için sana fazladan puan verdi.',
      ],
      bad: [
        'A blot landed in the middle of your best answer. You turned it into a small, tidy sun and kept writing around it.',
        'En iyi cevabının ortasına bir leke düştü. Onu küçük, derli toplu bir güneşe çevirdin ve etrafından yazmaya devam ettin.',
      ],
    },
    {
      plan: ['You want to sign something small, but with a flourish.', 'Küçük bir şeyi bir süsle imzalamak istiyorsun.'],
      ok: [
        'You signed with a flourish no one could copy, and the clerk looked at you with new respect.',
        'Kimsenin taklit edemeyeceği bir süsle imzaladın ve memur sana yeni bir saygıyla baktı.',
      ],
      bad: [
        'The flourish ran into the next line and through the clerk\'s own signature. You had to sign it again. And again.',
        'Süs bir sonraki satıra, hatta memurun kendi imzasının içine taştı. Yeniden imzalaman gerekti. Sonra bir kez daha.',
      ],
    },
  ],
  quiet: [
    ['You wrote one sentence, slowly, and read it back in the silence.', 'Yavaşça tek bir cümle yazdın ve sessizlikte yeniden okudun.'],
    ['You unscrewed the cap and watched a bead of ink gather on the nib, and let it fall.', 'Kapağı açıp uçta bir mürekkep damlasının biriktiğini izledin ve düşmesine izin verdin.'],
    ['You held the pen where a hundred letters had been written, and let your hand remember.', 'Kalemi yüz mektubun yazıldığı yerden tuttun ve elinin hatırlamasına izin verdin.'],
  ],
};
