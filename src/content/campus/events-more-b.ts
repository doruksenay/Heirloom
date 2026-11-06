import type { ChoiceDef, Ctx, EventDef } from '../types';
import { degreeYears } from '../../engine/degree';
import { isCareerUpgrade, titleFor, type JobDef } from '../../engine/careers';
import { allJobs } from '../registry';
import { abl, aOrAn, dat, gen, loc, nm, publicRulesBlock, who, wage, wth } from '../base/util';
import { ifKin } from '../base/kin';
import { CLUBS, MAJORS, atUni, bumpGpa, campusState, companiesFor, fitsMajor, free, inGrad, majorJobs, peekCampus, type Club } from './state';

// Campus pack, second set B: social life, romance and friends, internships, exchange, the thesis and graduation week.
// Everything here reads the pack's own state (CampusState, c.p.schoolYears) and adds none. Randomness: setup picks
// and chances only through c.rng, never depending on the language.

const W = 16;
const cs = (c: Ctx) => campusState(c.p);
const inTR = (c: Ctx) => c.p.countryId === 'tr';
const he = (c: Ctx) => c.h.he(who(c));

/** An undergraduate who is free. */
const uni = (c: Ctx) => atUni(c) && free(c);
/** Undergraduate or graduate student. */
const student = (c: Ctx) => (atUni(c) || inGrad(c)) && free(c);
/** In the last undergraduate year: the next birthday brings the diploma. */
const finalYear = (c: Ctx) => uni(c) && c.p.schoolYears >= degreeYears(c.p) - 1;
/** Writing something that is called a thesis: graduate students, and undergraduates in their last two years. */
const thesisOn = (c: Ctx) => (inGrad(c) && free(c)) || (uni(c) && c.p.schoolYears >= degreeYears(c.p) - 2);

const classmate = (c: Ctx, gender?: 'female' | 'male') => c.h.newPerson({ gender, age: Math.max(17, c.age + c.rng.int(-2, 2)) });
const oppositeOf = (c: Ctx): 'female' | 'male' => (c.p.gender === 'female' ? 'male' : 'female');

/** One index, both languages read it. */
const pickLine = (c: Ctx, lines: readonly (readonly [string, string])[]) => {
  const i = c.rng.int(0, lines.length - 1);
  return c.t(lines[i][0], lines[i][1]);
};

const partyCount = (c: Ctx) => {
  cs(c).parties++;
};

/** Closer to up to `n` of the player's friends. */
const friendsCloser = (c: Ctx, n: number, d: number) => {
  for (const f of c.h.relatives('friend').slice(0, n)) c.h.closeness(f.person.id, d);
};
const parentsCloser = (c: Ctx, d: number) => {
  for (const f of c.h.relatives(['mother', 'father'])) c.h.closeness(f.person.id, d);
};

const CITY_TR: Record<string, string> = {
  Barcelona: 'Barselona',
  Berlin: 'Berlin',
  Lisbon: 'Lizbon',
  Prague: 'Prag',
  Bologna: 'Bologna',
  'Kraków': 'Krakov',
  Vienna: 'Viyana',
  Amsterdam: 'Amsterdam',
};

const COUNTRIES: [string, string][] = [
  ['Spain', 'İspanya'],
  ['Germany', 'Almanya'],
  ['Italy', 'İtalya'],
  ['Poland', 'Polonya'],
  ['Portugal', 'Portekiz'],
  ['the Netherlands', 'Hollanda'],
];

const jobById = (c: Ctx, id: string) => allJobs(c.s.enabledPacks).find((j) => j.id === id);

/** Graduate jobs that fit the degree and are a real first step (the same filters as the career fair). */
function graduateJobs(c: Ctx) {
  const st = peekCampus(c.p);
  if (!st?.major) return [];
  return majorJobs(c, MAJORS[st.major].fields, 8).filter((j) => fitsMajor(st.major, j.id) && !publicRulesBlock(c, j) && isCareerUpgrade(c, j, 0));
}

const choice = (e: ChoiceDef): ChoiceDef => e;

const events: EventDef[] = [
  // ------------------------------------------------------------------ social life
  {
    id: 'campus.b_club_budget',
    category: 'school',
    minAge: 17,
    weight: W,
    when: (c) => student(c) && (peekCampus(c.p)?.clubs.length ?? 0) > 0,
    setup: (c) => {
      c.vars.club = c.rng.pick(cs(c).clubs);
    },
    title: (c) => {
      const k = c.vars.club as Club;
      return c.t(`The ${CLUBS[k].en} budget was cut to zero.`, `${CLUBS[k].tr} bütçesi sıfırlandı.`);
    },
    text: (c) =>
      c.t(
        'The dean\'s office says clubs should "be self-sustaining". The next meeting has no tea, and the members look genuinely frightened.',
        'Dekanlık "kulüpler kendi kendine yetmeli" demiş. Bir sonraki toplantıda çay bile yok, üyeler gerçekten korkmuş durumda.',
      ),
    choices: [
      choice({
        id: 'bake',
        label: (c) => c.t('Hold a bake sale', 'Kermes düzenle'),
        resolve: (c) => {
          bumpGpa(c, -0.03);
          if (c.rng.chance(0.65)) {
            c.h.money(wage(c, 250));
            c.h.stat('happiness', 4);
            return c.t(
              `Everything sold out by noon. The club has ${c.h.fmt(wage(c, 250))} and a new rule: no more baking by the treasurer.`,
              `Öğlene kadar her şey tükendi. Kulübün kasasında ${c.h.fmt(wage(c, 250))} var; bir de yeni kural: sayman artık hamur işine karışmayacak.`,
            );
          }
          c.h.money(wage(c, 60));
          c.h.stat('happiness', 2);
          return c.t('You ate half of the stock yourself while "quality testing". The rest barely paid for the tea.', 'Stokun yarısını "kalite kontrol" diye kendin yedin. Kalan, çayın parasını zor çıkardı.');
        },
      }),
      choice({
        id: 'dean',
        label: (c) => c.t("Argue it out with the dean's office", 'Dekanlığa gidip hakkını ara'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 300)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 5);
            return c.t('You brought a spreadsheet and a very calm voice. The budget came back, plus a samovar nobody asked for.', 'Yanında bir tablo ve çok sakin bir sesle gittin. Bütçe geri geldi, üstüne kimsenin istemediği bir semaver de verdiler.');
          }
          c.h.stat('happiness', -3);
          return c.t('You were given a form. Then a second form to explain the first form.', 'Sana bir form verdiler. Sonra birinci formu açıklayan ikinci bir form.');
        },
      }),
      choice({
        id: 'pocket',
        label: (c) => c.t('Pay the tea bill yourself', 'Çay parasını kendi cebinden ver'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('happiness', 5);
          return c.t('You paid for the tea all semester. The club made you "honorary treasurer", a title with no salary and a lot of gratitude.', 'Bütün dönem çayı sen ödedin. Kulüp seni "fahri sayman" yaptı: maaşı yok, minneti çok.');
        },
        tone: 'good',
      }),
    ],
  },
  {
    id: 'campus.b_council_election',
    category: 'school',
    minAge: 17,
    weight: W,
    when: (c) => uni(c),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t('The student council election has taken over campus.', 'Öğrenci temsilciliği seçimi kampüsü sardı.'),
    text: (c) =>
      inTR(c)
        ? c.t('Posters on every wall. One candidate promises "free simit every Friday". Another promises to fix the elevator. Nobody believes the elevator.', 'Her duvarda afiş var. Bir aday "her cuma bedava simit" vaat ediyor, bir başkası asansörü tamir edecekmiş. Asansöre kimse inanmıyor.')
        : c.t('Posters on every wall. One candidate promises free pizza every Friday. Another promises to fix the elevator. Nobody believes the elevator.', 'Her duvarda afiş var. Bir aday her cuma bedava pizza vaat ediyor, bir başkası asansörü tamir edecekmiş. Asansöre kimse inanmıyor.'),
    choices: [
      choice({
        id: 'run',
        label: (c) => c.t('Run for the council yourself', 'Temsilciliğe kendin aday ol'),
        badge: 'Risky',
        resolve: (c) => {
          bumpGpa(c, -0.05);
          if (c.rng.chance(0.25 + c.p.stats.smarts / 400 + c.p.stats.looks / 500 + cs(c).clubs.length * 0.03)) {
            c.h.stat('happiness', 8);
            c.h.stat('smarts', 1);
            return c.t('You won by 212 votes. Your first meeting lasted four hours and was entirely about one broken vending machine.', 'İki yüz on iki oyla kazandın. İlk toplantın dört saat sürdü, konusu baştan sona tek bir bozuk otomattı.');
          }
          c.h.stat('happiness', -3);
          return c.t('You came third, behind a candidate who ran as a cat. The cat has a very good social media team.', 'Üçüncü oldun; önünde kedi olarak aday olan biri var. Kedinin sosyal medya ekibi çok iyiymiş.');
        },
      }),
      choice({
        id: 'campaign',
        label: (c) => c.t(`Run ${nm(c)}'s campaign`, `${gen(nm(c))} kampanyasını yönet`),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', c.rng.int(58, 74));
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t(`${nm(c)} won. You are now "chief of staff", which means you carry the banner.`, `${nm(c)} kazandı. Sen de artık "kabine başkanı"sın; yani pankartı taşıyan kişi.`);
          }
          c.h.stat('happiness', 2);
          return c.t(`${nm(c)} lost, but the two of you made the best banner on campus and are now very close.`, `${nm(c)} kaybetti ama pankartınız kampüsün en güzeliydi, ikiniz de çok yakınlaştınız.`);
        },
      }),
      choice({
        id: 'cat',
        label: (c) => c.t('Vote for the cat as a joke', 'Şaka olsun diye kediye oy ver'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('The cat lost by two votes. A recount has been demanded by 400 people, all of them you and your friends.', 'Kedi iki oy farkla kaybetti. Sayımın yenilenmesini dört yüz kişi istiyor; hepsi sen ve arkadaşların.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_party_wrong',
    category: 'school',
    minAge: 17,
    weight: W,
    maxPerLife: 2,
    when: (c) => student(c),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`The party at ${nm(c)}'s flat went wrong.`, `${gen(nm(c))} evindeki parti çığırından çıktı.`),
    text: (c) =>
      inTR(c)
        ? c.t('Somebody forgot a tray of börek in the oven and the smoke alarm is screaming. The downstairs neighbor is at the door in pajamas.', 'Biri fırında börek unuttu, duman alarmı ötüyor. Alt kat komşusu pijamasıyla kapıda.')
        : c.t('Somebody forgot a tray of pizza rolls in the oven and the smoke alarm is screaming. The downstairs neighbor is at the door in pajamas.', 'Biri fırında pizza unuttu, duman alarmı ötüyor. Alt kat komşusu pijamasıyla kapıda.'),
    choices: [
      choice({
        id: 'clean',
        label: (c) => c.t('Stay and clean up', 'Kal, ortalığı topla'),
        resolve: (c) => {
          partyCount(c);
          bumpGpa(c, -0.04);
          c.h.stat('health', -1);
          c.h.closeness(String(c.vars.pid), 10);
          return c.t(`You were mopping at 4 a.m. ${nm(c)} swore ${he(c)} would owe you a kidney, or at least dinner.`, `Sabaha karşı dörtte paspas yapıyordun. ${nm(c)} sana bir böbrek, olmadı bir akşam yemeği borçlandığına yemin etti.`);
        },
        tone: 'good',
      }),
      choice({
        id: 'charm',
        label: (c) => c.t('Charm the neighbor', 'Komşuyu tatlıya bağla'),
        badge: 'Risky',
        resolve: (c) => {
          partyCount(c);
          if (c.rng.chance(0.5 + c.p.stats.looks / 300)) {
            c.h.stat('happiness', 4);
            return c.t('You apologized with a slice of cake. He stayed for an hour and told you about his own student days. They were wilder.', 'Bir dilim kekle özür diledin. Bir saat oturup kendi öğrencilik günlerini anlattı. Onunkiler daha çılgınmış.');
          }
          c.h.money(-wage(c, 100));
          c.h.stat('happiness', -2);
          return inTR(c)
            ? c.t(`The building manager added a "noise fee" to everyone's dues. Your share was ${c.h.fmt(wage(c, 100))}. You are not invited to the next one.`, `Apartman yöneticisi herkesin aidatına bir "gürültü payı" ekledi. Senin payın ${c.h.fmt(wage(c, 100))} oldu. Bir sonrakine çağrılmıyorsun.`)
            : c.t(`The building manager fined the flat, and your share was ${c.h.fmt(wage(c, 100))}. You are not invited to the next one.`, `Apartman yöneticisi eve ceza yazdı, senin payın ${c.h.fmt(wage(c, 100))} oldu. Bir sonrakine çağrılmıyorsun.`);
        },
      }),
      choice({
        id: 'slip',
        label: (c) => c.t('Slip out through the back', 'Arka kapıdan sıvış'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.closeness(String(c.vars.pid), -6);
          return c.t('You were home in ten minutes. By morning the group chat had 300 messages, one of them a video called "who left the oven on".', 'On dakikada evdeydin. Sabaha mesaj grubunda üç yüz mesaj vardı; biri "fırını kim açık bıraktı" adlı bir videoydu.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_derby',
    category: 'school',
    minAge: 17,
    weight: W,
    maxPerLife: 2,
    when: (c) => student(c),
    title: (c) => c.t('Faculty derby: your side plays the faculty next door.', 'Fakülteler arası derbi: senin fakülte yan fakülteyle karşılaşıyor.'),
    text: (c) => c.t('Both sides have drums. One side has a goat on a leash. The match has not started and the shouting already has.', 'İki tarafın da davulu var. Bir tarafın da tasmalı bir keçisi. Maç daha başlamadı ama bağırışlar başladı bile.'),
    choices: [
      choice({
        id: 'play',
        label: (c) => c.t('Play in the match', 'Sahaya çık'),
        badge: 'Risky',
        resolve: (c) => {
          const sporty = cs(c).clubs.includes('sports');
          if (c.rng.chance(0.2 - (sporty ? 0.08 : 0))) {
            c.h.stat('health', -6);
            c.h.stat('happiness', 1);
            return c.t('You twisted your ankle in the tenth minute. It got a cast, and the cast got forty signatures.', 'Onuncu dakikada bileğini burktun. Alçıya aldılar, alçıya kırk imza atıldı.');
          }
          c.h.stat('health', 2);
          if (c.rng.chance(0.5 + (sporty ? 0.15 : 0))) {
            c.h.stat('happiness', 7);
            return c.t('You scored with your knee, which was not the plan. They carried you around on their shoulders anyway.', 'Dizinle gol attın; planda yoktu. Yine de seni omuzlarda taşıdılar.');
          }
          c.h.stat('happiness', 3);
          return c.t('You lost 7-1. The one goal was yours, so you are telling people it was a draw in spirit.', 'Yedi bire kaybettiniz. Tek gol seninkiydi, o yüzden herkese "ruhen beraberlik" diyorsun.');
        },
      }),
      choice({
        id: 'stands',
        label: (c) => c.t('Cheer from the stands in face paint', 'Tribünde yüzünü boyayıp tezahürat yap'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          if (c.rng.chance(0.4)) {
            const f = classmate(c);
            c.h.addRelation(f, 'friend', c.rng.int(50, 70));
            return c.t(`You lost your voice by halftime. ${f.firstName}, who shouted next to you, is now your friend.`, `Devre arasında sesin gitti. Yanında bağıran ${f.firstName} artık arkadaşın.`);
          }
          return c.t('You lost your voice by halftime and sang the rest in your head.', 'Devre arasında sesin gitti, gerisini içinden söyledin.');
        },
      }),
      choice({
        id: 'mascot',
        label: (c) => c.t('Wear the mascot costume', 'Maskot kostümünü giy'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('looks', -1);
          return inTR(c)
            ? c.t('Your faculty mascot is a giant simit. You were inside it for two hours. You have never been so loved, or so hot.', 'Fakültenin maskotu kocaman bir simit. İçinde iki saat kaldın. Hayatında hiç bu kadar sevilmemiş, hiç bu kadar terlememiştin.')
            : c.t('Your faculty mascot is a giant pretzel. You were inside it for two hours. You have never been so loved, or so hot.', 'Fakültenin maskotu kocaman bir pretzel simidi. İçinde iki saat kaldın. Hayatında hiç bu kadar sevilmemiş, hiç bu kadar terlememiştin.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_tree_protest',
    category: 'school',
    minAge: 17,
    weight: W,
    when: (c) => uni(c),
    title: (c) => (inTR(c) ? c.t('They want to cut down the old plane tree on campus.', 'Kampüsteki yaşlı çınarı kesmek istiyorlar.') : c.t('They want to cut down the old oak on campus.', 'Kampüsteki yaşlı meşeyi kesmek istiyorlar.')),
    text: (c) => c.t('A new car park needs the space. Students have started hugging the tree in shifts, and someone has already written it a poem.', 'Yeni otopark için yer lazımmış. Öğrenciler ağacı nöbetleşe kucaklamaya başladı, biri şimdiden ona bir şiir yazdı bile.'),
    choices: [
      choice({
        id: 'chain',
        label: (c) => c.t('Chain yourself to the tree', 'Kendini ağaca zincirle'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -3);
          if (c.rng.chance(0.5)) {
            c.h.achieve('activist');
            c.h.stat('happiness', 8);
            return c.t('It rained all night and you were soaked. In the morning the rector walked up, sighed and cancelled the car park.', 'Bütün gece yağmur yağdı, sırılsıklam oldun. Sabah rektör geldi, iç çekti ve otoparkı iptal etti.');
          }
          c.h.stat('happiness', -2);
          return c.t('They waited until you fell asleep and moved the car park two metres to the left. The tree is saved. You are very wet.', 'Uyuyana kadar beklediler, otoparkı iki metre sola kaydırdılar. Ağaç kurtuldu. Sen ise çok ıslaksın.');
        },
      }),
      choice({
        id: 'petition',
        label: (c) => c.t('Start a petition', 'İmza kampanyası başlat'),
        resolve: (c) => {
          bumpGpa(c, -0.05);
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.4 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 5);
            return c.t('Three thousand signatures, including a professor who signed twice. The tree stays.', 'Üç bin imza topladın, iki kez imzalayan bir hoca da dahil. Ağaç yerinde kalıyor.');
          }
          c.h.stat('happiness', 1);
          return c.t('The tree came down, but its wood became the benches of the new car park. You sit on it sometimes and feel guilty.', 'Ağaç kesildi ama kereste yeni otoparkın banklarına dönüştü. Bazen üstüne oturup suçluluk duyuyorsun.');
        },
      }),
      choice({
        id: 'memes',
        label: (c) => c.t('Run a meme campaign', 'Karikatür ve espriyle kampanya yap'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          if (c.rng.chance(0.3)) {
            c.h.stat('looks', 1);
            return c.t('Your picture of the tree in a tiny graduation cap went around the whole country. The car park moved.', 'Ağacın minik bir mezuniyet kepi taktığı resmin bütün ülkeye yayıldı. Otopark başka yere taşındı.');
          }
          return c.t('The memes were excellent. The tree was cut down anyway, and sixty thousand strangers mourned it in the comments.', 'Esprilerin harikaydı. Ağaç yine de kesildi; altmış bin yabancı yorumlarda yas tuttu.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_talent_night',
    category: 'school',
    minAge: 17,
    weight: W,
    when: (c) => student(c),
    title: (c) => c.t('Talent night has one empty slot, and everyone is looking at you.', 'Yetenek gecesinde tek bir boş sıra kaldı, herkes sana bakıyor.'),
    text: (c) => c.t('The dancing professor pulled out with a sore back. The hall holds six hundred people and a very serious microphone.', 'Dans eden hoca bel ağrısı yüzünden çekildi. Salon altı yüz kişilik, mikrofon da çok ciddi.'),
    choices: [
      choice({
        id: 'sing',
        label: (c) => c.t('Sing a song', 'Şarkı söyle'),
        resolve: (c) => {
          const musical = cs(c).clubs.includes('music');
          if (c.rng.chance(0.35 + (musical ? 0.25 : 0) + c.p.stats.happiness / 400)) {
            c.h.stat('happiness', 8);
            c.h.stat('looks', 1);
            return c.t('Six hundred phone torches went up in the dark. Someone you have never met now knows every word of your song.', 'Karanlıkta altı yüz telefon feneri yandı. Hiç tanımadığın biri şarkındaki her sözü ezbere biliyor.');
          }
          c.h.stat('happiness', 3);
          return c.t('You forgot the second verse and sang the first one again, louder. The audience joined in.', 'İkinci kıtayı unuttun, birinciyi daha yüksek sesle bir daha söyledin. Salon da sana katıldı.');
        },
      }),
      choice({
        id: 'standup',
        label: (c) => c.t('Do stand-up about the cafeteria', 'Yemekhane üzerine gösteri yap'),
        badge: 'Risky',
        resolve: (c) => {
          const witty = cs(c).clubs.includes('theatre') || cs(c).clubs.includes('debate');
          if (c.rng.chance(0.3 + (witty ? 0.2 : 0) + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 7);
            c.h.stat('smarts', 1);
            return c.t('The lentil soup joke killed. The cafeteria manager laughed too, and promised nothing.', 'Mercimek çorbası esprisi salonu yıktı. Yemekhane müdürü de güldü ama hiçbir söz vermedi.');
          }
          c.h.stat('happiness', -4);
          return c.t('The only laugh came from the sound technician, and he looked sorry about it.', 'Tek gülen ses teknisyeni oldu, o da üzgün görünüyordu.');
        },
      }),
      choice({
        id: 'magic',
        label: (c) => c.t('Pull a rabbit out of a hat', 'Şapkadan tavşan çıkar'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('The rabbit came out. It was another rabbit, borrowed from the biology lab, but nobody noticed.', 'Tavşan çıktı. Biyoloji laboratuvarından ödünç alınmış başka bir tavşan çıktı ama kimse fark etmedi.');
          }
          c.h.stat('happiness', -2);
          c.h.stat('health', -1);
          return c.t('The rabbit came out and walked into the audience. Chasing it was the longest act of the night.', 'Tavşan çıktı ve seyircinin arasına daldı. Peşinden koşmak gecenin en uzun numarası oldu.');
        },
      }),
      choice({
        id: 'host',
        label: (c) => c.t('Just host the evening', 'Sadece sunuculuk yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t('You introduced fourteen acts and apologized for six. Nobody remembers the acts, but everybody remembers you.', 'On dört numarayı tanıttın, altısı için özür diledin. Numaraları kimse hatırlamıyor ama seni herkes hatırlıyor.');
        },
      }),
    ],
  },

  // ------------------------------------------------------------------ romance and friendships
  {
    id: 'campus.b_library_crush',
    category: 'love',
    minAge: 17,
    weight: W,
    needs: ['single'],
    when: (c) => uni(c),
    setup: (c) => {
      c.vars.pid = classmate(c, oppositeOf(c)).id;
    },
    title: (c) => c.t(`${nm(c)} sits across from you in the library every day.`, `${nm(c)} kütüphanede her gün tam karşı masaya oturuyor.`),
    text: (c) => c.t(`${he(c) === 'she' ? 'She' : 'He'} has the same highlighter as you. This is basically destiny, or a very small stationery shop.`, 'Seninle aynı fosforlu kalemi kullanıyor. Bu ya kader ya da çok küçük bir kırtasiye.'),
    choices: [
      choice({
        id: 'note',
        label: (c) => c.t('Leave a sticky note in their book', 'Kitabının arasına yapışkan not bırak'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.looks / 250)) {
            c.h.addRelation(who(c), 'partner', c.rng.int(60, 80));
            c.h.stat('happiness', 8);
            return c.t(`The note said "tea at five?" The answer came back on the same note: "Make it four." You are together now.`, 'Notta "beşte çay?" yazıyordu. Cevap aynı notun arkasında geldi: "Dörde alalım." Artık birliktesiniz.');
          }
          c.h.stat('happiness', -3);
          return c.t('The note came back with the grammar corrected in red pen. That is not a no, but it is not a yes either.', 'Not kırmızı kalemle imla hataları düzeltilmiş olarak geri geldi. Bu "hayır" değil ama "evet" de değil.');
        },
      }),
      choice({
        id: 'book',
        label: (c) => c.t('Borrow the same book and wait', 'Aynı kitabı alıp bekle'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', c.rng.int(55, 70));
          bumpGpa(c, 0.05);
          return c.t(`It was a 900-page book on drainage. You discussed it for hours with ${nm(c)}. You are friends now, and you know a lot about drains.`, `Dokuz yüz sayfalık bir drenaj kitabıydı. ${wth(nm(c))} saatlerce konuştunuz. Artık arkadaşsınız, bir de drenaj hakkında çok şey biliyorsun.`);
        },
      }),
      choice({
        id: 'study',
        label: (c) => c.t('Ignore it and study', 'Aldırma, ders çalış'),
        badge: 'Safe',
        resolve: (c) => {
          bumpGpa(c, 0.1);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -1);
          return c.t('You got the best grade of your life. Your heart would like a word with your brain.', 'Hayatının en iyi notunu aldın. Kalbin beynine söylenecek bir iki şey olduğunu söylüyor.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_finals_breakup',
    category: 'love',
    minAge: 17,
    weight: W,
    needs: ['partnered'],
    when: (c) => student(c) && c.h.relatives('partner').length > 0,
    setup: (c) => {
      c.vars.pid = c.h.relatives('partner')[0].person.id;
    },
    title: (c) => c.t(`${nm(c)} says "we need to talk". Finals start on Monday.`, `${nm(c)} "konuşmamız lazım" diyor. Finaller pazartesi başlıyor.`),
    text: (c) => c.t('Nothing good has ever followed those words on a Thursday night. The library closes in two hours.', 'Perşembe akşamı söylenen o sözün arkasından hiç iyi bir şey gelmemiştir. Kütüphane iki saat sonra kapanıyor.'),
    choices: [
      choice({
        id: 'talk',
        label: (c) => c.t('Talk it through tonight', 'Bu gece açık açık konuşun'),
        badge: 'Risky',
        resolve: (c) => {
          bumpGpa(c, -0.1);
          if (c.rng.chance(0.45)) {
            c.h.closeness(String(c.vars.pid), 10);
            c.h.stat('happiness', 4);
            return c.t('You talked until five in the morning. You are still together, with a plan, a list and two cold teas.', 'Sabah beşe kadar konuştunuz. Hâlâ beraberiniz; elinizde bir plan, bir liste ve iki soğuk çay var.');
          }
          c.h.setKind(String(c.vars.pid), 'ex');
          c.h.stat('happiness', -9);
          return c.t('It ended kindly, which is the worst way for it to end. You went home and ate an entire packet of biscuits.', 'Nazik bir şekilde bitti; yani bitmenin en kötü şekliyle. Eve gidip bir paket bisküviyi tek başına bitirdin.');
        },
      }),
      choice({
        id: 'wait',
        label: (c) => c.t('Ask to wait until finals are over', 'Finaller bitene kadar beklemelerini iste'),
        resolve: (c) => {
          bumpGpa(c, 0.1);
          if (c.rng.chance(0.3)) {
            c.h.closeness(String(c.vars.pid), -12);
            c.h.stat('happiness', -3);
            return c.t('You passed every exam. The talk, when it came, was colder than before.', 'Bütün sınavları geçtin. Konuşma geldiğinde eskisinden daha soğuktu.');
          }
          c.h.stat('happiness', 2);
          return c.t('You got through finals with a promise to talk after. It turned out to be a conversation about moving in on the same street, not a breakup.', 'Finalleri "sonra konuşuruz" sözüyle atlattın. Meğer konuşulacak şey ayrılık değil, aynı sokağa taşınmakmış.');
        },
      }),
      choice({
        id: 'books',
        label: (c) => c.t('Let it end and bury yourself in books', 'Bitsin, kendini kitaplara göm'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.setKind(String(c.vars.pid), 'ex');
          bumpGpa(c, 0.15);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -6);
          return c.t('You passed every exam and walked past every shop window with a couple in it very quickly.', 'Bütün sınavlarını geçtin ve içinde bir çift olan her vitrinin önünden hızlı hızlı yürüdün.');
        },
        tone: 'big',
      }),
    ],
  },
  {
    id: 'campus.b_soup_friend',
    category: 'school',
    minAge: 17,
    weight: W,
    when: (c) => student(c),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`You have a fever, and ${nm(c)} knocked on your door.`, `Ateşin çıkmış, kapı çalınca karşında ${nm(c)} çıktı.`),
    text: (c) =>
      inTR(c)
        ? c.t('With a pot of tarhana soup. Nobody has ever brought you soup unasked before.', 'Elinde bir tencere tarhana çorbasıyla. Kimse daha önce sormadan sana çorba getirmemişti.')
        : c.t('With a pot of chicken soup. Nobody has ever brought you soup unasked before.', 'Elinde bir tencere tavuk suyu çorbasıyla. Kimse daha önce sormadan sana çorba getirmemişti.'),
    choices: [
      choice({
        id: 'stay',
        label: (c) => c.t('Let them stay and watch a series with you', 'Kalsın, birlikte dizi izleyin'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', c.rng.int(78, 90));
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          return c.t(`You watched nine episodes with ${nm(c)}. You are still friends, and ${he(c)} still brings soup.`, `${wth(nm(c))} dokuz bölüm dizi izlediniz. Hâlâ dostsunuz, çorbayı da hâlâ o getiriyor.`);
        },
        tone: 'good',
      }),
      choice({
        id: 'fine',
        label: (c) => c.t('Insist you are fine and wave them away', 'İyiyim de, geri gönder'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', c.rng.int(48, 60));
          c.h.stat('health', -4);
          c.h.stat('happiness', 1);
          return c.t(`You said you were fine and sneezed three times. ${nm(c)} left the soup outside your door like feeding a stray cat.`, `İyiyim deyip üç kez hapşırdın. ${nm(c)} çorbayı sokak kedisine mama bırakır gibi kapının önüne koyup gitti.`);
        },
      }),
      choice({
        id: 'feast',
        label: (c) => c.t('Promise a proper thank-you dinner', 'Sağlam bir teşekkür yemeği sözü ver'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.addRelation(who(c), 'friend', c.rng.int(74, 86));
          c.h.stat('happiness', 4);
          return c.t('The dinner was spaghetti and a lot of laughing. The soup pot was never returned. That is how you know it is real.', 'Yemek makarna ve bol kahkahaydı. Çorba tenceresi hiç geri verilmedi. Gerçek arkadaşlığın işareti de bu.');
        },
        tone: 'good',
      }),
    ],
  },

  // ------------------------------------------------------------------ internships and careers
  {
    id: 'campus.b_networking',
    category: 'work',
    minAge: 18,
    weight: W,
    when: (c) => uni(c) && !!peekCampus(c.p)?.major && !peekCampus(c.p)?.internOffer && c.p.schoolYears >= 1,
    setup: (c) => {
      const st = cs(c);
      const field: JobDef['field'] = c.rng.pick(st.major ? MAJORS[st.major].fields : (['office'] as JobDef['field'][]));
      c.vars.field = field;
      c.vars.company = c.rng.pick(companiesFor(c.p.countryId)[field]);
    },
    title: (c) => c.t('The student career day has more free pens than jobs.', 'Öğrenci kariyer gününde işten çok bedava kalem var.'),
    text: (c) => c.t(`${c.vars.company} has a stand with a bowl of mints and a recruiter who has said "great to meet you" 300 times.`, `${c.vars.company} standında bir kâse şeker var, bir de "tanıştığımıza çok memnun oldum" lafını üç yüz kez tekrarlamış bir insan kaynakları görevlisi.`),
    choices: [
      choice({
        id: 'network',
        label: (c) => c.t('Work the room with your CV', 'CV elinde salonu dolaş'),
        badge: 'Risky',
        resolve: (c) => {
          const st = cs(c);
          if (c.rng.chance(0.3 + c.p.stats.smarts / 300 + st.gpa / 12)) {
            st.internOffer = { company: String(c.vars.company), field: c.vars.field as JobDef['field'] };
            c.h.stat('happiness', 5);
            c.h.stat('smarts', 1);
            return c.t(`A recruiter at ${c.vars.company} wrote "call me" on the back of a brochure. After you graduate, a door may be open.`, `${c.vars.company} standındaki görevli broşürün arkasına "beni ara" yazdı. Mezun olunca bir kapı açık kalabilir.`);
          }
          c.h.stat('happiness', -2);
          return c.t('You collected fourteen business cards and gave away fourteen CVs. You are still waiting for the first reply.', 'On dört kartvizit topladın, on dört CV dağıttın. İlk cevabı hâlâ bekliyorsun.');
        },
      }),
      choice({
        id: 'swag',
        label: (c) => c.t('Collect all the free stuff', 'Bedava ne varsa topla'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.money(wage(c, 30));
          return c.t('You left with three tote bags, two bottles and a power bank. You will not need to buy a pen until graduation.', 'Üç bez çanta, iki matara ve bir powerbank ile ayrıldın. Mezun olana kadar kalem almana gerek yok.');
        },
      }),
      choice({
        id: 'workshop',
        label: (c) => c.t('Go to the CV workshop', 'CV atölyesine katıl'),
        resolve: (c) => {
          const st = cs(c);
          c.h.stat('smarts', 2);
          bumpGpa(c, 0.03);
          if (c.rng.chance(0.2)) {
            st.internOffer = { company: String(c.vars.company), field: c.vars.field as JobDef['field'] };
            return c.t(`The workshop leader read your CV and said "call ${c.vars.company}". That is rare. You called.`, `Atölyeyi veren kişi CV'ni okuyup "${c.vars.company} ile görüş" dedi. Pek olmayan bir şey. Aradın.`);
          }
          return c.t('Your CV is now one page, which is also the length of your work history. Honest, at least.', 'CV\'n artık tek sayfa; iş geçmişinin uzunluğu da bu kadar. En azından dürüst.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_unpaid_offer',
    category: 'work',
    minAge: 18,
    weight: W,
    when: (c) => uni(c) && !!peekCampus(c.p)?.major && c.p.schoolYears >= 1 && (peekCampus(c.p)?.internships ?? 0) < 3,
    setup: (c) => {
      const st = cs(c);
      const field: JobDef['field'] = c.rng.pick(st.major ? MAJORS[st.major].fields : (['office'] as JobDef['field'][]));
      c.vars.field = field;
      c.vars.company = c.rng.pick(companiesFor(c.p.countryId)[field]);
    },
    title: (c) => c.t(`${c.vars.company} offers you an unpaid internship.`, `${c.vars.company} sana ücretsiz bir staj öneriyor.`),
    text: (c) => c.t('The email says "exposure" four times and "salary" never. They promise a famous name on your CV.', 'E-postada "tecrübe" kelimesi dört kez geçiyor, "maaş" hiç geçmiyor. CV\'nde ünlü bir isim olacağını söylüyorlar.'),
    choices: [
      choice({
        id: 'accept',
        label: (c) => c.t('Accept, for the experience', 'Tecrübe diye kabul et'),
        resolve: (c) => {
          const st = cs(c);
          st.internships++;
          c.h.money(-wage(c, 300));
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          if (c.rng.chance(0.45 + st.gpa / 10)) {
            st.internOffer = { company: String(c.vars.company), field: c.vars.field as JobDef['field'] };
            return c.t(`You paid your own bus fare and made a lot of copies, but ${c.vars.company} wants you back after graduation.`, `Yol parasını kendin verdin, bir sürü fotokopi çektin ama ${c.vars.company} mezun olunca seni geri istiyor.`);
          }
          return c.t('You learned a great deal about the copy machine and nothing about the job. At least it is on your CV.', 'Fotokopi makinesi hakkında çok şey öğrendin, iş hakkında hiçbir şey. En azından CV\'de duruyor.');
        },
      }),
      choice({
        id: 'ask',
        label: (c) => c.t('Politely ask for a stipend', 'Nazikçe harçlık iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            const st = cs(c);
            st.internships++;
            c.h.money(wage(c, 600));
            c.h.stat('smarts', 1);
            return c.t(`They found a budget line called "miscellaneous" and paid you ${c.h.fmt(wage(c, 600))}. You are the first intern in memory to be paid.`, `"Çeşitli giderler" adlı bir bütçe kalemi bulup sana ${c.h.fmt(wage(c, 600))} ödediler. Hafızalara geçen ilk ücretli stajyer oldun.`);
          }
          c.h.stat('happiness', -3);
          return c.t('They offered to pay you in "visibility". You declined, and then got a very long email about visibility.', 'Sana "görünürlük" ile ödeme yapmayı önerdiler. Reddettin; görünürlük hakkında çok uzun bir e-posta aldın.');
        },
      }),
      choice({
        id: 'cafe',
        label: (c) => c.t('Decline and work extra shifts at the café', 'Reddet, kafede fazla mesaiye kal'),
        resolve: (c) => {
          c.h.money(wage(c, 900));
          bumpGpa(c, -0.03);
          c.h.stat('happiness', -1);
          return c.t(`You earned ${c.h.fmt(wage(c, 900))} making lattes. Your CV has a gap, but your bank account does not.`, `Latte yaparak ${c.h.fmt(wage(c, 900))} kazandın. CV'nde boşluk var ama banka hesabında yok.`);
        },
      }),
    ],
  },
  {
    id: 'campus.b_startup_idea',
    category: 'work',
    minAge: 18,
    weight: W,
    when: (c) => student(c),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`${nm(c)} has a startup idea and needs a co-founder.`, `${nm(c)} bir girişim fikriyle geldi, kurucu ortak arıyor.`),
    text: (c) =>
      inTR(c)
        ? c.t('An app that delivers tea to dorm rooms. "Like a taxi, but for çay," says the idea\'s owner, without irony. The business plan is on a napkin.', 'Yurt odalarına çay getiren bir uygulama. Fikrin sahibi "taksi gibi ama çay için" diyor, hiç şakası yok. İş planı peçetenin üstünde.')
        : c.t('An app that delivers tea to dorm rooms. "Like a taxi, but for tea," says the idea\'s owner, without irony. The business plan is on a napkin.', 'Yurt odalarına çay getiren bir uygulama. Fikrin sahibi "taksi gibi ama çay için" diyor, hiç şakası yok. İş planı peçetenin üstünde.'),
    choices: [
      choice({
        id: 'cofound',
        label: (c) => c.t('Become co-founder', 'Kurucu ortak ol'),
        badge: 'Risky',
        resolve: (c) => {
          const startup = cs(c).clubs.includes('startup');
          c.h.money(-wage(c, 300));
          bumpGpa(c, -0.1);
          c.h.addRelation(who(c), 'friend', c.rng.int(55, 72));
          if (c.rng.chance(0.12 + (startup ? 0.1 : 0))) {
            c.h.money(wage(c, 6000));
            c.h.stat('happiness', 9);
            return c.t(`A bigger company bought the app and the tea trolley. You each got ${c.h.fmt(wage(c, 6000))} and a story for life.`, `Daha büyük bir şirket uygulamayı ve çay arabasını satın aldı. İkinize de ${c.h.fmt(wage(c, 6000))} düştü, bir de ömürlük bir hikâye.`);
          }
          c.h.stat('happiness', 3);
          return c.t('The app got 41 users, 38 of them relatives. You learned that it is easy to make tea and very hard to make it by app.', 'Uygulamanın 41 kullanıcısı oldu; 38\'i akrabalar. Çay yapmanın kolay, uygulamayla çay yapmanın zor olduğunu öğrendin.');
        },
      }),
      choice({
        id: 'advise',
        label: (c) => c.t('Offer to be an advisor (no equity, no work)', 'Danışman ol (hissesiz, işsiz)'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.addRelation(who(c), 'friend', c.rng.int(50, 62));
          return c.t('You gave advice twice. The second time it was "drink some water". The founder wrote it on the napkin.', 'İki kez tavsiye verdin. İkincisi "biraz su iç" idi. Kurucu bunu peçeteye yazdı.');
        },
      }),
      choice({
        id: 'finish',
        label: (c) => c.t('Say: finish the semester first', 'Önce dönemi bitir, de'),
        resolve: (c) => {
          bumpGpa(c, 0.05);
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.15)) {
            c.h.stat('happiness', -2);
            return c.t('Two years later a competitor launched an almost identical app, with a prettier logo. You are fine. You keep telling yourself that.', 'İki yıl sonra benzeri bir uygulama daha güzel bir logoyla çıktı. İyisin. Kendine bunu söyleyip duruyorsun.');
          }
          return c.t('You went back to your notes, the idea went back to the napkin, and the napkin went in the bin. Everyone is at peace.', 'Sen notlarına döndün, fikir peçeteye döndü, peçete de çöpe gitti. Herkes huzurlu.');
        },
      }),
    ],
  },

  // ------------------------------------------------------------------ study abroad
  {
    id: 'campus.b_erasmus_back',
    category: 'school',
    minAge: 18,
    weight: W,
    when: (c) => uni(c) && !!peekCampus(c.p)?.abroad,
    setup: (c) => {
      c.vars.city = String(cs(c).abroad ?? 'Berlin');
    },
    title: (c) => {
      const en = String(c.vars.city);
      return c.t(`You are back from ${en}, but your mind is still there.`, `${abl(CITY_TR[en] ?? en)} döndün ama aklın hâlâ orada.`);
    },
    text: (c) => {
      const en = String(c.vars.city);
      return c.t(`Every sentence starts with "In ${en}...". Your friends have started keeping a count.`, `Her cümleye "${loc(CITY_TR[en] ?? en)}..." diye başlıyorsun. Arkadaşların sayaç tutmaya başladı.`);
    },
    choices: [
      choice({
        id: 'stories',
        label: (c) => c.t('Tell them everything, again', 'Hepsini bir daha anlat'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          friendsCloser(c, 2, -4);
          return c.t('You told the story of the tram strike four times. Your friends begged for mercy and offered you a tea to stop.', 'Tramvay grevi hikâyesini dört kez anlattın. Arkadaşların merhamet diledi, susman için çay ısmarladı.');
        },
      }),
      choice({
        id: 'cook',
        label: (c) => c.t('Cook the dish you learned there', 'Orada öğrendiğin yemeği yap'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 6);
          friendsCloser(c, 3, 5);
          return c.t('It was supposed to be the famous dish. It came out as a soup. Everyone had seconds and said it was authentic.', 'Ünlü yemek olacaktı. Çorba oldu. Herkes ikinci tabağı aldı, "tam aslına uygun" dediler.');
        },
        tone: 'good',
      }),
      choice({
        id: 'language',
        label: (c) => c.t('Sign up for a language course', 'Dil kursuna yazıl'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('smarts', 3);
          return c.t('You can now order coffee in a third language. You still cannot return it in any.', 'Artık üçüncü bir dilde kahve ısmarlayabiliyorsun. Hâlâ hiçbirinde iade edemiyorsun.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_buddy',
    category: 'school',
    minAge: 18,
    weight: W,
    when: (c) => uni(c) && c.p.schoolYears >= 1,
    setup: (c) => {
      c.vars.k = c.rng.int(0, COUNTRIES.length - 1);
      c.vars.pid = classmate(c).id;
    },
    title: (c) => {
      const [en, tr] = COUNTRIES[Number(c.vars.k)];
      return c.t(`The exchange student ${nm(c)} from ${en} is assigned to you.`, `${abl(tr)} gelen değişim öğrencisi ${nm(c)} sana emanet edildi.`);
    },
    text: (c) =>
      inTR(c)
        ? c.t('The new arrival has one suitcase and three questions: where to eat, where to dance and how the dolmuş works.', 'Gelen kişinin bir bavulu ve üç sorusu var: nerede yenir, nerede eğlenilir, dolmuş nasıl çalışır.')
        : c.t('The new arrival has one suitcase and three questions: where to eat, where to dance and how the bus works.', 'Gelen kişinin bir bavulu ve üç sorusu var: nerede yenir, nerede eğlenilir, otobüs nasıl çalışır.'),
    choices: [
      choice({
        id: 'tour',
        label: (c) => c.t('Give the full city tour', 'Şehri baştan sona gezdir'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 30));
          c.h.stat('happiness', 4);
          c.h.addRelation(who(c), 'friend', c.rng.int(65, 80));
          return c.t(`You showed ${nm(c)} everything, including the shop that sells the best tea. ${he(c)} promised you a visit someday.`, `${dat(nm(c))} her yeri gezdirdin; en güzel çayı veren dükkân da dahil. Bir gün ziyaretine gitmek için söz aldın.`);
        },
        tone: 'good',
      }),
      choice({
        id: 'swap',
        label: (c) => c.t('Swap languages: your slang for their grammar', 'Dil değişimi yap: senin argon, onun dilbilgisi'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.addRelation(who(c), 'friend', c.rng.int(55, 70));
          return c.t('You can now insult people in two languages. Your language skills have never been more polite, or more rude.', 'Artık iki dilde laf sokabiliyorsun. Dil becerin hiç bu kadar nazik, hiç bu kadar bıçak gibi olmamıştı.');
        },
      }),
      choice({
        id: 'map',
        label: (c) => c.t('Hand over a map and wish them luck', 'Haritayı ver, kolay gelsin de'),
        badge: 'Safe',
        resolve: (c) => {
          bumpGpa(c, 0.05);
          return c.t('A week later they had found a better guide: a street dog that knows every bakery.', 'Bir hafta sonra daha iyi bir rehber buldular: bütün fırınları bilen bir sokak köpeği.');
        },
      }),
    ],
  },

  // ------------------------------------------------------------------ the thesis
  {
    id: 'campus.b_supervisor',
    category: 'school',
    minAge: 19,
    weight: W,
    when: (c) => thesisOn(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(48, 66) }).id;
    },
    title: (c) => c.t('Your thesis supervisor has not answered your emails in two months.', 'Danışman hocan iki aydır e-postalarına cevap vermiyor.'),
    text: (c) => c.t(`The secretary says ${he(c)} is "at a conference". The conference ended before the semester began.`, 'Sekreter "bir kongrede" diyor. Kongre dönem başlamadan bitmişti.'),
    choices: [
      choice({
        id: 'ambush',
        label: (c) => c.t('Wait outside the office until they show up', 'Odanın önünde gelene kadar bekle'),
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('smarts', 2);
            c.h.stat('health', -1);
            return c.t('You got a forty-second meeting in the corridor. "Fine. Continue." was the whole review. It was enough.', 'Koridorda kırk saniyelik bir görüşme koparttın. "Güzel. Devam et." diye bitti. Yetti.');
          }
          c.h.stat('health', -2);
          c.h.stat('happiness', -2);
          return c.t('You waited six hours and made friends with the cleaner and her cat. The professor never came.', 'Altı saat bekledin, temizlik görevlisi ve kediyle arkadaş oldun. Hoca hiç gelmedi.');
        },
      }),
      choice({
        id: 'switch',
        label: (c) => c.t('Ask for a new supervisor', 'Yeni bir danışman iste'),
        badge: 'Big change',
        resolve: (c) => {
          const st = cs(c);
          if (inGrad(c) && st.gradYearsLeft > 0) st.gradYearsLeft += 1;
          else bumpGpa(c, -0.1);
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t('The new supervisor answers in two minutes. You do not trust it, but you will take it.', 'Yeni danışman iki dakikada cevap veriyor. Güvenmiyorsun ama değerini biliyorsun.');
        },
        tone: 'big',
      }),
      choice({
        id: 'alone',
        label: (c) => c.t('Write the draft alone and send it anyway', 'Taslağı tek başına yazıp yine de gönder'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', -3);
          bumpGpa(c, 0.03);
          return c.t('When your supervisor finally read it, you got one line: "Good. Why did you not ask me?"', 'Danışmanın sonunda okuyunca tek satır yazdı: "İyi. Neden bana sormadın?"');
        },
      }),
    ],
  },
  {
    id: 'campus.b_lost_file',
    category: 'school',
    minAge: 19,
    weight: W,
    when: (c) => thesisOn(c),
    title: (c) => c.t('Your laptop died with the thesis on it.', 'Dizüstün tezinle birlikte öldü.'),
    text: (c) =>
      inTR(c)
        ? c.t('You made a tea. The tea made a decision. The last backup is three months old.', 'Çayını koydun. Çay kendi kararını verdi. Son yedeğin üç aylık.')
        : c.t('You made a coffee. The coffee made a decision. The last backup is three months old.', 'Kahveni yaptın. Kahve kendi kararını verdi. Son yedeğin üç aylık.'),
    choices: [
      choice({
        id: 'rewrite',
        label: (c) => c.t('Rewrite it from memory', 'Baştan, aklından yaz'),
        resolve: (c) => {
          c.h.stat('health', -4);
          c.h.stat('happiness', -4);
          c.h.stat('smarts', 3);
          return c.t('Version two is better than version one. You will never admit this to anyone.', 'İkinci sürüm birincisinden iyi çıktı. Bunu hiç kimseye itiraf etmeyeceksin.');
        },
      }),
      choice({
        id: 'shop',
        label: (c) => c.t('Pay the repair shop', 'Tamirciye öde'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 4);
            return c.t('The man pulled it all off the dead disk and handed it over on a flash drive. You kissed the flash drive.', 'Adam bütün dosyaları bozuk diskten çıkarıp bir flash belleğe koydu. Flash belleği öptün.');
          }
          c.h.stat('health', -3);
          c.h.stat('happiness', -4);
          return c.t('The disk was beyond saving. You paid for the funeral and still had to rewrite everything.', 'Disk kurtarılamayacak durumdaymış. Cenaze masrafını ödedin, yine de her şeyi baştan yazdın.');
        },
      }),
      choice({
        id: 'friend',
        label: (c) => c.t('Beg the computer whiz on your floor', 'Koridordaki bilgisayarcı çocuğa yalvar'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          if (c.rng.chance(0.5)) {
            const f = classmate(c);
            c.h.addRelation(f, 'friend', c.rng.int(60, 74));
            c.h.stat('happiness', 5);
            return c.t(`${f.firstName} recovered every page in one night. You bought the dinner and a new friend.`, `${f.firstName} bütün sayfaları tek gecede kurtardı. Yemeği sen ısmarladın, üstüne yeni bir dost kazandın.`);
          }
          c.h.stat('happiness', -3);
          c.h.stat('health', -2);
          return c.t('He recovered the title page and your sticker collection. You paid for the dinner anyway.', 'Kapak sayfasını ve çıkartma koleksiyonunu kurtardı. Yemeği yine de sen ısmarladın.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_defense',
    category: 'school',
    minAge: 19,
    weight: W,
    once: true,
    when: (c) => (inGrad(c) && free(c) && cs(c).gradYearsLeft <= 1) || finalYear(c),
    title: (c) => c.t('Your thesis defense is on Thursday.', 'Tez savunman perşembe günü.'),
    text: (c) => c.t('Three professors, a decade-old projector and a plate of cookies you suspect are for them.', 'Üç hoca, on yıllık bir projektör ve senin olmadığından şüphelendiğin bir tabak kurabiye.'),
    choices: [
      choice({
        id: 'prep',
        label: (c) => c.t('Rehearse until you dream in slides', 'Rüyanda slayt görene kadar prova yap'),
        resolve: (c) => {
          c.h.stat('health', -2);
          if (c.rng.chance(0.6 + c.p.stats.smarts / 300)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 8);
            if (inGrad(c)) cs(c).papers++;
            else bumpGpa(c, 0.15);
            return c.t('They asked three questions and you knew four answers. The jury shook your hand, and one of them smiled.', 'Üç soru sordular, sen dört cevap verdin. Jüri elini sıktı, içlerinden biri gülümsedi.');
          }
          bumpGpa(c, 0.05);
          c.h.stat('happiness', -2);
          return c.t('One question stumped you. "Revise chapter three," they said, kindly and without eye contact.', 'Bir soruda tıkandın. "Üçüncü bölümü gözden geçir" dediler, nazikçe ve göz göze gelmeden.');
        },
      }),
      choice({
        id: 'baklava',
        label: (c) => c.t('Bring a box of baklava for the jury', 'Jüriye bir kutu baklava getir'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.money(-wage(c, 25));
          if (c.rng.chance(0.5)) {
            bumpGpa(c, 0.15);
            c.h.stat('happiness', 6);
            return c.t('The jury discussed the baklava for longer than the thesis. You passed with comments like "very sweet".', 'Jüri baklavayı tezden uzun konuştu. "Çok tatlı" gibi yorumlarla geçtin.');
          }
          c.h.stat('happiness', -3);
          return c.t('One professor turned out to be allergic to pistachios. The defense was short and tense.', 'Hocalardan birinin fıstığa alerjisi çıktı. Savunma kısa ve gergin geçti.');
        },
      }),
      choice({
        id: 'charm',
        label: (c) => c.t('Rely on charm', 'Tatlı dile güven'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 400)) {
            c.h.stat('happiness', 6);
            return c.t('They loved you. Nobody asked a single hard question, and you still cannot explain why.', 'Seni sevdiler. Kimse tek bir zor soru sormadı, sen de nedenini hâlâ açıklayamıyorsun.');
          }
          bumpGpa(c, -0.2);
          c.h.stat('happiness', -5);
          return c.t('"Revise and resubmit," they said, and wrote it in capitals. You will be seeing this room again.', '"Düzeltip yeniden sun" dediler, büyük harflerle yazdılar. Bu odayı yeniden göreceksin.');
        },
      }),
    ],
  },

  // ------------------------------------------------------------------ graduation week
  {
    id: 'campus.b_graduation_week',
    category: 'milestone',
    minAge: 19,
    weight: 40,
    once: true,
    when: (c) => finalYear(c),
    title: (c) => c.t('Graduation week! Your gown is a size too big.', 'Mezuniyet haftası! Cüppen bir beden büyük.'),
    text: (c) =>
      ifKin(
        c,
        'parents',
        ['The ceremony is on Friday. Your family has already bought the flowers, and the dean has already forgotten your name.', 'Tören cuma günü. Ailen çiçekleri çoktan aldı, dekan adını çoktan unuttu.'],
        ['The ceremony is on Friday. Your friends have already bought the confetti, and the dean has already forgotten your name.', 'Tören cuma günü. Arkadaşların konfetiyi çoktan aldı, dekan adını çoktan unuttu.'],
      ),
    choices: [
      choice({
        id: 'speech',
        label: (c) => c.t('Volunteer to give the class speech', 'Sınıf adına konuşmayı sen yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 300 + cs(c).gpa / 20)) {
            c.h.stat('happiness', 9);
            return c.t('People cried. One person cried for the wrong reasons, but a person is a person.', 'İnsanlar ağladı. Biri yanlış sebepten ağladı ama olsun, ağlayan ağlıyor.');
          }
          c.h.stat('happiness', 2);
          return c.t('You told the same joke twice. The second time it landed.', 'Aynı şakayı iki kez yaptın. İkincisi tuttu.');
        },
      }),
      choice({
        id: 'family',
        label: (c) => c.t('Invite the whole family', 'Bütün aileyi çağır'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', 8);
          parentsCloser(c, 6);
          return ifKin(
            c,
            'parents',
            ['Twenty-three relatives came on one coach and brought their own snacks. Everyone cried, including the coach driver.', 'Yirmi üç akraba tek otobüsle, kendi yiyecekleriyle geldi. Şoför dahil herkes ağladı.'],
            ['Your friends came with banners, and one of them cried more than you did. It counted as family.', 'Arkadaşların pankartlarla geldi, biri senden çok ağladı. Aile sayıldılar.'],
          );
        },
        tone: 'good',
      }),
      choice({
        id: 'trip',
        label: (c) => c.t('Skip the ceremony and take a trip with friends', 'Törene girme, arkadaşlarla tatile çık'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('happiness', 10);
          friendsCloser(c, 3, 5);
          parentsCloser(c, -6);
          return c.t('You spent the week at the sea. The ceremony went ahead without you, and a photo of an empty chair is still going around the family.', 'Haftayı denizde geçirdin. Tören sensiz yapıldı, boş sandalyenin fotoğrafı hâlâ ailede dolaşıyor.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_last_night',
    category: 'milestone',
    minAge: 19,
    weight: 32,
    once: true,
    when: (c) => finalYear(c),
    title: (c) => c.t('Your last night on campus.', 'Kampüste son geceniz.'),
    text: (c) => c.t('The suitcase is half packed. The campus smells of linden blossom, and tomorrow the dorm room goes to a freshman.', 'Bavul yarım yarım toplandı. Kampüs ıhlamur kokuyor, yarın yurt odası bir birinci sınıfa kalacak.'),
    choices: [
      choice({
        id: 'party',
        label: (c) => c.t('One last party', 'Son bir parti'),
        resolve: (c) => {
          partyCount(c);
          c.h.stat('happiness', 8);
          c.h.stat('health', -3);
          return pickLine(c, [
            ['You danced until sunrise and left your dorm key on the dance floor. A stranger returned it in the morning, with a hug.', 'Gün doğana kadar dans ettin, yurt anahtarını pistte unuttun. Biri sabah sarılıp geri getirdi.'],
            ['You gave a farewell speech standing on a chair. The chair gave a farewell speech too, in pieces.', 'Sandalyenin üstünde veda konuşması yaptın. Sandalye de parçalanarak veda etti.'],
            ['Someone played your first-year song. You had to pretend the tears were from laughing.', 'Biri birinci sınıftaki şarkını çaldı. Gözyaşlarının gülmekten olduğunu söylemek zorunda kaldın.'],
          ]);
        },
      }),
      choice({
        id: 'walk',
        label: (c) => c.t('Walk the campus with your closest friends', 'En yakın arkadaşlarınla kampüsü dolaş'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          friendsCloser(c, 3, 6);
          return c.t('Nobody said anything at the main gate, and everyone cried quietly. You promised to meet up every year. Some of you will.', 'Ana kapıda kimse bir şey söylemedi, herkes sessizce ağladı. Her yıl buluşmak için söz verdiniz. Birkaçınız tutacak.');
        },
        tone: 'good',
      }),
      choice({
        id: 'sleep',
        label: (c) => c.t('Go to bed early; the move is tomorrow', 'Erken yat, yarın taşınma var'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 1);
          return c.t('You missed the best night of the year. Your back thanks you, at least.', 'Yılın en güzel gecesini kaçırdın. En azından sırtın sana minnettar.');
        },
      }),
    ],
  },
  {
    id: 'campus.b_job_or_masters',
    category: 'milestone',
    minAge: 21,
    maxAge: 40,
    weight: 24,
    once: true,
    needs: ['unemployed'],
    when: (c) => {
      const st = peekCampus(c.p);
      return free(c) && !!st && st.gradYear > 0 && c.s.year - st.gradYear <= 3 && st.gradOffers >= 2 && !st.masters && !st.phd && !st.grad && c.p.education === 'university' && graduateJobs(c).length > 0;
    },
    setup: (c) => {
      const jobs = graduateJobs(c);
      c.vars.job = jobs.length ? jobs[c.rng.int(0, jobs.length - 1)].id : '';
    },
    title: (c) => c.t('Two envelopes on your desk: a job and a master\'s seat.', 'Masanda iki zarf var: biri iş, biri yüksek lisans.'),
    text: (c) => c.t('Your family has opinions. Your savings have a different opinion. The deadline is Friday for both.', 'Ailenin fikri var. Birikimlerinin başka bir fikri. İkisinin de son tarihi cuma.'),
    choices: [
      choice({
        id: 'job',
        label: (c) => {
          const j = jobById(c, String(c.vars.job));
          const t = j ? titleFor(j, 0, c.lang) : '';
          return c.t(`Take the job: ${t}`, `İşi kabul et: ${t}`);
        },
        resolve: (c) => {
          c.h.setJob(String(c.vars.job));
          c.h.money(wage(c, 500));
          c.h.stat('happiness', 5);
          const t = c.h.jobTitle() ?? '';
          return c.t(`You signed. First day as ${aOrAn(t)}: a desk, a badge and a plant someone left behind. Your bonus was ${c.h.fmt(wage(c, 500))}.`, `İmzayı attın. ${t} olarak ilk gün: bir masa, bir kart ve birinin bıraktığı bir saksı çiçeği. İmza primin ${c.h.fmt(wage(c, 500))} oldu.`);
        },
        tone: 'good',
      }),
      choice({
        id: 'masters',
        label: (c) => c.t("Take the master's seat", 'Yüksek lisans kaydını yaptır'),
        badge: 'Costs more',
        requires: (c) => c.p.stats.smarts >= 50,
        requiresLabel: 'Needs Smarts 50+',
        resolve: (c) => {
          const st = cs(c);
          st.grad = 'masters';
          st.gradYearsLeft = 2;
          st.gradOffers = 1;
          st.funded = st.gpa >= 3.6 || c.h.has('scholarship');
          c.h.flag('grad_school');
          c.h.stat('happiness', 3);
          return st.funded
            ? c.t("You signed up for the master's with a fellowship. The job letter went into the drawer, to be a good story later.", 'Burslu yüksek lisansa kaydoldun. İş mektubu çekmeceye girdi, ileride güzel bir hikâye olacak.')
            : c.t(`You signed up for the master's. Tuition is ${c.h.fmt(wage(c, 4000))} a year. The noodles are back, and so is your advisor's number.`, `Yüksek lisansa kaydoldun. Yıllık harç ${c.h.fmt(wage(c, 4000))}. Hazır erişte geri döndü, danışmanın numarası da.`);
        },
      }),
      choice({
        id: 'wait',
        label: (c) => c.t('Ask both for a year, go and think', 'İkisinden de bir yıl iste, git düşün'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.money(-wage(c, 100));
          return c.t('Both said no. You decided to think anyway, on a bench by the water, with a simit. It was an expensive bench.', 'İkisi de hayır dedi. Sen yine de düşünmeye gittin, suyun kenarında bir bankta, simit eşliğinde. Pahalı bir bankmış.');
        },
      }),
    ],
  },
];

export const campusMoreBEvents: EventDef[] = events;
