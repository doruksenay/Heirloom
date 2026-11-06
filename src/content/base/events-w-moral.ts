import type { Ctx, EventDef } from '../types';
import { hasCar } from './street-cars';
import { hasFriend, hasSibling, near, nmc, opt, out, pickFriend, pickSibling, kw, Kw } from './young-kit';
import { wage } from './util';

// Moral wave: conscience against advantage, and what the family name is worth (ids base.mr_*).
// Money goes through young-kit's fx (scaled by the country's wage factor); costs sit behind `afford`.
// Randomness: only c.rng, the same number of calls in every language. Effects: stats, money, closeness, and
// dynasty.legacyScore for the moments that touch the family name.

const lg = (c: Ctx, n: number) => {
  c.s.dynasty.legacyScore += n;
};
const afford = (usd: number) => ({ requires: (c: Ctx) => c.p.money >= wage(c, usd), requiresLabel: 'Not enough money' });
const adult = (c: Ctx) => c.p.jailYears === 0;
const employed = (c: Ctx) => !!c.p.jobId && !c.p.retired;
const b = { category: 'random' as const, cooldown: 6, maxPerLife: 2 };

const partA: EventDef[] = [
  {
    ...b,
    id: 'base.mr_lost_bag',
    minAge: 12,
    weight: 40,
    title: (c) => c.t('A bag on the bus seat', 'Otobüs koltuğunda bir çanta'),
    text: (c) => c.t('Everyone has got off. A tidy bag is left on the seat, and it clearly holds a laptop and an envelope. The driver is watching the mirror.', 'Herkes inmiş. Koltukta düzgün bir çanta kalmış; içinde belli ki bir dizüstü bilgisayar ve bir zarf var. Şoför dikiz aynasından bakıyor.'),
    choices: [
      opt('hand', ['Hand it to the driver', 'Şoföre teslim et'], (c) => out(c, { hap: 3 }, 'You hand it over. The driver nods like you did the obvious thing, which is the nicest way anyone has said "thank you" all month.', 'Çantayı veriyorsun. Şoför, bariz olanı yapmışsın gibi başını sallıyor; bu ay duyduğun en kibar teşekkür.'), { tone: 'good' }),
      opt('look', ['Look inside for a name', 'İçine bakıp isim ara'], (c) => {
        if (c.rng.chance(0.6)) {
          lg(c, 2);
          return out(c, { hap: 4, usd: 60 }, 'A business card, a phone call, a very relieved stranger. They insist on a reward and you accept it, after a brief and dignified argument.', 'Bir kartvizit, bir telefon, çok rahatlamış bir yabancı. Ödül vermekte ısrar ediyor, kısa ve onurlu bir itirazdan sonra kabul ediyorsun.');
        }
        return out(c, { hap: -1 }, 'No name anywhere. You carry it to the lost-property desk and spend an hour waiting for a clerk to find the form. Good deed, bad afternoon.', 'Hiçbir yerde isim yok. Çantayı kayıp eşya bürosuna götürüp memurun formu bulmasını bir saat bekliyorsun. İyi iş, kötü öğleden sonra.');
      }),
      opt('keep', ['Keep it', 'Çantayı al'], (c) => {
        c.h.stat('happiness', -3);
        return out(c, { usd: 140 }, 'You sell the laptop on a forum. The envelope was somebody\'s medical papers; you read them before you could stop yourself, and you cannot unread them.', 'Dizüstüyü bir ilan sitesinde satıyorsun. Zarf birinin sağlık evraklarıymış; durduramadan okuyorsun ve bir daha unutamıyorsun.');
      }, { badge: 'Risky', tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_cheat_exam',
    minAge: 14,
    maxAge: 26,
    weight: 150,
    needs: ['student'],
    title: (c) => c.t('The answers are going round', 'Cevaplar elden ele dolaşıyor'),
    text: (c) => c.t('The night before a big exam, a photo of the answer sheet starts going round the group chat. Half the class has seen it. The other half is pretending not to.', 'Önemli bir sınavın arifesinde, cevap anahtarının fotoğrafı grup sohbetinde dolaşmaya başlıyor. Sınıfın yarısı görmüş. Diğer yarısı görmemiş gibi yapıyor.'),
    choices: [
      opt('copy', ['Memorise the sheet', 'Anahtarı ezberle'], (c) => {
        if (c.rng.chance(0.4)) {
          c.h.flag('mr_cheated');
          return out(c, { hap: -5, sma: -1 }, 'The sheet turns out to be a different version. You answer confidently, wrongly, and the teacher looks at you for a long, quiet moment. Zero.', 'Anahtar başka bir sınav versiyonuymuş. Kendinden emin ve yanlış cevaplıyorsun; öğretmen uzun, sessiz bir an sana bakıyor. Sıfır.');
        }
        return out(c, { hap: 1, sma: -1 }, 'It works. A high mark, a stomach that feels like wet cement, and a lesson learned by someone else.', 'İşe yarıyor. Yüksek bir not, ıslak çimento gibi bir mide ve başkasına ait bir ders.');
      }, { badge: 'Risky', tone: 'bad' }),
      opt('ignore', ['Study the honest way', 'Dürüstçe çalış'], (c) => out(c, { sma: 2, hap: 1 }, 'You close the chat and read your notes until two. The mark is middling and entirely yours.', 'Sohbeti kapatıp sabaha karşı ikiye kadar notlarına çalışıyorsun. Not ortalama ama tamamen senin.'), { tone: 'good' }),
      opt('tell', ['Tell the teacher', 'Öğretmene haber ver'], (c) => {
        if (c.rng.chance(0.5)) {
          lg(c, 2);
          return out(c, { hap: 2, sma: 1 }, 'The exam is quietly swapped. Nobody ever finds out who told, and you walk past the whole class with a perfectly straight face.', 'Sınav sessizce değiştiriliyor. Kimin söylediğini kimse bilmiyor; bütün sınıfın yanından dümdüz bir yüzle geçiyorsun.');
        }
        return out(c, { hap: -4 }, 'Somebody guesses who told. For a month, seats near you stay empty and the lunch table gets very quiet.', 'Biri kimin söylediğini tahmin ediyor. Bir ay boyunca yanındaki sıralar boş kalıyor, yemekhane masası çok sessizleşiyor.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_dumping',
    minAge: 20,
    weight: 35,
    title: (c) => c.t('Rubbish in the empty lot', 'Boş arsada moloz'),
    text: (c) => c.t('From your window you watch a neighbour tip a whole van of builders\' rubble into the empty lot at the end of the street. He sees you. He lifts a hand, friendly, as if you were both in on it.', 'Pencerenden bir komşunun koca bir kamyonet dolusu inşaat molozunu sokak başındaki boş arsaya boşalttığını izliyorsun. Seni görüyor. Sanki ikiniz de işin içindeymişsiniz gibi dostça el sallıyor.'),
    choices: [
      opt('talk', ['Go and talk to him', 'Gidip konuş'], (c) => {
        if (c.rng.chance(0.55)) return out(c, { hap: 3 }, 'He goes red, mumbles, and the van is back the next morning to clear it. By the weekend he brings you tomatoes in apology.', 'Kızarıp mırıldanıyor; ertesi sabah kamyonet geri gelip arsayı temizliyor. Hafta sonu özür niyetine sana domates getiriyor.');
        return out(c, { hap: -3 }, 'He tells you to mind your own business, and then, for emphasis, stops saying good morning. The rubble stays.', 'Sana kendi işine bakmanı söylüyor, sonra vurgu olsun diye günaydın demeyi bırakıyor. Moloz yerinde duruyor.');
      }, { badge: 'Risky' }),
      opt('report', ['Report it, no name given', 'İsimsiz ihbar et'], (c) => out(c, { hap: 1 }, 'A fine arrives within a month and the lot is cleared. He suspects everyone on the street equally, which is a kind of fairness.', 'Bir ay içinde ceza geliyor ve arsa temizleniyor. Sokaktaki herkesten eşit derecede şüpheleniyor; bu da bir tür adalet.'), { tone: 'good' }),
      opt('shrug', ['Mind your own business', 'Karışma'], (c) => out(c, { hap: -1 }, 'You pull the curtain. By spring the pile has grown a tree, two tyres and a sofa.', 'Perdeyi çekiyorsun. Bahara kalmadan yığının üstünde bir ağaç, iki lastik ve bir koltuk bitiyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_books',
    minAge: 22,
    maxAge: 64,
    weight: 45,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('The numbers do not add up', 'Rakamlar tutmuyor'),
    text: (c) => c.t('Doing a routine report, you notice the same invoice paid twice, and a supplier nobody has ever met. Someone senior has signed both. You are the only one who has looked.', 'Rutin bir rapor hazırlarken aynı faturanın iki kez ödendiğini ve kimsenin tanımadığı bir tedarikçiyi fark ediyorsun. İkisini de kıdemli biri imzalamış. Bakan tek kişi sensin.'),
    choices: [
      opt('report', ['Report it officially', 'Resmen bildir'], (c) => {
        if (c.rng.chance(0.55)) {
          lg(c, 6);
          c.h.flag('mr_whistleblower');
          return out(c, { hap: 3, usd: 400 }, 'An audit follows. Someone leaves with a box. You are thanked in a meeting, quietly given a bonus, and avoided in the corridor for about a year.', 'Bir denetim başlıyor. Biri elinde bir kutuyla ayrılıyor. Toplantıda teşekkür ediliyor, sessizce prim alıyorsun ve bir yıl kadar koridorda senden kaçınılıyor.');
        }
        c.h.flag('mr_whistleblower');
        return out(c, { hap: -5, usd: -300 }, 'It was buried, and you were not. You are moved to a corner desk with a view of the printer. Principles, it turns out, have a cost, and it is billed monthly.', 'Konu örtbas ediliyor, sen edilmiyorsun. Yazıcıya bakan köşe bir masaya alınıyorsun. İlkelerin bir bedeli varmış; her ay fatura ediliyor.');
      }, { badge: 'Risky', tone: 'big' }),
      opt('ask', ['Ask the signer quietly', 'İmzalayana sessizce sor'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: 1 }, '"A clerical error," he says, and fixes it that afternoon. Maybe it was. You will keep checking.', '"Yazım hatası," diyor ve öğleden sonra düzeltiyor. Belki öyleydi. Bakmaya devam edeceksin.');
        return out(c, { hap: -3, usd: 250 }, 'He smiles, says you are very sharp, and your next bonus is surprisingly generous. You understand the offer and do not touch it. Not yet.', 'Gülümseyip çok zeki olduğunu söylüyor, bir sonraki priminiz şaşırtıcı derecede cömert. Teklifi anlıyorsun ve dokunmuyorsun. Henüz.');
      }),
      opt('silent', ['Say nothing', 'Sus'], (c) => out(c, { hap: -2 }, 'You close the file. Three months later the supplier is in the news. You read the article in the lift, looking at nobody.', 'Dosyayı kapatıyorsun. Üç ay sonra tedarikçi haberlere çıkıyor. Yazıyı asansörde, kimseye bakmadan okuyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_bribe',
    minAge: 24,
    maxAge: 75,
    weight: 30,
    title: (c) => c.t('A gift for the inspector', 'Müfettişe küçük bir hediye'),
    text: (c) => c.t('Your permit has been stuck for four months. An official taps the folder, looks at the ceiling and mentions that things move faster "when people are thoughtful". Thoughtful has a price.', 'Ruhsatın dört aydır bekliyor. Bir memur dosyaya parmağıyla vuruyor, tavana bakıyor ve işlerin "insanlar nazik davrandığında" daha hızlı yürüdüğünü söylüyor. Naziğin bir fiyatı var.'),
    choices: [
      opt('pay', [`Slip the envelope`, 'Zarfı uzat'], (c) => {
        c.h.flag('mr_paid_bribe');
        if (c.rng.chance(0.25)) return out(c, { hap: -6, usd: -400 }, 'Someone was recording. A hearing, a fine, and a family name that now comes up in the wrong kind of conversation.', 'Biri kayıt alıyormuş. Bir duruşma, bir para cezası ve artık yanlış tür sohbetlerde anılan bir soyadı.');
        return out(c, { hap: 2, usd: -150 }, 'The stamp lands the next day. It was so easy that you feel worse about it than you expected.', 'Mühür ertesi gün vuruluyor. O kadar kolay oldu ki, beklediğinden de kötü hissediyorsun.');
      }, { badge: 'Illegal', tone: 'bad' }),
      opt('wait', ['Refuse and wait it out', 'Reddet, sabırla bekle'], (c) => { lg(c, 3); return out(c, { hap: -1, usd: -100 }, 'Four more months, three more queues and one very patient lawyer. You get the permit and a clean conscience that you cannot spend.', 'Dört ay, üç kuyruk ve çok sabırlı bir avukat daha. Ruhsatı ve harcayamayacağın temiz bir vicdanı alıyorsun.'); }, { tone: 'good' }),
      opt('report', ['Report him', 'Şikâyet et'], (c) => {
        if (c.rng.chance(0.5)) { lg(c, 6); return out(c, { hap: 3 }, 'He is moved to another office, and the permit comes through in a week. A neighbour you barely know shakes your hand at the bakery.', 'Başka bir birime alınıyor, ruhsat bir haftada çıkıyor. Pek tanımadığın bir komşu fırında elini sıkıyor.'); }
        return out(c, { hap: -3 }, 'Nothing happens to him. Everything slows down for you. The folder, you notice, has migrated to the bottom of a different pile.', 'Ona hiçbir şey olmuyor. Senin için her şey yavaşlıyor. Dosya başka bir yığının en altına göç etmiş.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_lend_friend',
    minAge: 20,
    weight: 40,
    needs: [],
    when: (c) => hasFriend(c) && adult(c),
    setup: (c) => pickFriend(c),
    title: (c) => c.t('A loan between friends', 'Dostlar arasında borç'),
    text: (c) => c.t(`${nmc(c, 'fr')} sits down opposite you, stirs a coffee that has no sugar in it, and finally says it: rent, a bad month, a promise to pay back by spring. You know how many springs that promise has seen.`, `${nmc(c, 'fr')} karşına oturuyor, şekersiz kahvesini karıştırıp duruyor, sonunda söylüyor: kira, kötü bir ay, bahara kadar geri ödeme sözü. O sözün kaç bahar gördüğünü biliyorsun.`),
    choices: [
      opt('all', ['Lend all of it', 'Tamamını borç ver'], (c) => {
        near(c, 'fr', 6);
        if (c.rng.chance(0.55)) return out(c, { hap: 4, usd: -200 }, `${nmc(c, 'fr')} pays back in full, in cash, early, with a cake. You feel faintly foolish for ever having doubted.`, `${nmc(c, 'fr')} borcu tam, nakit ve erken ödüyor, üstüne bir de pasta getiriyor. Şüphe ettiğin için hafifçe mahcup oluyorsun.`);
        near(c, 'fr', -10);
        return out(c, { hap: -4, usd: -350 }, `The spring comes and goes. ${nmc(c, 'fr')} starts crossing the street when you appear. The money is gone, and so is something else.`, `Bahar geliyor ve geçiyor. ${nmc(c, 'fr')} seni görünce karşıya geçmeye başlıyor. Para gitti, başka bir şey de gitti.`);
      }, { badge: 'Risky', ...afford(350) }),
      opt('half', ['Lend half, call it a gift', 'Yarısını ver, hediye say'], (c) => { near(c, 'fr', 4); return out(c, { hap: 2, usd: -150 }, 'You hand over what you can afford to lose and say "no rush" in a voice that means it. It is never mentioned again, which is exactly the point.', 'Kaybetmeyi göze alabileceğin kadarını uzatıp "acele yok" diyorsun, içtenlikle. Bir daha hiç konuşulmuyor; tam da amaç buydu.'); }, { tone: 'good', ...afford(150) }),
      opt('no', ['Say no, kindly', 'Nazikçe hayır de'], (c) => { near(c, 'fr', -3); return out(c, { hap: -2 }, 'You explain that you do not mix money and friends. It is true, and it still sounds like a closed door. They nod. The coffee goes cold.', 'Para ile dostluğu karıştırmadığını anlatıyorsun. Doğru ama yine de kapanan bir kapı gibi geliyor. Başını sallıyor. Kahve soğuyor.'); }),
    ],
  },
  {
    ...b,
    id: 'base.mr_charity_ask',
    minAge: 18,
    weight: 50,
    title: (c) => c.t('The collection tin', 'Yardım kumbarası'),
    text: (c) => c.t('A volunteer with a laminated badge and a very tired smile asks if you can spare something for the local children\'s ward. A queue is forming behind you.', 'Plastik kartlı ve çok yorgun gülümsemeli bir gönüllü, yerel çocuk servisi için bir şey verip veremeyeceğini soruyor. Arkanda kuyruk birikiyor.'),
    choices: [
      opt('big', ['Give generously', 'Cömertçe ver'], (c) => { lg(c, 2); return out(c, { hap: 4, usd: -80 }, 'You press a real note into the tin. The queue behind you quietly does the same. Nobody planned it.', 'Kumbaraya gerçek bir banknot bırakıyorsun. Arkandaki kuyruk da sessizce aynısını yapıyor. Kimse planlamamıştı.'); }, { tone: 'good', ...afford(80) }),
      opt('coins', ['Drop in the loose change', 'Bozuk parayı at'], (c) => out(c, { hap: 1, usd: -3 }, 'The coins clink. Small, honest and over in four seconds.', 'Bozukluklar şıngırdıyor. Küçük, dürüst ve dört saniyede bitti.')),
      opt('pass', ['Pretend to check your phone', 'Telefona bakıyormuş gibi yap'], (c) => out(c, { hap: -2 }, 'You become fascinated by the screen. You feel the smile follow you out of the shop all the way home.', 'Ekrana son derece ilgi duyuyorsun. Gülümseme seni dükkândan eve kadar takip ediyor gibi.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_jury',
    minAge: 21,
    maxAge: 72,
    weight: 35,
    cooldown: 10,
    maxPerLife: 1,
    when: adult,
    title: (c) => c.t('Summoned to sit in judgement', 'Hâkim koltuğunun yanına çağrıldın'),
    text: (c) => c.t('A court letter: you are called to serve on a panel in a theft trial. The pay is a joke, the room smells of old carpet and the defendant looks about nineteen.', 'Mahkemeden bir mektup: bir hırsızlık davasında heyet üyeliğine çağrıldın. Ücret şaka gibi, oda eski halı kokuyor ve sanık on dokuz yaşında görünüyor.'),
    choices: [
      opt('serve', ['Serve and weigh it carefully', 'Görevi üstlen, dikkatle tart'], (c) => {
        c.h.stat('smarts', 1);
        if (c.rng.chance(0.5)) { lg(c, 3); return out(c, { hap: 2, usd: 30 }, 'You argue for a lighter sentence and the others come round. The young man looks at you as he is led out. You will think about that look for years.', 'Daha hafif bir ceza için tartışıyorsun ve diğerleri ikna oluyor. Genç adam çıkarılırken sana bakıyor. O bakışı yıllarca düşüneceksin.'); }
        return out(c, { hap: -2, usd: 30 }, 'The evidence is clear, the verdict is guilty, and you do not sleep well. Doing your duty and feeling good about it turn out to be separate things.', 'Kanıtlar açık, karar mahkûmiyet, ve iyi uyuyamıyorsun. Görevini yapmakla iyi hissetmek ayrı şeylermiş.');
      }, { tone: 'good' }),
      opt('dodge', ['Invent a reason to be excused', 'Mazeret uydur'], (c) => {
        if (c.rng.chance(0.3)) return out(c, { hap: -3, usd: -120 }, 'The judge asks for proof of your "sudden business trip". You have none. A fine and a stern lecture follow, for the price of one dull week.', 'Hâkim "ani iş seyahatinin" belgesini istiyor. Yok. Sıkıcı bir hafta yerine para cezası ve sert bir nutuk alıyorsun.');
        return out(c, { hap: 1 }, 'Excused. You spend the week on your sofa, with a small pocket of guilt that does not quite go away.', 'Muaf tutuldun. Haftayı kanepede geçiriyorsun, yanında bir türlü geçmeyen küçük bir vicdan azabıyla.');
      }, { badge: 'Risky' }),
      opt('lean', ['Convict fast and go home', 'Hemen mahkûm et, eve git'], (c) => out(c, { hap: -3, usd: 30 }, 'You sway two others with "he obviously did it". By four o\'clock you are on the bus. The thought that you did not read page three catches up with you at the traffic lights.', 'Diğer iki kişiyi "belli ki yapmış" diyerek ikna ediyorsun. Saat dörtte otobüstesin. Üçüncü sayfayı okumadığın fikri kırmızı ışıkta yakana yapışıyor.'), { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_witness',
    minAge: 18,
    weight: 35,
    when: adult,
    title: (c) => c.t('You saw the crash', 'Kazayı sen gördün'),
    text: (c) => c.t('A car jumped the lights and clipped a cyclist. It drove off. You were the only one at the stop. The police ask what you saw, and the cyclist\'s family is standing right behind them.', 'Bir araba kırmızıyı geçip bir bisikletliye çarptı ve kaçtı. Durakta tek sendin. Polis ne gördüğünü soruyor, bisikletlinin ailesi hemen arkalarında duruyor.'),
    choices: [
      opt('tell', ['Give a full statement', 'Tam ifade ver'], (c) => {
        if (c.rng.chance(0.6)) { lg(c, 3); return out(c, { hap: 3 }, 'Your description is exact; the driver is found within the week. The cyclist\'s mother sends you a letter you keep in a drawer.', 'Tarifin tam doğru; sürücü haftasına bulunuyor. Bisikletlinin annesi sana bir mektup yolluyor, çekmecede saklıyorsun.'); }
        return out(c, { hap: 1, usd: -40 }, 'Three hearings and two lost workdays later, the case is still open. You do not regret it, though your calendar does.', 'Üç duruşma ve iki kayıp iş gününden sonra dava hâlâ açık. Pişman değilsin, takvimin ise pişman.');
      }, { tone: 'good' }),
      opt('half', ['Say you only saw part of it', 'Sadece bir kısmını gördüğünü söyle'], (c) => out(c, { hap: -2 }, '"It was dark, I wasn\'t sure." It was not dark. The officer writes it down without looking up, and the family looks at you for a second too long.', '"Karanlıktı, emin değilim." Karanlık değildi. Memur başını kaldırmadan yazıyor, aile sana bir saniye fazla bakıyor.')),
      opt('nothing', ['Say you saw nothing', 'Hiçbir şey görmediğini söyle'], (c) => { c.h.stat('happiness', -5); return c.t('"I was looking at my phone." The case goes cold. Months later you pass the roadside flowers and find you have started taking the other pavement.', '"Telefonuma bakıyordum." Dosya soğuyor. Aylar sonra yol kenarındaki çiçeklerin önünden geçiyorsun ve artık karşı kaldırımı kullanmaya başladığını fark ediyorsun.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_fence',
    minAge: 28,
    weight: 130,
    needs: ['house'],
    title: (c) => c.t('Two feet of lawn', 'Bir karış toprak'),
    text: (c) => c.t('Your neighbour has put the new fence about two feet inside what you always thought was your garden. He is already planting beans against it. The old survey is in a drawer somewhere.', 'Komşun yeni çiti, hep kendi bahçen sandığın yerin iki karış içine çekmiş. Hatta dibine fasulye ekiyor. Eski harita bir çekmecede.'),
    choices: [
      opt('lawyer', ['Hire a surveyor', 'Mühendis tut'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: 3, usd: -150 }, 'The measurement is in your favour. The fence moves a weekend later, and the beans move with it, grudgingly.', 'Ölçüm senin lehine çıkıyor. Çit bir hafta sonu sonra kayıyor, fasulyeler de isteksizce onunla birlikte.');
        return out(c, { hap: -4, usd: -300 }, 'The surveyor is polite, thorough and wrong about nothing: the fence is exactly where it should be. You paid for the pleasure of being incorrect.', 'Mühendis kibar, titiz ve hata yapmıyor: çit tam olması gereken yerde. Haksız çıkma zevkine para ödedin.');
      }, { badge: 'Risky', ...afford(300) }),
      opt('talk', ['Have a long chat over the fence', 'Çitin üstünden uzun uzun konuş'], (c) => { c.h.stat('happiness', 3); return c.t('Forty minutes later you have agreed on nothing, borrowed a drill, been given a jar of pickles, and stopped caring about two feet of grass.', 'Kırk dakika sonra hiçbir şeyde anlaşmamışsınız, bir matkap ödünç almışsınız, bir kavanoz turşu hediye edilmiş ve bir karış çimen artık umurunda değil.'); }, { tone: 'good' }),
      opt('war', ['Move it back yourself at night', 'Geceleyin çiti kendin kaydır'], (c) => { lg(c, -2); return out(c, { hap: -4, usd: -100 }, 'By morning he has called the police, a lawyer and half the street. The beans, curiously, are now the safest thing on the street.', 'Sabaha kadar polisi, avukatını ve yarım mahalleyi aramış. Fasulyeler, garip biçimde, sokağın en güvenli şeyi.'); }, { badge: 'Risky', tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_cleanup',
    minAge: 14,
    weight: 40,
    title: (c) => c.t('Clean-up Saturday', 'Mahalle temizliği'),
    text: (c) => c.t('Someone has taped a flyer to every lamp-post: a neighbourhood clean-up on Saturday, gloves provided, hot drinks promised. The river bank looks like a bin that gave up.', 'Her elektrik direğine bir ilan yapıştırılmış: Cumartesi mahalle temizliği, eldiven verilecek, sıcak içecek söz. Nehir kıyısı vazgeçmiş bir çöp kutusuna benziyor.'),
    choices: [
      opt('go', ['Join in and stay till the end', 'Katıl, sonuna kadar kal'], (c) => { lg(c, 1); return out(c, { hap: 4, hea: 1 }, 'You fill nine bags and fish out a shopping trolley. At the end someone pours coffee into a paper cup. It is the best coffee you have had in months.', 'Dokuz torba dolduruyorsun, bir de market arabası çıkarıyorsun. Sonunda biri kâğıt bardağa kahve döküyor. Aylardır içtiğin en güzel kahve.'); }, { tone: 'good' }),
      opt('run', ['Organise the next one', 'Bir sonrakini sen düzenle'], (c) => { lg(c, 3); return out(c, { hap: 3, hea: 1 }, 'You find yourself with a clipboard and a megaphone, and a quiet reputation as the person who gets things done. It is mostly spreadsheets.', 'Elinde bir yoklama listesi ve megafonla buluyorsun kendini; sessizce işleri yürüten kişi olarak anılıyorsun. Çoğu tablo işi.'); }),
      opt('skip', ['Sleep in', 'Uyu kal'], (c) => out(c, { hap: 1 }, 'You sleep until ten. From your window the river looks clean by afternoon. Somebody else did it, which you notice.', 'Ona kadar uyuyorsun. Öğleden sonra pencereden nehir temiz görünüyor. Bunu başkası yapmış; bunu fark ediyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_petition',
    minAge: 18,
    weight: 30,
    title: (c) => c.t('A petition for the crossing', 'Yaya geçidi imza kampanyası'),
    text: (c) => c.t('Outside the school, a parent holds a clipboard: they want a proper crossing on the road where a child was nearly hit last month. The council says there is no money. They need four hundred names.', 'Okulun önünde bir veli elinde dosyayla duruyor: geçen ay bir çocuğun neredeyse çarpıldığı yola düzgün bir yaya geçidi istiyorlar. Belediye para yok diyor. Dört yüz imza gerekiyor.'),
    choices: [
      opt('sign', ['Sign it', 'İmzala'], (c) => { lg(c, 1); return out(c, { hap: 2 }, 'You sign. Six months later there is a crossing, and the first person you see using it is an elderly man who has no idea that you helped.', 'İmzalıyorsun. Altı ay sonra bir yaya geçidi çıkıyor ve onu ilk kullananlardan biri, sana borçlu olduğunu bilmeyen yaşlı bir adam.'); }),
      opt('collect', ['Collect signatures for a week', 'Bir hafta imza topla'], (c) => {
        if (c.rng.chance(0.6)) { lg(c, 4); return out(c, { hap: 5, hea: -1 }, 'You knock on doors until your voice goes. The council gives in at 412 signatures, with a photo of someone cutting a very small ribbon.', 'Sesin kısılana kadar kapı kapı dolaşıyorsun. Belediye 412 imzada pes ediyor; çok küçük bir kurdele kesen birinin fotoğrafı çekiliyor.'); }
        return out(c, { hap: -2, hea: -1 }, 'You reach 371 and the deadline passes. The clipboard goes into a drawer. Next year, you say. You mean it.', '371’e ulaşıyorsun ve süre doluyor. Dosya bir çekmeceye giriyor. Seneye, diyorsun. Gerçekten de diyorsun.');
      }, { badge: 'Risky', tone: 'good' }),
      opt('no', ['"Not my road"', '"Benim yolum değil"'], (c) => out(c, { hap: -1 }, 'You say you are in a hurry, which is true. You are not in a hurry the next time you cross that road.', 'Acelen var diyorsun, doğru. Bir sonraki sefere o yolu geçerken acelen yok.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_local_vote',
    minAge: 21,
    weight: 25,
    title: (c) => c.t('The vote on the old car park', 'Eski otoparkın oylaması'),
    text: (c) => c.t('The neighbourhood is voting on the old car park: flats and shops, which will bring jobs and noise, or a small park with a fountain, which will bring neither. Everyone has strong opinions. Few have read the plans.', 'Mahalle eski otoparkı oylayacak: iş ve gürültü getirecek daireler ve dükkânlar, ya da ikisini de getirmeyecek, çeşmeli küçük bir park. Herkesin güçlü bir fikri var. Planları okuyan az.'),
    choices: [
      opt('build', ['Vote for the new buildings', 'Yeni binalara oy ver'], (c) => out(c, { hap: -1, usd: 60 }, 'The building wins by a hair. Rents on your street tick upward; so does your side income. The park people give you a look in the lift.', 'Bina kıl payı kazanıyor. Sokağındaki kiralar yukarı çıkıyor, senin yan gelirin de. Park yanlıları asansörde sana bakıyor.')),
      opt('park', ['Vote for the park', 'Parka oy ver'], (c) => { lg(c, 1); return out(c, { hap: 3 }, 'The park wins. For a year there is mud, then there are children and one extremely proud pigeon on the fountain.', 'Park kazanıyor. Bir yıl çamur oluyor, sonra çocuklar ve çeşmenin üstünde son derece gururlu bir güvercin.'); }),
      opt('read', ['Read the plans first', 'Önce planları oku'], (c) => out(c, { sma: 2, hap: 1 }, 'You spend an evening with forty pages of drainage diagrams. You end up with a reasoned vote and the right to be unbearable at the next meeting.', 'Bir akşamı kırk sayfa kanalizasyon çiziminin başında geçiriyorsun. Sonunda gerekçeli bir oyun ve bir sonraki toplantıda çekilmez olma hakkın oluyor.'), { tone: 'good' }),
    ],
  },
];

const partB: EventDef[] = [
  {
    ...b,
    id: 'base.mr_march',
    minAge: 16,
    maxAge: 72,
    weight: 25,
    when: adult,
    title: (c) => c.t('The march to save the library', 'Kütüphane için yürüyüş'),
    text: (c) => c.t('The town wants to close the old library and sell the building. A march is planned for Sunday: banners, a brass band, and a risk that the afternoon turns into shouting.', 'Şehir eski kütüphaneyi kapatıp binayı satmak istiyor. Pazar günü bir yürüyüş planlanmış: pankartlar, bir bando ve öğleden sonranın bağırışmaya dönme riski.'),
    choices: [
      opt('march', ['March at the front', 'Önde yürü'], (c) => {
        if (c.rng.chance(0.5)) { lg(c, 3); return out(c, { hap: 4 }, 'Eight hundred people turn up. The vote is postponed. A photo of you holding the corner of a banner ends up in the local paper, mid-sentence and slightly sunburnt.', 'Sekiz yüz kişi geliyor. Oylama erteleniyor. Pankartın köşesini tutarken çekilmiş bir fotoğrafın yerel gazetede çıkıyor; yarım bir cümlenin ortasında ve biraz yanık.'); }
        return out(c, { hap: -2, hea: -1 }, 'The vote goes ahead anyway. You get a blister, a sunburn and the thrill of having been part of a crowd that was right and lost.', 'Oylama yine de yapılıyor. Bir su toplaması, bir güneş yanığı ve haklı çıkıp kaybeden bir kalabalığın parçası olmanın heyecanı kalıyor sana.');
      }, { badge: 'Risky' }),
      opt('watch', ['Stand on the pavement and clap', 'Kaldırımda alkışla'], (c) => out(c, { hap: 1 }, 'You clap, you wave, you hold someone\'s coffee. A small part, but a real one.', 'Alkışlıyorsun, el sallıyorsun, birinin kahvesini tutuyorsun. Küçük ama gerçek bir pay.')),
      opt('home', ['Stay home; marches change nothing', 'Evde kal; yürüyüşler bir şey değiştirmez'], (c) => out(c, { hap: -1 }, 'You watch it on the news. You see a neighbour holding a banner and cannot decide whether the feeling is relief or something smaller.', 'Haberlerden izliyorsun. Bir komşunun pankart tuttuğunu görüyorsun ve hissin rahatlık mı yoksa daha küçük bir şey mi olduğuna karar veremiyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_blame',
    minAge: 22,
    maxAge: 64,
    weight: 60,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('Someone else is getting the blame', 'Suçu başkasına yüklüyorlar'),
    text: (c) => c.t('A mistake cost the team a client. In the meeting everyone looks at the new colleague, who is not there to answer. You know it was not them. You know whose it was, too: nearly all of the room.', 'Bir hata ekibe bir müşteriye mal oldu. Toplantıda herkes yeni iş arkadaşına bakıyor; o cevap vermek için orada değil. Onun olmadığını biliyorsun. Kimin olduğunu da biliyorsun: neredeyse odadaki herkesin.'),
    choices: [
      opt('speak', ['Speak up for them', 'Onu savun'], (c) => {
        lg(c, 1);
        if (c.rng.chance(0.6)) return out(c, { hap: 3 }, 'You lay out the timeline. The room goes quiet, then shifts. The new colleague learns about it by lunch and buys you a coffee for the rest of the quarter.', 'Zaman çizelgesini anlatıyorsun. Oda sessizleşiyor, sonra kıpırdanıyor. Yeni arkadaşın öğlene kadar duyuyor ve çeyrek boyunca sana kahve ısmarlıyor.');
        return out(c, { hap: -3 }, 'You were right, and someone senior resents it. Your next review contains the phrase "not always a team player".', 'Haklıydın, ve kıdemli biri buna içerliyor. Bir sonraki değerlendirmende "her zaman takım oyuncusu değil" ifadesi geçiyor.');
      }, { tone: 'good', badge: 'Risky' }),
      opt('quiet', ['Keep your head down', 'Başını eğ'], (c) => out(c, { hap: -3 }, 'The meeting ends. The new colleague is let go within a month. You see their chair stay empty and you do not look at it.', 'Toplantı bitiyor. Yeni arkadaş bir ay içinde işten çıkarılıyor. Sandalyenin boş kalışını görüyorsun ve bakmıyorsun.'), { tone: 'bad' }),
      opt('private', ['Tell them privately afterwards', 'Sonra özelde söyle'], (c) => out(c, { hap: 1 }, 'You warn them and give them the timeline. They use it well. You didn\'t get the credit and didn\'t need it, much.', 'Onu uyarıp çizelgeyi veriyorsun. İyi kullanıyor. Pay almadın, çok da gerekmedi.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_own_error',
    minAge: 20,
    maxAge: 66,
    weight: 50,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('Your own mistake', 'Kendi hatan'),
    text: (c) => c.t('You sent the wrong figure to a customer and it was cheaper than it should have been. Nobody has noticed. If a junior had handled the file last, it could have been theirs.', 'Bir müşteriye yanlış bir rakam gönderdin ve olması gerekenden ucuz çıktı. Kimse fark etmedi. Dosyaya en son bir stajyer baksaydı, onunki olabilirdi.'),
    choices: [
      opt('admit', ['Admit it to your manager', 'Yöneticine itiraf et'], (c) => {
        lg(c, 1);
        if (c.rng.chance(0.7)) return out(c, { hap: 2, usd: -40 }, 'You are told to fix it and be careful. A week later your manager mentions you as "someone who tells you when it\'s bad news". It is the nicest thing in your file.', 'Düzeltmen ve dikkat etmen söyleniyor. Bir hafta sonra yöneticin senden "kötü haberi de söyleyen biri" diye söz ediyor. Dosyandaki en güzel cümle.');
        return out(c, { hap: -3, usd: -120 }, 'It was not forgiven. A warning, a smaller bonus, and a cold week. Still, you sleep at night and the numbers are right.', 'Affedilmiyor. Bir uyarı, daha küçük bir prim ve soğuk bir hafta. Yine de geceleri uyuyorsun ve rakamlar doğru.');
      }, { tone: 'good', badge: 'Risky' }),
      opt('hide', ['Quietly correct it and say nothing', 'Sessizce düzelt, kimseye söyleme'], (c) => out(c, { hap: -1 }, 'You fix it before the invoice goes out. Whether that was honesty or just tidiness, you are not sure.', 'Fatura çıkmadan düzeltiyorsun. Bunun dürüstlük mü yoksa sadece düzenlilik mi olduğundan emin değilsin.')),
      opt('blame', ['Let the junior take it', 'Stajyerin üstüne kalsın'], (c) => { lg(c, -2); return out(c, { hap: -6 }, 'They are called in and apologise for something that was not theirs. They thank you, because you looked sympathetic. You can still hear it.', 'Çağrılıyor ve kendisinin olmayan bir şey için özür diliyor. Sana teşekkür ediyor, çünkü anlayışlı görünüyordun. Hâlâ kulağında.'); }, { tone: 'bad', badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_stranger',
    minAge: 16,
    weight: 40,
    when: adult,
    title: (c) => c.t('A stranger in the rain', 'Yağmurda bir yabancı'),
    text: (c) => c.t('In the downpour, a man sits on a kerb next to a car with a flat tyre and no jack. Cars slow down, look, speed up. You have an appointment in twelve minutes.', 'Sağanakta bir adam, lastiği patlak ve krikosu olmayan bir arabanın yanında bordürde oturuyor. Arabalar yavaşlıyor, bakıyor, hızlanıyor. On iki dakika sonra bir randevun var.'),
    choices: [
      opt('help', ['Stop and help', 'Dur ve yardım et'], (c) => {
        lg(c, 1);
        if (c.rng.chance(0.5)) return out(c, { hap: 4, hea: -1 }, 'You are late, soaked, and delighted. He presses a very hot pastry on you from a thermos bag. It is the best thing you eat all week.', 'Geç kalıyorsun, sırılsıklamsın ve sevinçlisin. Bir termos çantasından sana sıcacık bir hamur işi uzatıyor. Haftanın en güzel yemeği.');
        return out(c, { hap: 2, hea: -2 }, 'You are late and catch a cold. The man says thank you a little too many times and you drive on feeling oddly clean.', 'Geç kalıyorsun ve üşütüyorsun. Adam gereğinden biraz fazla teşekkür ediyor, sen tuhaf biçimde arınmış hissederek yola devam ediyorsun.');
      }, { tone: 'good' }),
      opt('call', ['Call a tow truck for him', 'Onun için çekici çağır'], (c) => out(c, { hap: 2, usd: -20 }, 'You make the call from under a shop awning, give the address, and drive on. A small kindness, efficiently done.', 'Bir dükkân saçağının altından arıyor, adresi veriyor ve yoluna devam ediyorsun. Küçük, verimli bir iyilik.')),
      opt('drive', ['Drive on', 'Yoluna devam et'], (c) => out(c, { hap: -2 }, 'You are on time. You are dry. For the rest of the day his shape on the kerb stays with you, hunched, in the mirror.', 'Zamanında varıyorsun. Kurusun. Günün kalanında bordürdeki kamburlaşmış hali aynada seninle kalıyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_rumour_name',
    minAge: 18,
    weight: 30,
    when: adult,
    title: (c) => c.t(`Whispers about the ${c.p.lastName} name`, `${c.p.lastName} soyadı hakkında fısıltılar`),
    text: (c) => c.t(`At the market somebody says that the ${c.p.lastName} family once cheated a neighbour out of land. It is not true, as far as you know. It is the kind of thing that is believed because it is repeated.`, `Pazarda biri ${c.p.lastName} ailesinin eskiden bir komşusunu arazisinden dolandırdığını söylüyor. Bildiğin kadarıyla doğru değil. Tekrarlandığı için inanılan şeylerden.`),
    choices: [
      opt('face', ['Confront whoever started it', 'Başlatanın karşısına çık'], (c) => {
        if (c.rng.chance(0.55)) { lg(c, 5); return out(c, { hap: 3 }, 'It turns out to be a muddle with another family. The apology is awkward and public, and the name comes out cleaner than it went in.', 'Başka bir aileyle karıştırıldığı anlaşılıyor. Özür beceriksiz ve herkesin önünde; soyadı girdiğinden daha temiz çıkıyor.'); }
        return out(c, { hap: -4 }, 'The more you argue, the more people listen, and not all of them to you. The rumour now has a second chapter.', 'Ne kadar tartışırsan o kadar çok insan dinliyor, hepsi de seni değil. Söylentinin şimdi ikinci bir bölümü var.');
      }, { badge: 'Risky' }),
      opt('ignore', ['Let it die on its own', 'Kendi kendine sönsün'], (c) => { lg(c, -1); return out(c, { hap: -1 }, 'It does, mostly. Years later a stranger mentions it in passing, as a fact. You smile politely, with your teeth.', 'Çoğunlukla sönüyor. Yıllar sonra bir yabancı bunu geçerken bir gerçek gibi anıyor. Nazikçe, dişlerini göstererek gülümsüyorsun.'); }),
      opt('kind', ['Answer it by being generous', 'Cömert davranarak cevap ver'], (c) => { lg(c, 4); return out(c, { hap: 2, usd: -40 }, 'You say nothing and quietly pay for the street\'s tree-planting day. Within a season people are saying the name with something close to affection.', 'Hiçbir şey söylemeden sokağın ağaç dikim gününü sessizce karşılıyorsun. Bir mevsim içinde insanlar soyadını sevgiye yakın bir tonla anmaya başlıyor.'); }, { tone: 'good', ...afford(40) }),
    ],
  },
  {
    ...b,
    id: 'base.mr_festival',
    minAge: 10,
    weight: 40,
    cooldown: 5,
    title: (c) => c.t('The old festival', 'Eski şenlik'),
    text: (c) => c.t('Every year the neighbourhood holds the old festival: long tables in the street, a ceremony with songs that most people only half remember, and a great deal of food. This year they need someone to help lay out the tables.', 'Her yıl mahalle eski şenliği düzenliyor: sokakta upuzun masalar, çoğu kişinin yarım hatırladığı şarkılı bir tören ve bol yemek. Bu yıl masaları kurmaya yardım edecek biri aranıyor.'),
    choices: [
      opt('help', ['Help from the first morning', 'İlk sabahtan yardım et'], (c) => { lg(c, 1); return out(c, { hap: 4, hea: 1 }, 'By evening you know the names of eleven people who live within thirty metres of you and have never spoken to you. The soup is excellent.', 'Akşama kadar, otuz metre ötende oturup seninle hiç konuşmamış on bir kişinin adını öğreniyorsun. Çorba harika.'); }, { tone: 'good' }),
      opt('guest', ['Come as a guest', 'Misafir olarak katıl'], (c) => out(c, { hap: 3 }, 'You sit at the table and let the songs go by. Someone corrects your pronunciation of a word you never knew you were singing.', 'Masaya oturup şarkıların akmasına izin veriyorsun. Biri, söylediğini bilmediğin bir kelimenin telaffuzunu düzeltiyor.')),
      opt('skip', ['Skip it this year', 'Bu yıl katılma'], (c) => out(c, { hap: -1 }, 'You hear the singing from your window and stay at your desk. The street smells of woodsmoke and other people\'s dinner.', 'Şarkıları pencerenden duyuyor ve masanda kalıyorsun. Sokak odun dumanı ve başkalarının yemeği kokuyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_service',
    minAge: 18,
    weight: 25,
    when: adult,
    title: (c) => c.t('An invitation to a service', 'Bir ayine davet'),
    text: (c) => c.t('A neighbour you like invites you to a service at their community\'s place of worship: a quiet hour of singing and silence, followed by lunch. You have never been. You are not sure what you believe, or whether it matters.', 'Sevdiğin bir komşun seni kendi topluluğunun ibadet yerindeki bir ayine çağırıyor: bir saatlik sessizlik ve ezgiler, ardından öğle yemeği. Hiç gitmedin. Neye inandığından, bunun önemli olup olmadığından emin değilsin.'),
    choices: [
      opt('go', ['Go with an open mind', 'Açık fikirle git'], (c) => { c.h.stat('smarts', 1); return out(c, { hap: 3 }, 'You sit at the back and watch people be quiet together. It is not conversion; it is something more modest, like being allowed to listen to a long, careful tune.', 'Arkada oturup insanların birlikte susmasını izliyorsun. Bu bir dönüşüm değil; daha mütevazı bir şey, uzun ve özenli bir ezgiyi dinlemeye izin verilmesi gibi.'); }, { tone: 'good' }),
      opt('lunch', ['Come for lunch only', 'Sadece yemeğe gel'], (c) => out(c, { hap: 2 }, 'You arrive with the rice and a clean shirt and nobody minds. The conversation is better than the service you missed would have been, you suspect.', 'Pilavla ve temiz bir gömlekle varıyorsun, kimse sorun etmiyor. Sohbet, kaçırdığın ayinden daha iyi, diye düşünüyorsun.')),
      opt('decline', ['Thank them, decline warmly', 'Teşekkür et, sıcak bir dille reddet'], (c) => out(c, { hap: 0 }, 'You say it is not for you, and thank them for thinking of you. They say the door is open and mean it. It is a good small friendship.', 'Sana göre olmadığını söyleyip akıllarına geldiğin için teşekkür ediyorsun. Kapının açık olduğunu söylüyorlar ve gerçekten kastediyorlar. İyi, küçük bir dostluk.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_doubt',
    minAge: 20,
    weight: 25,
    cooldown: 10,
    maxPerLife: 1,
    title: (c) => c.t('A quiet doubt', 'Sessiz bir tereddüt'),
    text: (c) => c.t('The family tradition asks something of you this season, and you find you are no longer sure you believe in the reasons behind it. Nobody has asked. That is not the same as nobody knowing.', 'Aile geleneği bu mevsim senden bir şey istiyor ve arkasındaki nedenlere artık inanıp inanmadığından emin değilsin. Kimse sormadı. Bu, kimsenin bilmemesi demek değil.'),
    choices: [
      opt('elder', ['Talk to an elder you trust', 'Güvendiğin bir büyükle konuş'], (c) => { c.h.stat('smarts', 1); lg(c, 2); return out(c, { hap: 3 }, 'They do not scold. They say they have doubted every decade and kept doing the thing anyway, "because it was how we were together". You are not persuaded and you are not alone.', 'Azarlamıyorlar. Her on yılda bir şüpheye düştüklerini ve yine de yaptıklarını, "çünkü birlikte olmanın yolu buydu" diyorlar. İkna olmuyorsun ve yalnız değilsin.'); }, { tone: 'good' }),
      opt('keep', ['Keep the tradition for the family\'s sake', 'Aile için geleneği sürdür'], (c) => { lg(c, 3); return out(c, { hap: 1 }, 'You do the thing carefully, with a clear head. It turns out to be more about the people at the table than the belief behind it.', 'Geleneği özenle ve berrak bir kafayla yerine getiriyorsun. Konunun, arkasındaki inançtan çok masadaki insanlarla ilgili olduğu anlaşılıyor.'); }),
      opt('own', ['Find your own way, quietly', 'Kendi yolunu sessizce bul'], (c) => { lg(c, -1); return out(c, { hap: 2, sma: 1 }, 'You read, think, and stop going to the parts that do not fit. There is a conversation in your future. You take your time.', 'Okuyor, düşünüyor ve sana uymayan kısımlara gitmeyi bırakıyorsun. Geleceğinde bir konuşma var. Acele etmiyorsun.'); }),
    ],
  },
  {
    ...b,
    id: 'base.mr_big_donation',
    minAge: 35,
    weight: 50,
    cooldown: 10,
    maxPerLife: 1,
    when: (c) => c.p.money >= wage(c, 5000),
    title: (c) => c.t('Your name on a wall?', 'Duvarda adın mı olsun?'),
    text: (c) => c.t('The hospital is raising money for a new waiting room. The fundraiser has done the arithmetic: a donation of the right size would put your family\'s name on a brass plaque by the door.', 'Hastane yeni bir bekleme salonu için bağış topluyor. Bağış sorumlusu hesabı yapmış: doğru büyüklükte bir bağış, ailenin adını kapının yanında pirinç bir levhaya işletir.'),
    choices: [
      opt('named', ['Give, with the plaque', 'Bağışla, levha da olsun'], (c) => { lg(c, 12); return out(c, { hap: 3, usd: -1500 }, 'A brass plaque with your surname. Strangers wait beneath it for news. You walk past it once a year and pretend you are not checking it is still polished.', 'Soyadınla bir pirinç levha. Yabancılar altında haber bekliyor. Yılda bir kez önünden geçiyor ve cilasının hâlâ parlak olup olmadığına bakmıyormuş gibi yapıyorsun.'); }, { tone: 'big', ...afford(1500) }),
      opt('anon', ['Give, anonymously', 'İsimsiz bağışla'], (c) => { lg(c, 6); return out(c, { hap: 5, usd: -1500 }, 'The cheque goes in with no name. The fundraiser tries three times to find out who you are. You enjoy the mystery more than the plaque would have given you.', 'Çek isimsiz gidiyor. Bağış sorumlusu kim olduğunu öğrenmek için üç kez deniyor. Gizemi levhanın vereceğinden çok seviyorsun.'); }, { tone: 'good', ...afford(1500) }),
      opt('small', ['Give a modest amount', 'Mütevazı bir miktar ver'], (c) => out(c, { hap: 2, usd: -150 }, 'Enough to count, not enough to be thanked on a wall. You get a card with a drawing of a daisy on it.', 'Sayılacak kadar, duvarda teşekkür edilecek kadar değil. Papatya resimli bir kart alıyorsun.'), { ...afford(150) }),
      opt('no', ['Decline', 'Reddet'], (c) => out(c, { hap: -1 }, 'Your money stays where it is. The waiting room opens without you and is, you admit, very nice.', 'Paran yerinde kalıyor. Bekleme salonu sensiz açılıyor ve itiraf etmelisin ki çok güzel.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_inherit_quarrel',
    minAge: 30,
    maxAge: 85,
    weight: 50,
    needs: ['sibling'],
    when: hasSibling,
    setup: (c) => pickSibling(c),
    title: (c) => c.t('The old aunt\'s things', 'Yaşlı teyzenin eşyaları'),
    text: (c) => c.t(`An elderly aunt has died, leaving a will with a mistake in it and a house full of small, loaded objects. At the funeral lunch ${kw(c, 'sib')} quietly says they want the clock, the table and the garden. Both of you have already been told you would get the clock.`, `Yaşlı bir teyze vefat etti; geride içinde bir hata olan bir vasiyet ve küçük ama yüklü eşyalarla dolu bir ev bıraktı. Cenaze yemeğinde ${kw(c, 'sib')} saatin, masanın ve bahçenin kendisine kalmasını istediğini söylüyor. İkinize de saatin size kalacağı söylenmişti.`),
    choices: [
      opt('fair', ['Propose a fair split', 'Adil bir bölüşüm öner'], (c) => { near(c, 'sib', 6); lg(c, 4); return out(c, { hap: 2 }, 'You draw lots for the clock, share the table, and agree to sell the garden. It takes a whole Sunday and a lot of coffee, and at the end nobody has won, which is what fairness feels like.', 'Saat için kura çekiyor, masayı paylaşıyor, bahçeyi satmak üzere anlaşıyorsunuz. Koca bir pazar ve çok kahve alıyor; sonunda kimse kazanmıyor, adaletin hissi de bu.'); }, { tone: 'good' }),
      opt('fight', ['Insist on the clock', 'Saatte ısrar et'], (c) => {
        if (c.rng.chance(0.5)) { near(c, 'sib', -10); return out(c, { hap: 1 }, 'You get the clock. It ticks loudly in your hall, and each tick sounds slightly like a closed door.', 'Saati alıyorsun. Koridorunda yüksek sesle tıkırdıyor ve her tıkırtı biraz kapanan bir kapı gibi.'); }
        near(c, 'sib', -10); lg(c, -3);
        return out(c, { hap: -5, usd: -200 }, 'It goes to solicitors. The solicitors take more than either of you would have. The family stops sitting at the same table at weddings.', 'Konu avukatlara gidiyor. Avukatlar ikinizin alacağından fazlasını alıyor. Aile düğünlerde aynı masaya oturmayı bırakıyor.');
      }, { badge: 'Risky', tone: 'bad' }),
      opt('give', ['Let them have it all', 'Hepsini ona bırak'], (c) => { near(c, 'sib', 8); lg(c, 2); return out(c, { hap: -1 }, 'You say you do not need any of it. They look at you for a long time and say they will never forget that. You miss the clock more than you expected.', 'Hiçbirine ihtiyacın olmadığını söylüyorsun. Uzun uzun sana bakıp bunu hiç unutmayacağını söylüyor. Saati beklediğinden çok özlüyorsun.'); }),
    ],
  },
  {
    ...b,
    id: 'base.mr_gossip_you',
    minAge: 16,
    weight: 35,
    title: (c) => c.t('You are the story this week', 'Bu hafta hikâye sensin'),
    text: (c) => c.t('At the bakery the conversation stops when you walk in. By evening you learn that you are said to be secretly rich, secretly broke, and "seeing someone from the town hall". Some of it is nearly true.', 'Fırında sen girince sohbet kesiliyor. Akşama kadar gizlice zengin, gizlice züğürt ve "belediyeden biriyle görüşen" biri olduğunu öğreniyorsun. Bir kısmı neredeyse doğru.'),
    choices: [
      opt('laugh', ['Play along with a joke', 'Şakayla karşılık ver'], (c) => out(c, { hap: 3 }, 'You tell the baker you are in fact all three. By the next morning the town has moved on to the butcher\'s cousin.', 'Fırıncıya aslında hepsinin doğru olduğunu söylüyorsun. Ertesi sabah kasabanın dedikodusu kasabın kuzenine geçiyor.'), { tone: 'good' }),
      opt('correct', ['Correct every version', 'Her versiyonu düzelt'], (c) => out(c, { hap: -3 }, 'You go door to door with the facts. The facts are less interesting, and the town finds you a little too keen to deny things.', 'Gerçeklerle kapı kapı dolaşıyorsun. Gerçekler daha az ilginç, kasaba da inkâr etmeye biraz fazla hevesli olduğunu düşünüyor.')),
      opt('out', ['Ask the source to stop', 'Kaynağa söylemeyi bırakmasını söyle'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: 2 }, 'You find the person, ask kindly, and they go red and stop. You both enjoy the silence.', 'Kişiyi buluyor, nazikçe rica ediyorsun; kızarıp susuyor. İkiniz de sessizliğin tadını çıkarıyorsunuz.');
        return out(c, { hap: -2 }, 'The source turns out to be three people, each sure it was somebody else. You leave with a headache and two new enemies.', 'Kaynağın üç kişi olduğu anlaşılıyor, her biri bunun başkasından çıktığına emin. Başağrısı ve iki yeni düşmanla ayrılıyorsun.');
      }),
    ],
  },
  {
    ...b,
    id: 'base.mr_gossip_pass',
    minAge: 15,
    weight: 30,
    when: (c) => hasFriend(c),
    setup: (c) => pickFriend(c),
    title: (c) => c.t('Someone else\'s secret', 'Başkasının sırrı'),
    text: (c) => c.t(`You learn something rich and private about an acquaintance, from someone who made you swear to say nothing. ${nmc(c, 'fr')} is exactly the sort of person who would love to hear it.`, `Tanıdığın biri hakkında zengin ve özel bir şey öğreniyorsun; sana söylemeyeceğine yemin ettirmiş biri anlatıyor. ${nmc(c, 'fr')} bunu duymaya bayılacak türden biri.`),
    choices: [
      opt('keep', ['Keep it to yourself', 'Kendine sakla'], (c) => { lg(c, 1); return out(c, { hap: 1 }, 'It sits in your chest like a swallowed marble for a month. Then it dissolves, and you are slightly proud of your own boredom.', 'Bir ay boyunca yutulmuş bir misket gibi göğsünde duruyor. Sonra eriyor ve kendi sıkılganlığınla hafifçe gurur duyuyorsun.'); }, { tone: 'good' }),
      opt('tell', ['Tell just one friend', 'Sadece bir arkadaşa söyle'], (c) => { near(c, 'fr', 4); return out(c, { hap: 1 }, 'By Friday the whole street has it, with additions. The acquaintance finds out who started it. It was you.', 'Cumaya kadar bütün sokak biliyor, eklemelerle. Tanıdık, kimin başlattığını öğreniyor. Sensin.'); }, { badge: 'Risky', tone: 'bad' }),
      opt('warn', ['Warn the person', 'Kişiyi uyar'], (c) => out(c, { hap: 2 }, 'You tell them what is going round. They are shaken, grateful and a little alarmed that you knew. The friendship becomes complicated in the good way.', 'Neler dolaştığını söylüyorsun. Sarsılıyor, minnettar kalıyor ve bildiğin için biraz tedirgin oluyor. Dostluk iyi bir biçimde karmaşıklaşıyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_change',
    minAge: 12,
    weight: 50,
    cooldown: 5,
    title: (c) => c.t('Too much change', 'Fazla para üstü'),
    text: (c) => c.t('The cashier is tired and gives you change for a larger note than the one you handed over. You notice it by the door. Behind you, a long queue and a manager who counts tills for fun.', 'Kasiyer yorgun ve verdiğinden büyük bir banknot için para üstü veriyor. Kapıda fark ediyorsun. Arkanda uzun bir kuyruk ve eğlence olsun diye kasa sayan bir müdür var.'),
    choices: [
      opt('back', ['Walk back and return it', 'Geri dön ve iade et'], (c) => { lg(c, 1); return out(c, { hap: 3 }, 'The cashier almost cries. The manager nods once and says, "Thank you." It is warmer than most of your Tuesday.', 'Kasiyer neredeyse ağlıyor. Müdür bir kez başını sallayıp "Teşekkürler" diyor. Salı gününün çoğundan daha sıcak.'); }, { tone: 'good' }),
      opt('keep', ['Keep it, lucky day', 'Sakla, şanslı gün'], (c) => {
        if (c.rng.chance(0.3)) return out(c, { hap: -3, usd: 20 }, 'The till is short at closing and the cashier pays for it from her wages. You learn this from a neighbour, three days later.', 'Kasa kapanışta açık veriyor ve kasiyer bunu maaşından ödüyor. Bunu üç gün sonra bir komşudan öğreniyorsun.');
        return out(c, { hap: 1, usd: 20 }, 'You buy lunch with it. It is a good lunch. The back of your neck feels strange for a little while.', 'Parayla öğle yemeği yiyorsun. İyi bir yemek. Ensen bir süre tuhaf hissediyor.');
      }, { tone: 'bad' }),
      opt('later', ['Mean to go back later', 'Sonra gitmeyi düşün'], (c) => out(c, { hap: -1 }, 'You mean to. You mean to for three weeks. At last you leave the extra note in the charity tin, which is not the same thing, but is not nothing.', 'Gitmeyi düşünüyorsun. Üç hafta düşünüyorsun. Sonunda fazla parayı yardım kumbarasına atıyorsun; aynı şey değil ama hiç de sayılmaz.')),
    ],
  },
];

const partC: EventDef[] = [
  {
    ...b,
    id: 'base.mr_cash_discount',
    minAge: 25,
    weight: 30,
    when: adult,
    title: (c) => c.t('Cash, no receipt', 'Nakit olursa fiş yok'),
    text: (c) => c.t('The tradesman who has fixed your roof names a price, then a lower one: "if it\'s cash, I don\'t need to write it down". The saving is real. So is what it does to the pavements, the school and the clinic.', 'Çatını tamir eden usta bir fiyat söylüyor, sonra daha düşüğünü: "Nakit olursa yazmam gerekmez." Tasarruf gerçek. Kaldırımlara, okula ve sağlık ocağına yaptığı da öyle.'),
    choices: [
      opt('cash', ['Take the discount', 'İndirimi kabul et'], (c) => { c.h.flag('mr_cash_deal'); return out(c, { hap: 1, usd: 120 }, 'Done with a handshake. The roof is lovely. You feel a very particular kind of clever that is also a little bit sticky.', 'El sıkışarak bitiyor. Çatı harika. Hem akıllıca hem biraz yapışkan bir his yaşıyorsun.'); }, { badge: 'Risky' }),
      opt('receipt', ['Insist on a proper invoice', 'Düzgün fatura iste'], (c) => { lg(c, 1); return out(c, { hap: 1, usd: -120 }, 'He sighs like a tyre, and writes it down. The invoice sits in a folder, reassuring and boring.', 'Lastik gibi iç çekip yazıyor. Fatura bir dosyada duruyor; güven verici ve sıkıcı.'); }, { tone: 'good' }),
      opt('hag', ['Haggle with the invoice', 'Faturalı pazarlık yap'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: 3, usd: 40 }, 'He admits you are right, gives you half the cash discount and the invoice, and calls you "boss" with real respect.', 'Haklı olduğunu kabul ediyor, nakit indiriminin yarısını ve faturayı veriyor, sana gerçek bir saygıyla "patron" diyor.');
        return out(c, { hap: -1, usd: -120 }, 'He will not budge. You pay full price with an invoice and a smile that does not reach your eyes.', 'Hiç yanaşmıyor. Faturalı tam fiyatı gözlerine ulaşmayan bir gülümsemeyle ödüyorsun.');
      }),
    ],
  },
  {
    ...b,
    id: 'base.mr_scratch',
    minAge: 18,
    weight: 180,
    needs: [],
    when: (c) => hasCar(c) && adult(c),
    title: (c) => c.t('A scratch on a parked car', 'Park halindeki araca çizik'),
    text: (c) => c.t('Reversing out of a tight space you hear a soft, expensive scrape. A long white line has appeared along the door of a parked car. The street is empty. Nobody has seen anything, apart from a cat.', 'Dar bir yerden geri çıkarken hafif, pahalı bir sürtme sesi duyuyorsun. Park halindeki bir aracın kapısında uzun beyaz bir çizgi belirmiş. Sokak boş. Bir kedi dışında kimse bir şey görmedi.'),
    choices: [
      opt('note', ['Leave a note with your number', 'Numaranla bir not bırak'], (c) => { lg(c, 2); return out(c, { hap: 2, usd: -90 }, 'The owner calls the next day, astonished that a note exists. The repair is cheap, the conversation is long and friendly.', 'Sahibi ertesi gün, bir not bırakıldığına şaşırarak arıyor. Tamir ucuz, sohbet uzun ve dostane.'); }, { tone: 'good', ...afford(90) }),
      opt('go', ['Drive away', 'Yoluna devam et'], (c) => {
        if (c.rng.chance(0.3)) return out(c, { hap: -4, usd: -300 }, 'A doorbell camera across the road saw everything. A letter, a fine and a very awkward conversation.', 'Yolun karşısındaki bir kapı kamerası her şeyi görmüş. Bir mektup, bir para cezası ve çok garip bir konuşma.');
        return out(c, { hap: -2 }, 'Nobody ever finds out. You find yourself parking carefully for months, as if the cat were still watching.', 'Kimse öğrenmiyor. Aylarca özenle park ediyorsun, kedi hâlâ izliyormuş gibi.');
      }, { badge: 'Risky', tone: 'bad' }),
      opt('knock', ['Knock on the nearest doors', 'En yakın kapıları çal'], (c) => out(c, { hap: 1, usd: -60 }, 'The third door is the owner. They shrug, say "it was already scratched", and you both look at the scratch, which is new, and agree to split it.', 'Üçüncü kapı sahibi. Omuz silkip "zaten çizikti" diyor, ikiniz de yeni olan çizgiye bakıp masrafı bölüşmeye karar veriyorsunuz.'), { ...afford(60) }),
    ],
  },
  {
    ...b,
    id: 'base.mr_classmate_blamed',
    minAge: 11,
    maxAge: 17,
    weight: 90,
    needs: ['student'],
    title: (c) => c.t('The wrong kid gets blamed', 'Yanlış çocuk suçlanıyor'),
    text: (c) => c.t('Someone has drawn a rude cartoon of the teacher on the board. The teacher is certain it was the quiet kid at the back, who did not do it. You saw who did, and it was a friend of yours.', 'Biri tahtaya öğretmenin ayıp bir karikatürünü çizmiş. Öğretmen bunu arkadaki sessiz çocuğun yaptığından emin; o yapmadı. Kimin yaptığını gördün, ve o senin bir arkadaşın.'),
    choices: [
      opt('tell', ['Tell the teacher the truth', 'Öğretmene doğruyu söyle'], (c) => { lg(c, 1); c.h.stat('happiness', 2); return c.t('Your friend gets detention and does not speak to you for a week. The quiet kid at the back sits next to you at lunch for the rest of the year, without a word, like a very loyal piece of furniture.', 'Arkadaşın ceza alıyor ve bir hafta seninle konuşmuyor. Arkadaki sessiz çocuk yılın geri kalanında öğle yemeğinde tek kelime etmeden yanına oturuyor, çok sadık bir mobilya gibi.'); }, { tone: 'good', badge: 'Risky' }),
      opt('ask', ['Make your friend confess', 'Arkadaşını itiraf etmeye ikna et'], (c) => {
        if (c.rng.chance(0.6)) return out(c, { hap: 3, sma: 1 }, 'You are very persuasive. Your friend confesses, the quiet kid is cleared, and the punishment is a letter of apology and a cleaned board.', 'Çok ikna edicisin. Arkadaşın itiraf ediyor, sessiz çocuk aklanıyor ve ceza bir özür mektubu ve silinmiş bir tahta oluyor.');
        return out(c, { hap: -3 }, 'Your friend says "you wouldn\'t dare". You didn\'t. The quiet kid takes the detention and thanks nobody.', 'Arkadaşın "cesaret edemezsin" diyor. Etmiyorsun. Sessiz çocuk cezayı alıyor ve kimseye teşekkür etmiyor.');
      }),
      opt('silent', ['Say nothing', 'Sus'], (c) => out(c, { hap: -3 }, 'Nobody asks you. That is the worst part. The quiet kid serves the detention looking at the floor, and you look at yours.', 'Kimse sana sormuyor. En kötü kısmı bu. Sessiz çocuk cezayı ayakkabılarına bakarak çekiyor, sen de kendininkilere.'), { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_shoplift_friend',
    minAge: 12,
    maxAge: 19,
    weight: 130,
    when: (c) => hasFriend(c) && adult(c),
    setup: (c) => pickFriend(c),
    title: (c) => c.t('A friend with a full pocket', 'Cebi dolu bir arkadaş'),
    text: (c) => c.t(`In the shop, ${nmc(c, 'fr')} slides a bar of chocolate and a lighter into a coat pocket and looks at you with a grin that says "your turn". The security guard is reading a newspaper, ten feet away.`, `Dükkânda ${nmc(c, 'fr')} bir çikolatayı ve bir çakmağı ceketinin cebine atıyor ve "sıra sende" diyen bir sırıtışla sana bakıyor. Güvenlik görevlisi üç adım ötede gazete okuyor.`),
    choices: [
      opt('join', ['Take something too', 'Sen de bir şey al'], (c) => {
        if (c.rng.chance(0.45)) { c.p.criminalRecord += 1; return out(c, { hap: -6 }, 'The guard was not reading. You are both walked to the back room, and your parents are called. The chocolate was not good enough.', 'Görevli gazete okumuyormuş. İkiniz de arka odaya götürülüyor, ailen çağrılıyor. Çikolata o kadar iyi değildi.'); }
        near(c, 'fr', 4);
        return out(c, { hap: 2 }, 'You get away with it. Your heart beats for an hour. The thing you took tastes of something, and it is not the thing.', 'Yırtıyorsunuz. Kalbin bir saat atıyor. Aldığın şeyin tadı bir şeye benziyor, ama o şey değil.');
      }, { badge: 'Illegal', tone: 'bad' }),
      opt('stop', ['Make them put it back', 'Geri koymasını sağla'], (c) => {
        if (c.rng.chance(0.6)) { near(c, 'fr', 3); return out(c, { hap: 3 }, `${nmc(c, 'fr')} rolls their eyes, then does it. Outside they say you are boring. They don\'t seem to mean it.`, `${nmc(c, 'fr')} gözlerini deviriyor, sonra yapıyor. Dışarıda sıkıcı olduğunu söylüyor. Pek de kastetmiyor gibi.`); }
        near(c, 'fr', -6);
        return out(c, { hap: -2 }, 'They tell you not to be a baby and walk out with it. You are left standing by the door, the only one with clean pockets and a cold face.', 'Bebek gibi davranmamanı söyleyip eşyayla çıkıyor. Kapının yanında tek başına, temiz ceplerle ve soğuk bir yüzle kalıyorsun.');
      }, { tone: 'good', badge: 'Risky' }),
      opt('leave', ['Walk out without them', 'Onsuz çık git'], (c) => out(c, { hap: -1 }, 'You say nothing and leave. Five minutes later your phone buzzes with a photo of the chocolate. No caption needed.', 'Hiçbir şey demeden çıkıyorsun. Beş dakika sonra telefonuna çikolatanın fotoğrafı düşüyor. Alt yazıya gerek yok.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_scam_call',
    minAge: 28,
    weight: 25,
    when: adult,
    title: (c) => c.t('The old man and the phone call', 'Yaşlı adam ve telefon'),
    text: (c) => c.t('In the post office queue you overhear an elderly neighbour on the phone: "Yes, I\'ll send it now. The grandson is in trouble, you say?" He has the form out and his bank card ready. The voice on the line is very friendly.', 'Postane kuyruğunda yaşlı bir komşunun telefonda konuştuğunu duyuyorsun: "Evet, hemen yollarım. Torun başı belada, öyle mi diyorsun?" Formu çıkarmış, banka kartını hazırlamış. Hattaki ses çok sıcak.'),
    choices: [
      opt('stop', ['Step in and stop him', 'Araya gir, durdur'], (c) => { lg(c, 3); return out(c, { hap: 5 }, 'You take the phone, say three firm words to the caller, and hang up. He sits down, very pale, then grips your hand. His real grandson arrives with groceries ten minutes later, entirely fine.', 'Telefonu alıp arayana üç kesin söz söylüyor ve kapatıyorsun. Çok solgun oturuyor, sonra elini tutuyor. Gerçek torunu on dakika sonra market torbalarıyla, tamamen iyi, geliyor.'); }, { tone: 'good' }),
      opt('tellclerk', ['Quietly tell the clerk', 'Memura sessizce söyle'], (c) => out(c, { hap: 2 }, 'The clerk calls the police, stalls him with a cheerful forms mix-up, and a patrol arrives. You leave before the thanks. Efficient, and a little cowardly.', 'Memur polisi arıyor, neşeli bir form karışıklığıyla onu oyalıyor ve bir devriye geliyor. Teşekkürden önce ayrılıyorsun. Verimli, ve biraz ürkek.')),
      opt('mind', ['It is none of your business', 'Seni ilgilendirmez'], (c) => out(c, { hap: -4 }, 'You look away. A week later you hear he lost his savings. You were five metres away.', 'Başını çeviriyorsun. Bir hafta sonra birikimini kaybettiğini duyuyorsun. Beş metre ötesindeydin.'), { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_bill_error',
    minAge: 22,
    weight: 25,
    when: adult,
    title: (c) => c.t('The bill that forgot you', 'Seni unutan fatura'),
    text: (c) => c.t('For eight months your utility company has billed you zero by mistake. Eight months of lights, heating and a very long bath. The next envelope will probably contain a catching-up.', 'Elektrik şirketi sekiz aydır yanlışlıkla sana sıfır fatura çıkarıyor. Sekiz ay ışık, ısıtma ve çok uzun bir banyo. Bir sonraki zarf muhtemelen bir telafi içerecek.'),
    choices: [
      opt('call', ['Call them and sort it out', 'Ara ve düzelt'], (c) => { lg(c, 1); return out(c, { hap: 1, usd: -200 }, 'The operator audibly stops chewing. You agree on a payment plan. She says in 11 years nobody has ever called to say this.', 'Operatör çiğnemeyi duyulur biçimde bırakıyor. Bir ödeme planında anlaşıyorsunuz. On bir yıldır kimsenin bunu söylemek için aramadığını belirtiyor.'); }, { tone: 'good' }),
      opt('wait', ['Wait and see', 'Bekle, bakalım'], (c) => {
        if (c.rng.chance(0.4)) return out(c, { hap: -3, usd: -320 }, 'The catch-up bill lands, with interest and a note about "unreported consumption". It reads like an accusation.', 'Telafi faturası faiziyle ve "bildirilmeyen tüketim" notuyla geliyor. İthamname gibi okunuyor.');
        return out(c, { hap: 2, usd: 160 }, 'It is never corrected. Your bills stay at zero for two more years. It feels like you are getting away with something, which you are.', 'Hiç düzeltilmiyor. Faturalar iki yıl daha sıfır kalıyor. Bir şeyi yırtıyormuş gibi hissediyorsun, ki yırtıyorsun.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_committee',
    minAge: 30,
    maxAge: 80,
    weight: 25,
    cooldown: 10,
    maxPerLife: 1,
    when: adult,
    title: (c) => c.t('Chair of the residents\' committee', 'Mahalle sakinleri kurulunun başkanlığı'),
    text: (c) => c.t('The residents\' committee has lost its chair. Nobody else will take it. It is an unpaid job of minutes, disputes about bins, and the kind of power that is mostly the right to be shouted at.', 'Sakinler kurulu başkanını kaybetti. Kimse almak istemiyor. Ücretsiz bir iş: tutanaklar, çöp kutuları kavgaları ve çoğunlukla bağırılma hakkından ibaret bir güç.'),
    choices: [
      opt('take', ['Take the chair', 'Başkanlığı al'], (c) => { lg(c, 5); c.h.flag('mr_chair'); return out(c, { hap: -1, sma: 1 }, 'You chair eleven meetings. You settle a war over a barbecue, and secure a streetlight. Someone calls you "Chair" as a joke until it is not a joke.', 'On bir toplantıya başkanlık ediyorsun. Bir mangal savaşını sonlandırıyor, bir sokak lambası koparıyorsun. Biri sana şaka olarak "Sayın Başkan" diyor, sonra şaka olmaktan çıkıyor.'); }, { tone: 'good' }),
      opt('deputy', ['Offer to be deputy', 'Yardımcı olmayı öner'], (c) => { lg(c, 2); return out(c, { hap: 1 }, 'A reasonable compromise. You do half the work and are blamed for a quarter of the problems.', 'Makul bir uzlaşma. İşin yarısını yapıyor, sorunların dörtte biri için suçlanıyorsun.'); }),
      opt('no', ['Say no', 'Hayır de'], (c) => out(c, { hap: 1 }, 'Your evenings stay your own. The committee is taken over by the loudest man on the street, and you will be hearing about bins for years.', 'Akşamların sana kalıyor. Kurulu sokağın en gürültücü adamı devralıyor ve yıllarca çöp kutularını dinleyeceksin.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_vote_cash',
    minAge: 21,
    weight: 20,
    cooldown: 10,
    maxPerLife: 1,
    when: adult,
    title: (c) => c.t('An envelope for your vote', 'Oyuna karşılık bir zarf'),
    text: (c) => c.t('Before the local election, a smiling man you do not know leaves a small envelope on your doorstep with a note: "To thank you for your thoughtful vote." He does not say for whom. He does not need to.', 'Yerel seçimden önce tanımadığın gülümseyen bir adam kapına küçük bir zarf bırakıyor, yanında bir not: "Düşünceli oyunuz için teşekkür." Kimin için olduğunu söylemiyor. Gerek de yok.'),
    choices: [
      opt('take', ['Take the money and vote as you like', 'Parayı al, istediğine oy ver'], (c) => { c.h.flag('mr_vote_cash'); return out(c, { hap: -2, usd: 100 }, 'Nobody can check your ballot. You tell yourself that. The envelope is spent by Thursday.', 'Oy pusulanı kimse kontrol edemez. Bunu kendine söylüyorsun. Zarf perşembeye harcanmış oluyor.'); }, { badge: 'Illegal', tone: 'bad' }),
      opt('return', ['Return it with a letter', 'Mektupla iade et'], (c) => { lg(c, 3); return out(c, { hap: 2 }, 'You post it back to the party office with one line: "Not for sale." You will not know if it mattered. It mattered to you.', 'Parti bürosuna tek satırla geri yolluyorsun: "Satılık değil." Bir önemi oldu mu bilemeyeceksin. Senin için oldu.'); }, { tone: 'good' }),
      opt('report', ['Report it to the authorities', 'Yetkililere bildir'], (c) => {
        if (c.rng.chance(0.5)) { lg(c, 6); return out(c, { hap: 3 }, 'An investigation. A resignation. A small paragraph in the paper with no names, only the phrase "alert residents". You are one of them.', 'Bir soruşturma. Bir istifa. Gazetede isimsiz küçük bir paragraf: "uyanık sakinler". Onlardan birisin.'); }
        return out(c, { hap: -2 }, 'They take your statement and thank you. Nothing happens. At the polling station the man with the smile holds the door for you.', 'İfadeni alıp teşekkür ediyorlar. Hiçbir şey olmuyor. Sandıkta gülümseyen adam senin için kapıyı tutuyor.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_fire_fund',
    minAge: 22,
    weight: 25,
    when: adult,
    title: (c) => c.t('The family whose kitchen burned', 'Mutfağı yanan aile'),
    text: (c) => c.t('A family down the road lost their kitchen and half their ground floor in a fire. A jar has appeared at the corner shop. Somebody wants to organise a fundraiser dinner and is looking for people with phones and opinions about rice.', 'Yolun aşağısındaki bir aile mutfağını ve zemin katının yarısını yangında kaybetti. Köşe dükkânda bir kavanoz belirdi. Biri bağış yemeği düzenlemek istiyor ve telefonu olan, pilav hakkında fikri olan insanlar arıyor.'),
    choices: [
      opt('give', ['Give money', 'Para ver'], (c) => out(c, { hap: 3, usd: -60 }, 'You drop it in the jar and write nothing on the card. You can see the mended kitchen from the end of the street in autumn.', 'Kavanoza atıyor, karta hiçbir şey yazmıyorsun. Sonbaharda onarılmış mutfağı sokağın ucundan görebiliyorsun.'), { ...afford(60) }),
      opt('organise', ['Run the dinner', 'Yemeği organize et'], (c) => { lg(c, 4); return out(c, { hap: 5, hea: -1, usd: -40 }, 'You cook for 120 people in four borrowed kitchens. You raise more than the insurance first offered. You do not sit down for nine hours.', 'Ödünç alınmış dört mutfakta 120 kişiye yemek yapıyorsun. Sigortanın ilk teklifinden fazlasını topluyorsun. Dokuz saat oturmuyorsun.'); }, { tone: 'good', ...afford(40) }),
      opt('sorry', ['Say you are sorry and walk on', '"Çok üzüldüm" deyip geç'], (c) => out(c, { hap: -1 }, 'You say it kindly and mean it. It is not the same as a jar, but it is not nothing. You think about it later at the traffic lights.', 'Nazikçe ve içtenlikle söylüyorsun. Kavanozla aynı şey değil ama hiç de değil. Sonra kırmızı ışıkta düşünüyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_food_bank',
    minAge: 16,
    weight: 30,
    when: adult,
    title: (c) => c.t('A shift at the food bank', 'Gıda bankasında bir vardiya'),
    text: (c) => c.t('The food bank is short of hands before the holidays. They need someone to pack boxes for four hours, in a cold hall that smells of tinned tomatoes, next to a retired teacher who will tell you everything about her knee.', 'Gıda bankası tatil öncesi eleman arıyor. Dört saat koli hazırlayacak, konserve domates kokan soğuk bir salonda, size dizinin bütün hikâyesini anlatacak emekli bir öğretmenin yanında çalışacak biri lazım.'),
    choices: [
      opt('pack', ['Pack boxes for four hours', 'Dört saat koli hazırla'], (c) => { lg(c, 1); return out(c, { hap: 4, hea: 1 }, 'You pack 200 boxes. The retired teacher is wonderful, in the end, and her knee is better than yours. You go again the next month.', '200 koli hazırlıyorsun. Emekli öğretmen sonunda harika çıkıyor, dizi seninkinden iyi. Ertesi ay yine gidiyorsun.'); }, { tone: 'good' }),
      opt('donate', ['Buy a trolley of food instead', 'Bunun yerine bir sepet yiyecek al'], (c) => out(c, { hap: 2, usd: -50 }, 'You leave a heaving trolley at the door. A volunteer waves from inside and you wave back through glass. A reasonable trade of hands for money.', 'Kapıya dolu bir sepet bırakıyorsun. İçeriden bir gönüllü el sallıyor, sen de camın ardından karşılık veriyorsun. Eli parayla değiştirmek makul.'), { ...afford(50) }),
      opt('busy', ['Say you are too busy', 'Çok meşgulüm de'], (c) => out(c, { hap: -1 }, 'It is true, mostly. You spend the four hours looking at your phone and feeling slightly like a person who spends four hours looking at their phone.', 'Çoğunlukla doğru. Dört saati telefona bakarak ve telefona dört saat bakan biri gibi hissederek geçiriyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_coach_kids',
    minAge: 26,
    maxAge: 75,
    weight: 25,
    when: adult,
    title: (c) => c.t('Somebody has to coach the kids', 'Çocukları çalıştıracak biri lazım'),
    text: (c) => c.t('The under-12 team has no coach. The old one moved away and the kids stand around the pitch like a nervous flock. A parent points at you with a clipboard and a face of absolute confidence.', '12 yaş altı takımının antrenörü yok. Eski olan taşındı, çocuklar sahada tedirgin bir sürü gibi duruyor. Bir veli yoklama listesiyle ve mutlak bir güvenle sana işaret ediyor.'),
    choices: [
      opt('coach', ['Take the whistle', 'Düdüğü al'], (c) => { lg(c, 3); return out(c, { hap: 4, hea: 1 }, 'You lose the first six matches and the seventh, gloriously, is a draw. A seven-year-old gives you a drawing of yourself with enormous ears. You frame it.', 'İlk altı maçı kaybediyorsun, yedincisi görkemli bir beraberlik. Yedi yaşında bir çocuk sana kocaman kulaklı bir portreni çiziyor. Çerçeveletiyorsun.'); }, { tone: 'good' }),
      opt('help', ['Help on Saturdays only', 'Sadece cumartesi yardım et'], (c) => out(c, { hap: 2 }, 'You carry the cones and tie shoelaces. It is the least glorious and most useful job in sport.', 'Konileri taşıyor, bağcıkları bağlıyorsun. Sporun en şanssız ama en işe yarar işi.')),
      opt('decline', ['Hand the clipboard back', 'Dosyayı geri ver'], (c) => out(c, { hap: -1 }, 'You say you are not the right person. The parent looks at you in a way that says that nobody is, and goes to find someone worse.', 'Doğru kişi olmadığını söylüyorsun. Veli, kimsenin olmadığını anlatan bir bakışla, daha kötüsünü bulmaya gidiyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_friend_partner',
    minAge: 20,
    weight: 25,
    when: (c) => hasFriend(c) && adult(c),
    setup: (c) => pickFriend(c),
    title: (c) => c.t('What you saw at the station', 'İstasyonda gördüğün'),
    text: (c) => c.t(`On the platform you see ${nmc(c, 'fr', 'gen')} partner holding hands, very closely, with someone who is not ${nmc(c, 'fr')}. They do not see you. The train arrives. The moment passes. The knowledge does not.`, `Peronda ${nmc(c, 'fr', 'gen')} partnerinin, ${nmc(c, 'fr', 'wth')} değil başka biriyle el ele, hem de çok yakın durduğunu görüyorsun. Seni görmüyorlar. Tren geliyor. An geçiyor. Bilgi geçmiyor.`),
    choices: [
      opt('tell', ['Tell your friend what you saw', 'Gördüğünü arkadaşına söyle'], (c) => {
        if (c.rng.chance(0.65)) { near(c, 'fr', 6); return out(c, { hap: -1 }, 'It breaks them and it does not break the friendship. They had a feeling. They cry in the car and thank you in the same sentence.', 'Onu kırıyor ama dostluğu kırmıyor. İçlerine doğmuştu. Arabada ağlıyor ve aynı cümlede teşekkür ediyor.'); }
        near(c, 'fr', -10);
        return out(c, { hap: -4 }, 'They don\'t believe you. Then they do, but the anger lands on the messenger. You lose a friend for a year, and get them back in the eleventh month, thinner and older.', 'Sana inanmıyor. Sonra inanıyor ama öfke haberciye yöneliyor. Bir yıl dostunu kaybediyorsun, on birinci ayda daha zayıf ve yaşlı geri dönüyor.');
      }, { badge: 'Risky' }),
      opt('confront', ['Speak to the partner first', 'Önce partnerle konuş'], (c) => out(c, { hap: 1 }, 'You give them a week to say it themselves. They manage three days. Then a very ordinary phone call changes two lives.', 'Kendilerinin söylemesi için bir hafta veriyorsun. Üç gün dayanıyorlar. Sonra çok sıradan bir telefon iki hayatı değiştiriyor.')),
      opt('silent', ['Say nothing', 'Hiçbir şey söyleme'], (c) => out(c, { hap: -3 }, 'It was not your place, you tell yourself. It all comes out in spring anyway, and your friend learns that you knew. The friendship cools.', 'Sana düşmezdi, diyorsun kendine. Her şey baharda yine de ortaya çıkıyor ve arkadaşın senin de bildiğini öğreniyor. Dostluk soğuyor.'), { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_old_debt',
    minAge: 30,
    weight: 18,
    cooldown: 10,
    maxPerLife: 1,
    title: (c) => c.t('A debt from before your time', 'Senden önceki bir borç'),
    text: (c) => c.t(`An old man knocks. He says that two generations back, someone in the ${c.p.lastName} family borrowed money from his family to buy a cart and never paid it back. He has a faded note. He is not angry, only precise.`, `Yaşlı bir adam kapını çalıyor. İki kuşak önce ${c.p.lastName} ailesinden birinin ailesinden bir araba almak için borç aldığını, hiç ödemediğini söylüyor. Solmuş bir senedi var. Kızgın değil, sadece titiz.`),
    choices: [
      opt('pay', ['Pay it, with something for the interest', 'Öde, faizi için biraz da ekle'], (c) => { lg(c, 8); return out(c, { hap: 4, usd: -400 }, 'He counts it twice, then gives you the note back. "The name is clear," he says. You hang the note on the wall of your hall, as a lesson and a decoration.', 'İki kez sayıyor, sonra senedi sana geri veriyor. "Soyadı temiz," diyor. Senedi koridorun duvarına asıyorsun, hem ders hem süs.'); }, { tone: 'good', ...afford(400) }),
      opt('ask', ['Ask for proof first', 'Önce kanıt iste'], (c) => {
        if (c.rng.chance(0.4)) { lg(c, 4); return out(c, { hap: 1, usd: -200 }, 'The proof is real. You settle for half, with a handshake, and he leaves satisfied. The honest bargaining feels more respectful than either blind paying or denying.', 'Kanıt gerçek. Yarısında el sıkışarak anlaşıyorsunuz, memnun gidiyor. Dürüst pazarlık, kör ödemeden de inkârdan da saygılı geliyor.'); }
        return out(c, { hap: 0 }, 'The note turns out to be from a different family with a similar name. He leaves, embarrassed, with a jar of your jam.', 'Senedin benzer adlı başka bir aileden olduğu anlaşılıyor. Mahcup, bir kavanoz reçelinle gidiyor.');
      }),
      opt('deny', ['Deny it and close the door', 'İnkâr et, kapıyı kapat'], (c) => { lg(c, -5); return out(c, { hap: -3 }, 'The door closes. The story does not. Within a month it has reached the bakery, with the cart now being a horse.', 'Kapı kapanıyor, hikâye kapanmıyor. Bir ay içinde fırına ulaşıyor, araba bu arada ata dönüşmüş.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_name_brand',
    minAge: 30,
    weight: 18,
    cooldown: 10,
    maxPerLife: 1,
    title: (c) => c.t('Your name on a jar', 'Soyadın bir kavanozda'),
    text: (c) => c.t(`A food company wants to put "${c.p.lastName}'s Own" on a line of ready-made jam, with a made-up "family recipe" and a grandmother in a headscarf on the label. The cheque is large. The grandmother is a stock photo.`, `Bir gıda şirketi hazır reçel serisine "${c.p.lastName} Usulü" adını verip uydurma bir "aile tarifi" ve etikete başörtülü bir nine koymak istiyor. Çek büyük. Nine bir stok fotoğraf.`),
    choices: [
      opt('sell', ['Sign it', 'İmzala'], (c) => { lg(c, -4); return out(c, { hap: 1, usd: 1200 }, 'The money lands on time. Shoppers see your surname above a lie about a grandmother. You never quite eat the jam.', 'Para zamanında geliyor. Alışverişçiler soyadını bir nine yalanının üstünde görüyor. Reçeli hiç yiyemiyorsun.'); }, { tone: 'bad', badge: 'Big money' }),
      opt('real', ['Insist on the real family recipe', 'Gerçek aile tarifinde ısrar et'], (c) => {
        if (c.rng.chance(0.5)) { lg(c, 6); return out(c, { hap: 4, usd: 500 }, 'They agree, and you cook for them in your own kitchen for a day. The label has a real grandmother on it. The jam is the best they have ever made.', 'Kabul ediyorlar, bir gün kendi mutfağında onlara yemek yapıyorsun. Etikette gerçek bir büyükanne var. Yaptıkları en iyi reçel.'); }
        return out(c, { hap: -1 }, 'They go for another family. You find the jam in a supermarket, with a different surname and a different lie. You eat a spoonful on principle.', 'Başka bir aileye gidiyorlar. Reçeli bir markette, farklı bir soyadı ve farklı bir yalanla buluyorsun. İlke olarak bir kaşık yiyorsun.');
      }, { badge: 'Risky' }),
      opt('no', ['Refuse', 'Reddet'], (c) => { lg(c, 3); return out(c, { hap: 2 }, 'You say the name is not for sale. It is the most expensive sentence you say all year, and the one you are happiest with.', 'Soyadının satılık olmadığını söylüyorsun. Yıl boyunca söylediğin en pahalı cümle, ve en memnun olduğun.'); }, { tone: 'good' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_apology',
    minAge: 35,
    weight: 18,
    cooldown: 10,
    maxPerLife: 1,
    title: (c) => c.t('The apology you owe', 'Borçlu olduğun özür'),
    text: (c) => c.t('Thirty years ago you let someone take the blame for something you did, and you have never told a soul. You see their name in the paper this morning: a small award for service to the town. It has been sitting on the table all day.', 'Otuz yıl önce yaptığın bir şeyin suçunu birinin üstlenmesine izin verdin ve kimseye söylemedin. Bu sabah gazetede adını görüyorsun: kasabaya hizmetten küçük bir ödül. Bütün gün masada duruyor.'),
    choices: [
      opt('letter', ['Write them a true letter', 'Ona doğru bir mektup yaz'], (c) => { lg(c, 3); return out(c, { hap: 6 }, 'It takes four drafts and one cup of cold coffee. The reply is a postcard, two lines: "I knew. Thank you for finally saying it."', 'Dört taslak ve bir soğuk kahve alıyor. Cevap bir kartpostal, iki satır: "Biliyordum. Sonunda söylediğin için sağ ol."'); }, { tone: 'good' }),
      opt('visit', ['Go and say it in person', 'Gidip yüz yüze söyle'], (c) => {
        if (c.rng.chance(0.6)) return out(c, { hap: 7 }, 'You stand on a step you don\'t know, and say it in nine words. They invite you in. The coffee, for once, has the right amount of sugar.', 'Tanımadığın bir basamakta durup dokuz sözcükle söylüyorsun. İçeri davet ediyor. Kahve, bu kez, şekeri tam yerinde.');
        return out(c, { hap: -3 }, 'They hear you out, close the door gently and don\'t open it again. You walk home lighter and sadder, both of which are true.', 'Seni dinliyor, kapıyı yavaşça kapatıyor ve bir daha açmıyor. Eve hem daha hafif hem daha hüzünlü yürüyorsun, ikisi de doğru.');
      }, { badge: 'Risky' }),
      opt('bury', ['Let it stay buried', 'Gömülü kalsın'], (c) => out(c, { hap: -3 }, 'You cut the article out and put it in a drawer, which is, you notice, a way of keeping it.', 'Yazıyı kesip bir çekmeceye koyuyorsun; bu, fark ediyorsun ki, onu saklamanın bir yolu.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_boss_lie',
    minAge: 24,
    maxAge: 62,
    weight: 80,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('A small lie for the client', 'Müşteriye küçük bir yalan'),
    text: (c) => c.t('Your manager wants you to tell a nervous client that the delivery "is on its way". It is not. It has not been ordered. "Just buy us a week," says your manager, with a smile like a mouth full of pins.', 'Yöneticin gergin bir müşteriye teslimatın "yolda" olduğunu söylemeni istiyor. Değil. Henüz sipariş bile verilmedi. "Bize bir hafta kazandır yeter," diyor yöneticin, iğne dolu bir ağız gibi gülümseyerek.'),
    choices: [
      opt('lie', ['Say it', 'Söyle'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: -2, usd: 80 }, 'The week is bought. The delivery arrives on day five. You are thanked, and the thanks tastes slightly of tin.', 'Hafta kazanılıyor. Teslimat beşinci gün geliyor. Teşekkür ediliyor ve teşekkürün tadı hafif teneke gibi.');
        return out(c, { hap: -5, usd: -150 }, 'The client checks. The client always checks. You are the face that said "on its way". Your manager is, somehow, in another meeting.', 'Müşteri kontrol ediyor. Müşteri her zaman kontrol eder. "Yolda" diyen yüz sensin. Yöneticin, nedense, başka bir toplantıda.');
      }, { badge: 'Risky', tone: 'bad' }),
      opt('truth', ['Tell the client the truth', 'Müşteriye doğruyu söyle'], (c) => {
        lg(c, 2);
        if (c.rng.chance(0.55)) return out(c, { hap: 3, usd: 150 }, 'The client is annoyed, then oddly impressed, then orders more. A manager who is angry at honesty is a manager with a problem, you find.', 'Müşteri sinirleniyor, sonra tuhaf biçimde etkileniyor, sonra daha fazla sipariş veriyor. Dürüstlüğe kızan yönetici, sorunu olan yönetici, öğreniyorsun.');
        return out(c, { hap: -3 }, 'The client cancels. Your manager says "I wouldn\'t have said that", which is a threat.', 'Müşteri iptal ediyor. Yöneticin "ben böyle söylemezdim" diyor; bu bir tehdit.');
      }, { badge: 'Risky', tone: 'good' }),
      opt('soft', ['Say "we are confirming dates"', '"Tarihleri netleştiriyoruz" de'], (c) => out(c, { hap: 0 }, 'Technically true, practically fuzzy. The client sighs and gives you the week. You decide it is a compromise, and not a compromise of the right kind.', 'Teknik olarak doğru, pratikte bulanık. Müşteri iç çekip haftayı veriyor. Bunun bir uzlaşma olduğuna karar veriyorsun, doğru türden olmayan bir uzlaşma.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_shared_ticket',
    minAge: 22,
    weight: 22,
    when: (c) => hasFriend(c) && adult(c),
    setup: (c) => pickFriend(c),
    title: (c) => c.t('The pooled ticket', 'Ortak bilet'),
    text: (c) => c.t(`You, ${nmc(c, 'fr')} and some friends agreed to buy a lottery ticket together, and nobody wrote it down. The ticket wins a prize. It is in your coat pocket. Only you know it won.`, `Sen, ${nmc(c, 'fr')} ve birkaç arkadaşın birlikte bir piyango bileti almaya karar vermiştiniz, kimse yazmadı. Bilet bir ödül kazanıyor. Cebinde. Sadece sen biliyorsun.`),
    choices: [
      opt('share', ['Tell everyone and split it fairly', 'Herkese söyle, adil böl'], (c) => { near(c, 'fr', 8); lg(c, 2); return out(c, { hap: 5, usd: 150 }, 'The group chat has never been so loud. Each share is modest, and the night out that follows is gigantic.', 'Grup sohbeti hiç bu kadar gürültülü olmamıştı. Her pay mütevazı, ardından gelen gece muazzam.'); }, { tone: 'good' }),
      opt('keep', ['Keep it all', 'Hepsini sakla'], (c) => {
        if (c.rng.chance(0.5)) { near(c, 'fr', -15); return out(c, { hap: -5, usd: 600 }, 'Somebody saw the shop receipt. Nobody says anything for a week. Then everybody says everything. You are richer, and your phone is a lot quieter.', 'Biri bilet fişini görmüş. Bir hafta kimse bir şey demiyor. Sonra herkes her şeyi diyor. Daha zenginsin ve telefonun çok daha sessiz.'); }
        return out(c, { hap: 1, usd: 600 }, 'Nobody ever knows. You buy something expensive and keep it in the cupboard because you can\'t quite enjoy it.', 'Kimse hiç bilmiyor. Pahalı bir şey alıyor ve tam zevk alamadığın için dolapta saklıyorsun.');
      }, { badge: 'Risky', tone: 'bad' }),
      opt('only', ['Split with the one who bought it', 'Bileti alanla böl'], (c) => out(c, { hap: 2, usd: 300 }, 'A sensible half and half. The others may never know how little they know.', 'Mantıklı bir yarı yarıya. Diğerleri ne kadar az bildiklerini hiç öğrenmeyebilir.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_broken_window',
    minAge: 7,
    maxAge: 14,
    weight: 100,
    cooldown: 4,
    maxPerLife: 1,
    title: (c) => c.t('The ball and the window', 'Top ve cam'),
    text: (c) => c.t('The ball goes up, over the wall and through the greenhouse window of the grumpy neighbour with the dog. The glass explodes with a very satisfying sound. Everyone else has already run away.', 'Top yükseliyor, duvarı aşıyor ve köpekli huysuz komşunun seranın camından geçiyor. Cam çok tatmin edici bir sesle patlıyor. Diğerleri çoktan kaçmış.'),
    choices: [
      opt('confess', ['Knock and confess', 'Kapıyı çal, itiraf et'], (c) => {
        if (c.rng.chance(0.6)) { lg(c, 1); return out(c, { hap: 3, usd: -10 }, 'The neighbour looks at you for a long time, then fetches a dustpan. You sweep glass for an hour. He gives you back the ball, and a plum.', 'Komşu uzun uzun sana bakıyor, sonra bir faraş getiriyor. Bir saat cam süpürüyorsun. Sana topu ve bir erik geri veriyor.'); }
        return out(c, { hap: -3, usd: -20 }, 'He shouts, the dog shouts, and your pocket money is gone for three months. But you sleep like a log.', 'O bağırıyor, köpek bağırıyor, harçlığın üç ay boyunca gidiyor. Ama kütük gibi uyuyorsun.');
      }, { tone: 'good', badge: 'Risky' }),
      opt('run', ['Run', 'Kaç'], (c) => {
        if (c.rng.chance(0.4)) return out(c, { hap: -5 }, 'A shape in a window sees your jumper. The next day the neighbour is at your door with a bill and your actual mother.', 'Bir penceredeki gölge kazağını görmüş. Ertesi gün komşu elinde fatura ve gerçek annenle kapında.');
        return out(c, { hap: -1 }, 'Nobody ever knows. You avoid the greenhouse for the rest of the summer, which turns out to be an effort.', 'Kimse bilmiyor. Yaz boyunca seradan kaçınıyorsun, bu da emek istiyor.');
      }, { badge: 'Risky' }),
      opt('blame', ['Say it was another kid', 'Başka bir çocuğun yaptığını söyle'], (c) => { lg(c, -1); return out(c, { hap: -4 }, 'A boy who was never even there gets blamed. You watch him get told off by his dad. The ball never feels the same again.', 'Orada hiç bulunmamış bir çocuk suçlanıyor. Babasından azar işitmesini izliyorsun. Top bir daha eskisi gibi olmuyor.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_sibling_blame',
    minAge: 7,
    maxAge: 16,
    weight: 90,
    cooldown: 4,
    maxPerLife: 1,
    needs: ['sibling', 'parent'],
    when: (c) => hasSibling(c),
    setup: (c) => pickSibling(c),
    title: (c) => c.t('Your sibling takes the fall', 'Suçu kardeşin üstleniyor'),
    text: (c) => c.t(`The good vase is in pieces and you are the one who dropped it. Before you can open your mouth, the grown-ups look at ${kw(c, 'sib')}: "Of course." ${Kw(c, 'sib')} looks at you, and says nothing.`, `Güzel vazo paramparça ve düşüren sensin. Ağzını açamadan büyükler ${kw(c, 'sib', 'dat')} bakıyor: "Tabii ki." ${Kw(c, 'sib')} sana bakıyor ve bir şey demiyor.`),
    choices: [
      opt('confess', ['Own up right now', 'Hemen itiraf et'], (c) => { near(c, 'sib', 8); lg(c, 1); return out(c, { hap: 1 }, 'You say "It was me" in a very small voice. You are grounded for a week. Your sibling gives you half their dessert, which is a bigger sacrifice than you realise.', '"Bendim" diyorsun, çok küçük bir sesle. Bir hafta cezalısın. Kardeşin tatlısının yarısını sana veriyor; farkında olduğundan büyük bir fedakârlık.'); }, { tone: 'good' }),
      opt('quiet', ['Let them take it', 'Üstlenmesine izin ver'], (c) => { near(c, 'sib', -8); return out(c, { hap: -4 }, 'Your sibling is sent to their room. You eat dinner as if it were a courtroom exhibit. At night you hear them not-crying.', 'Kardeşin odasına gönderiliyor. Yemeği sanki mahkeme delili gibi yiyorsun. Gece ağlamadıklarını duyuyorsun.'); }, { tone: 'bad' }),
      opt('late', ['Confess later, in private', 'Sonra, özelde itiraf et'], (c) => { near(c, 'sib', 3); return out(c, { hap: 0 }, 'You tell them in the dark that it was you. They say they know. They say they would have done the same, which is both kind and terrifying.', 'Karanlıkta ona bunu senin yaptığını söylüyorsun. Biliyormuş. Aynısını kendisinin de yapacağını söylüyor; hem nazik hem ürpertici.'); }),
    ],
  },
  {
    ...b,
    id: 'base.mr_lunch_share',
    minAge: 6,
    maxAge: 13,
    weight: 90,
    cooldown: 4,
    maxPerLife: 1,
    needs: ['student'],
    title: (c) => c.t('The empty lunchbox', 'Boş beslenme çantası'),
    text: (c) => c.t('A classmate opens a lunchbox that contains one dry roll and nothing else. They look very hard at the window. You have a sandwich, a banana, and a biscuit you were saving.', 'Bir sınıf arkadaşın beslenme çantasını açıyor; içinde kuru bir ekmek ve başka bir şey yok. Pencereye ısrarla bakıyor. Sende bir sandviç, bir muz ve sakladığın bir bisküvi var.'),
    choices: [
      opt('share', ['Share half of everything', 'Her şeyin yarısını paylaş'], (c) => { lg(c, 1); return out(c, { hap: 4 }, 'You do not make a speech. You just push half the sandwich over. A friendship that begins with a banana is a strong one.', 'Konuşma yapmıyorsun. Sandviçin yarısını uzatıyorsun. Muzla başlayan dostluk sağlam olur.'); }, { tone: 'good' }),
      opt('biscuit', ['Give just the biscuit', 'Sadece bisküviyi ver'], (c) => out(c, { hap: 2 }, 'You hand it over with a shrug. They eat it in two bites and smile with their whole face.', 'Omuz silkerek veriyorsun. İki lokmada yiyor ve bütün yüzüyle gülümsüyor.')),
      opt('eat', ['Eat your own lunch', 'Kendi yemeğini ye'], (c) => out(c, { hap: -2 }, 'You eat quickly, the way you do when you know you are being watched. The banana tastes of nothing.', 'Hızlı yiyorsun, izlendiğini bilenlerin yediği gibi. Muzun tadı yok.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_old_secret',
    minAge: 62,
    weight: 22,
    cooldown: 10,
    maxPerLife: 1,
    title: (c) => c.t('The secret in the drawer', 'Çekmecedeki sır'),
    text: (c) => c.t('You have kept one thing from your family for fifty years: a decision, a letter, a name. You are old enough now that "when I am gone" no longer sounds like a figure of speech.', 'Ailenden elli yıldır bir şeyi saklıyorsun: bir karar, bir mektup, bir isim. Artık "ben gidince" demek bir deyim gibi gelmeyecek kadar yaşlısın.'),
    choices: [
      opt('tell', ['Tell them at Sunday lunch', 'Pazar yemeğinde anlat'], (c) => {
        if (c.rng.chance(0.65)) { lg(c, 6); return out(c, { hap: 6 }, 'There is a silence you could slice. Then someone laughs, someone cries and somebody asks for more potatoes. You feel lighter by ten kilos.', 'Dilimlenecek kadar bir sessizlik oluyor. Sonra biri gülüyor, biri ağlıyor, biri daha patates istiyor. On kilo hafifliyorsun.'); }
        lg(c, -2);
        return out(c, { hap: -3 }, 'It lands badly. Chairs scrape. A week passes before the phone rings again. Eventually, it does, and the first question is "are you eating?" You are forgiven, the way old people are.', 'Kötü iniyor. Sandalyeler gıcırdıyor. Telefon tekrar çalmadan bir hafta geçiyor. Sonunda çalıyor ve ilk soru "yemek yiyor musun?" Affediliyorsun, yaşlıların affedildiği gibi.');
      }, { badge: 'Risky', tone: 'big' }),
      opt('letter', ['Leave it in a letter', 'Bir mektup bırak'], (c) => { lg(c, 3); return out(c, { hap: 2 }, 'You write it clearly and seal it, with instructions: "after". It is the most honest thing you have written. You put it back in the drawer, lighter.', 'Açıkça yazıp "sonra" talimatıyla mühürlüyorsun. Yazdığın en dürüst şey. Çekmeceye daha hafif geri koyuyorsun.'); }),
      opt('grave', ['Keep it to the end', 'Sonuna kadar sakla'], (c) => out(c, { hap: -2 }, 'Some things are not meant for telling. You decide this one is, and hold on. It sits in your chest at night like a stone you are used to.', 'Bazı şeyler anlatılmak için değildir. Bunun öyle olduğuna karar verip sıkı tutuyorsun. Geceleri göğsünde alıştığın bir taş gibi duruyor.')),
    ],
  },
  {
    ...b,
    id: 'base.mr_newcomers',
    minAge: 22,
    weight: 25,
    when: adult,
    title: (c) => c.t('The new family on the street', 'Sokağa taşınan yeni aile'),
    text: (c) => c.t('A family has moved into the empty house at the corner; they arrived from another country with six suitcases and a toddler. Some neighbours say "we don\'t know them", in the voice that means "we don\'t want to". A tray of anything would be a beginning.', 'Köşedeki boş eve bir aile taşındı; başka bir ülkeden altı bavul ve bir yürümeye başlayan çocukla geldiler. Bazı komşular "biz onları tanımıyoruz" diyor, "tanımak istemiyoruz" anlamındaki sesle. Her ne olsa bir tepsi bir başlangıç olur.'),
    choices: [
      opt('welcome', ['Bring a tray and say hello', 'Bir tepsi götür, merhaba de'], (c) => { lg(c, 3); return out(c, { hap: 4 }, 'You get a language lesson, four plates of something wonderful and an invitation to the toddler\'s birthday. Neighbours who were cold find a way of being warm without saying so.', 'Bir dil dersi, harika bir şeyin dört tabağı ve yürümeye başlayan çocuğun doğum günü davetini alıyorsun. Soğuk olan komşular, söylemeden ısınmanın bir yolunu buluyor.'); }, { tone: 'good' }),
      opt('wave', ['Nod politely when you pass', 'Geçerken kibarca başını salla'], (c) => out(c, { hap: 1 }, 'It is not much, but it counts. In a month the toddler waves at you from the window, like a very small mayor.', 'Çok değil ama sayılır. Bir ay sonra yürümeye başlayan çocuk pencereden sana el sallıyor, çok küçük bir belediye başkanı gibi.')),
      opt('gossip', ['Join the "we don\'t know them" club', '"Tanımıyoruz" kulübüne katıl'], (c) => { lg(c, -2); return out(c, { hap: -3 }, 'You say the things that are said. Later you see the toddler lose a mitten and nobody on the street picks it up. You do not, either, at first.', 'Söylenen şeyleri söylüyorsun. Sonra yürümeye başlayan çocuğun eldiveni düşüyor ve sokakta kimse almıyor. İlk anda sen de almıyorsun.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...b,
    id: 'base.mr_flood',
    minAge: 20,
    maxAge: 78,
    weight: 20,
    when: adult,
    title: (c) => c.t('The river is rising', 'Nehir yükseliyor'),
    text: (c) => c.t('After three days of rain, the river is at the top of the wall. The council has put out a call for sandbags and hands. Your own cellar is dry, so far, but the low houses down the street will not be.', 'Üç günlük yağmurdan sonra nehir duvarın tepesinde. Belediye kum torbası ve el için çağrı yaptı. Senin bodrumun şimdilik kuru ama sokağın aşağısındaki alçak evler öyle kalmayacak.'),
    choices: [
      opt('help', ['Spend the night filling bags', 'Geceyi torba doldurarak geçir'], (c) => { lg(c, 4); return out(c, { hap: 3, hea: -2 }, 'You carry bags until your hands stop feeling like hands. The wall holds. At dawn someone hands you bread and a thermos, and nobody asks your name.', 'Elin el olmaktan çıkana kadar torba taşıyorsun. Duvar tutuyor. Şafakta biri sana ekmek ve termos uzatıyor, kimse adını sormuyor.'); }, { tone: 'good' }),
      opt('own', ['Protect your own place first', 'Önce kendi evini koru'], (c) => out(c, { hap: -1, usd: 40 }, 'Your cellar stays dry. Two houses lower down do not. You see their furniture drying on the pavement for a week and avoid looking directly.', 'Bodrumun kuru kalıyor. Aşağıdaki iki ev kalmıyor. Mobilyalarının bir hafta kaldırımda kuruyuşunu görüyor ve doğrudan bakmamaya çalışıyorsun.')),
      opt('shelter', ['Open your home to a displaced family', 'Evini yerinden olmuş bir aileye aç'], (c) => { lg(c, 6); return out(c, { hap: 5, usd: -60 }, 'For nine days your sofa is a bed, your kitchen is a nursery and your life is a bit of a mess. When they leave, the quiet is almost unbearable.', 'Dokuz gün boyunca kanepen yatak, mutfağın kreş ve hayatın biraz karmakarışık. Gittiklerinde sessizlik neredeyse dayanılmaz.'); }, { tone: 'big', ...afford(60) }),
    ],
  },
  {
    ...b,
    id: 'base.mr_inside_tip',
    minAge: 28,
    maxAge: 64,
    weight: 60,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('A tip you were not meant to hear', 'Duymaman gereken bir ipucu'),
    text: (c) => c.t('Through a half-open door, you hear that your company will be bought on Monday, and the share price will jump. Your savings are sitting there, doing nothing. Nobody would ever know. Almost nobody.', 'Yarı açık bir kapıdan şirketinin pazartesi satın alınacağını ve hisse fiyatının fırlayacağını duyuyorsun. Birikimin orada, hiçbir şey yapmadan duruyor. Kimse asla bilmez. Neredeyse kimse.'),
    choices: [
      opt('buy', ['Buy shares on Friday', 'Cuma günü hisse al'], (c) => {
        if (c.rng.chance(0.35)) { c.p.criminalRecord += 1; lg(c, -8); return out(c, { hap: -8, usd: -500 }, 'Regulators notice the odd little trade. A letter, a lawyer, a fine, and a family name in a column called "Enforcement".', 'Düzenleyiciler tuhaf küçük işlemi fark ediyor. Bir mektup, bir avukat, bir ceza ve "Yaptırımlar" başlıklı bir sütunda aile adı.'); }
        return out(c, { hap: 1, usd: 700 }, 'It pays. You spend the money carefully, as if it might notice. You do not tell anyone, and you stop sitting near the legal department.', 'Kazandırıyor. Parayı sanki fark edecekmiş gibi dikkatle harcıyorsun. Kimseye söylemiyor, hukuk bölümünün yanına oturmayı bırakıyorsun.');
      }, { badge: 'Illegal', tone: 'bad' }),
      opt('forget', ['Forget you heard it', 'Duymamış ol'], (c) => { lg(c, 2); return out(c, { hap: 1 }, 'On Monday the price jumps. You read the headline with the exact feeling of a person who is right about something that did not matter.', 'Pazartesi fiyat fırlıyor. Başlığı, önemli olmayan bir konuda haklı çıkmış birinin tam da hissiyle okuyorsun.'); }, { tone: 'good' }),
      opt('tell', ['Tell compliance you overheard it', 'Uyum birimine duyduğunu bildir'], (c) => { lg(c, 3); return out(c, { hap: -1 }, 'A solemn man in a tie takes notes and thanks you in the tone of someone who is about to have a long, bad week. You leave, vaguely, a bit unpopular.', 'Kravatlı ciddi bir adam not alıyor ve uzun, kötü bir haftaya girmek üzere olan birinin tonuyla teşekkür ediyor. Hafifçe, biraz sevilmeyen biri olarak ayrılıyorsun.'); }),
    ],
  },
  {
    ...b,
    id: 'base.mr_favour_ask',
    minAge: 25,
    maxAge: 64,
    weight: 60,
    needs: ['employed'],
    when: employed,
    title: (c) => c.t('Put in a word for the nephew', 'Yeğen için bir söz söyle'),
    text: (c) => c.t('A family acquaintance takes you aside after a wedding. Their nephew needs a job. He is not the best candidate for the opening on your team, but he is not the worst either, and everyone will remember who helped.', 'Bir aile tanıdığı düğünden sonra seni kenara çekiyor. Yeğeninin işe ihtiyacı var. Ekibindeki açık pozisyon için en iyi aday değil ama en kötüsü de değil, ve herkes kimin yardım ettiğini hatırlayacak.'),
    choices: [
      opt('yes', ['Push him through', 'Onu içeri sok'], (c) => {
        if (c.rng.chance(0.5)) { lg(c, 2); return out(c, { hap: 2 }, 'He turns out to be competent and kind, and after a year nobody remembers how he got in. The family acquaintance sends you a crate of figs every autumn.', 'Yetkin ve nazik çıkıyor, bir yıl sonra kimse nasıl girdiğini hatırlamıyor. Aile tanıdığı her sonbahar sana bir kasa incir yolluyor.'); }
        lg(c, -3);
        return out(c, { hap: -4 }, 'He is late, lazy, and has opinions. Your manager says "who brought him in?" and everyone at the table looks at their coffee.', 'Geç kalıyor, tembel ve fikirli. Yöneticin "bunu kim getirdi?" diyor ve masadaki herkes kahvesine bakıyor.');
      }, { badge: 'Risky' }),
      opt('fair', ['Tell him to apply properly', 'Usulüne göre başvurmasını söyle'], (c) => { lg(c, 3); return out(c, { hap: 1 }, 'You send the link and wish him luck. He applies, does not get it, but writes a thank-you note. The acquaintance is quietly offended and quietly respectful.', 'Bağlantıyı gönderip şans diliyorsun. Başvuruyor, olmuyor, ama bir teşekkür notu yazıyor. Tanıdık sessizce gücenik ve sessizce saygılı.'); }, { tone: 'good' }),
      opt('no', ['Say you cannot get involved', 'Karışamayacağını söyle'], (c) => out(c, { hap: -1 }, 'You say you have no say in hiring, which is a little more false than you would like. The acquaintance nods and says it is understood. It isn\'t.', 'İşe alımda söz hakkın olmadığını söylüyorsun, istediğinden biraz daha yalan. Tanıdık anlıyorum diyor ve başını sallıyor. Anlamıyor.')),
    ],
  },
];

export const moralWaveEvents: EventDef[] = [...partA, ...partB, ...partC];
