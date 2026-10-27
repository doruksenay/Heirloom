import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef } from '../types';
import type { JobDef } from '../../engine/careers';
import { isCareerUpgrade, titleFor } from '../../engine/careers';
import { allJobs } from '../registry';
import { aOrAn, acc, loc, nm, single, wage } from '../base/util';
import { isCoastal } from '../../engine/places';
import { campusMoreEvents } from './events-more';
import { say, sayWith, type Pair } from '../base/lines';
import { grandmaAlive, motherAlive } from '../fame/util';
import {
  CLUBS,
  HONORS,
  MAJORS,
  atUni,
  bumpGpa,
  campusState,
  clubName,
  companiesFor,
  ensureEnrolled,
  fitsMajor,
  fmtGpa,
  free,
  gpaTarget,
  inGrad,
  isAcademic,
  majorJobs,
  majorName,
  peekCampus,
  type Club,
  type Honors,
  type Major,
} from './state';

// "Campus" expansion: majors, GPA, clubs, internships, Erasmus, honors and grad school.
export const CAMPUS_ENTITLEMENT = 'pack.campus';

const gpa = (c: Ctx) => fmtGpa(campusState(c.p).gpa, c.lang);
const cs = (c: Ctx) => campusState(c.p);
const enrolled = (c: Ctx) => atUni(c) && free(c);
const jobById = (c: Ctx, id: string) => allJobs(c.s.enabledPacks).find((j) => j.id === id);
const jobTitle0 = (c: Ctx, id: string) => {
  const j = jobById(c, id);
  return j ? titleFor(j, 0, c.lang) : id;
};
// Repeatable campus lines (one rng call per pick; no repeat until most of a list has been seen).
const STUDY: Pair[] = [
  ['You studied in the library until they turned the lights off.', 'Kütüphanede ışıkları kapatana kadar çalıştın.'],
  ['You rewrote your notes in four colors. Some of it stuck.', 'Notlarını dört renk kalemle temize çektin. Bir kısmı kafana girdi.'],
  ['You solved every past exam from the last five years.', 'Son beş yılın çıkmış sorularını tek tek çözdün.'],
  ['You joined a study group. Two hours of gossip, forty minutes of studying. The forty minutes were excellent.', 'Bir çalışma grubuna katıldın. İki saat dedikodu, kırk dakika ders. O kırk dakika harikaydı.'],
  ['You explained the whole topic to your houseplant. It understood nothing, but you did.', 'Bütün konuyu saksı çiçeğine anlattın. O hiçbir şey anlamadı ama sen anladın.'],
  ['You made flashcards for everything, including your own name, just in case.', 'Her şey için bilgi kartı hazırladın; ne olur ne olmaz diye kendi adın için bile.'],
  ['You studied with headphones and no music, so nobody would talk to you. It worked.', 'Kimse konuşmasın diye müziksiz kulaklıkla çalıştın. İşe yaradı.'],
  ['You went to office hours. The professor was so surprised to see a student that she explained everything twice.', 'Hocanın ofis saatine gittin. Öğrenci görmeye o kadar şaşırdı ki her şeyi iki kez anlattı.'],
  ['You borrowed the best notes in the class and copied them by hand. Some of it went in through your fingers.', 'Sınıfın en iyi notlarını ödünç alıp elle yazdın. Bir kısmı parmaklarından kafana girdi.'],
];
const ALLNIGHTER: Pair[] = [
  ['You pulled an all-nighter with four coffees and a sense of doom. It worked.', 'Dört kahve ve bir kıyamet hissiyle sabahladın. İşe yaradı.'],
  ['You studied until the birds started singing. You wrote the exam on pure adrenaline, and it went well.', 'Kuşlar ötmeye başlayana kadar çalıştın. Sınavı saf adrenalinle yazdın ve iyi geçti.'],
  ['An all-nighter in the dorm kitchen, fuelled by instant noodles. You aced the first question and guessed the rest well.', 'Yurt mutfağında hazır erişteyle sabahladın. İlk soruyu tam yaptın, gerisini de iyi tahmin ettin.'],
  ['You and a friend kept each other awake all night with quiz questions. You both passed, barely awake.', 'Bir arkadaşınla bütün gece birbirinize soru sorup uyanık kaldınız. İkiniz de geçtiniz, gözleriniz açık kalabildiği kadarıyla.'],
  ['You saw the sunrise from the library steps. The exam felt like a dream, a good one.', 'Güneşin doğuşunu kütüphane merdivenlerinden izledin. Sınav bir rüya gibi geçti, güzel bir rüya.'],
];
const PARTY: Pair[] = [
  ['You danced on a table. There is video. There is always video.', 'Masanın üstünde dans ettin. Videosu var. Her zaman videosu olur.'],
  ["You woke up wearing someone else's jacket and holding a traffic cone.", 'Sabah üstünde başkasının montu, elinde bir trafik konisiyle uyandın.'],
  ['You made eleven new best friends. You remember two of their names.', 'On bir yeni kanka edindin. İkisinin adını hatırlıyorsun.'],
  ['You ended up running the music. Someone asked for the same song nine times; you played it nine times.', 'Bir şekilde müziği sen idare etmeye başladın. Biri aynı şarkıyı dokuz kez istedi, dokuz kez çaldın.'],
  ['You spent the whole party in the kitchen talking about the meaning of life with a philosophy student.', 'Bütün partiyi mutfakta bir felsefe öğrencisiyle hayatın anlamını konuşarak geçirdin.'],
  ['There was a costume theme nobody told you about. You went as "student". It was very convincing.', 'Kimsenin söylemediği bir kostüm teması varmış. Sen "öğrenci" kılığında gittin. Çok inandırıcıydın.'],
  ['You won a dance-off against a third-year. Your knees lost.', 'Üçüncü sınıftan biriyle dans yarışına girip kazandın. Dizlerin kaybetti.'],
  ['You left at midnight with a pizza box and a story you will tell for years.', 'Gece yarısı elinde bir pizza kutusu ve yıllarca anlatacağın bir hikâyeyle çıktın.'],
  ['You helped clean up at 4 a.m. The host now considers you family.', 'Sabaha karşı dörtte toplamaya yardım ettin. Ev sahibi artık seni aileden sayıyor.'],
];

const pickLine = (c: Ctx, lines: [string, string][]) => {
  const [en, tr] = c.rng.pick(lines);
  return c.t(en, tr);
};

/** him / her and he / she for the person in c.vars.pid (English only). */
const himOf = (c: Ctx) => (c.h.person(String(c.vars.pid))?.gender === 'female' ? 'her' : 'him');
const heOf = (c: Ctx) => (c.h.person(String(c.vars.pid))?.gender === 'female' ? 'she' : 'he');
const inTR = (c: Ctx) => c.p.countryId === 'tr';

/** A classmate of roughly the player's age. */
const classmate = (c: Ctx, gender?: 'female' | 'male') => c.h.newPerson({ gender, age: Math.max(17, c.age + c.rng.int(-2, 2)) });

// ------------------------------------------------------------------ major
const MAJOR_LINES: Record<Major, [string, string]> = {
  engineering: ['You chose Engineering. You now own a calculator that costs more than your phone.', 'Mühendislik seçtin. Artık telefonundan pahalı bir hesap makinen var.'],
  medicine: ['You chose Medicine. Your relatives already ask you about their knee pain.', 'Tıp seçtin. Akrabalar şimdiden diz ağrılarını sana danışmaya başladı.'],
  law: ['You chose Law. You started winning every family argument.', 'Hukuk seçtin. Aile içi tartışmaların hepsini kazanmaya başladın.'],
  business: ['You chose Business. By week two you said "synergy" without irony.', 'İşletme seçtin. İkinci haftada "sinerji" kelimesini ciddi ciddi kullanmaya başladın.'],
  arts: ['You chose Fine Arts. Your parents asked, very calmly, what the plan is.', 'Güzel Sanatlar seçtin. Annenle baban çok sakin bir sesle "Peki plan ne?" diye sordu.'],
  education: ['You chose Education. You already have the teacher voice.', 'Öğretmenlik seçtin. Daha ilk dönemden o meşhur öğretmen ses tonunu kaptın.'],
};
const MAJOR_REQ: Partial<Record<Major, number>> = { medicine: 60, engineering: 50, law: 50 };

function majorChoice(m: Major): ChoiceDef {
  const req = MAJOR_REQ[m];
  return {
    id: m,
    label: (c) => c.t(MAJORS[m].en, MAJORS[m].tr),
    requires: req ? (c) => c.p.stats.smarts >= req : undefined,
    requiresLabel: req ? `Needs Smarts ${req}+` : undefined,
    resolve: (c) => {
      const st = ensureEnrolled(c);
      st.major = m;
      c.h.flag(`major:${m}`);
      c.h.stat('happiness', 3);
      // the Fine Arts line asks "your parents"; without a living parent the relatives ask instead
      const [en, tr] =
        m === 'arts' && c.h.relatives(['mother', 'father']).length === 0
          ? (['You chose Fine Arts. Your relatives asked, very calmly, what the plan is.', 'Güzel Sanatlar seçtin. Akrabaların çok sakin bir sesle "Peki plan ne?" diye sordu.'] as const)
          : MAJOR_LINES[m];
      return c.t(en, tr);
    },
    tone: 'big',
  };
}

// ------------------------------------------------------------------ clubs
const CLUB_EFFECT: Record<Club, (c: Ctx) => [string, string]> = {
  debate: (c) => (c.h.stat('smarts', 3), ['You joined the Debate Club. You now say "with all due respect" before insulting people.', 'Münazara Kulübüne katıldın. Artık birine laf sokmadan önce "Saygılarımla ama..." diyorsun.']),
  music: (c) => (c.h.stat('happiness', 6), ['You joined the Music Club. Someone always brings a guitar. It is usually you now.', 'Müzik Kulübüne katıldın. Her ortamda biri gitar çıkarıyor. Artık o kişi genelde sensin.']),
  sports: (c) => (c.h.stat('health', 5), c.h.stat('looks', 1), ['You joined the Sports Club. You discovered muscles you did not know you had. They hurt.', 'Spor Kulübüne katıldın. Varlığından haberin olmayan kasların varmış. Hepsi ağrıyor.']),
  startup: (c) => (c.h.stat('smarts', 2), ['You joined the Startup Club. You have pitched four apps and built zero.', 'Girişimcilik Kulübüne katıldın. Dört uygulama fikri sundun, sıfır tanesini yaptın.']),
  theatre: (c) => (c.h.stat('looks', 2), c.h.stat('happiness', 4), ['You joined the Theatre Club. You got cast as "Tree #2". You were a magnificent tree.', 'Tiyatro Kulübüne katıldın. "2 numaralı ağaç" rolünü kaptın. Muhteşem bir ağaçtın.']),
};

function clubChoice(k: Club): ChoiceDef {
  return {
    id: k,
    label: (c) => clubName(c, k),
    resolve: (c) => {
      const st = cs(c);
      if (st.clubs.includes(k)) {
        c.h.stat('happiness', 2);
        return c.t(`You went to another ${CLUBS[k].en} meeting. Same faces, same free tea.`, `Yine ${CLUBS[k].tr} toplantısına gittin. Aynı yüzler, aynı bedava çay.`);
      }
      st.clubs.push(k);
      const friend = classmate(c);
      c.h.addRelation(friend, 'friend', c.rng.int(55, 78));
      const [en, tr] = CLUB_EFFECT[k](c);
      return c.t(`${en} You also made a friend, ${friend.firstName}.`, `${tr} Bir de yeni arkadaşın var: ${friend.firstName}.`);
    },
    tone: 'good',
  };
}

// ------------------------------------------------------------------ jobs offered through Campus
function hireChance(c: Ctx): number {
  const st = cs(c);
  const honors = st.honors ? 0.05 : 0;
  return Math.min(0.95, 0.45 + c.p.stats.smarts / 300 + st.gpa / 16 + st.internships * 0.05 + honors - (c.p.criminalRecord > 0 ? 0.2 : 0));
}

/** Lowercase major for the middle of a Turkish sentence: "hukuk okumuş", "tıp diplomanı". */
const majorLower = (c: Ctx) => majorName('tr', cs(c).major).toLocaleLowerCase('tr');

/** What a hire at the career fair sounds like: by the job's field, and for someone leaving another job. */
type Hire = { t: string; maj: string; majEn: string; cur: string };
const HIRE_LINES: Record<JobDef['field'] | 'any', ((v: Hire) => Pair)[]> = {
  any: [
    ({ t, majEn, maj }) => [`The recruiter loved that you studied ${majEn}. You are now ${aOrAn(t)}!`, `İK'cı ${maj} okumuş olmana bayıldı. Artık ${t} oldun!`],
    ({ t }) => [`You shook forty hands, ate eleven free mints and got one real offer. You are now ${aOrAn(t)}.`, `Kırk el sıktın, on bir bedava şeker yedin ve bir gerçek teklif aldın. Artık ${t} oldun.`],
  ],
  tech: [
    ({ t }) => [`The engineering lead quizzed you at the stand for forty minutes, then shook your hand. You are now ${aOrAn(t)}.`, `Standdaki ekip lideri seni kırk dakika soru yağmuruna tuttu, sonra elini sıktı. Artık ${t} oldun.`],
    ({ t }) => [`They asked you to fix a bug on the laptop at their stand. You fixed two. You are now ${aOrAn(t)}.`, `Standdaki dizüstünde bir hatayı düzeltmeni istediler. Sen iki tane düzelttin. Artık ${t} oldun.`],
  ],
  health: [
    ({ t, maj, majEn }) => [`The hospital's recruiter liked your ${majEn} degree and your steady hands. You are now ${aOrAn(t)}.`, `Hastane standındaki yönetici ${maj} diplomanı ve sakin ellerini beğendi. Artık ${t} oldun.`],
    ({ t }) => [`The clinic's recruiter asked how you cope with night shifts. "Tea," you said. You are now ${aOrAn(t)}.`, `Klinik standındaki görevli gece nöbetlerini nasıl idare ettiğini sordu. "Çayla" dedin. Artık ${t} oldun.`],
  ],
  office: [
    ({ t, maj, majEn }) => [`A partner at the stand read your CV twice and underlined your ${majEn} degree. You are now ${aOrAn(t)}.`, `Standdaki ortak CV'ni iki kez okudu ve ${maj} diplomanın altını çizdi. Artık ${t} oldun.`],
    ({ t }) => [`The firm's recruiter was impressed that you brought your own pen. You are now ${aOrAn(t)}.`, `Şirketin işe alımcısı kendi kalemini getirmene bayıldı. Artık ${t} oldun.`],
  ],
  creative: [
    ({ t }) => [`The art director flipped through your portfolio, stopped at one page and said "This." You are now ${aOrAn(t)}.`, `Sanat yönetmeni portfolyonu karıştırdı, bir sayfada durdu ve "İşte bu" dedi. Artık ${t} oldun.`],
    ({ t }) => [`The studio's stand had a beanbag and no dress code. They hired you on the spot as ${aOrAn(t)}.`, `Stüdyonun standında bir armut koltuk vardı, kıyafet kuralı yoktu. Seni oracıkta ${t} olarak işe aldılar.`],
  ],
  public: [
    ({ t }) => [`At the education stand they asked you to explain fractions to a passing child. The child understood. You are now ${aOrAn(t)}.`, `Eğitim standındakiler yanlarından geçen bir çocuğa kesirleri anlatmanı istedi. Çocuk anladı. Artık ${t} oldun.`],
    ({ t }) => [`The faculty table liked your thesis more than you ever did. You are now ${aOrAn(t)}.`, `Fakülte masasındakiler bitirme tezini senden bile çok beğendi. Artık ${t} oldun.`],
  ],
  service: [],
  trade: [],
};
/** Someone who already has a job and moves up through the fair. */
const HIRE_SWITCH: ((v: Hire) => Pair)[] = [
  ({ t, cur }) => [`The recruiter skipped the graduate questions and asked about your years as ${aOrAn(cur)}. They hired you as ${aOrAn(t)}.`, `İşe alımcı mezun sorularını geçip ${cur} olarak geçirdiğin yılları sordu. Seni ${t} olarak işe aldılar.`],
  ({ t }) => [`You went for the free pens and came back with an offer: ${t}, on a better salary than now. You handed in your notice the next day.`, `Bedava kalem için gitmiştin, elinde bir teklifle döndün: ${t}, üstelik şimdikinden iyi bir maaşla. Ertesi gün istifa dilekçeni verdin.`],
  ({ t }) => [`A rival of your employer had a stand. By the end of the coffee you had agreed to join them as ${aOrAn(t)}.`, `Çalıştığın yerin rakiplerinden biri de fuardaydı. Kahven bitmeden onlara ${t} olarak geçmeyi kabul etmiştin.`],
];

const fairChoice = (i: number): ChoiceDef => ({
  id: `job${i}`,
  label: (c) => (c.vars[`job${i}`] ? String(c.vars[`title${i}`]) : '—'),
  requires: (c) => !!c.vars[`job${i}`],
  requiresLabel: 'No opening',
  resolve: (c) => {
    if (c.rng.chance(hireChance(c))) {
      const cur = c.p.jobId && !c.p.retired ? c.h.jobTitle() ?? '' : '';
      const id = String(c.vars[`job${i}`]);
      c.h.setJob(id);
      // an experienced hire can come in above the entry rung (the offer said which title)
      const lvl = Number(c.vars[`lvl${i}`] ?? 0);
      if (lvl > 0) {
        c.p.jobLevel = lvl;
        c.p.jobTitle = c.h.jobTitle();
      }
      c.h.stat('happiness', 6);
      const v: Hire = { t: c.h.jobTitle() ?? '', maj: majorLower(c), majEn: majorName('en', cs(c).major), cur };
      if (cur) return sayWith(c, 'campus.fair.switch', HIRE_SWITCH, v);
      const field = c.h.job()?.field ?? 'office';
      return sayWith(c, `campus.fair.hire.${field}`, [...HIRE_LINES.any, ...HIRE_LINES[field]], v);
    }
    c.h.stat('happiness', -3);
    return c.t(
      `You interviewed for ${c.vars[`title${i}`]}. They said you were "a strong candidate" and hired someone's nephew.`,
      `${c.vars[`title${i}`]} mülakatına girdin. "Çok güçlü bir adaysınız" dediler, sonra birinin yeğenini aldılar.`,
    );
  },
});

/**
 * The title a fair stand offers: the entry rung for a graduate, a matching rung for someone already working
 * (never the top of the ladder), and the second rung for a PhD going into academia or research.
 */
function offerLevel(c: Ctx, j: JobDef): number {
  const employed = !!c.p.jobId && !c.p.retired;
  if (employed && j.id === c.p.jobId) return c.p.jobLevel + 1; // a rival employer poaches you one rung up
  let lvl = employed ? Math.max(0, Math.min(c.p.jobLevel, j.titles.length - 2)) : 0;
  if (cs(c).phd && ACADEMIC_JOB_IDS.includes(j.id)) lvl = Math.max(lvl, 1);
  return lvl;
}
const ACADEMIC_JOB_IDS = ['academic', 'research'];

/** Graduate jobs that fit the major and are a real step up for the player (no Dean → Probationary Firefighter). */
const DEGREE_FIELDS: JobDef['field'][] = ['tech', 'health', 'office', 'creative', 'public'];
/** Fresh offers for this fair: fitting upgrades not shown at the last one. */
const freshJobs = (c: Ctx) => {
  // last year's stands are still there this year; the year after, they are back with new people
  const st = cs(c);
  const last = st.fairYear !== undefined && c.s.year - st.fairYear <= 1 ? st.fairLast ?? [] : [];
  return fairJobs(c).filter((j) => !last.includes(j.id));
};
/** Why the fair has nothing for you, if it has nothing: 'seen' (same stands as last time), 'top' (nothing beats your job), 'none'. */
function fairGap(c: Ctx): 'open' | 'seen' | 'top' | 'none' {
  if (freshJobs(c).length) return 'open';
  if (fairJobs(c).length) return 'seen';
  const employed = !!c.p.jobId && !c.p.retired;
  return employed && majorJobs(c, DEGREE_FIELDS).some((j) => fitsMajor(cs(c).major, j.id)) ? 'top' : 'none';
}

/** No job is offered more than this many times in one life: recruiters stop calling back. */
const FAIR_MAX_OFFERS = 3;
function fairJobs(c: Ctx, leeway = 10): JobDef[] {
  const st = cs(c);
  const jobs = majorJobs(c, DEGREE_FIELDS, leeway);
  // your own job at the next rung, from a rival employer (never the top rung: that one is earned in-house)
  const cur = c.p.jobId && !c.p.retired ? c.h.job() : undefined;
  if (cur && fitsMajor(st.major, cur.id) && c.p.jobLevel + 1 <= cur.titles.length - 2) jobs.unshift(cur);
  return jobs.filter((j) => fitsMajor(st.major, j.id) && (st.fairCount?.[j.id] ?? 0) < FAIR_MAX_OFFERS && isCareerUpgrade(c, j, offerLevel(c, j)));
}

function startGrad(c: Ctx, prog: 'masters' | 'phd'): string {
  const st = cs(c);
  st.grad = prog;
  st.gradYearsLeft = prog === 'masters' ? 2 : st.masters ? 3 : 4;
  st.funded = prog === 'phd' || st.gpa >= 3.6 || c.h.has('scholarship');
  c.h.flag('grad_school');
  c.h.stat('happiness', 3);
  if (prog === 'masters') {
    return st.funded
      ? c.t("You started a master's degree on a full fellowship. Two more years of free library Wi-Fi.", 'Tam burslu yüksek lisansa başladın. İki yıl daha bedava kütüphane interneti.')
      : c.t(`You started a master's degree. Tuition is ${c.h.fmt(wage(c, 4000))} a year. Noodles are back on the menu.`, `Yüksek lisansa başladın. Yıllık harç ${c.h.fmt(wage(c, 4000))}. Hazır erişte günleri yeniden başladı.`);
  }
  return c.t(
    `You started a funded PhD. ${st.gradYearsLeft} years, a small stipend and a desk in a basement lab.`,
    `Burslu doktoraya başladın. ${st.gradYearsLeft} yıl, küçük bir burs ve bodrum kattaki laboratuvarda bir masa.`,
  );
}

// ------------------------------------------------------------------ events
const ROOMMATE_QUIRKS: [string, string][] = [
  ['snores like a diesel engine', 'dizel motor gibi horluyor'],
  ['only eats instant noodles, at 3 a.m.', 'sadece hazır erişte yiyor, o da gece üçte'],
  ['practices the bağlama at midnight', 'gece yarısı bağlama çalışıyor'],
  ['labels every item in the fridge', 'buzdolabındaki her şeye isim etiketi yapıştırıyor'],
  ['has a partner who basically lives in your room', 'sevgilisi neredeyse odanıza taşındı'],
];

const ROMANCE_PLACES: [string, string][] = [
  ['in the library', 'kütüphanede'],
  ['in the cafeteria queue', 'yemekhane sırasında'],
  ['at a club meeting', 'kulüp toplantısında'],
  ['in a 9 a.m. lecture nobody else came to', 'kimsenin gelmediği sabah dokuz dersinde'],
];

const CITIES: [string, string][] = [
  ['Barcelona', 'Barselona'],
  ['Berlin', 'Berlin'],
  ['Lisbon', 'Lizbon'],
  ['Prague', 'Prag'],
  ['Bologna', 'Bologna'],
  ['Kraków', 'Krakov'],
  ['Vienna', 'Viyana'],
  ['Amsterdam', 'Amsterdam'],
];

/** Exchange cities that are not abroad for players from that country. */
const CITY_COUNTRY: Record<string, string> = { de: 'Berlin' };

const cityChoice = (i: number): ChoiceDef => ({
  id: `city${i}`,
  label: (c) => {
    const [en, tr] = CITIES[Number(c.vars[`city${i}`])];
    return c.t(en, tr);
  },
  resolve: (c) => {
    const [en, tr] = CITIES[Number(c.vars[`city${i}`])];
    const st = cs(c);
    st.abroad = en;
    c.h.money(-wage(c, 1500));
    c.h.stat('happiness', 12);
    c.h.stat('smarts', 3);
    c.h.stat('looks', 1);
    c.h.achieve('erasmus');
    let extra = '';
    if (c.rng.chance(0.35)) {
      const friend = c.h.newPerson({ age: c.age });
      c.h.addRelation(friend, 'friend', c.rng.int(60, 85));
      extra = c.t(` ${friend.firstName} still sends you voice messages in three languages.`, ` ${friend.firstName} sana hâlâ üç dilde sesli mesaj atıyor.`);
    }
    return c.t(
      `You spent a semester in ${en}. You came back with three new words, new friends and a very strong opinion about bread.${extra}`,
      `${loc(tr)} bir dönem geçirdin. Üç yeni kelime, yeni dostlar ve ekmek hakkında çok güçlü fikirlerle döndün.${extra}`,
    );
  },
  tone: 'big',
});

const events: EventDef[] = [
  {
    id: 'campus.choose_major',
    category: 'school',
    minAge: 16,
    once: true,
    weight: 1000,
    when: (c) => enrolled(c) && !peekCampus(c.p)?.major,
    title: (c) => c.t('Time to declare your major.', 'Bölümünü seçme vakti.'),
    text: (c) =>
      c.h.relatives('mother').length && c.h.relatives('father').length
        ? c.t(
            'Your mother says doctor. Your father says engineer. Your aunt says "civil servant, it is safe". The registrar wants an answer by Friday.',
            'Annen "doktor ol" diyor, baban "mühendis". Teyzen "memur ol, garantisi var" diyor. Öğrenci işleri ise cumaya kadar cevap bekliyor.',
          )
        : c.t(
            'Your aunt says doctor. Your uncle says engineer. A neighbor says "civil servant, it is safe". The registrar wants an answer by Friday.',
            'Teyzen "doktor ol" diyor, amcan "mühendis". Komşunuz "memur ol, garantisi var" diyor. Öğrenci işleri ise cumaya kadar cevap bekliyor.',
          ),
    choices: (['engineering', 'medicine', 'law', 'business', 'arts', 'education'] as Major[]).map(majorChoice),
  },
  {
    id: 'campus.roommate',
    category: 'school',
    minAge: 16,
    once: true,
    weight: 14,
    when: (c) => enrolled(c),
    setup: (c) => {
      c.vars.pid = classmate(c, c.p.gender).id;
      c.vars.q = c.rng.int(0, ROOMMATE_QUIRKS.length - 1);
    },
    title: (c) => {
      const [en, tr] = ROOMMATE_QUIRKS[Number(c.vars.q)];
      return c.t(`Your dorm roommate ${nm(c)} ${en}.`, `Yurttaki oda arkadaşın ${nm(c)} ${tr}.`);
    },
    text: (c) => c.t('The room is nine square meters. There is nowhere to hide.', 'Oda dokuz metrekare. Kaçacak yer yok.'),
    choices: [
      {
        id: 'befriend',
        label: (c) => c.t('Make friends anyway', 'Yine de kanka ol'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(60, 82));
          c.h.stat('happiness', 3);
          return c.t(`You decided to like ${nm(c)}. Years later, ${heOf(c)} is still your closest friend from university.`, `${acc(nm(c))} sevmeye karar verdin. Yıllar sonra bile üniversiteden kalan en yakın dostun o.`);
        },
        tone: 'good',
      },
      {
        id: 'rules',
        label: (c) => c.t('Tape a list of room rules to the wall', 'Duvara oda kuralları listesi as'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(`You taped ten room rules to the wall. ${nm(c)} added rule 11: "No lists."`, `Duvara on maddelik kurallar listesi astın. ${nm(c)} altına 11. maddeyi ekledi: "Liste yasak."`);
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Move into a shared flat', 'Öğrenci evine taşın'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 1200));
          c.h.stat('happiness', 5);
          return c.t('You moved into a shared flat off campus. The rent hurts. The silence heals.', 'Kampüs dışında bir öğrenci evine taşındın. Kira acıtıyor ama sessizlik ilaç gibi.');
        },
      },
    ],
  },
  {
    id: 'campus.professor',
    category: 'school',
    minAge: 16,
    cooldown: 3,
    when: (c) => enrolled(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(50, 68) }).id;
    },
    title: (c) => {
      const prof = c.h.person(String(c.vars.pid));
      return c.t(`Professor ${prof.lastName} fails half of every class.`, `${prof.firstName} Hoca her dönem sınıfın yarısını bırakıyor.`);
    },
    text: (c) => c.t('Rumor says the last A was given in 1998, and that student is now a minister.', 'Rivayete göre son AA 1998 yılında verilmiş; o öğrenci de şimdi bakan.'),
    choices: [
      {
        id: 'office',
        label: (c) => c.t('Go to office hours every week', 'Her hafta ofis saatine git'),
        resolve: (c) => {
          const prof = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.4 + c.p.stats.smarts / 200)) {
            bumpGpa(c, 0.3);
            c.h.stat('smarts', 2);
            return c.t(`Professor ${prof.lastName} started calling you "the only one who listens". Your grade went up.`, `${prof.firstName} Hoca sana "bu sınıfta dinleyen tek kişi" demeye başladı. Notun yükseldi.`);
          }
          bumpGpa(c, 0.1);
          return c.t('You went every week. You still got a C. A respectful C.', 'Her hafta gittin. Yine de CC aldın. Ama saygılı bir CC.');
        },
        tone: 'good',
      },
      {
        id: 'complain',
        label: (c) => c.t('Complain to the dean', 'Dekanlığa şikâyet et'),
        badge: 'Risky',
        resolve: (c) => {
          const prof = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.35)) {
            bumpGpa(c, 0.15);
            return c.t('The dean agreed. The grades were curved and you became a quiet legend.', 'Dekan haklı buldu. Notlar çan eğrisine sokuldu, sen de sessiz bir efsane oldun.');
          }
          bumpGpa(c, -0.25);
          c.h.stat('happiness', -4);
          return c.t(`It turns out the dean and Professor ${prof.lastName} are golf partners. Your grade got worse.`, `Meğer dekanla ${prof.firstName} Hoca aynı sitede yazlıkçı komşuymuş. Notun daha da düştü.`);
        },
      },
      {
        id: 'accept',
        label: (c) => c.t('Accept your fate and retake it', 'Kaderine razı ol, alttan al'),
        resolve: (c) => {
          bumpGpa(c, -0.2);
          c.h.stat('happiness', -2);
          return c.t('You will retake the course next year. Same room, same professor, same pain.', 'Dersi alttan alacaksın. Gelecek yıl aynı sınıf, aynı hoca, aynı acı.');
        },
      },
    ],
  },
  {
    id: 'campus.finals',
    category: 'school',
    minAge: 16,
    cooldown: 2,
    weight: 14,
    when: (c) => enrolled(c),
    title: (c) => c.t('Finals week is here.', 'Final haftası geldi çattı.'),
    text: (c) => c.t('The library is open 24 hours. So is the vending machine. So are you.', 'Kütüphane 24 saat açık. Kantindeki tost makinesi de. Sen de.'),
    choices: [
      {
        id: 'cram',
        label: (c) => c.t('Cram everything', 'Her şeyi son geceye sığdır'),
        resolve: (c) => {
          bumpGpa(c, 0.1 + c.p.stats.smarts / 500);
          c.h.stat('health', -4);
          return c.t('You did not sleep for three days and drank a kilo of tea. The exams went fine.', 'Üç gün uyumadın, bir kilo çay içtin. Sınavlar fena geçmedi.');
        },
      },
      {
        id: 'group',
        label: (c) => c.t('Join a study group', 'Çalışma grubuna katıl'),
        resolve: (c) => {
          bumpGpa(c, 0.15);
          const friend = classmate(c);
          c.h.addRelation(friend, 'friend', c.rng.int(50, 70));
          return c.t(
            `Half the study group studied, half gossiped. It still worked, and you made a friend: ${friend.firstName}.`,
            `Çalışma grubunun yarısı ders çalıştı, yarısı dedikodu yaptı. Yine de işe yaradı; bir de yeni arkadaşın oldu: ${friend.firstName}.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it', 'Salla gitsin'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          if (c.rng.chance(0.45)) {
            bumpGpa(c, 0.1);
            return c.t('You walked in without studying. Every question was about the one chapter you happened to read.', 'Hiç çalışmadan girdin. Sorular tam da okuduğun tek konudan çıktı. Şans bu.');
          }
          bumpGpa(c, -0.35);
          return c.t('You walked in without studying. You wrote your name, then copied the question. The professor wrote "?" in the margin.', 'Hiç çalışmadan girdin. Adını yazdın, sonra soruyu kâğıda tekrar yazdın. Hoca kenarına kocaman bir "?" koymuş.');
        },
      },
    ],
  },
  {
    id: 'campus.cheating',
    category: 'school',
    minAge: 16,
    cooldown: 4,
    weight: 8,
    when: (c) => enrolled(c),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`${nm(c)} has the answers to tomorrow's exam.`, `${nm(c)} yarınki vizenin cevaplarını bulmuş.`),
    text: (c) => c.t('Photos of the answer key are going around a group chat called "Study Buddies".', 'Cevap anahtarının fotoğrafları "Ders Çalışma Grubu" adlı mesaj grubunda dolaşıyor.'),
    choices: [
      {
        id: 'use',
        label: (c) => c.t('Use the answers', 'Cevapları kullan'),
        badge: 'Risky',
        resolve: (c) => {
          const st = cs(c);
          st.cheated++;
          if (c.rng.chance(0.35)) {
            bumpGpa(c, -0.6);
            st.probation = true;
            c.h.stat('happiness', -8);
            return c.t(
              'You got caught. The disciplinary board let you off with a final warning. Your GPA did not get off so easily.',
              'Yakalandın. Disiplin kuruluna çıktın, uzaklaştırmayı son anda kıl payı atlattın. Ortalaman ise o kadar şanslı değildi.',
            );
          }
          bumpGpa(c, 0.35);
          return c.t('You aced it. A small voice inside you is not happy about it.', 'Sınavdan tam not aldın. İçinde küçük, rahatsız bir ses var ama.');
        },
      },
      {
        id: 'report',
        label: (c) => c.t('Report it', 'Durumu hocaya bildir'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t('The exam was rescheduled. The whole class is hunting for the snitch. You are keeping very quiet.', 'Sınav ertelendi. Bütün sınıf "ispiyoncu kim" diye dedektifliğe soyundu. Sen hiç sesini çıkarmıyorsun.');
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Study the honest way', 'Dürüstçe çalış'),
        resolve: (c) => {
          bumpGpa(c, 0.05);
          c.h.stat('smarts', 2);
          return c.t('You studied the honest way. Your grade was fine. Your conscience got an A.', 'Dürüstçe çalıştın. Notun idare eder, vicdanın ise AA aldı.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'campus.romance',
    category: 'love',
    minAge: 17,
    cooldown: 3,
    when: (c) => enrolled(c) && single(c),
    setup: (c) => {
      c.vars.pid = classmate(c, c.p.gender === 'female' ? 'male' : 'female').id;
      c.vars.w = c.rng.int(0, ROMANCE_PLACES.length - 1);
    },
    title: (c) => {
      const [en, tr] = ROMANCE_PLACES[Number(c.vars.w)];
      return c.t(`You keep running into ${nm(c)} ${en}.`, `${nm(c)} ile ${tr} sürekli karşılaşıyorsunuz.`);
    },
    text: (c) => c.t(`Today ${heOf(c)} saved you a seat.`, 'Bugün sana yer tutmuş.'),
    choices: [
      {
        id: 'ask',
        label: (c) => c.t(`Ask ${himOf(c)} out for tea`, 'Çay içmeye davet et'),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(c.h.person(String(c.vars.pid)), 'partner', c.rng.int(60, 82));
            c.h.stat('happiness', 8);
            return c.t(`${nm(c)} said yes. Two teas became two hundred. You are officially together.`, `${nm(c)} kabul etti. İki çay iki yüz çay oldu. Artık resmen sevgilisiniz.`);
          }
          c.h.stat('happiness', -4);
          return c.t(`${nm(c)} said ${heOf(c)} "wants to focus on studying". By Friday ${heOf(c)} was dating someone from Law.`, `${nm(c)} "Şu an derslerime odaklanmak istiyorum" dedi. Cuma günü hukuktan biriyle el ele gördün.`);
        },
        tone: 'good',
      },
      {
        id: 'friends',
        label: (c) => c.t('Stay study buddies', 'Ders arkadaşı olarak kalın'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(50, 70));
          bumpGpa(c, 0.05);
          return c.t(`You and ${nm(c)} became study buddies. Your notes have never been so colorful.`, `${nm(c)} ile ders arkadaşı oldunuz. Notların hiç bu kadar renkli olmamıştı.`);
        },
      },
      { id: 'ignore', label: (c) => c.t('Change seats', 'Yerini değiştir'), resolve: (c) => c.t('You changed seats. You still look over sometimes.', 'Yerini değiştirdin. Ama arada yine de göz ucuyla bakıyorsun.') },
    ],
  },
  {
    id: 'campus.scholarship',
    category: 'school',
    minAge: 16,
    once: true,
    weight: 40,
    when: (c) => enrolled(c) && !c.h.has('scholarship') && (peekCampus(c.p)?.gpa ?? 0) >= 3.5,
    title: (c) => c.t('The faculty offers you a merit scholarship.', 'Fakülte sana başarı bursu teklif ediyor.'),
    text: (c) =>
      c.t(
        'Your GPA has been noticed. Free tuition, a small stipend and your photo on a hallway poster.',
        'Ortalaman dikkat çekmiş. Harç yok, üstüne cep harçlığı, bir de koridordaki panoda fotoğrafın. KYK kredisine veda edebilirsin.',
      ),
    choices: [
      {
        id: 'accept',
        label: (c) => c.t('Accept', 'Kabul et'),
        resolve: (c) => {
          c.h.flag('scholarship');
          c.h.money(wage(c, 1000));
          c.h.stat('happiness', 6);
          if (motherAlive(c)) return c.t('You accepted. Your mother had the letter framed and hung it in the best spot in the living room.', 'Kabul ettin. Annen mektubu çerçeveletip salonun baş köşesine astı.');
          if (c.h.relatives('father').length) return c.t('You accepted. Your father had the letter framed and shows it to every guest.', 'Kabul ettin. Baban mektubu çerçeveletti, gelen her misafire gösteriyor.');
          return c.t('You accepted, and framed the letter yourself. It hangs above your desk.', 'Kabul ettin ve mektubu kendin çerçeveletip masanın üstüne astın.');
        },
        tone: 'good',
      },
      {
        id: 'give',
        label: (c) => c.t('Ask them to give it to someone who needs it more', 'Senden çok ihtiyacı olan birine verilsin'),
        resolve: (c) => {
          c.h.stat('happiness', 8);
          return c.t('You passed it to a classmate who needed it more. They cried. You cried. The dean cried a little.', 'Bursu senden çok ihtiyacı olan bir arkadaşına bıraktın. O ağladı, sen ağladın, dekan bile biraz duygulandı.');
        },
      },
    ],
  },
  {
    id: 'campus.protest',
    category: 'school',
    minAge: 16,
    cooldown: 5,
    weight: 7,
    when: (c) => enrolled(c),
    title: (c) => c.t('Students are protesting the new cafeteria prices.', 'Öğrenciler yemekhane zammını protesto ediyor.'),
    text: (c) => c.t('A plate of rice now costs more than a textbook. Banners are being painted on bedsheets.', 'Bir tabak pilav artık ders kitabından pahalı. Pankartlar yurt çarşaflarına boyanıyor.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Join the march', 'Yürüyüşe katıl'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          if (c.rng.chance(0.2)) {
            c.h.stat('happiness', -6);
            return inTR(c)
              ? c.t('You spent a night in custody and were released in the morning with a stern warning and a simit.', 'Bir gece gözaltında kaldın. Sabah sıkı bir uyarı ve bir simitle serbest bırakıldın.')
              : c.t('You spent a night in custody and were released in the morning with a stern warning and a cold coffee.', 'Bir gece gözaltında kaldın. Sabah sıkı bir uyarı ve soğumuş bir kahveyle serbest bırakıldın.');
          }
          return c.t('You chanted until your voice gave out. Prices went down. Slightly. Victory!', 'Sesin kısılana kadar slogan attın. Fiyatlar biraz indi. Zafer!');
        },
      },
      {
        id: 'speech',
        label: (c) => c.t('Give a speech', 'Kürsüye çık, konuşma yap'),
        resolve: (c) => {
          const debater = cs(c).clubs.includes('debate');
          if (c.rng.chance(0.4 + (debater ? 0.3 : 0) + c.p.stats.smarts / 400)) {
            c.h.achieve('activist');
            c.h.stat('happiness', 8);
            return c.t(
              `Your speech went viral on campus${debater ? ' (thanks, Debate Club)' : ''}. The administration reversed the price hike.`,
              `Konuşman kampüste viral oldu${debater ? ' (Münazara Kulübüne selam olsun)' : ''}. Rektörlük zammı geri çekti.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t('The microphone died halfway through your speech. You finished it shouting. Nobody heard the important part.', 'Konuşmanın ortasında mikrofon gitti. Bağıra bağıra bitirdin ama kimse önemli kısmı duymadı.');
        },
      },
      {
        id: 'library',
        label: (c) => c.t('Enjoy the empty library', 'Boş kalan kütüphanenin tadını çıkar'),
        resolve: (c) => {
          bumpGpa(c, 0.1);
          return c.t('With everyone outside, the library was all yours. Most productive day of your life. Slightly guilty.', 'Herkes dışarıdayken kütüphane sana kaldı. Hayatının en verimli günüydü; biraz da vicdan azabı çektin.');
        },
      },
    ],
  },
  {
    id: 'campus.club_drama',
    category: 'school',
    minAge: 16,
    cooldown: 3,
    when: (c) => enrolled(c) && (peekCampus(c.p)?.clubs.length ?? 0) > 0,
    setup: (c) => {
      c.vars.club = c.rng.pick(cs(c).clubs);
    },
    title: (c) => {
      const k = c.vars.club as Club;
      return c.t(`Drama in the ${CLUBS[k].en}: the president election is next week.`, `${CLUBS[k].tr} karıştı: haftaya başkanlık seçimi var.`);
    },
    text: (c) => c.t('Two factions, one group chat, four hundred unread messages.', 'İki hizip, bir mesaj grubu, dört yüz okunmamış mesaj.'),
    choices: [
      {
        id: 'run',
        label: (c) => c.t('Run for president', 'Başkanlığa aday ol'),
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 400 + c.p.stats.looks / 400 + c.p.stats.happiness / 400)) {
            cs(c).president = true;
            c.h.achieve('club_president');
            c.h.stat('happiness', 8);
            return c.t('You won by three votes. Your first act as president: free tea at every meeting.', 'Üç oy farkla kazandın. Başkan olarak ilk icraatın: her toplantıda bedava çay.');
          }
          c.h.stat('happiness', -3);
          return c.t('You lost to someone who promised a beach trip. Democracy is cruel.', 'Deniz gezisi vaat eden rakibine kaybettin. Demokrasi acımasız.');
        },
      },
      {
        id: 'mediate',
        label: (c) => c.t('Play peacemaker', 'Arabulucu ol'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t('You got both sides to share a pizza. A ceasefire, for now.', 'İki tarafı aynı pizzanın başına oturttun. Şimdilik ateşkes.');
        },
      },
      {
        id: 'quit',
        label: (c) => c.t('Quit the club', 'Kulüpten ayrıl'),
        resolve: (c) => {
          const st = cs(c);
          st.clubs = st.clubs.filter((k) => k !== c.vars.club);
          c.h.stat('happiness', 3);
          return c.t('You left the group chat. Peace at last.', 'Kulübün mesaj grubundan çıktın. Nihayet huzur.');
        },
      },
    ],
  },
  {
    id: 'campus.daily',
    category: 'school',
    minAge: 16,
    cooldown: 2,
    weight: 6,
    when: (c) => enrolled(c),
    text: '',
    apply: (c) => {
      const i = c.rng.int(0, 3);
      if (i === 2) bumpGpa(c, 0.05);
      if (i === 3) bumpGpa(c, -0.05);
      return [
        inTR(c)
          ? c.t('The cafeteria served lentil soup for the 40th day in a row. You have started to like it, which is worrying.', 'Yemekhane kırkıncı gün üst üste mercimek çorbası çıkardı. Sevmeye başladın, bu endişe verici.')
          : c.t('The cafeteria served the same pasta bake for the 40th day in a row. You have started to like it, which is worrying.', 'Yemekhane kırkıncı gün üst üste aynı fırın makarnayı çıkardı. Sevmeye başladın, bu endişe verici.'),
        c.t('Someone stole your slippers from the dorm shower. Again.', 'Yurt banyosundan terliklerini yine çaldılar. Bu dönem üçüncü.'),
        c.t('You found an archive of old exams at the photocopy shop. Pure gold.', 'Fotokopicide eski yıllardan kalma çıkmış soru arşivi buldun. Altın değerinde.'),
        c.t('You skipped one lecture and it was the only day the professor took attendance.', 'Bir derse girmedin, hoca da tam o gün yoklama aldı. Devamsızlık sınırındasın.'),
      ][i];
    },
  },
  {
    id: 'campus.probation',
    category: 'school',
    minAge: 16,
    cooldown: 2,
    weight: 200,
    when: (c) => enrolled(c) && !!peekCampus(c.p)?.startYear && peekCampus(c.p)!.gpa < 1.6,
    title: (c) => c.t('You are on academic probation.', 'Akademik uyarı aldın.'),
    text: (c) =>
      c.t(
        `Your GPA is ${gpa(c)}. The letter from the registrar uses the word "dismissal" three times.`,
        `Ortalaman ${gpa(c)}. Öğrenci işlerinden gelen mektupta "ilişik kesme" ifadesi tam üç kez geçiyor.`,
      ),
    choices: [
      {
        id: 'tutor',
        label: (c) => c.t('Hire a tutor', 'Özel ders al'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          bumpGpa(c, 0.45);
          cs(c).probation = false;
          return c.t('A grad student tutored you twice a week. Expensive, but for the first time you understood integrals.', 'Bir yüksek lisans öğrencisinden haftada iki gün özel ders aldın. Pahalıydı ama ilk kez integrali anladın.');
        },
        tone: 'good',
      },
      {
        id: 'promise',
        label: (c) => c.t('Swear you will turn it around', 'Bu dönem toparlayacağına yemin et'),
        resolve: (c) => {
          bumpGpa(c, 0.2);
          c.h.stat('happiness', -3);
          return c.t('You deleted every game from your phone and wrote FOCUS above your desk. It lasted a week, but something changed.', 'Telefonundaki oyunları sildin, masanın üstüne "ODAKLAN" yazdın. Bir hafta dayandın ama bir şeyler değişti.');
        },
      },
      {
        id: 'drop',
        label: (c) => c.t('Drop out', 'Okulu bırak'),
        badge: 'Big change',
        resolve: (c) => {
          const st = cs(c);
          c.p.school = null;
          c.p.schoolYears = 0;
          st.startYear = 0;
          st.probation = false;
          st.dropouts++;
          c.h.stat('happiness', 4);
          return c.t('You dropped out. Some billionaires did too. Statistically, most dropouts are not billionaires.', 'Okulu bıraktın. Bazı milyarderler de bırakmıştı. Gerçi istatistiksel olarak okulu bırakanların çoğu milyarder olmuyor.');
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'campus.internship',
    category: 'work',
    scheduled: true,
    setup: (c) => {
      const st = cs(c);
      const field: JobDef['field'] = c.rng.pick(st.major ? MAJORS[st.major].fields : ['office']);
      c.vars.field = field;
      c.vars.company = c.rng.pick(companiesFor(c.p.countryId)[field]); // Turkish employers in Türkiye only
    },
    title: (c) => c.t(`${c.vars.company} offers you a summer internship.`, `${c.vars.company} sana yaz stajı teklif ediyor.`),
    text: (c) => c.t('The listing promised "real responsibility". You suspect the responsibility is coffee.', 'İlanda "gerçek sorumluluk" yazıyor. Sen o sorumluluğun çay-kahve olduğundan şüpheleniyorsun.'),
    choices: [
      {
        id: 'paid',
        label: (c) => c.t('Take it (paid)', 'Kabul et (ücretli)'),
        resolve: (c) => internship(c, 0.3, wage(c, 1500)),
        tone: 'good',
      },
      {
        id: 'prestige',
        label: (c) => c.t('Push for the prestigious unpaid project', 'Ücretsiz ama prestijli projeye gir'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return internship(c, 0.5, 0);
        },
      },
      {
        id: 'beach',
        label: (c) => c.t('Spend the summer at the beach', 'Yazı sahilde geçir'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('You turned it down and spent the summer at the beach. Your CV is empty, your tan is perfect.', 'Teklifi reddedip yazı sahilde geçirdin. CV bomboş ama bronzluk kusursuz.');
        },
      },
    ],
  },
  {
    id: 'campus.abroad',
    category: 'school',
    scheduled: true,
    setup: (c) => {
      // an exchange semester is abroad: a German student does not get Berlin
      const home = CITY_COUNTRY[c.p.countryId];
      const idx = CITIES.map((_, i) => i)
        .filter((i) => CITIES[i][0] !== home)
        .sort(() => c.rng.next() - 0.5);
      for (let i = 0; i < 3; i++) c.vars[`city${i}`] = idx[i];
    },
    title: (c) => c.t('You were accepted for an exchange semester. Where to?', "Erasmus'a kabul edildin! Nereye gidiyorsun?"),
    text: (c) =>
      c.t(
        `The grant covers some of it. About ${c.h.fmt(wage(c, 1500))} will come out of your pocket.${c.h.relatives('mother').length ? ' Your mother will cover you in prayers.' : ''}`,
        `Hibe masrafın bir kısmını karşılıyor, ${c.h.fmt(wage(c, 1500))} kadarı senden.${c.h.relatives('mother').length ? ' Annen de dualarla destek olacak.' : ''}`,
      ),
    choices: [
      cityChoice(0),
      cityChoice(1),
      cityChoice(2),
      { id: 'stay', label: (c) => c.t('Stay home after all', 'Vazgeç, memlekette kal'), resolve: (c) => c.t('You gave your spot to someone on the waiting list. They sent you a postcard.', 'Yerini yedek listedeki birine bıraktın. Sana kartpostal gönderdi.') },
    ],
  },
  {
    id: 'campus.join_club',
    category: 'school',
    scheduled: true,
    title: (c) => c.t('Club fair! Which one do you sign up for?', 'Kulüp tanıtım günleri! Hangisine yazılıyorsun?'),
    text: (c) => c.t('Every table has free candy and a very enthusiastic second-year.', 'Her masada bedava şeker ve aşırı hevesli bir ikinci sınıf öğrencisi var.'),
    choices: (['debate', 'music', 'sports', 'startup', 'theatre'] as Club[]).map(clubChoice),
  },
  {
    id: 'campus.career_fair',
    category: 'work',
    scheduled: true,
    setup: (c) => {
      const st = cs(c);
      // the stands you saw last time have moved on: different offers each fair (the same job never comes back
      // fair after fair), and only real steps up for someone already working (playtest 3 §2.10)
      const why = fairGap(c);
      const options = [...freshJobs(c)].sort(() => c.rng.next() - 0.5).slice(0, 3);
      options.forEach((j, i) => {
        const lvl = offerLevel(c, j);
        c.vars[`job${i}`] = j.id;
        c.vars[`lvl${i}`] = lvl;
        c.vars[`title${i}`] = titleFor(j, lvl, c.lang);
      });
      st.fairLast = options.map((j) => j.id);
      st.fairYear = c.s.year;
      const count = (st.fairCount ??= {});
      for (const j of options) count[j.id] = (count[j.id] ?? 0) + 1;
      c.vars.why = why;
    },
    title: (c) =>
      c.p.jobId && !c.p.retired
        ? c.t('The career fair is full of companies poaching experienced people.', 'Kariyer fuarı deneyimli eleman avlayan şirketlerle dolu.')
        : c.t('The career fair is full of companies looking for graduates like you.', 'Kariyer fuarı tam senin bölümünden mezun arayan şirketlerle dolu.'),
    text: (c) => {
      switch (String(c.vars.why)) {
        case 'open':
          return c.p.jobId && !c.p.retired
            ? c.t('A few stands could beat your current job. Pick one.', 'Birkaç stant şimdiki işinden iyisini sunabilir. Birini seç.')
            : c.t('Your degree opens doors here. Pick a stand.', 'Diploman burada kapı açıyor. Bir stant seç.');
        case 'seen':
          return c.t('The same stands as last time, with the same brochures. Nothing new for you this year.', 'Geçen seferki standlar, aynı broşürler. Bu yıl sana yeni bir şey yok.');
        case 'top':
          return c.t('Nobody here can offer you more than you already have. You took a lot of free pens.', 'Buradaki kimse sana şimdikinden fazlasını veremiyor. Bol bol bedava kalem topladın.');
        default:
          return c.t('Nobody is hiring for your degree today. You took a lot of free pens.', 'Bugün bölümüne uygun ilan yok. Bol bol bedava kalem topladın.');
      }
    },
    choices: [fairChoice(0), fairChoice(1), fairChoice(2), { id: 'none', label: (c) => c.t('Just take the free pens', 'Sadece bedava kalem topla'), resolve: () => '' }],
  },
  {
    id: 'campus.after_grad',
    category: 'milestone',
    minAge: 18,
    once: true,
    weight: 800,
    when: (c) => free(c) && !!peekCampus(c.p)?.gradYear && peekCampus(c.p)!.gradOffers === 0,
    setup: (c) => {
      const st = cs(c);
      if (st.internOffer) {
        const job = majorJobs(c, [st.internOffer.field], 10).filter((j) => fitsMajor(st.major, j.id) && isCareerUpgrade(c, j, 0))[0];
        if (job) {
          c.vars.offerJob = job.id;
          c.vars.offerTitle = titleFor(job, 0, c.lang);
          c.vars.company = st.internOffer.company;
        }
      }
      const fieldJob = fairJobs(c, 5).filter((j) => offerLevel(c, j) === 0)[0];
      if (fieldJob) {
        c.vars.fieldJob = fieldJob.id;
        c.vars.fieldTitle = titleFor(fieldJob, 0, c.lang);
      }
    },
    title: (c) => c.t('Diploma in hand. Now what?', 'Diploma elinde. Şimdi ne olacak?'),
    text: (c) => c.t('Your relatives have started asking "So, where are you working?" at every dinner.', inTR(c) ? 'Akrabalar her bayram yemeğinde "Eee, nerede çalışıyorsun?" diye sormaya başladı.' : 'Akrabalar her aile yemeğinde "Eee, nerede çalışıyorsun?" diye sormaya başladı.'),
    choices: [
      {
        id: 'offer',
        label: (c) => (c.vars.offerJob ? c.t(`Join ${c.vars.company} as ${aOrAn(String(c.vars.offerTitle))}`, `${c.vars.company} bünyesinde ${c.vars.offerTitle} olarak başla`) : c.t('Internship job offer', 'Stajdan iş teklifi')),
        requires: (c) => !!c.vars.offerJob,
        requiresLabel: 'No opening',
        resolve: (c) => {
          cs(c).gradOffers = 2;
          c.h.setJob(String(c.vars.offerJob));
          c.h.stat('happiness', 8);
          return c.t(`Your internship paid off. ${c.vars.company} hired you as ${aOrAn(c.h.jobTitle() ?? '')} before the ink on your diploma was dry.`, `Staj meyvesini verdi. Diplomanın mürekkebi kurumadan ${c.vars.company} seni ${c.h.jobTitle()} olarak işe aldı.`);
        },
        tone: 'big',
      },
      {
        id: 'work',
        label: (c) => (c.vars.fieldJob ? c.t(`Apply for ${c.vars.fieldTitle} jobs`, `${c.vars.fieldTitle} pozisyonlarına başvur`) : c.t('Hit the job market', 'İş piyasasına atıl')),
        resolve: (c) => {
          cs(c).gradOffers = 2;
          if (c.vars.fieldJob && c.rng.chance(hireChance(c))) {
            c.h.setJob(String(c.vars.fieldJob));
            c.h.stat('happiness', 6);
            return c.t(`Your degree did the talking. You are now ${aOrAn(c.h.jobTitle() ?? '')}.`, `Diploman senin yerine konuştu. Artık ${c.h.jobTitle()} oldun.`);
          }
          c.h.stat('happiness', -2);
          return c.t('You sent out forty CVs. Every job wants five years of experience for an entry-level role.', 'Kırk yere CV gönderdin. Hepsi giriş seviyesi pozisyon için beş yıl tecrübe istiyor.');
        },
      },
      {
        id: 'masters',
        label: (c) => c.t("Do a master's degree", 'Yüksek lisans yap'),
        badge: 'Costs more',
        resolve: (c) => {
          const st = cs(c);
          st.gradOffers = 1;
          if (st.gpa >= 2.5) return startGrad(c, 'masters');
          st.gradOffers = 2;
          return c.t(`Every master's program rejected you. One said your ${gpa(c)} GPA was "brave".`, `Başvurduğun bütün yüksek lisans programları reddetti. Biri ${gpa(c)} ortalaman için "cesur" dedi.`);
        },
      },
      {
        id: 'phd',
        label: (c) => c.t('Go straight to a PhD', 'Direkt doktoraya başvur'),
        requires: (c) => c.p.stats.smarts >= 70,
        requiresLabel: 'Needs Smarts 70+',
        resolve: (c) => {
          const st = cs(c);
          st.gradOffers = 2;
          if (st.gpa >= 3.4 || c.rng.chance(Math.max(0, st.gpa - 2.6))) return startGrad(c, 'phd');
          c.h.stat('happiness', -3);
          return c.t('The PhD committee said you were "promising, but not yet". Academia loves the word "yet".', 'Doktora jürisi "umut vadediyorsun ama henüz değil" dedi. Akademi "henüz" kelimesine bayılır.');
        },
      },
      {
        id: 'break',
        label: (c) => c.t('Take a year off', 'Bir yıl kafa dinle'),
        resolve: (c) => {
          cs(c).gradOffers = 2;
          c.h.stat('happiness', 8);
          return c.t('You took a year off to "find yourself". You found a great café and a mild tan.', 'Kendini bulmak için bir yıl ara verdin. Kendini bulamadın ama harika bir kafe ve hafif bir bronzluk buldun.');
        },
      },
    ],
  },
  {
    id: 'campus.phd_offer',
    category: 'school',
    minAge: 20,
    maxAge: 50,
    once: true,
    weight: 300,
    when: (c) => {
      const st = peekCampus(c.p);
      return free(c) && !!st && st.masters && !st.phd && !st.grad && st.gradOffers === 1;
    },
    title: (c) => c.t('Your thesis advisor wants you to stay for a PhD.', 'Tez danışmanın doktoraya devam etmeni istiyor.'),
    text: (c) => c.t('"Three years, it flies by," says your advisor, who has been in this corridor since 1987.', '"Üç yıl, göz açıp kapayıncaya kadar geçer" diyor danışmanın. Kendisi 1987 yılından beri bu koridorda.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Start the PhD', 'Doktoraya başla'),
        badge: 'Big change',
        resolve: (c) => {
          cs(c).gradOffers = 2;
          return startGrad(c, 'phd');
        },
        tone: 'big',
      },
      {
        id: 'no',
        label: (c) => c.t('Go out into the real world', 'Gerçek dünyaya çık'),
        resolve: (c) => {
          cs(c).gradOffers = 2;
          return c.t('You said no. Your advisor said "you will be back". You hope not.', 'Hayır dedin. Danışmanın "Geri döneceksin" dedi. Umarım dönmezsin.');
        },
      },
    ],
  },
  {
    id: 'campus.phd_crisis',
    category: 'school',
    cooldown: 3,
    weight: 15,
    when: (c) => free(c) && peekCampus(c.p)?.grad === 'phd',
    title: (c) => c.t('Your experiment failed. Again.', 'Deneyin yine çöktü.'),
    text: (c) => c.t('Eighteen months of data, one corrupted hard drive. Your advisor answered your long email with "?"', 'On sekiz aylık veri, bozulan bir harddisk. Danışmanın uzun mailine tek karakterle cevap verdi: "?"'),
    choices: [
      {
        id: 'push',
        label: (c) => c.t('Push through', 'Dişini sık, devam et'),
        resolve: (c) => {
          c.h.stat('health', -4);
          c.h.stat('happiness', -4);
          c.h.stat('smarts', 2);
          return c.t('You redid everything in four months. You are now 40% caffeine.', 'Her şeyi dört ayda baştan yaptın. Vücudunun yüzde kırkı artık kafein.');
        },
      },
      {
        id: 'switch',
        label: (c) => c.t('Switch topics', 'Konu değiştir'),
        resolve: (c) => {
          cs(c).gradYearsLeft += 1;
          c.h.stat('happiness', 3);
          return c.t('You switched topics. One more year, but you actually like the new one.', 'Tez konunu değiştirdin. Bir yıl uzadı ama yeni konuyu gerçekten seviyorsun.');
        },
      },
      {
        id: 'quit',
        label: (c) => c.t('Quit the PhD', 'Doktorayı bırak'),
        badge: 'Big change',
        resolve: (c) => {
          const st = cs(c);
          st.grad = null;
          st.gradYearsLeft = 0;
          c.h.unflag('grad_school');
          c.h.stat('happiness', 6);
          return c.t('You quit the PhD. You sleep eight hours a night now. Your skin is glowing.', 'Doktorayı bıraktın. Artık gecede sekiz saat uyuyorsun. Cildin ışıl ışıl.');
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'campus.academic_offer',
    category: 'work',
    maxAge: 60,
    once: true,
    weight: 300,
    when: (c) => free(c) && !c.p.retired && !!peekCampus(c.p)?.phd && !peekCampus(c.p)!.grad && !isAcademic(c),
    title: (c) => c.t('Your old department has an opening.', 'Eski bölümünde kadro açıldı.'),
    text: (c) => c.t('Lectures, research and an office with a window that does not open. A tech lab is also calling.', 'Ders, araştırma ve penceresi açılmayan bir oda. Bir yandan da bir Ar-Ge laboratuvarı arıyor.'),
    choices: [
      {
        id: 'academia',
        label: (c) => c.t(`Become ${aOrAn(jobTitle0(c, 'academic'))}`, `${jobTitle0(c, 'academic')} ol`),
        resolve: (c) => {
          c.h.setJob('academic');
          c.h.promote();
          c.h.stat('happiness', 6);
          return c.t(`You joined the faculty as ${aOrAn(c.h.jobTitle() ?? '')}. Students now call you "Hoca" with a mix of respect and fear.`, `Fakülteye ${c.h.jobTitle()} olarak katıldın. Öğrenciler artık sana saygı ve korku karışımı bir sesle "Hocam" diyor.`);
        },
        tone: 'big',
      },
      {
        id: 'lab',
        label: (c) => c.t(`Join the lab as ${aOrAn(jobTitle0(c, 'research'))}`, `Laboratuvara ${jobTitle0(c, 'research')} olarak katıl`),
        resolve: (c) => {
          c.h.setJob('research');
          c.h.promote();
          c.h.stat('happiness', 5);
          return c.t(`You took the industry job as ${aOrAn(c.h.jobTitle() ?? '')}. The coffee machine alone was worth it.`, `Özel sektöre ${c.h.jobTitle()} olarak geçtin. Sadece kahve makinesi bile buna değerdi.`);
        },
        tone: 'good',
      },
      { id: 'no', label: (c) => c.t('Not now', 'Şimdi değil'), resolve: (c) => c.t('You said no. Your diploma looks great on the wall anyway.', 'Hayır dedin. Diploma duvarda zaten çok güzel duruyor.') },
    ],
  },
];

function internship(c: Ctx, offerChance: number, pay: number): string {
  const st = cs(c);
  st.internships++;
  c.h.stat('smarts', 2);
  if (pay) c.h.money(pay);
  const company = String(c.vars.company);
  const wantsYou = c.rng.chance(offerChance + st.gpa / 10);
  if (wantsYou) st.internOffer = { company, field: c.vars.field as JobDef['field'] };
  const paid = pay ? c.t(` It paid ${c.h.fmt(pay)}.`, ` Üstüne bir de ${c.h.fmt(pay)} kazandın.`) : '';
  return wantsYou
    ? c.t(`You interned at ${company} and impressed everyone.${paid} They want you back after graduation.`, `${company} stajında herkesi etkiledin.${paid} Mezun olunca seni geri istiyorlar.`)
    : c.t(`You interned at ${company}. You learned a lot, mostly about the printer.${paid}`, `${company} stajını tamamladın. Çok şey öğrendin; çoğu yazıcı hakkındaydı.${paid}`);
}

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'campus_major',
    label: (c) => c.t('Declare your major', 'Bölümünü seç'),
    description: (c) => c.t('Engineering, Medicine, Law, Business, Arts or Education', 'Mühendislik, Tıp, Hukuk, İşletme, Sanat ya da Öğretmenlik'),
    group: 'Campus',
    minAge: 16,
    available: (c) => enrolled(c) && !peekCampus(c.p)?.major,
    run: () => ({ event: 'campus.choose_major' }),
  },
  {
    id: 'campus_study',
    label: (c) => c.t('Study for exams', 'Sınavlara çalış'),
    description: (c) => c.t('+GPA, +Smarts', '+Ortalama, +Zekâ'),
    group: 'Campus',
    minAge: 16,
    perYear: 2,
    available: enrolled,
    run: (c) => {
      bumpGpa(c, 0.12 + c.p.stats.smarts / 1000 + c.rng.next() * 0.08);
      c.h.stat('smarts', c.rng.int(1, 2));
      return say(c, 'campus_study', STUDY);
    },
  },
  {
    id: 'campus_skip',
    label: (c) => c.t('Skip class', 'Dersi as'),
    description: (c) => c.t('+Happiness, −GPA', '+Mutluluk, −Ortalama'),
    group: 'Campus',
    minAge: 16,
    perYear: 2,
    available: enrolled,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 7));
      if (c.rng.chance(0.2)) {
        bumpGpa(c, -0.25);
        return c.t('The professor took attendance for the first time all year. You are one absence away from failing.', 'Hoca bütün dönem ilk kez yoklama aldı. Devamsızlıktan kalmana tek ders kaldı.');
      }
      bumpGpa(c, -0.1);
      return say(c, 'campus_skip', [
        inTR(c)
          ? ['You skipped class and played okey in the cafeteria for three hours.', 'Dersi asıp kantinde üç saat okey oynadın.']
          : ['You skipped class and played cards in the cafeteria for three hours.', 'Dersi asıp kantinde üç saat kâğıt oynadın.'],
        ['You skipped class to see a film in the afternoon. The cinema was empty except for two other students from your class.', 'Dersi asıp öğleden sonra sinemaya gittin. Salonda senden başka sadece sınıftan iki kişi vardı.'],
        ['You skipped a lecture to sleep. Best lecture you ever missed.', 'Dersi asıp uyudun. Kaçırdığın en güzel dersti.'],
        inTR(c)
          ? isCoastal(c.p.city)
            ? ['You skipped class and sat by the water with a simit. No regrets.', 'Dersi asıp sahilde simit yedin. Hiç pişman değilsin.']
            : ['You skipped class and sat in the park with a simit. No regrets.', 'Dersi asıp parkta simit yedin. Hiç pişman değilsin.']
          : ['You skipped class and sat in the park with a coffee. No regrets.', 'Dersi asıp parkta kahve içtin. Hiç pişman değilsin.'],
      ]);
    },
  },
  {
    id: 'campus_allnighter',
    label: (c) => c.t('Pull an all-nighter', 'Sabaha kadar çalış'),
    description: (c) => c.t('++GPA, −Health', '++Ortalama, −Sağlık'),
    group: 'Campus',
    minAge: 16,
    available: enrolled,
    run: (c) => {
      c.h.stat('health', -c.rng.int(4, 6));
      c.h.stat('happiness', -2);
      if (c.rng.chance(0.08)) {
        bumpGpa(c, -0.2);
        return c.t('You studied all night and then slept through the exam.', 'Sabaha kadar çalıştın, sonra sınavı uyuyarak kaçırdın.');
      }
      bumpGpa(c, 0.2 + c.rng.next() * 0.15);
      return say(c, 'campus_allnighter', ALLNIGHTER);
    },
  },
  {
    id: 'campus_club',
    label: (c) => c.t('Join a club', 'Bir kulübe katıl'),
    description: (c) => c.t('Debate, music, sports, startup or theatre', 'Münazara, müzik, spor, girişimcilik ya da tiyatro'),
    group: 'Campus',
    minAge: 16,
    available: (c) => enrolled(c) && (peekCampus(c.p)?.clubs.length ?? 0) < 5,
    run: () => ({ event: 'campus.join_club' }),
  },
  {
    id: 'campus_party',
    label: (c) => c.t('Go to a campus party', 'Kampüs partisine git'),
    description: (c) => c.t('+Happiness, −GPA, who knows', '+Mutluluk, −Ortalama, gerisi sürpriz'),
    group: 'Campus',
    minAge: 17,
    perYear: 2,
    available: (c) => (atUni(c) || inGrad(c)) && free(c),
    run: (c) => {
      const st = cs(c);
      st.parties++;
      c.h.stat('happiness', c.rng.int(5, 9));
      c.h.stat('health', -1);
      if (atUni(c)) bumpGpa(c, -0.05);
      if (c.rng.chance(0.05)) return c.t('Campus security shut the party down. You hid in a wardrobe for forty minutes.', 'Kampüs güvenliği partiyi bastı. Kırk dakika bir dolabın içinde saklandın.');
      if (single(c) && c.rng.chance(0.12)) {
        const them = classmate(c, c.p.gender === 'female' ? 'male' : 'female');
        c.h.addRelation(them, 'partner', c.rng.int(50, 72));
        return c.t(`You met ${them.firstName} at the party. Apparently you are a couple now.`, `Partide ${them.firstName} ile tanıştın. Görünen o ki artık sevgilisiniz.`);
      }
      return say(c, 'campus_party', PARTY);
    },
  },
  {
    id: 'campus_parttime',
    label: (c) => c.t('Work at the campus café', 'Kampüs kafesinde yarı zamanlı çalış'),
    description: (c) => c.t('+Money, −GPA', '+Para, −Ortalama'),
    group: 'Campus',
    minAge: 16,
    available: enrolled,
    run: (c) => {
      const pay = wage(c, 2500);
      c.h.money(pay);
      c.h.stat('happiness', -1);
      bumpGpa(c, -0.05);
      return c.t(`You worked shifts at the campus café and earned ${c.h.fmt(pay)}. You can now make a latte with your eyes closed.`, `Kampüs kafesinde vardiyalara girip ${c.h.fmt(pay)} kazandın. Artık gözü kapalı latte yapabiliyorsun.`);
    },
  },
  {
    id: 'campus_intern',
    label: (c) => c.t('Apply for an internship', 'Staja başvur'),
    description: (c) => c.t('Could turn into a job offer at graduation', 'Mezuniyette iş teklifine dönüşebilir'),
    group: 'Campus',
    minAge: 17,
    available: (c) => enrolled(c) && !!peekCampus(c.p)?.major && c.p.schoolYears >= 1 && (peekCampus(c.p)?.internships ?? 0) < 3,
    run: (c) => {
      const st = cs(c);
      if (c.rng.chance(0.3 + st.gpa / 10 + c.p.stats.smarts / 400 + (st.clubs.includes('startup') ? 0.05 : 0))) return { event: 'campus.internship' };
      return c.t(
        'You sent out fourteen applications. You got thirteen automated rejections and one "we will keep your CV on file".',
        'On dört başvuru yaptın. On üç otomatik ret maili ve bir tane "CV\'nizi havuzumuzda tutacağız" geldi.',
      );
    },
  },
  {
    id: 'campus_abroad',
    label: (c) => c.t('Apply to study abroad', "Erasmus'a başvur"),
    description: (c) => c.t('A semester in another country', 'Avrupa\'da bir dönem'),
    group: 'Campus',
    minAge: 17,
    available: (c) => enrolled(c) && !peekCampus(c.p)?.abroad && c.p.schoolYears >= 1,
    run: (c) => {
      if (c.rng.chance(0.35 + cs(c).gpa / 8)) return { event: 'campus.abroad' };
      return c.t(
        'Your study-abroad application was rejected. The language exam asked for more than "Where is the library?"',
        'Erasmus başvurun reddedildi. Dil sınavında "Where is the library?" dışında pek bir şey yazamadın.',
      );
    },
  },
  {
    id: 'campus_thesis',
    label: (c) => c.t('Work on your thesis', 'Tezine çalış'),
    description: (c) => c.t('+Smarts, maybe a published paper', '+Zekâ, belki bir makale'),
    group: 'Campus',
    minAge: 20,
    perYear: 2,
    available: (c) => inGrad(c) && free(c),
    run: (c) => {
      const st = cs(c);
      c.h.stat('smarts', c.rng.int(1, 3));
      c.h.stat('happiness', -1);
      if (st.grad === 'phd' && st.gradYearsLeft > 1 && c.rng.chance(0.1)) {
        st.gradYearsLeft--;
        return c.t('Breakthrough! Your results finally make sense. You might finish a year early.', 'Büyük buluş! Sonuçların sonunda anlamlı çıktı. Bir yıl erken bitirebilirsin.');
      }
      if (c.rng.chance(0.35)) {
        st.papers++;
        return c.t('Your paper was accepted at a conference. Reviewer 2 was, for once, kind.', 'Makalen bir konferansta kabul edildi. Üç numaralı hakem bu sefer insafa gelmiş.');
      }
      return pickLine(c, [
        ['You wrote 3,000 words and deleted 2,800 of them.', '3.000 kelime yazdın, bunun 2.800 kelimesini sildin.'],
        ['You spent a week formatting citations. You dream in footnotes now.', 'Bir hafta kaynakça düzenledin. Artık rüyanda dipnot görüyorsun.'],
      ]);
    },
  },
  {
    id: 'campus_career_fair',
    label: (c) => c.t('Go to a career fair', 'Kariyer fuarına git'),
    description: (c) => {
      const gap = peekCampus(c.p)?.gradYear && c.p.education === 'university' ? fairGap(c) : 'open';
      if (gap === 'top') return c.t('No stand can beat your current job', 'Hiçbir stant şimdiki işinden iyisini sunmuyor');
      if (gap === 'seen') return c.t('The same stands as last time. Try again next year', 'Geçen seferki standların aynısı. Seneye yine gel');
      if (gap === 'none') return c.t('Nobody is hiring for your degree right now', 'Şu sıralar bölümüne uygun ilan yok');
      return c.t('Jobs that match your degree, better odds', 'Bölümüne uygun ilanlar, daha yüksek şans');
    },
    group: 'Career',
    minAge: 20,
    maxAge: 45,
    // greyed out when no stand could beat the job you have (playtest 3 §2.10), instead of a wasted visit
    available: (c) => free(c) && !c.p.retired && c.p.education === 'university' && !!peekCampus(c.p)?.gradYear && fairGap(c) === 'open',
    run: () => ({ event: 'campus.career_fair' }),
  },
  {
    id: 'campus_publish',
    label: (c) => c.t('Publish a paper', 'Makale yayımla'),
    description: (c) => c.t('Academics only: better promotion odds', 'Akademisyenlere özel: terfi şansı'),
    group: 'Career',
    minAge: 20,
    available: (c) => isAcademic(c) && free(c),
    run: (c) => {
      const st = cs(c);
      if (c.rng.chance(0.3)) {
        c.h.stat('happiness', -3);
        return c.t('Reviewer 2 rejected your paper in two sentences. One of them was "Why?"', 'Üç numaralı hakem makaleni iki cümleyle reddetti. Biri "Neden?" idi.');
      }
      st.papers++;
      if (c.rng.chance(0.15 + (st.phd ? 0.05 : 0)) && c.h.promote()) {
        c.h.stat('happiness', 6);
        return c.t(`Your paper was cited everywhere. You were promoted to ${c.h.jobTitle()}.`, `Makalen her yerde atıf aldı. ${c.h.jobTitle()} oldun.`);
      }
      return c.t(`Your paper came out. Total papers: ${st.papers}. Your mother read the abstract twice.`, `Makalen yayımlandı. Toplam makale sayın: ${st.papers}. Annen özeti iki kez okudu.`);
    },
  },
];

// ------------------------------------------------------------------ yearly tick
/** A graduate always has a real major: an undeclared student is filed under Business, the catch-all degree. */
export const DEFAULT_MAJOR: Major = 'business';

function graduate(c: Ctx) {
  const st = cs(c);
  st.gradYear = c.s.year;
  if (!st.major) st.major = DEFAULT_MAJOR;
  st.grad = null;
  const g = st.gpa;
  const honors: Honors | null = g >= HONORS.summa.min ? 'summa' : g >= HONORS.magna.min ? 'magna' : g >= HONORS.cum.min ? 'cum' : null;
  st.honors = honors;
  const en = majorName('en', st.major);
  const tr = majorName('tr', st.major);
  const gs = fmtGpa(g, c.lang);
  if (honors) {
    c.h.achieve('honors');
    c.h.achieve({ summa: 'summa_cum_laude', magna: 'magna_cum_laude', cum: 'cum_laude' }[honors]);
    c.h.stat('happiness', honors === 'summa' ? 10 : 6);
  }
  if (honors === 'summa') {
    c.h.log(
      c.t(
        `You graduated summa cum laude in ${en} with a ${gs} GPA. You gave the valedictorian speech and only cried once.`,
        `${tr} bölümünden ${gs} ortalamayla, bölüm birincisi olarak mezun oldun. Mezuniyet konuşmasını sen yaptın ve sadece bir kez ağladın.`,
      ),
      'big',
    );
  } else if (honors === 'magna') {
    c.h.log(c.t(`You graduated magna cum laude in ${en} (GPA ${gs}). Your cap flew the highest.`, `${tr} bölümünden ${gs} ortalamayla, yüksek onur belgesiyle mezun oldun. Kepin en yükseğe uçtu.`), 'good');
  } else if (honors === 'cum') {
    // whoever is still there to brag about it (the side of a grandmother is not known: "ninen")
    const [whoEn, whoTr] = grandmaAlive(c) ? ['Your grandmother', 'Ninen'] : motherAlive(c) ? ['Your mother', 'Annen'] : ['Your old neighbour', 'Eski komşun'];
    c.h.log(c.t(`You graduated cum laude in ${en} (GPA ${gs}). ${whoEn} told the whole neighborhood.`, `${tr} bölümünden ${gs} ortalamayla, onur belgesiyle mezun oldun. ${whoTr} bütün mahalleye haber verdi.`), 'good');
  } else if (g < 2) {
    c.h.log(c.t(`You graduated in ${en} with a ${gs} GPA. "C's get degrees" was proven right once again.`, `${tr} bölümünden ${gs} ortalamayla, kıl payı mezun oldun. "Diploma diplomadır" felsefesi bir kez daha kazandı.`));
  } else {
    c.h.log(c.t(`Your final GPA in ${en}: ${gs}. Not bad at all.`, `${tr} bölümünü ${gs} ortalamayla bitirdin. Hiç fena değil.`));
  }
}

function onYear(c: Ctx) {
  const { p, h } = c;
  const existing = peekCampus(p);
  if (!existing && p.school !== 'university') return;

  // --- undergrad: GPA drifts toward what your smarts can sustain
  if (p.school === 'university') {
    const st = ensureEnrolled(c);
    if (p.jailYears > 0) {
      st.gpa = Math.max(0, Math.round((st.gpa - 0.3) * 100) / 100);
    } else {
      const drift = (gpaTarget(p, st) - st.gpa) * 0.25 + (c.rng.next() - 0.5) * 0.2;
      bumpGpa(c, drift);
    }
    if (h.has('scholarship') && st.gpa < 2) {
      h.unflag('scholarship');
      h.log(c.t(`Your GPA fell to ${gpa(c)}. You lost your scholarship.`, `Ortalaman ${gpa(c)} oldu ve bursun kesildi. Bunu eve nasıl söyleyeceğini düşünüyorsun.`), 'bad');
    }
    return;
  }

  const st = existing;
  if (!st) return;

  // --- graduation (the engine sets education when the 4 years are done)
  if (p.education === 'university' && st.startYear && !st.gradYear) graduate(c);
  if (st.gradYear && !st.major) st.major = DEFAULT_MAJOR; // saves from before graduation picked a major

  // --- grad school
  if (st.grad && p.jailYears === 0) {
    if (st.grad === 'masters' && !st.funded) h.money(-wage(c, 4000));
    if (st.grad === 'phd') h.money(wage(c, 12000)); // stipend
    h.stat('smarts', c.rng.int(2, 4));
    st.gradYearsLeft--;
    if (st.gradYearsLeft <= 0) {
      const prog = st.grad;
      st.grad = null;
      st.gradYearsLeft = 0;
      h.unflag('grad_school');
      if (prog === 'masters') {
        st.masters = true;
        h.achieve('masters');
        h.stat('happiness', 6);
        h.log(
          h.relatives('mother').length
            ? c.t("You finished your master's degree. Your thesis was read by three people, one of them your mother.", 'Yüksek lisansını bitirdin. Tezin üç kişi tarafından okundu; biri annendi.')
            : c.t("You finished your master's degree. Your thesis was read by three people, one of them your advisor. Probably.", 'Yüksek lisansını bitirdin. Tezin üç kişi tarafından okundu; biri danışmanındı. Galiba.'),
          'good',
        );
      } else {
        st.phd = true;
        h.achieve('phd');
        h.flag('phd');
        h.stat('happiness', 10);
        h.log(
          c.t(
            `You defended your dissertation. You are now Dr. ${p.lastName}. Relatives will ask you about their back pain anyway.`,
            `Tezini savundun. Artık resmen Dr. ${p.firstName} ${p.lastName}. Akrabalar yine de bel ağrılarını sana danışacak.`,
          ),
          'big',
        );
      }
    }
  }

  // --- academics with a doctorate climb faster
  if (isAcademic(c) && st.phd && p.jailYears === 0 && c.rng.chance(Math.min(0.25, 0.08 + st.papers * 0.02)) && h.promote()) {
    h.log(c.t(`Your publications paid off. You were promoted to ${h.jobTitle()}.`, `Yayınların karşılığını verdi: ${h.jobTitle()} oldun.`), 'good');
  }
}

// ------------------------------------------------------------------ pack
export const campusPack: ContentPack = {
  id: 'campus',
  title: 'Campus',
  description: 'University life: pick a major, chase a 4.0, join clubs, land internships, study abroad and go all the way to a PhD.',
  rating: 'all',
  entitlement: CAMPUS_ENTITLEMENT,
  events: [...events, ...campusMoreEvents],
  activities,
  jobs: [
    {
      id: 'academic',
      titles: ['Research Assistant', 'Lecturer', 'Associate Professor', 'Professor', 'Dean'],
      titlesTr: ['Araştırma Görevlisi', 'Öğretim Görevlisi', 'Doçent', 'Profesör', 'Dekan'],
      education: 'university',
      minSmarts: 75,
      baseSalary: 40000,
      field: 'public',
      packId: 'campus',
    },
    {
      id: 'research',
      titles: ['Junior Researcher', 'Research Scientist', 'Senior Scientist', 'Principal Investigator', 'Research Director'],
      titlesTr: ['Yardımcı Araştırmacı', 'Araştırmacı', 'Kıdemli Araştırmacı', 'Proje Yürütücüsü', 'Ar-Ge Direktörü'],
      education: 'university',
      minSmarts: 78,
      baseSalary: 58000,
      field: 'tech',
      packId: 'campus',
    },
  ],
  onYear,
  lifeTiles: (s) => {
    const p = s.player;
    const st = peekCampus(p);
    const tr = s.lang === 'tr';
    if (p.school === 'university') {
      return [
        { label: tr ? 'Bölüm' : 'Major', value: st?.major ? majorName(s.lang, st.major) : tr ? 'Seçilmedi' : 'Undeclared' },
        { label: tr ? 'Ortalama' : 'GPA', value: st?.startYear ? fmtGpa(st.gpa, s.lang) : '—' },
        { label: tr ? 'Sınıf' : 'Year', value: `${Math.min(4, p.schoolYears + 1)}/4` },
      ];
    }
    if (!st) return [];
    if (st.grad) {
      return [
        { label: tr ? 'Program' : 'Program', value: st.grad === 'phd' ? (tr ? 'Doktora' : 'PhD') : tr ? 'Yüksek lisans' : "Master's" },
        { label: tr ? 'Kalan yıl' : 'Years left', value: String(st.gradYearsLeft) },
      ];
    }
    if (st.gradYear) {
      const deg = st.phd ? (tr ? 'Doktora' : 'PhD') : st.masters ? (tr ? 'Y. lisans' : "Master's") : tr ? 'Lisans' : 'BA';
      return [{ label: tr ? 'Diploma' : 'Degree', value: `${deg} · ${majorName(s.lang, st.major)}` }];
    }
    return [];
  },
  goals: [
    { id: 'campus_honors', label: 'Graduate with honors', labelTr: 'Onur derecesiyle mezun ol', check: (s) => s.player.achievements.includes('honors') },
    { id: 'campus_phd', label: 'Earn a PhD', labelTr: 'Doktoranı tamamla', check: (s) => s.player.achievements.includes('phd') },
  ],
  ribbons: [
    {
      id: 'valedictorian',
      name: 'Valedictorian',
      desc: 'Graduated summa cum laude.',
      nameTr: 'Bölüm Birincisi',
      descTr: 'Üniversiteyi bölüm birincisi olarak bitirdi.',
      test: (_r, p) => p.achievements.includes('summa_cum_laude'),
    },
    {
      id: 'eternal_student',
      name: 'Eternal Student',
      desc: 'Earned a PhD.',
      nameTr: 'Ebedi Öğrenci',
      descTr: 'Doktorasını tamamladı.',
      test: (_r, p) => p.achievements.includes('phd'),
    },
    {
      id: 'party_animal',
      name: 'Party Animal',
      desc: 'Went to 8+ campus parties.',
      nameTr: 'Parti Canavarı',
      descTr: '8+ kampüs partisine gitti.',
      test: (_r, p) => (peekCampus(p)?.parties ?? 0) >= 8,
    },
  ],
};
