import type { ChoiceDef, Ctx, EventDef } from '../types';
import { MAX_HIRE_AGE, aOrAn, acc, dat, eligibleJobs, familyFirstNames, gen, nm, wage, who, wth } from './util';
import { da } from '../../i18n/tr-grammar';
import { say, sayWith, type Pair } from './lines';
import type { Gender, Person } from '../../engine/types';
import { furniture as furnitureItem } from '../../engine/home';
import { tuitionFor } from '../../engine/economy';
import { atParents, inTr } from './events-flavour';
import { firstNames } from '../../engine/world';
import { EDUCATION_RANK, titleFor, type JobDef } from '../../engine/careers';
import { MAJORS, peekCampus } from '../campus/state';
import { moveTo } from './activities-home';
import { homeEquity } from '../../engine/economy';
import { adoptChild, adoptTone, canAdopt } from './adoption';
import { ringWeddingLine } from './heirloom-words';
import { retirementScene } from './career-helpers';

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
  'pizza malzemeleri konusunda çok net fikirlere sahip',
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
  (p) => [`You and ${p.firstName} agreed, very politely, that there was no spark.`, `${wth(p.firstName)} çok kibar bir şekilde aranızda kıvılcım olmadığı konusunda anlaştınız.`],
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
  hidden: (c) => !c.vars[`job${i}`],
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
    c.h.unflag('trying'); // a couple that was trying has its baby; the next one is a new decision
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

// ------------------------------------------------------------------ life nudges (round 4, review items 3 and 7)
// The engine opens these at life-stage moments (game.ts lifeNudge) so a player who never opens the Love tab still
// meets someone, still gets asked about children and is told plainly when there is no heir. Every answer is fine:
// nothing here marries anyone off or forces a child.

/**
 * Gender of the people the player is set up with: `p.ext.dating` = 'same' | 'any', otherwise the opposite gender.
 * The systems agent owns the setting itself; dates and set-ups read it here.
 */
export function dateGender(c: Ctx): Gender {
  const pref = c.p.ext?.dating;
  const other: Gender = c.p.gender === 'female' ? 'male' : 'female';
  if (pref === 'same') return c.p.gender;
  if (pref === 'any') return c.rng.chance(0.5) ? other : c.p.gender;
  return other;
}

/** Age of whoever would carry the baby (the player or the partner), or null when neither can. */
export function motherAge(c: Ctx): number | null {
  const p = c.h.partner();
  if (!p) return null;
  if (c.p.gender === 'female') return c.age;
  if (p.person.gender === 'female') return c.h.ageOf(p.person);
  return null;
}

/** Years between births: a couple with a child younger than this does not try again yet (review item 7). */
export const BABY_GAP = 2;

/** Age of the youngest child, or Infinity without children. */
export function youngestChildAge(c: Ctx): number {
  const kids = c.h.relatives('child');
  return kids.length ? Math.min(...kids.map((k) => c.h.ageOf(k.person))) : Infinity;
}

/** A couple who could have a baby now: a partner, a mother-to-be of 18–45, out of prison. */
export function canHaveBaby(c: Ctx): boolean {
  const a = motherAge(c);
  return a !== null && a >= 18 && a <= 45 && c.p.jailYears === 0;
}

/**
 * Chance of a baby in a year of trying (review item 7: "try for a baby" worked almost every year, even in debt;
 * one life had 13 children). Falls with the mother's age, with every child already born and a little with debt,
 * and is zero for BABY_GAP years after a birth. No RNG.
 */
export function babyOdds(c: Ctx): number {
  const a = motherAge(c);
  if (a === null || a > 45 || c.p.jailYears > 0) return 0;
  if (youngestChildAge(c) < BABY_GAP) return 0;
  let odds = a < 30 ? 0.5 : a < 35 ? 0.4 : a < 38 ? 0.28 : a < 41 ? 0.15 : 0.05;
  const kids = c.h.relatives('child').length;
  odds *= Math.max(0.25, 1 - 0.18 * kids);
  if (c.p.money < 0) odds *= 0.8;
  return odds;
}

/** How a set-up date comes about; index stored in c.vars.how. The Turkish aunt's candidate is a Türkiye classic. */
const SETUP_HOW: { title: (n: string) => Pair; text: Pair }[] = [
  {
    title: (n) => [`A friend wants you to meet ${n}`, `Bir arkadaşın seni ${wth(n)} tanıştırmak istiyor`],
    text: ['"Just one coffee," your friend says. "Trust me." You have heard that before.', '"Sadece bir kahve," diyor arkadaşın. "Bana güven." Bunu daha önce de duymuştun.'],
  },
  {
    title: (n) => [`You were seated next to ${n} at a wedding`, `Bir düğünde ${gen(n)} yanına oturtuldun`],
    text: ['The seating plan was clearly someone\'s plan. The two of you have been talking since the soup.', 'Oturma planını belli ki biri bilerek yapmış. Çorbadan beri konuşuyorsunuz.'],
  },
  {
    title: (n) => [`A dating app matched you with ${n}`, `Bir tanışma uygulaması seni ${wth(n)} eşleştirdi`],
    text: ['Ninety-four percent compatible, the app says. The app also thinks you like jazz.', 'Uygulamaya göre yüzde doksan dört uyumlusunuz. Uygulama ayrıca caz sevdiğini sanıyor.'],
  },
  {
    title: (n) => [`${n} from the gym asked you out`, `Spor salonundan ${n} sana çıkma teklif etti`],
    text: ['Six months of nodding at each other by the water fountain. Today it turned into words.', 'Altı aydır su sebilinin başında birbirinize başınızla selam veriyordunuz. Bugün söze döküldü.'],
  },
];
/** Türkiye only: the aunt who knows "a very decent young person". */
const SETUP_AUNT = {
  title: (n: string): Pair => [`Your aunt knows someone: ${n}`, `Teyzenin bir adayı var: ${n}`],
  text: ['"Very decent family, a good job, and such manners," says your aunt, and shows you a photo from a cousin\'s engagement.', '"Çok terbiyeli, ailesi düzgün, işi gücü yerinde," diyor teyzen ve bir kuzenin nişanından çekilmiş bir fotoğraf gösteriyor.'] as Pair,
};
const setupHow = (c: Ctx) => (c.vars.how === 'aunt' ? SETUP_AUNT : SETUP_HOW[Number(c.vars.how) || 0]);

const SETUP_LATER: DateLine[] = [
  (p) => [`You told ${p.firstName} "maybe another time". ${p.firstName} said the same, more politely.`, `${dat(p.firstName)} "Belki başka zaman" dedin. ${p.firstName} de aynısını, daha kibarca söyledi.`],
  (p) => [`You were not ready. ${p.firstName} took it well and kept the number, just in case.`, `Hazır değildin. ${p.firstName} bunu olgunlukla karşıladı ve ne olur ne olmaz diye numaranı sakladı.`],
  (p) => [`You let it go. Some evenings you still wonder about ${p.firstName}.`, `Üstüne gitmedin. Bazı akşamlar hâlâ ${p.firstName} aklına geliyor.`],
];

const SINGLE_LINES: Pair[] = [
  ['You told everyone you are happy single, and meant it. Your weekends remain entirely your own.', 'Herkese bekârlıktan memnun olduğunu söyledin ve bunu gerçekten kastettin. Hafta sonların tamamen sana ait.'],
  ['"Single life is the good life," you announced at dinner. Nobody tried to set you up again.', 'Akşam yemeğinde "Bekârlık sultanlıktır" diye ilan ettin. Kimse seni bir daha kimseyle tanıştırmaya kalkmadı.'],
];

const TOGETHER_WAIT: DateLine[] = [
  (p) => [`You said you like things as they are. ${p.firstName} said "fine" in the way that means "we will talk again".`, `İşlerin böyle iyi olduğunu söyledin. ${p.firstName} "Peki" dedi; "yine konuşacağız" anlamında bir peki.`],
  (p) => [`You changed the subject to dinner. ${p.firstName} let you, this time.`, `Lafı akşam yemeğine getirdin. ${p.firstName} bu sefer üstelemedi.`],
];

const TRY_LINES: ((n: string) => Pair)[] = [
  (n) => [`You and ${n} decided to try for a baby. The spare room is already being measured.`, `${wth(n)} bebek için denemeye karar verdiniz. Boş oda şimdiden ölçülüyor.`],
  (n) => [`You and ${n} agreed: it is time. ${n} bought a baby-names book the same afternoon.`, `${wth(n)} karar verdiniz: zamanı geldi. ${n} aynı öğleden sonra bir bebek isimleri kitabı aldı.`],
  (n) => [`You told ${n} yes. The whole family knew within a day, somehow.`, `${dat(n)} evet dedin. Bütün aile bir gün içinde duydu; nasıl, kimse bilmiyor.`],
];

const KIDS_LATER: ((n: string) => Pair)[] = [
  (n) => [`You and ${n} decided "not yet". The question will keep.`, `${wth(n)} "Henüz değil" dediniz. Soru bir yere kaçmıyor.`],
  (n) => [`Not now, you both said. ${n} looked relieved, then a little sad, then relieved again.`, `"Şimdi değil" dediniz. ${n} önce rahatladı, sonra biraz hüzünlendi, sonra yine rahatladı.`],
];

const KIDS_ENOUGH: ((n: string) => Pair)[] = [
  (n) => [`You and ${n} agreed the family is complete as it is. You gave the cot to the neighbours.`, `${wth(n)} ailenin bu hâliyle tamam olduğuna karar verdiniz. Beşiği komşulara verdiniz.`],
  (n) => [`"We are enough," ${n} said, and you both meant it.`, `${n} "Biz bize yeteriz" dedi; ikiniz de bunu içtenlikle söylüyordunuz.`],
];

/** Children of the player's brothers and sisters who are still alive (the heirs of a childless life). */
const livingNiblings = (c: Ctx): Person[] =>
  c.h
    .relatives('sibling')
    .flatMap((r) => (r.person.childIds ?? []).map((id) => c.s.people[id]))
    .filter((q): q is Person => !!q && q.deathYear === undefined);

const NUDGE_EVENTS: EventDef[] = [
  {
    // help from family (review item 6: no way out of debt): an adult child helps a parent, or parents help a child.
    // Opened by the engine (game.ts lifeNudge); no choice, the family just does it.
    id: 'base.family_bailout',
    category: 'money',
    scheduled: true,
    when: (c) => c.p.money < 0 && bailoutHelpers(c).length > 0,
    text: '',
    apply: (c) => {
      const helpers = bailoutHelpers(c);
      if (!helpers.length) return c.t('Nobody could help this year.', 'Bu yıl kimse yardım edemedi.');
      const r = helpers[c.rng.int(0, helpers.length - 1)];
      const debt = Math.max(0, -c.p.money);
      const gift = Math.min(debt, Math.round(wage(c, 17000) * (0.5 + c.rng.next())));
      c.h.money(gift);
      c.h.closeness(r.person.id, 4);
      const n = r.person.firstName;
      const i = c.rng.int(0, 2);
      if (r.rel.kind === 'child') {
        const lines: Pair[] = [
          [`${n} found out about the debt and paid ${c.h.fmt(gift)} of it without asking. "You raised me. Let me."`, `${n} borcunu öğrendi ve sana sormadan ${c.h.fmt(gift)} ödedi. "Sen beni büyüttün, bırak ben de bir şey yapayım."`],
          [`${n} sat you down with a spreadsheet and a transfer of ${c.h.fmt(gift)}. The roles have reversed.`, `${n} karşına bir tabloyla oturdu ve hesabına ${c.h.fmt(gift)} yatırdı. Roller değişti.`],
          [`An envelope from ${n}: ${c.h.fmt(gift)} and a note that says "No arguments."`, `${n} bir zarf bıraktı: içinde ${c.h.fmt(gift)} ve "İtiraz istemiyorum" yazan bir not.`],
        ];
        return c.t(lines[i][0], lines[i][1]);
      }
      const lines: Pair[] = [
        [`${n} quietly paid ${c.h.fmt(gift)} of your debt. At Sunday lunch nobody mentioned it, which was the kindest part.`, `${n} borcunun ${c.h.fmt(gift)} kadarını sessizce ödedi. Pazar kahvaltısında kimse lafını etmedi; asıl incelik buydu.`],
        [`${n} sent ${c.h.fmt(gift)} "for the bank", with strict orders to cook properly from now on.`, `${n} "bankaya" diye ${c.h.fmt(gift)} gönderdi; artık düzgün yemek yapman şartıyla.`],
        [`${n} sold the old car and gave you ${c.h.fmt(gift)}. "I never drove it anyway."`, `${n} eski arabayı satıp sana ${c.h.fmt(gift)} verdi. "Zaten hiç binmiyordum."`],
      ];
      return c.t(lines[i][0], lines[i][1]);
    },
    tone: 'good',
  },
  {
    // a set-up date for a single player of 20–34 (review item 3: a passive first life never met anyone)
    id: 'base.nudge_date',
    category: 'love',
    scheduled: true,
    when: (c) => !c.h.partner(),
    setup: (c) => {
      const tr = inTr(c);
      const i = c.rng.int(0, SETUP_HOW.length - (tr ? 0 : 1));
      c.vars.how = i >= SETUP_HOW.length ? 'aunt' : i;
      c.vars.pid = c.h.newPerson({ gender: dateGender(c), age: Math.max(18, c.age + c.rng.int(-4, 4)) }).id;
    },
    title: (c) => {
      const [en, tr] = setupHow(c).title(nm(c));
      return c.t(en, tr);
    },
    text: (c) => c.t(setupHow(c).text[0], setupHow(c).text[1]),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Give it a chance', 'Bir şans ver'),
        resolve: (c) => {
          const them = who(c);
          if (c.rng.chance(0.45 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(them, 'partner', c.rng.int(55, 80));
            c.h.stat('happiness', 8);
            return sayWith(c, 'date.yes', DATE_YES, them);
          }
          c.h.stat('happiness', -3);
          return sayWith(c, 'date.no', DATE_NO, them);
        },
        tone: (c) => (c.p.relations.some((r) => r.personId === String(c.vars.pid) && r.kind === 'partner') ? 'good' : 'bad'),
      },
      {
        id: 'later',
        label: (c) => c.t('Not now', 'Şimdi olmaz'),
        resolve: (c) => sayWith(c, 'nudge.later', SETUP_LATER, who(c)),
      },
      {
        id: 'single',
        label: (c) => c.t("I'm happy single", 'Bekârlık sultanlıktır'),
        resolve: (c) => {
          c.h.flag('single_by_choice');
          c.h.stat('happiness', 3);
          return say(c, 'nudge.single', SINGLE_LINES);
        },
      },
    ],
  },
  {
    // two years together: propose, move in, or leave it be
    id: 'base.nudge_together',
    category: 'love',
    scheduled: true,
    when: (c) => c.h.relatives('partner').length > 0,
    setup: (c) => {
      c.vars.pid = c.h.relatives('partner')[0].person.id;
    },
    title: (c) => c.t(`${nm(c)} asks where this is going`, `${nm(c)} "Biz neyiz?" diye sordu`),
    text: (c) =>
      c.t(
        `${c.s.year - (c.p.relations.find((r) => r.personId === String(c.vars.pid))?.sinceYear ?? c.s.year)} years together. The toothbrush at your place has turned into a question.`,
        `${c.s.year - (c.p.relations.find((r) => r.personId === String(c.vars.pid))?.sinceYear ?? c.s.year)} yıldır birliktesiniz. Evindeki diş fırçası artık bir soru işareti.`,
      ),
    choices: [
      {
        id: 'propose',
        label: (c) => c.t('Propose', 'Evlenme teklif et'),
        badge: 'Big change',
        resolve: (c) => propose(c, 0.1, wage(c, 400)),
        tone: (c) => (c.p.relations.some((r) => r.personId === String(c.vars.pid) && r.kind === 'spouse') ? 'big' : 'bad'),
      },
      {
        id: 'move_in',
        label: (c) => c.t('Move in together', 'Aynı eve çıkın'),
        requires: (c) => !c.h.has('moved_in'),
        resolve: (c) => {
          c.h.flag('moved_in');
          c.h.closeness(String(c.vars.pid), 8);
          c.h.stat('happiness', 4);
          const n = nm(c);
          const moved = atParents(c) ? `${moveTo(c, 'flat', 'rent')} ` : '';
          return (
            moved +
            c.t(`You and ${n} share one key ring now, and a long argument about where the sofa goes.`, `${wth(n)} artık tek bir anahtarlığı paylaşıyorsunuz; bir de kanepenin yeri hakkında uzun bir tartışmayı.`)
          );
        },
        tone: 'good',
      },
      {
        id: 'wait',
        label: (c) => c.t('Keep things as they are', 'Her şey böyle kalsın'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -4);
          return sayWith(c, 'nudge.wait', TOGETHER_WAIT, who(c));
        },
      },
    ],
  },
  {
    // "thinking about kids?": the couple decides; trying means a baby within a few years, by age (lifeNudge)
    id: 'base.nudge_kids',
    category: 'family',
    scheduled: true,
    when: (c) => !!c.h.partner(),
    setup: (c) => {
      c.vars.pid = c.h.partner()!.person.id;
      c.vars.kids = c.h.relatives('child').length;
    },
    title: (c) =>
      Number(c.vars.kids) > 0
        ? c.t('A little brother or sister?', 'Bir kardeş mi geliyor?')
        : c.t('Thinking about kids?', 'Çocuk düşünüyor musunuz?'),
    text: (c) =>
      Number(c.vars.kids) > 0
        ? c.t(`${nm(c)} has been looking at the old baby clothes again.`, `${nm(c)} yine eski bebek kıyafetlerine bakıyor.`)
        : c.t(`${nm(c)} held a friend's baby all evening and would not give it back.`, `${nm(c)} bütün akşam bir arkadaşınızın bebeğini kucağından indirmedi.`),
    choices: [
      {
        id: 'try',
        label: (c) => c.t('Start trying', 'Denemeye başlayın'),
        requires: (c) => canHaveBaby(c),
        resolve: (c) => {
          c.h.flag('trying');
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', 3);
          return sayWith(c, 'nudge.try', TRY_LINES, nm(c));
        },
        tone: 'good',
      },
      {
        id: 'adopt',
        label: (c) => c.t('Adopt a child', 'Evlat edinin'),
        badge: 'Big change',
        requires: (c) => canAdopt(c) && c.p.money >= wage(c, 2500),
        requiresLabel: 'Not enough money',
        resolve: (c) => adoptChild(c, c.p.money < wage(c, 6000)),
        tone: adoptTone,
      },
      {
        id: 'later',
        label: (c) => c.t('Not yet', 'Henüz değil'),
        resolve: (c) => sayWith(c, 'nudge.kids_later', KIDS_LATER, nm(c)),
      },
      {
        id: 'enough',
        label: (c) => (Number(c.vars.kids) > 0 ? c.t('Our family is complete', 'Ailemiz tamam') : c.t('We are happy as we are', 'Böyle mutluyuz')),
        resolve: (c) => {
          c.h.flag('no_more_kids');
          return sayWith(c, 'nudge.kids_enough', KIDS_ENOUGH, nm(c));
        },
      },
    ],
  },
  {
    // from 45, a player with no child hears it plainly: the family ends with them unless something changes
    id: 'base.no_heir',
    category: 'family',
    scheduled: true,
    when: (c) => c.h.relatives('child').length === 0,
    setup: (c) => {
      const nib = livingNiblings(c);
      if (nib.length) c.vars.nib = nib[0].id;
    },
    title: (c) => c.t('You have no heir yet', 'Henüz bir varisin yok'),
    text: (c) => {
      const fam = c.s.dynasty.familyName;
      const nib = c.vars.nib ? c.h.person(String(c.vars.nib)) : undefined;
      if (nib)
        return c.t(
          `You have no children. If your story ended today, the ${fam} family would pass to your ${nib.gender === 'female' ? 'niece' : 'nephew'} ${nib.firstName}.`,
          `Hiç çocuğun yok. Hikâyen bugün bitse ${fam} ailesi yeğenin ${dat(nib.firstName)} geçerdi.`,
        );
      return c.t(
        `You have no children, no nieces and no nephews. If your story ended today, the ${fam} family would end with it.`,
        `Ne çocuğun var ne de yeğenin. Hikâyen bugün bitse ${fam} ailesi de seninle biterdi.`,
      );
    },
    choices: [
      {
        id: 'adopt',
        label: (c) => c.t('Start the adoption papers', 'Evlat edinme başvurusu yap'),
        badge: 'Big change',
        requires: (c) => canAdopt(c) && c.p.money >= wage(c, 2500),
        requiresLabel: 'Not enough money',
        resolve: (c) => adoptChild(c, c.p.money < wage(c, 6000)),
        tone: adoptTone,
      },
      {
        id: 'try',
        label: (c) => c.t('Try for a baby', 'Bebek için deneyin'),
        requires: (c) => canHaveBaby(c),
        resolve: (c) => {
          c.h.flag('trying');
          return sayWith(c, 'nudge.try', TRY_LINES, c.h.partner()!.person.firstName);
        },
        tone: 'good',
      },
      {
        id: 'nibling',
        label: (c) => c.t('Spend time with your niece or nephew', 'Yeğeninle vakit geçir'),
        requires: (c) => !!c.vars.nib,
        resolve: (c) => {
          const n = c.h.person(String(c.vars.nib)).firstName;
          c.h.stat('happiness', 4);
          return c.t(
            `You took ${n} out for ice cream and told the family stories, the true ones first. ${n} asked for more.`,
            `${acc(n)} dondurma yemeye götürdün ve aile hikâyelerini anlattın, önce gerçek olanları. ${n} devamını istedi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'peace',
        label: (c) => c.t('Make peace with it', 'Kabullen'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You decided a life does not need an heir to have been worth it. You still wrote down the family stories, just in case.',
            'Bir hayatın değerli olması için varis gerekmediğine karar verdin. Yine de aile hikâyelerini ne olur ne olmaz diye yazıya döktün.',
          );
        },
      },
    ],
  },
];

/** Close family who would help with a debt: grown children (28+) for a player of 50+, parents for one under 40. */
export function bailoutHelpers(c: Ctx) {
  if (c.age >= 50) return c.h.relatives('child').filter((r) => c.h.ageOf(r.person) >= 28 && r.rel.closeness >= 55);
  if (c.age < 40) return c.h.relatives(['mother', 'father']).filter((r) => r.rel.closeness >= 60 && c.h.ageOf(r.person) < 80);
  return [];
}

/** Too soon after a birth (the "try for a baby" activity, review item 7). */
export const BABY_TOO_SOON: Pair[] = [
  ['Your youngest is still a baby. Everyone agreed to sleep first and think about it later.', 'En küçüğünüz daha bebek. Herkes önce uyumaya, sonra düşünmeye karar verdi.'],
  ['Not yet. Nobody in the house has slept a full night since the last one arrived.', 'Henüz değil. Sonuncusu geldiğinden beri evde kimse tek bir gece deliksiz uyumadı.'],
  ['The doctor said to wait a little. The baby you already have agreed, loudly, at 3 a.m.', 'Doktor biraz beklemenizi söyledi. Evdeki bebek de gece üçte, avaz avaz katıldı.'],
];

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
          // Türkiye: a state university has no tuition (economy.ts TUITION_USD); lives there take the YKS tercih instead
          return tuitionFor(c.p.countryId) === 0
            ? c.t('You enrolled at university. No tuition, but the dorm and the canteen still want their money.', 'Üniversiteye kaydoldun. Harç yok ama yurt ve yemekhane yine de parasını istiyor.')
            : c.t('You enrolled at university. Tuition is not cheap.', 'Üniversiteye kaydoldun. Harçlar hiç ucuz değil.');
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
        badge: 'Costs more', // it is paid from savings, and can start adult life in debt (review 5 §3.7)
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
    // round 5 (careers): the party fits the work: own shop, public service, office, trade, ward, school
    title: (c) => retirementScene(c).title,
    text: (c) => retirementScene(c).text,
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
      {
        id: 'none',
        label: (c) => c.t('Keep looking later', 'Sonra yine bakarsın'),
        // a line, so a year whose only event was the listings still has something in the story
        resolve: (c) =>
          c.vars.job0 ? c.t('You closed the listings. Maybe next week.', 'İlanları kapattın. Belki haftaya.') : c.t('Nothing for you this week. You will look again.', 'Bu hafta sana uygun bir ilan yok. Yine bakacaksın.'),
      },
    ],
  },
  {
    id: 'base.date_match',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: dateGender(c), age: Math.max(18, c.age + c.rng.int(-5, 5)) }).id;
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
  ...NUDGE_EVENTS,
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
        `You owe ${c.h.fmt(Math.max(0, -c.p.money))}, and the interest grows every month. The letter uses the word "final" twice.`,
        `Toplam borcun ${c.h.fmt(Math.max(0, -c.p.money))} ve faizi her ay büyüyor. Mektupta "son ihtar" lafı iki kez geçiyor.`,
      ),
    choices: [
      {
        // ways out of debt (review item 6): the house if there is one, otherwise the furniture
        id: 'sell',
        label: (c) => (c.p.home.owned ? c.t('Sell the house and rent', 'Evi sat, kiraya geç') : c.t('Sell your furniture', 'Eşyalarını sat')),
        badge: 'Big change',
        requires: (c) => (c.p.home.owned && c.p.home.value > 0) || c.p.home.furniture.length > 0,
        resolve: (c) => {
          c.h.stat('happiness', -6);
          if (c.p.home.owned) return `${moveTo(c, 'flat', 'rent')} ${c.t('The bank sent a thank-you letter. In black ink.', 'Banka bir teşekkür mektubu gönderdi. Bu sefer siyah mürekkeple.')}`;
          const sale = sellFurniture(c);
          return c.t(
            `You sold the furniture for ${c.h.fmt(sale)}. The flat echoes now, and so does the bank's silence.`,
            `Eşyaları ${c.h.fmt(sale)} karşılığında sattın. Ev artık yankı yapıyor; bankanın sessizliği de öyle.`,
          );
        },
        tone: 'big',
      },
      {
        // the first time: the bank restructures and writes off part of it; later, a plain repayment plan
        id: 'plan',
        label: (c) => (c.h.has('restructured') ? c.t('Agree a repayment plan', 'Ödeme planı yap') : c.t('Restructure the debt', 'Borcu yapılandır')),
        resolve: (c) => {
          c.h.flag('debt_plan');
          c.h.stat('happiness', -4);
          if (!c.h.has('restructured')) {
            c.h.flag('restructured');
            const unsecured = Math.max(0, -c.p.money - homeEquity(c.p.home));
            const cut = Math.round(unsecured * 0.3);
            c.h.money(cut);
            return c.t(
              `The bank agreed to new terms: ${c.h.fmt(cut)} written off and the rest spread over ten years. You signed eleven pages and felt lighter.`,
              `Banka borcunu yapılandırdı: ${c.h.fmt(cut)} silindi, kalanı on yıla yayıldı. On bir sayfa imzaladın ve hafifledin.`,
            );
          }
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

/** Sells every piece of furniture at 40% of its price (a way out of debt). Returns the money raised. */
function sellFurniture(c: Ctx): number {
  const wf = wage(c, 1000) / 1000;
  const sale = Math.round(c.p.home.furniture.reduce((sum, id) => sum + (furnitureItem(id)?.price ?? 0) * wf * 0.4, 0));
  c.p.home.furniture = [];
  c.h.money(sale);
  return sale;
}

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
