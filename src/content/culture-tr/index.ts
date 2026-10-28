import type { ActivityDef, ContentPack, Ctx, EventDef } from '../types';
import { canMarryGrandkid, marryGrandkid } from '../base/events-elder';
import type { GameState } from '../../engine/types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import { aOrAn, cap, dat, eligibleJobs, gen, kin, kinWord, nm, officeJob, single, wage, who, wth } from '../base/util';
import { pickIndex, say, type Pair } from '../base/lines';
import { closeAll, hasDad, hasMom, inTR } from './common';
import { aliveKin } from '../base/kin';
import { milestoneEvents, trOnYear, trSchedule } from './milestones';
import { bayramLine, FERRY_IST, FERRY_IZMIR, HALISAHA, HALISAHA_HURT, kahveLine, pazarLines, sayBand, TAVLA, teaLine } from './lines';
import { bandOf } from './common';

// "Türkiye" culture pack: everyday Turkish life moments for characters living in Türkiye.
// The life milestones (sünnet, LGS, YKS and the tercih, askerlik, the wedding, the tapu) are scheduled: milestones.ts.
// The repeatable activity lines live in lines.ts, split by age band.
export const CULTURE_TR_ENTITLEMENT = 'pack.culture_tr';

/** A child of yours who has children of their own and is at least `minAge` years old. */
const hasGrandkids = (c: Ctx, minAge: number) => c.h.relatives('child').some((k) => (k.person.kids ?? 0) > 0 && c.h.ageOf(k.person) >= minAge);
/** Grandchildren with real records (newer saves), alive and within an age range. */
const grandkidsAged = (c: Ctx, min: number, max: number) =>
  c.h
    .relatives('child')
    .flatMap((k) => k.person.childIds ?? [])
    .map((id) => c.s.people[id])
    .filter((g) => !!g && g.deathYear === undefined && c.h.ageOf(g) >= min && c.h.ageOf(g) <= max);
/** True when grandchildren have real records (otherwise only a count is known). */
const knowsGrandkids = (c: Ctx) => c.h.relatives('child').some((k) => (k.person.childIds ?? []).length > 0);
/** Running a household of your own (paying the bills), not living with the parents. */
const ownHome = (c: Ctx) => c.p.home.owned || (!!c.p.jobId && c.age >= 23);
const family = (c: Ctx) => c.h.relatives(['mother', 'father', 'sibling', 'child', 'spouse']);
const isIzmir = (c: Ctx) => ['İzmir', 'Izmir'].includes(c.p.city);
const isIstanbul = (c: Ctx) => ['İstanbul', 'Istanbul'].includes(c.p.city);
/** Big cities people moved to; the family hometowns they came from (cities of the game, so moving back is real). */
const BIG_CITIES = ['İstanbul', 'Istanbul', 'Ankara', 'İzmir', 'Izmir', 'Bursa', 'Antalya'];
const HOMETOWNS = ['Zonguldak', 'Trabzon', 'Samsun', 'Konya', 'Eskişehir', 'Mersin'];
/**
 * The family's memleket: a hometown fixed by the family name (the same for every generation), for a life in a big
 * city. undefined for a life already in a smaller city: there is no "back home" to move to (review 5 §3.13).
 */
export function memleketOf(c: Ctx): string | undefined {
  if (!BIG_CITIES.includes(c.p.city)) return undefined;
  const name = c.s.dynasty.familyName || c.p.lastName;
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HOMETOWNS[h % HOMETOWNS.length];
}

// ------------------------------------------------------------------ childhood

const childhood: EventDef[] = [
  {
    id: 'tr.evil_eye',
    category: 'random',
    minAge: 0,
    maxAge: 3,
    once: true,
    when: inTR,
    text: '',
    apply: (c) => {
      const g = c.h.relatives(['mother', 'father'])[0];
      return g
        ? c.t(
            `Your ${kinWord(g.person, g.rel.kind)} pinned a blue evil-eye bead (nazar boncuğu) to your clothes. "Just in case."`,
            `${cap(kin(c, g.person, g.rel.kind))} zıbınına mavi bir nazar boncuğu iğneledi. "Maşallah, nazar değmesin."`,
          )
        : c.t('Somebody pinned a blue evil-eye bead (nazar boncuğu) to your clothes. "Just in case."', 'Biri zıbınına mavi bir nazar boncuğu iğneledi. "Maşallah, nazar değmesin."');
    },
  },
  {
    id: 'tr.onluk',
    category: 'school',
    minAge: 6,
    maxAge: 7,
    once: true,
    weight: 50,
    when: (c) => inTR(c) && c.p.school === 'primary' && hasMom(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: 6 }).id;
    },
    title: (c) => c.t('First day of school: a blue smock (önlük) and a white collar.', 'Okulun ilk günü: mavi önlük, beyaz yaka.'),
    text: (c) => c.t('Your mom ironed the collar three times. Your name is written on every single pencil.', 'Annen yakayı üç kez ütüledi. Bütün kalemlerinin üstünde adın yazılı.'),
    choices: [
      {
        id: 'cry',
        label: (c) => c.t('Cling to the school gate', 'Okul kapısına yapış'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          closeAll(c, 'mother', 4);
          return c.t(
            'On the first day of school you cried at the gate until the teacher took your hand. By lunchtime you had forgotten why.',
            'Okulun ilk günü öğretmen elini tutana kadar kapıda ağladın. Öğle arasında neden ağladığını unutmuştun bile.',
          );
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Share your lunchbox (beslenme)', 'Beslenmeni paylaş'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 5);
          return c.t(
            `At break time (teneffüs) you split your börek with ${nm(c)}. By the last bell you were best friends.`,
            `Teneffüste böreğini ${wth(nm(c))} paylaştın. Son zil çaldığında kanka olmuştunuz.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'read',
        label: (c) => c.t('Tell the teacher you can already read', 'Öğretmene okumayı zaten bildiğini söyle'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          return c.t(
            'On day one you told the teacher you could already read. She handed you a book and a long look. By Friday you were class monitor.',
            'İlk gün öğretmene okumayı bildiğini söyledin. Eline bir kitap tutuşturup seni uzun uzun süzdü. Cumaya kadar sınıf başkanı olmuştun.',
          );
        },
      },
    ],
  },
  {
    id: 'tr.mahalle_maci',
    category: 'childhood',
    minAge: 7,
    maxAge: 13,
    cooldown: 4,
    when: inTR,
    title: (c) => c.t("The ball landed on the grumpy neighbor's balcony. Again.", 'Top yine huysuz komşunun balkonuna düştü.'),
    text: (c) => c.t('The street football match (mahalle maçı) has stopped. Everyone is looking at you, because you kicked it.', 'Mahalle maçı durdu. Herkes sana bakıyor, çünkü topa sen vurdun.'),
    choices: [
      {
        id: 'knock',
        label: (c) => c.t('Ring the bell and ask nicely', 'Zili çal, kibarca iste'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 3);
            return c.t('The grumpy neighbor gave the ball back with a ten-minute lecture and a handful of hazelnuts.', 'Huysuz komşu topu on dakikalık bir nasihat ve bir avuç fındıkla geri verdi.');
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The grumpy neighbor is keeping the ball "until you learn some manners." The match went on with a plastic bottle.',
            'Huysuz komşu topu "terbiye öğrenene kadar" vermiyormuş. Maç bir pet şişeyle devam etti.',
          );
        },
      },
      {
        id: 'climb',
        label: (c) => c.t('Climb up the drainpipe', 'Yağmur borusundan tırman'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            c.h.stat('health', 1);
            return c.t(
              'You climbed up, grabbed the ball and scored the winning goal between two parked cars. Your street remembers.',
              'Tırmandın, topu kaptın ve iki park etmiş arabanın arasından altın golü attın. Mahalle bunu unutmaz.',
            );
          }
          c.h.stat('health', -4);
          const caller = hasMom(c) ? ['Your mother', 'Annen'] : hasDad(c) ? ['Your father', 'Baban'] : ['The neighbor upstairs', 'Üst kattaki komşu'];
          return c.t(
            `Climbing to the neighbor's balcony, you fell into the rosebush. ${caller[0]} called you in from the fourth floor, and the whole street heard your full name.`,
            `Komşunun balkonuna tırmanırken gül fidanının içine düştün. ${caller[1]} dördüncü kattan "Eve!" diye bağırdı; bütün sokak göbek adını da öğrendi.`,
          );
        },
      },
      {
        id: 'run',
        label: (c) => c.t('Everyone run!', 'Herkes kaçsın!'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 2);
          return c.t('Twelve kids vanished in four seconds. The neighbor found the ball, but nobody to shout at.', 'On iki çocuk dört saniyede buharlaştı. Komşu topu buldu ama bağıracak kimseyi bulamadı.');
        },
      },
    ],
  },
  {
    id: 'tr.mahalle_kids',
    category: 'childhood',
    minAge: 6,
    maxAge: 11,
    once: true,
    when: (c) => inTR(c) && hasMom(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(5, c.age + c.rng.int(-1, 1)) }).id;
    },
    title: (c) => c.t(`${nm(c)} from downstairs is shouting up at your window.`, `Alt kattaki ${nm(c)} pencerenin altından sesleniyor.`),
    text: (c) => c.t(`"Is ${c.p.firstName} coming down?" Your mom says homework first.`, `"${c.p.firstName}, aşağı insene!" Annen önce ödev diyor.`),
    choices: [
      {
        id: 'down',
        label: (c) => c.t('Race down the stairs', 'Merdivenleri koşarak in'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 55);
          c.h.stat('happiness', 5);
          return c.t(
            `You played hide-and-seek (saklambaç) with ${nm(c)} until the street lights came on. Friends for life.`,
            `Sokak lambaları yanana kadar ${wth(nm(c))} saklambaç oynadın. Artık can ciğersiniz.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'homework',
        label: (c) => c.t('Finish your homework first', 'Önce ödevini bitir'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          return c.t(`By the time you finished, ${nm(c)} had gone home. You watched the empty street from the balcony.`, `Ödev bittiğinde ${nm(c)} çoktan eve girmişti. Balkondan boş sokağı izledin.`);
        },
      },
      {
        id: 'basket',
        label: (c) => c.t('Lower a basket of biscuits from the balcony', 'Balkondan sepetle bisküvi sarkıt'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 45);
          c.h.stat('happiness', 3);
          return c.t(
            `You lowered a basket of biscuits on a rope. ${nm(c)} sent a marble back up. A trade route was born.`,
            `İpe bağlı sepetle aşağı bisküvi sarkıttın. ${nm(c)} yukarı bir bilye yolladı. Ticaret yolu kuruldu.`,
          );
        },
      },
    ],
  },
  {
    id: 'tr.veresiye',
    category: 'childhood',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: (c) => inTR(c) && c.h.relatives('mother').length > 0,
    title: (c) => c.t('Your mom sends you to the corner shop (bakkal).', 'Annen seni bakkala yolluyor.'),
    text: (c) =>
      c.t(
        '"One loaf of bread, one milk. Tell Uncle Hasan to write it in the book." The shop keeps a tab (veresiye defteri) for the whole street.',
        '"Bir ekmek, bir süt al. Hasan Amca deftere yazsın."',
      ),
    choices: [
      {
        id: 'exact',
        label: (c) => c.t('Buy exactly what she said', 'Sadece söyleneni al'),
        resolve: (c) => {
          closeAll(c, 'mother', 3);
          return c.t('You bought bread and milk at the bakkal, nothing else. Uncle Hasan gave you a free chewing gum for your honesty.', 'Bakkaldan ekmek, süt aldın, başka bir şey değil. Hasan Amca dürüstlüğüne bir sakız ikram etti.');
        },
      },
      {
        id: 'treat',
        label: (c) => c.t('Add a chocolate to the tab', 'Deftere bir de çikolata yazdır'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          if (c.rng.chance(0.5)) {
            closeAll(c, 'mother', -3);
            return c.t("At the end of the month the corner shop's tab showed eleven chocolates. Your mom read them out one by one.", 'Ay sonunda bakkalın veresiye defterinde on bir çikolata çıktı. Annen hepsini tek tek okudu.');
          }
          return c.t("Nobody ever checked the corner shop's tab. You got away with the chocolate, and the guilt lasted until high school.", 'Bakkalın defterini kimse kontrol etmedi. Çikolatayla paçayı kurtardın; vicdan azabı liseye kadar sürdü.');
        },
      },
      {
        id: 'coins',
        label: (c) => c.t('Pay with your piggy bank coins', 'Kumbarandaki bozuklukla öde'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(
            'You emptied your piggy bank on the counter. Uncle Hasan counted every coin and called you "a real merchant."',
            'Kumbarayı bakkalın tezgâhına boşalttın. Hasan Amca bozuklukları tek tek saydı ve sana "Tam tüccar" dedi.',
          );
        },
      },
    ],
  },
  {
    id: 'tr.karne',
    category: 'school',
    minAge: 7,
    maxAge: 17,
    cooldown: 4,
    when: (c) => inTR(c) && (c.p.school === 'primary' || c.p.school === 'highschool') && hasMom(c) && hasDad(c),
    setup: (c) => {
      c.vars.grade = c.p.stats.smarts >= 70 ? 'takdir' : c.p.stats.smarts >= 45 ? 'tesekkur' : 'zayif';
    },
    title: (c) =>
      c.vars.grade === 'takdir'
        ? c.t('Report card day (karne): a high honors certificate (takdir)!', 'Karne günü: takdir belgesi aldın!')
        : c.vars.grade === 'tesekkur'
          ? c.t('Report card day (karne): an honors certificate (teşekkür).', 'Karne günü: teşekkür belgesi aldın.')
          : c.t('Report card day (karne): there is a failing grade on it.', 'Karne günü: karnende bir zayıf var.'),
    text: (c) => c.t('The whole street is comparing report cards on the way home.', 'Eve dönüş yolunda bütün sokak karne karşılaştırıyor.'),
    choices: [
      {
        id: 'show',
        label: (c) => c.t('Show it at dinner', 'Akşam yemeğinde göster'),
        resolve: (c) => {
          if (c.vars.grade === 'takdir') {
            c.h.money(wage(c, 30));
            c.h.stat('happiness', 5);
            return c.t('Your dad saw the high honors on your report card, gave you pocket money (harçlık) and told the neighbors twice.', 'Baban karnendeki takdiri görünce harçlık verdi ve durumu komşulara iki kez anlattı.');
          }
          if (c.vars.grade === 'tesekkur') {
            c.h.stat('happiness', 2);
            return c.t('Your mom looked at your honors certificate and said "Well done. Your cousin got high honors, though."', 'Annen teşekkür belgene bakıp "Aferin" dedi. "Ama kuzenin takdir almış."');
          }
          c.h.stat('happiness', -3);
          c.h.stat('smarts', 2);
          closeAll(c, ['mother', 'father'], 2);
          return c.t('Your dad saw the failing grade. There was a long silence. Then he said "We will study together this summer." He meant it.', 'Baban karnedeki zayıfı gördü. Uzun bir sessizlik oldu. Sonra "Bu yaz beraber çalışacağız" dedi. Ciddiydi.');
        },
      },
      {
        id: 'hide',
        label: (c) => c.t('Hide it at the bottom of your bag', 'Çantanın dibine sakla'),
        resolve: (c) => {
          if (c.vars.grade === 'takdir') {
            c.h.stat('happiness', 2);
            return c.t('You hid your high honors certificate out of modesty. Your mom found it and had it framed.', 'Takdir belgeni alçakgönüllülükten sakladın. Annen buldu ve çerçeveletti.');
          }
          if (c.rng.chance(0.6)) {
            closeAll(c, ['mother', 'father'], -3);
            return c.t('Your mom found the hidden report card while washing your bag. The conversation was long.', 'Annen çantayı yıkarken sakladığın karneyi buldu. Konuşma uzun sürdü.');
          }
          c.h.stat('happiness', 2);
          return c.t('Nobody asked about the report card. Nobody signed it. Summer is free.', 'Karneyi kimse sormadı, kimse imzalamadı. Yaz tatili özgür.');
        },
      },
      {
        id: 'grandma',
        label: (c) => c.t('Show your grandmother first', 'Önce ninene göster'),
        hidden: (c) => !aliveKin(c, 'grandparent', 'female'),
        resolve: (c) => {
          c.h.money(wage(c, 15));
          c.h.stat('happiness', 4);
          return c.t('You showed your report card to your grandmother first. She kissed your forehead and slipped you some money, whatever the grades said.', 'Karneni önce ninene gösterdin. Notlara bakmadan alnından öptü ve avucuna para sıkıştırdı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'tr.kurban',
    category: 'family',
    minAge: 6,
    maxAge: 15,
    once: true,
    when: (c) => inTR(c) && hasMom(c),
    title: (c) => c.t('Feast of Sacrifice (Kurban Bayramı): you are the delivery kid.', 'Kurban Bayramı: dağıtım görevi sende.'),
    text: (c) =>
      c.t(
        'The meat is split three ways: one share for home, one for relatives, one for neighbors in need.',
        'Etler üçe bölündü: bir pay eve, bir pay akrabaya, bir pay ihtiyacı olan komşulara.',
      ),
    choices: [
      {
        id: 'street',
        label: (c) => c.t('Carry the parcels round the street', 'Paketleri sokağa dağıt'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', 1);
          return c.t(
            'Carrying the Kurban Bayramı parcels, you climbed every staircase on the street. Every door gave you a chocolate and a "bless your hands" (eline sağlık).',
            'Kurban paylarını dağıtırken sokaktaki bütün merdivenleri tırmandın. Her kapıdan bir çikolata ve bir "Eline sağlık" aldın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Help in the kitchen', 'Mutfakta yardım et'),
        resolve: (c) => {
          closeAll(c, 'mother', 4);
          c.h.stat('smarts', 1);
          return c.t(
            'On Kurban Bayramı you helped your mom and your aunts in the kitchen. They talked about everyone. You learned more than at school.',
            'Kurban Bayramında annene ve teyzelere mutfakta yardım ettin. Herkesi konuştular; okulda öğrendiğinden fazlasını öğrendin.',
          );
        },
      },
      {
        id: 'relatives',
        label: (c) => c.t('Ride along to the relatives', 'Akrabalara giden arabaya bin'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          closeAll(c, ['father', 'sibling'], 3);
          return c.t('You rode along delivering the bayram meat. Six relatives, six glasses of cherry juice, six cheek pinches. You slept the whole way home.', 'Kurban etini akrabalara götürdünüz. Altı akraba, altı bardak vişne suyu, altı yanak sıkma. Dönüş yolunda mışıl mışıl uyudun.');
        },
      },
    ],
  },
  {
    id: 'tr.koy',
    category: 'childhood',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: (c) => inTR(c) && aliveKin(c, 'grandparent', 'male') && aliveKin(c, 'grandparent', 'female'),
    title: (c) => c.t("A whole summer at your grandparents' village (köy).", 'Bütün yaz köyde, dedenle ninenin yanındasın.'),
    text: (c) =>
      c.t(
        'No internet, one rooster with a grudge, and hot bread from the clay oven (tandır) every morning.',
        'İnternet yok, sana kin besleyen bir horoz var, her sabah tandırdan sıcak ekmek çıkıyor.',
      ),
    choices: [
      {
        id: 'garden',
        label: (c) => c.t('Help your grandpa in the garden', 'Dedene bahçede yardım et'),
        resolve: (c) => {
          c.h.stat('health', 5);
          return c.t(
            'In the village you learned to pick tomatoes, carry water and nap under the walnut tree. Grandpa says you work like a real villager.',
            'Köyde domates toplamayı, su taşımayı ve ceviz ağacının altında kestirmeyi öğrendin. Deden "Tam köylü oldun" diyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'rooster',
        label: (c) => c.t('Declare war on the rooster', 'Horoza savaş aç'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(
            'The village rooster won every battle. You came home with a scar, a story and a lifelong respect for poultry.',
            'Köyün horozu bütün muharebeleri kazandı. Köyden bir yara izi, bir hikâye ve kümes hayvanlarına ömürlük bir saygıyla döndün.',
          );
        },
      },
      {
        id: 'stars',
        label: (c) => c.t('Count the stars from the flat roof', 'Geceleri damda yıldız say'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          if (!c.h.hasHeirloom('quilt') && c.rng.chance(0.15)) {
            c.h.addHeirloom(
              'quilt',
              c.t("Grandma's village quilt", 'Ninenin köy yorganı'),
              c.t('She sewed it from old dresses and gave it to you on the last night of a village summer.', 'Eski entarilerden dikip bir köy yazının son gecesi sana hediye etti.'),
            );
            return c.t(
              'On the village rooftop your grandmother named the stars for you, half of them made up. On the last night she wrapped you in the quilt she sewed for you.',
              'Köyde, damda ninen yıldızlara tek tek isim verdi, yarısını uydurdu. Son gece seni kendi diktiği yorgana sardı ve "Bu artık senin" dedi.',
            );
          }
          return c.t('On the village rooftop your grandmother named the stars for you. Half the names were made up. You believed every one.', 'Köyde, damda ninen yıldızlara tek tek isim verdi. Yarısını uydurdu, sen hepsine inandın.');
        },
      },
    ],
  },
  {
    id: 'tr.trt',
    category: 'childhood',
    minAge: 7,
    maxAge: 12,
    once: true,
    when: (c) => inTR(c) && aliveKin(c, 'grandparent', 'male'),
    title: (c) => c.t('Grandpa remembers when TV had a single channel (TRT).', 'Deden televizyonda tek kanalın, TRT\'nin olduğu günleri anlatıyor.'),
    text: (c) => c.t('Broadcasts ended at midnight with the national anthem and a test card. He says it was better.', 'Yayın gece yarısı İstiklal Marşı ve test kartıyla biterdi. "Daha güzeldi" diyor.'),
    choices: [
      {
        id: 'film',
        label: (c) => c.t('Watch an old black-and-white Yeşilçam film with him', 'Onunla siyah beyaz bir Yeşilçam filmi izle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(
            'You watched an old Yeşilçam film with Grandpa: the rich girl loved the poor boy, someone went blind and everyone cried. He mouthed every line.',
            'Dedenle eski bir Yeşilçam filmi izlediniz. Zengin kız fakir oğlana âşık oldu, biri kör oldu, herkes ağladı. Deden bütün repliklere eşlik etti.',
          );
        },
        tone: 'good',
      },
      {
        id: 'antenna',
        label: (c) => c.t('Ask how the roof antenna worked', 'Çatıdaki anteni sor'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'Grandpa explained the old TV antenna: someone had to stand on the roof turning it while someone in the living room shouted "Now? Now?"',
            'Deden eski anteni anlattı: biri çatıda anteni çevirirken öbürü salondan "Geldi mi? Şimdi?" diye bağırırmış.',
          );
        },
      },
      {
        id: 'terrible',
        label: (c) => c.t('Say it sounds terrible', '"Berbatmış" de'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You said one-channel TV sounded terrible. Grandpa said "At least we talked to each other" and confiscated your tablet for an hour.', 'Tek kanallı televizyona "berbatmış" dedin. Deden "Ama birbirimizle konuşurduk" deyip tabletini bir saatliğine aldı.');
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ youth

const youth: EventDef[] = [
  {
    id: 'tr.lise_ask',
    category: 'love',
    minAge: 15,
    maxAge: 17,
    once: true,
    weight: 15,
    when: (c) => inTR(c) && single(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender === 'female' ? 'male' : 'female', age: c.age }).id;
    },
    title: (c) => c.t(`You have a crush on ${nm(c)} from the next desk.`, `Yan sıradaki ${dat(nm(c))} gönlünü kaptırdın.`),
    text: (c) => c.t('You have a page torn out of your notebook and a pen in your hand.', 'Elinde defterden yırtılmış bir sayfa ve bir kalem var.'),
    choices: [
      {
        id: 'note',
        label: (c) => c.t('Pass a note: "Do you like me? Yes / No / Maybe"', 'Not at: "Benden hoşlanıyor musun? Evet / Hayır / Belki"'),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 250)) {
            c.h.addRelation(who(c), 'partner', 65);
            c.h.stat('happiness', 8);
            return c.t(`${nm(c)} ticked "Yes" and drew a heart next to it. You are officially going out.`, `${nm(c)} "Evet"i işaretleyip yanına kalp çizdi. Artık resmen çıkıyorsunuz.`);
          }
          c.h.stat('happiness', -3);
          return c.t(`${nm(c)} ticked "Maybe" and has not looked at you since. Tragic.`, `${nm(c)} "Belki"yi işaretledi ve o günden beri yüzüne bakmıyor. Trajik.`);
        },
      },
      {
        id: 'friend',
        label: (c) => c.t('Send it through a friend', 'Bir arkadaşla gönder'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            c.h.addRelation(who(c), 'partner', 60);
            c.h.stat('happiness', 6);
            return c.t(`Your friend delivered it like a diplomat. ${nm(c)} wrote back: "Ok :)" You are together.`, `Arkadaşın notu bir diplomat gibi teslim etti. ${nm(c)} cevap yazdı: "Olur :)" Artık birliktesiniz.`);
          }
          c.h.stat('happiness', -4);
          return c.t('Your friend read the note out loud to the whole class. You changed schools in your head, if not on paper.', 'Arkadaşın notu bütün sınıfa yüksek sesle okudu. Kâğıt üstünde olmasa da kafanda okul değiştirdin.');
        },
      },
      {
        id: 'poem',
        label: (c) => c.t('Write a poem and never send it', 'Şiir yaz ama asla gönderme'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -1);
          return c.t('You wrote eleven poems in the back of your maths notebook. They are still there, and still terrible.', 'Matematik defterinin arkasına on bir şiir yazdın. Hâlâ oradalar ve hâlâ berbatlar.');
        },
      },
    ],
  },
  {
    id: 'tr.yurt',
    category: 'school',
    minAge: 18,
    maxAge: 21,
    once: true,
    weight: 40,
    when: (c) => inTR(c) && c.p.school === 'university',
    title: (c) => c.t('University in a new city: where will you live?', 'Yeni şehirde üniversite: nerede kalacaksın?'),
    text: (c) =>
      hasMom(c)
        ? c.t('Your mother has packed enough dried food for a small army.', 'Annen küçük bir orduya yetecek kadar kuru gıda hazırladı bile.')
        : c.t('You have one suitcase, one box of books and a list of dorm rules nobody follows.', 'Bir valiz, bir koli kitap ve kimsenin uymadığı bir yurt kuralları listesi. Hepsi bu.'),
    choices: [
      {
        id: 'yurt',
        label: (c) => c.t('The state dorm (KYK yurdu)', 'KYK yurdu'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t('In the state dorm: six people, one room and one kettle smuggled past the warden. You have never laughed more.', 'KYK yurdunda altı kişi, bir oda ve yurt müdüründen kaçırılmış tek bir su ısıtıcısı. Hiç bu kadar gülmemiştin.');
        },
      },
      {
        id: 'flat',
        label: (c) => c.t('Share a flat with friends (ev arkadaşı)', 'Ev arkadaşlarıyla ev tut'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          c.h.stat('happiness', 5);
          return c.t('You rented a flat with friends: three flatmates, one sink and an endless war over the dishes. Freedom tastes like burnt menemen (eggs and peppers).', 'Arkadaşlarla ev tuttunuz: üç ev arkadaşı, tek lavabo, bitmeyen bir bulaşık savaşı. Özgürlüğün tadı yanık menemen gibi.');
        },
      },
      {
        id: 'aunt',
        label: (c) => c.t('Stay with relatives in the city', 'Şehirdeki akrabalarının yanında kal'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('happiness', -2);
          closeAll(c, ['mother', 'father'], 2);
          return hasMom(c) || hasDad(c)
            ? c.t(
                'You lived with relatives during university: a free room, hot dinners and a ten o\'clock curfew. They report to your parents every evening.',
                `Üniversite boyunca akrabalarının yanında kaldın: bedava oda, sıcak yemek ve akşam onda kapı kilidi. Her akşam ${hasMom(c) ? 'annene' : 'babana'} rapor veriyorlar.`,
              )
            : c.t('You lived with relatives during university: a free room, hot dinners and a ten o\'clock curfew.', 'Üniversite boyunca akrabalarının yanında kaldın: bedava oda, sıcak yemek ve akşam onda kapı kilidi.');
        },
      },
    ],
  },
  {
    id: 'tr.bodrum',
    category: 'random',
    minAge: 18,
    maxAge: 23,
    once: true,
    when: (c) => inTR(c) && !c.p.jobId && c.p.school === null && c.p.jailYears === 0,
    title: (c) => c.t('A friend says there is summer work in Bodrum.', "Bir arkadaşın Bodrum'da yazlık iş olduğunu söylüyor."),
    text: (c) => c.t('Waiting tables (garsonluk) at a seaside restaurant. Sun, tips and no sleep.', 'Sahilde bir restoranda garsonluk. Güneş, bahşiş, uykusuzluk.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Pack a bag and go', 'Çantanı topla, git'),
        resolve: (c) => {
          const earned = wage(c, c.rng.int(1500, 3500));
          c.h.money(earned);
          c.h.stat('happiness', 6);
          c.h.stat('health', -2);
          return c.t(
            `In Bodrum you carried thousands of plates, learned "enjoy your meal" in five languages and came home tanned with ${c.h.fmt(earned)} saved.`,
            `Bodrum'da binlerce tabak taşıdın, "Afiyet olsun"u beş dilde öğrendin. Bronzlaşmış döndün; kenarda ${c.h.fmt(earned)} birikmiş.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home and plan your future', 'Evde kal, geleceğini planla'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          return c.t('You skipped Bodrum, stayed home and made a plan. Then you made a second plan about the first plan.', 'Bodrum\'a gitmeyip evde kaldın ve bir plan yaptın. Sonra o plan hakkında ikinci bir plan yaptın.');
        },
      },
      {
        id: 'forever',
        label: (c) => c.t('Go and never come back', 'Git ve bir daha dönme'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.money(wage(c, 800));
          c.h.stat('happiness', 8);
          closeAll(c, ['mother', 'father'], -4);
          return hasMom(c) || hasDad(c)
            ? c.t('You went to Bodrum and stayed three summers and two winters. Your parents now blame everything on "that Bodrum."', 'Bodrum\'a gittin ve üç yaz iki kış kaldın. Ailen artık her şeye "O Bodrum yüzünden" diyor.')
            : c.t('You went to Bodrum and stayed three summers and two winters. The neighbors now call you "the one from Bodrum."', 'Bodrum\'a gittin ve üç yaz iki kış kaldın. Mahallede artık sana "Bodrumlu" diyorlar.');
        },
      },
    ],
  },
  {
    id: 'tr.kpss',
    category: 'work',
    minAge: 22,
    maxAge: 32,
    once: true,
    when: (c) => inTR(c) && c.p.jailYears === 0 && c.p.school === null && c.p.education !== 'none' && c.h.job()?.field !== 'public' && hasMom(c),
    title: (c) => c.t('Your mom wants you to take the civil service exam (KPSS).', "Annen KPSS'ye girmeni istiyor."),
    text: (c) =>
      c.t('"A government job (memuriyet) is for life. Tenure, a pension and home by half past five."', '"Devlet kapısı başka. Kadro, emeklilik, akşam beş buçukta evdesin."'),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Study for a year at the public library', 'Bir yıl millet kütüphanesinde çalış'),
        resolve: (c) => kpss(c, 60),
      },
      {
        id: 'course',
        label: (c) => c.t('Join a KPSS cram course', 'KPSS kursuna yazıl'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          return kpss(c, 50);
        },
      },
      {
        id: 'private',
        label: (c) => c.t('Stay in the private sector', 'Özel sektörde kal'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You chose the private sector. Your mom tells relatives you are "between things."', 'Özel sektörü seçtin. Annen akrabalara "Şimdilik böyle" diyor.');
        },
      },
    ],
  },
];

function kpss(c: Ctx, need: number): string {
  c.h.stat('smarts', 4);
  c.h.stat('happiness', -3);
  const posts = eligibleJobs(c).filter((j) => j.field === 'public');
  if (c.p.stats.smarts >= need && posts.length) {
    c.h.setJob(c.rng.pick(posts).id);
    c.h.stat('happiness', 8);
    return c.t(
      `You scored high and got a tenured post (kadro) as ${aOrAn(c.h.jobTitle() ?? '')}. Your mother had fried dough (lokma) handed out to the whole street.`,
      `Yüksek puan aldın ve ${c.h.jobTitle()} olarak kadroya girdin. Annen sevinçten mahalleye lokma döktürdü.`,
    );
  }
  return c.t(
    'You scored well, but nine hundred thousand people applied for three thousand posts. Your mom says "next year."',
    'Puanın iyiydi ama üç bin kadroya dokuz yüz bin kişi başvurmuş. Annen "Seneye" diyor.',
  );
}

// ------------------------------------------------------------------ love & weddings

const love: EventDef[] = [
  {
    id: 'tr.gorucu',
    category: 'love',
    minAge: 24,
    maxAge: 38,
    once: true,
    when: (c) => inTR(c) && single(c) && hasMom(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender === 'female' ? 'male' : 'female', age: c.age + c.rng.int(-3, 4) }).id;
    },
    title: (c) => c.t(`The neighbor auntie insists you meet ${nm(c)}.`, `Komşu teyze seni illa ki ${wth(nm(c))} tanıştırmak istiyor.`),
    text: (c) =>
      c.t(
        `"${nm(c)} is very respectable. Has a job. Good family." She has already told ${nm(c)}'s mother you're coming for a formal family visit (görücü).`,
        `"${nm(c)} çok efendi. İşi gücü yerinde, ailesi de düzgün." ${gen(nm(c))} annesine görücüye geleceğinizi çoktan haber vermiş bile.`,
      ),
    choices: [
      {
        id: 'coffee',
        label: (c) => c.t('Go for coffee (with both families)', 'Görücüye git, kahve iç (iki aile bir arada)'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.addRelation(who(c), 'partner', 70);
            c.h.stat('happiness', 8);
            return c.t(
              `You met ${nm(c)} over Turkish coffee while both mothers pretended not to listen. You're together now.`,
              `${wth(nm(c))} Türk kahvesi eşliğinde tanıştın; iki anne de dinlemiyormuş gibi yaptı. Artık birliktesiniz.`,
            );
          }
          return c.t(
            `You met ${nm(c)}. Lovely person, zero chemistry. The auntie is already planning the next one.`,
            `${wth(nm(c))} tanıştın. Çok tatlı biri ama aranızda kıvılcım sıfır. Teyze şimdiden bir sonrakini ayarlıyor.`,
          );
        },
      },
      {
        id: 'salt',
        label: (c) =>
          c.p.gender === 'female'
            ? c.t('Serve the coffee with salt in it (the old test)', 'Kahveyi tuzlu pişir (eski usul sınav)')
            : c.t('Drink the salted coffee without flinching', 'Tuzlu kahveyi gıkını çıkarmadan iç'),
        badge: 'Risky',
        resolve: (c) => {
          const ok = c.rng.chance(0.55);
          if (ok) {
            c.h.addRelation(who(c), 'partner', 75);
            c.h.stat('happiness', 9);
          }
          if (c.p.gender === 'female') {
            return ok
              ? c.t(
                  `You put salt in ${nm(c)}'s coffee, as tradition allows. ${nm(c)} drank it anyway and smiled. You're together now.`,
                  `Adettendir, ${gen(nm(c))} kahvesine tuz koydun. ${nm(c)} yine de gık demeden içti ve gülümsedi. Artık birliktesiniz.`,
                )
              : c.t(`${nm(c)} took one sip and coughed for a full minute. Both families laughed. There was no second visit.`, `${nm(c)} bir yudum aldı ve tam bir dakika öksürdü. İki aile de güldü. İkinci ziyaret olmadı.`);
          }
          return ok
            ? c.t(`${nm(c)} had salted your coffee. You drank every drop with a straight face. ${nm(c)} was impressed. You're together now.`, `${nm(c)} kahveni tuzlamıştı. Yüzünü bile buruşturmadan son damlasına kadar içtin. ${nm(c)} çok etkilendi. Artık birliktesiniz.`)
            : c.t(`${nm(c)} had salted your coffee. You made a face after one sip. ${nm(c)}'s grandmother crossed you off the list.`, `${nm(c)} kahveni tuzlamıştı. İlk yudumda yüzünü buruşturdun. ${gen(nm(c))} babaannesi seni çoktan listeden sildi.`);
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You declined. The neighbor auntie now greets you with a sigh.', 'Reddettin. Komşu teyze artık seni her gördüğünde derin bir "ah" çekiyor.');
        },
      },
    ],
  },
  {
    id: 'tr.ceyiz',
    category: 'family',
    minAge: 20,
    maxAge: 35,
    once: true,
    when: (c) => inTR(c) && c.h.relatives('partner').length > 0 && c.h.relatives('mother').length > 0,
    title: (c) => c.t('Your mother opens the hope chest (çeyiz).', 'Annen çeyiz sandığını açtı.'),
    text: (c) =>
      c.t(
        'Lace doilies, twelve tea glasses, a crocheted tissue-box cover and towels with your initials. She started when you were born.',
        'Dantel örtüler, on iki çay bardağı, örgü peçetelik ve üstünde baş harflerin işli havlular. Sen doğduğundan beri biriktiriyor.',
      ),
    choices: [
      {
        id: 'all',
        label: (c) => c.t('Take it all, with gratitude', 'Hepsini minnetle al'),
        resolve: (c) => {
          closeAll(c, 'mother', 8);
          c.h.stat('happiness', 2);
          return c.t('You took the whole çeyiz. Your future home now has more doilies than surfaces.', 'Çeyizin hepsini aldın. Müstakbel evinde artık yüzeyden çok dantel var.');
        },
        tone: 'good',
      },
      {
        id: 'some',
        label: (c) => c.t('Keep only the handmade pieces', 'Sadece el emeklerini al'),
        resolve: (c) => {
          closeAll(c, 'mother', 3);
          c.h.stat('happiness', 3);
          return c.t('From the çeyiz you kept the hand-embroidered pieces. Your mother pretended not to mind, then embroidered three more.', 'Çeyizden elde işlenenleri aldın. Annen alınmamış gibi yaptı, sonra üç tane daha işledi.');
        },
      },
      {
        id: 'minimal',
        label: (c) => c.t('Say you want a minimalist home', 'Minimalist bir ev istediğini söyle'),
        resolve: (c) => {
          closeAll(c, 'mother', -6);
          c.h.stat('happiness', 1);
          return c.t('You said "minimalist." Your mother heard "I don\'t love you." The doilies went to your cousin.', 'Sen "minimalist" dedin, annen "Seni sevmiyorum" duydu. Dantellerin hepsi kuzenine gitti.');
        },
      },
    ],
  },
];

// ------------------------------------------------------------------ adult life

const adult: EventDef[] = [
  {
    id: 'tr.bayram',
    category: 'family',
    // twice a year in real life, but one log line every few years is enough (review 5 §3.6: bayram lines dominated)
    cooldown: 5,
    when: (c) => inTR(c) && c.h.relatives(['mother', 'father', 'sibling', 'child']).length > 0,
    text: '',
    apply: (c) => {
      closeAll(c, ['mother', 'father', 'sibling', 'child'], 5);
      // the same banded pools and memory as the bayram-visit activity (lines.ts), so the two never repeat each other
      const head = c.t('Bayram (the holiday)! ', 'Bayram geldi! ');
      if (c.age < 15) {
        const cash = wage(c, c.rng.int(10, 40));
        c.h.money(cash);
        c.h.stat('happiness', 6);
        return head + bayramLine(c, cash);
      }
      c.h.stat('happiness', 3);
      return head + bayramLine(c);
    },
  },
  {
    id: 'tr.bayram_yolu',
    category: 'family',
    minAge: 22,
    cooldown: 6,
    when: (c) => inTR(c) && c.h.relatives(['mother', 'father']).length > 0 && (!!c.p.jobId || !!c.h.partner()),
    title: (c) => c.t('A nine-day bayram holiday. Everyone drives home at once.', 'Dokuz günlük bayram tatili. Herkes aynı anda memlekete gidiyor.'),
    text: (c) =>
      c.t(
        `The motorway (otoban) is one long car park. Your ${hasMom(c) ? 'mom' : 'dad'} has been calling since Tuesday: "Did you leave yet?"`,
        `Otoban dev bir otoparka dönmüş. ${hasMom(c) ? 'Annen' : 'Baban'} salıdan beri arıyor: "Yola çıktınız mı?"`,
      ),
    choices: [
      {
        id: 'early',
        label: (c) => c.t('Leave at 4 a.m.', 'Sabaha karşı dörtte yola çık'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 3);
          closeAll(c, ['mother', 'father'], 4);
          return c.t(
            'For the bayram trip you left at 4 a.m. along with four million other clever people. Still, tea and simit at a rest stop at dawn was worth it.',
            'Bayram yoluna sabahın dördünde çıktın; senin gibi akıllı dört milyon kişiyle birlikte. Yine de şafakta mola yerinde çay simit, değdi.',
          );
        },
      },
      {
        id: 'bus',
        label: (c) => c.t('Take the overnight coach', 'Gece otobüsüne bin'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 2);
          closeAll(c, ['mother', 'father'], 4);
          return c.t(
            'On the bayram coach home, the steward (muavin) splashed lemon cologne (kolonya) on your hands every hour. You arrived smelling like a lemon grove.',
            'Memleket otobüsünde muavin her saat başı ellerine limon kolonyası döktü. Memlekete limon bahçesi gibi kokarak vardın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay in the empty city', 'Boşalmış şehirde kal'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          closeAll(c, ['mother', 'father'], -5);
          return c.t(`You skipped the bayram trip. The city was empty and silent; you crossed it in twelve minutes. Your ${hasMom(c) ? 'mom' : 'dad'} has questions.`, `Bayramda şehirde kaldın. Şehir bomboş ve sessizdi. Bir uçtan öbür uca on iki dakikada gittin. ${hasMom(c) ? 'Annenin' : 'Babanın'} soruları var.`);
        },
      },
    ],
  },
  {
    id: 'tr.rent',
    category: 'money',
    minAge: 23,
    cooldown: 3,
    when: (c) => inTR(c) && !c.p.home.owned && !!c.p.jobId,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(800, 2500));
    },
    title: (c) => c.t('Your landlord is raising the rent. Again.', 'Ev sahibin kiraya yine zam yapıyor.'),
    text: (c) =>
      c.t(
        `He wants ${c.h.fmt(Number(c.vars.amt))} more per year and says "everyone is doing it."`,
        `Yıllık ${c.h.fmt(Number(c.vars.amt))} daha istiyor. Gerekçe: "Herkes artırıyor."`,
      ),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay it', 'Öde'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -3);
          return c.t('You paid the new rent. Dinner is lentil soup for a while.', 'Yeni kirayı ödedin. Bir süre akşam yemekleri mercimek çorbası.');
        },
      },
      {
        id: 'negotiate',
        label: (c) => c.t('Negotiate over tea', 'Çay eşliğinde pazarlık et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.h.money(-Math.round(Number(c.vars.amt) / 2));
            return c.t('Three glasses of tea later, he agreed to half the increase.', 'Üç bardak çay sonra zammın yarısına razı oldu.');
          }
          c.h.money(-Number(c.vars.amt));
          return c.t('Three glasses of tea later, he said "no" very warmly.', 'Üç bardak çay sonra büyük bir samimiyetle "Olmaz" dedi.');
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Move further from the center', 'Merkezden uzağa taşın'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          c.h.stat('health', -1);
          // a commuter ferry only exists in İstanbul and İzmir (not in Antalya or Trabzon, coastal or not)
          return isIstanbul(c) || isIzmir(c)
            ? c.t('You moved to a cheaper flat. Your commute is now two buses and a ferry.', 'Daha ucuz bir daireye taşındın. İşe gidiş artık iki otobüs bir vapur.')
            : c.t('You moved to a cheaper flat. Your commute is now two buses and a minibus.', 'Daha ucuz bir daireye taşındın. İşe gidiş artık iki otobüs bir minibüs.');
        },
      },
    ],
  },
  {
    id: 'tr.kombi',
    category: 'money',
    minAge: 23,
    cooldown: 6,
    when: (c) => inTR(c) && ownHome(c),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(150, 400));
    },
    title: (c) => c.t('The gas bill (doğalgaz) arrived. Then the boiler (kombi) died.', 'Doğalgaz faturası geldi. Ardından kombi bozuldu.'),
    text: (c) => c.t('It is January. You can see your breath in the living room.', 'Ocak ayı. Salonda nefesin buhar oluyor.'),
    choices: [
      {
        id: 'service',
        label: (c) => c.t('Call the authorized service', 'Yetkili servisi çağır'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -1);
          return say(c, 'tr.kombi.service', KOMBI_SERVICE);
        },
      },
      {
        id: 'cousin',
        label: (c) => c.t('Call the neighbor\'s cousin who "knows boilers"', '"Kombiden anlayan" komşunun kuzenini çağır'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.money(-Math.round(Number(c.vars.amt) / 4));
            c.h.stat('happiness', 3);
            return c.t('The neighbor\'s cousin hit the boiler twice with a wrench and it roared back to life. He refused money but stayed for dinner.', 'Komşunun kuzeni anahtarla iki kez vurdu, kombi gürül gürül çalıştı. Para almadı ama akşam yemeğine kaldı.');
          }
          c.h.money(-Number(c.vars.amt));
          c.h.stat('happiness', -3);
          return c.t('The neighbor\'s cousin fixed the boiler for a day. Then he fixed it again. Then you called the authorized service anyway.', 'Komşunun kuzeni kombiyi bir günlüğüne tamir etti. Sonra bir daha tamir etti. Sonunda yine yetkili servisi çağırdın.');
        },
      },
      {
        id: 'blankets',
        label: (c) => c.t('Survive with blankets and the oven', 'Battaniye ve fırınla idare et'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', -2);
          return c.t(
            'With the boiler broken, you lived under three blankets for a week and baked anything you could find just to warm the kitchen. The neighbors loved the cookies.',
            'Kombi bozukken bir hafta üç battaniyenin altında yaşadın, mutfak ısınsın diye ne bulduysan fırına attın. Kurabiyeler komşulara çok gitti.',
          );
        },
      },
    ],
  },
  {
    id: 'tr.cay_ocagi',
    category: 'work',
    minAge: 18,
    once: true,
    // a tea kitchen, desks and four managers: office work only (not a miner, a nurse or the company's owner)
    when: (c) => inTR(c) && officeJob(c) && c.p.jailYears === 0,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: 'male', age: c.rng.int(48, 62) }).id;
    },
    title: (c) => c.t(`${nm(c)}, the tea man (çaycı) at work, knows everything.`, `İş yerinin çaycısı ${nm(c)} her şeyi biliyor.`),
    text: (c) =>
      c.t('He carries tea to every desk from his tiny tea kitchen (çay ocağı), hears every phone call and has outlasted four managers.', 'Çay ocağından her masaya çay taşıyor, her telefon konuşmasını duyuyor, dört müdür eskitti.'),
    choices: [
      {
        id: 'befriend',
        label: (c) => c.t('Befriend him', 'Onunla dost ol'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 55);
          c.h.stat('happiness', 2);
          if (c.rng.chance(0.3) && c.h.promote()) {
            c.h.stat('happiness', 4);
            return c.t(
              `The tea man ${nm(c)} tipped you off about an opening upstairs before it was posted. You are now ${aOrAn(c.h.jobTitle() ?? '')}.`,
              `Çaycı ${nm(c)} üst kattaki boş kadroyu ilan edilmeden sana fısıldadı. Artık ${c.h.jobTitle()} unvanın var.`,
            );
          }
          return c.t('You befriended the tea man at work. Your tea now arrives first, fresh and exactly the color you like.', 'İş yerinin çaycısıyla dost oldun. Çayın artık herkesten önce, taze ve tam sevdiğin renkte geliyor.');
        },
        tone: 'good',
      },
      {
        id: 'coffee',
        label: (c) => c.t('Ask for filter coffee instead', 'Çay yerine filtre kahve iste'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(`You asked the tea man for filter coffee. ${nm(c)} looked at you like a traitor. Your tea now arrives lukewarm.`, `Çaycıdan filtre kahve istedin. ${nm(c)} sana hain gibi baktı. Çayın artık ılık geliyor.`);
        },
      },
      {
        id: 'tab',
        label: (c) => c.t('Pay your monthly tea money on time', 'Aylık çay parasını vaktinde öde'),
        resolve: (c) => {
          c.h.money(-wage(c, 20));
          c.h.stat('happiness', 2);
          return c.t(`You paid the tea money on the first of the month. The tea man ${nm(c)} calls you "the only honest person on this floor."`, `Çay parasını ayın birinde ödedin. Çaycı ${nm(c)} sana "Bu kattaki tek dürüst insan" diyor.`);
        },
      },
    ],
  },
  {
    id: 'tr.aidat',
    category: 'money',
    minAge: 25,
    maxAge: 88,
    cooldown: 7,
    when: (c) => inTR(c) && ownHome(c),
    // a different fight each meeting: elevator, insulation, roof, intercom, garden
    setup: (c) => {
      c.vars.topic = pickIndex(c, 'tr.aidat', AIDAT.length);
    },
    title: (c) => c.t('Emergency building meeting (apartman toplantısı).', 'Olağanüstü apartman toplantısı.'),
    text: (c) => aidat(c, 'text'),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Vote yes and pay', 'Evet de, öde'),
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', -1);
          return aidat(c, 'yes');
        },
      },
      {
        id: 'fight',
        label: (c) => c.t('Argue against it for three hours', 'Üç saat itiraz et'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('happiness', -2);
          if (c.rng.chance(0.5)) return aidat(c, 'won');
          c.h.money(-wage(c, 250));
          return aidat(c, 'lost');
        },
      },
      {
        id: 'manager',
        label: (c) => c.t('Volunteer to be the building manager', 'Yöneticiliğe gönüllü ol'),
        resolve: (c) => {
          c.h.flag('tr_yonetici');
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t('You are now the building manager. Your phone rings at 2 a.m. about a leak in flat 4.', 'Artık apartman yöneticisisin. 4 numaradaki su kaçağı için gece ikide telefonun çalıyor.');
        },
      },
    ],
  },
  {
    id: 'tr.deprem',
    category: 'random',
    minAge: 25,
    maxAge: 85,
    once: true,
    when: (c) => inTR(c) && c.p.jailYears === 0,
    title: (c) => c.t('Your building holds an earthquake drill.', 'Apartmanda deprem tatbikatı var.'),
    text: (c) =>
      c.t(
        'Everyone agrees an emergency bag (deprem çantası) is a good idea. Far fewer people have actually packed one.',
        'Herkes deprem çantasının şart olduğu konusunda hemfikir. Gerçekten hazırlayan ise pek az.',
      ),
    choices: [
      {
        id: 'pack',
        label: (c) => c.t('Pack a bag and fix the shelves to the wall', 'Çantayı hazırla, dolapları duvara sabitle'),
        resolve: (c) => {
          c.h.money(-wage(c, 80));
          c.h.stat('happiness', 2);
          c.h.flag('tr_deprem_cantasi');
          return c.t(
            'Water, a whistle, a torch, copies of your documents and spare glasses. The bookshelf is bolted to the wall. You sleep a little easier.',
            'Su, düdük, el feneri, belgelerinin fotokopisi ve yedek gözlük. Kitaplık duvara sabitlendi. Biraz daha rahat uyuyorsun.',
          );
        },
        tone: 'good',
      },
      {
        id: 'course',
        label: (c) => c.t('Join a neighborhood first-aid course', 'Mahalledeki ilk yardım kursuna katıl'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t('You learned first aid with your neighbors. Now the whole building knows who to call.', 'Komşularınla ilk yardım öğrendin. Artık bütün apartman kimi arayacağını biliyor.');
        },
      },
      {
        id: 'later',
        label: (c) => c.t('Put it on the to-do list', 'Yapılacaklar listesine yaz'),
        resolve: (c) => c.t('You wrote "earthquake bag" on the list on the fridge. It is still there, waiting for a free Saturday.', 'Deprem çantasını buzdolabındaki listeye yazdın. Hâlâ orada, boş bir cumartesiyi bekliyor.'),
      },
    ],
  },
  {
    id: 'tr.kentsel',
    category: 'money',
    minAge: 30,
    maxAge: 85,
    once: true,
    weight: 15,
    when: (c) => inTR(c) && c.p.home.owned,
    title: (c) => c.t('A contractor (müteahhit) wants to rebuild your old building.', 'Bir müteahhit eski binanızı yıkıp yeniden yapmak istiyor.'),
    text: (c) =>
      c.t(
        'Urban renewal (kentsel dönüşüm): you move out for two years and come back to a new, earthquake-safe flat. The neighbors are split.',
        'Kentsel dönüşüm: iki yıl başka yerde oturacaksın, sonunda depreme dayanıklı yepyeni bir dairen olacak. Komşular ikiye bölündü.',
      ),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign the deal', 'Sözleşmeyi imzala'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.money(-wage(c, 4000));
          c.p.home.value = Math.round(c.p.home.value * 1.4);
          c.h.stat('happiness', 3);
          return c.t(
            'You signed the urban renewal deal. Two years of renting elsewhere, then a shiny new flat with a car park and a doorman (kapıcı) who knows everyone.',
            'Kentsel dönüşüm sözleşmesini imzaladın. İki yıl kirada oturdun, sonra otoparklı, kapıcılı pırıl pırıl bir daireye taşındın.',
          );
        },
      },
      {
        id: 'holdout',
        label: (c) => c.t('Hold out for a bigger share', 'Daha iyi pay için diren'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(-wage(c, 4000));
            c.p.home.value = Math.round(c.p.home.value * 1.6);
            c.h.stat('happiness', 4);
            return c.t('You held out against the contractor and got a bigger flat. The neighbors now call you "the negotiator," and not kindly.', 'Müteahhide direndin ve daha büyük bir daire kopardın. Komşular sana artık "pazarlıkçı" diyor, pek de sevgiyle değil.');
          }
          c.h.stat('happiness', -3);
          return c.t('You held out against the contractor. He went bankrupt. The building is still old, and so is the argument.', 'Müteahhide direndin. Adam iflas etti. Bina hâlâ eski, kavga da öyle.');
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Refuse and have the building inspected', 'Reddet, binayı mühendise kontrol ettir'),
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', 1);
          return c.t('You refused the urban renewal deal, then paid an engineer to check the building. It passed. You patted the wall like an old horse.', 'Kentsel dönüşümü reddettin, sonra binayı bir mühendise kontrol ettirdin. Testi geçti. Duvarı yaşlı bir at gibi sıvazladın.');
        },
      },
    ],
  },
  {
    id: 'tr.memleket',
    category: 'milestone',
    minAge: 35,
    maxAge: 58,
    once: true,
    weight: 14,
    // only a family that came to a big city from somewhere else has a memleket to go back to (review 5 §3.13)
    when: (c) => inTR(c) && !!c.p.jobId && c.p.jailYears === 0 && !!memleketOf(c),
    title: (c) =>
      c.t(`You dream of leaving the big city for your family's hometown (memleket), ${memleketOf(c)}.`, `Büyük şehri bırakıp memlekete, ${dat(memleketOf(c) ?? '')} dönmeyi düşünüyorsun.`),
    text: (c) =>
      c.t(
        'Fresh air, a garden, neighbors who remember you from childhood summers. Also: one cinema and a single cash machine.',
        'Temiz hava, bir bahçe, seni çocukluk yazlarından hatırlayan komşular. Bir de tek bir sinema ve tek bir bankamatik.',
      ),
    choices: [
      {
        id: 'move',
        label: (c) => c.t('Quit and move back', 'İstifa et, memlekete dön'),
        badge: 'Big change',
        resolve: (c) => {
          const m = memleketOf(c) ?? c.p.city;
          c.h.setJob(null);
          c.h.flag('tr_memleket');
          c.h.stat('happiness', 8);
          c.h.stat('health', 3);
          c.p.city = m;
          return c.t(
            `You quit, loaded a van and moved to ${m}. You now grow tomatoes and argue with the local baker. Bliss.`,
            `İstifa ettin, eşyaları bir kamyonete yükleyip ${dat(m)} taşındın. Artık domates yetiştiriyor, mahallenin fırıncısıyla atışıyorsun. Huzur.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'summer',
        label: (c) => c.t('Buy a little summer house there', 'Orada küçük bir yazlık al'),
        requires: (c) => c.p.money >= wage(c, 15000),
        requiresLabel: 'Not enough savings',
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 15000));
          c.h.flag('tr_memleket');
          c.h.stat('happiness', 5);
          return c.t('You bought a little house with a fig tree in your hometown. Every summer the whole family descends on it.', 'Memlekette incir ağaçlı küçük bir ev aldın. Her yaz bütün aile oraya çıkarma yapıyor.');
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay in the city', 'Şehirde kal'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You stayed in the big city. Every evening you check the weather back home, like a second clock.', 'Büyük şehirde kaldın. Her akşam, saate bakar gibi memleketin hava durumuna bakıyorsun.');
        },
      },
    ],
  },
  {
    id: 'tr.madenci',
    category: 'work',
    minAge: 40,
    maxAge: 64,
    once: true,
    weight: 20,
    when: (c) => inTR(c) && (c.p.city === 'Zonguldak' || c.p.jobId === 'miner') && c.p.jailYears === 0,
    title: (c) => c.t("4 December, World Miners' Day.", '4 Aralık Dünya Madenciler Günü.'),
    text: (c) =>
      c.t(
        "The town falls silent for a minute at the miners' monument. The old miner beside you still has coal dust in the lines of his hands.",
        'Şehir, madenci anıtının önünde bir dakika susuyor. Yanındaki yaşlı madencinin avuç çizgilerinde hâlâ kömür tozu var.',
      ),
    choices: [
      {
        id: 'listen',
        label: (c) => c.t('Listen to his stories over tea', 'Çay eşliğinde anılarını dinle'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'On Miners\' Day an old miner told you about night shifts, a canary called Paşa and the friend who dug him out in 1983. "Underground," he said, "everyone is a brother (kardeş)."',
            'Madenciler Günü\'nde yaşlı bir madenci sana gece vardiyalarını, Paşa adlı kanaryayı ve onu 1983 yılında göçükten çıkaran arkadaşını anlattı. "Yerin altında herkes kardeştir" dedi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'flowers',
        label: (c) => c.t('Lay carnations at the monument', 'Anıta karanfil bırak'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You laid red carnations at the monument. Somebody had already left a miner\'s helmet lamp there, still shining.', 'Anıta kırmızı karanfiller bıraktın. Biri oraya bir baret lambası bırakmış; hâlâ yanıyor.');
        },
      },
      {
        id: 'retire',
        label: (c) =>
          c.p.jobId === 'miner'
            ? c.t("Take your miner's early retirement", 'Madenci erken emekliliğini al')
            : c.t('Take your family to the mining museum', 'Aileni maden müzesine götür'),
        resolve: (c) => {
          if (c.p.jobId === 'miner') {
            const title = c.h.jobTitle();
            c.p.retired = true;
            c.p.jobId = null;
            c.p.jobTitle = title;
            c.h.stat('happiness', 8);
            c.h.stat('health', 2);
            return c.t(
              'You took your early retirement. You still wake at 5 a.m. for a shift that no longer needs you, and make tea instead.',
              'Erken emekliliğini aldın. Hâlâ sabah beşte uyanıyorsun; seni bekleyen bir vardiya yok artık, çay demliyorsun.',
            );
          }
          c.h.stat('smarts', 2);
          closeAll(c, ['child', 'spouse'], 3);
          return c.t('On Miners\' Day you walked your family through the replica tunnel at the mining museum. Everyone went quiet in the dark.', 'Madenciler Günü\'nde ailenle maden müzesindeki temsilî galeride yürüdünüz. Karanlıkta herkes sustu.');
        },
      },
    ],
  },
  {
    id: 'tr.mine_museum',
    category: 'heirloom',
    minAge: 8,
    once: true,
    when: (c) => inTR(c) && c.p.city === 'Zonguldak' && c.h.hasHeirloom('clock'),
    text: '',
    apply: (c) => {
      const watch = c.s.dynasty.heirlooms.find((h) => h.defId === 'clock');
      c.h.stat('smarts', 2);
      c.h.stat('happiness', 3);
      if (!watch) {
        return c.t(
          'At the mining museum you found an old photo of the 1961 shift. The young miners in the front row are grinning like it is their first payday.',
          'Maden müzesinde 1961 vardiyasının eski bir fotoğrafını buldun. Ön sıradaki genç madenciler ilk maaş günüymüş gibi gülümsüyor.',
        );
      }
      return c.t(
        `At the mining museum you found an old photo of the 1961 shift. In the front row, a young man is wearing ${watch.name}.`,
        `Maden müzesinde 1961 vardiyasının eski bir fotoğrafını buldun. Ön sıradaki genç adamın üzerinde ${watch.name} var.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'tr.iftar',
    category: 'random',
    minAge: 8,
    cooldown: 4,
    when: inTR,
    title: (c) => c.t('Your neighbors invite you to iftar, the evening meal that breaks the Ramadan fast.', 'Komşular seni iftara çağırıyor.'),
    text: (c) => c.t('The whole building is coming. Somebody made thirty kinds of börek.', 'Bütün apartman orada olacak. Biri otuz çeşit börek açmış.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go, and bring dessert', 'Git, eli boş gitme: tatlı götür'),
        resolve: (c) => {
          c.h.money(-wage(c, 15));
          c.h.stat('happiness', 5);
          return say(c, 'tr.iftar.go', IFTAR_GO);
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Thank them and stay in', 'Teşekkür et, evde kal'),
        resolve: (c) => say(c, 'tr.iftar.stay', IFTAR_STAY),
      },
    ],
  },
];

const IFTAR_GO: Pair[] = [
  ["You brought güllaç (a milky rose-water dessert) and were declared everybody's favorite neighbor.", 'Güllaç götürdün ve oybirliğiyle apartmanın en sevilen komşusu ilan edildin.'],
  ['You brought a tray of baklava. The neighbor from the fourth floor took three pieces "for her husband".', 'Bir tepsi baklava götürdün. Dördüncü kattaki komşu "eşime" diye üç dilim ayırdı.'],
  ['You brought dates and sat next to the oldest neighbor, who told you how the building was built, brick by brick.', 'Hurma götürdün ve en yaşlı komşunun yanına oturdun. Sana apartmanın nasıl yapıldığını tuğla tuğla anlattı.'],
  ['You brought dessert and stayed for tea. The children set the table and set off three arguments.', 'Tatlı götürüp çaya kaldın. Çocuklar sofrayı kurdu, üç de tartışma başlattı.'],
  ['You waited with everyone for the call to prayer, forks in the air. Nobody has ever been so quiet in that building.', 'Herkesle birlikte çatallar havada ezanı bekledin. O apartmanda hiç bu kadar sessiz bir an olmamıştı.'],
  ['You brought künefe from the good place. Somebody asked for the address before saying hello.', 'İyi yerden künefe götürdün. Biri daha selam vermeden adresi sordu.'],
];
const IFTAR_STAY: Pair[] = [
  ['You stayed in. Somebody still left a plate of börek at your door.', 'Evde kaldın. Yine de biri kapına bir tabak börek bırakmış.'],
  ['You stayed in. At nine the doorbell rang: soup, pide and a note saying "afiyet olsun".', 'Evde kaldın. Saat dokuzda kapı çaldı: çorba, pide ve "Afiyet olsun" yazan bir not.'],
  ['You thanked them and stayed home. You could hear the laughter through the floor all evening.', 'Teşekkür edip evde kaldın. Bütün akşam kahkahaları döşemeden duydun.'],
  ['You stayed in. The next morning a neighbor returned your empty plate, full of cookies, from a meal you never went to.', 'Evde kaldın. Ertesi sabah bir komşu, hiç gitmediğin bir yemekten, kurabiyeyle doldurulmuş bir tabak getirdi.'],
];

/** Building-meeting topics for tr.aidat: the proposal and how each vote ends. */
type AidatPart = 'text' | 'yes' | 'won' | 'lost';
const AIDAT: Record<AidatPart, Pair>[] = [
  {
    text: ['The building manager (yönetici) wants to raise the monthly fees (aidat) for a new elevator. Flat 7 has brought a lawyer cousin.', 'Yönetici yeni asansör için aidata zam istiyor. 7 numara avukat kuzenini getirmiş.'],
    yes: ['The building meeting voted yes. The new elevator arrived eight months later and plays music.', 'Apartman toplantısında teklif geçti. Yeni asansör sekiz ay sonra geldi ve içinde müzik çalıyor.'],
    won: ['You won the elevator fight. The old elevator still groans, but it groans for free.', 'Asansör kavgasını kazandın. Eski asansör hâlâ inliyor ama bedavaya inliyor.'],
    lost: ['You lost the elevator fight after three hours and two pots of tea. You now take the stairs out of principle.', 'Apartman toplantısında üç saat ve iki demlik çaydan sonra kaybettin. Artık prensip gereği merdivenden çıkıyorsun.'],
  },
  {
    text: ['The building manager (yönetici) wants higher fees (aidat) to insulate the outside walls (mantolama). Flat 7 has brought a lawyer cousin.', 'Yönetici mantolama için aidata zam istiyor. 7 numara avukat kuzenini getirmiş.'],
    yes: ['The building was insulated and painted a colour the paint company calls "peach". The gas bill dropped.', 'Bina mantolandı ve boya firmasının "şeftali" dediği bir renge boyandı. Doğalgaz faturası düştü.'],
    won: ['You won the insulation fight. The walls stay cold, but so do the fees.', 'Mantolama kavgasını kazandın. Duvarlar soğuk kaldı ama aidat da yerinde saydı.'],
    lost: ['You lost the insulation fight after three hours and two pots of tea. The building is now peach.', 'Üç saat ve iki demlik çaydan sonra mantolama kavgasını kaybettin. Bina artık şeftali rengi.'],
  },
  {
    text: ['The building manager (yönetici) wants higher fees (aidat) for a new roof. The top floor has started a bucket collection.', 'Yönetici çatı tamiri için aidata zam istiyor. En üst kattakilerin bir kova koleksiyonu oluşmuş.'],
    yes: ['The roof was fixed. The top-floor neighbors gave their buckets away in a little ceremony.', 'Çatı yapıldı. Üst kattakiler kovalarını küçük bir törenle dağıttı.'],
    won: ['You won the roof vote. The top floor now glares at you on the stairs.', 'Çatı oylamasını kazandın. Üst kattakiler artık merdivende sana ters ters bakıyor.'],
    lost: ['You lost the roof vote after three hours. To be fair, it was raining during the meeting.', 'Üç saat sonra çatı oylamasını kaybettin. Hakkını yeme, toplantı boyunca yağmur yağıyordu.'],
  },
  {
    text: ['The building manager (yönetici) wants higher fees (aidat) for a camera intercom at the front door. Flat 3 is worried about privacy, and about flat 5.', 'Yönetici kapıya kameralı diyafon için aidata zam istiyor. 3 numara mahremiyetinden, bir de 5 numaradan endişeli.'],
    yes: ['The camera intercom went in. Its main job so far: filming the cat that sleeps on the doormat.', 'Kameralı diyafon takıldı. Şimdiye kadarki tek işi paspasta uyuyan kediyi çekmek oldu.'],
    won: ['You won the intercom vote. Visitors still shout up from the street, as is tradition.', 'Diyafon oylamasını kazandın. Misafirler gelenek olduğu üzere hâlâ sokaktan bağırıyor.'],
    lost: ['You lost the intercom vote after three hours and two pots of tea. The camera now films you taking out the rubbish.', 'Üç saat ve iki demlik çaydan sonra diyafon oylamasını kaybettin. Kamera artık seni çöp çıkarırken çekiyor.'],
  },
  {
    text: ['The building manager (yönetici) wants higher fees (aidat) to turn the garden into parking. The auntie who loves the plum tree has come too.', 'Yönetici bahçeyi otoparka çevirmek için aidata zam istiyor. Bahçedeki erik ağacını seven teyze de toplantıda.'],
    yes: ['The garden became four parking spaces. The plum tree stayed in its corner; the auntie made sure of it.', 'Bahçe dört araçlık otopark oldu. Erik ağacı köşesinde kaldı; teyze buna bizzat göz kulak oldu.'],
    won: ['You and the auntie saved the garden. She brings you plums every summer now.', 'Teyzeyle birlikte bahçeyi kurtardınız. Artık her yaz sana erik getiriyor.'],
    lost: ['You lost the garden vote after three hours. The auntie has not spoken to the manager since.', 'Üç saat sonra bahçe oylamasını kaybettin. Teyze o günden beri yöneticiyle konuşmuyor.'],
  },
];
const aidat = (c: Ctx, part: AidatPart) => {
  const [en, tr] = (AIDAT[Number(c.vars.topic)] ?? AIDAT[0])[part];
  return c.t(en, tr);
};

const KOMBI_SERVICE: Pair[] = [
  ['For the broken boiler, the technician came four days later, changed one part and charged like a surgeon. Warm, though.', 'Kombi için usta dört gün sonra geldi, tek bir parça değiştirdi, cerrah gibi para aldı. Ama ev sıcak.'],
  ['The service said "between nine and six". He came at five to six, sighed at the boiler and fixed it in ten minutes.', 'Servis "dokuzla altı arası" dedi. Usta altıya beş kala geldi, kombiye bakıp iç çekti ve on dakikada tamir etti.'],
  ['The technician said your model is "a classic", which means no spare parts. He found one anyway, for a price.', 'Usta senin kombi için "klasik model" dedi; yani yedek parça yok. Yine de buldu, fiyatıyla.'],
  ['The authorized service replaced the board and told you to bleed the radiators. You nodded as if you knew how.', 'Yetkili servis kartı değiştirdi ve peteklerin havasını almanı söyledi. Nasıl yapılacağını biliyormuş gibi başını salladın.'],
];

// ------------------------------------------------------------------ later life

const later: EventDef[] = [
  {
    id: 'tr.kahvehane',
    category: 'random',
    minAge: 45,
    cooldown: 5,
    when: inTR,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 3);
      // men at the kahvehane, women at the tea garden or the gold day: the activity's pools and memory (lines.ts)
      const [text, pays] = kahveLine(c);
      if (pays) c.h.money(-wage(c, 3));
      return text;
    },
  },
  {
    id: 'tr.ikramiye',
    category: 'money',
    minAge: 50,
    maxAge: 80,
    once: true,
    weight: 25,
    when: (c) => inTR(c) && c.p.retired,
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(8000, 20000));
    },
    title: (c) => c.t('Your retirement bonus (emeklilik ikramiyesi) has been paid.', 'Emeklilik ikramiyen yattı.'),
    text: (c) => c.t(`${c.h.fmt(Number(c.vars.amt))} landed in your account. Everyone you know has an idea.`, `Hesabına ${c.h.fmt(Number(c.vars.amt))} yattı. Tanıdığın herkesin bir fikri var.`),
    choices: [
      {
        id: 'yazlik',
        label: (c) => c.t('Buy a small summer house (yazlık) back home', 'Memlekette küçük bir yazlık al'),
        resolve: (c) => {
          c.h.money(Math.round(Number(c.vars.amt) * 0.2));
          c.h.flag('tr_memleket');
          c.h.stat('happiness', 6);
          return c.t("With your retirement bonus you bought a tiny summer house in your hometown. Relatives you've never met are already asking about August.", 'İkramiyeyle memlekette minicik bir yazlık aldın. Hiç tanımadığın akrabalar şimdiden ağustosu soruyor.');
        },
        tone: 'good',
      },
      {
        id: 'gold',
        label: (c) => c.t('Turn it into gold under the pillow', 'Altına çevir, yastık altına koy'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', 2);
          return c.t('You turned your retirement bonus into gold and hid it somewhere clever. You check on it more often than on your children.', 'İkramiyeyle altın alıp akıllıca bir yere sakladın. Ona çocuklarından daha sık bakıyorsun.');
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Share it with the family', 'Aileyle paylaş'),
        resolve: (c) => {
          c.h.money(Math.round(Number(c.vars.amt) * 0.3));
          closeAll(c, ['child', 'sibling', 'spouse'], 8);
          c.h.stat('happiness', 4);
          return c.t('You shared most of your retirement bonus with the family. They cried, then argued about who got more.', 'İkramiyenin çoğunu aileyle paylaştın. Önce ağladılar, sonra kimin daha çok aldığını tartıştılar.');
        },
      },
    ],
  },
  {
    id: 'tr.muhtar',
    category: 'milestone',
    minAge: 55,
    maxAge: 80,
    once: true,
    weight: 4,
    when: (c) => inTR(c) && c.p.jailYears === 0 && c.p.criminalRecord === 0,
    title: (c) => c.t('The neighbors want you to run for muhtar.', 'Komşular muhtarlığa aday olmanı istiyor.'),
    text: (c) =>
      c.t(
        'The muhtar is the elected head of the neighborhood: official stamps, paperwork and knowing every cat by name.',
        'Muhtar dediğin mahallenin seçilmiş büyüğü: mühür, evrak ve her kediyi adıyla bilmek.',
      ),
    choices: [
      {
        id: 'run',
        label: (c) => c.t('Run, armed with tea and a smile', 'Aday ol, çay ve güler yüzle'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.1 + c.p.stats.happiness / 500 + Math.min(4, c.h.relatives('friend').length) * 0.04)) {
            c.h.achieve('tr_muhtar');
            c.h.flag('tr_muhtar');
            c.h.stat('happiness', 8);
            return c.t(
              'You won by forty-one votes. Your first act as muhtar: a new bench under the old plane tree (çınar).',
              'Kırk bir oyla kazandın. Muhtar olarak ilk icraatın çınarın altına yeni bir bank koymak oldu.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t('You lost to the old muhtar by nine votes. He sent you a box of lokum and a seat on his council.', 'Eski muhtara dokuz oyla kaybettin. Sana bir kutu lokum ve ihtiyar heyetinde bir koltuk yolladı.');
        },
        tone: 'big',
      },
      {
        id: 'support',
        label: (c) => c.t('Back the old muhtar', 'Eski muhtarı destekle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You backed the old muhtar. He was muhtar before stamps were invented and will be after.', 'Eski muhtarı destekledin. Kendisi mühür icat edilmeden önce de muhtardı, sonra da olacak.');
        },
      },
      {
        id: 'out',
        label: (c) => c.t('Stay out of it', 'Bu işlere karışma'),
        resolve: (c) => c.t('You stayed out of it. Both candidates still bring you tea.', 'Karışmadın. İki aday da sana hâlâ çay getiriyor.'),
      },
    ],
  },
  {
    id: 'tr.asure',
    category: 'family',
    minAge: 45,
    cooldown: 8,
    when: inTR,
    title: (c) => c.t('Pots of aşure are bubbling all over the neighborhood.', 'Mahallede aşure kazanları kaynıyor.'),
    text: (c) =>
      c.t(
        'The mosque (cami) courtyard and the cemevi (the Alevi house of gathering) down the road are both cooking aşure, a grain-and-fruit pudding made to share with neighbors.',
        'Cami avlusunda da yoldaki cemevinde de aşure pişiyor; komşulara dağıtılacak.',
      ),
    choices: [
      {
        id: 'cook',
        label: (c) => c.t('Cook a pot and share it with seven houses', 'Bir tencere pişir, yedi komşuya dağıt'),
        resolve: (c) => {
          c.h.money(-wage(c, 20));
          c.h.stat('happiness', 5);
          return c.t(
            'You cooked aşure all morning and carried bowls to seven doors. No bowl comes back empty: all seven returned full of something else.',
            'Bütün sabah aşure pişirip yedi kapıya kâse taşıdın. Kap boş dönmez; yedisi de başka başka ikramlarla dolu geri geldi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'stir',
        label: (c) => c.t('Help stir the giant cauldron', 'Dev kazanın başında kepçe salla'),
        resolve: (c) => {
          c.h.stat('health', 1);
          c.h.stat('happiness', 4);
          return c.t('You stirred the giant aşure cauldron for two hours with people you had never spoken to. Now you greet each other in the street.', 'Hiç konuşmadığın insanlarla iki saat dev aşure kazanını karıştırdın. Artık sokakta selamlaşıyorsunuz.');
        },
      },
      {
        id: 'eat',
        label: (c) => c.t('Just eat, gratefully', 'Sadece afiyetle ye'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Four bowls of aşure from four houses, each one the best. The one from downstairs had the most walnuts.', 'Dört evden dört kâse aşure geldi, hepsi birbirinden güzel. En çok ceviz alt kattakindeydi.');
        },
      },
    ],
  },
  {
    id: 'tr.tavla_torun',
    category: 'family',
    minAge: 55,
    cooldown: 6,
    weight: 14,
    // a grandchild of 6 to 16 learns tavla; older saves only know a count, so fall back to a child of 30+ with kids
    when: (c) => inTR(c) && (knowsGrandkids(c) ? grandkidsAged(c, 6, 16).length > 0 : hasGrandkids(c, 30)),
    title: (c) => c.t('Your grandchild (torun) wants to learn tavla (backgammon).', 'Torunun tavla öğrenmek istiyor.'),
    text: (c) => c.t('The board is older than their parents and has seen many tea houses.', 'Tavla anne babasından yaşlı; çok kahvehane görmüş.'),
    choices: [
      {
        id: 'letwin',
        label: (c) => c.t('Let them win', 'Kazanmasına izin ver'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          closeAll(c, 'child', 2);
          return c.t('You let your grandchild win. They now challenge the whole street.', 'Torununun kazanmasına izin verdin. Artık bütün sokağa meydan okuyor.');
        },
        tone: 'good',
      },
      {
        id: 'slam',
        label: (c) => c.t('Play to win and slam the board shut', 'Acımadan oyna, tavlayı küt diye kapat'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You won five–nil and slammed the board shut. Your grandchild cried, then demanded a rematch.', 'Beş sıfır yendin ve tavlayı küt diye kapattın. Torunun ağladı, sonra rövanş istedi.');
        },
      },
      {
        id: 'names',
        label: (c) => c.t('Teach them the old Persian dice names', 'Zarların eski Farsça adlarını öğret'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 3);
          return c.t(
            'You taught them "şeş beş" (six-five), "dü şeş" (two-six) and "hep yek" (double ones). Now they shout them at every roll.',
            '"Şeş beş", "dü şeş", "hep yek"... Zarların adlarını tek tek öğrettin. Artık her atışta bağırıyor.',
          );
        },
      },
    ],
  },
  {
    id: 'tr.torun_dugun',
    category: 'family',
    minAge: 60,
    once: true,
    weight: 30,
    // the same real grandchildren as the base elder events; marryGrandkid marks the wedding so nobody marries twice
    when: (c) => inTR(c) && canMarryGrandkid(c, 22, 40),
    setup: (c) => {
      c.vars.gkName = marryGrandkid(c, 22, 40)?.n ?? '';
    },
    title: (c) =>
      c.vars.gkName
        ? c.t(`Your grandchild ${c.vars.gkName} is getting married!`, `Torunun ${c.vars.gkName} evleniyor!`)
        : c.t('Your grandchild is getting married!', 'Torunun evleniyor!'),
    text: (c) => c.t('At the gold-pinning (takı), everyone is waiting to see what the grandparent pins on.', 'Takı merasiminde herkes senin ne takacağını merak ediyor.'),
    choices: [
      {
        id: 'bilezik',
        label: (c) => c.t('Pin on a gold bracelet (bilezik)', 'Altın bilezik tak'),
        requires: (c) => c.p.money >= wage(c, 3000),
        requiresLabel: 'Not enough money',
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          c.h.achieve('tr_bilezik');
          c.h.stat('happiness', 6);
          closeAll(c, 'child', 5);
          return c.t('At your grandchild\'s wedding you pinned on a heavy gold bracelet. The host announced it twice. The other side of the family went quiet.', 'Torununun düğününde kalın bir altın bilezik taktın. Sunucu iki kez anons etti. Öbür tarafın sesi kesildi.');
        },
        tone: 'big',
      },
      {
        id: 'ceyrek',
        label: (c) => c.t('Pin on a quarter gold coin (çeyrek)', 'Bir çeyrek altın tak'),
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          c.h.stat('happiness', 3);
          return c.t('At your grandchild\'s wedding you pinned on a çeyrek and planted a kiss on both cheeks. Classic and correct.', 'Torununun düğününde bir çeyrek taktın, iki yanağından öptün. Klasik ve yerinde.');
        },
      },
      {
        id: 'halay',
        label: (c) => c.t('Lead the halay instead', 'Takı yerine halayı sen çek'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 6);
          return c.t(
            'At your grandchild\'s wedding you led the halay (a line dance), handkerchief in hand, for forty minutes. Nobody remembers who pinned what. Everyone remembers you.',
            'Torununun düğününde elinde mendil kırk dakika halay başı çektin. Kim ne taktı kimse hatırlamıyor; seni herkes hatırlıyor.',
          );
        },
        tone: 'good',
      },
    ],
  },
];

const events: EventDef[] = [...childhood, ...youth, ...love, ...adult, ...later, ...milestoneEvents];

// ------------------------------------------------------------------ activities

// Repeatable activities pick their line from lines.ts: one rng call, split by age band, and a line does not
// come back until most of its list has been seen in this dynasty. Everything here happens outside, at a
// market, on a ferry or at somebody's door, so none of it runs in prison (`jailOk: false`).

/** Women go to a tea garden or a patisserie when young and to the monthly gold day (altın günü) later; men to the kahvehane. */
const kahveLabel = (c: Ctx) =>
  c.p.gender !== 'female'
    ? c.t('Go to the tea house (kahvehane)', 'Kahvehaneye git')
    : c.age < 30
      ? c.t('Meet friends at a tea garden (çay bahçesi)', 'Çay bahçesine git')
      : c.t('Go to your gold day (altın günü)', 'Altın gününe git');

const activities: ActivityDef[] = [
  {
    id: 'tr_tea',
    label: (c) => c.t('Drink tea with the neighbors', 'Komşularla çay iç'),
    description: (c) => c.t('+Happiness, gossip', '+Mutluluk, dedikodu'),
    group: 'Family',
    minAge: 14,
    jailOk: false,
    available: inTR,
    run: (c) => {
      c.h.stat('happiness', 4);
      return teaLine(c);
    },
  },
  {
    id: 'tr_ferry',
    label: (c) => (isIstanbul(c) ? c.t('Take the Bosphorus ferry (vapur)', 'Boğaz vapuruna bin') : c.t('Take a ferry ride (vapur)', 'Vapura bin')),
    description: (c) => (isIzmir(c) ? c.t('+Happiness, feed the gulls', '+Mutluluk, martılara gevrek') : c.t('+Happiness, feed the gulls', '+Mutluluk, martılara simit')),
    group: 'Mind & Body',
    minAge: 6,
    jailOk: false,
    available: (c) => inTR(c) && (isIstanbul(c) || isIzmir(c)),
    run: (c) => {
      c.h.stat('happiness', 5);
      return isIzmir(c) ? sayBand(c, 'tr_ferry.izmir', FERRY_IZMIR) : sayBand(c, 'tr_ferry', FERRY_IST);
    },
  },
  {
    id: 'tr_kahvehane',
    label: kahveLabel,
    description: (c) => (c.p.gender === 'female' ? c.t('+Happiness, tea and gossip', '+Mutluluk, çay ve muhabbet') : c.t('+Happiness, okey and chat', '+Mutluluk, okey ve muhabbet')),
    group: 'Mind & Body',
    minAge: 18,
    jailOk: false,
    available: (c) => inTR(c) && c.p.jailYears === 0,
    run: (c) => {
      c.h.stat('happiness', 3);
      const [text, pays] = kahveLine(c);
      if (pays) c.h.money(-wage(c, 3));
      return text;
    },
  },
  {
    id: 'tr_tavla',
    label: (c) => c.t('Play tavla (backgammon)', 'Tavla oyna'),
    description: (c) => c.t('+Smarts, +Happiness', '+Zekâ, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 10,
    maxAge: 59,
    jailOk: false,
    available: inTR,
    run: (c) => {
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      return sayBand(c, 'tr_tavla', TAVLA);
    },
  },
  {
    id: 'tr_pazar',
    label: (c) => c.t('Go to the street market (pazar)', 'Semt pazarına git'),
    description: (c) => c.t('+Health, cheap tomatoes', '+Sağlık, ucuz domates'),
    group: 'Mind & Body',
    minAge: 14,
    jailOk: false,
    available: (c) => inTR(c) && c.p.jailYears === 0,
    run: (c) => {
      c.h.money(-wage(c, 10));
      c.h.stat('health', 2);
      c.h.stat('happiness', 2);
      return say(c, `tr_pazar.${bandOf(c.age)}`, pazarLines(c));
    },
  },
  {
    id: 'tr_halisaha',
    label: (c) => c.t('Play five-a-side football (halı saha)', 'Halı sahada maç yap'),
    description: (c) => c.t('+Health, +Happiness, sore knees', '+Sağlık, +Mutluluk, ağrıyan dizler'),
    group: 'Mind & Body',
    minAge: 14,
    maxAge: 55,
    jailOk: false,
    available: (c) => inTR(c) && c.p.jailYears === 0,
    run: (c) => {
      if (c.rng.chance(c.age >= 35 ? 0.2 : 0.08)) {
        c.h.stat('health', -4);
        return say(c, 'tr_halisaha.hurt', HALISAHA_HURT);
      }
      c.h.stat('health', 3);
      c.h.stat('happiness', 3);
      const b = bandOf(c.age) === 'young' ? 'young' : 'adult';
      const [en, tr, pays] = HALISAHA[b][pickIndex(c, `tr_halisaha.${b}`, HALISAHA[b].length)];
      if (pays) c.h.money(-wage(c, 5));
      return c.t(en, tr);
    },
  },
  {
    id: 'tr_bayram_tour',
    label: (c) => c.t('Make bayram visits', 'Bayram ziyaretine çık'),
    description: (c) => c.t('+Family closeness, too much tea', '+Aile bağları, fazla çay'),
    group: 'Family',
    minAge: 5,
    jailOk: false,
    available: (c) => inTR(c) && c.p.jailYears === 0 && family(c).length > 0,
    run: (c) => {
      family(c).forEach((r) => c.h.closeness(r.person.id, 3));
      c.h.stat('happiness', 2);
      if (c.age < 15) {
        const cash = wage(c, c.rng.int(5, 20));
        c.h.money(cash);
        return bayramLine(c, cash);
      }
      return bayramLine(c);
    },
  },
];

// ------------------------------------------------------------------ ribbons & goals

const ribbons: RibbonDef[] = [
  {
    id: 'mahalle_muhtari',
    name: 'Neighborhood Muhtar',
    desc: 'Was elected muhtar, the head of a Turkish neighborhood.',
    nameTr: 'Mahallenin Muhtarı',
    descTr: 'Mahallesine muhtar seçildi.',
    test: (_r, p) => p.countryId === 'tr' && p.achievements.includes('tr_muhtar'),
  },
  {
    id: 'altin_bilezik',
    name: 'Golden Bracelet',
    desc: "Pinned a gold bracelet (bilezik) on a grandchild at their wedding.",
    nameTr: 'Altın Bilezik',
    descTr: 'Torununun düğününde altın bilezik taktı.',
    test: (_r, p) => p.countryId === 'tr' && p.achievements.includes('tr_bilezik'),
  },
];

/** These goals only make sense in Türkiye; `available` keeps them out of lives elsewhere. */
const inTr = (s: GameState) => s.player.countryId === 'tr';

const goals: GoalDef[] = [
  { id: 'tr_muhtar', label: 'Get elected neighborhood muhtar', labelTr: 'Mahallene muhtar seçil', available: inTr, check: (s) => s.player.achievements.includes('tr_muhtar') },
  { id: 'tr_memleket', label: 'Move back to your hometown (memleket) or buy a summer house there', labelTr: 'Memlekete dön ya da orada bir yazlık al', available: (s) => inTr(s) && BIG_CITIES.includes(s.player.city), check: (s) => 'tr_memleket' in s.player.flags },
];

export const cultureTrPack: ContentPack = {
  id: 'culture_tr',
  title: 'Türkiye',
  description: 'Culture pack: exams, military service, henna nights, gold at weddings, bayram visits, rent hikes, the neighbor auntie and the neighborhood muhtar.',
  rating: 'all',
  // free since v0.9: lives in Türkiye are the game's home market, so this content is never sold
  entitlement: null,
  events,
  activities,
  ribbons,
  goals,
  schedule: trSchedule,
  onYear: trOnYear,
};
