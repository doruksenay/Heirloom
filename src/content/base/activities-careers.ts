import type { ActivityDef, Ctx } from '../types';
import { wage } from './util';

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
export const isJob = (c: Ctx, id: string) => c.p.jobId === id && working(c);

/** Age and health window for football trials and scouts. */
export const canTryOut = (c: Ctx) =>
  c.age >= 16 && c.age <= 22 && c.p.stats.health >= 70 && c.p.jailYears === 0 && c.p.jobId !== 'athlete' && !c.h.has('ex_athlete');

/** Who the recruitment office will take. */
export const canEnlist = (c: Ctx) =>
  c.age >= 18 &&
  c.age <= 32 &&
  c.p.school === null &&
  c.p.jailYears === 0 &&
  c.p.criminalRecord === 0 &&
  (c.p.education === 'highschool' || c.p.education === 'university') &&
  c.p.jobId !== 'soldier' &&
  c.p.jobId !== 'officer';

export const careerActivities: ActivityDef[] = [
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
          'Bir defansın bacak arasından topu geçirdin, sonra topa takılıp düştün. Sözleşme yok.',
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
    label: (c) => c.t('Visit the recruitment office', 'Askerlik şubesine uğra'),
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
      if (c.rng.chance(0.3) && c.h.promote()) {
        c.h.stat('happiness', 5);
        return c.t(
          `You framed your certificate. Your boss noticed and promoted you to ${c.h.jobTitle()}.`,
          `Sertifikanı çerçeveletip astın. Patronun da fark etti; artık ${c.h.jobTitle()} oldun.`,
        );
      }
      return line(c, [
        [
          'Twelve weeks of night classes. You passed the exam and fell asleep on the bus home.',
          'On iki hafta akşam dersi. Sınavı geçtin, eve dönerken otobüste uyuyakaldın.',
        ],
        [
          'You got the certificate. The vending machine at the college got most of your money.',
          'Sertifikayı aldın. Paranın çoğunu okulun otomatı yedi.',
        ],
        [
          'The course was useful. The teacher was mostly stories about his boat, but useful.',
          'Kurs faydalıydı. Hoca çoğunlukla teknesini anlattı ama yine de faydalıydı.',
        ],
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
      if (roll < 0.15 && c.h.promote()) {
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
        return c.t(
          `You and ${friend.firstName} hid by the buffet and mocked the keynote. A friendship was born.`,
          `${friend.firstName} ile büfenin yanına saklanıp açılış konuşmasıyla dalga geçtiniz. Bir dostluk doğdu.`,
        );
      }
      c.h.stat('happiness', -1);
      return line(c, [
        [
          'You handed out 40 business cards and got back one, for a plumber.',
          'Kırk kartvizit dağıttın, bir tane geri aldın: bir tesisatçınınki.',
        ],
        [
          'You said "we should grab coffee" nine times. Nobody will grab coffee.',
          'Dokuz kere "Bir kahve içelim" dedin. Kimse kahve içmeyecek.',
        ],
        [
          'You wore your name tag on the wrong side all night. Everyone called you by the wrong name.',
          'Bütün gece yaka kartını ters taktın. Herkes sana başka bir isimle hitap etti.',
        ],
      ]);
    },
  },
];

// ------------------------------------------------------------------ yearly logic

/** Years of service needed for each rank; the officer's last rank (General) is never automatic. */
const RANK_YEARS: Record<string, number[]> = {
  soldier: [0, 3, 7, 12, 18],
  officer: [0, 4, 9, 15, 999],
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
  if (p.jobId === 'officer' && p.jobLevel === 3 && p.jobYears >= 20 && c.rng.chance(0.06 + p.stats.smarts / 1000)) {
    c.h.promote();
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
    while (p.jobLevel < 2 && c.h.promote());
    c.h.promote();
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

const FARM_GOOD: Lines = [
  ['Bumper harvest! The tomatoes alone could feed a town.', 'Bereketli bir hasat! Sadece domatesler bir kasabayı doyurur.'],
  ['Perfect rain, perfect sun. Even the scarecrow looks pleased.', 'Yağmur da güneş de tam kıvamında. Korkuluk bile memnun görünüyor.'],
  ['Hazelnut prices shot up just as you finished picking.', 'Tam toplamayı bitirdiğinde fındık fiyatları uçtu.'],
];
const FARM_BAD: Lines = [
  ['Drought. The field cracked like an old plate.', 'Kuraklık. Tarla eski bir tabak gibi çatladı.'],
  ['A late frost took the blossoms in one night.', 'Geç gelen bir don, çiçekleri tek gecede aldı götürdü.'],
  ['The tractor broke down in the middle of the harvest.', 'Traktör hasadın tam ortasında bozuldu.'],
];
const FISH_GOOD: Lines = [
  ['The anchovies came early and stayed late. Nets full all season.', 'Hamsi erken geldi, geç gitti. Bütün sezon ağlar doldu taştı.'],
  ['A shoal of bluefish found your nets three nights in a row.', 'Bir lüfer sürüsü üç gece üst üste senin ağlarını buldu.'],
  ['Calm seas all season. You barely missed a day.', 'Bütün sezon deniz çarşaf gibiydi. Neredeyse bir gün bile kaçırmadın.'],
];
const FISH_BAD: Lines = [
  ['An empty season. The fish moved somewhere with better weather.', 'Boş bir sezon. Balıklar havası daha güzel bir yere taşınmış.'],
  ['A storm tore your best net. The new one cost a fortune.', 'Fırtına en iyi ağını parçaladı. Yenisi bir servete patladı.'],
  ['The engine died far from shore. The tow was not cheap.', 'Motor açıkta stop etti. Römorkör hiç ucuz değildi.'],
];
const REALTOR_GOOD: Lines = [
  ['You sold a seaside villa to a man who paid in one transfer.', 'Deniz kenarındaki bir villayı tek havaleyle ödeyen bir adama sattın.'],
  ['A whole new apartment block sold out through you.', 'Yeni bir apartmanın bütün daireleri senin üzerinden satıldı.'],
  ['A famous chef bought a restaurant building from you.', 'Ünlü bir şef senden bir restoran binası aldı.'],
];
const REALTOR_BAD: Lines = [
  ['The housing market froze. You showed the same flat 41 times.', 'Konut piyasası dondu. Aynı daireyi tam kırk bir kez gösterdin.'],
  ['A big sale fell through at the title office.', 'Büyük bir satış tapuda son anda bozuldu.'],
];

/** Yearly career logic for base-game jobs (e.g. athletes retiring, military ranks). Called from the base pack's onYear. */
export function careerOnYear(c: Ctx): void {
  const { p } = c;
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
      return seasonYear(c, FARM_GOOD, FARM_BAD, [30, 90], [20, 60], 0.12, 0.1);
    case 'fisher':
      return seasonYear(c, FISH_GOOD, FISH_BAD, [30, 90], [20, 50], 0.12, 0.1);
    case 'realtor':
      return seasonYear(c, REALTOR_GOOD, REALTOR_BAD, [40, 150], [10, 30], 0.2, 0.08);
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
