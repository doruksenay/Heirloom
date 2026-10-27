import type { EventDef } from '../types';
import { quickEvent, type QuickEvent } from './quick-event';

// Childhood moments for the thin years (0 to 13): first steps, a wobbly tooth, a bike without training wheels.
// All are quick events (quick-event.ts): no rng, so they shift nobody's seed.

const GROWING: QuickEvent[] = [
  {
    id: 'base.first_steps',
    category: 'childhood',
    ages: [1, 1],
    once: true,
    title: ['You let go of the sofa.', 'Kanepeyi bıraktın.'],
    text: ['Three metres of carpet lie ahead, and a lot of people are holding their breath.', 'Önünde üç metrelik halı var ve bir sürü insan nefesini tutmuş.'],
    options: [
      {
        id: 'walk',
        label: ['Walk to the open arms', 'Açık kollara doğru yürü'],
        stats: { happiness: 4, health: 1 },
        tone: 'good',
        result: ['Four steps, one wobble, and a family that has never cheered so loudly for anything. You sat down on purpose.', 'Dört adım, bir sendeleme ve hiçbir şeye bu kadar yüksek sesle alkış tutmamış bir aile. Bilerek oturdun.'],
      },
      {
        id: 'crawl',
        label: ['Crawl to the remote control instead', 'Onun yerine kumandaya doğru sürün'],
        stats: { happiness: 3, smarts: 1 },
        result: ['Walking was clearly overrated. You reached the remote at record speed and changed the channel with great ceremony.', 'Yürümek belli ki abartılıyordu. Kumandaya rekor sürede ulaştın ve kanalı büyük bir törenle değiştirdin.'],
      },
    ],
  },
  {
    id: 'base.picky_eater',
    category: 'childhood',
    ages: [2, 4],
    once: true,
    title: ['You will only eat beige food.', 'Sadece bej yemekler yiyorsun.'],
    text: ['Bread, pasta, rice. Something green appeared on your plate and you looked at it the way one looks at a stranger.', 'Ekmek, makarna, pilav. Tabağında yeşil bir şey belirdi ve ona bir yabancıya bakar gibi baktın.'],
    options: [
      {
        id: 'bite',
        label: ['Try one bite', 'Bir ısırık dene'],
        stats: { health: 2, happiness: 1 },
        result: ['You tried one bite. It was not as bad as the rumours. You announced that you still would not do it again.', 'Bir ısırık denedin. Söylentilerdeki kadar kötü değildi. Yine de bir daha yapmayacağını ilan ettin.'],
      },
      {
        id: 'beige',
        label: ['Stay loyal to the beige', 'Bej’e sadık kal'],
        stats: { happiness: 2, health: -1 },
        result: ['You held out. Your parents negotiated for an hour and settled on a single pea, which you kept in your cheek for the whole afternoon.', 'Direndin. Anne babanın pazarlığı bir saat sürdü ve tek bir bezelyede anlaşıldı; sen onu bütün öğleden sonra yanağında tuttun.'],
      },
    ],
  },
  {
    id: 'base.lost_tooth',
    category: 'childhood',
    ages: [6, 8],
    once: true,
    title: ['Your first tooth came out.', 'İlk dişin düştü.'],
    text: ['It has been wobbling for two weeks. It finally gave up while you were eating an apple.', 'İki haftadır sallanıyordu. Sonunda sen elma yerken pes etti.'],
    options: [
      {
        id: 'pillow',
        label: ['Leave it under the pillow', 'Yastığın altına koy'],
        stats: { happiness: 4 },
        tone: 'good',
        result: ['By morning it was gone and a coin lay in its place. You spent the whole day checking whether anyone had noticed your smile.', 'Sabaha kadar kayboldu; yerinde bir bozuk para duruyordu. Bütün günü, gülüşünü fark eden olup olmadığını kontrol ederek geçirdin.'],
      },
      {
        id: 'keep',
        label: ['Keep it in a matchbox', 'Kibrit kutusunda sakla'],
        stats: { happiness: 2, smarts: 1 },
        result: ['You labelled the box “first tooth” in your best handwriting. You still have the box. The tooth is another story.', 'Kutunun üstüne en güzel el yazınla “ilk diş” yazdın. Kutu hâlâ sende. Diş ise başka bir hikâye.'],
      },
    ],
  },
  {
    id: 'base.learn_bike',
    category: 'childhood',
    ages: [5, 9],
    once: true,
    title: ['The training wheels come off today.', 'Bugün yan tekerlekler çıkıyor.'],
    text: ['Someone is running behind you, holding the seat. You are fairly sure they will let go at the worst possible moment.', 'Biri arkandan koşup selenin arkasını tutuyor. En kötü anda bırakacağından neredeyse eminsin.'],
    options: [
      {
        id: 'go',
        label: ['Pedal, and do not look back', 'Pedallara bas ve arkana bakma'],
        stats: { happiness: 5, health: -2 },
        tone: 'good',
        result: ['They let go. You wobbled, shrieked, fell into a hedge and got up again. The scraped knee is still a point of pride.', 'Bıraktılar. Sallandın, çığlık attın, çitin içine düştün ve yeniden kalktın. Yaralı diz hâlâ bir gurur meselesi.'],
      },
      {
        id: 'wait',
        label: ['Ask for one more week', 'Bir hafta daha iste'],
        stats: { happiness: 1 },
        result: ['One more week turned into one more month. When you finally rode, you did it so smoothly that nobody remembered you had asked for time.', 'Bir hafta bir aya döndü. Sonunda bindiğinde o kadar rahattın ki zaman istediğini kimse hatırlamadı.'],
      },
    ],
  },
  {
    id: 'base.sleepover',
    category: 'childhood',
    ages: [8, 12],
    once: true,
    light: true,
    title: ['You are invited to your first sleepover.', 'İlk pijama partisine davet edildin.'],
    text: ['Sleeping bag, torch and the clear understanding that nobody will actually sleep.', 'Uyku tulumu, el feneri ve kimsenin gerçekten uyumayacağı konusunda net bir anlaşma.'],
    options: [
      {
        id: 'go',
        label: ['Go, and stay up the whole night', 'Git ve bütün gece uyuma'],
        stats: { happiness: 5, health: -1 },
        tone: 'good',
        result: ['You told ghost stories until three and fell asleep mid-sentence. The next morning’s pancakes were the best you ever had.', 'Üçe kadar hayalet hikâyeleri anlattın ve cümlenin ortasında uyuyakaldın. Ertesi sabahki krepler hayatında yediklerin arasında en güzeliydi.'],
      },
      {
        id: 'home',
        label: ['Go, but call home at ten', 'Git ama onda eve telefon et'],
        stats: { happiness: 3 },
        result: ['You called at ten. Nobody laughed. Two other children called too, and you all pretended it was a tradition.', 'Onda aradın. Kimse gülmedi. Başka iki çocuk da aradı ve hepiniz bunun bir gelenek olduğunu söylediniz.'],
      },
    ],
  },
  {
    id: 'base.school_play',
    category: 'school',
    ages: [7, 11],
    once: true,
    light: true,
    title: ['The class is putting on a play.', 'Sınıf bir oyun sahneliyor.'],
    text: ['The teacher holds a list. There is one lead, three animals and a tree.', 'Öğretmenin elinde bir liste var. Bir başrol, üç hayvan ve bir ağaç.'],
    options: [
      {
        id: 'lead',
        label: ['Ask for the lead', 'Başrolü iste'],
        stats: { happiness: 4, smarts: 1 },
        tone: 'good',
        result: ['You got it. You forgot your lines in the second scene and made up better ones. The teacher said nothing and smiled for a week.', 'Başrolü aldın. İkinci sahnede repliklerini unuttun ve daha iyilerini uydurdun. Öğretmen bir şey demedi ve bir hafta boyunca gülümsedi.'],
      },
      {
        id: 'tree',
        label: ['Be the tree', 'Ağaç ol'],
        stats: { happiness: 3, looks: 1 },
        result: ['You were the best tree anyone had seen. You swayed with feeling. The audience agreed it had been the emotional centre of the evening.', 'Gördükleri en iyi ağaçtın. Duygulu biçimde salındın. İzleyiciler akşamın duygusal merkezinin sen olduğun konusunda hemfikirdi.'],
      },
    ],
  },
  {
    id: 'base.lemonade_stand',
    category: 'money',
    ages: [8, 12],
    once: true,
    title: ['You set up a lemonade stand on the pavement.', 'Kaldırıma bir limonata tezgâhı kurdun.'],
    text: ['A cardboard sign, a jug and a strong belief in your own prices.', 'Bir karton tabela, bir sürahi ve kendi fiyatlarına güçlü bir inanç.'],
    options: [
      {
        id: 'fair',
        label: ['Sell it cheap and chat with everyone', 'Ucuza sat ve herkesle sohbet et'],
        stats: { happiness: 4 },
        usd: 8,
        tone: 'good',
        result: ['You sold out by noon and made friends with the whole street. The postman paid in coins and a long story about his dog.', 'Öğlene kadar hepsini sattın ve bütün sokakla arkadaş oldun. Postacı bozuk parayla ve köpeği hakkında uzun bir hikâyeyle ödedi.'],
      },
      {
        id: 'bold',
        label: ['Charge triple and call it “organic”', 'Üç katı fiyat iste ve “organik” de'],
        stats: { happiness: 2, smarts: 1 },
        usd: 14,
        result: ['Three customers paid it, mostly out of respect. Your accountant-to-be wrote the numbers down very seriously.', 'Üç müşteri, çoğunlukla saygıdan, ödedi. Gelecekteki muhasebecin rakamları çok ciddi biçimde not aldı.'],
      },
    ],
  },
  {
    id: 'base.hideout',
    category: 'childhood',
    ages: [7, 11],
    once: true,
    title: ['You and your friends build a hideout.', 'Arkadaşlarınla bir sığınak yapıyorsun.'],
    text: ['Blankets, a table and a rule: no grown-ups, and the password changes every day.', 'Battaniyeler, bir masa ve bir kural: büyük yok ve parola her gün değişiyor.'],
    options: [
      {
        id: 'rules',
        label: ['Write the rules on a wall', 'Kuralları duvara yaz'],
        stats: { smarts: 2, happiness: 3 },
        result: ['Rule one: no grown-ups. Rule two: see rule one. The rules went up to nineteen and were broken by a cat.', 'Kural bir: büyük yok. Kural iki: bir’e bak. Kurallar on dokuza kadar gitti ve bir kedi tarafından çiğnendi.'],
      },
      {
        id: 'snacks',
        label: ['Make it the snack headquarters', 'Atıştırmalık karargâhı yap'],
        stats: { happiness: 4 },
        tone: 'good',
        result: ['By four o’clock the hideout had biscuits, a flag and a flourishing economy. By five, a grown-up had found it by smell.', 'Dörde doğru sığınakta bisküvi, bayrak ve gelişen bir ekonomi vardı. Beşte bir büyük onu kokuyla buldu.'],
      },
    ],
  },
  {
    id: 'base.summer_camp',
    category: 'childhood',
    ages: [9, 13],
    once: true,
    light: true,
    title: ['A week at summer camp.', 'Bir haftalık yaz kampı.'],
    text: ['A bunk bed, a lake and forty children who are all pretending not to be nervous.', 'Ranza, bir göl ve hepsi gergin olmadığını söyleyen kırk çocuk.'],
    options: [
      {
        id: 'camp',
        label: ['Go, and sign up for everything', 'Git ve her şeye yazıl'],
        stats: { happiness: 5, health: 2 },
        tone: 'good',
        result: ['You came home with a tan, a friendship bracelet and a song nobody else in the family wanted to learn. You taught it anyway.', 'Eve bronzlaşmış, bir arkadaşlık bilekliği ve ailede kimsenin öğrenmek istemediği bir şarkıyla döndün. Yine de öğrettin.'],
      },
      {
        id: 'read',
        label: ['Go, but spend it by the lake with a book', 'Git ama gölün kenarında kitapla geçir'],
        stats: { happiness: 3, smarts: 2 },
        result: ['You finished four books and made one very good friend, who also had a book. Neither of you remembers the campfire songs.', 'Dört kitap bitirdin ve onun da kitabı olan çok iyi bir arkadaş edindin. İkiniz de kamp ateşi şarkılarını hatırlamıyorsunuz.'],
      },
    ],
  },
  {
    id: 'base.library_card',
    category: 'school',
    ages: [6, 10],
    once: true,
    title: ['You get your first library card.', 'İlk kütüphane kartını alıyorsun.'],
    text: ['The librarian says you can borrow five books at once. She does not know who she is talking to.', 'Kütüphaneci aynı anda beş kitap alabileceğini söylüyor. Kiminle konuştuğunu bilmiyor.'],
    options: [
      {
        id: 'five',
        label: ['Borrow all five', 'Beşini de al'],
        stats: { smarts: 3, happiness: 2 },
        tone: 'good',
        result: ['You carried them home in both arms and read the first one under the table at dinner. A dragon was involved.', 'Onları iki koluyla eve taşıdın ve ilkini akşam yemeğinde masanın altında okudun. İçinde bir ejderha vardı.'],
      },
      {
        id: 'one',
        label: ['Borrow one, and read it very slowly', 'Birini al ve çok yavaş oku'],
        stats: { smarts: 2, happiness: 3 },
        result: ['One book, read four times. By the end you could recite the dedication. The librarian said it was the best use of the card she had seen.', 'Tek kitap, dört kez okundu. Sonunda ithafı ezbere söyleyebiliyordun. Kütüphaneci, kartın en iyi kullanımının bu olduğunu söyledi.'],
      },
    ],
  },
];

export const growingEvents: EventDef[] = GROWING.map(quickEvent);
