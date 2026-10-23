import type { EventDef } from '../types';
import { cap, dat, gen, kin, nm, wage, who, wth } from './util';
import { coastal, He, he, him } from './events-flavour';
import { catName, syncFlagCat } from '../../engine/pets';

// Childhood, school and teen years.
export const youngEvents: EventDef[] = [
  {
    id: 'base.first_word',
    category: 'childhood',
    minAge: 1,
    maxAge: 2,
    once: true,
    weight: 40,
    text: '',
    apply: (c) => {
      const i = c.rng.int(0, 5);
      const word = c.t(
        ['"mama"', '"baba"', '"no"', '"cat"', '"cookie"', '"why"'][i],
        ['"anne"', '"baba"', '"hayır"', '"pisi"', '"bisküvi"', '"neden"'][i],
      );
      c.h.stat('happiness', 2);
      return c.t(
        `Your first word was ${word}. The family argued for a week about what it meant.`,
        `İlk kelimen ${word} oldu. Aile, ne demek istediğini bir hafta tartıştı.`,
      );
    },
  },
  {
    id: 'base.tantrum',
    category: 'childhood',
    minAge: 3,
    maxAge: 6,
    title: (c) => c.t('You want the shiny toy at the supermarket.', 'Markette o parlak oyuncağı istiyorsun.'),
    text: (c) => c.t('Your parent said no. Everyone in the aisle is watching.', 'Cevap hayır. Reyondaki herkes sana bakıyor.'),
    choices: [
      {
        id: 'scream',
        label: (c) => c.t('Scream louder', 'Daha yüksek sesle bağır'),
        resolve: (c) => {
          const parent = c.h.relatives(['mother', 'father'])[0];
          if (parent) c.h.closeness(parent.person.id, -4);
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 4);
            return c.t(
              'You screamed until you got the toy. Victory tastes like plastic.',
              'Oyuncağı alana kadar bağırdın. Zaferin tadı plastik gibi.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You screamed. You did not get the toy. You did get a very long car ride home.',
            'Bağırdın. Oyuncak yok. Ama eve dönüş yolu çok, çok uzun sürdü.',
          );
        },
      },
      {
        id: 'calm',
        label: (c) => c.t('Take a deep breath', 'Derin bir nefes al'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 3));
          return c.t(
            'You calmed down on your own. Your parents still talk about it.',
            'Kendi kendine sakinleştin. Ailen hâlâ bunu anlatıp duruyor.',
          );
        },
      },
    ],
  },
  {
    id: 'base.tooth',
    category: 'childhood',
    minAge: 5,
    maxAge: 8,
    once: true,
    text: '',
    apply: (c) => {
      const amt = wage(c, 5);
      c.h.money(amt);
      return c.t(
        `You lost your first tooth. The tooth fairy left you ${c.h.fmt(amt)} and a suspicious amount of glitter.`,
        `İlk dişin düştü. Diş perisi yastığının altına ${c.h.fmt(amt)} ve şüpheli miktarda sim bıraktı.`,
      );
    },
  },
  {
    id: 'base.bully',
    category: 'school',
    minAge: 6,
    maxAge: 13,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(0, 2) }).id;
    },
    title: (c) => c.t(`${nm(c)} keeps stealing your lunch.`, `${nm(c)} sürekli beslenmeni çalıyor.`),
    text: (c) => c.t('It has happened three days in a row.', 'Üç gündür üst üste aynı şey.'),
    choices: [
      {
        id: 'fight',
        label: (c) => c.t('Fight back', 'Karşılık ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.health / 300)) {
            c.h.stat('happiness', 6);
            return c.t(`You stood up to ${nm(c)}. Your lunch is safe now.`, `${dat(nm(c))} kafa tuttun. Beslenmen artık emin ellerde.`);
          }
          c.h.stat('health', -6);
          c.h.stat('happiness', -4);
          return c.t(`You fought ${nm(c)} and lost. Badly.`, `${wth(nm(c))} kavgaya girdin ve kaybettin. Hem de fena.`);
        },
      },
      {
        id: 'teacher',
        label: (c) => c.t('Tell a teacher', 'Öğretmene söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            `You told a teacher. ${nm(c)} got detention and now glares at you.`,
            `Öğretmene söyledin. ${nm(c)} ceza aldı ve artık sana ölümcül bakışlar atıyor.`,
          );
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Offer to share your lunch', 'Beslenmeni paylaşmayı teklif et'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const friend = who(c);
          c.h.addRelation(friend, 'friend', 55);
          return c.t(
            `You offered to share. Turns out ${nm(c)} never had lunch at home. You became friends.`,
            `Paylaşmayı teklif ettin. Meğer ${nm(c)} evde hiç yemek yemiyormuş. Arkadaş oldunuz.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.pet',
    category: 'family',
    minAge: 5,
    maxAge: 14,
    once: true,
    when: (c) => !c.h.has('pet_cat'),
    title: (c) => c.t('A stray kitten follows you home.', 'Sokakta bir kedi yavrusu peşine takılıp eve kadar geldi.'),
    text: (c) => c.t('It is white, tiny and very loud.', 'Bembeyaz, minicik ve çok gürültülü.'),
    choices: [
      {
        id: 'beg',
        label: (c) => c.t('Beg your parents to keep it', 'Ailene yalvar, kalsın'),
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.flag('pet_cat');
            syncFlagCat(c.p, c.s.year);
            c.h.stat('happiness', 10);
            const n = catName(c.p, c.lang);
            return c.t(`Your parents gave in. You named the kitten ${n}.`, `Ailen pes etti. Yavrunun adını ${n} koydun.`);
          }
          c.h.stat('happiness', -6);
          return c.t(
            'Your parents said no. The kitten went to a neighbor. You still wave at it.',
            'Ailen hayır dedi. Yavru komşuya gitti. Hâlâ görünce el sallıyorsun.',
          );
        },
      },
      {
        id: 'neighbor',
        label: (c) => c.t('Find it a home', 'Ona bir yuva bul'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'You found the kitten a home with the old lady next door.',
            'Yavruya yan komşu teyzenin evinde yuva buldun.',
          );
        },
      },
    ],
  },
  {
    id: 'base.heirloom_story',
    category: 'heirloom',
    minAge: 4,
    maxAge: 12,
    once: true,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.h.relatives(['mother', 'father']).length > 0,
    text: '',
    apply: (c) => {
      const item = c.s.dynasty.heirlooms[0];
      const parent = c.h.relatives(['mother', 'father'])[0];
      c.h.stat('happiness', 3);
      c.h.stat('smarts', 1);
      c.h.closeness(parent.person.id, 4);
      return c.t(
        `Your ${kin(c, parent.person, parent.rel.kind)} let you hold ${item.name} and told you its story. ${item.story[0]}`,
        `${cap(kin(c, parent.person, parent.rel.kind))} aile yadigârını eline tutuşturdu: ${item.name}. Sonra da hikâyesini anlattı. ${item.story[0]}`,
      );
    },
  },
  {
    id: 'base.window',
    category: 'childhood',
    minAge: 8,
    maxAge: 13,
    title: (c) => c.t("Your football just went through the neighbor's window.", 'Topun az önce komşunun camını indirdi.'),
    text: (c) => c.t('Nobody saw it happen. Probably.', 'Kimse görmedi. Galiba.'),
    choices: [
      {
        id: 'confess',
        label: (c) => c.t('Knock and confess', 'Kapıyı çal ve itiraf et'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You confessed. The neighbor was so surprised he only made you sweep the glass.',
            'İtiraf ettin. Komşu öyle şaşırdı ki sana sadece camları süpürttü.',
          );
        },
      },
      {
        id: 'run',
        label: (c) => c.t('Run', 'Kaç'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', -5);
            c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -5));
            return c.t(
              'You ran. Your name was written on the ball. You were grounded for a month.',
              'Kaçtın. Topun üstünde adın yazıyordu. Bir ay ev hapsi yedin.',
            );
          }
          return c.t(
            'You ran and got away with it. The guilt lasts longer than the grounding would have.',
            'Kaçtın ve paçayı kurtardın. Vicdan azabı, ev hapsinden uzun sürdü.',
          );
        },
      },
    ],
  },
  {
    id: 'base.talent_show',
    category: 'school',
    minAge: 10,
    maxAge: 17,
    once: true,
    title: (c) => c.t('Your school is holding a talent show.', 'Okulunda yetenek yarışması var.'),
    text: (c) => c.t('The winner gets a gold trophy with their name on it.', 'Kazanana üstünde adı yazan altın bir kupa veriliyor.'),
    choices: [
      {
        id: 'sing',
        label: (c) => c.t('Sing', 'Şarkı söyle'),
        resolve: (c) => {
          if (c.rng.chance(0.15 + c.p.stats.looks / 400 + c.p.stats.happiness / 400)) {
            c.h.addHeirloom(
              'trophy',
              c.t(`${c.p.firstName}'s talent show trophy`, `${gen(c.p.firstName)} yetenek yarışması kupası`),
              c.t(`${c.p.firstName} won it singing at age ${c.age}.`, `${c.p.firstName} bunu ${c.age} yaşında şarkı söyleyerek kazandı.`),
            );
            c.h.achieve('talent_show');
            c.h.stat('happiness', 12);
            return c.t(
              'You sang and won the whole thing. The trophy will sit on the family shelf for decades.',
              'Şarkını söyledin ve birinciliği kaptın. O kupa onlarca yıl ailenin rafında duracak.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You sang. Your voice cracked on the high note. Someone filmed it.',
            'Şarkını söyledin. Tiz notada sesin çatladı. Biri de videoya çekti tabii.',
          );
        },
      },
      {
        id: 'magic',
        label: (c) => c.t('Do a magic trick', 'Sihirbazlık numarası yap'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'Your card trick got polite applause and one genuinely amazed first-grader.',
            'Kart numaran nazik bir alkış ve gerçekten büyülenmiş tek bir birinci sınıf öğrencisi kazandı.',
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Stay in the audience', 'Seyircilerde kal'),
        resolve: (c) => c.t('You watched from the back row.', 'Arka sıradan izledin.'),
      },
    ],
  },
  {
    id: 'base.exam',
    category: 'school',
    minAge: 13,
    maxAge: 22,
    when: (c) => c.p.school === 'highschool' || c.p.school === 'university',
    title: (c) => c.t('Big exam tomorrow and you have not studied.', 'Yarın büyük sınav var ve kitabın kapağını bile açmadın.'),
    text: (c) =>
      c.t(`A classmate is selling the answers for ${c.h.fmt(wage(c, 20))}.`, `Sınıftan biri cevap anahtarını ${c.h.fmt(wage(c, 20))} karşılığında satıyor.`),
    choices: [
      {
        id: 'cheat',
        label: (c) => c.t('Buy the answers', 'Cevapları satın al'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.money(-wage(c, 20));
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', -8);
            c.h.flag('caught_cheating');
            return c.t('You were caught cheating. Your parents got a phone call.', 'Kopya çekerken yakalandın. Okul aileni aradı.');
          }
          c.h.stat('happiness', 3);
          return c.t('You aced the exam. You learned nothing.', 'Sınavdan tam not aldın. Hiçbir şey öğrenmedin.');
        },
      },
      {
        id: 'study',
        label: (c) => c.t('Study all night', 'Sabaha kadar çalış'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('health', -2);
          return c.t(
            'You studied until sunrise and passed. Coffee is now your personality.',
            'Güneş doğana kadar çalıştın ve geçtin. Artık kişiliğin kahveden ibaret.',
          );
        },
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it', 'Salla gitsin'),
        resolve: (c) => {
          if (c.p.stats.smarts > 60)
            return c.t('You winged it and still passed. Annoying, honestly.', 'Salladın ve yine de geçtin. Açıkçası biraz sinir bozucu.');
          c.h.stat('happiness', -4);
          return c.t('You winged it. It did not go well.', 'Salladın. Pek tutmadı.');
        },
      },
    ],
  },
  {
    id: 'base.crush',
    category: 'love',
    minAge: 13,
    maxAge: 17,
    cooldown: 2,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender === 'female' ? 'male' : 'female' }).id;
    },
    title: (c) => c.t(`You have a huge crush on ${nm(c)}.`, `${dat(nm(c))} fena hâlde abayı yaktın.`),
    text: (c) => c.t('You sit two rows apart in class.', 'Sınıfta aranızda sadece iki sıra var.'),
    choices: [
      {
        id: 'confess',
        label: (c) => c.t(`Tell ${him(who(c))} how you feel`, 'Duygularını itiraf et'),
        resolve: (c) => {
          if (c.rng.chance(0.25 + c.p.stats.looks / 250)) {
            c.h.stat('happiness', 10);
            return c.t(
              `${nm(c)} said ${he(who(c))} likes you too. You held hands at the bus stop.`,
              `${nm(c)} da senden hoşlandığını söyledi. Otobüs durağında el ele tutuştunuz.`,
            );
          }
          c.h.stat('happiness', -7);
          return c.t(
            `${nm(c)} said "oh... thanks?" You want to move to another country.`,
            `${nm(c)} "Ee... sağ ol?" dedi. Şu an başka bir ülkeye taşınmak istiyorsun.`,
          );
        },
      },
      {
        id: 'note',
        label: (c) => c.t('Slip an anonymous note', 'İmzasız bir not bırak'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            `You left a note in ${nm(c)}'s locker. ${He(who(c))} showed it to everyone, trying to guess who wrote it.`,
            `${gen(nm(c))} dolabına bir not bıraktın. Kimin yazdığını bulmak için notu herkese gösterdi.`,
          );
        },
      },
      {
        id: 'nothing',
        label: (c) => c.t('Admire from afar', 'Uzaktan sev'),
        resolve: (c) => c.t('You admired from afar. Very, very far.', 'Uzaktan sevdin. Çok ama çok uzaktan.'),
      },
    ],
  },
  {
    id: 'base.party',
    category: 'random',
    minAge: 15,
    maxAge: 24,
    title: (c) => c.t('You are invited to the biggest party of the year.', 'Yılın en büyük partisine davetlisin.'),
    text: (c) =>
      c.age < 18
        ? c.t('Your parents said absolutely not.', 'Ailen "Kesinlikle olmaz" dedi.')
        : c.t('You have work early tomorrow.', 'Yarın sabah erkenden işe gideceksin.'),
    choices: [
      {
        id: 'go',
        label: (c) => (c.age < 18 ? c.t('Sneak out', 'Gizlice kaç') : c.t('Go anyway', 'Yine de git')),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          if (c.rng.chance(0.25)) {
            c.h.stat('health', -4);
            return c.t(
              'Best night ever, until you fell into the pool fully dressed.',
              'Hayatının gecesiydi, ta ki giyinik hâlde havuza düşene kadar.',
            );
          }
          return c.t('Best night ever. You danced until 3 a.m.', 'Hayatının gecesiydi. Sabahın üçüne kadar dans ettin.');
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home', 'Evde kal'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t(
            "You stayed home and watched the party unfold on everyone's stories.",
            'Evde kaldın ve partiyi herkesin hikâyesinden izledin.',
          );
        },
      },
    ],
  },
  {
    id: 'base.acne',
    category: 'health',
    minAge: 13,
    maxAge: 16,
    once: true,
    text: '',
    apply: (c) => {
      c.h.stat('looks', -4);
      c.h.stat('happiness', -3);
      return c.t(
        'A volcano erupted on your forehead the day before school photos.',
        'Okul fotoğrafından bir gün önce alnında bir yanardağ patladı.',
      );
    },
  },
  {
    id: 'base.summer_job',
    category: 'work',
    minAge: 15,
    maxAge: 17,
    once: true,
    title: (c) => c.t('The ice cream shop is hiring for the summer.', 'Dondurmacı yaz için eleman arıyor.'),
    text: (c) => c.t('It pays little but you could eat the broken cones.', 'Maaş az ama kırık külahlar senin.'),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take the job', 'İşi kabul et'),
        resolve: (c) => {
          const pay = wage(c, c.rng.int(600, 1400));
          c.h.money(pay);
          c.h.stat('health', -1);
          return c.t(
            `You worked all summer and saved ${c.h.fmt(pay)}. You never want to see pistachio again.`,
            `Bütün yaz çalışıp ${c.h.fmt(pay)} biriktirdin. Bir daha fıstıklı dondurma görmek istemiyorsun.`,
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Enjoy the summer', 'Yazın tadını çıkar'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return coastal(c)
            ? c.t('You spent the summer at the beach doing absolutely nothing.', 'Yazı sahilde, kesinlikle hiçbir şey yapmadan geçirdin.')
            : c.t('You spent the summer at the public pool doing absolutely nothing.', 'Yazı semt havuzunda, kesinlikle hiçbir şey yapmadan geçirdin.');
        },
      },
    ],
  },
  {
    id: 'base.driving_test',
    category: 'milestone',
    minAge: 17,
    maxAge: 25,
    once: true,
    title: (c) => c.t('Your driving test is today.', 'Bugün ehliyet sınavın var.'),
    text: (c) => c.t('The examiner has a clipboard and no sense of humor.', 'Sınav görevlisinin elinde bir klasör var, yüzünde ise tek bir gülümseme yok.'),
    choices: [
      {
        id: 'careful',
        label: (c) => c.t('Drive like a grandparent', 'Dede gibi sür'),
        resolve: (c) => {
          if (c.rng.chance(0.75)) {
            c.h.flag('license');
            c.h.stat('happiness', 6);
            return c.t('You passed your driving test!', 'Ehliyet sınavını geçtin!');
          }
          return c.t(
            'You drove so slowly the examiner failed you for "obstructing traffic."',
            'O kadar yavaş sürdün ki görevli seni "trafiği aksatmaktan" bıraktı.',
          );
        },
      },
      {
        id: 'confident',
        label: (c) => c.t('Show some confidence', 'Biraz özgüven göster'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.flag('license');
            c.h.stat('happiness', 7);
            return c.t('You passed with style.', 'Sınavı şov yaparak geçtin.');
          }
          c.h.stat('happiness', -5);
          return c.t(
            'You took a corner too fast. The examiner screamed. You failed.',
            'Virajı fazla hızlı aldın. Görevli çığlık attı. Kaldın.',
          );
        },
      },
    ],
  },
];
