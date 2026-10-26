import type { ChoiceDef, Ctx, EventDef } from '../types';
import { MAX_HIRE_AGE, aOrAn, acc, dat, eligibleJobs, familyFirstNames, nm, wage, who, wth } from './util';
import { da } from '../../i18n/tr-grammar';
import { sayWith, type Pair } from './lines';
import type { Person } from '../../engine/types';
import { firstNames } from '../../engine/world';
import { EDUCATION_RANK, titleFor, type JobDef } from '../../engine/careers';
import { MAJORS, peekCampus } from '../campus/state';
import { moveTo } from './activities-home';
import { adoptChild, adoptTone, canAdopt } from './adoption';
import { ringWeddingLine } from './heirloom-words';

// Events opened by the engine at life-stage moments or by activities. They never fire at random.

const VIBES_EN = [
  'makes you laugh until you snort',
  'is a little too into crypto',
  'brought you a flower',
  'talked about their ex for an hour',
  'knows every bird by name',
  'ordered for both of you, confidently and wrongly',
  'arrived twenty minutes early and pretended not to have',
  'showed you four hundred photos of their cat',
  'can recite a whole film from memory, and did',
  'asked good questions and actually listened to the answers',
  'is training for a marathon and mentioned it eleven times',
  'brought a board game, just in case',
  'has very strong opinions about pizza toppings',
  'laughed at the waiter\'s joke a little too long',
  'tipped like a millionaire and walked you to the door',
];
const VIBES_TR = [
  'seni kahkahadan kırıp geçiriyor',
  'kriptoya biraz fazla kafayı takmış',
  'sana bir çiçek getirdi',
  'bir saat boyunca eski sevgilisini anlattı',
  'her kuşu adıyla tanıyor',
  'ikiniz için de sipariş verdi; kendinden emin ve yanlış',
  'yirmi dakika erken gelip hiç erken gelmemiş gibi yaptı',
  'sana kedisinin dört yüz fotoğrafını gösterdi',
  'koca bir filmi ezbere biliyor ve hepsini anlattı',
  'güzel sorular sordu ve cevapları gerçekten dinledi',
  'maratona hazırlanıyor ve bunu on bir kez söyledi',
  'ne olur ne olmaz diye yanında bir kutu oyunu getirdi',
  'pizza malzemeleri hakkında çok net fikirleri var',
  'garsonun şakasına biraz fazla uzun güldü',
  'bahşişi bol keseden bıraktı ve seni kapıya kadar geçirdi',
];
const vibeTr = (en: string) => VIBES_TR[VIBES_EN.indexOf(en)] ?? en;

type DateLine = (p: Person) => Pair;
const heShe = (p: Person) => (p.gender === 'female' ? 'she' : 'he');

/** A second date said yes (playtest 2: one line, 16 dates in one life). */
const DATE_YES: DateLine[] = [
  (p) => [`You and ${p.firstName} are officially together!`, `${wth(p.firstName)} artık resmen sevgilisiniz!`],
  (p) => [`${p.firstName} said yes before you finished the question. You're a couple now.`, `${p.firstName} soruyu bitirmeni beklemeden evet dedi. Artık bir çiftsiniz.`],
  (p) => [`The second date lasted until breakfast. You and ${p.firstName} are together.`, `İkinci randevu kahvaltıya kadar sürdü. ${wth(p.firstName)} artık birliktesiniz.`],
  (p) => [`${p.firstName} texted "same time next week?" before you even got home. It's official.`, `Sen daha eve varmadan ${p.firstName} "Haftaya aynı saatte?" diye yazdı. Bu iş resmileşti.`],
  (p) => [`You and ${p.firstName} took the long way home, twice. It's a relationship now.`, `${wth(p.firstName)} eve en uzun yoldan, hem de iki kez yürüdünüz. Artık bu bir ilişki.`],
  (p) => [`${p.firstName} took you to a favourite spot by the water. By sunset you were a couple.`, `${p.firstName} seni suyun kenarındaki en sevdiği yere götürdü. Gün batarken artık sevgiliydiniz.`],
  (p) => [`Three dates later, ${p.firstName} introduced you as "my partner". You did not correct it.`, `Üç randevu sonra ${p.firstName} seni "sevgilim" diye tanıttı. Düzeltmedin.`],
  (p) => [`${p.firstName} laughed at all your jokes, even the bad one. You're officially together.`, `${p.firstName} bütün şakalarına güldü, kötü olana bile. Artık resmen birliktesiniz.`],
  (p) => [`${p.firstName} kept your umbrella "as a reason to see you again". You're together now.`, `${p.firstName} "Seni yine görmek için bir bahane" diyerek şemsiyeni bırakmadı. Artık birliktesiniz.`],
  (p) => [`${p.firstName} cooked for you on the second date. Burnt rice, perfect evening. You're a couple.`, `İkinci randevuda ${p.firstName} sana yemek yaptı. Pilav dibini tuttu ama akşam mükemmeldi. Artık sevgilisiniz.`],
  (p) => [`Your friends had a bet on how long you would stay single. Thanks to ${p.firstName}, somebody just won it.`, `Arkadaşların ne zamana kadar bekâr kalacağına iddiaya girmişti. ${p.firstName} sayesinde biri iddiayı kazandı.`],
  (p) => [`You and ${p.firstName} talked until the café stacked the chairs around you. You're together now.`, `${wth(p.firstName)} kafe sandalyeleri etrafınıza dizene kadar konuştunuz. Artık birliktesiniz.`],
];

/** A second date said no. */
const DATE_NO: DateLine[] = [
  (p) => [`${p.firstName} said it was nice, but... no.`, `${p.firstName} "Güzeldi ama... yok" dedi.`],
  (p) => [`${p.firstName} replied "haha" three days later. You know what that means.`, `${p.firstName} üç gün sonra "haha" yazdı. Ne demek olduğunu biliyorsun.`],
  (p) => [`${p.firstName} is "not looking for anything right now". A week later ${heShe(p)} was.`, `${p.firstName} "Şu an bir şey aramıyorum" dedi. Bir hafta sonra sevgilisi vardı.`],
  (p) => [`${p.firstName} thinks you'd make "great friends". Ouch.`, `${p.firstName} "Çok iyi arkadaş oluruz" dedi. Ah.`],
  (p) => [`${p.firstName} is moving abroad next month. Or so ${heShe(p)} said.`, `${p.firstName} gelecek ay yurt dışına taşınıyormuş. Öyle dedi en azından.`],
  (p) => [`${p.firstName} read your message and never answered. Classic.`, `${p.firstName} mesajını gördü ve hiç cevap vermedi. Klasik.`],
  (p) => [`${p.firstName} said no, kindly, with a long explanation you did not need.`, `${p.firstName} kibarca hayır dedi; hiç ihtiyacın olmayan uzun bir açıklamayla.`],
  (p) => [`${p.firstName} put off the second date twice, then stopped answering.`, `${p.firstName} ikinci randevuyu iki kez erteledi, sonra da cevap vermeyi bıraktı.`],
  (p) => [`${p.firstName} said yes, then no, then sent a meme. You took it as a no.`, `${p.firstName} önce evet, sonra hayır dedi, sonra da bir caps attı. Sen bunu hayır olarak aldın.`],
  (p) => [`${p.firstName} went back to an ex. You found out from a story post.`, `${p.firstName} eski sevgilisine dönmüş. Bunu bir hikâye paylaşımından öğrendin.`],
];

/** You were not into it. */
const DATE_PASS: DateLine[] = [
  (p) => [`You and ${p.firstName} split the bill and went your separate ways.`, `${wth(p.firstName)} hesabı bölüştünüz ve herkes kendi yoluna gitti.`],
  (p) => [`You faked an urgent phone call. ${p.firstName} faked believing it.`, `Acil bir telefon gelmiş gibi yaptın. ${da(p.firstName)} inanmış gibi yaptı.`],
  (p) => [`You and ${p.firstName} agreed, very politely, that there was no spark.`, `${wth(p.firstName)} çok kibar bir şekilde aranızda kıvılcım olmadığında anlaştınız.`],
  (p) => [`You said goodnight to ${p.firstName} at the bus stop and deleted the app on the way home.`, `Otobüs durağında ${dat(p.firstName)} iyi geceler dedin ve eve dönerken uygulamayı sildin.`],
  (p) => [`${p.firstName} was lovely. Lovely is not enough.`, `${p.firstName} çok tatlıydı. Ama tatlı yetmiyor.`],
  (p) => [`You left before dessert. ${p.firstName} ordered yours anyway.`, `Tatlıdan önce kalktın. ${p.firstName} seninkini de sipariş etti.`],
  (p) => [`You told ${p.firstName} you would call. You both knew.`, `${dat(p.firstName)} "Ararım" dedin. İkiniz de gerçeği biliyordunuz.`],
  (p) => [`You and ${p.firstName} ended up talking about your exes. You both texted them afterwards.`, `${wth(p.firstName)} lafı eski sevgililere getirdiniz. Sonra ikiniz de eskilere mesaj attınız.`],
  (p) => [`${p.firstName} chewed loudly. You are not proud of how much that mattered.`, `${p.firstName} şapırdatarak yiyordu. Bunun bu kadar önemli olmasından gurur duymuyorsun.`],
  (p) => [`No spark, but ${p.firstName} recommended a great book. Not a total loss.`, `Kıvılcım yoktu ama ${p.firstName} sana çok güzel bir kitap önerdi. Tamamen boşa gitmedi.`],
  (p) => [`Halfway through the starter, ${p.firstName} reminded you of your cousin. That was that.`, `Daha ara sıcakta ${p.firstName} sana kuzenini hatırlattı. Orada bitti.`],
  (p) => [`You walked ${p.firstName} to the station and shook hands. A handshake. On a date.`, `${acc(p.firstName)} istasyona kadar geçirdin ve tokalaştınız. Tokalaştınız. Randevuda.`],
];

/** Oldest age at which the job listings still answer. */
export const JOB_SEARCH_MAX_AGE = MAX_HIRE_AGE;
/** From this age nobody is hired as an intern or junior: listings start one rung up. */
export const SENIOR_HIRE_AGE = 50;

/** Entry titles that only make sense for someone starting out. */
const TRAINEE = /\b(junior|intern|apprentice|trainee|cadet|probationary|resident|academy)\b/i;

/** The rung a new hire starts on: nobody over 50 is hired as an intern, junior or apprentice. */
export const startLevel = (job: JobDef, age: number) => (age >= SENIOR_HIRE_AGE && job.titles.length > 1 && TRAINEE.test(job.titles[0]) ? 1 : 0);

/**
 * Up to three listings, best matches first: jobs in the field of the player's degree (Campus major),
 * then jobs that need the education the player has, so a medical graduate is not sent down a mine.
 */
function listings(c: Ctx): JobDef[] {
  // eligibleJobs already says no past 65, and only part-time work for school pupils
  const pool = [...eligibleJobs(c)];
  // shuffle with one rng call per job, so the count never depends on the language
  for (let i = pool.length - 1; i > 0; i--) {
    const k = c.rng.int(0, i);
    [pool[i], pool[k]] = [pool[k], pool[i]];
  }
  const major = peekCampus(c.p)?.major;
  const fields = major ? MAJORS[major].fields : [];
  const rank = EDUCATION_RANK[c.p.education];
  const tier = (j: JobDef) => (fields.includes(j.field) ? 2 : 0) + (rank >= EDUCATION_RANK.highschool && EDUCATION_RANK[j.education] >= rank ? 1 : 0);
  const sorted = [...pool].sort((a, b) => tier(b) - tier(a));
  // two best matches, plus one wildcard so there is still some variety
  const picks = sorted.slice(0, 2);
  const wild = pool.find((j) => !picks.includes(j));
  if (wild) picks.push(wild);
  return picks;
}

const jobChoice = (i: number): ChoiceDef => ({
  id: `job${i}`,
  label: (c) => (c.vars[`job${i}`] ? c.t(`${c.vars[`title${i}`]}`, `${c.vars[`titleTr${i}`] ?? c.vars[`title${i}`]}`) : '—'),
  badge: undefined,
  requires: (c) => !!c.vars[`job${i}`],
  requiresLabel: 'No opening',
  resolve: (c: Ctx) => {
    const id = String(c.vars[`job${i}`]);
    const chance = 0.35 + c.p.stats.smarts / 250 + c.p.stats.looks / 500 - (c.p.criminalRecord > 0 ? 0.2 : 0);
    if (c.rng.chance(chance)) {
      c.h.setJob(id);
      const job = c.h.job();
      if (job && startLevel(job, c.age) > 0) {
        c.p.jobLevel = startLevel(job, c.age);
        c.p.jobTitle = c.h.jobTitle();
      }
      c.h.stat('happiness', 6);
      return c.t(`You got the job! You are now ${aOrAn(c.h.jobTitle() ?? '')}.`, `İşi kaptın! Artık ${c.h.jobTitle()} olarak çalışıyorsun.`);
    }
    c.h.stat('happiness', -3);
    return c.t(
      `You interviewed for ${c.vars[`title${i}`]} but they went with someone else.`,
      `${c.vars[`titleTr${i}`] ?? c.vars[`title${i}`]} pozisyonu için mülakata girdin ama başkasını seçtiler.`,
    );
  },
});

const nameChoice = (i: number): ChoiceDef => ({
  id: `name${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const gender = c.vars.gender === 'female' ? 'female' : 'male';
    // "Gen N has arrived" only for the first child; later babies join it (playtest 2)
    const earlier = c.p.relations.filter((r) => r.kind === 'child').map((r) => c.h.person(r.personId)).filter(Boolean);
    const sameSex = earlier.some((k) => k.gender === gender);
    const baby = c.h.newPerson({ age: 0, gender, lastName: c.p.lastName });
    baby.firstName = String(c.vars[`name${i}`]);
    const other = c.h.partner();
    if (other) baby.coParentId = other.person.id;
    c.h.addRelation(baby, 'child', 90);
    c.h.stat('happiness', 12);
    c.h.achieve('parent');
    const n = baby.firstName;
    const g = c.s.dynasty.generation + 1;
    const fam = c.s.dynasty.familyName;
    const f = gender === 'female';
    // cousins born first already started that generation (playtest 3: a baby and its cousins were all "the first")
    const cousins = c.p.relations.some((r) => r.kind === 'sibling' && (c.h.person(r.personId)?.childIds?.length ?? 0) > 0);
    if (!earlier.length)
      return cousins
        ? c.t(
            `You had a baby ${f ? 'girl' : 'boy'}, ${n}! ${f ? 'She' : 'He'} joins ${f ? 'her' : 'his'} cousins in Gen ${g} of the ${fam} family.`,
            `${f ? 'Bir kızın' : 'Bir oğlun'} oldu: ${n}! Kuzenleriyle birlikte ${fam} ailesinin ${g}. kuşağına katıldı.`,
          )
        : c.t(
            `You had a baby ${f ? 'girl' : 'boy'}, ${n}! Gen ${g} of the ${fam} family has arrived.`,
            `${f ? 'Bir kızın' : 'Bir oğlun'} oldu: ${n}! ${fam} ailesinin ${g}. kuşağı dünyaya geldi.`,
          );
    return sameSex
      ? c.t(`Another baby ${f ? 'girl' : 'boy'}: ${n}! One more little ${fam}.`, `${f ? 'Bir kızın' : 'Bir oğlun'} daha oldu: ${n}! ${fam} ailesinin ${g}. kuşağına ${f ? 'bir kız' : 'bir oğlan'} daha katıldı.`)
      : c.t(`It's a ${f ? 'girl' : 'boy'} this time: ${n}! Another little ${fam}.`, `Bu sefer ${f ? 'bir kızın' : 'bir oğlun'} oldu: ${n}! ${fam} ailesinin ${g}. kuşağına ilk ${f ? 'kız' : 'oğlan'} katıldı.`);
  },
  tone: 'big',
});

export const scheduledEvents: EventDef[] = [
  {
    id: 'base.after_highschool',
    category: 'milestone',
    scheduled: true,
    title: (c) => c.t('High school is over. What now?', 'Lise bitti. Şimdi ne olacak?'),
    text: (c) =>
      c.t(
        'Everyone has an opinion about your future. Especially your relatives.',
        'Geleceğin hakkında herkesin bir fikri var. Özellikle de akrabaların.',
      ),
    choices: [
      {
        id: 'uni',
        label: (c) => c.t('Go to university', 'Üniversiteye git'),
        badge: undefined,
        resolve: (c) => {
          c.p.school = 'university';
          c.p.schoolYears = 0;
          if (c.p.stats.smarts >= 80 || c.h.has('scholarship')) {
            c.h.flag('scholarship');
            return c.t('You got into university with a full scholarship!', 'Üniversiteyi tam bursla kazandın!');
          }
          return c.t('You enrolled at university. Tuition is not cheap.', 'Üniversiteye kaydoldun. Harçlar hiç ucuz değil.');
        },
        tone: 'good',
      },
      {
        id: 'work',
        label: (c) => c.t('Start working', 'Çalışmaya başla'),
        resolve: (c) => c.t('You decided to start working. Time to find a job.', 'Çalışmaya karar verdin. İş bulma vakti.'),
      },
      {
        id: 'gap',
        label: (c) => c.t('Take a gap year and travel', 'Bir yıl ara ver ve gez'),
        resolve: (c) => {
          c.h.money(-wage(c, 2500));
          c.h.stat('happiness', 10);
          c.h.stat('smarts', 2);
          return c.t(
            'You backpacked across the continent and came back with a tan and a philosophy.',
            'Sırt çantanla kıtayı boydan boya gezdin, bronz bir ten ve bir hayat felsefesiyle döndün.',
          );
        },
      },
    ],
  },
  {
    id: 'base.retirement',
    category: 'work',
    scheduled: true,
    title: (c) =>
      c.t('You are 65. Your company offers you a retirement party.', '65 yaşındasın. Şirketin sana emeklilik partisi veriyor.'),
    text: (c) =>
      c.t(
        `After ${c.p.jobYears} years, your colleagues have already bought the cake.`,
        `${c.p.jobYears} yılın ardından iş arkadaşların pastayı çoktan almış bile.`,
      ),
    choices: [
      {
        id: 'retire',
        label: (c) => c.t('Retire', 'Emekli ol'),
        resolve: (c) => {
          c.p.retired = true;
          const title = c.h.jobTitle();
          c.p.jobId = null;
          c.p.jobTitle = title;
          c.h.stat('happiness', 10);
          return c.t(
            `You retired as ${title}. The cake was lemon. You hate lemon.`,
            `${title} olarak emekli oldun. Pasta limonluydu. Limondan nefret edersin.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep working', 'Çalışmaya devam et'),
        resolve: (c) =>
          c.t(
            'You told them to eat the cake without you. You have work to do.',
            'Pastayı sensiz yemelerini söyledin. Daha yapacak işin var.',
          ),
      },
    ],
  },
  {
    id: 'base.job_search',
    category: 'work',
    scheduled: true,
    setup: (c) => {
      listings(c).forEach((j, i) => {
        const level = startLevel(j, c.age);
        c.vars[`job${i}`] = j.id;
        c.vars[`title${i}`] = titleFor(j, level, 'en');
        c.vars[`titleTr${i}`] = titleFor(j, level, 'tr');
      });
    },
    title: (c) => c.t('Job listings this week', 'Bu haftanın iş ilanları'),
    text: (c) =>
      c.vars.job0
        ? c.t('Pick one to apply for.', 'Başvurmak için birini seç.')
        : c.age > JOB_SEARCH_MAX_AGE
          ? c.t('The listings want "young, dynamic team players". You have earned your rest.', 'İlanlar "genç ve dinamik ekip arkadaşları" arıyor. Sen dinlenmeyi hak ettin.')
          : c.t('Nothing matches your education right now.', 'Şu an eğitimine uygun bir ilan yok.'),
    choices: [
      jobChoice(0),
      jobChoice(1),
      jobChoice(2),
      { id: 'none', label: (c) => c.t('Keep looking later', 'Sonra yine bakarsın'), resolve: () => '' },
    ],
  },
  {
    id: 'base.date_match',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      const g = c.p.gender === 'female' ? 'male' : 'female';
      c.vars.pid = c.h.newPerson({ gender: g, age: Math.max(18, c.age + c.rng.int(-5, 5)) }).id;
      c.vars.vibe = c.rng.pick(VIBES_EN);
    },
    title: (c) => c.t(`You went on a date with ${nm(c)}.`, `${wth(nm(c))} randevuya çıktın.`),
    text: (c) => c.t(`${nm(c)} ${c.vars.vibe}.`, `${nm(c)} ${vibeTr(String(c.vars.vibe))}.`),
    choices: [
      {
        id: 'again',
        label: (c) => c.t('Ask for a second date', 'İkinci randevu iste'),
        resolve: (c) => {
          const them = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.3 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(them, 'partner', c.rng.int(55, 80));
            c.h.stat('happiness', 8);
            return sayWith(c, 'date.yes', DATE_YES, them);
          }
          c.h.stat('happiness', -4);
          return sayWith(c, 'date.no', DATE_NO, them);
        },
        // a yes is good news; a rejection is not (playtest 3: "went back to an ex" shown in green)
        tone: (c) => (c.p.relations.some((r) => r.personId === String(c.vars.pid) && r.kind === 'partner') ? 'good' : 'bad'),
      },
      {
        id: 'no',
        label: (c) => c.t('Not my type', 'Bana göre değil'),
        resolve: (c) => sayWith(c, 'date.pass', DATE_PASS, who(c)),
      },
    ],
  },
  {
    id: 'base.proposal',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = c.h.relatives('partner')[0].person.id;
    },
    title: (c) => c.t(`You are about to propose to ${nm(c)}.`, `${nm(c)} için diz çökmek üzeresin.`),
    text: (c) => c.t('Your hands are shaking.', 'Ellerin titriyor.'),
    choices: [
      {
        id: 'grand',
        label: (c) => c.t('A big romantic gesture', 'Büyük, romantik bir sürpriz'),
        badge: 'Costs more',
        resolve: (c) => propose(c, 0.15, wage(c, 3000)),
      },
      { id: 'simple', label: (c) => c.t('A quiet dinner at home', 'Evde sakin bir akşam yemeği'), resolve: (c) => propose(c, 0, wage(c, 200)) },
    ],
  },
  {
    id: 'base.baby_name',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      const g = c.rng.chance(0.5) ? 'female' : 'male';
      c.vars.gender = g;
      // never offer a name someone in the family already has (a parent, a sibling, an earlier child, a grandchild...)
      const taken = familyFirstNames(c);
      const all = firstNames(c.p.countryId, g);
      const free = all.filter((n) => !taken.has(n));
      const pool = free.length >= 3 ? [...free] : [...free, ...all.filter((n) => !free.includes(n))];
      for (let i = 0; i < 3; i++) {
        const k = c.rng.int(i, pool.length - 1);
        [pool[i], pool[k]] = [pool[k], pool[i]];
        c.vars[`name${i}`] = pool[i];
      }
    },
    title: (c) =>
      c.t(
        `It's a ${c.vars.gender === 'female' ? 'girl' : 'boy'}! What will you name your baby?`,
        `Müjde, ${c.vars.gender === 'female' ? 'kız' : 'oğlan'}! Bebeğine hangi ismi koyacaksın?`,
      ),
    text: (c) => c.t('The nurse is waiting with a pen.', 'Hemşire elinde kalemle bekliyor.'),
    choices: [nameChoice(0), nameChoice(1), nameChoice(2)],
  },
  {
    // opened by the engine once, between 35 and 45, for a player without children (playtest 2: 12% of lives end
    // the dynasty without a word). A nudge, never a push: every answer is a fine answer.
    id: 'base.family_name',
    category: 'family',
    scheduled: true,
    title: (c) => c.t(`Who will carry on the ${c.s.dynasty.familyName} name?`, `${c.s.dynasty.familyName} adını kim yaşatacak?`),
    text: (c) => {
      const item = c.s.dynasty.heirlooms[0]?.name;
      return item
        ? c.t(
            `At a family dinner your aunt asked it again, this time looking straight at the family heirloom: ${item}.`,
            `Bir aile yemeğinde halan aynı soruyu yine sordu. Bu sefer gözü doğrudan aile yadigârındaydı: ${item}.`,
          )
        : c.t('At a family dinner your aunt asked it again, between the soup and the main course.', 'Bir aile yemeğinde halan aynı soruyu yine sordu, çorbayla ana yemek arasında.');
    },
    choices: [
      {
        id: 'talk',
        label: (c) =>
          c.h.partner()?.rel.kind === 'spouse'
            ? c.t(`Talk it over with your ${c.h.partner()!.person.gender === 'female' ? 'wife' : 'husband'}`, 'Eşinle konuş')
            : c.t('Talk it over with your partner', 'Sevgilinle konuş'),
        requires: (c) => !!c.h.partner(),
        resolve: (c) => {
          const p = c.h.partner()!;
          c.h.closeness(p.person.id, 6);
          c.h.stat('happiness', 3);
          c.h.flag('family_talk');
          return c.t(
            `You and ${p.person.firstName} talked until midnight. Nothing was decided, and everything felt possible.`,
            `${wth(p.person.firstName)} gece yarısına kadar konuştunuz. Hiçbir şeye karar vermediniz ama her şey mümkün görünüyordu.`,
          );
        },
        tone: 'good',
      },
      {
        // a real way to start a family, not only something to read about (playtest 3 §2.11)
        id: 'adopt',
        label: (c) => c.t('Start the adoption papers', 'Evlat edinme başvurusu yap'),
        badge: 'Big change',
        requires: (c) => canAdopt(c) && c.p.money >= wage(c, 2500),
        requiresLabel: 'Not enough money',
        resolve: (c) => adoptChild(c, c.p.money < wage(c, 6000)),
        tone: adoptTone,
      },
      {
        id: 'think',
        label: (c) => c.t('Read about adoption at 2 a.m.', 'Gece ikide evlat edinmeyi araştır'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.flag('family_talk');
          return c.t(
            'You read about adoption until the screen dimmed. A family can start in more than one way.',
            'Ekran kararana kadar evlat edinme üzerine okudun. Bir aile birden fazla yoldan kurulabilir.',
          );
        },
      },
      {
        id: 'fine',
        label: (c) => c.t('The name will be fine', 'O isim yaşar, merak etme'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You told your aunt the ${c.s.dynasty.familyName} name is doing very well in the phone book. She laughed despite herself.`,
            `Halana, ${c.s.dynasty.familyName} adının telefon rehberinde gayet iyi yaşadığını söyledin. Kendini tutamayıp güldü.`,
          );
        },
      },
    ],
  },
  {
    // opened by the engine when debt that the home cannot cover grows past about 1.5 years of living costs
    id: 'base.debt_letter',
    category: 'money',
    scheduled: true,
    title: (c) => c.t('A letter from the bank, in red ink', 'Bankadan kırmızı mürekkepli bir mektup'),
    text: (c) =>
      c.t(
        `You owe ${c.h.fmt(-c.p.money)}, and the interest grows every month. The letter uses the word "final" twice.`,
        `Toplam borcun ${c.h.fmt(-c.p.money)} ve faizi her ay büyüyor. Mektupta "son ihtar" lafı iki kez geçiyor.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell the house and rent', 'Evi sat, kiraya geç'),
        badge: 'Big change',
        requires: (c) => c.p.home.owned && c.p.home.value > 0,
        resolve: (c) => {
          c.h.stat('happiness', -6);
          return `${moveTo(c, 'flat', 'rent')} ${c.t('The bank sent a thank-you letter. In black ink.', 'Banka bir teşekkür mektubu gönderdi. Bu sefer siyah mürekkeple.')}`;
        },
        tone: 'big',
      },
      {
        id: 'plan',
        label: (c) => c.t('Agree a repayment plan', 'Ödeme planı yap'),
        resolve: (c) => {
          c.h.flag('debt_plan');
          c.h.stat('happiness', -4);
          return c.t(
            'Fewer takeaways, no holidays and a spreadsheet stuck to the fridge. Slowly, the number shrinks.',
            'Daha az paket servis, sıfır tatil ve buzdolabına yapışık bir tablo. Rakam yavaş yavaş küçülüyor.',
          );
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Ask family for help', 'Aileden yardım iste'),
        requires: (c) => c.h.relatives(['mother', 'father', 'sibling', 'child']).some((r) => r.rel.closeness >= 50 && c.h.ageOf(r.person) >= 25),
        resolve: (c) => {
          const helpers = c.h.relatives(['mother', 'father', 'sibling', 'child']).filter((r) => r.rel.closeness >= 50 && c.h.ageOf(r.person) >= 25);
          const r = helpers[c.rng.int(0, helpers.length - 1)];
          const gift = wage(c, c.rng.int(3, 12) * 1000);
          c.h.money(gift);
          c.h.closeness(r.person.id, -8);
          c.h.stat('happiness', -2);
          return c.t(
            `${r.person.firstName} sent ${c.h.fmt(gift)} and a long lecture. You read the lecture twice.`,
            `${r.person.firstName} ${c.h.fmt(gift)} gönderdi, yanında da uzun bir nasihat. Nasihati iki kez okudun.`,
          );
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Put it in a drawer', 'Çekmeceye kaldır'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          c.h.stat('health', -2);
          return c.t('Out of sight. Not out of mind: you dreamt about the red ink.', 'Gözden ırak ama gönülden değil: rüyanda kırmızı mürekkep gördün.');
        },
        tone: 'bad',
      },
    ],
  },
];

function propose(c: Ctx, bonus: number, cost: number): string {
  const pid = String(c.vars.pid);
  const rel = c.p.relations.find((r) => r.personId === pid)!;
  c.h.money(-cost);
  if (c.rng.chance(rel.closeness / 100 + 0.15 + bonus)) {
    c.h.setKind(pid, 'spouse');
    c.h.stat('happiness', 12);
    c.h.achieve('married');
    let line = c.t(`${nm(c)} said yes! You got married.`, `${nm(c)} evet dedi! Evlendiniz.`);
    if (c.h.hasHeirloom('ring')) {
      const ring = c.s.dynasty.heirlooms.find((x) => x.defId === 'ring')!;
      c.h.closeness(pid, 15);
      // the ring's moment belongs to the first wedding of this life; a second marriage gets the plain line
      if (!c.h.has('ring_wedding')) {
        c.h.flag('ring_wedding');
        line = c.t(`${nm(c)} said yes! `, `${nm(c)} evet dedi! `) + ringWeddingLine(c, ring, nm(c));
      }
    }
    return line;
  }
  c.h.closeness(pid, -15);
  c.h.stat('happiness', -12);
  return c.t(
    `${nm(c)} said "I need more time." The dessert went uneaten.`,
    `${nm(c)} "Biraz daha zamana ihtiyacım var" dedi. Tatlıya kimse dokunmadı.`,
  );
}
