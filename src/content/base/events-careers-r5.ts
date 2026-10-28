import type { Ctx, EventDef } from '../types';
import { L, cash } from './career-helpers';
import { employee, ownsWork, workKind, wage } from './util';
import { addPerformance } from '../../engine/context';
import type { Pair } from './lines';

// Round 5 careers (review 5 §3.2: "the career ends in 10–15 years, then half the life is empty"). Promotions are
// slower now; these events give the second half of a working life something to do: mentoring, side projects,
// union and board roles, being passed over, an evening class to teach, long service and early-retirement offers.

/** Working (not retired, not in prison). */
const working = (c: Ctx) => !!c.p.jobId && !c.p.retired && c.p.jailYears === 0;
const job = (c: Ctx) => c.h.job();
/** Below the top rung of the current ladder. */
const belowTop = (c: Ctx) => !!job(c) && c.p.jobLevel < job(c)!.titles.length - 1;
/** At the top rung of a ladder of 4+ titles. */
const atTop = (c: Ctx) => !!job(c) && job(c)!.titles.length >= 4 && c.p.jobLevel === job(c)!.titles.length - 1;
/** Work with a shop floor, a ward, a depot or a staff room: where unions are. */
const unionWork = (c: Ctx) => ['trade', 'service', 'health', 'uniform', 'school'].includes(workKind(c));

export const careerEventsR5: EventDef[] = [
  {
    id: 'base.r5_mentor',
    category: 'work',
    minAge: 36,
    maxAge: 62,
    weight: 14,
    when: (c) => working(c) && employee(c) && c.p.jobLevel >= 1 && c.p.jobYears >= 4,
    title: L('A new hire asks you to mentor them.', 'Yeni gelen biri senden akıl hocalığı istiyor.'),
    text: L('They are keen, nervous and holding a notebook. You remember being exactly that.', 'Hevesli, biraz gergin ve elinde bir defter var. Bir zamanlar tam olarak böyle olduğunu hatırlıyorsun.'),
    choices: [
      {
        id: 'yes',
        label: L('Take them under your wing', 'Kanatlarının altına al'),
        resolve: (c) => {
          c.h.flag('r5_mentor');
          c.h.stat('happiness', 5);
          addPerformance(c.p, 6);
          return c.t('You meet every Friday over tea. They learn fast. So, oddly, do you.', 'Her cuma çay eşliğinde buluşuyorsunuz. Hızlı öğreniyor. Tuhaf ama sen de öyle.');
        },
        tone: 'good',
      },
      {
        id: 'list',
        label: L('Hand them a reading list', 'Bir okuma listesi ver'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You gave them a list of five books. They read all five, and now quote them at you.', 'Beş kitaplık bir liste verdin. Beşini de okudu ve şimdi o kitaplardan sana alıntı yapıyor.');
        },
      },
      {
        id: 'no',
        label: L('Say you are too busy', 'Çok yoğun olduğunu söyle'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('They found another mentor. You hear they are doing very well. Good for them.', 'Kendine başka bir akıl hocası buldu. Çok iyi gittiğini duyuyorsun. İyi de olmuş.');
        },
      },
    ],
  },
  {
    id: 'base.r5_mentee_return',
    category: 'work',
    minAge: 42,
    maxAge: 75,
    once: true,
    weight: 12,
    when: (c) => c.h.has('r5_mentor') && c.s.year - c.p.flags.r5_mentor >= 6,
    text: L('Your old mentee.', 'Eski çırağın.'),
    apply: (c) => {
      c.h.stat('happiness', 6);
      const i = c.rng.int(0, 2);
      const lines: Pair[] = [
        ['Your old mentee won an award this year and thanked you in the speech, by name, twice.', 'Eskiden yol gösterdiğin genç bu yıl bir ödül aldı ve konuşmasında iki kez adınla sana teşekkür etti.'],
        ['The young one you mentored years ago is now running a team of their own. They still call on Fridays.', 'Yıllar önce yol gösterdiğin genç artık kendi ekibini yönetiyor. Cuma günleri hâlâ arıyor.'],
        ['You met your old mentee at a conference. They introduced you as "the reason I stayed".', 'Eski çırağına bir toplantıda rastladın. Seni herkese "Burada kalmamın sebebi" diye tanıttı.'],
      ];
      return c.t(lines[i][0], lines[i][1]);
    },
    tone: 'good',
  },
  {
    id: 'base.r5_side_project',
    category: 'work',
    minAge: 35,
    maxAge: 62,
    weight: 10,
    when: (c) => working(c),
    title: L('An idea for a side project will not leave you alone.', 'Bir yan proje fikri peşini bırakmıyor.'),
    text: L('Weekends, a laptop and a kitchen table. Or another season of television.', 'Hafta sonları, bir dizüstü bilgisayar ve mutfak masası. Ya da bir sezon daha dizi.'),
    choices: [
      {
        id: 'build',
        label: L('Spend your weekends on it', 'Hafta sonlarını buna ver'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -1);
          if (c.rng.chance(0.35 + c.p.stats.smarts / 400)) {
            const amt = cash(c, c.rng.int(2000, 9000));
            c.h.stat('happiness', 7);
            return c.t(`It worked. Small, but real: it brought in ${amt} this year and a few emails from strangers who love it.`, `Tuttu. Küçük ama gerçek: bu yıl ${amt} getirdi, bir de onu seven yabancılardan birkaç e-posta.`);
          }
          c.h.stat('happiness', -2);
          return c.t('Six months later it has a logo, a name and no users. You learned a lot. Mostly about logos.', 'Altı ay sonra bir logosu ve adı var, kullanıcısı yok. Çok şey öğrendin. Çoğu logolar hakkında.');
        },
      },
      {
        id: 'skip',
        label: L('Let it go', 'Boş ver'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You wrote the idea on a sticky note and put it on the fridge. It is still there.', 'Fikri bir yapışkan nota yazıp buzdolabına astın. Hâlâ orada duruyor.');
        },
      },
    ],
  },
  {
    id: 'base.r5_union',
    category: 'work',
    minAge: 32,
    maxAge: 62,
    weight: 10,
    once: true,
    when: (c) => working(c) && employee(c) && unionWork(c) && c.p.jobYears >= 5,
    title: L('Your colleagues want you as their union rep.', 'Arkadaşların seni sendika temsilcisi olarak görmek istiyor.'),
    text: L('"You are the only one management listens to," they say. Management might disagree.', '"Yönetimin dinlediği tek kişi sensin," diyorlar. Yönetim buna katılmayabilir.'),
    choices: [
      {
        id: 'yes',
        label: L('Stand for it', 'Aday ol'),
        resolve: (c) => {
          c.h.flag('union_rep');
          c.h.stat('happiness', 5);
          if (c.rng.chance(0.55)) {
            c.h.money(wage(c, 1500));
            return c.t('You won the vote and, a year later, a better shift pattern and a raise for everyone. Including you.', 'Seçimi kazandın; bir yıl sonra da herkes için daha iyi bir vardiya düzeni ve zam aldın. Sana da tabii.');
          }
          addPerformance(c.p, -5);
          return c.t('You won the vote. Management now invites you to every meeting and agrees with nothing.', 'Seçimi kazandın. Yönetim artık seni her toplantıya çağırıyor ve hiçbir şeye katılmıyor.');
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: L('Let someone younger do it', 'Bırak daha genç biri yapsın'),
        resolve: (c) => c.t('You backed a younger colleague instead. She is fierce. Management is nervous.', 'Onun yerine genç bir iş arkadaşını destekledin. Çok hırslı biri. Yönetim tedirgin.'),
      },
    ],
  },
  {
    id: 'base.r5_board',
    category: 'work',
    minAge: 45,
    maxAge: 66,
    weight: 10,
    once: true,
    when: (c) => working(c) && (workKind(c) === 'office' || ownsWork(c)) && !!job(c) && c.p.jobLevel >= job(c)!.titles.length - 2,
    title: L('You are invited to join a board.', 'Bir yönetim kuruluna davet edildin.'),
    text: L('Four meetings a year, a thick folder before each, and a fee. Also, a very good lunch.', 'Yılda dört toplantı, her birinden önce kalın bir dosya ve bir ücret. Bir de çok iyi bir öğle yemeği.'),
    choices: [
      {
        id: 'yes',
        label: L('Accept the seat', 'Daveti kabul et'),
        resolve: (c) => {
          c.h.flag('board_seat');
          const amt = cash(c, 8000);
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(`You took the seat. The first fee was ${amt}, and you read every page of the folder. You may be the only one.`, `Koltuğu kabul ettin. İlk ödeme ${amt} oldu ve dosyanın her sayfasını okudun. Okuyan tek kişi sen olabilirsin.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: L('Decline politely', 'Kibarca reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You said no. Your evenings stayed yours.', 'Hayır dedin. Akşamların sana kaldı.');
        },
      },
    ],
  },
  {
    id: 'base.r5_passed_over',
    category: 'work',
    minAge: 38,
    maxAge: 60,
    weight: 10,
    when: (c) => working(c) && employee(c) && belowTop(c) && c.p.jobLevel >= 1 && c.p.jobYears >= 6,
    title: L('A younger colleague got the promotion you wanted.', 'Beklediğin terfiyi senden genç bir iş arkadaşın aldı.'),
    text: L('They are good. That is the annoying part.', 'İşinde iyi. Sinir bozucu olan da bu.'),
    choices: [
      {
        id: 'congrats',
        label: L('Congratulate them and mean it', 'Tebrik et, içten olsun'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          addPerformance(c.p, 5);
          return c.t('You brought cake. They told your boss you were the first to congratulate them. People noticed.', 'Pasta getirdin. Onu ilk tebrik edenin sen olduğunu müdürüne anlatmış. Fark edildi.');
        },
        tone: 'good',
      },
      {
        id: 'ask',
        label: L('Ask what you need to do next time', 'Bir dahakine ne yapman gerektiğini sor'),
        resolve: (c) => {
          addPerformance(c.p, 8);
          c.h.stat('happiness', -1);
          return c.t('You got an honest answer and a list of three things. You started on the first one that afternoon.', 'Dürüst bir cevap ve üç maddelik bir liste aldın. Birincisine o öğleden sonra başladın.');
        },
      },
      {
        id: 'sulk',
        label: L('Quietly sulk for a month', 'Bir ay boyunca sessizce surat as'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          addPerformance(c.p, -6);
          return c.t('A month of short emails. Nobody said anything, which was worse.', 'Bir ay boyunca kısa kısa e-postalar. Kimse bir şey demedi; bu daha kötüydü.');
        },
      },
    ],
  },
  {
    id: 'base.r5_teach_evenings',
    category: 'work',
    minAge: 40,
    maxAge: 68,
    weight: 8,
    once: true,
    when: (c) => working(c) && c.p.jobYears >= 10,
    title: L('The adult education centre wants you to teach an evening class.', 'Halk eğitim merkezi senden bir akşam kursu vermeni istiyor.'),
    text: L('Twenty years of knowing how things are done, for two evenings a week and a small fee.', 'Yirmi yılda öğrendiklerin, haftada iki akşam ve küçük bir ücret karşılığında.'),
    choices: [
      {
        id: 'yes',
        label: L('Teach the class', 'Kursu ver'),
        resolve: (c) => {
          const amt = cash(c, 1800);
          c.h.stat('happiness', 6);
          return c.t(`Twelve students, one of them seventy-three and the best of the lot. The term paid ${amt}, and a jar of homemade jam.`, `On iki öğrencin var; biri yetmiş üç yaşında ve hepsinin en iyisi. Dönem sonunda ${amt} kazandın, bir de bir kavanoz ev reçeli.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: L('Not this year', 'Bu yıl olmaz'),
        resolve: (c) => c.t('You said maybe next year. They wrote your name down anyway.', 'Belki seneye dedin. Adını yine de bir kenara yazdılar.'),
      },
    ],
  },
  {
    id: 'base.r5_long_service',
    category: 'work',
    minAge: 38,
    once: true,
    weight: 30,
    when: (c) => working(c) && !ownsWork(c) && c.p.jobYears >= 20,
    text: L('Twenty years.', 'Yirmi yıl.'),
    apply: (c) => {
      c.h.stat('happiness', 5);
      const amt = cash(c, 1000);
      const kind = workKind(c);
      if (kind === 'trade' || kind === 'service')
        return c.t(`Twenty years in the same job. The crew gave you a framed photo of your first day, and the boss a bonus of ${amt}.`, `Aynı işte yirmi yıl. Ekip ilk günündeki fotoğrafını çerçeveletip hediye etti, patron da ${amt} ikramiye verdi.`);
      return c.t(`Twenty years of service. A certificate, a handshake, a bonus of ${amt}, and a photo in which you blinked.`, `Yirmi yıllık hizmet. Bir teşekkür belgesi, bir el sıkışma, ${amt} ikramiye ve gözlerini kırptığın bir fotoğraf.`);
    },
    tone: 'good',
  },
  {
    id: 'base.r5_early_package',
    category: 'work',
    minAge: 55,
    maxAge: 63,
    weight: 8,
    once: true,
    when: (c) => working(c) && employee(c) && c.p.jobYears >= 8,
    title: L('Your employer offers you an early retirement package.', 'İş yerin sana erken emeklilik paketi öneriyor.'),
    text: (c) =>
      c.t(
        `A lump sum of ${c.h.fmt(wage(c, 25000))} if you leave this year. The offer is "voluntary". The coffee machine has opinions.`,
        `Bu yıl ayrılırsan toplu ${c.h.fmt(wage(c, 25000))} ödeyecekler. Teklif "gönüllülük esasına dayalı". Çay ocağında herkesin bir fikri var.`,
      ),
    choices: [
      {
        id: 'take',
        label: L('Take the package and retire', 'Paketi al ve emekli ol'),
        badge: 'Big change',
        resolve: (c) => {
          const title = c.h.jobTitle();
          c.h.money(wage(c, 25000));
          c.p.retired = true;
          c.p.jobId = null;
          c.p.jobTitle = title;
          c.h.stat('happiness', 8);
          return c.t(`You took the package and retired as ${title}. On Monday morning you slept until nine and felt guilty until ten.`, `Paketi aldın ve ${title} olarak emekli oldun. Pazartesi sabahı dokuza kadar uyudun, ona kadar da vicdan azabı çektin.`);
        },
        tone: 'big',
      },
      {
        id: 'stay',
        label: L('Stay on', 'Devam et'),
        resolve: (c) => {
          addPerformance(c.p, 3);
          return c.t('You stayed. Half your floor took the money. The lunch queue is much shorter now.', 'Kaldın. Katındakilerin yarısı parayı alıp gitti. Öğle yemeği kuyruğu artık çok kısa.');
        },
      },
    ],
  },
  {
    id: 'base.r5_top_now_what',
    category: 'work',
    minAge: 40,
    maxAge: 62,
    weight: 10,
    once: true,
    when: (c) => working(c) && atTop(c),
    title: L('You are at the top of your field. Now what?', 'Mesleğinin zirvesindesin. Peki şimdi ne olacak?'),
    text: L('The title is on the door. The next twenty years are not on any plan.', 'Unvanın kapıda yazıyor. Önündeki yirmi yıl ise hiçbir planda yok.'),
    choices: [
      {
        id: 'train',
        label: L('Train your successor', 'Yerine birini yetiştir'),
        resolve: (c) => {
          c.h.flag('r5_mentor');
          c.h.stat('happiness', 5);
          return c.t('You picked the most stubborn person on the team. Of course you did. They remind you of you.', 'Ekibin en inatçısını seçtin. Elbette öyle yaptın. Sana seni hatırlatıyor.');
        },
        tone: 'good',
      },
      {
        id: 'write',
        label: L('Write down what you know', 'Bildiklerini yazıya dök'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t('Two hundred pages of hard-won lessons. Your trade journal printed a chapter. People photocopy it.', 'Zor yoldan öğrenilmiş iki yüz sayfa. Meslek dergin bir bölümünü yayımladı. İnsanlar fotokopisini çekip dağıtıyor.');
        },
      },
      {
        id: 'enjoy',
        label: L('Enjoy the view for a while', 'Bir süre manzaranın tadını çıkar'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 1);
          return c.t('You took your first real holiday in years. Nobody called. You checked anyway.', 'Yıllardır ilk kez gerçek bir tatile çıktın. Kimse aramadı. Sen yine de telefona baktın.');
        },
      },
    ],
  },
];
