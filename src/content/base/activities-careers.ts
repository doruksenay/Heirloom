import type { ActivityDef, Ctx } from '../types';
import { rankPromote } from '../../engine/context';
import { PART_TIME_JOBS, atAcademy, careersExt, trRules, wage, workKind, wth } from './util';
import { RANK_RULES, majorOf } from '../../engine/careers';
import { say, sayWith } from './lines';
import { addPerformance, promoteAnyway, yearsAtLevel } from '../../engine/context';
import { isCoastal, seaName } from '../../engine/places';

// v0.7 careers: activities for getting and growing a career, plus the yearly logic for the
// jobs that need more than the engine's salary-and-promotion tick (athletes, the military,
// painters, farmers, fishers, estate agents, pilots).

/** Pick one [en, tr] line with a single rng call, whatever the language. */
export function line(c: Ctx, lines: readonly (readonly [string, string])[]): string {
  const i = c.rng.int(0, lines.length - 1);
  return c.t(lines[i][0], lines[i][1]);
}

/** One step down the ladder (benched athletes, flops). Returns false at the bottom. */
export function demote(c: Ctx): boolean {
  if (!c.p.jobId || c.p.jobLevel <= 0) return false;
  c.p.jobLevel--;
  c.p.jobTitle = c.h.jobTitle();
  return true;
}

const working = (c: Ctx) => !!c.p.jobId && !c.p.retired && c.p.jailYears === 0;

/**
 * Round 7: an ordinary promotion (an event, a course, networking). Ranks that come from years of service and
 * rank exams (careers.ts RANK_RULES: the police, the civil service) never jump this way: false for them.
 */
export const ladderPromote = (c: Ctx): boolean => !RANK_RULES[c.p.jobId ?? ''] && c.h.promote();
export const isJob = (c: Ctx, id: string) => c.p.jobId === id && working(c);

/** Already in a career: any job except an after-school one (a barista can still try out; a surgeon is not scouted). */
export const inCareer = (c: Ctx) => !!c.p.jobId && !PART_TIME_JOBS.has(c.p.jobId);

/**
 * Age and health window for football trials and scouts. Not for someone already in a career, and not
 * alongside a full-time university course: a pro footballer does not also attend lectures.
 */
export const canTryOut = (c: Ctx) =>
  c.age >= 16 &&
  c.age <= 22 &&
  c.p.stats.health >= 70 &&
  c.p.jailYears === 0 &&
  !inCareer(c) &&
  c.p.school !== 'university' &&
  !atAcademy(c) &&
  !c.h.has('ex_athlete');

/** Who the recruitment office will take: not someone who already has a career (a national-team striker does not join as a private). */
export const canEnlist = (c: Ctx) =>
  c.age >= 18 &&
  c.age <= 32 &&
  c.p.school === null &&
  !atAcademy(c) &&
  c.p.jailYears === 0 &&
  c.p.criminalRecord === 0 &&
  (c.p.education === 'highschool' || c.p.education === 'university') &&
  !inCareer(c);

/** A new friend made at an industry event (each line once before any comes back). */
const NETWORK_FRIEND: ((n: string) => readonly [string, string])[] = [
  (n) => [`You and ${n} hid by the buffet and mocked the keynote. A friendship was born.`, `${wth(n)} büfenin yanına saklanıp açılış konuşmasıyla dalga geçtiniz. Bir dostluk doğdu.`],
  (n) => [`You and ${n} were the only two who laughed at the speaker's joke. You have been laughing together since.`, `Konuşmacının esprisine bir tek sen ve ${n} güldünüz. O günden beri birlikte gülüyorsunuz.`],
  (n) => [`${n} rescued you from a man selling software. You owe ${n} a dinner, and a friendship.`, `${n} seni yazılım satmaya çalışan bir adamın elinden kurtardı. Ona bir akşam yemeği ve bir dostluk borçlusun.`],
  (n) => [`You and ${n} both reached for the last pastry. You split it. Now you meet for lunch every month.`, `${wth(n)} son poğaçaya aynı anda uzandınız. Yarı yarıya böldünüz. Artık her ay öğle yemeğinde buluşuyorsunuz.`],
  (n) => [`You and ${n} swapped name tags as a joke and kept it going all afternoon. Nobody noticed. Friends for life.`, `${wth(n)} şakasına yaka kartlarınızı değiştirdiniz ve bütün öğleden sonra öyle dolaştınız. Kimse fark etmedi. Artık can dostsunuz.`],
  (n) => [`You and ${n} skipped the afternoon panels for a long walk and a longer coffee.`, `${wth(n)} öğleden sonraki panelleri ekip uzun bir yürüyüşe ve daha da uzun bir kahveye çıktınız.`],
  (n) => [`${n} sat next to you at the panel and whispered better answers than the panellists. You swapped numbers.`, `${n} panelde yanına oturdu ve konuşmacılardan daha iyi cevapları kulağına fısıldadı. Numaralarınızı değiştiniz.`],
  (n) => [`You and ${n} got stuck in the lift between floors for twenty minutes. You came out friends.`, `${wth(n)} katlar arasında asansörde yirmi dakika mahsur kaldınız. Dost olarak çıktınız.`],
];

/** Round 5: lines for the 'career_mentor' activity. */
const MENTOR_LINES: [string, string][] = [
  ['You showed the new hire the three shortcuts nobody writes down. They wrote them down.', 'Yeni gelene kimsenin yazmadığı üç kestirmeyi gösterdin. O hepsini yazdı.'],
  ['Your trainee made the mistake you made at their age. You let them, then helped them fix it.', 'Çırağın, senin onun yaşındayken yaptığın hatayı yaptı. Yapmasına izin verdin, sonra düzeltmesine yardım ettin.'],
  ['You spent your lunch break explaining how things really work around here. Worth every minute.', 'Öğle arasını buranın gerçekte nasıl işlediğini anlatarak geçirdin. Her dakikasına değdi.'],
  ['The young one asked how you got so good. "Mistakes," you said. "Lots of them."', 'Genç olan, bu kadar iyi olmayı nasıl başardığını sordu. "Hatalarla," dedin. "Bol bol."'],
  ['You reviewed a newcomer\'s first real piece of work. You found one thing to fix and four to praise.', 'Yeni birinin ilk gerçek işine baktın. Düzeltilecek bir, övülecek dört şey buldun.'],
  ['Someone you trained got their first raise and brought you a box of baklava.', 'Yetiştirdiğin biri ilk zammını aldı ve sana bir kutu baklava getirdi.'],
];

export const careerActivities: ActivityDef[] = [
  {
    // round 5: something for the second half of a career
    id: 'career_mentor',
    label: (c) => c.t('Mentor a newcomer', 'Yeni birine yol göster'),
    description: (c) => c.t('Pass on what you know; better performance', 'Bildiklerini aktar; iş performansın artar'),
    group: 'Career',
    minAge: 30,
    hideWhenUnavailable: true,
    available: (c) => !!c.p.jobId && !c.p.retired && c.p.jailYears === 0 && c.p.jobLevel >= 1 && c.p.jobYears >= 4,
    run: (c) => {
      addPerformance(c.p, 4);
      c.h.stat('happiness', 3);
      return say(c, 'career.mentor', MENTOR_LINES);
    },
  },
  {
    id: 'career_trials',
    label: (c) => c.t('Go to open football trials', 'Futbol seçmelerine katıl'),
    description: (c) => c.t('Ages 16–22, Health 70+', '16–22 yaş, Sağlık 70+'),
    group: 'Career',
    minAge: 16,
    maxAge: 22,
    hideWhenUnavailable: true,
    available: canTryOut,
    run: (c) => {
      const odds = 0.15 + (c.p.stats.health - 70) / 100 + c.p.stats.looks / 1000;
      if (c.rng.chance(odds)) {
        c.h.setJob('athlete');
        c.h.stat('happiness', 8);
        return c.t(
          `The coach stopped the drill to ask your name. You signed! New title: ${c.h.jobTitle()}.`,
          `Hoca idmanı durdurup adını sordu. ${c.h.jobTitle()} olarak imzayı attın!`,
        );
      }
      c.h.stat('happiness', -3);
      return line(c, [
        [
          'You ran until you saw stars. The coach said "next year, maybe".',
          'Gözünün önünde yıldızlar uçuşana kadar koştun. Hoca "Belki seneye" dedi.',
        ],
        [
          'You nutmegged a defender and tripped over the ball. No contract.',
          'Bir defans oyuncusuna tünel attın, sonra topa takılıp düştün. Sözleşme yok.',
        ],
        [
          'Two hundred kids, eleven places. You were not one of them this time.',
          'İki yüz çocuk, on bir kontenjan. Bu sefer listede adın yoktu.',
        ],
      ]);
    },
  },
  {
    id: 'career_train',
    label: (c) => c.t('Train hard', 'Sıkı antrenman yap'),
    description: (c) => c.t('Fitness and a starting spot, risk of injury', 'Kondisyon ve forma şansı, sakatlık riski'),
    group: 'Career',
    minAge: 16,
    hideWhenUnavailable: true,
    available: (c) => isJob(c, 'athlete'),
    run: (c) => {
      if (c.rng.chance(0.12)) {
        c.h.stat('health', -6);
        c.h.stat('happiness', -4);
        return c.t(
          'You pulled a hamstring in sprint drills. Physio for a month.',
          'Sürat çalışmasında arka adalen çekti. Bir ay fizyoterapi.',
        );
      }
      c.h.stat('health', 3);
      if (c.rng.chance(0.15) && c.h.promote()) {
        c.h.stat('happiness', 6);
        return c.t(
          `The extra sessions paid off. You were promoted to ${c.h.jobTitle()}.`,
          `Fazladan idmanlar meyvesini verdi. Artık ${c.h.jobTitle()} oldun.`,
        );
      }
      return line(c, [
        [
          'You did shuttle runs until the groundskeeper turned off the lights.',
          'Saha görevlisi ışıkları kapatana kadar mekik koşusu yaptın.',
        ],
        [
          'You took 200 free kicks. The wall dummies are terrified of you.',
          'İki yüz serbest vuruş çektin. Baraj mankenleri artık senden korkuyor.',
        ],
        [
          'Ice bath, protein shake, early night. Your friends say you are no fun now.',
          'Buz banyosu, protein içeceği, erken yatış. Arkadaşların artık hiç eğlenceli olmadığını söylüyor.',
        ],
      ]);
    },
  },
  {
    id: 'career_enlist',
    // a career soldier's application, not the conscripts' askerlik şubesi (review 5 §3.13: shown to a woman in Leeds)
    label: (c) => c.t('Visit the recruitment office', 'Orduya katılmak için başvur'),
    description: (c) => c.t('A career in uniform (ages 18–32)', 'Üniformalı bir kariyer (18–32 yaş)'),
    group: 'Career',
    minAge: 18,
    maxAge: 32,
    hideWhenUnavailable: true,
    available: canEnlist,
    run: () => ({ event: 'base.job_recruiter' }),
  },
  {
    id: 'career_course',
    label: (c) => c.t('Take a night course', 'Akşam kursuna yazıl'),
    description: (c) => c.t('A certificate for your job: +Smarts, maybe a promotion', 'İşine yönelik bir sertifika: +Zekâ, belki terfi'),
    group: 'Career',
    minAge: 18,
    maxAge: 62,
    available: (c) => working(c) && c.p.money >= wage(c, 1200),
    run: (c) => {
      c.h.money(-wage(c, 1200));
      c.h.stat('smarts', 2);
      c.h.stat('health', -1);
      if (c.rng.chance(0.3) && ladderPromote(c)) {
        c.h.stat('happiness', 5);
        return c.t(
          `You framed your certificate. Your boss noticed and promoted you to ${c.h.jobTitle()}.`,
          `Sertifikanı çerçeveletip astın. Patronun da fark etti; artık ${c.h.jobTitle()} oldun.`,
        );
      }
      return say(c, 'career_course', [
        ['Twelve weeks of night classes. You passed the exam and fell asleep on the bus home.', 'On iki hafta akşam dersi. Sınavı geçtin, eve dönerken otobüste uyuyakaldın.'],
        ['You got the certificate. The vending machine at the college got most of your money.', 'Sertifikayı aldın. Paranın çoğunu okulun otomatı yedi.'],
        ['The course was useful. The teacher mostly talked about his boat, but it was useful.', 'Kurs faydalıydı. Hoca çoğunlukla teknesini anlattı ama yine de faydalıydı.'],
        ['You learned a new piece of software and spent the weekend explaining it to people who did not ask.', 'Yeni bir program öğrendin ve hafta sonunu sormayan insanlara anlatarak geçirdin.'],
        ['The course had a group project. You did the project. The group did the presentation.', 'Kursta bir grup ödevi vardı. Ödevi sen yaptın, sunumu grup yaptı.'],
        ['You were the only one who did the reading every week. The teacher started teaching just to you.', 'Her hafta okumaları yapan tek kişi sendin. Hoca sonunda dersi sadece sana anlatmaya başladı.'],
        ['You passed with distinction and celebrated with a whole cake, alone, in the kitchen. Earned.', 'Kursu dereceyle bitirdin ve mutfakta tek başına koca bir pasta yiyerek kutladın. Hak edilmiş.'],
        ['You studied on your lunch breaks for weeks. You now know the syllabus and every sandwich shop nearby.', 'Haftalarca öğle aralarında ders çalıştın. Hem müfredatı hem de yakındaki bütün büfeleri ezberledin.'],
      ]);
    },
  },
  {
    id: 'career_network',
    label: (c) => c.t('Network at an industry event', 'Sektör buluşmasına git'),
    description: (c) => c.t('Business cards, small talk, maybe a break', 'Kartvizit, sohbet, belki bir fırsat'),
    group: 'Career',
    minAge: 20,
    maxAge: 64,
    available: (c) => working(c),
    run: (c) => {
      c.h.money(-wage(c, 150));
      const roll = c.rng.next();
      if (roll < 0.15 && ladderPromote(c)) {
        c.h.stat('happiness', 6);
        return c.t(
          `You shared a taxi with a director. By the end of the ride you had been promoted to ${c.h.jobTitle()}.`,
          `Bir direktörle aynı taksiye bindin. Yolculuğun sonunda ${c.h.jobTitle()} olmuştun.`,
        );
      }
      if (roll < 0.45) {
        const friend = c.h.newPerson({ age: Math.max(20, c.age + c.rng.int(-6, 6)) });
        c.h.addRelation(friend, 'friend', c.rng.int(40, 60));
        c.h.stat('happiness', 3);
        return sayWith(c, 'career_network.friend', NETWORK_FRIEND, friend.firstName);
      }
      c.h.stat('happiness', -1);
      return say(c, 'career_network', [
        ['You handed out 40 business cards and got back one, for a plumber.', 'Kırk kartvizit dağıttın, bir tane geri aldın: bir tesisatçınınki.'],
        ['You said "we should grab coffee" nine times. Nobody will grab coffee.', 'Dokuz kere "Bir kahve içelim" dedin. Kimse kahve içmeyecek.'],
        ['You wore your name tag on the wrong side all night. Everyone called you by the wrong name.', 'Bütün gece yaka kartını ters taktın. Herkes sana başka bir isimle hitap etti.'],
        ['You stood by the coffee for two hours waiting for someone to approach you. Only the coffee did. Many times.', 'İki saat kahvenin yanında birinin sana yaklaşmasını bekledin. Yaklaşan sadece kahve oldu. Defalarca.'],
        ['A man explained your own job to you for twenty minutes. You took his card, out of respect for his stamina.', 'Bir adam yirmi dakika boyunca sana kendi işini anlattı. Bu dayanıklılığa saygıdan kartını aldın.'],
        ['The free lunch was excellent. The networking was not. You are calling it a draw.', 'Bedava öğle yemeği harikaydı. Tanışma kısmı değildi. Berabere sayıyorsun.'],
      ]);
    },
  },
];

// ------------------------------------------------------------------ yearly logic

/** Years of service needed for each rank; the officer's last rank (General) is never automatic. */
const RANK_YEARS: Record<string, number[]> = {
  soldier: [0, 3, 7, 12, 18],
  // round 7: Teğmen 3 years, Üsteğmen 3, Yüzbaşı 6, Binbaşı 5, Yarbay 3, then Albay; Tuğgeneral only by the board (Şûra)
  officer: [0, 3, 6, 12, 17, 20, 999],
};

function retireAthlete(c: Ctx, why: 'age' | 'injury'): void {
  const title = c.h.jobTitle();
  if (c.p.jobLevel >= 2) c.h.flag('athlete_star');
  c.h.setJob(null);
  c.h.flag('ex_athlete');
  c.h.stat('happiness', -5);
  c.h.log(
    why === 'age'
      ? c.t(
          `Your knees filed a formal complaint. You hung up your boots after a career as ${title}.`,
          `Dizlerin resmen şikâyet dilekçesi verdi. ${title} olarak geçen kariyerinin ardından kramponlarını astın.`,
        )
      : c.t(
          `The scan came back. The injury ended your career as ${title}. You kept the boots.`,
          `MR sonucu geldi. Sakatlık ${title} olarak geçen kariyerini bitirdi. Kramponları sakladın.`,
        ),
    'big',
  );
}

function athleteYear(c: Ctx): void {
  const { p } = c;
  if (c.age >= 36 || p.stats.health < 45) return retireAthlete(c, c.age >= 36 ? 'age' : 'injury');
  if (c.age >= 31 && c.rng.chance((c.age - 30) * 0.12)) return retireAthlete(c, 'age');
  // played at least a season: the coaching offer can find them later, however they leave
  c.h.flag('ex_athlete');
  if (p.jobLevel >= 2) c.h.flag('athlete_star');

  // injuries
  if (c.rng.chance(0.12)) {
    const hurt = c.rng.int(4, 14);
    c.h.stat('health', -hurt);
    if (hurt >= 13 && c.rng.chance(0.3)) return retireAthlete(c, 'injury');
    const i = c.rng.int(0, 2);
    const lines: [string, string][] = [
      ['You tore a ligament and spent half the season watching from the stands.', 'Bağların koptu; sezonun yarısını tribünden izledin.'],
      ['A tackle from behind left you on crutches for two months.', 'Arkadan gelen bir müdahale seni iki ay koltuk değneğine mahkûm etti.'],
      ['Your groin injury has its own nickname in the sports pages now.', 'Kasık sakatlığının artık spor sayfalarında kendi lakabı var.'],
    ];
    c.h.log(c.t(lines[i][0], lines[i][1]), 'bad');
  }

  // the season: high variance
  const season = c.rng.next();
  if (season < 0.18) {
    const bonus = wage(c, c.rng.int(4, 20) * 1000 * (p.jobLevel + 1));
    c.h.money(bonus);
    c.h.stat('happiness', 6);
    const up = c.rng.chance(0.5) && c.h.promote();
    c.h.log(
      up
        ? c.t(
            `What a season! ${c.h.fmt(bonus)} in bonuses and a new role: ${c.h.jobTitle()}.`,
            `Ne sezondu ama! Primlerden ${c.h.fmt(bonus)} kazandın ve yeni rolün: ${c.h.jobTitle()}.`,
          )
        : c.t(
            `Your goals carried the team this season. Bonuses: ${c.h.fmt(bonus)}.`,
            `Bu sezon takımı gollerin taşıdı. Hesabına ${c.h.fmt(bonus)} prim yattı.`,
          ),
      'good',
    );
  } else if (season > 0.85) {
    c.h.stat('happiness', -5);
    const down = c.rng.chance(0.4) && demote(c);
    c.h.log(
      down
        ? c.t(
            `A terrible season. You were dropped back to ${c.h.jobTitle()}.`,
            `Berbat bir sezon. Kadrodaki yerin geriledi, yeniden ${c.h.jobTitle()} oldun.`,
          )
        : c.t(
            'A terrible season. The fans whistled every time you touched the ball.',
            'Berbat bir sezon. Topa her dokunuşunda tribünler ıslıkladı.',
          ),
      'bad',
    );
  }
}

function militaryYear(c: Ctx, ladder: number[]): void {
  const { p } = c;
  let target = 0;
  ladder.forEach((years, i) => {
    if (p.jobYears >= years) target = i;
  });
  if (p.jobLevel < target && c.h.promote()) {
    c.h.stat('happiness', 4);
    c.h.log(
      c.t(
        `After ${p.jobYears} years of service, you were promoted to ${c.h.jobTitle()}.`,
        `${p.jobYears} yıllık hizmetin ardından ${c.h.jobTitle()} rütbesine terfi ettin.`,
      ),
      'good',
    );
  }
  // a general's star: only for long-serving colonels, and rarely
  // a structural jump: not limited by the one-promotion-a-year rule
  if (p.jobId === 'officer' && p.jobLevel === 5 && p.jobYears >= 24 && c.rng.chance(0.06 + p.stats.smarts / 1000) && promoteAnyway(c)) {
    c.h.achieve('general');
    c.h.stat('happiness', 10);
    c.h.log(
      c.t("The promotion board chose you. You pinned on a general's star.", 'Şûra seni seçti. Omzuna generallik yıldızını taktın.'),
      'big',
    );
  }
}

const PAINTINGS: [string, string][] = [
  ['Grandmother at the Window', 'Pencerede Babaanne'],
  ['Harbour at Dawn', 'Şafakta Liman'],
  ['Blue Kitchen', 'Mavi Mutfak'],
  ['The Rain Was Ours', 'Yağmur Bizimdi'],
];

function artistYear(c: Ctx): void {
  const { p } = c;
  const chance = c.h.has('breakthrough') ? 0.004 : 0.006 + p.stats.smarts / 8000;
  if (c.rng.chance(chance)) {
    const sale = wage(c, c.rng.int(25, 90) * 1000);
    const i = c.rng.int(0, PAINTINGS.length - 1);
    c.h.flag('breakthrough');
    c.h.money(sale);
    // a structural jump past the one-promotion-a-year rule
    while (p.jobLevel < 2 && promoteAnyway(c));
    promoteAnyway(c);
    c.h.achieve('masterpiece');
    c.h.stat('happiness', 12);
    c.h.log(
      c.t(
        `Breakthrough! A museum bought "${PAINTINGS[i][0]}" for ${c.h.fmt(sale)}. Your new title: ${c.h.jobTitle()}.`,
        `Büyük çıkış! Bir müze "${PAINTINGS[i][1]}" tablonu ${c.h.fmt(
          sale,
        )} karşılığında aldı. Artık ${c.h.jobTitle()} olarak anılıyorsun.`,
      ),
      'big',
    );
    if (!c.h.hasHeirloom('painting') && c.rng.chance(0.4)) {
      c.h.addHeirloom(
        'painting',
        c.t(`The study for "${PAINTINGS[i][0]}"`, `"${PAINTINGS[i][1]}" eskizi`),
        c.t(
          `Painted by ${p.firstName} in ${c.s.year}, the year it all changed.`,
          `${p.firstName} tarafından, her şeyin değiştiği ${c.s.year} yılında yapıldı.`,
        ),
      );
    }
    return;
  }
  if (c.rng.chance(0.2)) {
    const sale = wage(c, c.rng.int(3, 25) * 100);
    const i = c.rng.int(0, 3);
    c.h.money(sale);
    const lines: [string, string][] = [
      [
        `A dentist bought a painting for the waiting room. ${c.h.fmt(sale)}.`,
        `Bir diş hekimi bekleme salonu için bir tablonu aldı. Kazanç: ${c.h.fmt(sale)}.`,
      ],
      [
        `You sold three small canvases at the street fair for ${c.h.fmt(sale)}.`,
        `Sokak pazarında üç küçük tuvalini sattın. Eline ${c.h.fmt(sale)} geçti.`,
      ],
      [
        `A café hung your work and actually sold one. ${c.h.fmt(sale)}!`,
        `Bir kafe eserlerini astı ve gerçekten birini sattı. Tam ${c.h.fmt(sale)}!`,
      ],
      [
        `A couple bought a painting because it matched their sofa. ${c.h.fmt(sale)}. Art is art.`,
        `Bir çift, koltuklarına uyduğu için bir tablonu aldı. Kazanç: ${c.h.fmt(sale)}. Sanat sanattır.`,
      ],
    ];
    c.h.log(c.t(lines[i][0], lines[i][1]));
  }
}

type Lines = readonly (readonly [string, string])[];

/** Good and bad years for farmers, fishers and estate agents. */
function seasonYear(
  c: Ctx,
  good: Lines,
  bad: Lines,
  goodUsd: [number, number],
  badUsd: [number, number],
  goodOdds: number,
  badOdds: number,
): void {
  const roll = c.rng.next();
  const scale = 1 + c.p.jobLevel * 0.3;
  if (roll < goodOdds) {
    const amt = wage(c, c.rng.int(goodUsd[0], goodUsd[1]) * 100 * scale);
    const [en, tr] = good[c.rng.int(0, good.length - 1)];
    c.h.money(amt);
    c.h.stat('happiness', 4);
    c.h.log(c.t(`${en} +${c.h.fmt(amt)}.`, `${tr} Hesabına ${c.h.fmt(amt)} fazladan girdi.`), 'good');
  } else if (roll > 1 - badOdds) {
    const amt = wage(c, c.rng.int(badUsd[0], badUsd[1]) * 100);
    const [en, tr] = bad[c.rng.int(0, bad.length - 1)];
    c.h.money(-amt);
    c.h.stat('happiness', -4);
    c.h.log(c.t(`${en} −${c.h.fmt(amt)}.`, `${tr} Cebinden ${c.h.fmt(amt)} çıktı.`), 'bad');
  }
}

/** Good farm years; hazelnuts only in Turkey. */
const farmGood = (c: Ctx): Lines => [
  ['Bumper harvest! The tomatoes alone could feed a town.', 'Bereketli bir hasat! Sadece domatesler bir kasabayı doyurur.'],
  ['Perfect rain, perfect sun. Even the scarecrow looks pleased.', 'Yağmur da güneş de tam kıvamında. Korkuluk bile memnun görünüyor.'],
  c.p.countryId === 'tr'
    ? ['Hazelnut prices shot up just as you finished picking.', 'Tam toplamayı bitirdiğinde fındık fiyatları uçtu.']
    : ['Grain prices shot up just as you finished the harvest.', 'Tam hasadı bitirdiğinde tahıl fiyatları uçtu.'],
];
const FARM_BAD: Lines = [
  ['Drought. The field cracked like an old plate.', 'Kuraklık. Tarla eski bir tabak gibi çatladı.'],
  ['A late frost took the blossoms in one night.', 'Geç gelen bir don, çiçekleri tek gecede aldı götürdü.'],
  ['The tractor broke down in the middle of the harvest.', 'Traktör hasadın tam ortasında bozuldu.'],
];
/** Good fishing years by place: hamsi and lüfer on Turkish seas, the local sea elsewhere, a lake inland. */
function fishGood(c: Ctx): Lines {
  const sea = seaName(c.p.city, 'en');
  const seaTr = seaName(c.p.city, 'tr');
  if (!isCoastal(c.p.city) || !sea || !seaTr)
    return [
      ['The trout in the lake were biting all season. Nets and lines full.', 'Göldeki alabalıklar bütün sezon oltaya geldi. Ağlar da oltalar da doldu.'],
      ['A record carp came up in your net. The photo is in the local paper.', 'Ağına rekor büyüklükte bir sazan takıldı. Fotoğrafı yerel gazetede.'],
      ['Calm water all season. You barely missed a day.', 'Bütün sezon su çarşaf gibiydi. Neredeyse bir gün bile kaçırmadın.'],
    ];
  const tr = c.p.countryId === 'tr';
  const black = sea === 'the Black Sea' || sea === 'the Bosphorus';
  return [
    tr && black
      ? ['The anchovies came early and stayed late. Nets full all season.', 'Hamsi erken geldi, geç gitti. Bütün sezon ağlar doldu taştı.']
      : c.p.countryId === 'br'
        ? [`The sardines came early to ${sea} and stayed late. Nets full all season.`, `Sardalyalar ${seaTr} kıyılarına erken geldi, geç gitti. Bütün sezon ağlar doldu taştı.`]
        : [`The mackerel came early to ${sea} and stayed late. Nets full all season.`, `Uskumrular ${seaTr} kıyılarına erken geldi, geç gitti. Bütün sezon ağlar doldu taştı.`],
    tr
      ? ['A shoal of bluefish found your nets three nights in a row.', 'Bir lüfer sürüsü üç gece üst üste senin ağlarını buldu.']
      : ['A shoal of sea bass found your nets three nights in a row.', 'Bir levrek sürüsü üç gece üst üste senin ağlarını buldu.'],
    ['Calm seas all season. You barely missed a day.', 'Bütün sezon deniz çarşaf gibiydi. Neredeyse bir gün bile kaçırmadın.'],
  ];
}
const FISH_BAD: Lines = [
  ['An empty season. The fish moved somewhere with better weather.', 'Boş bir sezon. Balıklar havası daha güzel bir yere taşınmış.'],
  ['A storm tore your best net. The new one cost a fortune.', 'Fırtına en iyi ağını parçaladı. Yenisi bir servete patladı.'],
  ['The engine died far from shore. The tow was not cheap.', 'Motor açıkta stop etti. Römorkör hiç ucuz değildi.'],
];
const realtorGood = (c: Ctx): Lines => [
  isCoastal(c.p.city)
    ? ['You sold a seaside villa to a man who paid in one transfer.', 'Deniz kenarındaki bir villayı tek havaleyle ödeyen bir adama sattın.']
    : ['You sold a hillside villa to a man who paid in one transfer.', 'Tepedeki bir villayı tek havaleyle ödeyen bir adama sattın.'],
  ['A whole new apartment block sold out through you.', 'Yeni bir apartmanın bütün daireleri senin üzerinden satıldı.'],
  ['A famous chef bought a restaurant building from you.', 'Ünlü bir şef senden bir restoran binası aldı.'],
];
const REALTOR_BAD: Lines = [
  ['The housing market froze. You showed the same flat 41 times.', 'Konut piyasası dondu. Aynı daireyi tam kırk bir kez gösterdin.'],
  ['A big sale fell through at the title office.', 'Büyük bir satış tapuda son anda bozuldu.'],
];

// ------------------------------------------------------------------ round 4: elections and freelance seasons

/** Years between elections, by job. */
const TERM: Record<string, number> = { politician: 4, muhtar: 5 };

/**
 * Elected jobs (politician, muhtar) climb by winning elections, not by the engine's yearly roll (they are `ranked`).
 * The first election comes after a few years of groundwork; losing a seat drops one rung (never below the first).
 */
function electionYear(c: Ctx): void {
  const p = c.p;
  const term = TERM[p.jobId ?? ''] ?? 4;
  if (p.jobYears < 2 || p.jobYears % term !== 0) return;
  const job = c.h.job();
  if (!job) return;
  const odds = 0.3 + p.stats.smarts / 400 + p.stats.looks / 500 + p.stats.happiness / 600 - p.jobLevel * 0.04 - (p.criminalRecord > 0 ? 0.25 : 0);
  const won = c.rng.chance(Math.max(0.1, Math.min(0.85, odds)));
  const mt = p.jobId === 'muhtar';
  if (won) {
    if (p.jobLevel >= job.titles.length - 1 || !promoteAnyway(c)) {
      c.h.stat('happiness', 4);
      c.h.log(c.t('Election night: you held your seat with a comfortable lead.', 'Seçim gecesi: koltuğunu rahat bir farkla korudun.'), 'good');
      return;
    }
    c.h.stat('happiness', 8);
    c.h.log(
      mt
        ? c.t(`The ballot boxes were opened in the coffeehouse. You won: ${c.h.jobTitle()}.`, `Sandıklar kahvehanede açıldı. Kazandın: artık ${c.h.jobTitle()} sensin.`)
        : c.t(`Election night! You won and became ${c.h.jobTitle()}.`, `Seçim gecesi! Kazandın; artık ${c.h.jobTitle()} oldun.`),
      'big',
    );
    return;
  }
  c.h.stat('happiness', -6);
  const down = p.jobLevel >= 2 && demote(c);
  c.h.log(
    down
      ? c.t(`You lost the election and went back to being ${c.h.jobTitle()}.`, `Seçimi kaybettin; yeniden ${c.h.jobTitle()} oldun.`)
      : mt
        ? c.t('You lost the election by eleven votes. You know exactly which eleven.', 'Seçimi on bir oyla kaybettin. O on bir kişinin kim olduğunu çok iyi biliyorsun.')
        : c.t('You lost the election. You shook the winner\'s hand and started planning the next one.', 'Seçimi kaybettin. Kazananın elini sıktın ve bir sonrakini planlamaya başladın.'),
    'bad',
  );
}

const FREELANCE_GOOD: Record<string, Lines> = {
  writer: [
    ['A book club picked your book and it sold out twice.', 'Bir okuma grubu kitabını seçti; iki baskı tükendi.'],
    ['A film company bought the rights to one of your stories.', 'Bir film şirketi öykülerinden birinin haklarını satın aldı.'],
  ],
  photographer: [
    ['Wedding season was packed: every Saturday booked.', 'Düğün sezonu dopdoluydu: her cumartesi doluydu.'],
    ['A magazine bought one of your photos for its cover.', 'Bir dergi fotoğraflarından birini kapak için satın aldı.'],
  ],
  translator: [
    ['A big publisher sent you three novels in a row.', 'Büyük bir yayınevi art arda üç roman gönderdi.'],
    ['A conference hired you for a week of interpreting.', 'Bir konferans seni bir haftalık sözlü çeviri için tuttu.'],
  ],
  musician: [
    ['Your band played every wedding hall in the district this summer.', 'Grubun bu yaz ilçedeki bütün düğün salonlarında çaldı.'],
    ['A recording studio booked you for a whole album.', 'Bir kayıt stüdyosu seni koca bir albüm için tuttu.'],
  ],
};
const FREELANCE_BAD: Lines = [
  ['A quiet year: two clients went silent and one never paid.', 'Sakin bir yıl: iki müşteri ortadan kayboldu, biri de hiç ödemedi.'],
  ['Your laptop died with a month of work on it. The repair was not cheap.', 'Dizüstü bilgisayarın bir aylık işle birlikte gitti. Tamiri hiç ucuz değildi.'],
];

/** Yearly career logic for base-game jobs (e.g. athletes retiring, military ranks). Called from the base pack's onYear. */
// Round 5/7 state on the player: util.ts CareersExt (p.ext.careers).

/** Lines for losing a clean-record job over a conviction, by work kind ([en, tr], `{t}` = the title). */
const STRUCK_OFF: Record<string, [string, string]> = {
  uniform: ['After your conviction you were dismissed from the service and handed in your badge. Your career as {t} ended at a desk with one form on it.', 'Mahkûmiyetinin ardından meslekten ihraç edildin; kimliğini ve rozetini teslim ettin. {t} olarak kariyerin, üstünde tek bir form olan bir masada bitti.'],
  office: ['The conviction reached HR before you did. Your time as {t} ended with a cardboard box.', 'Mahkûmiyet haberi insan kaynaklarına senden önce ulaştı. {t} olarak geçen günlerin bir karton koliyle bitti.'],
  other: ['A conviction and that job do not go together. You are no longer {t}.', 'Sabıka kaydıyla o iş bir arada olmuyor. Artık {t} değilsin.'],
};

/**
 * Yearly checks for every life (round 5): an older save's graduate gets the major their job implies, and a new
 * conviction costs a job that needs a clean record (review 5 §3.15: a police chief kept the post after three thefts).
 * No RNG.
 */
function careerChecks(c: Ctx): void {
  const { p } = c;
  if (p.major === undefined && p.education === 'university' && !p.school) p.major = majorOf(p);
  const ext = careersExt(c);
  const before = ext.record;
  ext.record = p.criminalRecord;
  if (before === undefined || p.criminalRecord <= before || !p.jobId || p.retired) return;
  const job = c.h.job();
  if (!job?.req?.cleanRecord) return;
  const title = c.h.jobTitle() ?? '';
  const kind = workKind(c);
  const [en, tr] = STRUCK_OFF[kind === 'uniform' || kind === 'office' ? kind : 'other'];
  c.h.setJob(null);
  c.h.stat('happiness', -8);
  c.h.log(c.t(en.replace('{t}', title), tr.replace('{t}', title)), 'bad');
}

export function careerOnYear(c: Ctx): void {
  const { p } = c;
  careerChecks(c);
  trPublicYear(c);
  if (!p.jobId || p.retired) return;
  // athletes retire on time even if something kept them off the pitch
  if (p.jobId === 'athlete' && p.jailYears === 0) return athleteYear(c);
  if (p.jobId === 'athlete' && c.age >= 36) return retireAthlete(c, 'age');
  if (p.jailYears > 0) return;
  switch (p.jobId) {
    case 'soldier':
    case 'officer':
      return militaryYear(c, RANK_YEARS[p.jobId]);
    case 'artist':
      return artistYear(c);
    case 'farmer':
      return seasonYear(c, farmGood(c), FARM_BAD, [30, 90], [20, 60], 0.12, 0.1);
    case 'fisher':
      return seasonYear(c, fishGood(c), FISH_BAD, [30, 90], [20, 50], 0.12, 0.1);
    case 'realtor':
      return seasonYear(c, realtorGood(c), REALTOR_BAD, [40, 150], [10, 30], 0.2, 0.08);
    case 'politician':
    case 'muhtar':
      return electionYear(c);
    case 'police':
    case 'civil_servant':
      return rankYear(c);
    case 'writer':
    case 'photographer':
    case 'translator':
    case 'musician':
      return seasonYear(c, FREELANCE_GOOD[p.jobId], FREELANCE_BAD, [20, 80], [10, 30], 0.15, 0.1);
    case 'pilot':
      if (p.stats.health < 40) {
        const title = c.h.jobTitle();
        c.h.setJob(null);
        c.h.stat('happiness', -8);
        c.h.log(
          c.t(
            `You failed your flight medical. Your career as ${title} is grounded.`,
            `Uçuş sağlık muayenesinden geçemedin. ${title} olarak kariyerin yere indi.`,
          ),
          'bad',
        );
      }
      return;
    default:
      return;
  }
}

// ------------------------------------------------------------------ round 7: Türkiye's public sector

const clamp01 = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
/** The Türkiye pack's askerlik record (p.ext.culture_tr), read and written without importing the pack. */
const trAsker = (c: Ctx) => ((c.p.ext ??= {}).culture_tr ??= {}) as { asker?: string; tecilYear?: number };

/**
 * Yearly, before the job logic:
 * - no full-time job alongside full-time study (review 6 §3.7: a pro footballer studying medicine): a student who
 *   still holds one leaves it;
 * - the two-year police school (PMYO) ends: the graduate starts as Polis Memuru;
 * - in Türkiye a career in uniform (police, soldier, officer) settles the military service: no call-up papers later.
 */
function trPublicYear(c: Ctx): void {
  const { p } = c;
  const ext = careersExt(c);
  if (p.jobId && !p.retired && !PART_TIME_JOBS.has(p.jobId) && (p.school === 'university' || ext.academy !== undefined)) {
    const title = c.h.jobTitle() ?? '';
    c.h.setJob(null);
    c.h.log(
      p.school === 'university'
        ? c.t(`A full-time degree and a full-time job do not fit in one week. You left your job as ${title} to study.`, `Örgün eğitimle tam zamanlı iş aynı haftaya sığmadı. Okula odaklanmak için ${title} olarak çalıştığın işten ayrıldın.`)
        : c.t(`You left your job as ${title} for the police school.`, `Polis okulu için ${title} olarak çalıştığın işten ayrıldın.`),
    );
  }
  if (ext.academy !== undefined && c.s.year - ext.academy >= 2 && p.jailYears === 0) {
    ext.academy = undefined;
    ext.pmyo = true;
    c.h.setJob('police');
    c.h.stat('happiness', 8);
    c.h.log(
      c.t(
        `Graduation day at the police school: caps in the air, and your first posting. You start as ${c.h.jobTitle()}.`,
        `Polis okulunda mezuniyet günü: kepler havaya uçtu, ilk tayinin çıktı. ${c.h.jobTitle()} olarak göreve başlıyorsun.`,
      ),
      'big',
    );
  }
  if (trRules(c) && p.gender === 'male' && p.jobId && ['police', 'soldier', 'officer'].includes(p.jobId)) {
    const st = trAsker(c);
    if (!st.asker) st.asker = p.jobId === 'officer' ? 'subay' : 'er';
  }
}

/** Rank exams and appointments by job and language: [pass EN, pass TR, fail EN, fail TR]; `{t}` = the new title. */
const RANK_EXAM: Record<string, [string, string, string, string]> = {
  police_tr0: [
    'You passed the officer-training exam (PAEM). After the course you pinned on your new rank: {t}.',
    'PAEM sınavını kazandın. Eğitimin ardından yeni rütbeni taktın: {t}.',
    'You sat the officer-training exam (PAEM) and missed the cut by a few points. Next year.',
    "PAEM sınavına girdin, birkaç puanla kaçırdın. Seneye yine gireceksin.",
  ],
  police: [
    'You passed the rank exam and the promotion board. New rank: {t}.',
    'Rütbe terfi sınavını ve kurulu geçtin. Yeni rütben: {t}.',
    'You sat the rank exam and fell short of the pass mark. Your file waits for next year.',
    'Rütbe terfi sınavında baraj puanının altında kaldın. Dosyan seneye kaldı.',
  ],
  civil_servant: [
    'You passed the internal promotion exam (görevde yükselme). You are now {t}.',
    'Görevde yükselme sınavını kazandın. Artık {t} oldun.',
    'You sat the internal promotion exam. Forty people, two posts; you were sixth.',
    'Görevde yükselme sınavına girdin. Kırk kişi, iki kadro; sen altıncı oldun.',
  ],
};

/**
 * Police and civil-service ranks (careers.ts RANK_RULES): years at the rung first, then a rank exam, an appointment
 * or plain seniority. In Türkiye a police officer needs a degree to become Komiser Yardımcısı: a high-school officer
 * finishes an open-university degree (Açıköğretim) after some years. At most one rng call a year.
 */
function rankYear(c: Ctx): void {
  const { p } = c;
  const rules = RANK_RULES[p.jobId ?? ''];
  const step = rules?.[p.jobLevel];
  if (!step) return;
  const yrs = yearsAtLevel(c.s);
  if (yrs < step.years) return;
  const tr = trRules(c);
  const police = p.jobId === 'police';
  if (step.degree && p.education !== 'university' && (tr || !police)) {
    // the open-university route: one roll a year after five years at the rung
    if (yrs >= 5 && c.rng.chance(0.12 + p.stats.smarts / 1000)) {
      p.education = 'university';
      if (!p.major) p.major = 'business';
      c.h.stat('smarts', 2);
      c.h.log(
        c.t('Evenings and weekends paid off: you finished an open-university degree (Açıköğretim). The next rank is open to you now.', 'Akşamların ve hafta sonların boşa gitmedi: Açıköğretimden lisans diplomanı aldın. Bir üst rütbenin yolu artık açık.'),
        'good',
      );
    }
    return;
  }
  const odds = step.exam ? clamp01(0.3 + (p.stats.smarts - 50) / 100 + (yrs - step.years) * 0.05, 0.1, 0.85) : step.appoint !== undefined ? step.appoint + p.stats.smarts / 1000 : 1;
  const pass = odds >= 1 || c.rng.chance(odds);
  const key = police && tr && p.jobLevel === 0 ? 'police_tr0' : (p.jobId as string);
  if (pass) {
    if (!rankPromote(c)) return;
    c.h.stat('happiness', 6);
    const t = c.h.jobTitle() ?? '';
    if (step.exam) {
      const m = RANK_EXAM[key];
      c.h.log(c.t(m[0].replace('{t}', t), m[1].replace('{t}', t)), 'good');
    } else if (step.appoint !== undefined) {
      c.h.log(c.t(`The ministry's decree came: you were appointed ${t}.`, `Bakanlık kararnamesi çıktı: ${t} olarak atandın.`), 'good');
    } else {
      c.h.log(c.t(`After ${yrs} years at your rank you were promoted to ${t}.`, `Rütbende ${yrs} yılı doldurdun ve ${t} rütbesine terfi ettin.`), 'good');
    }
    return;
  }
  // a failed exam is news the first time, then every other year
  if (step.exam && (yrs - step.years) % 2 === 0) {
    const m = RANK_EXAM[key];
    c.h.stat('happiness', -2);
    c.h.log(c.t(m[2], m[3]), 'bad');
  }
}

/** The KPSS: a 0–100 score from smarts, a degree and practice; one rng call. */
function kpssRun(c: Ctx): string {
  const ext = careersExt(c);
  const practice = ext.kpss !== undefined ? 4 : 0;
  const score = clamp01(Math.round(28 + c.p.stats.smarts * 0.55 + (c.p.education === 'university' ? 6 : 0) + practice + c.rng.int(-8, 8)), 20, 99);
  ext.kpss = score;
  ext.kpssYear = c.s.year;
  c.h.stat('smarts', 2);
  c.h.stat('happiness', -2);
  const v: [string, string] =
    score >= 85
      ? ['Every post is open, the foreign service included.', 'Dışişleri dahil bütün kadrolar açık.']
      : score >= 72
        ? ['Enough for civil-service (memur) and state teaching posts.', 'Memurluk ve öğretmenlik kadroları için yeterli.']
        : score >= 60
          ? ['Enough for posts such as bekçi, prison officer or the post office; a little short for memur.', 'Bekçilik, infaz koruma ve PTT gibi kadrolara yeter; memurluk için biraz kısa.']
          : ['Not enough for a state post. You can sit it again next year.', 'Bu puanla kadro zor. Seneye yeniden girebilirsin.'];
  return c.t(`You sat the KPSS and scored ${score}. ${v[0]} The score counts for two years.`, `KPSS'ye girdin ve ${score} puan aldın. ${v[1]} Puanın iki yıl geçerli.`);
}

const PMYO_FAIL: [string, string][] = [
  ['You passed the written exam for the police school, then could not get over one wall on the fitness course. Next year.', 'Polis okulunun yazılı sınavını geçtin ama fiziki yeterlilik parkurunda bir duvarı aşamadın. Seneye yine denersin.'],
  ['The police school took four hundred out of nine thousand applicants. You were not among them this year.', 'Polis okulu dokuz bin adaydan dört yüzünü aldı. Bu yıl aralarında yoktun.'],
  ['You made it to the interview at the police school, and went blank when they asked why you wanted the job.', 'Polis okulunda mülakata kadar geldin; "Neden polis olmak istiyorsun?" sorusunda aklın durdu.'],
];

/** Türkiye's public-sector activities: the KPSS and the police school (PMYO). Registered with the career activities. */
const trCareerActivities: ActivityDef[] = [
  {
    id: 'career_kpss',
    label: (c) => c.t('Sit the civil service exam (KPSS)', "KPSS'ye gir"),
    description: (c) => c.t('Memur and state teaching posts need it; a score counts for two years', 'Memurluk ve öğretmenlik kadroları için; puan iki yıl geçerli'),
    group: 'Career',
    minAge: 18,
    maxAge: 50,
    hideWhenUnavailable: true,
    available: (c) => trRules(c) && c.p.jailYears === 0 && !c.p.retired && c.p.school === null && !atAcademy(c) && (c.p.education === 'highschool' || c.p.education === 'university'),
    run: kpssRun,
  },
  {
    id: 'career_police_school',
    label: (c) => c.t('Apply to the police school (PMYO)', 'Polis okuluna (PMYO) başvur'),
    description: (c) => c.t('Two years of training, then a post as a police officer (ages 18–25)', 'İki yıl eğitim, ardından polis memurluğu (18–25 yaş)'),
    group: 'Career',
    minAge: 18,
    maxAge: 25,
    hideWhenUnavailable: true,
    available: (c) => {
      const ext = c.p.ext?.careers as { academy?: number; pmyo?: boolean } | undefined;
      return (
        trRules(c) &&
        c.p.jailYears === 0 &&
        c.p.criminalRecord === 0 &&
        c.p.school === null &&
        c.p.education === 'highschool' &&
        c.p.stats.health >= 50 &&
        c.p.jobId !== 'police' &&
        ext?.academy === undefined &&
        !ext?.pmyo
      );
    },
    run: (c) => {
      const odds = clamp01(0.25 + (c.p.stats.smarts - 40) / 150 + (c.p.stats.health - 50) / 200, 0.1, 0.75);
      if (!c.rng.chance(odds)) {
        c.h.stat('happiness', -3);
        return say(c, 'career.pmyo_fail', PMYO_FAIL);
      }
      const ext = careersExt(c);
      ext.academy = c.s.year;
      const left = c.p.jobId ? c.h.jobTitle() : null;
      if (c.p.jobId) c.h.setJob(null);
      c.h.stat('happiness', 6);
      let en = 'You got into the police school (PMYO)! Two years of boarding, roll call at six and a uniform you will learn to iron.';
      let tr = "Polis Meslek Yüksekokulu'nu kazandın! İki yıl yatılı eğitim, sabah altıda içtima ve ütülemeyi öğreneceğin bir üniforma seni bekliyor.";
      if (left) {
        en += ` You handed in your notice as ${left}.`;
        tr += ` ${left} olarak çalıştığın işten ayrıldın.`;
      }
      const st = trAsker(c) as { asker?: string; tecilYear?: number; retake?: number };
      st.retake = undefined; // no second YKS: the police school is the road taken
      if (c.p.gender === 'male' && !st.asker) {
        // a student's call-up waits until the school is over
        st.tecilYear = Math.max(st.tecilYear ?? 0, c.s.year + 2);
        en += ' Your military service is postponed while you study.';
        tr += ' Okul süresince askerliğin ertelendi.';
      }
      return c.t(en, tr);
    },
  },
];
careerActivities.push(...trCareerActivities);
