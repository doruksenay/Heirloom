import type { Ctx, EventDef } from '../types';
import { quickEvent, type QuickEvent } from './quick-event';

// A second story for the jobs that had only one (or none): what happens at work depends on what the work is.
// Quick events (quick-event.ts): no rng, so they shift nobody's seed. Each fires only for its own job.

const as = (job: string) => (c: Ctx) => c.p.jobId === job;
const WORK = { category: 'work', cooldown: 10, weight: 12 } as const;

const JOBS: QuickEvent[] = [
  // ------------------------------------------------ retail
  {
    ...WORK,
    id: 'base.job_retail_return',
    ages: [16, 64],
    when: as('retail'),
    title: ['A customer returns a jumper that is clearly worn and slightly on fire.', 'Bir müşteri, belli ki giyilmiş ve hafif yanık bir kazağı iade etmek istiyor.'],
    text: ['“It was like this when I bought it,” they say, with a face of perfect innocence.', '“Aldığımda böyleydi” diyor, kusursuz bir masumiyetle.'],
    options: [
      {
        id: 'refuse',
        label: ['Politely refuse the return', 'İadeyi kibarca reddet'],
        stats: { happiness: -1, smarts: 1 },
        result: ['You refused with such courtesy that the customer apologised and bought a scarf. The manager noticed.', 'O kadar nezaketle reddettin ki müşteri özür diledi ve bir atkı aldı. Müdür fark etti.'],
      },
      {
        id: 'accept',
        label: ['Accept it and hope for the best', 'Kabul et ve en iyisini um'],
        usd: -20,
        stats: { happiness: 2 },
        result: ['You took it back and quietly paid the difference from your own pocket. The customer left with a new jumper and a warm feeling you did not share.', 'İadeyi aldın ve farkı sessizce kendi cebinden ödedin. Müşteri yeni bir kazak ve senin paylaşmadığın sıcak bir duyguyla ayrıldı.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_retail_sale',
    ages: [16, 64],
    when: as('retail'),
    title: ['The big sale starts at nine.', 'Büyük indirim dokuzda başlıyor.'],
    text: ['At eight forty-five there are two hundred people at the door, and one of them has brought a folding chair.', 'Sekizi kırk beşte kapıda iki yüz kişi var ve içlerinden biri katlanır bir sandalye getirmiş.'],
    options: [
      {
        id: 'calm',
        label: ['Stand at the door and keep order', 'Kapıda dur ve düzeni sağla'],
        stats: { happiness: 2 },
        usd: 25,
        result: ['You let them in in groups of ten, with a smile. Nobody was trampled and you got a bonus for the calmest sale on record.', 'Onar kişilik gruplarla, gülümseyerek içeri aldın. Kimse çiğnenmedi ve kayıtlardaki en sakin indirim için prim aldın.'],
      },
      {
        id: 'hide',
        label: ['Hide in the stockroom until ten', 'Ona kadar depoda saklan'],
        stats: { happiness: 3, health: 1 },
        result: ['It was the most peaceful hour of your career. Through the wall you heard a sound like a distant football match.', 'Kariyerinin en huzurlu saatiydi. Duvardan uzak bir futbol maçına benzer bir ses geliyordu.'],
      },
    ],
  },

  // ------------------------------------------------ electrician
  {
    ...WORK,
    id: 'base.job_electrician_fuse',
    ages: [18, 64],
    when: as('electrician'),
    title: ['A family calls you at midnight: the whole house is dark.', 'Bir aile gece yarısı arıyor: bütün ev karanlık.'],
    text: ['Their teenager says the lights went out as soon as he plugged in “just one little thing”.', 'Genç oğulları, ışıkların “sadece küçük bir şey” taktığı anda gittiğini söylüyor.'],
    options: [
      {
        id: 'fix',
        label: ['Drive over and trace the fault', 'Git ve arızayı bul'],
        stats: { smarts: 1, happiness: 2 },
        usd: 60,
        tone: 'good',
        result: ['The “little thing” was a phone charger with eight devices on it. You taught the family about load, and they paid you in tea and gratitude.', '“Küçük şey”, üzerine sekiz cihaz takılmış bir şarj aletiydi. Aileye yük konusunu anlattın; seni çay ve teşekkürle ödediler.'],
      },
      {
        id: 'phone',
        label: ['Talk them through resetting the breaker', 'Telefonda sigortayı kaldırmalarını söyle'],
        stats: { happiness: 1 },
        result: ['You explained it over the phone. Ten minutes later the lights came back and a very small voice said thank you.', 'Telefonda anlattın. On dakika sonra ışıklar geldi ve çok kısık bir ses teşekkür etti.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_electrician_old_house',
    ages: [20, 64],
    when: as('electrician'),
    title: ['An old house has wiring from before anyone could tell you who did it.', 'Eski bir evin tesisatı, kimin yaptığını kimsenin söyleyemediği bir döneme ait.'],
    text: ['Behind the wall you find a second fuse box, a third one and a note: “Do not touch this one”.', 'Duvarın arkasında ikinci bir sigorta kutusu, üçüncüsü ve bir not buluyorsun: “Buna dokunma”.'],
    options: [
      {
        id: 'rewire',
        label: ['Recommend a full rewire', 'Tesisatın baştan yenilenmesini öner'],
        stats: { smarts: 2, happiness: 1 },
        usd: 120,
        result: ['It took three weeks and a great many biscuits. At the end the note went on the wall as a work of art.', 'Üç hafta ve çok sayıda bisküvi sürdü. Sonunda not, bir sanat eseri olarak duvara asıldı.'],
      },
      {
        id: 'leave',
        label: ['Do what you were asked and leave the note alone', 'İstenileni yap ve nota dokunma'],
        stats: { happiness: 2, health: 1 },
        result: ['You did the one job you were asked for and left that fuse box exactly as you found it. Some mysteries are worth keeping.', 'İstenen tek işi yaptın ve o sigorta kutusunu bulduğun gibi bıraktın. Bazı gizemler saklanmaya değer.'],
      },
    ],
  },

  // ------------------------------------------------ the ones who already had one story
  {
    ...WORK,
    id: 'base.job_barista_regular',
    ages: [16, 64],
    when: as('barista'),
    title: ['A regular has ordered the same drink for three years.', 'Bir müdavim üç yıldır aynı içeceği söylüyor.'],
    text: ['Today they say, hesitantly, “actually, could I try something different?”', 'Bugün çekinerek “aslında farklı bir şey deneyebilir miyim?” diyor.'],
    options: [
      {
        id: 'surprise',
        label: ['Make them something you think they will like', 'Hoşlanacağını düşündüğün bir şey yap'],
        stats: { happiness: 4, smarts: 1 },
        tone: 'good',
        result: ['It was right on the first try. They have been a different customer ever since: they talk, they tip and they have told two friends.', 'İlk denemede tuttu. O günden beri başka bir müşteri: konuşuyor, bahşiş bırakıyor ve iki arkadaşına anlatmış.'],
      },
      {
        id: 'same',
        label: ['Gently suggest the usual', 'Her zamankini nazikçe öner'],
        stats: { happiness: 1 },
        result: ['They smiled with relief and took the usual. You both pretended nothing had happened.', 'Rahatlayarak gülümsedi ve her zamankini aldı. İkiniz de hiçbir şey olmamış gibi yaptınız.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_nurse_new_student',
    ages: [21, 64],
    when: as('nurse'),
    title: ['A student nurse follows you for a week.', 'Bir hemşirelik öğrencisi bir hafta boyunca seni takip ediyor.'],
    text: ['She writes everything down and asks questions you have not thought about in ten years.', 'Her şeyi yazıyor ve on yıldır düşünmediğin sorular soruyor.'],
    options: [
      {
        id: 'teach',
        label: ['Take the time to teach her properly', 'Ona doğru dürüst öğretmek için zaman ayır'],
        stats: { happiness: 5, smarts: 1 },
        tone: 'good',
        result: ['By Friday she was calming a frightened patient with your exact sentences. You noticed that you had never said them out loud before.', 'Cuma günü korkmuş bir hastayı tam senin cümlelerinle sakinleştiriyordu. Onları daha önce hiç yüksek sesle söylemediğini fark ettin.'],
      },
      {
        id: 'busy',
        label: ['Tell her to watch and ask later', 'İzlemesini, sonra sormasını söyle'],
        stats: { health: -1 },
        result: ['The ward was too busy for questions. She learned by watching, and got better at it than you had been.', 'Servis sorulara fazla yoğundu. İzleyerek öğrendi ve senden daha iyi oldu.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_teacher_exam',
    ages: [21, 64],
    when: as('teacher'),
    title: ['You are marking exams at eleven at night.', 'Gece on birde sınav kâğıdı okuyorsun.'],
    text: ['One paper answers every question with a single, lovely drawing of a horse.', 'Bir kâğıt her soruya tek bir güzel at çizimiyle cevap vermiş.'],
    options: [
      {
        id: 'mark',
        label: ['Mark it strictly: zero', 'Katı biçimde değerlendir: sıfır'],
        stats: { smarts: 1, happiness: -2 },
        result: ['You wrote “See me” beside the horse. The student did, the next morning, and said the exam was too boring to answer. You laughed for a week.', 'Atın yanına “Beni gör” yazdın. Öğrenci ertesi sabah geldi ve sınavın cevaplanmayacak kadar sıkıcı olduğunu söyledi. Bir hafta güldün.'],
      },
      {
        id: 'talk',
        label: ['Keep the horse, and ask about it', 'Atı sakla ve hakkında sor'],
        stats: { happiness: 5 },
        tone: 'good',
        result: ['The student told you about their grandfather’s farm and the only horse they had ever loved. They passed the next paper with an essay about it.', 'Öğrenci sana dedesinin çiftliğini ve sevdiği tek atı anlattı. Bir sonraki sınavı bu konuda yazdığı bir kompozisyonla geçti.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_chef_rush',
    ages: [18, 64],
    when: as('chef'),
    title: ['Saturday night, and the dish everyone ordered has run out.', 'Cumartesi akşamı ve herkesin sipariş ettiği yemek bitti.'],
    text: ['There are twenty tickets for it and one sous-chef who has gone pale.', 'Onun için yirmi fiş var ve bir sous-chef solmuş durumda.'],
    options: [
      {
        id: 'improvise',
        label: ['Improvise a new dish with what is left', 'Elde kalanlarla yeni bir yemek uydur'],
        stats: { smarts: 2, happiness: 3, health: -1 },
        tone: 'good',
        result: ['It took eleven minutes and a lot of butter. It sold out by ten and was named, by the staff, after a customer who had cried with joy.', 'On bir dakika ve bol tereyağı gerekti. Onda tükendi ve çalışanlar ona memnuniyetten ağlayan bir müşterinin adını verdi.'],
      },
      {
        id: 'apologise',
        label: ['Apologise at every table', 'Her masaya özür dile'],
        stats: { happiness: -1 },
        usd: 10,
        result: ['You went from table to table and gave each a free dessert. Most forgave you before you finished talking. One did not.', 'Masa masa dolaşıp her birine tatlı ikram ettin. Çoğu sen bitirmeden affetti. Biri affetmedi.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_police_lost_child',
    ages: [21, 62],
    when: as('police'),
    title: ['A child has wandered away from a fairground.', 'Bir çocuk lunaparktan uzaklaşmış.'],
    text: ['The parents are frantic. The child, you discover in four minutes, is perfectly happy at the duck pond.', 'Anne babası çılgına dönmüş. Çocuk, dört dakikada keşfediyorsun, ördek gölünde gayet mutlu.'],
    options: [
      {
        id: 'carry',
        label: ['Carry them back, with the ducks as witnesses', 'Şahitlerin ördekler olduğu bir yürüyüşle geri götür'],
        stats: { happiness: 5 },
        tone: 'good',
        result: ['The parents cried; the child explained that the ducks had been lost too. You wrote “reunited” in the report and underlined it.', 'Anne baba ağladı; çocuk ördeklerin de kaybolduğunu açıkladı. Rapora “kavuştu” yazdın ve altını çizdin.'],
      },
      {
        id: 'talk',
        label: ['Spend a minute teaching them what to do next time', 'Bir dahaki sefere ne yapacağını bir dakikada anlat'],
        stats: { smarts: 1, happiness: 3 },
        result: ['You taught them the name, the street and the nearest shop. They repeated it back like a magic spell.', 'Ona adı, sokağı ve en yakın dükkânı öğrettin. Sihirli bir büyü gibi tekrarladı.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_miner_shift_end',
    ages: [18, 62],
    when: as('miner'),
    title: ['The shift is over and the lift is full.', 'Vardiya bitti ve asansör dolu.'],
    text: ['The man next to you is quiet. His son is being born tonight, and he has not said so.', 'Yanındaki adam sessiz. Oğlu bu gece doğuyor ve bunu söylemedi.'],
    options: [
      {
        id: 'swap',
        label: ['Give up your place so he goes up first', 'Önce o çıksın diye yerini ver'],
        stats: { happiness: 5, health: -1 },
        tone: 'good',
        result: ['He gripped your hand without a word. The next day he brought a box of sweets and the name of the baby, who was called after nobody in particular, and everyone.', 'Tek kelime etmeden elini sıktı. Ertesi gün bir kutu şekerle ve bebeğin adıyla geldi; bebeğe özellikle kimsenin, ve herkesin adı verilmişti.'],
      },
      {
        id: 'wait',
        label: ['Wait your turn like everyone else', 'Herkes gibi sıranı bekle'],
        stats: { happiness: 1 },
        result: ['You went up in your turn. You only learned about the baby when the sweets arrived the next day, and felt a little foolish.', 'Sıranla çıktın. Bebeği, ertesi gün şekerler gelince öğrendin ve kendini biraz aptal hissettin.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_lawyer_pro_bono',
    ages: [24, 64],
    when: as('lawyer'),
    title: ['A neighbour asks if you could “just take a look” at a letter.', 'Bir komşu bir mektuba “sadece bakmanı” istiyor.'],
    text: ['It is a dispute over a hedge. It has also, technically, been going on for eleven years.', 'Bir çit anlaşmazlığı. Ayrıca, teknik olarak, on bir yıldır sürüyor.'],
    options: [
      {
        id: 'help',
        label: ['Help for free', 'Ücretsiz yardım et'],
        stats: { happiness: 4, smarts: 1 },
        tone: 'good',
        result: ['It took two evenings and a lot of sincere letters. The neighbours now share a hedge trimmer and have never been happier.', 'İki akşam ve çok sayıda samimi mektup aldı. Komşular şimdi bir çit makasını paylaşıyor ve hiç bu kadar mutlu olmamıştı.'],
      },
      {
        id: 'refer',
        label: ['Recommend someone and stay out of it', 'Birini öner ve işin dışında kal'],
        stats: { happiness: 1 },
        result: ['You sent them to a colleague. Eleven years became twelve. The hedge, meanwhile, grew.', 'Onları bir meslektaşına yönlendirdin. On bir yıl on iki oldu. Çit ise büyüdü.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_doctor_bad_news',
    ages: [26, 64],
    when: as('doctor'),
    title: ['You have bad news to give a patient who is smiling.', 'Gülümseyen bir hastaya kötü bir haber vermen gerekiyor.'],
    text: ['They have brought a cake. They say they have a feeling it is going to be fine.', 'Bir pasta getirmişler. İyi olacağına dair bir his olduğunu söylüyorlar.'],
    options: [
      {
        id: 'plain',
        label: ['Tell it plainly and stay with them', 'Açıkça söyle ve yanlarında kal'],
        stats: { happiness: -2, smarts: 1 },
        tone: 'big',
        result: ['You told them plainly and then stayed in the room. They cut the cake in the end and you had a slice. It was the best cake and the worst day.', 'Açıkça söyledin ve odada kaldın. Sonunda pastayı kestiler ve sen de bir dilim aldın. En güzel pasta ve en kötü gündü.'],
      },
      {
        id: 'ask',
        label: ['Ask what they already understand first', 'Önce ne anladıklarını sor'],
        stats: { happiness: 1, smarts: 2 },
        result: ['They understood more than they had said. You spoke slowly and they led the conversation, which is not how it is taught.', 'Söylediklerinden fazlasını anlamışlardı. Yavaş konuştun ve konuşmayı onlar yönetti; bu, öğretildiği gibi değil.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_journalist_source',
    ages: [21, 64],
    when: as('journalist'),
    title: ['A source asks to meet, and to be told nothing about where.', 'Bir kaynak buluşmak istiyor ve nerede olduğunun hiç söylenmemesini.'],
    text: ['The message arrives on a postcard. The postcard has a picture of a lighthouse.', 'Mesaj bir kartpostalla geliyor. Kartpostalda bir deniz feneri resmi var.'],
    options: [
      {
        id: 'meet',
        label: ['Go to the lighthouse', 'Deniz fenerine git'],
        stats: { smarts: 2, happiness: 2 },
        tone: 'good',
        result: ['The source was a retired clerk with a file box and a flask of tea. The story that followed ran across two days and one very surprised ministry.', 'Kaynak, bir dosya kutusu ve bir termos çayla emekli bir memurdu. Ardından gelen haber iki gün sürdü ve çok şaşıran bir bakanlığı etkiledi.'],
      },
      {
        id: 'verify',
        label: ['Check them out before you go', 'Gitmeden önce onları araştır'],
        stats: { smarts: 3, happiness: -1 },
        result: ['You spent a week checking. They were exactly who they said they were, and had left, tired of waiting. You never found the story.', 'Bir hafta araştırdın. Tam olarak söyledikleri kişiydi ve beklemekten yorulup gitmişti. Haberi hiç bulamadın.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_engineer_bridge',
    ages: [22, 64],
    when: as('engineer'),
    title: ['A design review finds a mistake you made six months ago.', 'Bir tasarım incelemesi altı ay önce yaptığın bir hatayı buluyor.'],
    text: ['It is small. It would have mattered a great deal in about eight years.', 'Küçük bir hata. Yaklaşık sekiz yıl sonra çok önemli olurdu.'],
    options: [
      {
        id: 'own',
        label: ['Own it in front of the whole team', 'Bütün ekibin önünde sahiplen'],
        stats: { smarts: 2, happiness: -1 },
        tone: 'good',
        result: ['You said “that was mine”. The room went quiet, then the senior engineer told her own worst mistake. Trust in the team went up that afternoon.', '“Bu benimdi” dedin. Oda sustu, sonra kıdemli mühendis kendi en kötü hatasını anlattı. Ekibin güveni o öğleden sonra arttı.'],
      },
      {
        id: 'quiet',
        label: ['Fix it quietly and say nothing', 'Sessizce düzelt ve hiçbir şey söyleme'],
        stats: { smarts: 1, happiness: -3 },
        result: ['The fix was clean. For a month you saw the old drawing in your sleep. Nobody ever found out, and you never quite forgot.', 'Düzeltme temizdi. Bir ay boyunca eski çizimi rüyanda gördün. Kimse öğrenmedi ve sen de hiç tam olarak unutmadın.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_accountant_tax_day',
    ages: [21, 64],
    when: as('accountant'),
    title: ['A client arrives with a carrier bag full of receipts.', 'Bir müşteri içi fişlerle dolu bir poşetle geliyor.'],
    text: ['Some are for coffee. One is for a goat. There is a note: “it was a business goat”.', 'Bir kısmı kahve fişi. Biri bir keçi için. Bir not var: “iş keçisiydi”.'],
    options: [
      {
        id: 'sort',
        label: ['Sort the whole bag, patiently', 'Poşetin tamamını sabırla ayır'],
        stats: { smarts: 2, happiness: 2 },
        usd: 40,
        result: ['It took a day. The goat, in the end, was deductible. You framed the receipt.', 'Bir gün sürdü. Sonunda keçi indirilebilir çıktı. Fişi çerçeveletti.'],
      },
      {
        id: 'teach',
        label: ['Spend an hour teaching them to keep receipts', 'Fişleri saklamayı öğretmek için bir saat ayır'],
        stats: { happiness: 3 },
        result: ['They bought a folder with their own money and, next year, arrived with it. You cried a little, quietly.', 'Kendi parasıyla bir dosya aldı ve ertesi yıl onunla geldi. Bir parça, sessizce, ağladın.'],
      },
    ],
  },
  {
    ...WORK,
    id: 'base.job_designer_feedback',
    ages: [21, 64],
    when: as('designer'),
    title: ['The client says: “It needs to pop.”', 'Müşteri diyor ki: “Biraz patlaması lazım.”'],
    text: ['You ask what pops. The client thinks, then says: “More”.', 'Neyin patlaması gerektiğini soruyorsun. Müşteri düşünüyor, sonra “Daha fazla” diyor.'],
    options: [
      {
        id: 'ask',
        label: ['Ask for one example you could show', 'Gösterebileceğin bir örnek iste'],
        stats: { smarts: 2, happiness: 2 },
        tone: 'good',
        result: ['The example turned out to be a cereal box from 1994. You built the design around the feeling of it, and it was the best thing in the portfolio.', 'Örnek 1994’ten bir mısır gevreği kutusuydu. Tasarımı o hissin etrafında kurdun ve portföyün en iyi işi oldu.'],
      },
      {
        id: 'more',
        label: ['Give them more, as requested', 'İstendiği gibi daha fazlasını ver'],
        stats: { happiness: -2 },
        usd: 30,
        result: ['It had four fonts, two gradients and a firework. The client loved it. You asked the printer to keep your name off it.', 'Dört yazı tipi, iki geçiş ve bir havai fişek vardı. Müşteri bayıldı. Matbaadan adını koymamasını rica ettin.'],
      },
    ],
  },
];

export const jobEvents: EventDef[] = JOBS.map(quickEvent);
