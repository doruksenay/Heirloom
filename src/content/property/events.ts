import type { EventDef } from '../types';
import { quickEvent, since, type QuickEvent } from '../base/quick-event';

// "Property": a flat to rent out, a few shares, a plot of land, and the decisions around money that sits still.
// Quick events (base/quick-event.ts): no rng, so nobody's seed shifts. Every event keeps at least one free option.
// Flags (they carry the year): prop_flat, prop_flat_sold, prop_stocks, prop_land.

const M = { category: 'money' } as const;
const landlord = (c: Parameters<NonNullable<QuickEvent['when']>>[0]) => since(c, 'prop_flat') >= 0 && since(c, 'prop_flat_sold') < 0;
const holdsShares = (c: Parameters<NonNullable<QuickEvent['when']>>[0]) => since(c, 'prop_stocks') >= 1;

const PROPERTY: QuickEvent[] = [
  // ---------------------------------------------------------------- the flat
  {
    ...M, id: 'prop.first_flat', ages: [24, 60], once: true,
    title: ['A small flat near the station comes up for sale.', 'İstasyonun yakınında küçük bir daire satılığa çıkıyor.'],
    text: ['It is a one-bedroom with a view of another building. An agent calls it “full of potential”, which is code for a boiler.', 'Başka bir binaya bakan tek yatak odalı bir daire. Emlakçı buna “potansiyel dolu” diyor; bu, kazan demek.'],
    options: [
      { id: 'buy', label: ['Buy it to rent out', 'Kiraya vermek için al'], usd: -8000, flags: ['prop_flat'], stats: { happiness: 4, smarts: 1 }, tone: 'big', result: ['You signed on a Thursday. By Friday you had a spreadsheet, a ladder and a new understanding of the word “landlord”.', 'Perşembe günü imzaladın. Cumaya bir tablon, bir merdivenin ve “ev sahibi” kelimesine yeni bir bakışın vardı.'] },
      { id: 'look', label: ['Look round and keep your savings', 'Gez ve birikimini koru'], stats: { smarts: 1 }, result: ['You inspected every room, asked about the boiler and went home with a brochure. The flat sold the same week. You are still thinking about it.', 'Her odayı gezdin, kazanı sordun ve broşürle eve döndün. Daire aynı hafta satıldı. Hâlâ düşünüyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.tenant_good', ages: [24, 90], cooldown: 8, when: landlord,
    title: ['Your tenant has been in the flat for years and never complained.', 'Kiracın yıllardır dairede ve hiç şikâyet etmedi.'],
    text: ['The rent arrives on the first of the month. Every Christmas, a small card arrives with it.', 'Kira ayın birinde geliyor. Her yılbaşı yanında küçük bir kart geliyor.'],
    options: [
      { id: 'thank', label: ['Send a thank-you gift', 'Teşekkür hediyesi gönder'], usd: -60, stats: { happiness: 3 }, tone: 'good', result: ['A fruit basket. The tenant wrote back, “First time a landlord has done this.” You framed it, mentally.', 'Bir meyve sepeti. Kiracı “Bir ev sahibi bunu ilk kez yapıyor” diye yazdı. Zihninde çerçeveledin.'] },
      { id: 'nothing', label: ['Say nothing; it is going well', 'Bir şey söyleme; iş yolunda'], stats: { happiness: 1 }, result: ['Silence is the highest compliment a landlord can pay. The rent arrived on time again.', 'Sessizlik, bir ev sahibinin yapabileceği en büyük iltifat. Kira yine zamanında geldi.'] },
    ],
  },
  {
    ...M, id: 'prop.tenant_late', ages: [24, 85], cooldown: 8, when: landlord,
    title: ['The rent is two weeks late.', 'Kira iki hafta gecikti.'],
    text: ['The tenant has lost a job and writes a long, embarrassed message with a lot of apologies in it.', 'Kiracı işini kaybetmiş ve çok özür içeren uzun, mahcup bir mesaj yazmış.'],
    options: [
      { id: 'patient', label: ['Give them time', 'Zaman tanı'], usd: -150, stats: { happiness: 2 }, tone: 'good', result: ['They paid everything back in three months, with a cake for the inconvenience. You are now friends in a slightly awkward, financial way.', 'Üç ayda her şeyi geri ödedi, sıkıntı için bir pastayla. Artık biraz tuhaf, mali bir şekilde dostsunuz.'] },
      { id: 'firm', label: ['Send a firm reminder', 'Kararlı bir hatırlatma gönder'], stats: { happiness: -2 }, result: ['They paid within the week and left at the end of the lease. The flat stayed empty for two months afterwards.', 'Bir hafta içinde ödediler ve sözleşme bitince ayrıldılar. Daire sonrasında iki ay boş kaldı.'] },
    ],
  },
  {
    ...M, id: 'prop.boiler', ages: [24, 90], cooldown: 10, when: landlord,
    title: ['The flat’s boiler has given up.', 'Dairenin kazanı pes etti.'],
    text: ['Your tenant calls at seven a.m. The word “cold” is used three times in one sentence.', 'Kiracı sabah yedide arıyor. Tek cümlede “soğuk” kelimesi üç kez geçiyor.'],
    options: [
      { id: 'replace', label: ['Replace it properly', 'Düzgünce değiştir'], usd: -900, stats: { happiness: 1 }, result: ['A new boiler, a proper warranty and a tenant who treats you like royalty for the next year.', 'Yeni bir kazan, düzgün bir garanti ve gelecek yıl boyunca sana kral gibi davranan bir kiracı.'] },
      { id: 'patch', label: ['Patch it and promise a new one', 'Yamala ve yenisini vaat et'], stats: { happiness: -2 }, result: ['It lasted until the first frost. The tenant’s next message did not contain the word “royalty”.', 'İlk dona kadar dayandı. Kiracının sonraki mesajında “kral” kelimesi geçmiyordu.'] },
    ],
  },
  {
    ...M, id: 'prop.flood', ages: [24, 90], once: true, when: landlord,
    title: ['A pipe burst in the flat above, and your ceiling is now a waterfall.', 'Üst dairede bir boru patladı ve senin tavanın şelaleye dönüştü.'],
    text: ['The neighbour apologises through the door. The ceiling answers for itself.', 'Komşu kapıdan özür diliyor. Tavan kendi adına cevap veriyor.'],
    options: [
      { id: 'insurer', label: ['Claim from the neighbour’s insurance', 'Komşunun sigortasından talep et'], stats: { smarts: 2 }, result: ['Forms in triplicate, a surveyor named Mr Dry (genuinely) and eventually a repaired ceiling. Paperwork builds character.', 'Üç nüsha form, gerçekten adı Bay Kuru olan bir eksper ve sonunda onarılmış bir tavan. Evrak karakter geliştirir.'] },
      { id: 'friendly', label: ['Fix it yourself and let it go', 'Kendin onar ve boş ver'], usd: -400, stats: { happiness: 2 }, result: ['You painted the ceiling on a Sunday and the neighbour left a bottle of wine at your door. It is the best-looking ceiling in the building.', 'Tavanı bir pazar günü boyadın ve komşu kapına bir şişe şarap bıraktı. Binadaki en güzel tavan bu.'] },
    ],
  },
  {
    ...M, id: 'prop.rent_raise', ages: [26, 90], cooldown: 10, when: landlord,
    title: ['The market has moved, and your rent is well below it.', 'Piyasa ilerledi ve kiran piyasanın çok altında kaldı.'],
    text: ['A letter from an agent says you could charge 30% more. Your tenant has just had a baby.', 'Bir emlakçıdan gelen mektup %30 daha fazla isteyebileceğini söylüyor. Kiracının tam bir bebeği oldu.'],
    options: [
      { id: 'raise', label: ['Raise it to the market rate', 'Piyasa seviyesine çıkar'], usd: 700, stats: { happiness: -2 }, result: ['The tenant paid it without complaint and without a Christmas card. You noticed.', 'Kiracı şikâyet etmeden, yılbaşı kartı da olmadan ödedi. Fark ettin.'] },
      { id: 'small', label: ['Raise it a little, and explain why', 'Biraz artır ve nedenini açıkla'], usd: 200, stats: { happiness: 2, smarts: 1 }, tone: 'good', result: ['A short, kind letter did most of the work. The tenant brought a pot of soup. Everyone left the arrangement feeling decent.', 'Kısa ve nazik bir mektup işin çoğunu yaptı. Kiracı bir tencere çorba getirdi. Herkes anlaşmadan iyi hisle ayrıldı.'] },
    ],
  },
  {
    ...M, id: 'prop.short_let', ages: [26, 70], once: true, when: landlord,
    title: ['A friend says you could earn double by renting the flat to tourists.', 'Bir arkadaş daireyi turistlere kiralayarak iki katı kazanabileceğini söylüyor.'],
    text: ['It would mean cleaning, keys, strangers and a rating system. The long-term tenant would have to leave.', 'Temizlik, anahtarlar, yabancılar ve bir puanlama sistemi demek. Uzun dönem kiracı gitmek zorunda kalır.'],
    options: [
      { id: 'try', label: ['Try it for one summer', 'Bir yaz dene'], usd: 500, stats: { happiness: -3, health: -1 }, result: ['You earned more than expected and slept less. The best review said “like a very organised aunt’s flat”. You kept the aunt.', 'Beklediğinden fazla kazandın, daha az uyudun. En iyi yorum “çok düzenli bir teyzenin evi gibi” diyordu. Teyzeyi tuttun.'] },
      { id: 'stay', label: ['Stay with the long-term tenant', 'Uzun dönem kiracıda kal'], stats: { happiness: 3 }, result: ['Quiet, steady, dull and good. Your phone does not ring at three in the morning about a missing key.', 'Sessiz, istikrarlı, sıkıcı ve iyi. Telefonun gece üçte kayıp anahtar için çalmıyor.'] },
    ],
  },
  {
    ...M, id: 'prop.sell_flat', ages: [30, 90], once: true, when: (c) => landlord(c) && since(c, 'prop_flat') >= 4,
    title: ['An agent offers a good price for the flat.', 'Bir emlakçı daire için iyi bir fiyat öneriyor.'],
    text: ['The price has risen since you bought. The tenant is nice and the repairs are endless. You could do something else with the money.', 'Fiyat aldığından beri yükselmiş. Kiracı hoş, onarımlar bitmiyor. Parayla başka bir şey yapabilirsin.'],
    options: [
      { id: 'sell', label: ['Sell and take the profit', 'Sat ve kârı al'], usd: 14000, flags: ['prop_flat_sold'], stats: { happiness: 3 }, tone: 'good', result: ['The sale took two months and one very long signature. You pocketed the profit and bought yourself a nice dinner. The tenant sent a thank-you card.', 'Satış iki ay ve çok uzun bir imza sürdü. Kârı cebine koydun ve kendine güzel bir akşam yemeği aldın. Kiracı teşekkür kartı gönderdi.'] },
      { id: 'keep', label: ['Keep it; it is your retirement', 'Tut; emeklilik güvencen'], stats: { smarts: 1 }, result: ['The agent left the card on the table. You kept it, as one keeps a ticket to a trip that may never happen.', 'Emlakçı kartını masada bıraktı. Gerçekleşmeyebilecek bir yolculuğun bileti gibi sakladın.'] },
    ],
  },
  {
    ...M, id: 'prop.property_tax', ages: [26, 90], cooldown: 8, when: landlord,
    title: ['The tax office sends a new property assessment.', 'Vergi dairesi yeni bir emlak değerlemesi gönderiyor.'],
    text: ['Your flat has apparently doubled in value, and so has your bill. There is an appeals form on page nine.', 'Dairen görünüşe göre iki katına çıkmış, faturan da öyle. Dokuzuncu sayfada itiraz formu var.'],
    options: [
      { id: 'appeal', label: ['Fill in the appeal form', 'İtiraz formunu doldur'], stats: { smarts: 2 }, result: ['Three evenings and a stamp later, the assessment was trimmed by a third. You celebrated with a biscuit.', 'Üç akşam ve bir pul sonra değerleme üçte bir oranında düşürüldü. Bir bisküviyle kutladın.'] },
      { id: 'pay', label: ['Pay and be done with it', 'Öde ve kurtul'], usd: -300, stats: { happiness: 1 }, result: ['You paid with the grim calm of a man buying a train ticket. Somewhere a clerk smiled.', 'Tren bileti alan birinin kasvetli sakinliğiyle ödedin. Bir yerlerde bir memur gülümsedi.'] },
    ],
  },
  {
    ...M, id: 'prop.old_lease', ages: [40, 90], once: true, when: landlord,
    title: ['An elderly tenant asks to stay in the flat for the rest of her life.', 'Yaşlı bir kiracı hayatının kalanını dairede geçirmek istiyor.'],
    text: ['She has been there since the building was new. She has also told you what your grandmother’s curtains looked like.', 'Bina yeniyken oradan beri duruyor. Üstelik sana büyükannenin perdelerinin neye benzediğini de anlattı.'],
    options: [
      { id: 'yes', label: ['Agree, at the old rent', 'Kabul et, eski kirayla'], usd: -200, stats: { happiness: 5 }, tone: 'good', result: ['She cried a little, then brought a plate of dolma. You have never had a better tenant or a worse return on investment.', 'Biraz ağladı, sonra bir tabak dolma getirdi. Hiç bu kadar iyi bir kiracın ve bu kadar kötü bir yatırım getirin olmamıştı.'] },
      { id: 'fair', label: ['Agree, with a fair modern rent', 'Kabul et, adil güncel kirayla'], stats: { happiness: 1 }, result: ['She grumbled once, stayed and paid. The dolma stopped, but not the curtain stories.', 'Bir kez homurdandı, kaldı ve ödedi. Dolma kesildi ama perde hikâyeleri kesilmedi.'] },
    ],
  },
  {
    ...M, id: 'prop.reno_flip', ages: [26, 65], once: true,
    title: ['A friend finds a run-down flat and wants a partner to renovate and sell it.', 'Bir arkadaş harap bir daire buluyor ve yenileyip satmak için ortak arıyor.'],
    text: ['“Six months, tops,” he says. His last project is still being referred to as “six months, tops”.', '“En fazla altı ay” diyor. Son projesine hâlâ “en fazla altı ay” deniyor.'],
    options: [
      { id: 'partner', label: ['Go in as partner', 'Ortak ol'], usd: -3000, stats: { smarts: 2, happiness: -2 }, flags: ['prop_flip'], result: ['It took eleven months, two plumbers and a quarrel about tile. The flat sold, the profit was small, and you can now say “grout” with authority.', 'On bir ay, iki tesisatçı ve bir fayans kavgası sürdü. Daire satıldı, kâr küçüktü ve artık “derz” kelimesini otoriteyle söyleyebiliyorsun.'] },
      { id: 'advise', label: ['Offer advice only', 'Sadece tavsiye ver'], stats: { smarts: 1 }, result: ['You gave opinions about paint and walked away. He sent a photo of the result with “see?” in capitals.', 'Boya hakkında fikir verdin ve çekip gittin. Sonucun fotoğrafını büyük harflerle “gördün mü?” diye gönderdi.'] },
    ],
  },
  {
    ...M, id: 'prop.parking', ages: [28, 70], once: true,
    title: ['A parking space in your building is for sale.', 'Binanda bir otopark yeri satılık.'],
    text: ['It is the size of a wardrobe. Your neighbour says it will double in value. Your neighbour says that about everything.', 'Bir gardırop büyüklüğünde. Komşun iki katına çıkacağını söylüyor. Komşun her şey için bunu söylüyor.'],
    options: [
      { id: 'buy', label: ['Buy it', 'Satın al'], usd: -2500, stats: { happiness: 2 }, result: ['You do not own a car, so you rent it to someone who does. Strangely, this has become the most reliable income you have.', 'Arabanın yok, sen de arabası olan birine kiralıyorsun. Şaşırtıcı biçimde en güvenilir gelirin bu oldu.'] },
      { id: 'pass', label: ['Pass', 'Geç'], stats: { smarts: 1 }, result: ['You walked past the space for months, wondering. It sold to a man with a very small car.', 'Aylarca yerin önünden geçip merak ettin. Çok küçük arabası olan bir adama satıldı.'] },
    ],
  },
  {
    ...M, id: 'prop.shop_unit', ages: [32, 75], once: true,
    title: ['A small shop on the high street is for rent or sale.', 'Ana caddedeki küçük bir dükkân kiralık ya da satılık.'],
    text: ['It has a tiled floor, a broken sign and a smell of cardamom from a previous life.', 'Fayanslı bir zemini, kırık bir tabelası ve önceki hayatından kalma kakule kokusu var.'],
    options: [
      { id: 'buy', label: ['Buy it and let it out', 'Al ve kiraya ver'], usd: -6000, flags: ['prop_shop'], stats: { happiness: 2, smarts: 1 }, result: ['A baker moved in within the month. The street now smells of bread and your account now smells of rent.', 'Bir fırıncı ay içinde taşındı. Sokak artık ekmek, hesabın ise kira kokuyor.'] },
      { id: 'walk', label: ['Admire it and keep walking', 'Beğen ve yürümeye devam et'], stats: { happiness: 1 }, result: ['You looked into the window for a while. Someone else turned it into a phone repair shop.', 'Bir süre vitrine baktın. Başka biri onu telefon tamirhanesine çevirdi.'] },
    ],
  },
  // ---------------------------------------------------------------- shares and savings
  {
    ...M, id: 'prop.first_shares', ages: [22, 70], once: true,
    title: ['A colleague explains how to buy shares in a broad fund.', 'Bir iş arkadaşı geniş bir fona nasıl hisse alınacağını anlatıyor.'],
    text: ['“It is boring,” he says, “and boring is the point.” He draws a graph on a napkin that goes up and right.', '“Sıkıcı,” diyor, “ve sıkıcı olması asıl mesele.” Peçeteye yukarı ve sağa giden bir grafik çiziyor.'],
    options: [
      { id: 'buy', label: ['Put in a small, regular amount', 'Küçük ve düzenli bir tutar yatır'], usd: -500, flags: ['prop_stocks'], stats: { smarts: 2 }, tone: 'good', result: ['You set up an automatic transfer and forgot about it, which was the clever part. The napkin lives in your wallet.', 'Otomatik bir havale kurup unuttun; akıllıca olan buydu. Peçete cüzdanında yaşıyor.'] },
      { id: 'wait', label: ['Say you will think about it', 'Düşüneceğini söyle'], stats: { smarts: 1 }, result: ['You thought about it for a year. The napkin was right. You kept the napkin.', 'Bir yıl düşündün. Peçete haklıydı. Peçeteyi sakladın.'] },
    ],
  },
  {
    ...M, id: 'prop.crash', ages: [24, 90], once: true, when: holdsShares,
    title: ['The market falls by a fifth in a single month.', 'Piyasa tek ayda beşte bir oranında düştü.'],
    text: ['The news uses words like “bloodbath”. Your fund app is a sea of red. A colleague is selling everything.', 'Haberler “kan gölü” gibi kelimeler kullanıyor. Fon uygulaman kırmızı bir deniz. Bir iş arkadaşı her şeyi satıyor.'],
    options: [
      { id: 'hold', label: ['Hold, and look away', 'Tut ve başka yere bak'], stats: { smarts: 2, happiness: -2 }, flags: ['prop_held'], tone: 'good', result: ['It was one of the hardest things you have done for no visible reward. In two years the line was back, and so was your sleep.', 'Görünür bir ödül olmadan yaptığın en zor şeylerden biriydi. İki yıl içinde çizgi geri geldi, uykun da.'] },
      { id: 'sell', label: ['Sell before it gets worse', 'Daha kötü olmadan sat'], usd: -300, stats: { happiness: 1 }, tone: 'bad', result: ['You sold near the bottom. The relief lasted a month, the regret considerably longer. Next time, you say, you will be calmer.', 'Dibe yakın bir yerde sattın. Rahatlama bir ay, pişmanlık çok daha uzun sürdü. Bir dahaki sefere daha sakin olacaksın, diyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.boom', ages: [26, 90], cooldown: 12, when: holdsShares,
    title: ['Your fund has risen by half, and everyone is talking about it.', 'Fonun yarı oranında yükseldi ve herkes bundan söz ediyor.'],
    text: ['At the barbecue, a stranger explains what you should do with your money. He is not a financial expert; he is selling sausages.', 'Mangalda bir yabancı parayla ne yapman gerektiğini anlatıyor. Finans uzmanı değil; sosis satıyor.'],
    options: [
      { id: 'trim', label: ['Take a little off the table', 'Biraz bozdur'], usd: 800, stats: { happiness: 3 }, tone: 'good', result: ['You sold a modest slice and kept the rest. You bought something sensible, which felt luxurious.', 'Küçük bir dilimi sattın, gerisini tuttun. Mantıklı bir şey aldın ve bu lüks hissettirdi.'] },
      { id: 'stay', label: ['Do nothing', 'Hiçbir şey yapma'], stats: { smarts: 1 }, result: ['The sausage man was disappointed. Your fund went on being boring, which is the whole point.', 'Sosisçi hayal kırıklığına uğradı. Fonun sıkıcı olmaya devam etti; mesele zaten bu.'] },
    ],
  },
  {
    ...M, id: 'prop.hot_tip', ages: [22, 70], cooldown: 12,
    title: ['A friend has a tip that is “absolutely certain”.', 'Bir arkadaşın “kesinlikle garanti” bir ipucu var.'],
    text: ['He wrote the name on a receipt and slid it across the table like a spy. The company makes something with “bio” in its name.', 'Adı bir fişin üstüne yazdı ve bir casus gibi masanın üzerinden kaydırdı. Şirket, adında “bio” geçen bir şey üretiyor.'],
    options: [
      { id: 'play', label: ['Put in a small amount for fun', 'Eğlence için küçük bir tutar yatır'], usd: -250, stats: { happiness: 1 }, tone: 'bad', result: ['It went up for nine days and then discovered gravity. You lost most of it and gained a story about a receipt.', 'Dokuz gün yükseldi ve sonra yerçekimini keşfetti. Çoğunu kaybettin ve bir fiş hakkında hikâye kazandın.'] },
      { id: 'pass', label: ['Fold the receipt and say no thank you', 'Fişi katla ve hayır teşekkürler de'], stats: { smarts: 2 }, result: ['The company later collapsed. Your friend said, “I knew it,” and has never been proved wrong about that.', 'Şirket sonra battı. Arkadaşın “Biliyordum” dedi ve bu konuda bugüne kadar hiç yanlışı çıkmadı.'] },
    ],
  },
  {
    ...M, id: 'prop.dividend', ages: [30, 95], cooldown: 7, when: holdsShares,
    title: ['A dividend lands in your account.', 'Hesabına bir temettü düşüyor.'],
    text: ['It is not a lot of money, but it came from nowhere, which is a different sort of feeling.', 'Çok para değil ama yoktan geldi ve bu başka türlü bir his.'],
    options: [
      { id: 'reinvest', label: ['Reinvest it', 'Yeniden yatır'], stats: { smarts: 1, happiness: 1 }, result: ['The graph went up by a pixel. You felt like a tiny industrialist.', 'Grafik bir piksel yükseldi. Kendini küçük bir sanayici gibi hissettin.'] },
      { id: 'treat', label: ['Spend it on something nice', 'Güzel bir şeye harca'], usd: 120, stats: { happiness: 3 }, result: ['A dinner for two with no discussion of what it cost. You called it “income”, and everyone allowed it.', 'İkisi için, ne kadar tuttuğunu hiç konuşmadan bir akşam yemeği. Adına “gelir” dedin ve herkes buna izin verdi.'] },
    ],
  },
  {
    ...M, id: 'prop.crypto_cousin', ages: [22, 60], once: true,
    title: ['A cousin wants you to invest in a coin he invented.', 'Bir kuzen kendi icat ettiği bir paraya yatırım yapmanı istiyor.'],
    text: ['It is called SOUPCOIN. The logo is a bowl. The plan is “community”.', 'Adı ÇORBACOİN. Logosu bir kase. Plan “topluluk”.'],
    options: [
      { id: 'pass', label: ['Decline, with a hug', 'Sarılarak reddet'], stats: { happiness: 1, smarts: 1 }, result: ['He said “You will regret this.” You will not, but you do admire his optimism.', 'Sen “bunun pişmanlığını yaşayacaksın” dedi. Yaşamayacaksın ama iyimserliğine hayran kalıyorsun.'] },
      { id: 'tiny', label: ['Put in a token amount, and wish him well', 'Sembolik bir tutar yatır ve ona iyi şanslar dile'], usd: -50, stats: { happiness: 2 }, result: ['You lost fifty dollars and kept a mug with a bowl on it. The cousin has already launched a second coin.', 'Elli dolar kaybettin ve üstünde kase olan bir kupa edindin. Kuzen ikinci parasını çoktan çıkardı.'] },
    ],
  },
  {
    ...M, id: 'prop.deposit', ages: [24, 90], once: true,
    title: ['A bank offers a good rate on a fixed deposit.', 'Bir banka vadeli mevduata iyi bir faiz öneriyor.'],
    text: ['The clerk smiles in a practised way. The only catch is that you cannot touch the money for a year.', 'Memur alışkın bir şekilde gülümsüyor. Tek tuzak, bir yıl paraya dokunamamak.'],
    options: [
      { id: 'lock', label: ['Lock some away', 'Bir kısmını kilitle'], usd: 400, stats: { smarts: 1, happiness: 2 }, result: ['A year later, the interest arrived like a polite stranger. It was small, and it was entirely yours.', 'Bir yıl sonra faiz kibar bir yabancı gibi geldi. Küçüktü ve tamamen seninkiydi.'] },
      { id: 'cash', label: ['Keep it accessible', 'Ulaşılabilir tut'], stats: { happiness: 1 }, result: ['You kept the money in the account and the account in your mind. It did not grow, but you did not lose any sleep.', 'Parayı hesapta, hesabı da aklında tuttun. Büyümedi ama uykundan da olmadın.'] },
    ],
  },
  {
    ...M, id: 'prop.pension', ages: [28, 55], once: true,
    title: ['A letter shows your pension projection.', 'Bir mektup emeklilik tahminini gösteriyor.'],
    text: ['It is smaller than you thought. It also contains a line saying that, if you add a little each month, it could be a lot larger.', 'Düşündüğünden küçük. Ayrıca her ay biraz eklersen çok daha büyük olabileceğini söyleyen bir satır var.'],
    options: [
      { id: 'add', label: ['Start a monthly contribution', 'Aylık katkı başlat'], usd: -600, stats: { smarts: 2, happiness: -1 }, tone: 'good', result: ['It stung for the first month and then disappeared into the background. Thirty years from now, you will be glad.', 'İlk ay can yaktı, sonra arka planda kayboldu. Otuz yıl sonra memnun olacaksın.'] },
      { id: 'later', label: ['File it under “later”', '“Sonra” dosyasına koy'], stats: { happiness: 1 }, result: ['The “later” folder is already very thick. It sits beside the folder labelled “I should”.', '“Sonra” klasörü zaten çok kalın. “Yapmalıyım” etiketli klasörün yanında duruyor.'] },
    ],
  },
  {
    ...M, id: 'prop.advisor', ages: [32, 80], once: true,
    title: ['A financial adviser offers a free first meeting.', 'Bir finans danışmanı ücretsiz ilk görüşme öneriyor.'],
    text: ['He has a nice office, a larger plant and a brochure with a sunset on it. “Free” turns out to be relative.', 'Güzel bir ofisi, daha büyük bir bitkisi ve üzerinde gün batımı olan bir broşürü var. “Ücretsiz” göreceli çıkıyor.'],
    options: [
      { id: 'meet', label: ['Go and listen, sign nothing', 'Git, dinle, hiçbir şey imzalama'], stats: { smarts: 2 }, result: ['You learned two useful things and recognised three sales techniques. He gave you a very nice pen. You still use it.', 'İki yararlı şey öğrendin ve üç satış tekniğini tanıdın. Sana çok güzel bir kalem verdi. Hâlâ kullanıyorsun.'] },
      { id: 'sign', label: ['Sign up for his managed plan', 'Yönettiği plana kaydol'], usd: -400, stats: { happiness: -1 }, tone: 'bad', result: ['The fees were hidden in a font that needed a magnifying glass. In three years you worked out what you had paid. You do not discuss it.', 'Ücretler büyüteç isteyen bir yazı tipinde gizlenmişti. Üç yıl sonra ne ödediğini hesapladın. Bunu konuşmuyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.budget', ages: [20, 70], once: true,
    title: ['You decide to write down every expense for a month.', 'Bir ay boyunca her harcamayı yazmaya karar veriyorsun.'],
    text: ['A notebook, a pen and a growing sense of dread. Coffee, you discover, is a lifestyle.', 'Bir defter, bir kalem ve büyüyen bir endişe. Kahvenin bir yaşam tarzı olduğunu keşfediyorsun.'],
    options: [
      { id: 'cut', label: ['Cut the waste you find', 'Bulduğun israfı kes'], usd: 200, stats: { smarts: 2, happiness: -1 }, tone: 'good', result: ['You found a subscription to a service you had forgotten you had. It had been there for two years. You cancelled it with the satisfaction of an assassin.', 'Var olduğunu unuttuğun bir hizmete abonelik buldun. İki yıldır oradaydı. Bir suikastçının tatminiyle iptal ettin.'] },
      { id: 'know', label: ['Just know the numbers, change nothing', 'Sadece rakamları bil, hiçbir şeyi değiştirme'], stats: { smarts: 1, happiness: 1 }, result: ['Knowing was enough. You felt calmer, as if you had finally looked under the bed.', 'Bilmek yetti. Sonunda yatağın altına bakmış gibi sakinleştin.'] },
    ],
  },
  {
    ...M, id: 'prop.gold', ages: [24, 85], cooldown: 15,
    title: ['Relatives keep telling you to buy gold.', 'Akrabalar altın almanı söyleyip duruyor.'],
    text: ['“Gold never lets you down,” says your aunt, wearing three bracelets that say otherwise.', '“Altın hiç yüz üstü bırakmaz” diyor teyzen; takılı üç bilezik başka bir şey söylüyor.'],
    options: [
      { id: 'buy', label: ['Buy a small amount', 'Küçük bir miktar al'], usd: -400, stats: { smarts: 1, happiness: 2 }, result: ['You bought a few small coins and put them in a cloth bag. It feels like owning a secret.', 'Birkaç küçük para alıp bir bez torbaya koydun. Bir sır sahibi olmak gibi.'] },
      { id: 'skip', label: ['Smile and change the subject', 'Gülümse ve konuyu değiştir'], stats: { happiness: 1 }, result: ['You asked about her bracelets instead. The next half hour was a history of every wedding in the family.', 'Onun yerine bileziklerini sordun. Sonraki yarım saat ailedeki her düğünün tarihçesiydi.'] },
    ],
  },
  // ---------------------------------------------------------------- land and homes
  {
    ...M, id: 'prop.land', ages: [30, 75], once: true,
    title: ['A plot of land outside town is offered at a good price.', 'Kasaba dışında bir arsa iyi bir fiyata sunuluyor.'],
    text: ['It has a view, an old well and a goat that comes with the deal. There is no building permit and no map, only hope.', 'Manzarası, eski bir kuyusu ve anlaşmayla birlikte gelen bir keçisi var. İmar izni ve harita yok; sadece umut var.'],
    options: [
      { id: 'buy', label: ['Buy it', 'Satın al'], usd: -4000, flags: ['prop_land'], stats: { happiness: 4 }, tone: 'big', result: ['You stood in the field and felt at home. The goat looked at you with a calm that you will never match.', 'Tarlada durup kendini evinde hissettin. Keçi sana, asla yakalayamayacağın bir sakinlikle baktı.'] },
      { id: 'visit', label: ['Visit it on weekends instead', 'Onun yerine hafta sonları ziyaret et'], stats: { happiness: 2 }, result: ['You walked the boundary twice and had a picnic. Someone else bought it, and you think about the goat.', 'Sınırı iki kez yürüdün ve piknik yaptın. Başkası satın aldı, sen de keçiyi düşünüyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.rezone', ages: [32, 90], once: true, when: (c) => since(c, 'prop_land') >= 4,
    title: ['The council has rezoned the area around your land.', 'Belediye arsanın çevresindeki bölgeyi yeniden imara açtı.'],
    text: ['Two developers have come to look at it, and one of them has brought a hard hat and a colleague with a drone.', 'İki müteahhit bakmaya geldi; biri baret ve dron getiren bir meslektaşla gelmiş.'],
    options: [
      { id: 'sell', label: ['Sell at the new price', 'Yeni fiyattan sat'], usd: 15000, stats: { happiness: 4 }, tone: 'good', result: ['It sold for more than you paid and more than you had dared to dream. The goat went to a nearby farm and is, by all accounts, happy.', 'Ödediğinden de, hayal etmeye cesaret ettiğinden de fazlaya satıldı. Keçi yakındaki bir çiftliğe gitti ve herkese göre mutlu.'] },
      { id: 'keep', label: ['Keep it for the family', 'Aile için tut'], stats: { happiness: 2 }, result: ['You said no twice, then thanked them. The land stays as it was. For some reason this feels like a decision about who you are.', 'İki kez hayır dedin, sonra teşekkür ettin. Arazi olduğu gibi kalıyor. Nedense bu, kim olduğuna dair bir karar gibi geliyor.'] },
    ],
  },
  {
    ...M, id: 'prop.boundary', ages: [32, 90], once: true, when: (c) => since(c, 'prop_land') >= 1,
    title: ['A neighbour says your fence is two metres onto his land.', 'Bir komşu çitinin iki metre kendi arazisine girdiğini söylüyor.'],
    text: ['He has a map. You have a feeling. The old man who built the fence died in 1987.', 'Onun bir haritası var. Senin bir önsezin. Çiti yapan yaşlı adam 1987’de ölmüş.'],
    options: [
      { id: 'surveyor', label: ['Hire a surveyor to settle it', 'Kesinleştirmek için harita mühendisi tut'], usd: -250, stats: { smarts: 2 }, result: ['The surveyor measured for two hours and said, “You are both slightly wrong.” You split the difference and the cost, and drank tea on the fence.', 'Mühendis iki saat ölçtü ve “İkiniz de biraz yanlışsınız” dedi. Farkı ve masrafı bölüştünüz ve çitin üstünde çay içtiniz.'] },
      { id: 'move', label: ['Move the fence and be done', 'Çiti kaydır ve bitir'], stats: { happiness: 2 }, result: ['It took one Saturday and a friend with a van. The neighbour sent a bag of walnuts. You still suspect the map was wrong.', 'Bir cumartesi ve minibüslü bir arkadaş sürdü. Komşu bir torba ceviz gönderdi. Hâlâ haritanın yanlış olduğundan şüphelisin.'] },
    ],
  },
  {
    ...M, id: 'prop.land_scam', ages: [28, 80], once: true,
    title: ['A smooth man offers you a plot “at a once-in-a-lifetime price”.', 'Kibar bir adam sana “hayatta bir kez karşına çıkacak bir fiyata” arsa öneriyor.'],
    text: ['He has a binder, a pen and a suspicious number of brochures. The land is, strictly speaking, in a different country.', 'Elinde bir dosya, bir kalem ve şüpheli sayıda broşür var. Arsa, tam olarak, başka bir ülkede.'],
    options: [
      { id: 'check', label: ['Ask for the deed and check it', 'Tapuyu iste ve kontrol et'], stats: { smarts: 3 }, tone: 'good', result: ['The deed was a photocopy of a photocopy, with a coffee ring in the corner. The man discovered an urgent appointment.', 'Tapu bir fotokopinin fotokopisiydi ve köşesinde kahve izi vardı. Adamın acil bir randevusu çıktı.'] },
      { id: 'trust', label: ['Pay a deposit, to hold it', 'Tutmak için kapora öde'], usd: -1500, stats: { happiness: -4 }, tone: 'bad', result: ['The number you called rang for a long time and then did not ring at all. You now know a lot about land fraud and a little about bitterness.', 'Aradığın numara uzun uzun çaldı, sonra hiç çalmadı. Artık arazi dolandırıcılığı hakkında çok, acılık hakkında biraz şey biliyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.summer_house', ages: [40, 80], once: true,
    title: ['A small house by the sea comes on the market.', 'Denizin kenarında küçük bir ev satışa çıkıyor.'],
    text: ['It has a porch, a leak and a view of boats. The owner moves slowly and answers questions with “well, you know”.', 'Bir sundurması, bir sızıntısı ve tekne manzarası var. Sahibi yavaş hareket ediyor ve sorulara “eh, bilirsin” diye cevap veriyor.'],
    options: [
      { id: 'buy', label: ['Buy it for summers', 'Yazlık olarak al'], usd: -9000, flags: ['prop_summer'], stats: { happiness: 7, health: 1 }, tone: 'big', result: ['The first evening on the porch was so quiet that you checked whether the world was still there. The leak is charming, so far.', 'Sundurmadaki ilk akşam o kadar sessizdi ki dünyanın hâlâ orada olup olmadığına baktın. Sızıntı şimdilik çekici.'] },
      { id: 'dream', label: ['Keep the dream in a drawer and save up', 'Hayali çekmeceye koy ve biriktir'], stats: { happiness: 2, smarts: 1 }, result: ['You put the brochure with the boats on it in the drawer with the other brochures. Every few months you take it out, like a very small holiday.', 'Tekneli broşürü öbür broşürlerin yanına çekmeceye koydun. Birkaç ayda bir çıkarıp bakıyorsun; çok küçük bir tatil gibi.'] },
    ],
  },
  {
    ...M, id: 'prop.bubble', ages: [28, 70], cooldown: 15,
    title: ['Everyone you know is buying a flat they cannot afford.', 'Tanıdığın herkes alamayacağı bir daire alıyor.'],
    text: ['At every dinner, someone says “prices only go up”. You have heard that one before, usually just before they did not.', 'Her akşam yemeğinde biri “fiyatlar hep yükselir” diyor. Bunu daha önce duydun; genelde yükselmedikleri zamanın hemen öncesinde.'],
    options: [
      { id: 'wait', label: ['Stay out and keep a cushion', 'Dışında kal ve yastığını koru'], stats: { smarts: 2, happiness: 1 }, tone: 'good', result: ['Two years later, the conversation changed. You did not say “I told you so”. You thought it quite loudly.', 'İki yıl sonra konuşma değişti. “Ben demiştim” demedin. Çok yüksek sesle düşündün.'] },
      { id: 'jump', label: ['Buy in with a large loan', 'Büyük bir krediyle gir'], usd: -2000, stats: { happiness: -3 }, tone: 'bad', result: ['The first year was a party. The second year, the interest rate came, and the third was a quiet, expensive one.', 'İlk yıl bir partiydi. İkinci yıl faiz oranı geldi, üçüncü yıl sessiz ve pahalıydı.'] },
    ],
  },
  {
    ...M, id: 'prop.refinance', ages: [32, 80], once: true,
    title: ['Your bank calls about your mortgage.', 'Bankan kredin hakkında arıyor.'],
    text: ['“We can offer you better terms,” says a voice that sounds as if it has said this before. It has.', '“Size daha iyi şartlar sunabiliriz” diyor; bunu daha önce söylemiş gibi bir ses. Söylemiş.'],
    options: [
      { id: 'read', label: ['Read the terms line by line', 'Şartları satır satır oku'], usd: 600, stats: { smarts: 2 }, result: ['Page six had a fee larger than the saving. Page seven had a better deal from a different bank. You moved.', 'Altıncı sayfada tasarruftan büyük bir ücret vardı. Yedinci sayfada başka bir bankadan daha iyi bir teklif. Taşındın.'] },
      { id: 'hangup', label: ['Say you are not interested', 'İlgilenmediğini söyle'], stats: { happiness: 1 }, result: ['The line went quiet in a hurt way. Your mortgage stayed what it was, which is a form of peace.', 'Hat kırgın bir şekilde sustu. Kredin olduğu gibi kaldı; bu da bir tür huzur.'] },
    ],
  },
  {
    ...M, id: 'prop.insure', ages: [28, 85], once: true,
    title: ['Your insurer asks whether you want to add flood and fire cover.', 'Sigortacın sele ve yangına karşı teminat eklemek isteyip istemediğini soruyor.'],
    text: ['It costs about the price of a nice dinner each month. You have never had a fire. Neither has anyone, until they do.', 'Her ay güzel bir akşam yemeği fiyatına mal oluyor. Hiç yangın geçirmedin. Kimse geçirmemiştir, geçirene kadar.'],
    options: [
      { id: 'add', label: ['Add the cover', 'Teminatı ekle'], usd: -180, stats: { smarts: 1, happiness: 1 }, result: ['You sleep a little better, which is hard to put in a spreadsheet and easy to feel.', 'Biraz daha iyi uyuyorsun; bunu bir tabloya koymak zor, hissetmek kolay.'] },
      { id: 'risk', label: ['Take the risk', 'Riski göze al'], stats: { happiness: 1 }, result: ['Nothing happened. For now, you are winning an argument with probability.', 'Hiçbir şey olmadı. Şimdilik olasılıkla bir tartışmayı kazanıyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.auction', ages: [30, 75], once: true,
    title: ['A house is going to auction at a low reserve price.', 'Bir ev düşük bir açılış fiyatıyla müzayedeye çıkıyor.'],
    text: ['The auctioneer is quick, the crowd is nervous and the house has a tree growing through the kitchen floor.', 'Müzayedeci hızlı, kalabalık gergin ve evin mutfak zemininden bir ağaç çıkıyor.'],
    options: [
      { id: 'watch', label: ['Go along and watch', 'Git ve izle'], stats: { smarts: 2, happiness: 1 }, result: ['It sold for three times the reserve. The tree was not mentioned. You left with a new respect for people who raise their hand.', 'Açılış fiyatının üç katına satıldı. Ağaçtan söz edilmedi. Elini kaldıranlara yeni bir saygıyla ayrıldın.'] },
      { id: 'bid', label: ['Bid, with a hard limit', 'Katı bir sınırla teklif ver'], usd: -3500, flags: ['prop_auction'], stats: { smarts: 1, happiness: 2 }, result: ['You stopped exactly at your limit and won, to your own astonishment. The tree is the first thing you will have removed.', 'Tam sınırında durdun ve kendi şaşkınlığına rağmen kazandın. Ağaç, kaldırtacağın ilk şey olacak.'] },
    ],
  },
  {
    ...M, id: 'prop.estate_gift', ages: [58, 90], once: true,
    when: (c) => c.h.relatives('child').length > 0,
    title: ['You consider giving a property to your children while you are alive.', 'Hayattayken çocuklarına bir mülk devretmeyi düşünüyorsun.'],
    text: ['A lawyer says it could save tax and arguments. She says the arguments are the bigger saving.', 'Bir avukat bunun vergiden ve tartışmadan tasarruf sağlayabileceğini söylüyor. Tartışmaların daha büyük tasarruf olduğunu söylüyor.'],
    options: [
      { id: 'gift', label: ['Transfer it now, with a clear letter', 'Şimdi, net bir mektupla devret'], usd: -400, stats: { happiness: 4, smarts: 1 }, closeness: { kinds: ['child'], delta: 6 }, tone: 'good', result: ['The children read the letter twice. One of them said, “You are not going anywhere, are you?” You said, “Not yet.” It was a good evening.', 'Çocuklar mektubu iki kez okudu. Biri “Bir yere gitmiyorsun, değil mi?” dedi. “Henüz değil” dedin. İyi bir akşamdı.'] },
      { id: 'hold', label: ['Keep it in your name for now', 'Şimdilik senin adında kalsın'], stats: { happiness: 1 }, result: ['The lawyer made a note. You made a note. Neither note mentioned the word “soon”.', 'Avukat bir not aldı. Sen bir not aldın. İki notta da “yakında” kelimesi geçmiyordu.'] },
    ],
  },
  {
    ...M, id: 'prop.downsize', ages: [64, 95], once: true,
    title: ['The house feels too big, and the stairs too steep.', 'Ev fazla büyük, merdivenler fazla dik geliyor.'],
    text: ['You walk through rooms nobody uses. Each has a memory, a lampshade and some dust.', 'Kimsenin kullanmadığı odalarda dolaşıyorsun. Her birinin bir anısı, bir abajuru ve biraz tozu var.'],
    options: [
      { id: 'move', label: ['Sell and move somewhere smaller', 'Sat ve daha küçük bir yere taşın'], usd: 6000, stats: { happiness: 3, health: 2 }, tone: 'good', result: ['It took six months and forty-one boxes. The new place has no stairs and a kitchen window onto the street. You discovered you liked watching people go by.', 'Altı ay ve kırk bir koli sürdü. Yeni yerde merdiven yok ve mutfak penceresi sokağa bakıyor. İnsanların geçişini izlemeyi sevdiğini keşfettin.'] },
      { id: 'stay', label: ['Stay, and close off the top floor', 'Kal ve üst katı kapat'], stats: { happiness: 1, health: -1 }, result: ['The top floor is now a museum of your own life. You visit it on Sundays, like a polite stranger.', 'Üst kat artık kendi hayatının müzesi. Pazarları kibar bir yabancı gibi ziyaret ediyorsun.'] },
    ],
  },
  {
    ...M, id: 'prop.coowned', ages: [35, 85], once: true,
    when: (c) => c.h.relatives('sibling').length > 0,
    title: ['You and your siblings still own your parents’ flat together.', 'Sen ve kardeşlerin hâlâ ailenin dairesinin ortak sahipleri.'],
    text: ['It sits empty. Nobody pays the bills on time. Everybody has an opinion and nobody has a key.', 'Boş duruyor. Faturaları kimse zamanında ödemiyor. Herkesin fikri var, kimsenin anahtarı yok.'],
    options: [
      { id: 'sort', label: ['Call a meeting and decide properly', 'Toplantı yap ve düzgünce karar ver'], usd: -150, stats: { smarts: 2, happiness: 2 }, closeness: { kinds: ['sibling'], delta: 4 }, tone: 'good', result: ['Four hours, one spreadsheet and a lot of tea. In the end the flat was let and the rent split equally. Nobody cried, which was a record.', 'Dört saat, bir tablo ve bol çay. Sonunda daire kiraya verildi ve kira eşit bölündü. Kimse ağlamadı; bir rekordu.'] },
      { id: 'drift', label: ['Let it drift another year', 'Bir yıl daha kendi hâline bırak'], stats: { happiness: -1 }, closeness: { kinds: ['sibling'], delta: -2 }, result: ['The flat grew a faint smell of neglect. Nobody was happy, and everyone was careful not to say so.', 'Daire hafif bir ihmal kokusu edindi. Kimse mutlu değildi ve herkes bunu söylememeye dikkat etti.'] },
    ],
  },
];

export const propertyEvents: EventDef[] = PROPERTY.map(quickEvent);
