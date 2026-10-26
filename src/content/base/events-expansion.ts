import type { Ctx, EventDef } from '../types';
import { inMourning } from '../../engine/context';
import { cap, wage } from './util';

// Gap-filler content found by the pace measurements: the first years of life, the 80s, love and work all had fewer
// events than the middle of the game. Several of these come in pairs (a choice now, a consequence years later), kept
// together by a flag; a follow-up never fires unless the first half did.
//
// Rules shared by all of them: no rng before the player chooses (the one draw in `toddler_word` happens in setup,
// always one draw, so English and Turkish play the same seed alike), and no Turkish suffix after a name.

const yearsSince = (c: Ctx, flag: string): number => (c.p.flags[flag] === undefined ? -1 : c.s.year - c.p.flags[flag]);
const partnerOf = (c: Ctx) => c.h.partner();
const grieving = (c: Ctx) => inMourning(c.s);

export const expansionEvents: EventDef[] = [
  // ------------------------------------------------ the first years
  {
    id: 'base.toddler_word',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    setup: (c) => {
      c.vars.w = c.rng.int(0, 2);
    },
    text: (c) => {
      const w = Number(c.vars.w);
      const en = ['"mama"', '"dog"', '"no"'][w];
      const tr = ['"anne"', '"top"', '"hayır"'][w];
      return c.t(`Your first word was ${en}. It was said with total confidence, to the wrong person.`, `İlk kelimen ${tr} oldu. Büyük bir özgüvenle, yanlış kişiye söylendi.`);
    },
    apply: (c) => {
      c.h.stat('happiness', 3);
      const mother = c.h.relatives('mother')[0];
      if (mother) c.h.closeness(mother.person.id, 4);
      return c.t('Your first word is still told at family dinners, with the pause in the right place.', 'İlk kelimen hâlâ aile yemeklerinde, duraklaması doğru yerde, anlatılıyor.');
    },
    tone: 'good',
  },
  {
    id: 'base.toddler_night',
    category: 'childhood',
    minAge: 2,
    maxAge: 4,
    once: true,
    text: (c) => c.t('You are sure something lives in the dark corner of your room. It has not moved, which is exactly what it wants you to think.', 'Odanın karanlık köşesinde bir şey yaşadığına eminsin. Kıpırdamadı; tam da bunu düşünmeni istiyor.'),
    choices: [
      {
        id: 'call',
        label: (c) => c.t('Call out until someone comes', 'Biri gelene kadar seslen'),
        resolve: (c) => {
          const mother = c.h.relatives('mother')[0];
          if (mother) c.h.closeness(mother.person.id, 5);
          c.h.stat('happiness', 2);
          return c.t('Someone came, turned the light on and showed you it was a coat. You still do not fully trust the coat.', 'Biri geldi, ışığı yaktı ve onun bir palto olduğunu gösterdi. Paltoya hâlâ tam güvenmiyorsun.');
        },
        tone: 'good',
      },
      {
        id: 'bed',
        label: (c) => c.t('Slip into the grown-ups’ bed', 'Büyüklerin yatağına geç'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You were allowed to stay, as long as you did not kick. You kicked. You slept very well.', 'Tekmelemezsen kalabilirdin. Tekmeledin. Çok iyi uyudun.');
        },
      },
      {
        id: 'brave',
        label: (c) => c.t('Hold your toy tight and stare back', 'Oyuncağına sıkı sarıl ve gözünü ayırma'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 1);
          return c.t('You stared until you fell asleep. By morning the corner had lost, and you knew it.', 'Uyuyana kadar baktın. Sabaha köşe kaybetmişti ve bunu sen de biliyordun.');
        },
      },
    ],
  },

  // ------------------------------------------------ the eighties
  {
    id: 'base.eightieth',
    category: 'family',
    minAge: 80,
    maxAge: 84,
    once: true,
    when: (c) => !grieving(c),
    text: (c) => c.t('You are turning eighty. The family wants to make something of it. You would be happy with a cake, but you do not say so.', 'Seksen yaşına giriyorsun. Aile bunu büyütmek istiyor. Bir pastayla da mutlu olurdun ama bunu söylemiyorsun.'),
    choices: [
      {
        id: 'party',
        label: (c) => c.t('Let them throw a party', 'Parti vermelerine izin ver'),
        requires: (c) => c.p.money >= wage(c, 300),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', 8);
          for (const k of c.h.relatives(['child', 'sibling'])) c.h.closeness(k.person.id, 4);
          return c.t('Everyone came. Someone gave a speech that was mostly about you, and mostly true. You pretended to be embarrassed.', 'Herkes geldi. Biri çoğu sana dair, çoğu doğru bir konuşma yaptı. Utanmış gibi yaptın.');
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: (c) => c.t('Keep it to a quiet dinner', 'Sessiz bir akşam yemeğiyle yetin'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Six people, one cake and a lot of stories that were told before. It was exactly the right size.', 'Altı kişi, bir pasta ve daha önce anlatılmış bir sürü hikâye. Tam olması gereken boyuttaydı.');
        },
      },
    ],
  },
  {
    id: 'base.old_friend_letter',
    category: 'family',
    minAge: 78,
    maxAge: 92,
    once: true,
    text: (c) => c.t('A letter arrives from someone you have not heard from in forty years. The handwriting has not changed at all.', 'Kırk yıldır haber almadığın birinden bir mektup geliyor. El yazısı hiç değişmemiş.'),
    choices: [
      {
        id: 'write',
        label: (c) => c.t('Write back at once', 'Hemen cevap yaz'),
        resolve: (c) => {
          c.h.stat('happiness', 7);
          c.h.flag('old_friend_writes');
          return c.t('You wrote four pages and tore up two. The reply took three weeks and began, "Of course you did."', 'Dört sayfa yazdın, ikisini yırttın. Cevap üç haftada geldi ve "Tabii ki yazdın" diye başlıyordu.');
        },
        tone: 'good',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it for a better day', 'Daha iyi bir güne sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You put it in the drawer where important things go to be answered later.', 'Onu, önemli şeylerin sonra cevaplanmak üzere gittiği çekmeceye koydun.');
        },
      },
    ],
  },

  // ------------------------------------------------ a late lesson, and what came of it
  {
    id: 'base.late_class',
    category: 'milestone',
    minAge: 62,
    maxAge: 80,
    once: true,
    text: (c) => c.t('The community centre has a beginners’ class in a new language. The poster says "It is never too late." You are not sure the poster knows you.', 'Semt merkezinde yeni bir dilde başlangıç kursu açılmış. Afişte "Hiç geç değil" yazıyor. Afişin seni tanıdığından emin değilsin.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Sign up', 'Kursa yazıl'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 4);
          c.h.flag('late_class');
          return c.t('You were the oldest in the room and the only one who did the homework. The teacher started calling you "the example".', 'Odadaki en yaşlı sendin ve ödevi yapan tek kişiydin. Hoca sana "örnek" demeye başladı.');
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Stay with what you know', 'Bildiğinle kal'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You read the poster twice more on your way past it, each time with a little less certainty.', 'Önünden geçerken afişi iki kez daha okudun, her seferinde biraz daha az emin.');
        },
      },
    ],
  },
  {
    id: 'base.late_class_fruit',
    category: 'milestone',
    minAge: 65,
    maxAge: 90,
    once: true,
    when: (c) => yearsSince(c, 'late_class') >= 3,
    text: (c) => c.t('A traveller on a bench asks for directions in the language you studied. You understand every word and, to your surprise, answer.', 'Bir bankta oturan yolcu, çalıştığın dilde yol soruyor. Her kelimeyi anlıyorsun ve şaşırarak cevap veriyorsun.'),
    apply: (c) => {
      c.h.stat('happiness', 6);
      c.h.stat('smarts', 1);
      return c.t('The traveller thanked you with such warmth that you walked home a little taller. Nobody at home believed it until you showed them the card they gave you.', 'Yolcu o kadar içtenlikle teşekkür etti ki eve biraz daha dik yürüdün. Sana verdiği kartı gösterene kadar evde kimse inanmadı.');
    },
    tone: 'good',
  },

  // ------------------------------------------------ love
  {
    id: 'base.love_letters',
    category: 'love',
    minAge: 24,
    maxAge: 70,
    once: true,
    when: (c) => !!partnerOf(c),
    setup: (c) => {
      c.vars.pid = partnerOf(c)!.person.id;
    },
    text: (c) => {
      const n = partnerOf(c)?.person.firstName ?? '';
      return c.t(`You find an old note in your pocket that ${n} wrote years ago. It is not very good. You have kept it anyway.`, `Cebinde ${n} yıllar önce yazdığı eski bir not buluyorsun. Pek iyi değil. Yine de saklamışsın.`);
    },
    choices: [
      {
        id: 'write',
        label: (c) => c.t('Write one back', 'Sen de bir tane yaz'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 7);
          c.h.stat('happiness', 4);
          return c.t('You left it where it would be found. It was found within the minute, and answered within the hour.', 'Bulunacağı bir yere bıraktın. Bir dakikada bulundu, bir saatte cevaplandı.');
        },
        tone: 'good',
      },
      {
        id: 'keep',
        label: (c) => c.t('Put it back in your pocket', 'Cebine geri koy'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Some things are better kept than answered. You kept it.', 'Bazı şeyler cevaplanmaktansa saklanmaya daha uygun. Sen sakladın.');
        },
      },
    ],
  },
  {
    id: 'base.anniversary_trip',
    category: 'love',
    minAge: 28,
    maxAge: 75,
    once: true,
    when: (c) => {
      const rel = c.h.relatives(['spouse', 'partner'])[0];
      return !!rel && c.s.year - rel.rel.sinceYear >= 5 && !grieving(c);
    },
    setup: (c) => {
      c.vars.pid = c.h.relatives(['spouse', 'partner'])[0].person.id;
    },
    text: (c) => c.t('Another anniversary is coming. A weekend away would be lovely, and not cheap.', 'Bir yıl dönümü daha yaklaşıyor. Bir hafta sonu kaçamağı güzel olurdu ve ucuz değil.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Go away for a weekend (${c.h.fmt(wage(c, 700))})`, `Bir hafta sonu için yola çık (${c.h.fmt(wage(c, 700))})`),
        requires: (c) => c.p.money >= wage(c, 700),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 700));
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 6);
          return c.t('You missed the first train, found a worse hotel than the one you booked and loved every hour of it.', 'İlk treni kaçırdın, ayırttığından daha kötü bir otel buldun ve her saatini sevdin.');
        },
        tone: 'good',
      },
      {
        id: 'home',
        label: (c) => c.t('Cook something special at home', 'Evde özel bir şey pişir'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', 3);
          return c.t('The recipe called for an hour and took three. The candles did most of the work.', 'Tarif bir saat diyordu, üç saat sürdü. İşin çoğunu mumlar yaptı.');
        },
      },
    ],
  },

  // ------------------------------------------------ work: a mentor, and later the other side of it
  {
    id: 'base.work_mentor',
    category: 'work',
    minAge: 22,
    maxAge: 50,
    once: true,
    when: (c) => !!c.p.jobId,
    text: (c) => c.t('A senior colleague has noticed your work and offers to meet once a week, "to share what I learned the hard way".', 'Kıdemli bir iş arkadaşı çalışmalarını fark etmiş ve haftada bir görüşmeyi öneriyor: "zor yoldan öğrendiklerimi paylaşmak için".'),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Accept, and take notes', 'Kabul et ve not al'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          c.h.flag('mentored');
          return c.t('Every Thursday you learned one thing that would have cost you a year. You wrote them all down.', 'Her perşembe sana bir yıla mal olabilecek bir şey öğrendin. Hepsini yazdın.');
        },
        tone: 'good',
      },
      {
        id: 'decline',
        label: (c) => c.t('Thank them, but stay on your own', 'Teşekkür et ama kendi yolunda kal'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You made the mistakes yourself. They were more memorable, and slower.', 'Hataları kendin yaptın. Daha akılda kalıcıydılar ve daha yavaştılar.');
        },
      },
    ],
  },
  {
    id: 'base.mentor_return',
    category: 'work',
    minAge: 32,
    maxAge: 64,
    once: true,
    when: (c) => !!c.p.jobId && yearsSince(c, 'mentored') >= 5,
    text: (c) => c.t('A new hire watches you with the look you once gave your own mentor. They ask if you have a few minutes on Thursdays.', 'Yeni işe başlayan biri sana, bir zamanlar kendi akıl hocana baktığın gibi bakıyor. Perşembeleri birkaç dakikan olup olmadığını soruyor.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Say yes', 'Evet de'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('smarts', 1);
          return c.t('You found yourself repeating your mentor’s sentences, a little differently. They seemed to land.', 'Kendini, akıl hocanın cümlelerini biraz farklı biçimde tekrar ederken buldun. Yerine oturmuş gibiydi.');
        },
        tone: 'good',
      },
      {
        id: 'busy',
        label: (c) => c.t('Say you are too busy', 'Çok meşgulsün de'),
        resolve: (c) => c.t('You meant to say yes next month. Next month was busier.', 'Gelecek ay evet diyecektin. Gelecek ay daha da yoğundu.'),
      },
    ],
  },

  // ------------------------------------------------ the dynasty
  {
    id: 'base.family_name_story',
    category: 'family',
    minAge: 28,
    maxAge: 75,
    once: true,
    when: (c) => c.s.dynasty.generation >= 2 && c.s.dynasty.lives.length > 0,
    setup: (c) => {
      c.vars.founder = c.s.dynasty.lives[0].name;
    },
    text: (c) =>
      c.t(
        `An elderly relative corners you at a wedding to tell you where the ${cap(c.s.dynasty.familyName)} name comes from. The founder was ${String(c.vars.founder)}, apparently, and a very stubborn person.`,
        `Yaşlı bir akraba bir düğünde seni köşeye sıkıştırıp ${cap(c.s.dynasty.familyName)} adının nereden geldiğini anlatıyor. Kurucu ${String(c.vars.founder)} imiş, ve çok inatçı biriymiş.`,
      ),
    choices: [
      {
        id: 'listen',
        label: (c) => c.t('Listen to all of it', 'Hepsini dinle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t('It took an hour and had three endings. You now know exactly where the family stubbornness comes from, and cannot say you are surprised.', 'Bir saat sürdü ve üç sonu vardı. Ailedeki inadın nereden geldiğini artık tam olarak biliyorsun ve şaşırdığını söyleyemezsin.');
        },
        tone: 'good',
      },
      {
        id: 'write',
        label: (c) => c.t('Ask them to say it again, slowly, and write it down', 'Yavaşça tekrar etmesini iste ve yaz'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 2);
          return c.t('You filled a page. Years from now, someone in the family will find it and think you invented half of it.', 'Bir sayfa doldurdun. Yıllar sonra ailede biri onu bulacak ve yarısını senin uydurduğunu sanacak.');
        },
        tone: 'good',
      },
    ],
  },
];
