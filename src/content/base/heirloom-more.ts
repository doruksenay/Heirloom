import { dat, gen } from './util';
import type { MoreHeirloomType } from './heirloom-words';

// Round 4: nine more heirloom types (camera, letters, tea set, sewing machine, radio, kilim, typewriter,
// backgammon board, toolbox). Every table here mirrors one in events-heirloom.ts, which merges them, so the
// new types live through exactly the same beats, memory and story system as the first seven.
//
// Writing rule for the shared heirloom test: a type's English text never names another type's noun
// (watch, ring, piano, quilt, recipe, trophy, painting, camera, letters bundle, tea set, sewing machine, radio,
// kilim, typewriter, backgammon, toolbox).

export type Pair = [string, string];
export type MoreTable<T> = Record<MoreHeirloomType, T>;

export interface RepairText {
  title: Pair;
  text: Pair;
  pro: Pair;
  ok: Pair;
  bad: Pair;
}
export interface ScareText {
  what: Pair;
  search: Pair;
  reward: Pair;
}

export const MORE_TALL_TALE: MoreTable<Pair> = {
  camera: ['it once photographed a famous film star, who wrote to ask for a copy', 'bir zamanlar ünlü bir film yıldızını çektiğini ve yıldızın mektup yazıp fotoğrafın bir kopyasını istediğini'],
  letters: ['one of them crossed a border sewn into the lining of a coat', 'içlerinden birinin bir sınırı bir paltonun astarına dikilerek geçtiğini'],
  teaset: ['a famous poet once wrote a poem about the teapot, and nobody has found it since', 'ünlü bir şairin bir zamanlar demlik hakkında bir şiir yazdığını ve o şiiri o günden beri kimsenin bulamadığını'],
  sewing: ['it once sewed a whole wedding dress in a single night, during a power cut', 'bir elektrik kesintisinde tek bir gecede koca bir gelinlik diktiğini'],
  radio: ['it once picked up a ship in trouble and the family called the coast guard', 'bir keresinde zor durumdaki bir gemiyi yakaladığını ve ailenin sahil güvenliği aradığını'],
  kilim: ['the weaver hid a wish in the pattern that only comes true for whoever finds it', 'dokuyan kişinin desene gizli bir dilek işlediğini ve dileğin sadece onu bulana gerçekleşeceğini'],
  typewriter: ['a famous novel was nearly written on it, but the author moved house', 'ünlü bir romanın neredeyse onunla yazıldığını ama yazarın son anda taşındığını'],
  tavla: ['a sailor carved it, then won his own ship on it', 'onu bir denizcinin oyduğunu ve sonra üstünde kendi gemisini kazandığını'],
  toolbox: ['it once fixed a broken-down train in the middle of nowhere, with only the hammer', 'bir zamanlar ıssız bir yerde bozulan koca bir treni sadece içindeki çekiçle tamir ettiğini'],
};

export const MORE_KID_MISHAP: MoreTable<Pair> = {
  camera: ['pressed the shutter forty times at the ceiling. The film is finished; so is your patience.', 'deklanşöre kırk kez basıp tavanın fotoğrafını çekti. Film bitti; senin sabrın da.'],
  letters: ['untied the ribbon and the letters went everywhere. You spent the evening putting them back in order, reading every one.', 'kurdeleyi çözdü ve mektuplar her yere saçıldı. Akşamı onları sıraya dizerek, her birini yeniden okuyarak geçirdin.'],
  teaset: ['served tea to six dolls and a dog. One saucer now has a chip shaped like a moon.', 'altı oyuncak bebeğe ve bir köpeğe çay servisi yaptı. Bir tabağın kenarında artık ay şeklinde bir kırık var.'],
  sewing: ['pressed the treadle and sewed a handkerchief to their own sleeve. Both survived. The sleeve is now a pocket.', 'pedala bastı ve bir mendili kendi koluna dikti. İkisi de sağlam. Kol artık bir cep.'],
  radio: ['turned every knob at once. The radio found a station in a language nobody knows and will not let it go.', 'bütün düğmeleri aynı anda çevirdi. Radyo kimsenin bilmediği bir dilde bir istasyon buldu ve bir türlü bırakmıyor.'],
  kilim: ['spilled cherry juice on the kilim. You scrubbed half the night. It is a slightly redder kilim now.', 'kilimin üstüne vişne suyu döktü. Gecenin yarısına kadar ovdun. Artık biraz daha kırmızı bir kilim.'],
  typewriter: ['typed the same key forty times until it jammed. The page just says "kkkkkkkk". You kept the page.', 'aynı tuşa kırk kez bastı ve tuş sıkıştı. Kâğıtta sadece "kkkkkkkk" yazıyor. Kâğıdı sakladın.'],
  tavla: ['lost two checkers down the side of the sofa. They turned up in spring, with three coins and a sock.', 'iki pulu kanepenin kenarından aşağı kaçırdı. Baharda üç bozuk para ve bir çorapla birlikte çıktılar.'],
  toolbox: ['took everything out of the toolbox and sorted it by colour. It took you an afternoon to find the hammer.', 'alet çantasındaki her şeyi çıkarıp renklerine göre dizdi. Çekici bulmak bir öğleden sonranı aldı.'],
};

export const MORE_BORROW: MoreTable<{ ask: (n: string) => Pair; back: (n: string) => Pair; ages: [number, number] }> = {
  camera: {
    ages: [18, 45],
    ask: (n) => [`${n} asks to borrow the old camera for a trip. Film "looks better", apparently.`, `${n} bir gezi için eski fotoğraf makinesini ödünç istiyor. Söylediğine göre film "daha güzel çekiyormuş".`],
    back: (n) => [`The camera came back with a roll of film. Half the photos are of ${n}'s thumb; the other half are wonderful.`, `Fotoğraf makinesi bir rulo filmle geri geldi. Fotoğrafların yarısında ${gen(n)} başparmağı var; öbür yarısı harika.`],
  },
  letters: {
    ages: [25, 70],
    ask: (n) => [`${n} is writing a family history and asks to borrow the bundle of letters.`, `${n} bir aile tarihi yazıyor ve mektup destesini ödünç istiyor.`],
    back: (n) => [`The letters came back in a new box, in order, with a typed list. ${n} admits to crying at number fourteen.`, `Mektuplar yeni bir kutuda, sırasıyla ve daktiloyla yazılmış bir listeyle geri geldi. ${n} on dördüncüde ağladığını itiraf ediyor.`],
  },
  teaset: {
    ages: [22, 60],
    ask: (n) => [`${n} is hosting an engagement visit and asks to borrow the tea set.`, `${n} evinde söz merasimi yapacak ve çay takımını ödünç istiyor.`],
    back: (n) => [`The tea set came back washed and wrapped glass by glass in newspaper, with a box of sweets and good news from ${n}.`, `Çay takımı yıkanmış, bardak bardak gazeteye sarılmış olarak geri geldi; yanında bir kutu tatlı da vardı. ${n} güzel haberi de verdi.`],
  },
  sewing: {
    ages: [20, 60],
    ask: (n) => [`${n} needs to take in a wedding suit and asks to borrow the sewing machine.`, `${n} düğün takımını daraltmak için dikiş makinesini ödünç istiyor.`],
    back: (n) => [`The sewing machine came back oiled, with a spare needle in the drawer and a photo of ${n} in the suit, looking sharp.`, `Dikiş makinesi yağlanmış olarak, çekmecesinde yedek bir iğneyle ve ${gen(n)} o takımla çekilmiş jilet gibi bir fotoğrafıyla geri geldi.`],
  },
  radio: {
    ages: [20, 75],
    ask: (n) => [`${n} wants to borrow the old radio to follow the cup final "the proper way".`, `${n} kupa finalini "usulüne göre" dinlemek için eski radyoyu ödünç istiyor.`],
    back: (n) => [`The radio came back with a new fuse and the whole match, retold minute by minute. ${n}'s team won.`, `Radyo yeni bir sigortayla ve dakika dakika yeniden anlatılan bütün maçla geri geldi. ${gen(n)} takımı kazanmış.`],
  },
  kilim: {
    ages: [22, 70],
    ask: (n) => [`${n} has moved into a flat with bare floors and asks to borrow the kilim for the first winter.`, `${n} yeni taşındığı çıplak evin ilk kışı için kilimi ödünç istiyor.`],
    back: (n) => [`The kilim came back in spring, beaten clean on a balcony. ${n} says the flat only felt like home while it was there.`, `Kilim baharda, bir balkonda tozu güzelce alınmış olarak geri geldi. ${n}, evin ancak kilim oradayken yuva gibi geldiğini söylüyor.`],
  },
  typewriter: {
    ages: [18, 70],
    ask: (n) => [`${n} is writing something "important" and asks to borrow the typewriter. Nothing else will do.`, `${n} "önemli" bir şey yazıyor ve daktiloyu ödünç istiyor. Başkası olmazmış.`],
    back: (n) => [`The typewriter came back with a new ribbon and a short story by ${n} with your family in it, under other names.`, `Daktilo yeni bir şeritle ve ${gen(n)} yazdığı, içinde başka isimlerle sizin ailenin olduğu kısa bir öyküyle geri geldi.`],
  },
  tavla: {
    ages: [25, 85],
    ask: (n) => [`${n} has a tournament at the local café and asks to borrow the backgammon board "for luck".`, `${n} mahalledeki turnuva için tavlayı "uğur getirsin diye" ödünç istiyor.`],
    back: (n) => [`The board came back with a new hinge and a story: ${n} reached the final and lost to a ninety-year-old.`, `Tavla yeni bir menteşeyle ve bir hikâyeyle geri geldi: ${n} finale kadar çıkmış ve doksan yaşında birine yenilmiş.`],
  },
  toolbox: {
    ages: [20, 70],
    ask: (n) => [`${n} has just moved and asks to borrow the old toolbox "for a weekend".`, `${n} yeni taşınmış ve eski alet çantasını "bir hafta sonu için" ödünç istiyor.`],
    back: (n) => [`The toolbox came back two months later, with one extra screwdriver and a photo of a perfectly level shelf at ${n}'s place.`, `Alet çantası iki ay sonra fazladan bir tornavidayla ve ${gen(n)} evinde dümdüz asılmış bir rafın fotoğrafıyla geri geldi.`],
  },
};

export const MORE_RITUAL: MoreTable<Pair> = {
  camera: ['the whole family squeezes into one photo taken with the old camera, on a timer that never waits long enough', 'bütün aile eski fotoğraf makinesiyle tek bir kareye sıkışıyor; zamanlayıcı da hiçbir zaman yeterince beklemiyor'],
  letters: ['someone unties the bundle of letters and reads one aloud at the table, and nobody is allowed to interrupt', 'biri mektup destesini çözüp sofrada bir mektubu yüksek sesle okuyor ve kimsenin sözünü kesmesine izin yok'],
  teaset: ['the old tea set comes out of the cabinet and the eldest pours for everyone, the youngest last', 'eski çay takımı vitrinden çıkıyor ve en büyük herkesin çayını dolduruyor; en küçüğünkini en son'],
  sewing: ['the old sewing machine mends one thing for everyone: a hem, a button, a torn pocket', 'eski dikiş makinesi herkesin bir şeyini onarıyor: bir paça, bir düğme, yırtık bir cep'],
  radio: ['the old radio is switched on and the whole family listens together, arguing about every song', 'eski radyo açılıyor ve bütün aile birlikte dinliyor; her şarkı üstüne ayrı bir tartışma çıkıyor'],
  kilim: ['the kilim is spread in the middle of the room and the whole family eats sitting on it, the old way', 'kilim odanın ortasına seriliyor ve bütün aile eski usul, onun üstüne oturup yemek yiyor'],
  typewriter: ['everyone types one line on the old typewriter, and the page goes into the box with all the others', 'herkes eski daktiloda bir satır yazıyor ve kâğıt öbürleriyle birlikte kutuya giriyor'],
  tavla: ['the old backgammon board comes out, the eldest plays the youngest, and the eldest shows no mercy', 'eski tavla açılıyor; en büyük en küçükle oynuyor ve en büyük kimseye torpil geçmiyor'],
  toolbox: ['the old toolbox comes out and everyone fixes one small thing in the house together, the way it was always done', 'eski alet çantası açılıyor ve herkes birlikte evde küçük bir şeyi tamir ediyor; hep yapıldığı gibi'],
};

export const MORE_NOTE_PLACE: MoreTable<Pair> = {
  camera: ["Folded inside the camera's leather case", 'Fotoğraf makinesinin deri kılıfının içine katlanmış'],
  letters: ['Tucked behind the last letter in the bundle of letters', 'Destedeki son mektubun arkasına sıkıştırılmış'],
  teaset: ["Folded under the lid of the tea set's sugar bowl", 'Şekerliğin kapağının altına katlanmış'],
  sewing: ['In the little drawer of the sewing machine, under the bobbins', 'Dikiş makinesinin küçük çekmecesinde, masuraların altında'],
  radio: ['Slipped inside the back panel of the radio', 'Radyonun arka kapağının içine sıkıştırılmış'],
  kilim: ['Rolled up in the very middle of the kilim', 'Kilimin tam ortasına, rulonun içine sarılmış'],
  typewriter: ['Still rolled into the typewriter, where nobody had looked in years', 'Daktilonun silindirinde, yıllardır kimsenin bakmadığı yerde'],
  tavla: ['Folded under the felt of the backgammon board', 'Tavlanın içindeki çuhanın altına katlanmış'],
  toolbox: ['Under the tray of the old toolbox, among the spare screws', 'Eski alet çantasının çekmecesinin altında, yedek vidaların arasında'],
};

export const MORE_LESSON: MoreTable<{ how: Pair; done: (n: string) => Pair }> = {
  camera: {
    how: ['Wind the film gently, never open the back in daylight, and always say "one more".', 'Filmi usulca sar, arka kapağı asla gün ışığında açma ve her seferinde "bir tane daha" de.'],
    done: (n) => [`You taught ${n} to load the film. ${n}'s first photo was of you, mid-sentence. It is the best one of you in years.`, `${dat(n)} film takmayı öğrettin. ${gen(n)} ilk fotoğrafı tam konuşurken sendin. Yıllardır çekilmiş en güzel fotoğrafın o.`],
  },
  letters: {
    how: ['Untie the ribbon slowly, open each one by the edges, and put it back in the same order.', 'Kurdeleyi yavaş çöz, her birini kenarından aç ve aynı sıraya geri koy.'],
    done: (n) => [`You showed ${n} how to read the letters without hurting them. ${n} read the first one twice, then asked who everyone was.`, `${dat(n)} mektupları incitmeden okumayı gösterdin. ${n} ilkini iki kez okudu, sonra herkesin kim olduğunu sordu.`],
  },
  teaset: {
    how: ['Warm the pot first, never use soap inside it, and the chipped glass always goes to the host.', 'Önce demliği ısıt, içini asla sabunla yıkama; kenarı kırık bardak da hep ev sahibinindir.'],
    done: (n) => [`You taught ${n} to brew and pour properly. ${n} poured from a great height, spilled nothing, and was unbearable all evening.`, `${dat(n)} usulüyle demlemeyi ve doldurmayı öğrettin. ${n} yukarıdan, tek damla dökmeden doldurdu ve bütün akşam çekilmez oldu.`],
  },
  sewing: {
    how: ['Thread from front to back, never pull the cloth, and let the machine set the pace.', 'İpliği önden arkaya tak, kumaşı asla çekiştirme ve hızı makineye bırak.'],
    done: (n) => [`You taught ${n} to thread the sewing machine and sew a straight line. The line was mostly straight. ${n} framed it.`, `${dat(n)} dikiş makinesine iplik takmayı ve düz dikiş dikmeyi öğrettin. Dikiş çoğunlukla düzdü. ${n} onu çerçeveletti.`],
  },
  radio: {
    how: ['Let it warm up, turn the dial slowly, and never hit it, whatever anyone says.', 'Isınmasını bekle, düğmeyi yavaş çevir ve kim ne derse desin asla vurma.'],
    done: (n) => [`You taught ${n} to tune the old radio by ear. ${n} found a station you had never heard of and now listens to nothing else.`, `${dat(n)} eski radyoyu kulaktan ayarlamayı öğrettin. ${n} senin hiç duymadığın bir istasyon buldu ve artık başka bir şey dinlemiyor.`],
  },
  kilim: {
    how: ['Beat it in spring, never wash it hot, and turn it every year so it wears evenly.', 'Baharda tozunu çırp, asla sıcak suyla yıkama ve eşit eskisin diye her yıl çevir.'],
    done: (n) => [`You showed ${n} how to read the kilim's pattern: the eyes, the hands, the running water. ${n} found a symbol you had never noticed.`, `${dat(n)} kilimin desenini okumayı gösterdin: göz, el, akarsu. ${n} senin hiç fark etmediğin bir motif buldu.`],
  },
  typewriter: {
    how: ['Feed the paper straight, hit the keys firmly, and never type faster than the machine can think.', 'Kâğıdı düz tak, tuşlara kararlı bas ve asla makinenin düşünebileceğinden hızlı yazma.'],
    done: (n) => [`You taught ${n} to type on the old machine. ${n}'s first page was a list of demands. You agreed to two.`, `${dat(n)} eski makinede yazmayı öğrettin. ${gen(n)} ilk sayfası bir istekler listesiydi. İkisini kabul ettin.`],
  },
  tavla: {
    how: ['Shake the dice like you mean it, move fast, and never gloat. Well, only a little.', 'Zarı hakkını vererek salla, hızlı oyna ve asla hava atma. Yani, birazcık at.'],
    done: (n) => [`You taught ${n} the old rules and the old trash talk. ${n} beat you in the third game and was insufferable about it.`, `${dat(n)} eski kuralları ve eski laf sokmaları öğrettin. ${n} üçüncü oyunda seni yendi ve çekilmez oldu.`],
  },
  toolbox: {
    how: ['Every tool back in its place, clean it before you put it away, and measure twice.', 'Her alet kendi yerine, kaldırmadan önce temizle ve iki kere ölç.'],
    done: (n) => [`You taught ${n} the name of every tool and the one rule. ${n} measured twice, cut once, and put up a shelf that is still level.`, `${dat(n)} her aletin adını ve o tek kuralı öğrettin. ${n} iki kere ölçtü, bir kere kesti ve hâlâ dümdüz duran bir raf astı.`],
  },
};

export const MORE_COPY: MoreTable<Pair> = {
  camera: ['the same model from a second-hand shop, with a fresh roll of film', 'ikinci el bir dükkândan bulunmuş aynı model bir makine ve yeni bir rulo film'],
  letters: ['a bound copy of every letter, photographed page by page', 'her mektubun sayfa sayfa fotoğraflanıp ciltlenmiş bir kopyası'],
  teaset: ['a new set in the same pattern, found after weeks of searching markets', 'haftalarca pazar dolaşıp bulunmuş aynı desende yeni bir takım'],
  sewing: ['a second-hand machine of the same make, serviced and oiled', 'bakımı yapılmış, yağlanmış, aynı marka ikinci el bir makine'],
  radio: ['a working radio of the same age, bought at a market and polished for a week', 'bir pazardan alınıp bir hafta boyunca parlatılmış, aynı yaşta, çalışan bir radyo'],
  kilim: ['a new kilim from the same region, chosen after a long afternoon of tea and bargaining', 'uzun bir öğleden sonra çay içip pazarlık ederek seçilmiş, aynı yöreden yeni bir kilim'],
  typewriter: ['a typewriter of the same make from a collector, with a fresh ribbon', 'bir koleksiyoncudan alınmış, şeridi yenilenmiş, aynı marka bir daktilo'],
  tavla: ['a new hand-carved board from the same workshop town', 'aynı atölye kasabasından el oyması yeni bir tavla'],
  toolbox: ['a new toolbox filled with the same tools, laid out in the same order', 'aynı aletlerle, aynı sırayla doldurulmuş yeni bir alet çantası'],
};

export const MORE_SIT_TR: MoreTable<string> = {
  camera: 'fotoğraf makinesini kucağına alıp',
  letters: 'mektup destesini kucağına alıp',
  teaset: 'çay takımını önüne dizip',
  sewing: 'dikiş makinesinin başına',
  radio: 'radyonun başına',
  kilim: 'kilimin üstüne',
  typewriter: 'daktilonun başına',
  tavla: 'tavlayı önüne açıp',
  toolbox: 'alet çantasını önüne açıp',
};

export const MORE_REPAIRS: MoreTable<RepairText[]> = {
  camera: [
    {
      title: ["The camera's shutter has stuck.", 'Fotoğraf makinesinin deklanşörü takıldı.'],
      text: ['You press it and nothing happens. The family has gone unrecorded for a month.', 'Basıyorsun, hiçbir şey olmuyor. Ailenin bir aydır tek bir fotoğrafı yok.'],
      pro: ['A repairer in a tiny shop freed it with a tool the size of an eyelash. Click.', 'Minicik bir dükkândaki usta kirpik boyunda bir aletle kurtardı. Klik.'],
      ok: ['You warmed it gently and worked the lever a hundred times. On the hundred-and-first: click.', 'Usulca ısıttın ve kolu yüz kez oynattın. Yüz birincide: klik.'],
      bad: ['It clicks again, but every photo now comes out with a soft, dreamy blur. You call it a style.', 'Yeniden çekiyor ama artık her fotoğraf yumuşak, rüya gibi bulanık çıkıyor. Buna üslup diyorsun.'],
    },
    {
      title: ["The camera's leather case has split.", 'Fotoğraf makinesinin deri kılıfı yarıldı.'],
      text: ['The strap hangs by one stitch, like a loose tooth.', 'Askısı tek bir dikişle sallanıyor; sallanan bir süt dişi gibi.'],
      pro: ['A leatherworker stitched it with waxed thread and refused to change the colour.', 'Bir saraç mumlu iplikle dikti ve rengini değiştirmeyi reddetti.'],
      ok: ['You stitched the strap with dental floss. It is surprisingly strong and smells faintly of mint.', 'Askıyı diş ipiyle diktin. Şaşırtıcı derecede sağlam; hafiften nane kokuyor.'],
      bad: ['You glued the case shut. The camera is now inside it. Possibly forever.', 'Kılıfı yapıştırdın. Makine şu an içinde. Belki de sonsuza dek.'],
    },
    {
      title: ['The camera has a light leak.', 'Fotoğraf makinesi ışık alıyor.'],
      text: ['Every picture has an orange streak, as if the family is always standing near a fire.', 'Her fotoğrafta turuncu bir çizgi var; sanki aile hep bir ateşin başında duruyor.'],
      pro: ['The repairer replaced the old seals and handed you a test photo of his own cat. Perfect.', 'Usta eski contaları değiştirdi ve deneme olarak kendi kedisinin fotoğrafını verdi. Kusursuz.'],
      ok: ['You found the gap and sealed it with black tape. The streaks are gone. The camera looks like a pirate.', 'Boşluğu bulup siyah bantla kapattın. Çizgiler gitti. Makine korsana benzedi.'],
      bad: ['You taped the wrong gap. The streak moved to the other side. The family has accepted it.', 'Yanlış boşluğu bantladın. Çizgi öbür tarafa geçti. Aile bunu kabullendi.'],
    },
  ],
  letters: [
    {
      title: ['The ribbon round the bundle of letters has frayed through.', 'Mektup destesini bağlayan kurdele aşınıp koptu.'],
      text: ['The letters lie loose in the drawer now, slowly losing their order.', 'Mektuplar artık çekmecede dağınık; yavaş yavaş sıralarını kaybediyorlar.'],
      pro: ['A paper conservator gave them acid-free sleeves and a new box. The old ribbon lies on top, retired.', 'Bir kâğıt restoratörü onları asitsiz kılıflara ve yeni bir kutuya koydu. Eski kurdele emekli olmuş gibi en üstte duruyor.'],
      ok: ['You found a ribbon of almost the same colour and tied the bundle with a proper knot. It looks like itself again.', 'Neredeyse aynı renkte bir kurdele bulup desteyi düzgün bir düğümle bağladın. Yeniden kendine benziyor.'],
      bad: ['You tied it with kitchen string. It holds, and every letter now has a faint dent across its middle.', 'Mutfak ipiyle bağladın. Tutuyor ama artık her mektubun ortasında hafif bir iz var.'],
    },
    {
      title: ['The ink in the bundle of letters is fading.', 'En eski mektuplardaki mürekkep soluyor.'],
      text: ['One sentence on the first page is now only half a sentence.', 'İlk sayfadaki bir cümle artık yarım bir cümle.'],
      pro: ['A conservator photographed every page under a special light. The lost half-sentence came back.', 'Bir restoratör her sayfayı özel bir ışık altında fotoğrafladı. Kaybolan yarım cümle geri geldi.'],
      ok: ['You copied every letter out by hand into a notebook, slowly. You know them by heart now.', 'Her mektubu tek tek, ağır ağır bir deftere elle geçirdin. Artık hepsini ezbere biliyorsun.'],
      bad: ['You traced over the faded words. One "always" became "almost". The family is still arguing about it.', 'Silik kelimelerin üstünden geçtin. Bir "her zaman" kelimesi "neredeyse" oldu. Aile hâlâ bunu tartışıyor.'],
    },
    {
      title: ['A letter in the bundle of letters has torn along its fold.', 'Destedeki bir mektup katlama yerinden yırtıldı.'],
      text: ['It has been opened and closed too many times. Fair enough.', 'Çok fazla açılıp kapandı. Haksız da sayılmaz.'],
      pro: ['A conservator mended the fold with tissue so thin you can read through it.', 'Bir restoratör katlama yerini içinden okunabilecek kadar ince bir kâğıtla onardı.'],
      ok: ['You mended it from behind with archival tape, holding your breath. It holds, and it reads.', 'Arkasından arşiv bandıyla, nefesini tutarak onardın. Tutuyor ve okunuyor.'],
      bad: ['You used ordinary sticky tape. It holds, and it has gone a little yellow, like a bruise.', 'Sıradan seloteyp kullandın. Tutuyor ama biraz sarardı; bir çürük gibi.'],
    },
  ],
  teaset: [
    {
      title: ["The tea set's teapot lid has cracked.", 'Çay takımının demlik kapağı çatladı.'],
      text: ['The tea still brews. It just sounds nervous.', 'Çay yine demleniyor. Sadece biraz gergin bir sesle.'],
      pro: ['A porcelain restorer mended it with a thin line of gold. It is more beautiful broken.', 'Bir porselen ustası kapağı ince bir altın çizgiyle onardı. Kırık hâli daha güzel.'],
      ok: ['You glued it with food-safe glue and a steady hand. The crack is a fine grey hair now.', 'Gıdaya uygun bir yapıştırıcı ve titremeyen bir elle yapıştırdın. Çatlak artık ince, gri bir saç teli gibi.'],
      bad: ['You glued it slightly off. The lid sits at an angle, like a hat worn with confidence.', 'Biraz kaydırarak yapıştırdın. Kapak artık yamuk duruyor; özgüvenle giyilmiş bir şapka gibi.'],
    },
    {
      title: ['A saucer from the tea set is missing.', 'Çay takımından bir tabak eksik.'],
      text: ['There are six glasses and five saucers. Somebody always gets a napkin.', 'Altı bardak var, beş tabak. Birine hep peçete düşüyor.'],
      pro: ['An antiques dealer found a matching saucer in a crate of odd pieces. It joined the set like a lost cousin.', 'Bir antikacı tek kalmış parçalarla dolu bir sandıkta aynı desenli bir tabak buldu. Takıma kayıp bir kuzen gibi katıldı.'],
      ok: ['You found the saucer at the back of the cabinet, behind the good plates. The set is whole again.', 'Tabağı vitrinin en arkasında, güzel tabakların ardında buldun. Takım yeniden tamam.'],
      bad: ['You bought a saucer that is almost the same. Everyone fights over who does not have to use it.', 'Neredeyse aynı bir tabak aldın. Herkes o tabak kendisine düşmesin diye kavga ediyor.'],
    },
    {
      title: ['The gold rim on the tea set is wearing off.', 'Çay takımının yaldızlı kenarı siliniyor.'],
      text: ['Decades of lips have rubbed it down to a shadow.', 'Onca yılın dudakları onu bir gölgeye çevirmiş.'],
      pro: ['A restorer re-gilded every rim by hand. The set looks as if it is going to a wedding.', 'Bir usta her kenarı elle yeniden yaldızladı. Takım düğüne gidecekmiş gibi duruyor.'],
      ok: ['You stopped putting it in the dishwasher. The gold that is left will stay.', 'Bulaşık makinesine koymayı bıraktın. Kalan yaldız artık kalacak.'],
      bad: ['You painted the rims with gold paint from a craft shop. It came off in the first round of tea. Everyone had glittery lips.', 'Kenarları hobi dükkânından aldığın yaldız boyayla boyadın. İlk çayda çıktı. Herkesin dudakları simli oldu.'],
    },
  ],
  sewing: [
    {
      title: ['The sewing machine has started eating thread.', 'Dikiş makinesi iplik yemeye başladı.'],
      text: ["Every seam ends in a bird's nest of tangles underneath.", 'Her dikiş, altta kuş yuvasına dönmüş bir yumakla bitiyor.'],
      pro: ['A repairman cleaned out decades of lint and found a button from another century. It sews like silk now.', 'Bir tamirci onlarca yıllık tüyü temizledi ve başka bir yüzyıldan kalma bir düğme buldu. Artık ipek gibi dikiyor.'],
      ok: ['You took the bobbin case apart, cleaned it with a toothbrush and put it all back. No parts left over. A miracle.', 'Masura yuvasını söküp bir diş fırçasıyla temizledin ve her şeyi geri taktın. Artan parça yok. Mucize.'],
      bad: ['You put it back together with one small spring left over. It sews, but only forwards and only when it feels like it.', 'Geri takarken küçük bir yay arttı. Dikiyor ama sadece ileri ve sadece canı isterse.'],
    },
    {
      title: ["The sewing machine's treadle belt has snapped.", 'Dikiş makinesinin pedal kayışı koptu.'],
      text: ['The wheel spins and the needle sulks.', 'Volan dönüyor, iğne küsmüş.'],
      pro: ['A repairman fitted a new leather belt and showed you the old trick for keeping it tight.', 'Bir tamirci yeni bir deri kayış taktı ve gergin tutmanın eski püf noktasını gösterdi.'],
      ok: ['You made a new belt from an old leather strap and a paper clip. It runs perfectly. Tell nobody about the paper clip.', 'Eski bir deri kemerle bir ataştan yeni bir kayış yaptın. Kusursuz çalışıyor. Ataşı kimseye söyleme.'],
      bad: ['Your new belt is a bit too long. The machine runs at half speed now, like a sleepy grandmother.', 'Yeni kayışın biraz uzun oldu. Makine artık yarım hızda, uykulu bir nine gibi çalışıyor.'],
    },
    {
      title: ['Rust has crept into the sewing machine.', 'Dikiş makinesine pas yürümüş.'],
      text: ['The needle bar squeals and the gold lettering is flaking.', 'İğne mili ciyaklıyor, yaldızlı yazılar dökülüyor.'],
      pro: ['A restorer took it apart to the last screw and put it back gleaming. The lettering is sharp again.', 'Bir usta son vidasına kadar söküp pırıl pırıl geri topladı. Yazılar yine net.'],
      ok: ['A week of oil and patience. It glides again and smells like a garage.', 'Bir hafta yağ ve sabır. Yine kayar gibi dikiyor; bir de garaj kokuyor.'],
      bad: ['You scrubbed off the rust and half the gold lettering with it. The maker\'s name now reads like a sneeze.', 'Pası ovarken yaldızlı yazının yarısı da gitti. Marka adı artık bir hapşırık gibi okunuyor.'],
    },
  ],
  radio: [
    {
      title: ['The old radio has gone silent.', 'Eski radyo sustu.'],
      text: ['The light comes on; the sound does not. The kitchen feels empty.', 'Işığı yanıyor; sesi gelmiyor. Mutfak bomboş gibi.'],
      pro: ['A repairman found a valve from another age in his back room. The radio sang again.', 'Bir tamirci arka odasında başka bir çağdan kalma bir lamba buldu. Radyo yeniden şarkı söyledi.'],
      ok: ['With a torch and a manual from the library you found a loose wire. It plays. You played it very loud.', 'Bir el feneri ve kütüphaneden bulduğun bir kılavuzla gevşek bir kablo buldun. Çalıyor. Çok yüksek sesle çaldın.'],
      bad: ['It plays again, but only one station, and only while the kettle is on.', 'Yine çalıyor ama sadece tek bir istasyon ve sadece çaydanlık ocaktayken.'],
    },
    {
      title: ['The radio has started to crackle.', 'Radyo cızırdamaya başladı.'],
      text: ['Every song sounds as if it is being fried.', 'Her şarkı tavada kızarıyormuş gibi geliyor.'],
      pro: ['The repairman cleaned the dial and changed one tired part. The crackle is gone; the warmth stayed.', 'Tamirci ayar düğmesini temizledi ve yorgun bir parçayı değiştirdi. Cızırtı gitti; o sıcak ses kaldı.'],
      ok: ['You cleaned the contacts with a cotton bud and alcohol. Clear as a bell.', 'Kontakları kulak çubuğu ve alkolle temizledin. Tertemiz çalıyor.'],
      bad: ['The crackle is gone. The volume knob came off in your hand, so you turn it with pliers now.', 'Cızırtı gitti. Ses düğmesi elinde kaldı; artık pense ile çeviriyorsun.'],
    },
    {
      title: ["The radio's wooden case has cracked.", 'Radyonun ahşap kasası çatladı.'],
      text: ['A split runs down the side like a river on a map.', 'Yanından haritadaki bir nehir gibi bir yarık iniyor.'],
      pro: ['A furniture restorer filled the crack and matched the varnish so well that you cannot find it.', 'Bir mobilya ustası çatlağı doldurdu ve verniği öyle uydurdu ki yerini bulamıyorsun.'],
      ok: ['You glued and clamped it overnight. In the morning it was whole and smelled of glue and history.', 'Bütün gece yapıştırıp mengenede tuttun. Sabah bütündü; tutkal ve tarih kokuyordu.'],
      bad: ['You filled the crack with filler of a slightly wrong colour. The radio now has a racing stripe.', 'Çatlağı biraz farklı renkte bir dolguyla doldurdun. Radyonun artık yarış arabası gibi bir şeridi var.'],
    },
  ],
  kilim: [
    {
      title: ['The edge of the kilim is unravelling.', 'Kilimin kenarı sökülüyor.'],
      text: ['One loose thread, pulled by one curious foot, has become a long one.', 'Meraklı bir ayağın çektiği tek bir gevşek iplik upuzun bir sökük olmuş.'],
      pro: ['A weaver rewove the edge with wool dyed to match. You cannot find where the old ends and the new begins.', 'Bir dokumacı kenarı aynı renge boyanmış yünle yeniden dokudu. Eskinin nerede bitip yeninin nerede başladığını bulamıyorsun.'],
      ok: ['You bound the edge with a thick needle over three evenings. It holds, and it is partly yours now.', 'Üç akşam boyunca kenarı kalın bir iğneyle sardın. Tutuyor; artık biraz da senin.'],
      bad: ['You trimmed the loose threads. The kilim is now a little shorter and a lot less symmetrical.', 'Gevşek iplikleri kestin. Kilim artık biraz daha kısa ve epey daha az simetrik.'],
    },
    {
      title: ['Moths have eaten a patch of the kilim.', 'Kilimin bir yerine güve düşmüş.'],
      text: ['A bald spot has appeared right in the middle of the pattern.', 'Desenin tam ortasında kel bir yer belirdi.'],
      pro: ['A restorer rewove the bald spot knot by knot. It took two months and a great deal of tea.', 'Bir usta kel yeri ilmek ilmek yeniden dokudu. İki ay ve bolca çay sürdü.'],
      ok: ['You filled the gap with wool from an old jumper. Up close it shows. From the sofa it is perfect.', 'Boşluğu eski bir kazaktan çıkan yünle doldurdun. Yakından belli oluyor. Kanepeden bakınca kusursuz.'],
      bad: ['You patched it with a piece of felt. The kilim now has an island.', 'Bir parça keçeyle yamadın. Kilimin artık bir adası var.'],
    },
    {
      title: ['The colours of the kilim have run in the wash.', 'Kilim yıkanınca boyası aktı.'],
      text: ['The red has wandered into the white. It looks embarrassed.', 'Kırmızı beyazın içine yürümüş. Utanmış gibi duruyor.'],
      pro: ['A specialist washed it properly in cold water, again and again, until the red went home.', 'Bir uzman onu usulüne göre, soğuk suyla defalarca yıkadı; kırmızı sonunda yerine döndü.'],
      ok: ['You soaked it in cold salted water, the way your elders swore by. The colours mostly came back.', 'Büyüklerinin yemin ettiği gibi soğuk tuzlu suda beklettin. Renkler büyük ölçüde geri geldi.'],
      bad: ['You tried bleach on one corner. That corner is now the ghost of a kilim.', 'Bir köşesinde çamaşır suyu denedin. O köşe artık bir kilimin hayaleti.'],
    },
  ],
  typewriter: [
    {
      title: ['The typewriter ribbon has dried out.', 'Daktilonun şeridi kurudu.'],
      text: ['Every page now comes out as a whisper.', 'Her sayfa artık fısıltı gibi çıkıyor.'],
      pro: ['A typewriter repairer found a ribbon that fits. The first line came out black and bold, like a headline.', 'Bir daktilo tamircisi uyan bir şerit buldu. İlk satır manşet gibi kapkara ve kalın çıktı.'],
      ok: ['You re-inked the old ribbon with a stamp pad. It types again, a little blotchy and very loved.', 'Eski şeridi bir ıstampayla yeniden mürekkepledin. Yine yazıyor; biraz lekeli, çok sevilerek.'],
      bad: ['You over-inked it. Every page is a beautiful mess, and your fingers stayed purple for a week.', 'Fazla mürekkep sürdün. Her sayfa artık güzel bir karmaşa; parmakların da bir hafta mor kaldı.'],
    },
    {
      title: ['Two typewriter keys have jammed together.', 'Daktilonun iki tuşu birbirine kenetlendi.'],
      text: ['They lock in mid-air like two people trying to go through one door.', 'Havada kilitleniyorlar; aynı kapıdan geçmeye çalışan iki kişi gibi.'],
      pro: ['The repairer straightened the arms and oiled them. They now take turns politely.', 'Tamirci kolları düzeltip yağladı. Artık kibarca sıra bekliyorlar.'],
      ok: ['You bent them apart with tweezers, very gently. Every key types alone again.', 'Cımbızla, çok nazikçe ayırdın. Her tuş yine tek başına yazıyor.'],
      bad: ['You freed them. One now types slightly above the line, as if trying to escape the page.', 'Kurtardın. Biri artık satırın biraz üstüne basıyor; sayfadan kaçmaya çalışır gibi.'],
    },
    {
      title: ["The typewriter's little bell has gone quiet.", 'Daktilonun küçük zili sustu.'],
      text: ['Nobody knows where the line ends any more. Words keep falling off the edge of the page.', 'Artık kimse satırın nerede bittiğini bilmiyor. Kelimeler sayfanın kenarından düşüp duruyor.'],
      pro: ['The repairer replaced a spring the size of an eyelash. Ding. Everyone cheered.', 'Tamirci kirpik boyunda bir yayı değiştirdi. Ding. Herkes alkışladı.'],
      ok: ['You bent the tiny hammer back into place with a paper clip. Ding. You did it again just to hear it.', 'Minik çekici bir ataşla yerine büktün. Ding. Sırf duymak için bir daha yaptın.'],
      bad: ['It dings again, but at random, in the middle of words. It has become a critic.', 'Yine çalıyor ama rastgele, kelimelerin ortasında. Bir eleştirmene dönüştü.'],
    },
  ],
  tavla: [
    {
      title: ["The backgammon board's hinge has snapped.", 'Tavlanın menteşesi kırıldı.'],
      text: ['It opens like a book with a broken spine.', 'Sırtı kırılmış bir kitap gibi açılıyor.'],
      pro: ['A woodworker fitted brass hinges from the same era. It closes with a click that sounds expensive.', 'Bir marangoz aynı dönemden pirinç menteşeler taktı. Kapanırken pahalı bir tık sesi çıkarıyor.'],
      ok: ['You fitted a new hinge with a tiny screwdriver and a lot of muttering. It closes perfectly.', 'Minicik bir tornavida ve bolca söylenerek yeni bir menteşe taktın. Kusursuz kapanıyor.'],
      bad: ['You fitted the hinge upside down. The board now opens the wrong way, which somehow suits the family.', 'Menteşeyi ters taktın. Tavla artık ters açılıyor; bu da nedense aileye çok yakışıyor.'],
    },
    {
      title: ['Two checkers are missing from the backgammon board.', 'Tavlanın iki pulu kayıp.'],
      text: ['Someone has been playing with a bottle cap and a button. It is not the same.', 'Biri bir şişe kapağı ve bir düğmeyle oynuyor. Aynı değil.'],
      pro: ['A carver made two new checkers from the same wood. You cannot tell which are new; the dice can.', 'Bir oymacı aynı ağaçtan iki yeni pul yaptı. Hangilerinin yeni olduğunu sen anlayamıyorsun; zarlar anlıyor.'],
      ok: ['You found both under the heater, with a die from another set. The board is whole again, with a spare.', 'İkisini de kaloriferin altında, başka bir takımdan kalma bir zarla birlikte buldun. Tavla yeniden tamam; bir de yedeği var.'],
      bad: ['You made two checkers from bottle corks. They work. Everyone fights over who has to play with them.', 'Şişe mantarlarından iki pul yaptın. İş görüyor. Herkes onlarla oynamamak için kavga ediyor.'],
    },
    {
      title: ['The inlay on the backgammon board is lifting.', 'Tavlanın sedef kakması kalkıyor.'],
      text: ['Little flakes of mother-of-pearl keep turning up on the carpet.', 'Halıda sürekli minik sedef parçaları çıkıyor.'],
      pro: ["A craftsman reset every piece and found a maker's mark underneath that nobody knew was there.", 'Bir usta her parçayı yeniden yerine oturttu ve altında kimsenin bilmediği bir usta damgası buldu.'],
      ok: ['You glued every flake back with a toothpick, one by one, over a whole weekend.', 'Bütün bir hafta sonu her parçayı bir kürdanla tek tek yapıştırdın.'],
      bad: ['You glued them back. One sits upside down and shines a slightly different colour. It is the lucky one now.', 'Hepsini yapıştırdın. Biri ters oturdu ve biraz farklı renkte parlıyor. Artık uğurlu parça o.'],
    },
  ],
  toolbox: [
    {
      title: ["The toolbox's catch has broken.", 'Alet çantasının kilidi kırıldı.'],
      text: ['Every time you lift it, the tools escape across the floor.', 'Her kaldırdığında aletler yere dağılıyor.'],
      pro: ['A locksmith fitted a catch from the same years. It snaps shut like a promise.', 'Bir çilingir aynı yıllardan bir kilit taktı. Söz verir gibi tık diye kapanıyor.'],
      ok: ['You fixed the catch with the tools inside it, which felt like the box fixing itself.', 'Kilidi içindeki aletlerle tamir ettin; sanki çanta kendi kendini tamir etti.'],
      bad: ['You tied it shut with wire. It holds, and opening it is now a small puzzle.', 'Telle bağlayıp kapattın. Tutuyor; açmak da artık küçük bir bulmaca.'],
    },
    {
      title: ['Rust has got into the old toolbox.', 'Eski alet çantasını pas sardı.'],
      text: ['The pliers squeak and the saw has gone the colour of strong tea.', 'Pense gıcırdıyor, testere demli çay rengine dönmüş.'],
      pro: ['A metalworker cleaned every tool and oiled them back to life. The saw sings again.', 'Bir usta her aleti temizleyip yağlayarak hayata döndürdü. Testere yine şarkı söylüyor.'],
      ok: ['You spent a weekend with steel wool and oil. Every tool works, and your hands smelled of garage for days.', 'Bir hafta sonunu tel yünü ve yağla geçirdin. Her alet çalışıyor; ellerin de günlerce garaj koktu.'],
      bad: ['You scrubbed so hard the old initials came off the hammer handle. You scratched them back in, a bit crooked.', 'O kadar sert ovdun ki çekiç sapındaki eski baş harfler de silindi. Biraz yamuk da olsa yeniden kazıdın.'],
    },
    {
      title: ['The handle of the hammer in the toolbox has split.', 'Alet çantasındaki çekicin sapı yarıldı.'],
      text: ['The head wobbles. A wobbling hammer is a dangerous philosophy.', 'Başı sallanıyor. Sallanan bir çekiç tehlikeli bir felsefedir.'],
      pro: ['A woodworker turned a new handle from ash and put the old one, initials and all, back in the box.', 'Bir marangoz dişbudaktan yeni bir sap yaptı; baş harfli eski sapı da çantaya geri koydu.'],
      ok: ['You carved a new handle yourself and wedged the head on tight. It is the best thing you have ever made.', 'Yeni sapı kendin yonttun ve başını sıkıca kamaladın. Bugüne kadar yaptığın en güzel şey.'],
      bad: ['Your new handle is a little too long. The hammer now lands slightly after you expect it to.', 'Yeni sap biraz uzun oldu. Çekiç artık beklediğinden azıcık sonra iniyor.'],
    },
  ],
};

export const MORE_SCARES: MoreTable<ScareText[]> = {
  camera: [
    {
      what: ['You left the camera on a park bench.', 'Fotoğraf makinesini parkta bir bankın üstünde unuttun.'],
      search: ['You ran back across the whole park. A pigeon was sitting on it, guarding it badly. It was fine.', 'Bütün parkı koşarak geri döndün. Üstünde bir güvercin oturuyordu; kötü bir bekçilik yapıyordu. Makine sağlamdı.'],
      reward: ['A pensioner brought it back with a note: "I took one picture of the lake. Hope you don\'t mind."', 'Bir emekli geri getirdi, yanında bir notla: "Göle bir kare çektim, umarım kızmazsınız."'],
    },
    {
      what: ['The camera slipped off your shoulder on a ferry and skidded towards the rail.', 'Fotoğraf makinesi vapurda omzundan kaydı ve küpeşteye doğru savruldu.'],
      search: ['You dived across the deck and caught the strap one hand away from the sea. Three tourists applauded.', 'Güverteye atılıp askıyı denize bir karış kala yakaladın. Üç turist alkışladı.'],
      reward: ['A deckhand stopped it with his boot and would take nothing but a cup of tea.', 'Bir tayfa onu postalıyla durdurdu ve bir bardak çaydan başka bir şey kabul etmedi.'],
    },
    {
      what: ['Someone put the camera in a box for the school jumble sale.', 'Biri fotoğraf makinesini okulun kermes kolisine koymuş.'],
      search: ['You reached the school just as the doors opened and bought it back from a ten-year-old for pocket money.', 'Okula tam kapılar açılırken yetiştin ve onu on yaşında bir çocuktan harçlık parasına geri aldın.'],
      reward: ['A teacher recognised the name on the case and kept it under her desk until you came.', 'Bir öğretmen kılıfın üstündeki ismi tanıdı ve sen gelene kadar masasının altında sakladı.'],
    },
    {
      what: ['The camera fell out of the car at a petrol station.', 'Fotoğraf makinesi bir benzin istasyonunda arabadan düştü.'],
      search: ['You drove back forty kilometres. It was by the air pump, in a puddle, looking offended. It survived.', 'Kırk kilometre geri sürdün. Hava pompasının yanında, bir su birikintisinde, kırılmış bir edayla yatıyordu. Kurtuldu.'],
      reward: ['The attendant had put it behind the till with a sign: "Somebody\'s memories."', 'Pompacı onu kasanın arkasına kaldırıp bir not yazmış: "Birinin anıları."'],
    },
  ],
  letters: [
    {
      what: ['The bundle of letters went out in a box of old papers for recycling.', 'Mektup destesi eski kâğıtlarla dolu bir koliyle geri dönüşüme gitti.'],
      search: ['You climbed into the paper bin in your good clothes. They were near the top, still tied.', 'Güzel kıyafetlerinle kâğıt kumbarasına tırmandın. Deste üst taraftaydı; hâlâ bağlıydı.'],
      reward: ['A paper collector saw the ribbon and the old stamps and knocked on doors until he found you.', 'Bir kâğıt toplayıcı kurdeleyi ve eski pulları görünce seni bulana kadar kapı kapı dolaştı.'],
    },
    {
      what: ['A burst pipe has soaked the drawer with the bundle of letters in it.', 'Patlayan bir boru mektupların durduğu çekmeceyi ıslattı.'],
      search: ['You laid every letter out on towels across the floor and dried them with a fan, all night. Not one word was lost.', 'Her mektubu yere serilmiş havluların üstüne tek tek dizip bütün gece vantilatörle kuruttun. Tek bir kelime kaybolmadı.'],
      reward: ['A conservator froze and dried them slowly, the proper way. They came back wavy and whole.', 'Bir restoratör onları usulüne göre dondurup yavaş yavaş kuruttu. Dalgalı ama eksiksiz geri geldiler.'],
    },
    {
      what: ['You took the bundle of letters to read on a train and left it on the seat.', 'Mektupları trende okumak için yanına aldın ve koltukta unuttun.'],
      search: ['You rang the station, then went there. They were in lost property, between an umbrella and a single shoe.', 'Garı aradın, sonra kendin gittin. Kayıp eşya bürosunda bir şemsiyeyle tek bir ayakkabının arasındaydılar.'],
      reward: ['A student found them, read only the first line, and posted them back with an apology for reading even that.', 'Bir öğrenci bulmuş, sadece ilk satırı okumuş ve onu bile okuduğu için özür dileyerek postayla geri yollamış.'],
    },
    {
      what: ['A guest borrowed the bundle of letters to read in bed and took it home by mistake.', 'Bir misafir mektup destesini yatakta okumak için almış ve yanlışlıkla evine götürmüş.'],
      search: ['You drove to the other side of the city that night. The guest was still reading, in tears.', 'O gece şehrin öbür ucuna gittin. Misafir hâlâ okuyordu; gözyaşları içinde.'],
      reward: ["They came back by post with a long letter of the guest's own, which is part of the bundle now.", 'Postayla geri geldiler; yanında misafirin uzun bir mektubuyla. O mektup da artık destenin bir parçası.'],
    },
  ],
  teaset: [
    {
      what: ['On moving day, the box with the tea set went into the wrong van.', 'Taşınma günü çay takımının kolisi yanlış kamyona yüklendi.'],
      search: ["You chased the van across town and found the box under someone else's mattress. Not one glass broken.", 'Kamyonu şehrin öbür ucuna kadar kovaladın ve koliyi başkasının yatağının altında buldun. Tek bir bardak kırılmamıştı.'],
      reward: ['The other family rang the next day: "We have your tea set. We made one pot. Sorry."', 'Öbür aile ertesi gün aradı: "Çay takımınız bizde. Bir demlik çay yaptık, kusura bakmayın."'],
    },
    {
      what: ['A child pulled the tablecloth and the tea set went flying.', 'Bir çocuk masa örtüsünü çekti ve çay takımı havalandı.'],
      search: ['You caught the teapot in mid-air. Two glasses did not make it. The teapot owes you its life.', 'Demliği havada yakaladın. İki bardak kurtulamadı. Demlik hayatını sana borçlu.'],
      reward: ['A restorer rebuilt a broken glass from forty pieces. You can see the lines if you look. You look often.', 'Bir usta kırılan bir bardağı kırk parçadan yeniden birleştirdi. Dikkatli bakınca çizgiler görünüyor. Sen sık sık bakıyorsun.'],
    },
    {
      what: ["The tea set was lent for a neighbour's condolence visitors and never came back.", 'Çay takımı bir komşunun taziye misafirleri için ödünç verildi ve geri gelmedi.'],
      search: ['You went round gently after forty days. The neighbour had kept it out of love, not forgetting. You both cried over a pot of tea.', 'Kırk gün geçince usulca kapısını çaldın. Komşu onu unuttuğu için değil, sevdiği için tutmuş. Bir demlik çayın başında ikiniz de ağladınız.'],
      reward: ['Another neighbour knew where it was and quietly brought it back with a tray of sweets.', 'Başka bir komşu nerede olduğunu biliyordu; sessizce bir tepsi tatlıyla geri getirdi.'],
    },
    {
      what: ['In the night, the shelf under the tea set gave way.', 'Gece çay takımının durduğu raf çöktü.'],
      search: ['You ran in barefoot. The shelf was on the floor; the tea set lay on the carpet, every piece, as if someone had laid it there.', 'Yalınayak koştun. Raf yerdeydi; çay takımı halının üstündeydi, her parçası, sanki biri dizmiş gibi.'],
      reward: ['A carpenter fixed the shelf so solidly that it will outlive the house. The set lost only one lid knob.', 'Bir marangoz rafı öyle sağlam yaptı ki evden uzun yaşayacak. Takım sadece bir kapak tepesini kaybetti.'],
    },
  ],
  sewing: [
    {
      what: ['The sewing machine was put out on the pavement for the scrap collector by mistake.', 'Dikiş makinesi yanlışlıkla hurdacıya diye kaldırıma bırakıldı.'],
      search: ['You ran after the scrap cart down two streets. The collector handed it back with great respect.', 'İki sokak boyunca hurdacının arabasının peşinden koştun. Hurdacı onu büyük bir saygıyla geri verdi.'],
      reward: ['The scrap collector brought it back himself: "My mother had one like this. I couldn\'t."', 'Hurdacı kendisi geri getirdi: "Annemin de bunun gibisi vardı. Yapamadım."'],
    },
    {
      what: ['The sewing machine slid off the table and hit the floor.', 'Dikiş makinesi masadan kayıp yere çakıldı.'],
      search: ['You turned it over with shaking hands. It sewed a perfect line on the first try, as if offended you had doubted it.', 'Titreyen ellerle çevirdin. İlk denemede kusursuz bir dikiş attı; ondan şüphe ettiğin için alınmış gibiydi.'],
      reward: ['A repairman straightened the wheel and said they built these "for wars". It sews better than before.', 'Bir tamirci volanı düzeltti ve bunların "savaş için" yapıldığını söyledi. Eskisinden iyi dikiyor.'],
    },
    {
      what: ['A tailor who borrowed the sewing machine has closed shop and vanished.', 'Dikiş makinesini ödünç alan terzi dükkânı kapatıp ortadan kayboldu.'],
      search: ["You asked every tailor in the district. The fourth knew him; the machine was in his sister's flat, under a tablecloth.", 'Semtteki bütün terzileri tek tek sordun. Dördüncüsü tanıyordu; makine kız kardeşinin evinde, bir masa örtüsünün altındaydı.'],
      reward: ["The tailor's apprentice brought it back with a full set of new needles and a long apology.", 'Terzinin çırağı onu bir takım yeni iğne ve uzun bir özürle geri getirdi.'],
    },
    {
      what: ['The cellar flooded with the sewing machine in it.', 'Bodrumu su bastı; dikiş makinesi de içindeydi.'],
      search: ['You carried it up the stairs alone, dripping, and dried every part on the heater. It sews again, with a faint gurgle.', 'Su damlarken tek başına merdivenlerden yukarı taşıdın ve her parçasını kaloriferin üstünde kuruttun. Yine dikiyor; hafif bir guruldamayla.'],
      reward: ['A neighbour who restores old machines kept it for a month. It came back better than it went down.', 'Eski makineleri onaran bir komşu bir ay boyunca ona baktı. Bodruma indiğinden daha iyi geri geldi.'],
    },
  ],
  radio: [
    {
      what: ['The radio fell off the kitchen shelf.', 'Radyo mutfak rafından düştü.'],
      search: ['You caught it by the cord a hand above the floor. It switched itself on, as if to say thank you.', 'Yere bir karış kala kablosundan yakaladın. Kendi kendine açıldı; teşekkür eder gibi.'],
      reward: ['An old repairman rebuilt the cracked dial and would take no payment beyond "one song on it".', 'Yaşlı bir tamirci çatlayan kadranı yeniden yaptı ve "üstünde bir şarkı" dışında para almadı.'],
    },
    {
      what: ['A burglar took the radio, thinking it was valuable. It is, but not like that.', 'Bir hırsız değerli sanıp radyoyu götürdü. Değerli, ama o anlamda değil.'],
      search: ['You found it in the second junk shop you tried, labelled "decor". You paid gladly and did not haggle.', 'Baktığın ikinci eskicide "dekor" diye etiketlenmiş buldun. Seve seve ödedin ve pazarlık etmedin.'],
      reward: ['The police found it in a van with forty tablets and one radio. The officer said yours was the only thing that worked.', 'Polis onu kırk tablet ve tek bir radyoyla dolu bir minibüste buldu. Memur çalışan tek şeyin seninki olduğunu söyledi.'],
    },
    {
      what: ['The radio went to the flea market in a box of things to sell.', 'Radyo satılacak eşyalarla dolu bir koliyle bit pazarına gitti.'],
      search: ['You ran there and found a collector already turning the dial. You talked him out of it with a long story.', 'Koşa koşa gittin ve bir koleksiyoncuyu çoktan düğmesini çevirirken buldun. Uzun bir hikâyeyle vazgeçirdin.'],
      reward: ['The buyer brought it back after hearing it belonged to a family. He had sat and listened to it all evening first.', 'Alan kişi bir aileye ait olduğunu duyunca geri getirdi. Önce bütün akşam oturup dinlemiş.'],
    },
    {
      what: ['Rain came in through the window and soaked the radio.', 'Pencereden giren yağmur radyoyu sırılsıklam etti.'],
      search: ['You dried it for a week in a bag of rice. On the eighth day it coughed and read the news.', 'Bir hafta bir torba pirincin içinde kuruttun. Sekizinci gün öksürdü ve haberleri okudu.'],
      reward: ['A repairman dried it slowly in his workshop and said it had "been swimming before". It plays.', 'Bir tamirci atölyesinde yavaş yavaş kuruttu ve "Daha önce de yüzmüş bu" dedi. Çalıyor.'],
    },
  ],
  kilim: [
    {
      what: ['The kilim was hung over the balcony to air, and now it is gone.', 'Havalansın diye balkona asılan kilim ortadan kaybolmuş.'],
      search: ["You found it two floors down on a neighbour's washing line, being admired.", 'İki kat aşağıda, bir komşunun çamaşır ipinde, hayranlıkla seyredilirken buldun.'],
      reward: ['The neighbour from downstairs brought it up folded, with a plate of pastries and many questions about the pattern.', 'Alt kattaki komşu katlayıp getirdi; yanında bir tabak hamur işi ve desen hakkında bir sürü soruyla.'],
    },
    {
      what: ['The kilim went to the cleaner, and the cleaner has lost the ticket.', 'Kilim temizlemeciye gitti ve temizlemeci fişi kaybetti.'],
      search: ['You went through the back room with the owner, roll by roll. Yours was the seventeenth, and the only one with a story.', 'Dükkân sahibiyle arka odayı rulo rulo taradınız. Seninki on yedincisiydi; hikâyesi olan tek kilim.'],
      reward: ['The cleaner rang a week later: a customer had taken it home by mistake and brought it back, "too beautiful to keep".', 'Temizlemeci bir hafta sonra aradı: bir müşteri yanlışlıkla evine götürmüş ve "saklanamayacak kadar güzel" diyerek geri getirmiş.'],
    },
    {
      what: ['Water from the flat upstairs has soaked through onto the kilim.', 'Üst kattan sızan su kilimi ıslattı.'],
      search: ['You dragged it out onto the balcony and dried it in the sun for three days, turning it like a patient. It is fine.', 'Balkona sürükleyip üç gün güneşte kuruttun; bir hasta gibi çevirip durdun. Bir şeyi yok.'],
      reward: ['A carpet washer took it away and brought it back cleaner than it has been in fifty years. Upstairs paid.', 'Bir halı yıkamacı alıp götürdü ve elli yıldır olmadığı kadar temiz getirdi. Parasını üst kat ödedi.'],
    },
    {
      what: ['A removal man rolled the kilim up with a broken mirror inside.', 'Bir nakliyeci kilimi içinde kırık bir aynayla birlikte rulo yaptı.'],
      search: ['You unrolled it inch by inch on the new floor, picking out glass. Not one thread was cut.', 'Yeni evin zemininde santim santim açıp camları ayıkladın. Tek bir iplik kesilmemişti.'],
      reward: ['The removal company sent a restorer, who found two small cuts and closed them so well you cannot show anyone where.', 'Nakliye şirketi bir usta gönderdi; iki küçük kesik bulup öyle güzel kapattı ki kimseye yerini gösteremiyorsun.'],
    },
  ],
  typewriter: [
    {
      what: ['The typewriter was given to a school by mistake.', 'Daktilo yanlışlıkla bir okula bağışlandı.'],
      search: ['You found it in a classroom, surrounded by children typing their names. You swapped it back for a promise to visit.', 'Onu adlarını yazan çocukların ortasında, bir sınıfta buldun. Ziyarete geleceğine söz vererek geri aldın.'],
      reward: ['The head teacher sent it back with a box of pages the children had typed on it. You kept every page.', 'Müdür onu çocukların üstünde yazdığı sayfalarla dolu bir kutuyla geri yolladı. Her sayfayı sakladın.'],
    },
    {
      what: ['The typewriter was left behind in a hotel.', 'Daktilo bir otelde unutuldu.'],
      search: ['You drove back three hours. It was at reception, and the night porter had typed a short poem on it.', 'Üç saat geri sürdün. Resepsiyondaydı; gece görevlisi üstünde kısa bir şiir yazmıştı.'],
      reward: ['The hotel sent it by courier, wrapped in so much bubble wrap that unwrapping it took an evening.', 'Otel onu kuryeyle yolladı; öyle çok balonlu naylona sarılmıştı ki açmak bir akşam sürdü.'],
    },
    {
      what: ['The typewriter slid off a desk and landed on its keys.', 'Daktilo bir masadan kayıp tuşlarının üstüne düştü.'],
      search: ['You turned it over and straightened eleven bent arms with pliers and prayer. It types. The "e" is a little shy now.', 'Ters çevirip on bir eğik kolu pense ve duayla düzelttin. Yazıyor. Sadece "e" harfi biraz çekingen.'],
      reward: ['A repairer rebuilt it in his workshop and said it was "tougher than any computer". He is probably right.', 'Bir tamirci atölyesinde onu yeniden topladı ve "her bilgisayardan dayanıklı" dedi. Muhtemelen haklı.'],
    },
    {
      what: ['A collector made an offer for the typewriter while you were out, and someone at home said yes.', 'Sen yokken bir koleksiyoncu daktiloya teklif vermiş ve evden biri "olur" demiş.'],
      search: ['You tracked the collector down that evening and bought it back at a loss. He understood. Collectors always do.', 'O akşam koleksiyoncunun izini bulup zararına geri aldın. Anladı. Koleksiyoncular hep anlar.'],
      reward: ['The collector brought it back himself after hearing the story. He only asked to type one line on it first.', 'Koleksiyoncu hikâyeyi duyunca kendisi geri getirdi. Sadece önce üstünde bir satır yazmak istedi.'],
    },
  ],
  tavla: [
    {
      what: ['You left the backgammon board at the café after a long game.', 'Uzun bir oyundan sonra tavlayı kahvede unuttun.'],
      search: ['You ran back at closing time. The owner had put it behind the counter and was playing a regular on it.', 'Kapanış saatinde geri koştun. Kahveci onu tezgâhın arkasına kaldırmış, müdavimlerden biriyle üstünde oynuyordu.'],
      reward: ['A regular brought it to your door the next morning and challenged you to a game on the doorstep. You lost.', 'Müdavimlerden biri ertesi sabah kapına getirdi ve kapının önünde maça davet etti. Kaybettin.'],
    },
    {
      what: ['The backgammon board was used as a tray at a party and something spilled inside.', 'Tavla bir partide tepsi yapıldı ve içine bir şey döküldü.'],
      search: ['You dried it plank by plank with a hairdryer until dawn. The points are a little darker. The dice still roll true.', 'Sabaha kadar saç kurutma makinesiyle tahta tahta kuruttun. Haneler biraz koyulaştı. Zarlar hâlâ dürüst geliyor.'],
      reward: ['A woodworker sanded and oiled it for a week and handed it back smelling of linseed and victory.', 'Bir marangoz bir hafta zımparalayıp yağladı ve keten yağı ve zafer kokarak geri verdi.'],
    },
    {
      what: ['The backgammon board fell out of the car boot on a holiday trip.', 'Tavla bir tatil yolculuğunda arabanın bagajından düştü.'],
      search: ['You drove back along the road at walking pace. It was lying in the grass, shut, as if waiting for a lift.', 'Yolu yürüme hızında geri sürdün. Çimenlerin üstünde, kapalı yatıyordu; otostop bekler gibi.'],
      reward: ['A lorry driver picked it up, found the family name burned inside, and posted it back with one checker missing and an apology.', 'Bir tır şoförü bulmuş, içine dağlanmış aile adını görmüş ve postayla geri yollamış; bir pul eksik, bir de özür notuyla.'],
    },
    {
      what: ['A neighbour borrowed the backgammon board for one game and kept it for a year.', 'Bir komşu tavlayı tek bir oyun için ödünç aldı ve bir yıl tuttu.'],
      search: ['You went round and won it back, best of five. It was the most important game of your life.', 'Kapısına gidip beş oyunluk bir maçla geri kazandın. Hayatının en önemli maçıydı.'],
      reward: ["The neighbour's son returned it, sheepish, with a new pair of dice by way of apology.", 'Komşunun oğlu mahcup bir şekilde geri getirdi; özür olarak da yeni bir çift zarla.'],
    },
  ],
  toolbox: [
    {
      what: ["The toolbox was left on the pavement after you fixed a neighbour's bike.", 'Bir komşunun bisikletini tamir ettikten sonra alet çantası kaldırımda unutuldu.'],
      search: ['You ran out at midnight. It was still there, and someone had borrowed a spanner and put it back.', 'Gece yarısı dışarı fırladın. Hâlâ oradaydı; biri bir anahtar ödünç alıp geri koymuştu.'],
      reward: ['A neighbour had carried it inside for safety and returned it with a jar of jam "for the trouble".', 'Bir komşu emin olsun diye içeri almış; "zahmet oldu" diye bir kavanoz reçelle geri getirdi.'],
    },
    {
      what: ['A builder working on the house walked off with the old toolbox.', 'Evde çalışan bir usta eski alet çantasını alıp gitmiş.'],
      search: ["You rang the builder, then the builder's boss, then turned up at the site. It came back with an apology and a free shelf.", 'Önce ustayı, sonra patronunu aradın, sonra şantiyeye gittin. Bir özür ve bedava bir rafla geri geldi.'],
      reward: ["The builder's apprentice brought it back: \"Only the old ones have tools this good.\"", 'Ustanın çırağı geri getirdi: "Böyle iyi aletler sadece eskilerde olur."'],
    },
    {
      what: ['The toolbox was packed into a donation box with old kitchen things.', 'Alet çantası eski mutfak eşyalarıyla bir bağış kolisine konmuş.'],
      search: ['You found the donation point and dug through six boxes. It was under a fondue set nobody has ever used.', 'Bağış noktasını bulup altı koliyi karıştırdın. Kimsenin hiç kullanmadığı bir fondü takımının altındaydı.'],
      reward: ['A volunteer saw the initials on the hammer and rang every family in the area with those letters.', 'Bir gönüllü çekiçteki baş harfleri gördü ve semtte o harflerle başlayan bütün aileleri aradı.'],
    },
    {
      what: ['The old toolbox fell from the loft ladder.', 'Eski alet çantası tavan arası merdiveninden düştü.'],
      search: ['Everything went everywhere. You spent an evening on your knees finding every last screw. Two are still out there.', 'Her şey her yere dağıldı. Bir akşam dizlerinin üstünde son vidasına kadar topladın. İkisi hâlâ bir yerlerde.'],
      reward: ['A handyman friend straightened the box, found the last screws with a magnet and would take nothing but tea.', 'Tamirci bir arkadaşın çantayı düzeltti, son vidaları mıknatısla buldu ve çaydan başka bir şey kabul etmedi.'],
    },
  ],
};

export const MORE_RITUAL_NEW: MoreTable<Pair[]> = {
  camera: [
    ["This year you took the photo in the same spot as last year's, then lined them all up on the wall.", 'Bu yıl fotoğrafı geçen yılkiyle aynı yerde çektiniz; sonra hepsini duvarda yan yana dizdiniz.'],
    ['This year the youngest took the photo. Everyone is cut off at the forehead. It is perfect.', 'Bu yıl fotoğrafı en küçük çekti. Herkes alından kesik çıktı. Kusursuz.'],
  ],
  letters: [
    ['This year everyone wrote a short letter to the family of fifty years from now and added it to the bundle.', 'Bu yıl herkes elli yıl sonraki aileye kısa bir mektup yazdı ve desteye ekledi.'],
    ['This year the youngest read the oldest letter aloud. They stumbled over the old words and everyone helped.', 'Bu yıl en eski mektubu en küçük okudu. Eski kelimelerde takıldı; herkes yardım etti.'],
  ],
  teaset: [
    ['This year everyone said who they were drinking to before the first sip. It took a while.', 'Bu yıl herkes ilk yudumdan önce kimin şerefine içtiğini söyledi. Biraz uzun sürdü.'],
    ['This year the youngest poured. The tablecloth will never be the same. Nobody minded.', 'Bu yıl çayları en küçük doldurdu. Masa örtüsü bir daha asla eskisi gibi olmayacak. Kimse aldırmadı.'],
  ],
  sewing: [
    ['This year everyone brought a scrap of cloth and the machine sewed them into one long, ridiculous scarf.', 'Bu yıl herkes bir parça kumaş getirdi ve makine hepsini upuzun, gülünç bir atkıya dikti.'],
    ['This year the youngest sewed on their first button. It was the wrong button. It stayed.', 'Bu yıl en küçük ilk düğmesini dikti. Yanlış düğmeydi. Öyle kaldı.'],
  ],
  radio: [
    ['This year everyone picked one song and had to explain why. One explanation took twenty minutes.', 'Bu yıl herkes bir şarkı seçti ve nedenini anlatmak zorundaydı. Bir açıklama yirmi dakika sürdü.'],
    ['This year the youngest found the station. It was static. Everyone danced anyway.', 'Bu yıl istasyonu en küçük buldu. Sadece cızırtı vardı. Herkes yine de dans etti.'],
  ],
  kilim: [
    ['This year everyone sat in their usual place on the kilim, and you noticed that the places have not changed in years.', 'Bu yıl herkes kilimin üstündeki her zamanki yerine oturdu ve yerlerin yıllardır değişmediğini fark ettin.'],
    ['This year the youngest named every symbol in the pattern. Half the names were invented. They are official now.', 'Bu yıl en küçük desendeki her motife bir isim verdi. İsimlerin yarısı uydurmaydı. Artık resmî.'],
  ],
  typewriter: [
    ['This year everyone typed a line to someone who is no longer at the table. Nobody read theirs out.', 'Bu yıl herkes artık sofrada olmayan birine bir satır yazdı. Kimse kendininkini okumadı.'],
    ['This year the youngest typed a whole page alone, about the day. It had a horse in it and three spelling mistakes.', 'Bu yıl en küçük o günü anlatan koca bir sayfayı tek başına yazdı. İçinde bir at ve üç yazım hatası vardı.'],
  ],
  tavla: [
    ['This year you held a family tournament on the old board. The final went to a rematch, then another.', 'Bu yıl eski tavlada bir aile turnuvası yaptınız. Final rövanşa, sonra bir rövanşa daha gitti.'],
    ['This year everyone signed the inside of the lid with the date. There is barely any room left.', 'Bu yıl herkes kapağın içine tarihle birlikte imzasını attı. Neredeyse yer kalmadı.'],
  ],
  toolbox: [
    ['This year everyone mended something of their own with the old tools and showed it off at dinner. One chair is now very stable.', 'Bu yıl herkes eski aletlerle kendine ait bir şeyi tamir edip yemekte gösterdi. Bir sandalye artık çok sağlam.'],
    ['This year the youngest got a little screwdriver of their own to keep in the box. It has its own slot now.', 'Bu yıl en küçüğe çantada kalacak kendi minik tornavidası verildi. Artık onun da bir yeri var.'],
  ],
};

export const MORE_PARTNER_IDEA: MoreTable<{ idea: (n: string) => Pair; yes: Pair }[]> = {
  camera: [
    {
      idea: (n) => [`${n} says nobody uses film any more and wants to put the camera in a display box.`, `${n}, artık kimsenin film kullanmadığını söylüyor ve fotoğraf makinesini bir vitrin kutusuna koymak istiyor.`],
      yes: ['The camera sits in a glass box now. Once a year you take it out anyway, "just to check".', 'Makine artık cam bir kutuda duruyor. Yine de yılda bir kez, "sadece kontrol için" çıkarıyorsun.'],
    },
    {
      idea: (n) => [`${n} wants to scan every old photo the camera ever took and throw the negatives away.`, `${n}, makineyle çekilmiş bütün eski fotoğrafları taratıp negatifleri atmak istiyor.`],
      yes: ['Every photo is scanned now. You kept the negatives anyway, in a shoebox under the bed.', 'Bütün fotoğraflar tarandı. Negatifleri yine de bir ayakkabı kutusunda, yatağın altında sakladın.'],
    },
  ],
  letters: [
    {
      idea: (n) => [`${n} thinks a few of the bundle of letters are "too private" and should be burned.`, `${n}, eski mektuplardan bazılarının "fazla özel" olduğunu ve yakılması gerektiğini düşünüyor.`],
      yes: ['You read the private ones together, once, then sealed them in an envelope marked "not for a hundred years". Nothing was burned.', 'Özel olanları bir kez birlikte okudunuz, sonra üstüne "yüz yıl açılmaz" yazan bir zarfa koyup mühürlediniz. Hiçbir şey yakılmadı.'],
    },
    {
      idea: (n) => [`${n} wants to frame the most beautiful letter from the bundle of letters and hang it in the hall.`, `${n} en güzel mektubu çerçeveletip koridora asmak istiyor.`],
      yes: ['The letter hangs in the hall now. Guests stop to read it and then go very quiet.', 'Mektup artık koridorda asılı. Misafirler okumak için duruyor, sonra bir süre susuyorlar.'],
    },
  ],
  teaset: [
    {
      idea: (n) => [`${n} says the tea set is "too good to use" and wants it locked in the cabinet.`, `${n}, çay takımının "kullanılmayacak kadar güzel" olduğunu söylüyor ve vitrinde kilitli tutmak istiyor.`],
      yes: ['The tea set lives behind glass now. It comes out for weddings, funerals and very important gossip.', 'Çay takımı artık camın arkasında yaşıyor. Sadece düğünlerde, cenazelerde ve çok önemli dedikodularda çıkıyor.'],
    },
    {
      idea: (n) => [`${n} wants to replace the old tea set with "something modern".`, `${n} eski çay bardaklarını "modern bir şeyle" değiştirmek istiyor.`],
      yes: ['You bought a modern set for every day. The old one comes out on special days, and everyone suddenly sits up straighter.', 'Her gün için modern bir takım aldınız. Eskisi özel günlerde çıkıyor ve herkes birden dik oturuyor.'],
    },
  ],
  sewing: [
    {
      idea: (n) => [`${n} says the old sewing machine takes up too much room and wants it in the storeroom.`, `${n}, eski dikiş makinesinin çok yer kapladığını söylüyor ve kilere kaldırmak istiyor.`],
      yes: ['It went to the storeroom. Twice a year you go down to take up a hem and stay an hour.', 'Kilere kaldırıldı. Yılda iki kez bir paça kısaltmak için iniyorsun ve bir saat kalıyorsun.'],
    },
    {
      idea: (n) => [`${n} wants to turn the sewing machine's iron stand into a garden table.`, `${n}, dikiş makinesinin demir ayağını bahçe masası yapmak istiyor.`],
      yes: ['The stand is a garden table now and the machine sits on a new cabinet indoors. Guests admire both. Nobody knows they used to be one.', 'Ayak artık bahçede masa; makine ise içeride yeni bir dolabın üstünde. Misafirler ikisini de beğeniyor. Bir zamanlar tek parça olduklarını kimse bilmiyor.'],
    },
  ],
  radio: [
    {
      idea: (n) => [`${n} wants to replace the old radio in the kitchen with a smart speaker.`, `${n} mutfaktaki eski radyonun yerine akıllı hoparlör koymak istiyor.`],
      yes: ['The speaker went into the kitchen; the radio went into the living room, where it sounds better anyway. Nobody ever asks the speaker anything.', 'Hoparlör mutfağa, radyo salona geçti; orada zaten daha güzel çalıyor. Hoparlöre kimse bir şey sormuyor.'],
    },
    {
      idea: (n) => [`${n} wants the radio rewired "so it doesn't catch fire".`, `${n} radyonun "yangın çıkarmasın diye" kablolarının yenilenmesini istiyor.`],
      yes: ['An electrician rewired it. It is safe now and sounds exactly the same. You checked, for a week.', 'Bir elektrikçi kablolarını yeniledi. Artık güvenli ve sesi tamamen aynı. Bir hafta boyunca kontrol ettin.'],
    },
  ],
  kilim: [
    {
      idea: (n) => [`${n} wants to hang the kilim on the wall "so nobody walks on it".`, `${n} kilimi "kimse üstüne basmasın diye" duvara asmak istiyor.`],
      yes: ['The kilim hangs on the wall now. The room looks like a museum, and the floor misses it.', 'Kilim artık duvarda asılı. Oda müze gibi görünüyor; yer onu özlüyor.'],
    },
    {
      idea: (n) => [`${n} wants to cut the kilim into cushion covers.`, `${n} kilimi kesip kırlent kılıfı yapmak istiyor.`],
      yes: ['You met halfway: cushions from a new kilim, and the old one stays whole under the table. Everyone sits on the cushions and looks at the old one.', 'Ortada buluştunuz: kırlentler yeni bir kilimden yapıldı, eskisi masanın altında bütün kaldı. Herkes kırlentlere oturup eskisine bakıyor.'],
    },
  ],
  typewriter: [
    {
      idea: (n) => [`${n} says the typewriter is too loud for the flat and wants it put away.`, `${n}, daktilonun bu ev için fazla gürültülü olduğunu söylüyor ve kaldırılmasını istiyor.`],
      yes: ['The typewriter moved to a high shelf and only comes down for birthday cards. Those are somehow louder now.', 'Daktilo yüksek bir rafa kalktı ve artık sadece doğum günü kartları için iniyor. O kartlar nedense artık daha gür.'],
    },
    {
      idea: (n) => [`${n} wants to give the typewriter a coat of paint, "something cheerful".`, `${n} daktiloyu "neşeli bir renge" boyamak istiyor.`],
      yes: ['The typewriter is mint green now. It looks like a sweet and types like a tank.', 'Daktilo artık nane yeşili. Şekere benziyor, tank gibi yazıyor.'],
    },
  ],
  tavla: [
    {
      idea: (n) => [`${n} says you spend too many evenings at the backgammon board and wants it out of the living room.`, `${n}, akşamlarının çoğunu tavlanın başında geçirdiğini söylüyor ve salondan kaldırılmasını istiyor.`],
      yes: ['The board moved to the balcony. Now you play out there in a coat, and somehow it is even better.', 'Tavla balkona taşındı. Artık orada, montla oynuyorsun ve nedense daha da güzel.'],
    },
    {
      idea: (n) => [`${n} wants to learn to play on the old backgammon board and "end your winning streak".`, `${n} eski tavlada oynamayı öğrenip "yenilmezlik serini bitirmek" istiyor.`],
      yes: ['You taught them. Within a month your winning streak was over. You are proud and slightly devastated.', 'Öğrettin. Bir ay içinde yenilmezlik serin bitti. Gururlusun ve biraz yıkılmışsın.'],
    },
  ],
  toolbox: [
    {
      idea: (n) => [`${n} wants to throw out the old toolbox and buy "a proper set".`, `${n} eski alet çantasını atıp "düzgün bir takım" almak istiyor.`],
      yes: ['You bought the new set and kept the old box as well. Everyone still reaches for the old hammer.', 'Yeni takımı aldınız, eski çantayı da sakladınız. Herkes hâlâ eski çekice uzanıyor.'],
    },
    {
      idea: (n) => [`${n} wants to empty the toolbox and hang the old tools on a board on the wall, "like a workshop".`, `${n} eski aletleri "atölye gibi" duvarda bir panoya asmak istiyor.`],
      yes: ['The tools hang on the wall now, each inside its own outline. When one is missing, everyone knows.', 'Aletler artık duvarda, her biri kendi silüetinin içinde asılı. Biri eksik olunca herkes anlıyor.'],
    },
  ],
};

export const MORE_SNEAK: MoreTable<{ plan: Pair; ok: Pair; bad: Pair }[]> = {
  camera: [
    {
      plan: ['You want to take the camera to a concert.', 'Fotoğraf makinesini bir konsere götürmek istiyorsun.'],
      ok: ['You took twelve photos. Eleven are dark. The twelfth is the best photo anyone at your school has ever taken.', 'On iki kare çektin. On biri karanlık. On ikincisi okulda bugüne kadar çekilmiş en güzel fotoğraf.'],
      bad: ['A guard thought it was a professional camera and kept it at the door until the end. You heard the concert through a wall.', 'Görevli profesyonel makine sandı ve konser bitene kadar kapıda tuttu. Konseri bir duvarın arkasından dinledin.'],
    },
    {
      plan: ['You want to use the camera for a photo project with your friends.', 'Arkadaşlarınla bir fotoğraf projesi için makineyi kullanmak istiyorsun.'],
      ok: ['The photos came out strange and beautiful. One went up on the school wall.', 'Fotoğraflar tuhaf ve güzel çıktı. Biri okulun duvarına asıldı.'],
      bad: ['Somebody opened the back "to check the film". The whole roll is now one long, bright orange memory.', 'Biri "filme bakmak için" arka kapağı açtı. Bütün rulo artık upuzun, turuncu bir anı.'],
    },
  ],
  letters: [
    {
      plan: ['You want to read the bundle of letters to your friends at a sleepover.', 'Pijama partisinde eski mektupları arkadaşlarına okumak istiyorsun.'],
      ok: ['Your friends went quiet halfway through the second one. One of them wrote to her grandmother the next day.', 'Arkadaşların ikincinin yarısında sustu. Biri ertesi gün büyükannesine mektup yazdı.'],
      bad: ['Someone laughed at one line, and you had to defend your great-grandparents until two in the morning.', 'Biri bir satıra güldü; sonra sabahın ikisine kadar büyük büyüklerini savunmak zorunda kaldın.'],
    },
    {
      plan: ['You want to copy a line from the bundle of letters into a love note of your own.', 'Eski mektuplardan bir satırı kendi aşk notuna geçirmek istiyorsun.'],
      ok: ['The note worked. You never said where the line came from.', 'Not işe yaradı. O satırın nereden geldiğini hiç söylemedin.'],
      bad: ['The note worked a bit too well and went round the whole class. The line is now famous at school.', 'Not fazla işe yaradı ve bütün sınıfı dolaştı. O satır artık okulda meşhur.'],
    },
  ],
  teaset: [
    {
      plan: ['You want to use the old tea set for a tea party with your friends.', 'Eski çay takımıyla arkadaşlarına çay daveti vermek istiyorsun.'],
      ok: ['Everyone held their glass like a diplomat. You washed and dried every piece before anyone came home.', 'Herkes bardağını diplomat gibi tuttu. Kimse eve dönmeden her parçayı yıkayıp kuruladın.'],
      bad: ['A glass cracked in hot water. You turned it so the crack faces the wall. It is still facing the wall.', 'Sıcak suda bir bardak çatladı. Çatlağı duvara bakacak şekilde çevirdin. Hâlâ duvara bakıyor.'],
    },
    {
      plan: ['You want to take the tea set to school for a culture day.', 'Kültür gününde çay takımını okula götürmek istiyorsun.'],
      ok: ['Your stand won. The teachers came back for more three times.', 'Standın birinci oldu. Öğretmenler üç kez yeniden çay içmeye geldi.'],
      bad: ['The sugar bowl lid went missing in the crowd. You found it in the lost property box a week later, next to a rubber.', 'Kalabalıkta şekerliğin kapağı kayboldu. Bir hafta sonra kayıp eşya kutusunda, bir silginin yanında buldun.'],
    },
  ],
  sewing: [
    {
      plan: ['You want to use the sewing machine to make a costume for a party.', 'Bir parti için dikiş makinesinde kostüm dikmek istiyorsun.'],
      ok: ['Your costume won. You said you had "a supplier". The supplier is ninety years old and made of iron.', 'Kostümün birinci oldu. "Bir tedarikçim var" dedin. Tedarikçin doksan yaşında ve demirden.'],
      bad: ['You broke the needle at midnight and spent an hour hunting for the tip on the carpet with a torch.', 'Gece yarısı iğneyi kırdın ve bir saat el feneriyle halıda ucunu aradın.'],
    },
    {
      plan: ['You want to take in your school uniform on the sewing machine, "so it looks better".', 'Okul formanı dikiş makinesinde "daha güzel dursun diye" daraltmak istiyorsun.'],
      ok: ['The uniform looks great. A teacher asked who your tailor was.', 'Forma harika oldu. Bir öğretmen terzinin kim olduğunu sordu.'],
      bad: ['You took it in too far. You could not sit down for a week, and everyone knew why.', 'Fazla daralttın. Bir hafta oturamadın ve herkes nedenini biliyordu.'],
    },
  ],
  radio: [
    {
      plan: ['You want to take the old radio to a party in the park.', 'Eski radyoyu parkta bir partiye götürmek istiyorsun.'],
      ok: ['Everyone gathered round it like a campfire. It was the coolest thing there, which surprised you both.', 'Herkes bir kamp ateşinin başına toplanır gibi etrafına toplandı. Oradaki en havalı şey oydu; bu ikinizi de şaşırttı.'],
      bad: ['Someone spilled a drink on it. It plays now, but only sad songs. Probably a coincidence.', 'Biri üstüne içecek döktü. Çalıyor ama artık sadece hüzünlü şarkılar. Muhtemelen tesadüf.'],
    },
    {
      plan: ['You want to record songs off the old radio late at night.', 'Gece geç saatte eski radyodan şarkı kaydetmek istiyorsun.'],
      ok: ['You made a whole mix of night songs. You still have it.', 'Gece şarkılarından koca bir derleme yaptın. Hâlâ duruyor.'],
      bad: ['You fell asleep with it on. The whole street heard the shipping forecast at four in the morning.', 'Açık bırakıp uyuyakaldın. Bütün sokak sabaha karşı dörtte denizcilere hava durumunu dinledi.'],
    },
  ],
  kilim: [
    {
      plan: ['You want to use the kilim as a backdrop for photos with your friends.', 'Arkadaşlarınla fotoğraf çekilirken kilimi fon yapmak istiyorsun.'],
      ok: ['The photos looked like a magazine shoot. Everyone asked where you got it. "Family," you said, mysteriously.', 'Fotoğraflar dergi çekimi gibi oldu. Herkes nereden bulduğunu sordu. "Aileden" dedin, gizemli bir edayla.'],
      bad: ['You hung it with drawing pins. There are now six tiny holes in a very old pattern.', 'Raptiyelerle astın. Çok eski bir desende artık altı minicik delik var.'],
    },
    {
      plan: ['You want to build a den out of the kilim in the garden.', 'Bahçede kilimle bir çadır kurmak istiyorsun.'],
      ok: ['You spent a whole weekend in it. It is the best house you have ever had.', 'Koca bir hafta sonunu içinde geçirdin. Sahip olduğun en güzel evdi.'],
      bad: ['It rained in the night. The kilim came in heavy, wet and smelling of earth. That was noticed.', 'Gece yağmur yağdı. Kilim içeri ağır, ıslak ve toprak kokarak girdi. Bu fark edildi.'],
    },
  ],
  typewriter: [
    {
      plan: ['You want to type a love letter on the old typewriter.', 'Eski daktiloda bir aşk mektubu yazmak istiyorsun.'],
      ok: ['It looked as if it came from another century. It worked better than any message ever could.', 'Başka bir yüzyıldan gelmiş gibiydi. Hiçbir mesajın yapamayacağı kadar işe yaradı.'],
      bad: ['The clatter woke the whole house at one in the morning. Your love letter was read aloud at breakfast.', 'Tıkırtı gecenin birinde bütün evi uyandırdı. Aşk mektubun kahvaltıda yüksek sesle okundu.'],
    },
    {
      plan: ['You want to take the typewriter to school for a creative-writing class.', 'Yaratıcı yazarlık dersi için daktiloyu okula götürmek istiyorsun.'],
      ok: ['The class went silent when you started typing. Your story got top marks and a round of applause.', 'Yazmaya başlayınca sınıf sustu. Öykün en yüksek notu ve bir alkış aldı.'],
      bad: ['It was heavier than you remembered. You carried it two kilometres and arrived too tired to write.', 'Hatırladığından ağırdı. İki kilometre taşıdın ve yazamayacak kadar yorgun vardın.'],
    },
  ],
  tavla: [
    {
      plan: ['You want to take the backgammon board to school and beat the whole class.', 'Bütün sınıfı yenmek için tavlayı okula götürmek istiyorsun.'],
      ok: ['You beat everyone except one quiet kid, who beat you twice. You are friends now.', 'Sessiz bir çocuk hariç herkesi yendin; o seni iki kez yendi. Artık arkadaşsınız.'],
      bad: ['A teacher confiscated it in maths for "unofficial probability". You got it back on Friday.', 'Bir öğretmen matematik dersinde "gayriresmî olasılık çalışması" gerekçesiyle el koydu. Cuma günü geri aldın.'],
    },
    {
      plan: ['You want to take the backgammon board on a school trip.', 'Tavlayı okul gezisine götürmek istiyorsun.'],
      ok: ['The bus journey became a tournament. You won, and the driver wants a rematch.', 'Otobüs yolculuğu bir turnuvaya dönüştü. Sen kazandın; şoför rövanş istiyor.'],
      bad: ['Three checkers slid under the seats on a bend. You found two.', 'Bir virajda üç pul koltukların altına kaydı. İkisini bulabildin.'],
    },
  ],
  toolbox: [
    {
      plan: ['You want to use the old toolbox to build a go-kart with your friends.', 'Arkadaşlarınla tahta araba yapmak için eski alet çantasını kullanmak istiyorsun.'],
      ok: ['The go-kart works, more or less. Every tool came back clean and in its place.', 'Tahta araba çalışıyor, aşağı yukarı. Her alet temizlenip yerine geri kondu.'],
      bad: ['You lost the little screwdriver in the grass. You searched until dark. It is out there somewhere, rusting with dignity.', 'Küçük tornavidayı çimenlerde kaybettin. Hava kararana kadar aradın. Bir yerlerde, onuruyla paslanıyor.'],
    },
    {
      plan: ['You want to fix your bike with the old toolbox without asking.', 'Sormadan eski alet çantasıyla bisikletini tamir etmek istiyorsun.'],
      ok: ['The bike works perfectly. You put every tool back so neatly that nobody suspected a thing.', 'Bisiklet kusursuz çalışıyor. Her aleti öyle düzgün yerine koydun ki kimse bir şeyden şüphelenmedi.'],
      bad: ['You put the tools back in the wrong order. It was noticed within the hour.', 'Aletleri yanlış sırayla geri koydun. Bir saat içinde fark edildi.'],
    },
  ],
};

export const MORE_QUIET: MoreTable<Pair[]> = {
  camera: [
    ['You looked through the viewfinder at the dark room. Everyone who ever looked through it saw a different room.', 'Vizörden karanlık odaya baktın. Ondan bakan herkes başka bir oda görmüştü.'],
    ['You wound the empty camera and pressed the shutter once, just to hear the click.', 'Boş makineyi kurdun ve sadece o klik sesini duymak için deklanşöre bir kez bastın.'],
    ['You went through the shoebox of old prints. You can still name half the people in them.', 'Eski fotoğrafların durduğu ayakkabı kutusunu karıştırdın. İçlerindeki insanların yarısının adını hâlâ biliyorsun.'],
  ],
  letters: [
    ['You read the letters in order, from the first to the last, and the handwriting grew older as you went.', 'Mektupları ilkinden sonuncusuna sırayla okudun; ilerledikçe el yazısı da yaşlandı.'],
    ['You found a line you had always skipped. It was the best one.', 'Hep atladığın bir satır buldun. En güzeli oymuş.'],
    ['You held one letter up to the lamp and saw the pen had pressed so hard it nearly went through.', 'Bir mektubu lambaya tuttun; kalem kâğıda öyle bastırılmış ki neredeyse delip geçmiş.'],
  ],
  teaset: [
    ['You brewed one glass of tea in the old pot and drank it slowly in the dark kitchen.', 'Eski demlikte bir bardak çay demledin ve karanlık mutfakta ağır ağır içtin.'],
    ['You counted the glasses. One for everyone who ever sat at this table, and nowhere near enough.', 'Bardakları saydın. Bu sofraya oturan herkese bir tane; hiç de yetmez.'],
    ["You turned a saucer to the light and found a tiny mark scratched underneath: someone's initials, long ago.", 'Bir tabağı ışığa tutup çevirdin ve altında çok eskiden kazınmış minicik bir iz buldun: birinin baş harfleri.'],
  ],
  sewing: [
    ['You turned the wheel by hand in the dark and listened to the needle rise and fall.', 'Karanlıkta volanı elinle çevirdin ve iğnenin inip kalkışını dinledin.'],
    ['You opened the little drawer: bobbins, a thimble, a button nobody can place. You put everything back exactly.', 'Küçük çekmeceyi açtın: masuralar, bir yüksük, kimsenin nereden geldiğini bilmediği bir düğme. Her şeyi tam yerine koydun.'],
    ['You ran a finger over the worn spot where so many hands have guided the cloth.', 'Onca elin kumaşı yönlendirdiği o aşınmış yerde parmağını gezdirdin.'],
  ],
  radio: [
    ['You switched the radio on very low and found a station playing something old. You let it finish.', 'Radyoyu çok kısık açtın ve eski bir şey çalan bir istasyon buldun. Bitmesine izin verdin.'],
    ['You sat in the glow of the dial in the dark kitchen, as if by a small fire.', 'Karanlık mutfakta, küçük bir ateşin başında gibi kadranın ışığında oturdun.'],
    ['Between two stations there was only static, and somehow it sounded like every voice the radio has ever carried.', 'İki istasyonun arasında sadece cızırtı vardı; nedense radyonun taşıdığı bütün sesler gibi geldi.'],
  ],
  kilim: [
    ['You lay on the kilim in the dark and traced the pattern with a finger, like reading another alphabet.', 'Karanlıkta kilimin üstüne uzanıp desende parmağını gezdirdin; başka bir alfabeyle okur gibi.'],
    ['You found the one knot where the weaver changed colour by mistake, and loved it all the more for it.', 'Dokuyanın yanlışlıkla renk değiştirdiği tek düğümü buldun ve onu bu yüzden daha çok sevdin.'],
    ['You sat and listened to the house. Generations of feet have crossed exactly this spot.', 'Oturup evi dinledin. Kuşaklar boyu ayaklar tam bu noktadan geçmiş.'],
  ],
  typewriter: [
    ['You rolled in a sheet of paper and typed one word. Then you sat and looked at it for a long time.', 'Bir kâğıt takıp tek bir kelime yazdın. Sonra uzun uzun ona baktın.'],
    ['You pressed a key very slowly, so the arm rose and stopped just short of the page, and let it fall back.', 'Bir tuşa çok yavaş bastın; kol kalktı, kâğıda değmeden durdu ve geri düştü.'],
    ["You found the box of old pages typed on it and read them by the lamp: every keeper's voice, in the same letters.", 'Onunla yazılmış eski sayfaların kutusunu bulup lambanın ışığında okudun: her sahibinin sesi, aynı harflerle.'],
  ],
  tavla: [
    ['You set up the checkers by feel in the dark, the way you have done a thousand times.', 'Pulları karanlıkta, binlerce kez yaptığın gibi el yordamıyla dizdin.'],
    ['You rolled the dice once, alone, and got double six. Nobody will ever believe you.', 'Tek başına bir kez zar attın ve düşeş geldi. Kimse sana asla inanmayacak.'],
    ['You ran your thumb along the worn points where the checkers have slid for generations.', 'Pulların kuşaklardır kaydığı aşınmış hanelerde başparmağını gezdirdin.'],
  ],
  toolbox: [
    ["You opened it and breathed in the smell of oil and metal and somebody's old workshop.", 'Çantayı açıp yağ, metal ve birinin eski atölyesinin kokusunu içine çektin.'],
    ['You held the old hammer and felt the dip in the handle where a thumb has rested for decades.', 'Eski çekici tuttun ve sapta onlarca yıldır bir başparmağın durduğu çukuru hissettin.'],
    ['You laid every tool out on the table and put them back one by one, in the old order, without having to think.', 'Bütün aletleri masaya dizdin ve hiç düşünmeden, eski sırasıyla tek tek geri koydun.'],
  ],
};

/** Last words about the new types, for the engine's death screen (game.ts HEIRLOOM_WORDS; `{heir}` is the heir's name). */
export const MORE_LAST_WORDS: MoreTable<[string, string]> = {
  camera: ['Take the camera out more often, {heir}. Photograph the ordinary days.', 'Fotoğraf makinesini daha sık çıkar, {heir}. Sıradan günleri çek.'],
  letters: ['Add a letter to the bundle, {heir}. Write it to someone not born yet.', 'Desteye bir mektup ekle, {heir}. Henüz doğmamış birine yaz.'],
  teaset: ['Use the good tea set, {heir}. Guests are the special occasion.', 'Güzel çay takımını kullan, {heir}. Özel gün dediğin misafirdir.'],
  sewing: ['Oil the sewing machine, {heir}, and mend things instead of throwing them away.', 'Dikiş makinesini yağla, {heir}. Bir şeyi atmadan önce onarmayı dene.'],
  radio: ['Leave the radio on in the kitchen, {heir}. A house should hum.', 'Mutfakta radyoyu açık bırak, {heir}. Bir evin sesi olmalı.'],
  kilim: ['Turn the kilim every spring, {heir}, so it wears evenly. People too.', 'Kilimi her bahar çevir, {heir}, eşit eskisin. İnsanlar da öyle.'],
  typewriter: ['Write it all down on the typewriter, {heir}. Even the boring parts.', 'Daktiloyla her şeyi yaz, {heir}. Sıkıcı kısımları bile.'],
  tavla: ['Never let them win at backgammon, {heir}. They will thank you later.', 'Tavlada kimseye torpil geçme, {heir}. Sonra sana teşekkür ederler.'],
  toolbox: ['Put every tool back in its place, {heir}. Your hands will know.', 'Her aleti yerine koy, {heir}. Ellerin bilir.'],
};
