import type { ChoiceDef, Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { firstNames } from '../../engine/world';
import { acc, cap, familyFirstNames, gen, kin, wage, wth } from './util';
import { inTr, isAbroad } from './events-flavour';
import { afford, num } from './adult-kit';

// Round 7 (review 6 §3.12): your children's lives happen on screen. Their school report (karne), the exam year
// (YKS), the send-off to military service, the evening the families meet (kız isteme) and the wedding, or a school
// report, exams and a wedding outside Türkiye. A child is "settled" (married or living with a partner) before any
// grandchild comes: the wedding events mark it, and a quiet log line marries anyone the events missed (no rng), so
// the grandchild line never arrives out of nowhere. engine/game.ts asks kidSettled before a grandchild is born.
//
// Flags (on the player): kid_wed:<id> married or partnered, kid_engaged:<id> after kız isteme, kid_asker:<id> seen
// off to the army, kid_exam:<id> exam year done, kid_karne:<id> a report shown.

const WED = 'kid_wed:';
const ENGAGED = 'kid_engaged:';

/** A stable small number from a person id, for choices that must not use the rng (the fallback wedding). */
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Married or living with a partner, as far as the player has seen. Children who already have children count. */
export function kidSettled(c: Ctx, kid: Person): boolean {
  return c.h.has(WED + kid.id) || (kid.kids ?? 0) > 0 || (kid.childIds?.length ?? 0) > 0;
}

/** A grandchild may come: the child settled in an earlier year (not the wedding year itself), or already has children. */
export function kidReadyForBaby(c: Ctx, kid: Person): boolean {
  if ((kid.kids ?? 0) > 0 || (kid.childIds?.length ?? 0) > 0) return true;
  const y = c.p.flags[WED + kid.id];
  return y !== undefined && y < c.s.year;
}

/** The age the fallback wedding comes at: 24–29, fixed per child. */
const wedAge = (kid: Person) => 24 + (hashId(kid.id) % 6);

/** A name for the child's partner without the rng (fallback line), from the player's country, never a family name. */
function partnerNameFor(c: Ctx, kid: Person): string {
  const names = firstNames(c.p.countryId, kid.gender === 'female' ? 'male' : 'female');
  const taken = familyFirstNames(c);
  const start = hashId(kid.id + 'p') % names.length;
  for (let i = 0; i < names.length; i++) {
    const n = names[(start + i) % names.length];
    if (!taken.has(n)) return n;
  }
  return names[start];
}

/** A partner name picked with the rng (events), never a family name; the same single rng call either way. */
function pickPartnerName(c: Ctx, kid: Person | undefined): string {
  const names = firstNames(c.p.countryId, kid?.gender === 'female' ? 'male' : 'female');
  const taken = familyFirstNames(c);
  const i = c.rng.int(0, names.length - 1);
  for (let j = 0; j < names.length; j++) {
    const n = names[(i + j) % names.length];
    if (!taken.has(n)) return n;
  }
  return names[i];
}

/** Living children, by age, who are not abroad (events) or anywhere (the fallback). */
const kidsIn = (c: Ctx, lo: number, hi: number, test: (k: Person) => boolean = () => true) =>
  c.h
    .relatives('child')
    .map((r) => r.person)
    .filter((k) => k.deathYear === undefined && c.h.ageOf(k) >= lo && c.h.ageOf(k) <= hi && !isAbroad(c, k.id) && test(k));

const kidOf = (c: Ctx): Person => c.h.person(String(c.vars.pid));
const kn = (c: Ctx) => kidOf(c)?.firstName ?? '';
/** "Oğlun Kaan" / "your son Kaan". */
const kidWho = (c: Ctx): [string, string] => {
  const k = kidOf(c);
  const en = kin({ ...c, lang: 'en' }, k, 'child');
  const tr = kin({ ...c, lang: 'tr' }, k, 'child');
  return [`your ${en} ${k.firstName}`, `${tr} ${k.firstName}`];
};
const Who = (c: Ctx) => {
  const [en, tr] = kidWho(c);
  return c.t(cap(en), cap(tr));
};
const flagKid = (c: Ctx, prefix: string) => c.h.flag(prefix + String(c.vars.pid));
const closer = (c: Ctx, d: number) => c.h.closeness(String(c.vars.pid), d);

/** One event about one child aged lo..hi who passes `test`; picks the child in setup (one rng call). */
function kidMoment(id: string, lo: number, hi: number, test: (c: Ctx, k: Person) => boolean, def: Omit<EventDef, 'id' | 'category' | 'when' | 'setup'> & { setup?: (c: Ctx) => void; when?: (c: Ctx) => boolean }): EventDef {
  const extra = def.setup;
  const when = def.when;
  return {
    category: 'family',
    minAge: 25,
    weight: 9,
    cooldown: 2,
    maxPerLife: 4,
    ...def,
    id,
    when: (c) => c.p.jailYears === 0 && kidsIn(c, lo, hi, (k) => test(c, k)).length > 0 && (when ? when(c) : true),
    setup: (c) => {
      const ks = kidsIn(c, lo, hi, (k) => test(c, k));
      c.vars.pid = ks.length ? c.rng.pick(ks).id : '';
      extra?.(c);
    },
  };
}

const label = (en: string, tr: string, more: Partial<ChoiceDef> = {}) => ({ label: (c: Ctx) => c.t(en, tr), ...more });

export const kidMilestoneEvents: EventDef[] = [
  // ------------------------------------------------ the school report (karne)
  kidMoment('base.km_karne', 7, 13, (c, k) => !c.h.has(`kid_karne:${k.id}`), {
    setup: (c) => {
      const k = kidOf(c);
      c.vars.band = k ? (k.stats.smarts >= 72 ? 2 : k.stats.smarts >= 52 ? 1 : 0) : 1;
      c.vars.amt = wage(c, 300);
    },
    title: (c) =>
      inTr(c)
        ? c.t(`${Who(c)} brought home the end-of-year report.`, `${Who(c)} karnesini getirdi.`)
        : c.t(`${Who(c)} brought home a school report.`, `${Who(c)} okul karnesini getirdi.`),
    text: (c) => {
      const b = Number(c.vars.band);
      const n = kn(c);
      if (inTr(c))
        return b === 2
          ? c.t(`A certificate of high achievement. ${n} opened it before even taking off ${kidOf(c).gender === 'female' ? 'her' : 'his'} shoes.`, `Takdir belgesi almış. ${n} karneyi daha ayakkabılarını çıkarmadan açıp gösterdi.`)
          : b === 1
            ? c.t(`A certificate of merit. ${n} shows it with one thumb over the maths grade.`, `Teşekkür belgesi almış. ${n} karneyi matematik notunu başparmağıyla kapatarak gösteriyor.`)
            : c.t(`No certificate this year. The report came out of the bottom of the bag, crumpled.`, `Bu yıl belge yok. Karne çantanın en dibinden, buruşuk çıktı.`);
      return b === 2
        ? c.t(`Top marks in almost everything. The teacher wrote "a joy to teach".`, `Neredeyse her dersten en yüksek not. Öğretmen "Ders anlatması keyif veren bir öğrenci" yazmış.`)
        : b === 1
          ? c.t(`Good marks, one subject you do not talk about, and "could try harder" in the margin.`, `İyi notlar, adı anılmayan bir ders ve kenarda "Biraz daha çabalayabilir" notu.`)
          : c.t(`The report came out of the bottom of the bag, crumpled. The teacher wrote "has potential".`, `Karne çantanın en dibinden, buruşuk çıktı. Öğretmen "Potansiyeli var" yazmış.`);
    },
    choices: [
      {
        id: 'bike',
        label: (c) => c.t(`Buy the bike you promised (${c.h.fmt(num(c))})`, `Söz verdiğin bisikleti al (${c.h.fmt(num(c))})`),
        requires: (c) => afford(c, num(c)),
        requiresLabel: 'Not enough money',
        tone: 'good',
        resolve: (c) => {
          flagKid(c, 'kid_karne:');
          c.h.money(-num(c));
          closer(c, 6);
          c.h.stat('happiness', 3);
          return c.t(`${kn(c)} rode that bike up and down the street all summer and came home only to eat.`, `${kn(c)} bütün yaz o bisikletle sokağın başından sonuna gidip geldi; eve sadece yemek yemeye uğradı.`);
        },
      },
      {
        id: 'praise',
        ...label('Hug them and say well done', 'Sarıl, aferin de'),
        resolve: (c) => {
          flagKid(c, 'kid_karne:');
          closer(c, 4);
          c.h.stat('happiness', 2);
          return Number(c.vars.band) === 0
            ? c.t(`You looked at the effort, not the marks. ${kn(c)} relaxed and promised to read over the summer. Two books, in the end.`, `Notlara değil, çabaya baktın. ${kn(c)} rahatladı ve yazın kitap okuyacağına söz verdi. Sonunda iki kitap okudu.`)
            : c.t(`You said well done and meant it. The report spent the summer on the fridge door.`, `Aferin dedin, içten de dedin. Karne bütün yaz buzdolabının kapağında asılı kaldı.`);
        },
      },
      {
        id: 'more',
        ...label('Ask why it is not better', 'Neden daha iyi değil diye sor'),
        resolve: (c) => {
          flagKid(c, 'kid_karne:');
          closer(c, -5);
          return c.t(`The joy went out of the evening right there. ${kn(c)} went to bed early, and you wished you had not asked.`, `Karnenin keyfi orada kaçtı. ${kn(c)} erkenden yattı; sen de sorduğuna pişman oldun.`);
        },
      },
    ],
  }),

  // ------------------------------------------------ the exam year (YKS in Türkiye): decides whether they study on
  kidMoment('base.km_exam', 17, 18, (c, k) => !c.h.has(`kid_exam:${k.id}`) && !k.education, {
    weight: 14,
    setup: (c) => {
      const k = kidOf(c);
      const sm = k?.stats.smarts ?? 50;
      c.vars.pass = c.rng.chance(Math.min(0.92, Math.max(0.2, (sm - 20) / 70))) ? 1 : 0;
      c.vars.amt = wage(c, 2500);
    },
    title: (c) =>
      inTr(c)
        ? c.t(`${Who(c)} has the university entrance exam (YKS) results.`, `${Who(c)} YKS sonuçlarını öğrendi.`)
        : c.t(`${Who(c)} has the final exam results.`, `${Who(c)} bitirme sınavlarının sonuçlarını öğrendi.`),
    text: (c) =>
      Number(c.vars.pass)
        ? inTr(c)
          ? c.t(`A place at university. The neighbours started ringing the bell to congratulate you before ${kn(c)} had finished reading.`, `Bir üniversiteye yerleşti. ${kn(c)} sonucu okumayı bitirmeden komşular tebrik için kapıyı çalmaya başladı.`)
          : c.t(`Good enough for university. ${kn(c)} read the email four times to be sure.`, `Üniversiteye yetecek kadar iyi. ${kn(c)} emin olmak için e-postayı dört kez okudu.`)
        : inTr(c)
          ? c.t(`Not enough for anything ${kn(c)} wanted. The bedroom door has been shut since the morning.`, `${kn(c)} istediği hiçbir bölümü tutturamadı. Sabahtan beri odasının kapısı kapalı.`)
          : c.t(`Not the grades ${kn(c)} needed. The bedroom door has been shut since the morning.`, `${kn(c)} istediği notları alamadı. Sabahtan beri odasının kapısı kapalı.`),
    choices: [
      {
        id: 'support',
        label: (c) =>
          Number(c.vars.pass)
            ? c.t(`Rent a room near the university for them (${c.h.fmt(num(c))})`, `Okulun yanında ona bir ev tut (${c.h.fmt(num(c))})`)
            : c.t(`Pay for another year of preparation (${c.h.fmt(num(c))})`, `Bir yıl daha hazırlansın, dershaneyi sen öde (${c.h.fmt(num(c))})`),
        requires: (c) => afford(c, num(c)),
        requiresLabel: 'Not enough money',
        tone: 'good',
        resolve: (c) => {
          flagKid(c, 'kid_exam:');
          c.h.money(-num(c));
          closer(c, 6);
          const k = kidOf(c);
          if (k) k.education = 'university';
          return Number(c.vars.pass)
            ? c.t(`You carried the boxes up three floors and fixed a wobbly shelf. ${kn(c)} called the first night "just to say the shelf is fine".`, `Kolileri üç kat yukarı taşıdın, sallanan bir rafı sabitledin. ${kn(c)} ilk gece "Raf sağlam, haber vereyim dedim" diye aradı.`)
            : c.t(`A year of practice tests, then a place at university. ${kn(c)} says the second try was the real one.`, `Bir yıl deneme sınavı, sonra bir üniversite. ${kn(c)} asıl sınavın ikincisi olduğunu söylüyor.`);
        },
      },
      {
        id: 'own_way',
        label: (c) =>
          Number(c.vars.pass) ? c.t('Let them manage on a student budget', 'Yurtta kalsın, kendi yağıyla kavrulsun') : c.t('Back them into a trade instead', 'Bir meslek öğrensin, arkasında dur'),
        resolve: (c) => {
          flagKid(c, 'kid_exam:');
          closer(c, 3);
          const k = kidOf(c);
          if (k) k.education = Number(c.vars.pass) ? 'university' : 'highschool';
          return Number(c.vars.pass)
            ? c.t(`${kn(c)} learned to cook three things and to make a month's money last three weeks. Character, mostly.`, `${kn(c)} üç yemek yapmayı ve bir aylık parayı üç haftaya yaymayı öğrendi. Gerisi tecrübe.`)
            : c.t(`${kn(c)} started as an apprentice. Within a year ${kidOf(c)?.gender === 'female' ? 'she' : 'he'} was fixing things you had given up on.`, `${kn(c)} çıraklıkla başladı. Bir yıl içinde senin çoktan vazgeçtiğin şeyleri tamir etmeye başladı.`);
        },
      },
      {
        id: 'brag',
        label: (c) => (Number(c.vars.pass) ? c.t('Call every relative you have', 'Bütün akrabaları tek tek ara') : c.t('Let your disappointment show', 'Hayal kırıklığını belli et')),
        resolve: (c) => {
          flagKid(c, 'kid_exam:');
          const k = kidOf(c);
          if (Number(c.vars.pass)) {
            if (k) k.education = 'university';
            closer(c, 2);
            c.h.stat('happiness', 4);
            return c.t(`You called everyone. By the evening a cousin you had not heard from in ten years had sent a cake.`, `Herkesi aradın. Akşama on yıldır sesini duymadığın bir kuzen pasta göndermişti.`);
          }
          if (k) k.education = 'highschool';
          closer(c, -8);
          return c.t(`You did not shout. You did not have to. ${kn(c)} remembers the look for years.`, `Bağırmadın; gerek de yoktu. ${kn(c)} o bakışı yıllarca unutmadı.`);
        },
      },
    ],
  }),

  // ------------------------------------------------ the send-off to the army (Türkiye, sons)
  kidMoment('base.km_asker', 20, 24, (c, k) => inTr(c) && k.gender === 'male' && !c.h.has(`kid_asker:${k.id}`), {
    weight: 12,
    setup: (c) => {
      c.vars.amt = wage(c, 300);
      c.vars.bed = wage(c, 6000);
    },
    title: (c) => c.t(`${Who(c)} is off to do his military service.`, `${Who(c)} askere gidiyor.`),
    text: (c) => c.t('The call-up papers came. The whole street wants to know when the send-off is.', 'Celbi geldi. Mahallede herkes uğurlamanın ne zaman olacağını soruyor.'),
    choices: [
      {
        id: 'drums',
        label: (c) => c.t(`A proper send-off with drums (${c.h.fmt(num(c))})`, `Davul zurnayla uğurla (${c.h.fmt(num(c))})`),
        requires: (c) => afford(c, num(c)),
        requiresLabel: 'Not enough money',
        tone: 'good',
        resolve: (c) => {
          flagKid(c, 'kid_asker:');
          c.h.money(-num(c));
          closer(c, 6);
          c.h.stat('happiness', 3);
          return c.t(
            `Drums in front of the bus station, ${kn(c)} carried on shoulders, a flag out of every window. When the bus pulled away, you were the last to stop waving.`,
            `Otogarın önünde davul zurna çaldı, ${kn(c)} omuzlarda taşındı. Otobüs kalkınca herkes el salladı; elini en son indiren sen oldun.`,
          );
        },
      },
      {
        id: 'bedelli',
        label: (c) => c.t(`Pay for the short paid service (${c.h.fmt(num(c, 'bed'))})`, `Bedelliyi sen öde (${c.h.fmt(num(c, 'bed'))})`),
        requires: (c) => afford(c, num(c, 'bed')),
        requiresLabel: 'Not enough savings',
        badge: 'Big money',
        resolve: (c) => {
          flagKid(c, 'kid_asker:');
          c.h.money(-num(c, 'bed'));
          closer(c, 4);
          return c.t(
            `You paid. ${kn(c)} was back after a few weeks of basic training and says the real service was the first haircut.`,
            `Bedelli parasını sen yatırdın. ${kn(c)} birkaç haftalık temel eğitimden döndü; "Asıl askerlik ilk günkü tıraşmış" diyor.`,
          );
        },
      },
      {
        id: 'quiet',
        label: (c) => c.t('See him off quietly at the bus station', 'Otogarda sessizce uğurla'),
        resolve: (c) => {
          flagKid(c, 'kid_asker:');
          closer(c, 3);
          return c.t(
            `A short hug, a bottle of cologne for the road and a prayer. You watched until the bus turned the corner.`,
            `Kısa bir sarılma, yol için bir şişe kolonya ve bir dua. Otobüs köşeyi dönene kadar arkasından baktın.`,
          );
        },
      },
    ],
  }),

  // ------------------------------------------------ kız isteme (Türkiye): the families meet
  kidMoment('base.km_isteme', 23, 32, (c, k) => inTr(c) && !c.h.has(ENGAGED + k.id) && !kidSettled(c, k), {
    weight: 12,
    setup: (c) => {
      c.vars.kp = pickPartnerName(c, kidOf(c));
    },
    title: (c) =>
      kidOf(c).gender === 'male'
        ? c.t(`${Who(c)} wants to marry ${c.vars.kp}. You are going to ask for her hand.`, `${Who(c)} ${wth(String(c.vars.kp))} evlenmek istiyor. Kız istemeye gidiyorsunuz.`)
        : c.t(`${c.vars.kp}'s family is coming to ask for ${kn(c)}'s hand tonight.`, `Bu akşam ${gen(String(c.vars.kp))} ailesi ${acc(kn(c))} istemeye geliyor.`),
    text: (c) =>
      kidOf(c).gender === 'male'
        ? c.t(`Flowers and chocolates bought. ${kn(c)} has straightened his tie three times on the doorstep.`, `Çiçek ve çikolata alındı. Kapının önünde ${kn(c)} kravatını üçüncü kez düzeltiyor.`)
        : c.t(`${kn(c)} will make the coffee and has not yet decided what goes in the groom's cup.`, `Kahveleri ${kn(c)} yapacak; damat adayının fincanına ne koyacağına henüz karar vermedi.`),
    choices: [
      {
        id: 'warm',
        label: (c) => (kidOf(c).gender === 'male' ? c.t('Say the old words and ask', 'Lafı dolandırma, "Allah’ın emri" diye söze gir') : c.t('Let the salted coffee happen', 'Kahveye tuz konmasına göz yum')),
        tone: 'good',
        resolve: (c) => {
          c.h.flag(ENGAGED + String(c.vars.pid));
          closer(c, 6);
          c.h.stat('happiness', 4);
          return kidOf(c).gender === 'male'
            ? c.t(`${kn(c)} drank the salted coffee without a flinch. They said yes, and the engagement date was settled before the tea.`, `${kn(c)} tuzlu kahveyi yüzünü buruşturmadan içti. Kızı verdiler; çaylar gelmeden nişan tarihi bile konuşuldu.`)
            : c.t(`The groom drank the salted coffee in one go. ${kn(c)} laughed so hard in the kitchen she had to sit down. "We give her," you said.`, `Damat adayı tuzlu kahveyi tek dikişte içti. ${kn(c)} mutfakta gülmekten yere oturdu. "Verdik gitti" dedin.`);
        },
      },
      {
        id: 'questions',
        label: (c) => (kidOf(c).gender === 'male' ? c.t('Talk about the weather first, for an hour', 'Önce bir saat havadan sudan konuş') : c.t('Grill the groom', 'Damadı soru yağmuruna tut')),
        resolve: (c) => {
          c.h.flag(ENGAGED + String(c.vars.pid));
          closer(c, 2);
          return kidOf(c).gender === 'male'
            ? c.t(`An hour of weather, traffic and hometowns. In the end her father said, "Well, if the young ones have agreed."`, `Bir saat hava durumu, trafik ve memleket konuşuldu. Sonunda kızın babası "Gençler anlaştıysa bize söz düşmez" dedi.`)
            : c.t(`You asked about his job, his salary and his football team. Every answer but the last satisfied you.`, `İşini, maaşını, tuttuğu takımı sordun. Sonuncusu dışında her cevap içine sindi.`);
        },
      },
      {
        id: 'money',
        label: (c) => (kidOf(c).gender === 'male' ? c.t('Bring up who pays for the wedding', 'Düğün masraflarını hemen aç') : c.t('Play hard to get for a week', 'Hemen "verdik" deme, biraz naz yap')),
        resolve: (c) => {
          c.h.flag(ENGAGED + String(c.vars.pid));
          closer(c, -4);
          return kidOf(c).gender === 'male'
            ? c.t(`The talk reached money before the coffee did. They said yes, but ${kn(c)} did not speak to you on the way home.`, `Konu daha kahveler gelmeden paraya geldi. Kızı verdiler ama ${kn(c)} dönüş yolunda seninle tek kelime konuşmadı.`)
            : c.t(`You said "we will think about it" for a week. ${kn(c)} spoke to you only when necessary that week. Then you said yes.`, `Bir hafta "Düşüneceğiz" dedin. ${kn(c)} o hafta seninle yalnızca gerektiği kadar konuştu. Sonra "Verdik" dedin.`);
        },
      },
    ],
  }),

  // ------------------------------------------------ the wedding: in Türkiye after kız isteme, elsewhere from 23
  kidMoment('base.ad_kid_wedding_cost', 23, 38, (c, k) => !kidSettled(c, k) && (!inTr(c) || c.h.has(ENGAGED + k.id) || c.h.ageOf(k) >= 28), {
    weight: 14,
    setup: (c) => {
      c.vars.kp = pickPartnerName(c, kidOf(c));
      c.vars.amt = wage(c, c.rng.int(5000, 12000));
      c.vars.gold = wage(c, 1500);
    },
    title: (c) => c.t(`${Who(c)} is marrying ${c.vars.kp}.`, `${Who(c)}, ${wth(String(c.vars.kp))} evleniyor.`),
    text: (c) =>
      inTr(c)
        ? c.t(`The wedding hall alone is ${c.h.fmt(num(c))}. Both families have opinions about the menu and the gold.`, `Sadece düğün salonu ${c.h.fmt(num(c))}. İki ailenin de menü ve takılar hakkında fikirleri var.`)
        : c.t(`The venue alone is ${c.h.fmt(num(c))}. Both families have opinions about the menu and the band.`, `Sadece mekân ${c.h.fmt(num(c))}. İki ailenin de menü ve müzik hakkında fikirleri var.`),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t(`Pay for the whole thing (${c.h.fmt(num(c))})`, `Hepsini sen öde (${c.h.fmt(num(c))})`),
        requires: (c) => afford(c, num(c)),
        requiresLabel: 'Not enough savings',
        tone: 'good',
        resolve: (c) => {
          c.h.flag(WED + String(c.vars.pid));
          c.h.money(-num(c));
          closer(c, 8);
          c.h.stat('happiness', 5);
          return c.t(`It was a beautiful wedding. You danced with ${kn(c)} and forgot every number on every invoice.`, `Çok güzel bir düğündü. ${wth(kn(c))} dans ettin ve bütün faturalardaki bütün rakamları unuttun.`);
        },
      },
      {
        id: 'gold',
        label: (c) =>
          inTr(c)
            ? c.t(`Pin a gold bracelet on the couple (${c.h.fmt(num(c, 'gold'))})`, `Geline bilezik tak (${c.h.fmt(num(c, 'gold'))})`)
            : c.t(`Give a generous cheque and a speech (${c.h.fmt(num(c, 'gold'))})`, `Cömert bir çek ve bir konuşma (${c.h.fmt(num(c, 'gold'))})`),
        requires: (c) => afford(c, num(c, 'gold')),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.flag(WED + String(c.vars.pid));
          c.h.money(-num(c, 'gold'));
          closer(c, 5);
          c.h.stat('happiness', 4);
          return inTr(c)
            ? c.t(`When the announcer called your name, the hall went quiet. The bracelet caught the light; half the guests applauded and the other half worked out the price.`, `Takı töreninde adın okununca salon sustu. Bilezik ışıkta parladı; davetlilerin yarısı alkışladı, öbür yarısı fiyatını hesapladı.`)
            : c.t(`Your speech made the groom's grandmother cry and the best man take notes. The cheque helped too.`, `Konuşman damadın büyükannesini ağlattı, sağdıcı da not almaya başladı. Çek de işe yaradı.`);
        },
      },
      {
        id: 'small',
        label: (c) => c.t('Suggest a small wedding', 'Küçük bir düğün öner'),
        resolve: (c) => {
          c.h.flag(WED + String(c.vars.pid));
          c.h.money(-Math.round(num(c) / 5));
          closer(c, -2);
          return c.t(
            `A small wedding in a garden, thirty people, one long table. ${kn(c)} sulked about it for a month and now calls it the best day of ${kidOf(c)?.gender === 'female' ? 'her' : 'his'} life.`,
            `Bir bahçede, otuz kişilik, tek uzun masalı küçük bir düğün. ${kn(c)} bir ay surat astı; şimdi hayatının en güzel günü diyor.`,
          );
        },
      },
    ],
  }),
];

/**
 * Yearly, no rng: a child past their wedding age (24–29, fixed per child) who has not married on screen marries in
 * a log line, so a grandchild never comes before the wedding. A few live with a partner instead, mostly outside
 * Türkiye. The player in jail or the child abroad hear about it from afar.
 */
export function kidMilestonesOnYear(c: Ctx): void {
  for (const r of c.h.relatives('child')) {
    const k = r.person;
    // in prison the news waits for the release (no wedding line from a cell); the grandchild waits with it
    if (k.deathYear !== undefined || kidSettled(c, k) || c.p.jailYears > 0) continue;
    if (c.h.ageOf(k) < wedAge(k)) continue;
    c.h.flag(WED + k.id);
    const p = partnerNameFor(c, k);
    const kEn = kin({ ...c, lang: 'en' }, k, 'child');
    const kTr = kin({ ...c, lang: 'tr' }, k, 'child');
    const partner = hashId(k.id + 'w') % (inTr(c) ? 12 : 6) === 0;
    const far = isAbroad(c, k.id) ? 'abroad' : 'here';
    const lead: [string, string] = partner
      ? [`Your ${kEn} ${k.firstName} and ${p} have set up home together. No wedding: "we don't need the paperwork," they say.`, `${cap(kTr)} ${k.firstName} ile ${p} artık birlikte yaşıyor. Düğün yok; "Kâğıda gerek yok" diyorlar.`]
      : [`Your ${kEn} ${k.firstName} married ${p}.`, `${cap(kTr)} ${k.firstName}, ${wth(p)} evlendi.`];
    const tail: [string, string] = partner
      ? ['', '']
      : far === 'abroad'
          ? [' You watched the ceremony on a video call and cried at the wrong moment.', ' Nikâhı görüntülü aramadan izledin; yanlış yerde ağladın.']
          : [' You had the front table at the wedding.', ' Düğünde en ön masada sen vardın.'];
    c.h.log(c.t(lead[0] + tail[0], lead[1] + tail[1]), 'good');
    c.h.closeness(k.id, 3);
  }
}

/** For tests and the engine: the flag that marks a child as married or partnered. */
export const KID_WED_FLAG = WED;
