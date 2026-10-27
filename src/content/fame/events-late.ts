import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from '../base/quick-event';
import { peekFame } from './state';

// Fame, after the spotlight: the long quiet decades of a person once known. Quick events (no rng, so seeds stay put),
// each with a free option. Gated on fans, not on the current path: a retired star is still remembered.
// Flags (they carry the year): fame_late_bio, fame_late_street, fame_late_rediscovered.

const F = { category: 'fame', weight: 7 } as const;
const fans = (c: Ctx) => peekFame(c.p)?.fans ?? 0;
const known = (n: number) => (c: Ctx) => fans(c) >= n && c.p.jailYears === 0;

const LATE: QuickEvent[] = [
  {
    ...F, id: 'fame.late_royalties', ages: [40, 95], cooldown: 8, when: known(5000),
    title: ['A royalty statement arrives, small and loyal.', 'Telif bildirimi geliyor; küçük ama sadık.'],
    text: ['Somewhere a radio, a shop or a lift played your work this year. The cheque says so, to the penny.', 'Bir yerlerde bir radyo, bir dükkân ya da bir asansör bu yıl işini çaldı. Çek, kuruşu kuruşuna bunu söylüyor.'],
    options: [
      { id: 'frame', label: ['Frame the first one and cash the rest', 'İlkini çerçevele, gerisini bozdur'], usd: 260, stats: { happiness: 2 }, tone: 'good', result: ['The old work still pays for coffee. You hung the framed cheque in the hall, next to the barometer.', 'Eski işin hâlâ kahveyi ödüyor. Çerçeveli çeki koridora, barometrenin yanına astın.'] },
      { id: 'cash', label: ['Cash it and carry on', 'Bozdur ve devam et'], usd: 260, result: ['A modest, dependable sum. It arrives every year like a postcard from your younger self.', 'Mütevazı, güvenilir bir tutar. Her yıl, genç halinden gelen bir kartpostal gibi geliyor.'] },
    ],
  },
  {
    ...F, id: 'fame.late_biography', ages: [45, 92], once: true, when: known(20000),
    title: ['A writer wants to tell your story.', 'Bir yazar hikâyeni anlatmak istiyor.'],
    text: ['They have read everything, including the things you had hoped nobody kept. They would like tea and three afternoons.', 'Her şeyi okumuşlar; kimsenin saklamadığını umduğun şeyler dahil. Bir çay ve üç öğleden sonra istiyorlar.'],
    options: [
      { id: 'open', label: ['Tell it all, honestly', 'Hepsini dürüstçe anlat'], stats: { happiness: 3, smarts: 1 }, legacy: 4, flags: ['fame_late_bio'], tone: 'good', result: ['It took longer than three afternoons. The book was kinder than you deserved and more accurate than you wished.', 'Üç öğleden sonradan uzun sürdü. Kitap hak ettiğinden nazik, istediğinden doğruydu.'] },
      { id: 'edit', label: ['Tell the good version', 'İyi versiyonu anlat'], stats: { happiness: 1 }, legacy: 1, flags: ['fame_late_bio'], result: ['It was a lovely book about someone who was slightly taller than you. Reviewers called it “warm”.', 'Senden biraz daha uzun birini anlatan hoş bir kitaptı. Eleştirmenler "sıcak" dedi.'] },
      { id: 'no', label: ['Decline; let people guess', 'Reddet; insanlar tahmin etsin'], stats: { happiness: 1 }, result: ['They wrote about you anyway. You read it on a bench and corrected nothing, mostly out of curiosity.', 'Yine de seni yazdılar. Bir bankta okudun ve çoğunlukla merakından hiçbir şeyi düzeltmedin.'] },
    ],
  },
  {
    ...F, id: 'fame.late_tribute', ages: [50, 95], cooldown: 12, light: true, when: known(30000),
    title: ['A tribute evening is planned in your honour.', 'Onuruna bir anma gecesi planlanıyor.'],
    text: ['Younger people will perform your work, slightly faster than you ever did. You are invited to sit in the front row.', 'Daha genç insanlar işini, senin hiç yapmadığın kadar hızlı seslendirecek. Ön sıraya oturman rica ediliyor.'],
    options: [
      { id: 'go', label: ['Attend and stand up when they ask', 'Katıl ve istediklerinde ayağa kalk'], stats: { happiness: 5 }, legacy: 2, tone: 'good', result: ['They played it too fast and you loved every second. When the lights found you, you waved like someone surprised to be real.', 'Fazla hızlı çaldılar ve her saniyesini sevdin. Işıklar seni bulduğunda, var olmasına şaşırmış biri gibi el salladın.'] },
      { id: 'back', label: ['Watch from the back, unannounced', 'Arkadan, duyurmadan izle'], stats: { happiness: 3 }, result: ['Nobody noticed you, which suited you. A stranger next to you sang every word and cried at the bridge.', 'Kimse fark etmedi; sana uyardı. Yanındaki bir yabancı her sözü söyledi ve köprü bölümünde ağladı.'] },
      { id: 'stay', label: ['Send a letter and stay at home', 'Bir mektup gönder, evde kal'], stats: { happiness: 1 }, result: ['Your letter was read out in a very good voice that was not yours. It was still the nicest part.', 'Mektubun, seninkine benzemeyen çok güzel bir sesle okundu. Yine de en güzel kısım oydu.'] },
    ],
  },
  {
    ...F, id: 'fame.late_masterclass', ages: [40, 88], cooldown: 7, when: known(8000),
    title: ['A school asks you to give a masterclass.', 'Bir okul senden usta sınıfı vermeni istiyor.'],
    text: ['Thirty teenagers, a warm hall and a front row that sits very straight.', 'Otuz genç, ılık bir salon ve çok dik oturan bir ön sıra.'],
    options: [
      { id: 'teach', label: ['Teach properly, with exercises', 'Alıştırmalarla düzgünce öğret'], stats: { smarts: 2, happiness: 3 }, legacy: 2, tone: 'good', result: ['One girl in the back asked the question you had asked at her age. You answered it better than anyone had answered you.', 'Arkadaki bir kız, senin onun yaşında sorduğun soruyu sordu. Sana verilen cevaplardan daha iyi cevapladın.'] },
      { id: 'stories', label: ['Tell stories and sign things', 'Hikâyeler anlat ve bir şeyler imzala'], stats: { happiness: 2 }, result: ['They loved the one about the broken van. You signed a ruler, a hand and, regrettably, a school desk.', 'Bozulan minibüs hikâyesini çok sevdiler. Bir cetveli, bir eli ve ne yazık ki bir okul sırasını imzaladın.'] },
      { id: 'pass', label: ['Politely decline', 'Kibarca reddet'], result: ['You sent a signed poster and good wishes. The poster is in the staff room, slightly crooked.', 'İmzalı bir poster ve iyi dilekler gönderdin. Poster öğretmenler odasında, hafif eğri duruyor.'] },
    ],
  },
  {
    ...F, id: 'fame.late_tabloid', ages: [35, 90], cooldown: 9, when: known(40000),
    title: ['“Where are they now?” — and it is you.', '"Şimdi neredeler?" ve konu sensin.'],
    text: ['A magazine has found you at the market, in a coat, holding leeks. The headline is gentler than the photo.', 'Bir dergi seni pazarda, paltoyla, elinde pırasalarla yakalamış. Başlık fotoğraftan daha nazik.'],
    options: [
      { id: 'laugh', label: ['Share it yourself with a joke', 'Bir şaka ile kendin paylaş'], stats: { happiness: 2 }, legacy: 1, tone: 'good', result: ['“Leeks, since you asked.” The internet adored it for a day and a half, which is a good length.', '"Madem sordunuz, pırasa." İnternet bir buçuk gün boyunca bayıldı; iyi bir süre.'] },
      { id: 'ignore', label: ['Ignore it', 'Görmezden gel'], result: ['By Thursday it was wrapping fish. The leeks, on the other hand, were excellent in a soup.', 'Perşembeye balık sarıyordu. Pırasalar ise çorbada harikaydı.'] },
      { id: 'cross', label: ['Write them an angry letter', 'Onlara öfkeli bir mektup yaz'], stats: { happiness: -2 }, tone: 'bad', result: ['They printed your letter beside a larger photograph. You read it four times, each time getting less angry.', 'Mektubunu daha büyük bir fotoğrafın yanında yayımladılar. Dört kez okudun; her seferinde biraz daha az öfkelendin.'] },
    ],
  },
  {
    ...F, id: 'fame.late_fan_letter', ages: [40, 95], cooldown: 10, once: true, when: known(3000),
    title: ['A letter from a fan, thirty years late.', 'Bir hayrandan, otuz yıl gecikmiş bir mektup.'],
    text: ['It was posted decades ago, lost in a sorting office and found behind a radiator. Every word is in careful pencil.', 'Onlarca yıl önce postalanmış, bir dağıtım merkezinde kaybolmuş ve bir kalorifer arkasında bulunmuş. Her kelime özenli kurşun kalemle yazılmış.'],
    options: [
      { id: 'reply', label: ['Track them down and reply', 'Onu bul ve cevap yaz'], stats: { happiness: 5 }, legacy: 2, tone: 'good', result: ['They were seventy now and had kept every record. The reply you got made you sit down on the stairs.', 'Artık yetmiş yaşındaydı ve bütün plakları saklamıştı. Gelen cevap seni merdivene oturttu.'] },
      { id: 'keep', label: ['Keep the letter safe', 'Mektubu güvenle sakla'], stats: { happiness: 3 }, result: ['You read it on difficult days. It said, simply, that you had made someone’s year bearable.', 'Zor günlerde okudun. Basitçe, birinin yılını katlanılır kıldığını söylüyordu.'] },
    ],
  },
  {
    ...F, id: 'fame.late_museum', ages: [55, 95], once: true, when: known(60000),
    title: ['A museum would like some of your things.', 'Bir müze eşyalarından bazılarını istiyor.'],
    text: ['A stage costume, a battered notebook, the first thing you ever earned. A curator in white gloves is very polite about it.', 'Bir sahne kostümü, yıpranmış bir defter, ilk kazandığın şey. Beyaz eldivenli bir küratör bu konuda çok kibar.'],
    options: [
      { id: 'give', label: ['Donate it all', 'Hepsini bağışla'], stats: { happiness: 4 }, legacy: 6, tone: 'good', result: ['Behind glass, it looked like it belonged to someone else, someone remarkable. A school group stopped and pointed.', 'Camın ardında başkasına, dikkate değer birine ait gibi göründü. Bir okul grubu durup parmakla gösterdi.'] },
      { id: 'loan', label: ['Lend a few pieces', 'Birkaç parçayı ödünç ver'], stats: { happiness: 2 }, legacy: 3, result: ['A compromise. The notebook stayed with you, and you visited the costume as one visits an old friend.', 'Bir uzlaşma. Defter sende kaldı; kostümü eski bir arkadaşı ziyaret eder gibi ziyaret ettin.'] },
      { id: 'keep', label: ['Keep everything at home', 'Her şeyi evde tut'], stats: { happiness: 1 }, result: ['The cupboard of memories stays shut, with a smell of cedar and a few silver sequins in the corners.', 'Anı dolabı kapalı kalıyor; sedir kokusu ve köşelerde birkaç gümüş pul ile.'] },
    ],
  },
  {
    ...F, id: 'fame.late_documentary', ages: [45, 92], once: true, when: known(100000),
    title: ['A film crew wants to make a documentary about you.', 'Bir film ekibi hakkında belgesel çekmek istiyor.'],
    text: ['They have lights, a very young director and an alarming number of questions about 1994.', 'Işıkları, çok genç bir yönetmenleri ve 1994 hakkında endişe verici sayıda sorusu var.'],
    options: [
      { id: 'yes', label: ['Say yes and open the archives', 'Evet de, arşivi aç'], stats: { happiness: 4, smarts: 1 }, legacy: 5, usd: 300, tone: 'good', result: ['They filmed you making toast for six hours. It became the best scene. It won a small prize at a festival in the rain.', 'Altı saat boyunca senin tost yapmanı çektiler. En iyi sahne o oldu. Yağmurlu bir festivalde küçük bir ödül aldı.'] },
      { id: 'limited', label: ['Agree, with conditions', 'Şartlarla kabul et'], stats: { happiness: 2 }, legacy: 2, result: ['They honoured eleven of your fourteen conditions. The film is shorter than you hoped and somehow truer.', 'Ondört şartından on birini kabul ettiler. Film umduğundan kısa ve nedense daha doğru.'] },
      { id: 'no', label: ['Say no', 'Hayır de'], result: ['They made it without you, using archive footage and a man who once met you at a petrol station.', 'Sensiz çektiler; arşiv görüntüleri ve seninle bir benzinlikte tanışmış bir adamla.'] },
    ],
  },
  {
    ...F, id: 'fame.late_rival_funeral', ages: [50, 95], once: true, when: known(30000),
    title: ['An old rival has died.', 'Eski bir rakibin vefat etti.'],
    text: ['For years you each read the other’s reviews first. The news comes by phone, in a voice made careful.', 'Yıllarca ikiniz de önce diğerinin eleştirilerini okudunuz. Haber telefonla, dikkatli bir sesle geliyor.'],
    options: [
      { id: 'speak', label: ['Go and say a few words', 'Git ve birkaç söz söyle'], stats: { happiness: -1 }, legacy: 3, tone: 'good', result: ['You said you had never won anything without them in the room. It was true and cost you nothing to say.', 'Odada onlar olmadan hiçbir şey kazanmadığını söyledin. Doğruydu ve söylemek sana hiçbir şeye mal olmadı.'] },
      { id: 'quiet', label: ['Attend quietly at the back', 'Arka sırada sessizce katıl'], stats: { happiness: -1 }, result: ['Others spoke. You stood outside afterwards for a while with your hat in your hands, thinking of 1988.', 'Başkaları konuştu. Sonrasında elinde şapkanla bir süre dışarıda durup 1988’i düşündün.'] },
      { id: 'send', label: ['Send flowers and a short note', 'Çiçek ve kısa bir not gönder'], stats: { happiness: -2 }, result: ['The note took you an hour to write and was seven words long. They were the right seven.', 'Notu yazman bir saat sürdü ve yedi kelimeydi. Doğru yedi kelimeydi.'] },
    ],
  },
  {
    ...F, id: 'fame.late_street', ages: [60, 95], once: true, when: known(250000),
    title: ['The town wants to name a street after you.', 'Kasaba bir sokağa adını vermek istiyor.'],
    text: ['A small lane by the bakery, which is what you would have chosen. The council meeting was surprisingly passionate.', 'Fırının yanında küçük bir sokak; senin de seçeceğin yer. Belediye toplantısı şaşırtıcı derecede tutkuluydu.'],
    options: [
      { id: 'unveil', label: ['Attend the unveiling', 'Açılışa katıl'], stats: { happiness: 6 }, legacy: 6, flags: ['fame_late_street'], tone: 'big', result: ['A sign with your name on it, a brass band and a small boy asking why. You stood beneath it and tried to look like someone dignified.', 'Üzerinde adın yazılı bir tabela, bir bando ve nedenini soran küçük bir çocuk. Altında durup vakur biri gibi görünmeye çalıştın.'] },
      { id: 'humble', label: ['Ask them to name it after the baker', 'Fırıncının adını vermelerini iste'], stats: { happiness: 3 }, legacy: 2, flags: ['fame_late_street'], result: ['The baker wept and had to sit down. The street got a new name and a plaque in smaller letters, below yours.', 'Fırıncı ağladı ve oturmak zorunda kaldı. Sokağa yeni bir ad ve altında daha küçük harflerle bir plaket geldi.'] },
      { id: 'no', label: ['Decline gracefully', 'Nezaketle reddet'], result: ['The council named it after a tree. It is a perfectly good street, and you walk down it often.', 'Belediye bir ağacın adını verdi. Gayet iyi bir sokak ve sık sık oradan yürüyorsun.'] },
    ],
  },
  {
    ...F, id: 'fame.late_rediscovered', ages: [40, 90], cooldown: 15, once: true, when: known(10000),
    title: ['A young audience has found your old work.', 'Genç bir kitle eski işini keşfetti.'],
    text: ['A clip from decades ago is everywhere. The comments are in three alphabets and half of them are in capital letters.', 'Onlarca yıl öncesinden bir görüntü her yerde. Yorumlar üç alfabeyle ve yarısı büyük harfle yazılmış.'],
    options: [
      { id: 'lean', label: ['Join in and answer the comments', 'Katıl, yorumları cevapla'], stats: { happiness: 4 }, legacy: 2, flags: ['fame_late_rediscovered'], usd: 400, tone: 'good', result: ['A girl of nineteen wrote “you were ahead of your time”. You wrote back “I was merely on time, the rest were late”.', 'On dokuz yaşında bir kız "çağının önündeydin" yazdı. Sen "ben sadece vaktindeydim, diğerleri geç kaldı" yazdın.'] },
      { id: 'watch', label: ['Watch from a distance', 'Uzaktan izle'], stats: { happiness: 2 }, flags: ['fame_late_rediscovered'], result: ['You watched the numbers grow and your younger self dance with surprising confidence. You did not interrupt.', 'Rakamların büyümesini ve genç halinin şaşırtıcı bir özgüvenle dans edişini izledin. Araya girmedin.'] },
    ],
  },
  {
    ...F, id: 'fame.late_one_more', ages: [50, 85], cooldown: 14, light: true, when: known(60000),
    title: ['“One more show?” — they ask, and keep asking.', '"Bir gösteri daha?" diye soruyorlar ve sormaya devam ediyorlar.'],
    text: ['The promoter has brought a hall, a date and a chair on stage "just in case".', 'Organizatör bir salon, bir tarih ve "ne olur ne olmaz" diye sahnede bir sandalye getirmiş.'],
    options: [
      { id: 'play', label: ['Do it, chair and all', 'Yap, sandalyeyle birlikte'], stats: { happiness: 5, health: -2 }, usd: 450, legacy: 3, tone: 'good', result: ['You sat for half of it and nobody minded. The encore went on long enough for the ushers to start sweeping.', 'Yarısını oturarak geçirdin; kimse umursamadı. Bis, görevliler süpürmeye başlayana kadar sürdü.'] },
      { id: 'short', label: ['Do a short set and go home', 'Kısa bir set yap ve eve dön'], stats: { happiness: 3 }, usd: 200, result: ['Forty minutes, three songs everyone wanted and a standing ovation for your jacket. You were home by ten.', 'Kırk dakika, herkesin istediği üç parça ve ceketine ayakta alkış. Saat ona kalmadan evdeydin.'] },
      { id: 'enough', label: ['Say it is enough', 'Yeter de'], stats: { happiness: 1 }, result: ['You said it kindly, and the promoter said he understood. He has, however, left the chair with you.', 'Nazikçe söyledin; organizatör anladığını söyledi. Yine de sandalyeyi sende bıraktı.'] },
    ],
  },
  {
    ...F, id: 'fame.late_stage_name', ages: [50, 90], once: true, when: (c) => fans(c) >= 40000 && c.h.relatives('child').length > 0,
    title: ['A younger relative wants your stage name.', 'Genç bir yakının sahne adını istiyor.'],
    text: ['They have grown up inside it, and they say the name still works. They ask carefully, as one asks for a house.', 'Onun içinde büyüdü ve adın hâlâ işe yaradığını söylüyor. Bir ev ister gibi, dikkatle soruyor.'],
    options: [
      { id: 'bless', label: ['Give your blessing', 'Dileğini ver'], stats: { happiness: 4 }, legacy: 4, closeness: { kinds: ['child'], delta: 6 }, tone: 'good', result: ['“Wear it better than I did.” They said they would try. They were wearing your old jacket, and it fit.', '"Benden iyi taşı." Deneyeceklerini söylediler. Eski ceketini giymişlerdi ve tam oturuyordu.'] },
      { id: 'own', label: ['Suggest they build a name of their own', 'Kendi adını yapmasını öner'], stats: { happiness: 2 }, closeness: { kinds: ['child'], delta: 2 }, result: ['They went quiet, then laughed, then agreed. Years later they thanked you for it, in public, in a name that was theirs.', 'Sustular, sonra güldüler, sonra kabul ettiler. Yıllar sonra bunun için sana, herkesin önünde, kendilerine ait bir adla teşekkür ettiler.'] },
    ],
  },
  {
    ...F, id: 'fame.late_retire_party', ages: [55, 90], once: true, light: true, when: known(15000),
    title: ['Your last day, on your own terms.', 'Son günün, kendi şartlarınla.'],
    text: ['People you worked with over decades have turned up with cake. Someone has made a banner and spelled your name right.', 'Onlarca yıl birlikte çalıştığın insanlar pasta ile gelmiş. Biri bir pankart yapmış ve adını doğru yazmış.'],
    options: [
      { id: 'speech', label: ['Make a short speech', 'Kısa bir konuşma yap'], stats: { happiness: 4 }, legacy: 2, tone: 'good', result: ['You thanked everyone and mispronounced one name; they forgave you for it, in chorus.', 'Herkese teşekkür ettin ve bir ismi yanlış söyledin; koro halinde seni affettiler.'] },
      { id: 'eat', label: ['Just eat the cake', 'Sadece pastayı ye'], stats: { happiness: 3 }, result: ['It was lemon, a little dry, and exactly right. Someone cried into a napkin, which you pretended not to see.', 'Limonluydu, biraz kuru ve tam olması gerektiği gibi. Biri peçeteye ağladı; görmemiş gibi yaptın.'] },
    ],
  },
  {
    ...F, id: 'fame.late_old_audience', ages: [45, 95], cooldown: 8, when: known(3000),
    title: ['A stranger on the bus knows who you are.', 'Otobüste bir yabancı kim olduğunu biliyor.'],
    text: ['They are very old and very sure. “You,” they say, pointing a stick. “You were on the wireless.”', 'Çok yaşlı ve çok emin. "Sen," diyor, bir bastonla işaret ederek. "Sen radyodaydın."'],
    options: [
      { id: 'chat', label: ['Sit down and talk', 'Otur ve konuş'], stats: { happiness: 3 }, tone: 'good', result: ['They told you the whole of 1971 and where they had been when they first heard you. You missed your stop and did not mind.', 'Sana bütün 1971’i ve seni ilk duyduklarında nerede olduklarını anlattılar. Durağını kaçırdın ve umursamadın.'] },
      { id: 'smile', label: ['Smile and nod', 'Gülümse ve başını salla'], stats: { happiness: 1 }, result: ['You nodded the nod of a person caught in a good memory. They nodded back. The bus did the rest.', 'İyi bir anıya yakalanmış birinin başını sallayışıyla salladın. Onlar da karşılık verdi. Gerisini otobüs halletti.'] },
    ],
  },
  {
    ...F, id: 'fame.late_copyists', ages: [40, 85], cooldown: 12, when: known(50000),
    title: ['A new act sounds a lot like you.', 'Yeni bir isim sana çok benziyor.'],
    text: ['The phrasing, the hair, even the pause before the chorus. Friends send you links with captions such as “??”.', 'Cümle kuruşu, saçı, hatta nakaratın öncesindeki duraklama. Arkadaşların sana "??" notuyla bağlantılar atıyor.'],
    options: [
      { id: 'flatter', label: ['Take it as a compliment', 'İltifat olarak al'], stats: { happiness: 2 }, legacy: 1, tone: 'good', result: ['You sent them a bottle of something and a note that said “mind the pause”. They replied with a very long emoji.', 'Onlara bir şişe bir şey ve "duraklamaya dikkat" yazan bir not gönderdin. Çok uzun bir emojiyle cevap verdiler.'] },
      { id: 'meet', label: ['Invite them for coffee', 'Kahveye davet et'], stats: { happiness: 3, smarts: 1 }, legacy: 2, result: ['They were shy and terrified of you. By the second cup they were arguing about tuning with their mouth full.', 'Utangaç ve senden ödü kopmuş haldeydiler. İkinci fincanda ağızları dolu bir şekilde akort tartışıyorlardı.'] },
      { id: 'sulk', label: ['Sulk for a week', 'Bir hafta surat as'], stats: { happiness: -2 }, tone: 'bad', result: ['The sulk was very thorough. At the end of it you noticed they were actually rather good, which was worse.', 'Surat asma çok titizdi. Sonunda aslında epey iyi olduklarını fark ettin; bu daha kötüydü.'] },
    ],
  },
  {
    ...F, id: 'fame.late_health_scare', ages: [50, 92], cooldown: 12, when: (c) => fans(c) >= 10000 && c.p.stats.health < 65,
    title: ['Your body asks to be taken seriously.', 'Vücudun ciddiye alınmak istiyor.'],
    text: ['Years of late nights, bad coaches and standing in draughts have added up. A doctor says “let us talk about your schedule”.', 'Yıllarca geç saatler, kötü otobüsler ve cereyanda beklemek birikmiş. Doktor "programınız hakkında konuşalım" diyor.'],
    options: [
      { id: 'rest', label: ['Take a proper long rest', 'Gerçekten uzun bir dinlen'], stats: { health: 4, happiness: 1 }, flags: [], tone: 'good', result: ['Three months of porridge and sleep. You returned with a calmer voice and a very small suitcase.', 'Üç ay lapa ve uyku. Daha sakin bir sesle ve çok küçük bir bavulla döndün.'] },
      { id: 'slow', label: ['Cut the schedule in half', 'Programı yarıya indir'], stats: { health: 2 }, result: ['Half the dates, twice the dinner. You were surprised how little the world minded.', 'Yarı tarih, iki kat akşam yemeği. Dünyanın ne kadar az umursadığına şaşırdın.'] },
      { id: 'carry', label: ['Carry on as before', 'Eskisi gibi devam et'], stats: { health: -3 }, tone: 'bad', result: ['The body said nothing more for a while. It was saving up what it wanted to say.', 'Vücut bir süre bir şey demedi. Söyleyeceklerini biriktiriyordu.'] },
    ],
  },
  {
    ...F, id: 'fame.late_honorary', ages: [55, 95], once: true, when: known(80000),
    title: ['A university offers you an honorary degree.', 'Bir üniversite sana fahri doktora vermek istiyor.'],
    text: ['A gown, a hat that does not fit and a ceremony in which someone describes your life in the third person.', 'Bir cüppe, oturmayan bir şapka ve birinin hayatını üçüncü kişi olarak anlattığı bir tören.'],
    options: [
      { id: 'accept', label: ['Accept and give the address', 'Kabul et ve konuşma yap'], stats: { happiness: 4, smarts: 2 }, legacy: 4, tone: 'good', result: ['You told the graduates to be kind to the people who typed the programme. The hat stayed on throughout, mostly.', 'Mezunlara programı yazanlara nazik olmalarını söyledin. Şapka boyunca üzerinde kaldı; çoğunlukla.'] },
      { id: 'quiet', label: ['Accept by post', 'Posta ile kabul et'], stats: { happiness: 2 }, legacy: 1, result: ['A tube arrived with a scroll in it. It is on the wall now, above the kettle, at an angle of mild pride.', 'İçinde bir parşömen olan bir tüp geldi. Şimdi duvarda, su ısıtıcısının üstünde, hafif bir gurur açısında duruyor.'] },
      { id: 'no', label: ['Decline', 'Reddet'], result: ['“I did not earn it the usual way.” They said that was the point. You still said no, warmly.', '"Alışılmış yoldan kazanmadım." Bunun amaç olduğunu söylediler. Yine de sıcak bir şekilde hayır dedin.'] },
    ],
  },
  {
    ...F, id: 'fame.late_garden_gig', ages: [55, 95], cooldown: 6, light: true, when: known(2000),
    title: ['A neighbour asks you to play at a garden party.', 'Bir komşu bahçe partisinde sahne almanı rica ediyor.'],
    text: ['Eight guests, a trestle table and a speaker held up with a book. It is the smallest show of your career.', 'Sekiz konuk, bir katlanır masa ve bir kitapla ayakta tutulan bir hoparlör. Kariyerinin en küçük gösterisi.'],
    options: [
      { id: 'play', label: ['Play your heart out', 'Canla başla çal'], stats: { happiness: 5 }, tone: 'good', result: ['A child danced on a deckchair. It was the best audience you have had since the nineties.', 'Bir çocuk şezlongun üzerinde dans etti. Doksanlardan beri en iyi izleyiciydi.'] },
      { id: 'drop', label: ['Come for the food only', 'Sadece yemek için gel'], stats: { happiness: 2 }, result: ['They asked three times. You said “I am retired” and had a second helping of the pastry.', 'Üç kez sordular. "Emekliyim" dedin ve börekten ikinci kez aldın.'] },
    ],
  },
  {
    ...F, id: 'fame.late_anniversary_release', ages: [45, 90], cooldown: 12, when: known(50000),
    title: ['The label plans an anniversary reissue.', 'Plak şirketi yıldönümü baskısı planlıyor.'],
    text: ['New sleeve, remastered sound, a booklet of photographs you do not remember agreeing to.', 'Yeni kapak, yeniden masterlanmış ses ve onayladığını hatırlamadığın fotoğraflardan bir kitapçık.'],
    options: [
      { id: 'liner', label: ['Write the sleeve notes yourself', 'Kapak yazısını kendin yaz'], stats: { happiness: 3, smarts: 1 }, usd: 350, legacy: 2, tone: 'good', result: ['You wrote four paragraphs and cut them to one. The reissue sold out at a charming speed.', 'Dört paragraf yazdın ve bire indirdin. Yeniden baskı hoş bir hızla tükendi.'] },
      { id: 'approve', label: ['Approve it and take the cheque', 'Onayla ve çeki al'], stats: { happiness: 1 }, usd: 250, result: ['A new fan wrote that it sounded “like a warm room”. You decided to take that as the review.', 'Yeni bir hayran "ılık bir oda gibi" diye yazdı. Bunu eleştiri olarak kabul etmeye karar verdin.'] },
    ],
  },
];

export const lateFameEvents: EventDef[] = LATE.map(quickEvent);
