import type { Ctx, EventDef } from '../types';
import type { Person, RelationKind } from '../../engine/types';
import { acc, cap, dat, eligibleJobs, gen, kinWord, nm, olderThanPlayer, single, wage, who, wth, quietInMourning } from './util';
import { atParents, he, him, his, inTr, settled } from './events-flavour';
import { homeTitle } from './activities-home';
import { houseState } from '../../engine/home';

// Teen and young-adult years (13–24): braces, curfews, first jobs, first flats, first heartbreaks.
// University life lives in the Campus pack and YKS / askerlik in the Türkiye pack, so they are not here.

// ------------------------------------------------ helpers

type Case = 'nom' | 'dat' | 'acc' | 'gen' | 'wth';

/** Turkish possessive kinship word ("annen", "ablan", "kız kardeşin") with a case suffix: annene, babanı, ablanla. */
function trKin(p: Person, kind: string, cs: Case, older = false): string {
  const f = p.gender === 'female';
  const base =
    kind === 'mother'
      ? 'annen'
      : kind === 'father'
        ? 'baban'
        : kind === 'sibling'
          ? older
            ? f
              ? 'ablan'
              : 'ağabeyin'
            : f
              ? 'kız kardeşin'
              : 'erkek kardeşin'
          : 'arkadaşın';
  const back = /[aıou][^aeıioöuü]*$/.test(base);
  switch (cs) {
    case 'dat':
      return base + (back ? 'a' : 'e');
    case 'acc':
      return base + (back ? 'ı' : 'i');
    case 'gen':
      return base + (back ? 'ın' : 'in');
    case 'wth':
      return base + (back ? 'la' : 'le');
    default:
      return base;
  }
}

const kindOf = (c: Ctx, id: string): RelationKind => c.p.relations.find((r) => r.personId === id)?.kind ?? 'friend';
/** English kinship word for the person in c.vars[key]: "mom", "brother". */
const ke = (c: Ctx, key = 'par') => kinWord(who(c, key), kindOf(c, String(c.vars[key])));
/** Turkish kinship word with a case for the person in c.vars[key]: "annen", "babana". */
const kt = (c: Ctx, key = 'par', cs: Case = 'nom') => trKin(who(c, key), kindOf(c, String(c.vars[key])), cs, olderThanPlayer(c, who(c, key)));

const parents = (c: Ctx) => c.h.relatives(['mother', 'father']);
const hasParent = (c: Ctx) => parents(c).length > 0;
const friends = (c: Ctx) => c.h.relatives('friend');
const pickParent = (c: Ctx) => {
  c.vars.par = c.rng.pick(parents(c)).person.id;
};
const closeParents = (c: Ctx, d: number) => parents(c).forEach((r) => c.h.closeness(r.person.id, d));
const opposite = (c: Ctx) => (c.p.gender === 'female' ? 'male' : 'female');
/** Siblings near the player's age (they share a house, and clothes). */
const nearSiblings = (c: Ctx) => c.h.relatives('sibling').filter((s) => Math.abs(c.h.ageOf(s.person) - c.age) <= 6);
const inSchool = (c: Ctx) => c.p.school === 'primary' || c.p.school === 'highschool';
/** True when the player can afford a cost given in USD (teens have no credit). */
const canPay = (c: Ctx, usd: number) => c.p.money >= wage(c, usd);

interface TeenState {
  mentor?: string; // id of the teacher who believed in you
}
const teenState = (c: Ctx): TeenState => (c.p.ext?.teen as TeenState | undefined) ?? {};
const setTeenState = (c: Ctx, patch: TeenState) => {
  c.p.ext = c.p.ext ?? {};
  c.p.ext.teen = { ...teenState(c), ...patch };
};

const FIRST_JOBS: [string, string][] = [
  ['the bakery', 'fırında'],
  ['the corner café', 'köşedeki kafede'],
  ['the bookshop', 'kitapçıda'],
  ['the cinema', 'sinemada'],
];

const CAREER_TEST: [string, string][] = [
  ['a lighthouse keeper', 'deniz feneri bekçisi'],
  ['a sheep shearer', 'koyun kırkıcısı'],
  ['a professional queue-stander', 'profesyonel sıra bekleyici'],
  ['a museum night guard', 'müze gece bekçisi'],
];

const FESTIVAL_SKIP: [string, string][] = [
  ['You skipped the festival. Apparently it rained mud. You win this round.', 'Festivale gitmedin. Duyduğuna göre çamur yağmış. Bu raundu sen kazandın.'],
  ['You skipped it and watched the headliner on a shaky phone stream. Same thing, basically.', 'Gitmedin, ana sahneyi titrek bir telefon yayınından izledin. Hemen hemen aynı şey.'],
  ['You stayed home. Your friends came back with sunburn and stories you had to hear eleven times.', 'Evde kaldın. Arkadaşların güneş yanığı ve on bir kez dinlemek zorunda kaldığın hikâyelerle döndü.'],
];

const SECRETS: [string, string][] = [
  ['dented the family car and blamed a "mystery truck"', 'aile arabasını göçerttiğini ve suçu "esrarengiz bir kamyona" attığını'],
  ['failed maths and forged a signature on the report', 'matematikten kaldığını ve karnedeki imzayı taklit ettiğini'],
  ['has been secretly feeding a stray dog in the garage', 'garajda gizlice bir sokak köpeğine baktığını'],
];

// ------------------------------------------------ events

export const teenEvents: EventDef[] = [
  // ============================================ 13–15
  {
    id: 'base.braces',
    category: 'health',
    minAge: 13,
    maxAge: 15,
    once: true,
    weight: 6,
    title: (c) => c.t('The orthodontist says you need braces.', 'Ortodontist diş teli takman gerektiğini söyledi.'),
    text: (c) => c.t('Your parents are already doing the math.', 'Ailen şimdiden hesap kitap yapıyor.'),
    choices: [
      {
        id: 'metal',
        label: (c) => c.t('Classic metal', 'Klasik metal tel'),
        resolve: (c) => {
          c.h.flag('teen_braces');
          c.h.stat('looks', -3);
          c.h.stat('happiness', -2);
          return c.t(
            'You got metal braces. Corn on the cob is dead to you now.',
            'Metal tel taktırdın. Mısır koçanıyla yollarınız artık ayrıldı.',
          );
        },
      },
      {
        id: 'colors',
        label: (c) => c.t('Rainbow rubber bands', 'Gökkuşağı renkli lastikler'),
        resolve: (c) => {
          c.h.flag('teen_braces');
          c.h.stat('looks', -2);
          c.h.stat('happiness', 2);
          return c.t(
            'You picked rainbow bands. Your mouth now looks like a tiny funfair.',
            'Gökkuşağı lastikleri seçtin. Ağzın artık minik bir lunapark gibi.',
          );
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Refuse them', 'Takmayacağım de'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          closeParents(c, -2);
          return c.t(
            'You refused. Your crooked tooth is now officially "character."',
            'Reddettin. Çarpık dişin artık resmen "karakterinin bir parçası."',
          );
        },
      },
    ],
  },
  {
    id: 'base.braces_off',
    category: 'health',
    minAge: 14,
    maxAge: 24,
    once: true,
    weight: 10,
    when: (c) => c.h.has('teen_braces') && c.s.year - c.p.flags['teen_braces'] >= 2,
    text: '',
    apply: (c) => {
      c.h.unflag('teen_braces');
      c.h.stat('looks', 7);
      c.h.stat('happiness', 5);
      return c.t(
        'Your braces finally came off. You ran your tongue over your teeth for an hour, amazed.',
        'Diş telin nihayet çıktı. Bir saat boyunca dilini dişlerinde gezdirip hayranlıkla durdun.',
      );
    },
    tone: 'good',
  },
  {
    id: 'base.group_chat',
    category: 'random',
    minAge: 13,
    maxAge: 17,
    weight: 7,
    cooldown: 5,
    setup: (c) => {
      const fr = friends(c);
      c.vars.pid = fr.length ? c.rng.pick(fr).person.id : c.h.newPerson({ age: c.age }).id;
    },
    title: (c) => c.t('A screenshot of you is going around the group chat.', 'Senin bir ekran görüntün sınıf grubunda elden ele dolaşıyor.'),
    text: (c) =>
      c.t(`In it, you called ${nm(c)}'s new haircut "brave."`, `Görüntüde ${gen(nm(c))} yeni saçı için "cesur bir tercih" demişsin.`),
    choices: [
      {
        id: 'sorry',
        label: (c) => c.t('Apologize in person', 'Yüz yüze özür dile'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 4);
          c.h.stat('happiness', -1);
          return c.t(
            `You apologized to ${nm(c)} face to face. One awkward hug later, the crisis was over.`,
            `${wth(nm(c))} yüz yüze konuşup özür diledin. Bir garip sarılmanın ardından kriz kapandı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'leave',
        label: (c) => c.t('Leave the group chat', 'Gruptan çık'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'You left the group. Within minutes there was a new group without you in it.',
            'Gruptan çıktın. Dakikalar içinde sensiz yeni bir grup kuruldu.',
          );
        },
      },
      {
        id: 'counter',
        label: (c) => c.t(`Post an even worse screenshot of ${him(who(c))}`, 'Onun daha beter bir ekran görüntüsünü paylaş'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -10);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            return c.t(
              `Mutually assured destruction. You and ${nm(c)} are even, and the group went silent for a week.`,
              `Karşılıklı imha. ${wth(nm(c))} ödeştiniz, grup da bir hafta boyunca sessizliğe gömüldü.`,
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            'Your counter-attack backfired. You are now a sticker in three group chats.',
            'Karşı saldırın geri tepti. Artık üç ayrı grupta çıkartma olarak dolaşıyorsun.',
          );
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'base.school_dance',
    category: 'school',
    minAge: 13,
    maxAge: 15,
    once: true,
    weight: 7,
    when: inSchool,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: opposite(c) }).id;
    },
    title: (c) => c.t('The school dance is on Friday.', 'Cuma günü okulda dans gecesi var.'),
    text: (c) => c.t(`${nm(c)} is standing alone by the punch bowl.`, `${nm(c)} meyve suyu masasının yanında tek başına duruyor.`),
    choices: [
      {
        id: 'ask',
        label: (c) => c.t(`Ask ${nm(c)} to dance`, `${nm(c)} ile dansa kalk`),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 250)) {
            c.h.stat('happiness', 8);
            return c.t(
              `You and ${nm(c)} slow-danced at arm's length. Neither of you breathed for three minutes.`,
              `${wth(nm(c))} bir kol mesafesinden ağır ağır dans ettiniz. Üç dakika boyunca ikiniz de nefes almadınız.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            `${nm(c)} said ${he(who(c))} was "waiting for someone." That someone turned out to be ${his(who(c))} phone.`,
            `${nm(c)} "Birini bekliyorum" dedi. O biri telefonu çıktı.`,
          );
        },
      },
      {
        id: 'friends',
        label: (c) => c.t('Dance with your friends', 'Arkadaşlarınla dans et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          friends(c).forEach((f) => c.h.closeness(f.person.id, 2));
          return c.t(
            'You danced in a circle with your friends and invented a move nobody can explain.',
            'Arkadaşlarınla halka olup dans ettin ve kimsenin açıklayamadığı bir figür icat ettiniz.',
          );
        },
        tone: 'good',
      },
      {
        id: 'wall',
        label: (c) => c.t('Hold up the wall', 'Duvarı tut'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('You held up the wall all night. The wall appreciated it.', 'Bütün gece duvarı tuttun. Duvar sana minnettar.');
        },
      },
    ],
  },
  {
    id: 'base.hair_dye',
    category: 'random',
    minAge: 13,
    maxAge: 17,
    once: true,
    weight: 6,
    when: hasParent,
    setup: pickParent,
    title: (c) => c.t('You secretly bought hair dye.', 'Gizlice saç boyası aldın.'),
    text: (c) =>
      c.t(
        `The box says "Electric Blue." Your ${ke(c)} has no idea. Yet.`,
        `Kutunun üstünde "Elektrik Mavisi" yazıyor. ${cap(kt(c))} henüz bir şey bilmiyor.`,
      ),
    choices: [
      {
        id: 'dye',
        label: (c) => c.t('Dye it in the bathroom', 'Banyoda boya'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -3);
          if (c.rng.chance(0.6)) {
            c.h.stat('looks', 3);
            c.h.stat('happiness', 5);
            return c.t(
              `It worked. You look like an anime hero. Your ${ke(c)} looks like someone who just saw the towels.`,
              `Tuttu! Anime kahramanı gibi oldun. ${cap(kt(c))} ise havluları görmüş birinin yüz ifadesiyle bakıyor.`,
            );
          }
          c.h.stat('looks', -3);
          c.h.stat('happiness', -3);
          return c.t(
            'It came out swamp green. The bathroom grout will never be the same.',
            'Bataklık yeşili çıktı. Banyonun derzleri bir daha asla eskisi gibi olmayacak.',
          );
        },
      },
      {
        id: 'bleach',
        label: (c) => c.t('Bleach it first, like the video said', 'Videodaki gibi önce aç'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -4);
          if (c.rng.chance(0.35)) {
            c.h.stat('looks', 5);
            c.h.stat('happiness', 6);
            return c.t('Salon-level blue. Strangers stopped you in the street.', 'Kuaförden çıkmış gibi bir mavi. Sokakta yabancılar durdurup sordu.');
          }
          c.h.stat('looks', -5);
          c.h.stat('health', -1);
          return c.t(
            'Your hair snapped like dry spaghetti. You wore a hat for one whole season.',
            'Saçların kuru makarna gibi kırıldı. Koca bir mevsim şapkayla gezdin.',
          );
        },
        tone: 'bad',
      },
      {
        id: 'return',
        label: (c) => c.t('Return the box', 'Kutuyu iade et'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('You returned it. Your inner rebel has filed a formal complaint.', 'İade ettin. İçindeki asi resmî bir şikâyet dilekçesi verdi.');
        },
      },
    ],
  },
  {
    id: 'base.school_band',
    category: 'school',
    minAge: 13,
    maxAge: 16,
    once: true,
    weight: 6,
    when: inSchool,
    title: (c) => c.t('The school band needs new members.', 'Okul bandosu yeni üye arıyor.'),
    text: (c) => c.t('The music teacher has the eyes of a desperate person.', 'Müzik öğretmeninin gözlerinde çaresiz bir parıltı var.'),
    choices: [
      {
        id: 'drums',
        label: (c) => c.t('Play the drums', 'Davul çal'),
        resolve: (c) => {
          c.h.flag('teen_band');
          c.h.stat('happiness', 6);
          return c.t(
            'You joined on drums. The neighbors now know your practice schedule better than you do.',
            'Bandoya davulcu olarak katıldın. Komşular çalışma saatlerini artık senden iyi biliyor.',
          );
        },
        tone: 'good',
      },
      {
        id: 'tuba',
        label: (c) => c.t('Take the tuba nobody wants', 'Kimsenin istemediği tubayı al'),
        resolve: (c) => {
          c.h.flag('teen_band');
          c.h.stat('health', 3);
          c.h.stat('happiness', 3);
          return c.t(
            'You took the tuba. Your lungs are now legendary, your back less so.',
            'Tubayı sen aldın. Ciğerlerin efsane oldu, sırtın o kadar değil.',
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Not your thing', 'Sana göre değil'),
        resolve: (c) => c.t('You said no. The music teacher sighed in B flat.', 'Hayır dedin. Müzik öğretmeni si bemol perdeden iç geçirdi.'),
      },
    ],
  },
  {
    id: 'base.home_alone',
    category: 'family',
    minAge: 13,
    maxAge: 16,
    once: true,
    weight: 7,
    when: hasParent,
    title: (c) => c.t('Your parents are away for the weekend.', 'Ailen hafta sonu için şehir dışında.'),
    text: (c) => c.t('First time home alone. The fridge is full.', 'İlk kez evde tek başınasın. Buzdolabı da ağzına kadar dolu.'),
    choices: [
      {
        id: 'party',
        label: (c) => c.t('Throw a party', 'Parti ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            closeParents(c, -8);
            c.h.stat('happiness', -4);
            return c.t(
              'The neighbor reported everything to your parents, including the dance-off on the balcony.',
              'Komşu teyze ailene her şeyi anlattı, balkondaki dans kapışması dahil.',
            );
          }
          c.h.stat('happiness', 8);
          return c.t('Twenty guests, zero broken plates. A legend was born.', 'Yirmi misafir, sıfır kırık tabak. Bir efsane doğdu.');
        },
      },
      {
        id: 'cook',
        label: (c) => c.t('Cook a real meal', 'Gerçek bir yemek pişir'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.flag('teen_can_cook');
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 3);
            return c.t('You made pasta from scratch. It was mostly edible. You are basically a chef.', 'Sıfırdan makarna yaptın. Büyük kısmı yenebilir durumdaydı. Resmen aşçısın.');
          }
          c.h.stat('happiness', -2);
          return c.t('You set off the smoke alarm twice and ate cereal for dinner.', 'Duman alarmını iki kez öttürdün, akşam yemeğine mısır gevreği yedin.');
        },
      },
      {
        id: 'movies',
        label: (c) => c.t('Movie marathon', 'Film maratonu yap'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You watched six movies in a row in your pajamas. Freedom tastes like popcorn.', 'Pijamalarınla arka arkaya altı film izledin. Özgürlüğün tadı patlamış mısır gibi.');
        },
      },
    ],
  },
  {
    id: 'base.teacher_believes',
    category: 'school',
    minAge: 13,
    maxAge: 17,
    once: true,
    weight: 6,
    when: inSchool,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(30, 55) }).id;
    },
    title: (c) => c.t(`Your teacher ${nm(c)} keeps you after class.`, `Öğretmenin ${nm(c)} seni dersten sonra alıkoydu.`),
    text: (c) => c.t('"You could be really good at this, if you actually tried."', '"Biraz uğraşsan bu işte çok iyi olabilirsin, biliyor musun?"'),
    choices: [
      {
        id: 'try',
        label: (c) => c.t('Stay after school for extra lessons', 'Okuldan sonra ek derse kal'),
        resolve: (c) => {
          setTeenState(c, { mentor: String(c.vars.pid) });
          c.h.stat('smarts', 5);
          c.h.stat('happiness', 2);
          return c.t(
            `You stayed after school with ${nm(c)} all year. Your grades went up and so did your posture.`,
            `Bütün yıl okuldan sonra ${wth(nm(c))} çalıştın. Notların yükseldi, duruşun bile dikleşti.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'shrug',
        label: (c) => c.t('Shrug and leave', 'Omuz silk ve çık'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            `You shrugged. ${nm(c)} kept believing in you anyway, which was honestly annoying.`,
            `Omuz silktin. ${nm(c)} yine de sana inanmaya devam etti. Açıkçası biraz sinir bozucu.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.skip_class',
    category: 'school',
    minAge: 13,
    maxAge: 17,
    weight: 7,
    cooldown: 5,
    when: inSchool,
    title: (c) => c.t('Your friends are skipping last period.', 'Arkadaşların son dersi kırıyor.'),
    text: (c) => c.t('The plan involves the back fence and a bakery.', 'Plan arka duvardan atlamak ve fırına gitmek üzerine kurulu.'),
    choices: [
      {
        id: 'skip',
        label: (c) => c.t('Jump the fence', 'Duvardan atla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            closeParents(c, -4);
            c.h.stat('happiness', -3);
            return c.t(
              'The vice principal was in the same bakery, buying the same pastry. Your parents got a call.',
              inTr(c)
                ? 'Müdür yardımcısı da aynı fırındaymış, aynı poğaçadan alıyormuş. Velini aradılar.'
                : 'Müdür yardımcısı da aynı fırındaymış, aynı çörekten alıyormuş. Velini aradılar.',
            );
          }
          c.h.stat('happiness', 5);
          c.h.stat('smarts', -1);
          return c.t('Warm pastries, zero consequences. A dangerous lesson.', inTr(c) ? 'Sıcak poğaça, sıfır ceza. Tehlikeli bir ders oldu bu.' : 'Sıcak çörek, sıfır ceza. Tehlikeli bir ders oldu bu.');
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay in class', 'Derste kal'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t('You stayed. There was a pop quiz. You aced it, alone.', 'Kaldın. Sürpriz yazılı yapıldı. Tek başına döktürdün.');
        },
      },
    ],
  },
  {
    id: 'base.parent_post',
    category: 'family',
    minAge: 13,
    maxAge: 16,
    once: true,
    weight: 6,
    when: hasParent,
    setup: pickParent,
    title: (c) => c.t(`Your ${ke(c)} posted your baby photo online.`, `${cap(kt(c))} bebeklik fotoğrafını internete koydu.`),
    text: (c) =>
      c.t('Bath time, age two. Forty-seven likes. Your whole class has seen it.', 'İki yaşında, küvette. Kırk yedi beğeni. Bütün sınıf görmüş.'),
    choices: [
      {
        id: 'demand',
        label: (c) => c.t('Demand it come down', 'Hemen kaldırmasını iste'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -3);
          c.h.stat('happiness', 1);
          return c.t(
            `Your ${ke(c)} took it down and posted a different, worse one.`,
            `${cap(kt(c))} fotoğrafı kaldırdı ve yerine başka, daha beter bir tane koydu.`,
          );
        },
      },
      {
        id: 'laugh',
        label: (c) => c.t('Laugh it off', 'Gülüp geç'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.closeness(String(c.vars.par), 2);
          return c.t(
            'You commented "cute baby, who is this?" Your class decided you are untouchable.',
            'Altına "Ne tatlı bebek, kim bu?" yazdın. Sınıf senin dokunulmaz olduğuna karar verdi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'block',
        label: (c) => c.t(`Block your ${ke(c)}`, `${cap(kt(c, 'par', 'acc'))} engelle`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -6);
          return c.t(
            `You blocked your ${ke(c)}. Now ${he(who(c, 'par'))} comments on your posts through your aunt.`,
            `${cap(kt(c, 'par', 'acc'))} engelledin. Artık paylaşımlarına teyzenin hesabından yorum yapıyor.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.curfew',
    category: 'family',
    minAge: 14,
    maxAge: 17,
    weight: 7,
    cooldown: 4,
    when: hasParent,
    setup: pickParent,
    title: (c) => c.t('Your curfew is 10 p.m. Everyone else has midnight.', "Eve dönüş saatin 22.00. Herkesinki gece yarısı."),
    text: (c) => c.t(`Allegedly. Your ${ke(c)} is not convinced.`, `Öyle iddia ediliyor. ${cap(kt(c))} pek ikna olmuş değil.`),
    choices: [
      {
        id: 'negotiate',
        label: (c) => c.t('Negotiate with data', 'Verilerle pazarlık et'),
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 200)) {
            c.h.stat('happiness', 4);
            c.h.closeness(String(c.vars.par), 2);
            return c.t('You presented a chart. Curfew moved to 11 p.m. A historic victory.', 'Grafikli bir sunum yaptın. Saat 23.00 oldu. Tarihî bir zafer.');
          }
          c.h.stat('happiness', -2);
          return c.t('The negotiation went badly. Curfew is now 9:30.', 'Pazarlık kötü gitti. Saat artık 21.30.');
        },
      },
      {
        id: 'slam',
        label: (c) => c.t('Slam your door', 'Kapını çarp'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -5);
          c.h.stat('happiness', -2);
          return c.t('You slammed your door. The door took it personally.', 'Kapını çarptın. Kapı bunu kişisel algıladı.');
        },
      },
      {
        id: 'accept',
        label: (c) => c.t('Accept it gracefully', 'Olgunlukla kabul et'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), 3);
          return c.t(
            `You accepted. Your ${ke(c)} has never looked more suspicious.`,
            `Kabul ettin. ${cap(kt(c))} hayatında hiç bu kadar şüphelenmemişti.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.sibling_clothes',
    category: 'family',
    minAge: 13,
    maxAge: 22,
    weight: 6,
    cooldown: 5,
    when: (c) => nearSiblings(c).length > 0,
    setup: (c) => {
      c.vars.sib = c.rng.pick(nearSiblings(c)).person.id;
    },
    title: (c) =>
      c.t(
        `Your ${ke(c, 'sib')} ${nm(c, 'sib')} borrowed your favorite hoodie.`,
        `${cap(kt(c, 'sib'))} ${nm(c, 'sib')} en sevdiğin kapüşonluyu aldı.`,
      ),
    text: (c) => c.t('Without asking. It came back with a mystery stain.', 'Sormadan. Üstünde kaynağı belirsiz bir lekeyle geri geldi.'),
    choices: [
      {
        id: 'lock',
        label: (c) => c.t('Put a lock on your wardrobe', 'Dolabına kilit tak'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), -3);
          return c.t(
            `You locked your wardrobe. ${nm(c, 'sib')} learned to pick it within a week.`,
            `Dolabını kilitledin. ${nm(c, 'sib')} bir hafta içinde kilidi açmayı öğrendi.`,
          );
        },
      },
      {
        id: 'raid',
        label: (c) => c.t(`Raid ${his(who(c, 'sib'))} wardrobe in return`, 'Sen de onun dolabına dal'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), 2);
          c.h.stat('happiness', 3);
          return c.t(
            `Now you and ${nm(c, 'sib')} share everything. Mostly arguments.`,
            `Artık ${wth(nm(c, 'sib'))} her şeyi paylaşıyorsunuz. Çoğunlukla da kavgayı.`,
          );
        },
      },
      {
        id: 'let',
        label: (c) => c.t('Let it go', 'Boş ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), 4);
          return c.t(`You let it go. The hoodie belongs to ${him(who(c, 'sib'))} now. That is the law.`, 'Boş verdin. Kapüşonlu artık onun. Kanun böyle.');
        },
      },
    ],
  },
  {
    id: 'base.gaming_night',
    category: 'random',
    minAge: 13,
    maxAge: 19,
    weight: 6,
    cooldown: 5,
    title: (c) => c.t('The online tournament starts at midnight.', 'Çevrim içi turnuva gece yarısı başlıyor.'),
    text: (c) =>
      inSchool(c)
        ? c.t('You have school at eight.', 'Sabah sekizde okul var.')
        : c.t('You have to be up at seven.', 'Sabah yedide kalkman lazım.'),
    choices: [
      {
        id: 'play',
        label: (c) => c.t('Play until dawn', 'Sabaha kadar oyna'),
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            c.h.stat('happiness', 8);
            return c.t('Your team won the whole thing. The prize was a digital hat. Priceless.', 'Takımın turnuvayı kazandı. Ödül dijital bir şapkaydı. Paha biçilemez.');
          }
          c.h.stat('health', -2);
          c.h.stat('happiness', 2);
          return c.t('You lost at 4 a.m. and slept through half of the next day.', 'Sabaha karşı dörtte elendin ve ertesi günün yarısını uyuyarak geçirdin.');
        },
      },
      {
        id: 'sleep',
        label: (c) => c.t('Go to bed', 'Yat uyu'),
        resolve: (c) => {
          c.h.stat('health', 2);
          return c.t('You went to bed. Your teammates called you a traitor in three languages.', 'Yattın. Takım arkadaşların sana üç dilde hain dedi.');
        },
      },
    ],
  },
  {
    id: 'base.peer_pressure',
    category: 'random',
    minAge: 14,
    maxAge: 17,
    weight: 6,
    cooldown: 5,
    title: (c) => c.t('The older kids offer you a cigarette behind the gym.', 'Büyük çocuklar spor salonunun arkasında sana sigara uzatıyor.'),
    text: (c) => c.t('Everyone is watching to see what you do.', 'Herkes ne yapacağını görmek için bekliyor.'),
    choices: [
      {
        id: 'no',
        label: (c) => c.t('Say no', 'Hayır de'),
        resolve: (c) => {
          c.h.flag('teen_said_no');
          c.h.stat('smarts', 1);
          return c.t('You said no. Two other kids quietly said no right after you.', 'Hayır dedin. Hemen ardından iki kişi daha sessizce hayır dedi.');
        },
        tone: 'good',
      },
      {
        id: 'try',
        label: (c) => c.t('Try one', 'Bir tane dene'),
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', -1);
          return c.t('You coughed so hard a teacher came running. Cool points: zero.', 'Öyle bir öksürdün ki koşarak bir öğretmen geldi. Havalı puanın: sıfır.');
        },
        tone: 'bad',
      },
      {
        id: 'joke',
        label: (c) => c.t('Crack a joke and walk away', 'Bir espri patlat ve uzaklaş'),
        resolve: (c) => {
          if (c.rng.chance(0.5 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 3);
            return c.t('They laughed. You walked away. Smooth as butter.', 'Güldüler. Sen de çekip gittin. Tereyağından kıl çeker gibi.');
          }
          c.h.stat('happiness', -2);
          return c.t('Nobody laughed. You walked away anyway, slightly faster.', 'Kimse gülmedi. Sen yine de uzaklaştın, biraz daha hızlı adımlarla.');
        },
      },
    ],
  },

  // ============================================ 16–18
  {
    id: 'base.first_interview',
    category: 'work',
    minAge: 16,
    maxAge: 18,
    once: true,
    weight: 7,
    when: (c) => !c.p.jobId,
    setup: (c) => {
      c.vars.place = c.rng.int(0, FIRST_JOBS.length - 1);
    },
    title: (c) => c.t('Your first job interview is in ten minutes.', 'İlk iş görüşmen on dakika sonra.'),
    text: (c) => {
      const [en, tr] = FIRST_JOBS[Number(c.vars.place)];
      return c.t(`A weekend job at ${en}. Your palms are sweating.`, `${cap(tr)} hafta sonu işi. Avuçların terden sırılsıklam.`);
    },
    choices: [
      {
        id: 'rehearse',
        label: (c) => c.t('Rehearse answers in the bathroom', 'Tuvalette cevapları prova et'),
        resolve: (c) => interview(c, 0.45 + c.p.stats.smarts / 400),
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it with a big smile', 'Kocaman gülümse, doğaçla'),
        resolve: (c) => interview(c, 0.3 + c.p.stats.looks / 300),
      },
      {
        id: 'run',
        label: (c) => c.t('Walk past the door and keep walking', 'Kapının önünden geçip yürümeye devam et'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You walked past the door three times, then went home. Maybe next year.', 'Kapının önünden üç kez geçip eve döndün. Belki seneye.');
        },
      },
    ],
  },
  {
    id: 'base.first_date_teen',
    category: 'love',
    minAge: 16,
    maxAge: 17,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: opposite(c) }).id;
    },
    title: (c) => c.t(`${nm(c)} asked you to the cinema.`, `${nm(c)} seni sinemaya davet etti.`),
    text: (c) => c.t('Just the two of you. Your stomach is doing gymnastics.', 'Sadece ikiniz. Miden jimnastik yapıyor.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Say yes', 'Evet de'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.flag('teen_first_date');
            c.h.stat('happiness', 8);
            return c.t(
              `You and ${nm(c)} held hands during the boring part. You don't remember a single scene.`,
              `${wth(nm(c))} filmin sıkıcı yerinde el ele tutuştunuz. Tek bir sahnesini bile hatırlamıyorsun.`,
            );
          }
          c.h.stat('happiness', -1);
          return c.t(
            `You and ${nm(c)} reached for the popcorn at the same time and spilled it everywhere. Still, a story.`,
            `${wth(nm(c))} aynı anda mısıra uzandınız ve her yere döktünüz. Yine de anlatacak bir hikâye.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'backup',
        label: (c) => c.t('Bring a friend as backup', 'Yedek olarak bir arkadaşını getir'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Your friend sat between you. It was less a date, more a hostage situation.', 'Arkadaşın ikinizin arasına oturdu. Randevudan çok rehine krizine benzedi.');
        },
      },
      {
        id: 'busy',
        label: (c) => c.t('Panic and say you are busy', 'Panikle "işim var" de'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(`You told ${nm(c)} you were busy. You were busy regretting it.`, `${dat(nm(c))} "İşim var" dedin. Meğer işin pişman olmakmış.`);
        },
      },
    ],
  },
  {
    id: 'base.teen_heartbreak',
    category: 'love',
    minAge: 15,
    maxAge: 17,
    once: true,
    weight: 6,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: opposite(c) }).id;
      const fr = friends(c);
      if (fr.length) c.vars.fid = fr[0].person.id;
    },
    title: (c) => c.t(`${nm(c)} is going out with someone else.`, `${nm(c)} başkasıyla çıkmaya başlamış.`),
    text: (c) => c.t('You had been texting every night for three months.', 'Üç aydır her gece mesajlaşıyordunuz.'),
    choices: [
      {
        id: 'songs',
        label: (c) => c.t('Play sad songs on repeat', 'Hüzünlü şarkıları başa sar'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return c.t('You played the same sad song 84 times. Your music app got worried.', 'Aynı hüzünlü şarkıyı 84 kez dinledin. Müzik uygulaman bile endişelendi.');
        },
      },
      {
        id: 'friend',
        label: (c) => (c.vars.fid ? c.t(`Call ${nm(c, 'fid')}`, `${acc(nm(c, 'fid'))} ara`) : c.t('Eat ice cream alone', 'Tek başına dondurma ye')),
        resolve: (c) => {
          if (c.vars.fid) {
            c.h.closeness(String(c.vars.fid), 6);
            c.h.stat('happiness', 2);
            return c.t(
              `${nm(c, 'fid')} came over with ice cream and insulted ${nm(c)} for an hour. Healing.`,
              `${nm(c, 'fid')} dondurmayla çıkageldi ve bir saat boyunca ${acc(nm(c))} yerden yere vurdu. Şifa gibi.`,
            );
          }
          c.h.stat('happiness', -1);
          c.h.stat('health', -1);
          return c.t('You ate a whole tub of ice cream. Your heart is broken, but cold.', 'Koca bir kutu dondurmayı bitirdin. Kalbin kırık ama en azından serin.');
        },
      },
      {
        id: 'poem',
        label: (c) => c.t('Write a very long poem', 'Upuzun bir şiir yaz'),
        resolve: (c) => {
          c.h.flag('teen_poet');
          c.h.stat('smarts', 2);
          c.h.stat('happiness', -2);
          return c.t('You wrote twelve pages. You rhymed "heart" with "apart" eleven times.', 'On iki sayfa şiir yazdın. "Kalbim" ile "hâlim" kelimelerini on bir kez kafiyeledin.');
        },
      },
    ],
  },
  {
    id: 'base.prom',
    category: 'milestone',
    minAge: 17,
    maxAge: 17,
    once: true,
    weight: 9,
    when: (c) => c.p.school === 'highschool',
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: opposite(c) }).id;
    },
    title: (c) => c.t('The graduation ball is next week.', 'Mezuniyet balosu haftaya.'),
    text: (c) =>
      c.t('Everyone has a date, an outfit or a plan. You have a plan to make a plan.', 'Herkesin ya bir dans eşi, ya bir kıyafeti ya da bir planı var. Senin plan yapma planın var.'),
    choices: [
      {
        id: 'friends',
        label: (c) => c.t('Go with your friends', 'Arkadaşlarınla git'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          friends(c).forEach((f) => c.h.closeness(f.person.id, 3));
          return c.t('You went as a group and took 400 photos. Twelve of them are good.', 'Grupça gittiniz ve 400 fotoğraf çektiniz. On ikisi güzel çıktı.');
        },
        tone: 'good',
      },
      {
        id: 'ask',
        label: (c) => c.t(`Ask ${nm(c)} to go with you`, `${dat(nm(c))} birlikte gitmeyi teklif et`),
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 250)) {
            c.h.stat('happiness', 9);
            return c.t(
              `${nm(c)} said yes. You stepped on each other's feet all night. Perfect.`,
              `${nm(c)} kabul etti. Bütün gece birbirinizin ayağına bastınız. Mükemmeldi.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t(`${nm(c)} was already going with someone. You danced with a chaperone.`, `${nm(c)} zaten başkasıyla gidiyormuş. Sen de nöbetçi öğretmenle dans ettin.`);
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it for pizza', 'Baloyu ekip pizza ye'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You skipped the ball and ate pizza with the other skippers. A secret society was formed.', 'Baloyu ekip diğer ekenlerle pizza yedin. Gizli bir cemiyet kuruldu.');
        },
      },
    ],
  },
  {
    id: 'base.career_path',
    category: 'school',
    minAge: 16,
    maxAge: 17,
    once: true,
    weight: 7,
    when: inSchool,
    setup: (c) => {
      c.vars.job = c.rng.int(0, CAREER_TEST.length - 1);
    },
    title: (c) => {
      const [en, tr] = CAREER_TEST[Number(c.vars.job)];
      return c.t(`The career test says you should be ${en}.`, `Meslek testi senin ${tr} olman gerektiğini söylüyor.`);
    },
    text: (c) => c.t('The counselor nods as if this makes sense.', 'Rehber öğretmen bu çok mantıklıymış gibi başını sallıyor.'),
    choices: [
      {
        id: 'dream',
        label: (c) => c.t('Follow your own dream instead', 'Kendi hayalinin peşinden git'),
        resolve: (c) => {
          c.h.flag('teen_dreamer');
          c.h.stat('happiness', 5);
          return c.t('You ignored the test and made a vision board. It has a lot of glitter.', 'Testi boş verip bir hayal panosu yaptın. Bolca sim var üstünde.');
        },
        tone: 'good',
      },
      {
        id: 'practical',
        label: (c) => c.t('Pick something practical', 'Mantıklı bir şey seç'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', -1);
          return c.t('You chose something sensible and started a study plan. Very adult. Slightly sad.', 'Akıllıca bir şey seçip çalışma planı yaptın. Çok olgun. Biraz da hüzünlü.');
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Ask the family', 'Aileye danış'),
        resolve: (c) => {
          closeParents(c, 2);
          c.h.stat('happiness', 1);
          return c.t(
            'A family meeting was held. Three votes for doctor, one for lawyer, and an aunt said "just marry well."',
            'Aile meclisi toplandı. Üç oy doktor, bir oy avukat çıktı. Teyzen de "Hayırlı bir kısmet çıksın yeter" dedi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.parent_money',
    category: 'family',
    minAge: 15,
    maxAge: 19,
    once: true,
    weight: 6,
    when: (c) => parents(c).length > 0 && !c.p.jobId,
    title: (c) => c.t('You overheard your parents arguing about money.', 'Ailenin para yüzünden tartıştığını duydun.'),
    text: (c) => c.t('The words "rent" and "somehow" came up a lot.', '"Kira" ve "bir şekilde" kelimeleri çok geçti.'),
    choices: [
      {
        id: 'give',
        label: (c) => c.t('Offer them your savings', 'Birikimini onlara ver'),
        requires: (c) => c.p.money > 0,
        requiresLabel: 'Not enough savings',
        resolve: (c) => {
          const amt = Math.min(c.p.money, wage(c, 600));
          c.h.money(-amt);
          closeParents(c, 8);
          c.h.stat('happiness', 2);
          return c.t(
            `You handed over ${c.h.fmt(amt)} from your savings. Your parents hugged you for a very long time.`,
            `Kumbarandaki ${c.h.fmt(amt)} birikimi ailene verdin. Sana uzun, çok uzun sarıldılar.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'work',
        label: (c) => c.t('Get a part-time job', 'Yarı zamanlı bir iş bul'),
        resolve: (c) => {
          const pay = wage(c, c.rng.int(300, 600));
          c.h.money(pay);
          c.h.stat('health', -2);
          closeParents(c, 3);
          return c.t(
            `You started stacking shelves after school so you'd stop asking for pocket money. You earned ${c.h.fmt(pay)}.`,
            `Harçlık istememek için okuldan sonra market raflarını dizmeye başladın. Bu yıl ${c.h.fmt(pay)} kazandın.`,
          );
        },
      },
      {
        id: 'nothing',
        label: (c) => c.t('Pretend you heard nothing', 'Hiçbir şey duymamış gibi yap'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t('You pretended you heard nothing, and quietly stopped asking for things.', 'Hiçbir şey duymamış gibi yaptın ve sessizce bir şey istemeyi bıraktın.');
        },
      },
    ],
  },
  {
    id: 'base.road_trip',
    category: 'random',
    minAge: 17,
    maxAge: 22,
    once: true,
    weight: 7,
    setup: (c) => {
      const fr = friends(c);
      c.vars.pid = fr.length ? c.rng.pick(fr).person.id : c.h.newPerson({ age: c.age + c.rng.int(0, 2) }).id;
    },
    title: (c) => c.t(`${nm(c)} wants to go on a road trip.`, `${nm(c)} yola düşmek istiyor.`),
    text: (c) => c.t('The car is twenty years old. The plan is "the coast."', 'Araba yirmi yaşında. Plan ise "sahile doğru."'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Go (${c.h.fmt(wage(c, 250))} for gas and snacks)`, `Git (benzin ve atıştırmalık: ${c.h.fmt(wage(c, 250))})`),
        requires: (c) => canPay(c, 250),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 250));
          const friend = who(c);
          if (!c.p.relations.some((r) => r.personId === friend.id)) c.h.addRelation(friend, 'friend', 60);
          c.h.closeness(friend.id, 8);
          c.h.stat('happiness', 8);
          if (c.rng.chance(0.4)) {
            return c.t(
              `The car died halfway. You and ${nm(c)} spent two days in a village waiting for a part. Best two days of your life.`,
              `Araba yolun yarısında öldü. ${wth(nm(c))} parça beklerken bir köyde iki gün geçirdiniz. Hayatının en güzel iki günüydü.`,
            );
          }
          return c.t(
            `You and ${nm(c)} sang the same five songs for 900 kilometers and reached the sea at sunset.`,
            `${wth(nm(c))} 900 kilometre boyunca aynı beş şarkıyı söylediniz ve denize gün batarken vardınız.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Stay home', 'Evde kal'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(`You stayed home and watched ${nm(c)}'s trip in stories.`, `Evde kalıp ${gen(nm(c))} yolculuğunu hikâyelerden izledin.`);
        },
      },
    ],
  },
  {
    id: 'base.music_festival',
    category: 'random',
    minAge: 16,
    maxAge: 24,
    weight: 6,
    cooldown: 5,
    title: (c) => c.t('Tickets for the summer festival just dropped.', 'Yaz festivalinin biletleri satışa çıktı.'),
    text: (c) => c.t('Three days, forty bands, one leaky tent.', 'Üç gün, kırk grup, bir de su alan çadır.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Buy a ticket (${c.h.fmt(wage(c, 150))})`, `Bilet al (${c.h.fmt(wage(c, 150))})`),
        requires: (c) => canPay(c, 150),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('happiness', 8);
          const roll = c.rng.int(0, 2);
          if (roll === 0) {
            c.h.stat('health', -3);
            return c.t('You got sunburned in the exact shape of your bag strap. Worth it.', 'Çantanın askısı şeklinde güneş yanığıyla döndün. Değdi.');
          }
          if (roll === 1) {
            const friend = c.h.newPerson({ age: c.age + c.rng.int(-1, 3) });
            c.h.addRelation(friend, 'friend', 55);
            return c.t(
              `You shared a tent wall with ${friend.firstName} for three days. Now you're friends for life.`,
              `Üç gün boyunca ${wth(friend.firstName)} çadır duvarı paylaştın. Artık ömürlük dostsunuz.`,
            );
          }
          return c.t('You lost your voice on day one and your shoes on day two. Best weekend ever.', 'İlk gün sesini, ikinci gün ayakkabılarını kaybettin. Yılın en iyi hafta sonuydu.');
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it this year', 'Bu sene pas geç'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          const i = c.rng.int(0, FESTIVAL_SKIP.length - 1);
          return c.t(FESTIVAL_SKIP[i][0], FESTIVAL_SKIP[i][1]);
        },
      },
    ],
  },
  {
    id: 'base.volunteer',
    category: 'random',
    minAge: 15,
    maxAge: 20,
    once: true,
    weight: 6,
    title: (c) => c.t('The animal shelter needs weekend volunteers.', 'Hayvan barınağı hafta sonları için gönüllü arıyor.'),
    text: (c) => c.t('The dogs need walking. The cats need nothing from anyone.', 'Köpeklerin yürüyüşe ihtiyacı var. Kediler ise kimseden bir şey beklemiyor.'),
    choices: [
      {
        id: 'dogs',
        label: (c) => c.t('Sign up to walk dogs', 'Köpek gezdirmeye yazıl'),
        resolve: (c) => {
          c.h.flag('teen_volunteer');
          c.h.stat('health', 3);
          c.h.stat('happiness', 5);
          return c.t('You walked dogs every Saturday. A beagle named Biscuit chose you as his person.', 'Her cumartesi köpek gezdirdin. Bisküvi adlı bir beagle seni kendi insanı ilan etti.');
        },
        tone: 'good',
      },
      {
        id: 'cats',
        label: (c) => c.t('Volunteer in the cat room', 'Kedi odasında gönüllü ol'),
        resolve: (c) => {
          c.h.flag('teen_volunteer');
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t('You cleaned litter boxes all year. The cats tolerated you. High praise.', 'Bütün yıl kum kabı temizledin. Kediler varlığına katlandı. Büyük iltifat.');
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Too busy', 'Hiç vaktin yok'),
        resolve: (c) => c.t('You were too busy. Doing what, nobody knows.', 'Çok meşguldün. Neyle, kimse bilmiyor.'),
      },
    ],
  },
  {
    id: 'base.learner_driver',
    category: 'random',
    minAge: 16,
    maxAge: 18,
    once: true,
    weight: 6,
    when: (c) => hasParent(c) && !c.h.has('license'),
    setup: pickParent,
    title: (c) => c.t(`Your ${ke(c)} is teaching you to drive.`, `${cap(kt(c))} sana araba kullanmayı öğretiyor.`),
    text: (c) =>
      inTr(c)
        ? c.t('A minibus just pulled out right in front of you.', 'Önüne birden bir dolmuş kırdı.')
        : c.t('A delivery van just pulled out right in front of you.', 'Önüne birden bir kamyonet kırdı.'),
    choices: [
      {
        id: 'brake',
        label: (c) => c.t('Slam the brakes', 'Frene asıl'),
        resolve: (c) => {
          if (c.rng.chance(0.75)) {
            c.h.closeness(String(c.vars.par), 4);
            c.h.stat('happiness', 2);
            return c.t(
              `You stopped in time. Your ${ke(c)} said nothing for ten minutes, then: "Good."`,
              `Zamanında durdun. ${cap(kt(c))} on dakika tek kelime etmedi, sonra "Aferin" dedi.`,
            );
          }
          c.h.stat('health', -2);
          c.h.closeness(String(c.vars.par), -2);
          return c.t('You stopped. Mostly. One small dent and a very loud lecture.', 'Durdun. Sayılır. Ufak bir göçük ve çok sesli bir nutuk.');
        },
      },
      {
        id: 'swerve',
        label: (c) => c.t('Swerve like in the movies', 'Filmlerdeki gibi direksiyonu kır'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            return c.t(
              `You swerved perfectly. Your ${ke(c)} is now checking ${his(who(c, 'par'))} own heartbeat.`,
              `Kusursuz bir manevra yaptın. ${cap(kt(c))} şu an kendi nabzını ölçüyor.`,
            );
          }
          c.h.stat('health', -4);
          c.h.closeness(String(c.vars.par), -6);
          return c.t(
            `You swerved into a hedge. Your ${ke(c)} will be telling this story at every wedding.`,
            `Çalılığa daldın. ${cap(kt(c))} bu hikâyeyi bundan sonra her düğünde anlatacak.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'hand',
        label: (c) => c.t('Hand over the wheel', 'Direksiyonu devret'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.closeness(String(c.vars.par), 1);
          return inTr(c)
            ? c.t('You swapped seats on the spot. The minibus driver honked his approval.', 'Oracıkta yer değiştirdiniz. Dolmuş şoförü kornayla onayını bildirdi.')
            : c.t('You swapped seats on the spot. The van driver honked his approval.', 'Oracıkta yer değiştirdiniz. Kamyonet şoförü kornayla onayını bildirdi.');
        },
      },
    ],
  },
  {
    id: 'base.grad_party',
    category: 'milestone',
    minAge: 18,
    maxAge: 19,
    once: true,
    weight: 10,
    // Graduation year is taken by the after-high-school choice, so the party lands a year late.
    when: (c) => c.p.education === 'highschool' && hasParent(c),
    setup: (c) => {
      c.vars.cash = wage(c, c.rng.int(200, 600));
    },
    title: (c) => c.t('Your family throws you a graduation party.', 'Ailen sana mezuniyet partisi veriyor.'),
    text: (c) =>
      c.t(
        'It is a year late because your aunt insisted on the "right" hall. Relatives you have never met are arriving with envelopes.',
        'Teyzen "doğru" salonu tutmakta ısrar ettiği için tam bir yıl gecikmeli. Hiç tanımadığın akrabalar ellerinde zarflarla geliyor.',
      ),
    choices: [
      {
        id: 'speech',
        label: (c) => c.t('Give a little speech', 'Kısa bir konuşma yap'),
        resolve: (c) => {
          const cash = Number(c.vars.cash);
          c.h.money(cash);
          closeParents(c, 4);
          c.h.stat('happiness', 5);
          return c.t(
            `You gave a speech. An uncle cried. The envelopes held ${c.h.fmt(cash)} in total.`,
            `Bir konuşma yaptın. Bir amca ağladı. Zarflardan toplam ${c.h.fmt(cash)} çıktı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'save',
        label: (c) => c.t('Put every envelope in the bank', 'Bütün zarfları bankaya yatır'),
        resolve: (c) => {
          const cash = Number(c.vars.cash);
          c.h.money(cash);
          c.h.flag('teen_saver');
          c.h.stat('smarts', 1);
          return c.t(
            `You banked every envelope. Your account grew by ${c.h.fmt(cash)}. Your future self salutes you.`,
            `Bütün zarfları bankaya yatırdın. Hesabına ${c.h.fmt(cash)} geçti. Gelecekteki sen seni selamlıyor.`,
          );
        },
      },
      {
        id: 'spend',
        label: (c) => c.t('Spend it all on a new phone', 'Hepsini yeni bir telefona yatır'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('You spent every envelope on a new phone the same night. Its case is already cracked.', 'Bütün zarfları aynı gece yeni bir telefona bastın. Kılıfı şimdiden çatlak.');
        },
      },
    ],
  },

  // ============================================ 19–24
  {
    id: 'base.moving_out',
    category: 'milestone',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 10,
    // only someone still in the parents' home, with no partner, spouse or children of their own
    when: (c) => hasParent(c) && !c.h.has('teen_moved_out') && c.p.school !== 'university' && !settled(c) && atParents(c),
    setup: pickParent,
    title: (c) => c.t('You found a room in a shared flat.', 'Ev arkadaşlı bir dairede boş oda buldun.'),
    text: (c) => c.t('Cheap rent, three flatmates, one bathroom.', 'Kira ucuz. Üç ev arkadaşı, tek banyo.'),
    choices: [
      {
        id: 'move',
        label: (c) => c.t(`Move out (${c.h.fmt(wage(c, 600))} deposit)`, `Taşın (depozito: ${c.h.fmt(wage(c, 600))})`),
        badge: 'Big change',
        resolve: (c) => {
          c.h.money(-wage(c, 600));
          c.h.flag('teen_moved_out');
          c.h.stat('happiness', 6);
          // the Home screen should show the room you moved into, not your parents' home
          c.p.home = { name: homeTitle('room', c.p.city, c.lang), value: 0, owned: false, furniture: c.p.home.furniture };
          houseState(c.p).tier = 'room';
          c.h.closeness(String(c.vars.par), -1);
          return c.t(
            `You moved out. Your ${ke(c)} cried at the door and packed you forty jars of food.`,
            `Evden çıktın. ${cap(kt(c))} kapıda ağladı ve yanına kırk kavanoz yiyecek koydu.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay home and save', 'Evde kalıp para biriktir'),
        resolve: (c) => {
          c.h.money(wage(c, 700));
          c.h.stat('happiness', -2);
          return c.t(
            `You stayed home. Free laundry, zero privacy, and ${c.h.fmt(wage(c, 700))} more in the bank.`,
            `Evde kaldın. Çamaşır bedava, mahremiyet sıfır. Hesabında da ${c.h.fmt(wage(c, 700))} fazladan var.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.flatmate_dishes',
    category: 'random',
    minAge: 18,
    maxAge: 26,
    weight: 9,
    cooldown: 6,
    // the shared flat ends when you marry, have a child or buy a place
    when: (c) => c.h.has('teen_moved_out') && !settled(c),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(-1, 3) }).id;
    },
    title: (c) => c.t(`Your flatmate ${nm(c)} hasn't washed a dish in three weeks.`, `Ev arkadaşın ${nm(c)} üç haftadır tek bir bulaşık yıkamadı.`),
    text: (c) => c.t('The sink has developed its own ecosystem.', 'Lavabo kendi ekosistemini kurmuş durumda.'),
    choices: [
      {
        id: 'note',
        label: (c) => c.t('Leave a passive-aggressive note', 'İğneleyici bir not bırak'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 2);
            return c.t(`${nm(c)} washed one spoon. Progress.`, `${nm(c)} bir kaşık yıkadı. İlerleme var.`);
          }
          c.h.stat('happiness', -2);
          return c.t(
            `${nm(c)} replied with a note. You replied to the note. The fridge is now a wall of letters.`,
            `${nm(c)} nota notla cevap verdi. Sen de ona. Buzdolabı artık mektup duvarına döndü.`,
          );
        },
      },
      {
        id: 'chart',
        label: (c) => c.t('Make a chore chart with stickers', 'Çıkartmalı bir iş bölümü çizelgesi yap'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.5)) {
            c.h.addRelation(who(c), 'friend', 55);
            c.h.stat('happiness', 4);
            return c.t(
              `The chart worked. ${nm(c)} turned out to love stickers. You're friends now.`,
              `Çizelge işe yaradı. ${nm(c)} çıkartmalara bayılıyormuş. Artık arkadaşsınız.`,
            );
          }
          return c.t(`${nm(c)} gave ${him(who(c))}self a gold star for "existing."`, `${nm(c)} kendine "var olduğu için" altın yıldız verdi.`);
        },
      },
      {
        id: 'wash',
        label: (c) => c.t('Wash it all yourself', 'Hepsini kendin yıka'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(`You washed everything. ${nm(c)} thanked you by using every dish again.`, `Her şeyi yıkadın. ${nm(c)} sana teşekkürünü bütün tabakları yeniden kullanarak gösterdi.`);
        },
      },
    ],
  },
  {
    id: 'base.mom_visit',
    category: 'family',
    minAge: 18,
    maxAge: 26,
    weight: 8,
    cooldown: 5,
    when: (c) => c.h.has('teen_moved_out') && hasParent(c),
    setup: pickParent,
    title: (c) => c.t(`Your ${ke(c)} showed up at your flat unannounced.`, `${cap(kt(c))} habersiz kapına dayandı.`),
    text: (c) => c.t('With six containers of food and a very critical eye.', 'Elinde altı saklama kabı yemek, gözlerinde ise keskin bir müfettiş bakışı.'),
    choices: [
      {
        id: 'eat',
        label: (c) => c.t('Sit down and eat everything', 'Otur ve hepsini ye'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.closeness(String(c.vars.par), 5);
          return c.t(
            `You ate until you couldn't move. Your ${ke(c)} looked happier than you've seen in years.`,
            `Kımıldayamayacak hâle gelene kadar yedin. ${cap(kt(c))} yıllardır bu kadar mutlu görünmemişti.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'clean',
        label: (c) => c.t(`Let ${him(who(c, 'par'))} "just tidy a little"`, '"Azıcık toparlamasına" izin ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), 3);
          c.h.stat('happiness', -1);
          return c.t(
            'Three hours later your flat was spotless and you could find nothing ever again.',
            'Üç saat sonra ev pırıl pırıldı ve sen artık hiçbir şeyi bulamıyordun.',
          );
        },
      },
      {
        id: 'hide',
        label: (c) => c.t(`Keep ${him(who(c, 'par'))} at the door`, 'Kapıda karşıla, içeri alma'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.par), -4);
          return c.t(
            `You chatted at the door. Your ${ke(c)} saw the sink over your shoulder anyway.`,
            `Kapıda ayaküstü konuştunuz. ${cap(kt(c))} yine de omzunun üstünden lavaboyu gördü.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.move_back_home',
    category: 'family',
    minAge: 21,
    maxAge: 27,
    once: true,
    weight: 8,
    when: (c) => c.h.has('teen_moved_out') && hasParent(c) && !settled(c),
    setup: pickParent,
    title: (c) => c.t('Rent went up again.', 'Kiraya yine zam geldi.'),
    text: (c) =>
      c.t(
        `Your old room at your ${ke(c)}'s place still has your posters on the wall.`,
        `${cap(kt(c, 'par', 'gen'))} evindeki eski odanda posterlerin hâlâ duvarda asılı.`,
      ),
    choices: [
      {
        id: 'back',
        label: (c) => c.t('Move back home', 'Baba evine geri dön'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.unflag('teen_moved_out');
          c.p.home = { name: homeTitle('parents', c.p.city, c.lang), value: 0, owned: false, furniture: c.p.home.furniture };
          houseState(c.p).tier = 'parents';
          c.h.money(wage(c, 1000));
          c.h.closeness(String(c.vars.par), 4);
          c.h.stat('happiness', -3);
          return c.t(
            `You moved back and saved ${c.h.fmt(wage(c, 1000))} this year. Your ${ke(c)} now asks where you are at 11 p.m. again.`,
            `Geri taşındın ve bu yıl ${c.h.fmt(wage(c, 1000))} biriktirdin. ${cap(kt(c))} yine gece on birde nerede olduğunu soruyor.`,
          );
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Tough it out', 'Diş sık, idare et'),
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('happiness', 2);
          c.h.stat('health', -1);
          return c.t('You stayed. Instant noodles for a month, but your own front door.', 'Kaldın. Bir ay boyunca hazır erişte yedin ama kapının anahtarı sende.');
        },
      },
    ],
  },
  {
    id: 'base.first_salary',
    category: 'money',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 10,
    when: (c) => !!c.p.jobId,
    title: (c) => c.t('Your first full salary just landed.', 'İlk tam maaşın hesabına yattı.'),
    text: (c) => c.t('It feels like a fortune. It is not a fortune.', 'Servet gibi geliyor. Servet değil.'),
    choices: [
      {
        id: 'splurge',
        label: (c) => c.t('Buy the sneakers', 'O spor ayakkabıyı al'),
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('happiness', 7);
          c.h.stat('looks', 2);
          return c.t('You bought sneakers that cost more than your phone bill for a year. They are beautiful.', 'Bir yıllık telefon faturandan pahalı bir spor ayakkabı aldın. Çok güzeller ama.');
        },
      },
      {
        id: 'gift',
        label: (c) => c.t('Buy your parents a gift', 'Ailene hediye al'),
        requires: hasParent,
        requiresLabel: 'No opening',
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          closeParents(c, 8);
          c.h.stat('happiness', 5);
          return c.t(
            'You bought your parents a gift with your first salary. They showed it to every neighbor on the street.',
            'İlk maaşınla ailene hediye aldın. Sokaktaki bütün komşulara tek tek gösterdiler.',
          );
        },
        tone: 'good',
      },
      {
        id: 'save',
        label: (c) => c.t('Save every penny', 'Kuruşu kuruşuna biriktir'),
        resolve: (c) => {
          c.h.flag('teen_saver');
          c.h.stat('smarts', 2);
          return c.t('You saved it. Then you saved the next one. Who even are you?', 'Biriktirdin. Sonra bir sonrakini de. Sen kimsin yahu?');
        },
      },
    ],
  },
  {
    id: 'base.quarter_life',
    category: 'random',
    minAge: 22,
    maxAge: 24,
    once: true,
    weight: 7,
    title: (c) => c.t(`You are ${c.age} and have no idea what you're doing.`, `${c.age} yaşındasın ve ne yaptığın hakkında en ufak fikrin yok.`),
    text: (c) =>
      c.t('Everyone online seems to be engaged, promoted or on a beach in Bali.', 'İnternette herkes ya nişanlanmış, ya terfi almış ya da Bali sahilinde.'),
    choices: [
      {
        id: 'learn',
        label: (c) => c.t('Learn something new', 'Yeni bir şey öğren'),
        resolve: (c) => {
          c.h.money(-wage(c, 100));
          c.h.stat('smarts', 4);
          c.h.stat('happiness', 2);
          return c.t('You signed up for a pottery course. Your first bowl is a plate. You love it.', 'Seramik kursuna yazıldın. İlk kâsen tabak oldu. Bayıldın.');
        },
        tone: 'good',
      },
      {
        id: 'village',
        label: (c) => c.t('Quit everything for a season in a village', 'Her şeyi bırakıp bir mevsim köye git'),
        badge: 'Big change',
        resolve: (c) => {
          const quit = !!c.p.jobId;
          if (quit) c.h.setJob(null);
          c.h.money(-wage(c, 400));
          c.h.stat('happiness', 9);
          c.h.stat('health', 3);
          return quit
            ? c.t(
                'You quit and spent six months in a village growing tomatoes. They were terrible. You came back happy, and jobless.',
                'İşi bırakıp altı ay bir köyde domates yetiştirdin. Domatesler berbattı. Mutlu döndün; işsiz ama mutlu.',
              )
            : c.t(
                'You spent six months in a village growing tomatoes. They were terrible. You came back happy.',
                'Altı ay bir köyde domates yetiştirdin. Domatesler berbattı. Mutlu döndün.',
              );
        },
        tone: 'big',
      },
      {
        id: 'plant',
        label: (c) => c.t('Buy a houseplant', 'Bir saksı çiçeği al'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t("You bought a plant. It's the only thing in your life that's thriving.", 'Bir saksı çiçeği aldın. Hayatında şu an gelişen tek şey o.');
        },
      },
    ],
  },
  {
    id: 'base.backpacking',
    category: 'random',
    minAge: 19,
    maxAge: 24,
    once: true,
    weight: 6,
    title: (c) => c.t('A flight to a country you cannot pronounce is on sale.', 'Adını telaffuz edemediğin bir ülkeye uçak bileti indirimde.'),
    text: (c) => c.t('Hostels are cheap. Your backpack is ready. Your family is not.', 'Hosteller ucuz. Sırt çantan hazır. Ailen hazır değil.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Go for a month (${c.h.fmt(wage(c, 900))})`, `Bir ay git (${c.h.fmt(wage(c, 900))})`),
        requires: (c) => canPay(c, 900),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 900));
          c.h.stat('happiness', 8);
          c.h.stat('smarts', 2);
          if (c.rng.chance(0.5)) {
            const friend = c.h.newPerson({ age: c.age + c.rng.int(-2, 4) });
            c.h.addRelation(friend, 'friend', 60);
            return c.t(
              `You met ${friend.firstName} on a night bus. You've sent each other a postcard every month since.`,
              `Bir gece otobüsünde ${wth(friend.firstName)} tanıştın. O günden beri her ay birbirinize kartpostal atıyorsunuz.`,
            );
          }
          return c.t('You came back thinner, tanned and very annoying about "local cuisine."', 'Zayıflamış, bronzlaşmış ve "yerel mutfak" konusunda çekilmez biri olarak döndün.');
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Maybe next year', 'Belki seneye'),
        resolve: (c) => c.t('You closed the tab. Next year, definitely. Probably.', 'Sekmeyi kapattın. Seneye kesin. Herhâlde.'),
      },
    ],
  },
  {
    id: 'base.friend_split',
    category: 'random',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 6,
    when: (c) => friends(c).length >= 2,
    setup: (c) => {
      const fr = [...friends(c)].sort(() => c.rng.next() - 0.5);
      c.vars.a = fr[0].person.id;
      c.vars.b = fr[1].person.id;
    },
    title: (c) => c.t('Your friend group is falling apart.', 'Arkadaş grubunuz dağılıyor.'),
    text: (c) =>
      c.t(
        `${nm(c, 'a')} and ${nm(c, 'b')} fought over a borrowed jacket. Now it's about everything.`,
        `${wth(nm(c, 'a'))} ${nm(c, 'b')} ödünç bir ceket yüzünden kavga etti. Şimdi her şey için kavga ediyorlar.`,
      ),
    choices: [
      {
        id: 'a',
        label: (c) => c.t(`Side with ${nm(c, 'a')}`, `${gen(nm(c, 'a'))} tarafını tut`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.a), 8);
          c.h.closeness(String(c.vars.b), -15);
          return c.t(`You took ${nm(c, 'a')}'s side. ${nm(c, 'b')} unfollowed you within the hour.`, `${gen(nm(c, 'a'))} tarafını tuttun. ${nm(c, 'b')} bir saat içinde seni takipten çıktı.`);
        },
      },
      {
        id: 'b',
        label: (c) => c.t(`Side with ${nm(c, 'b')}`, `${gen(nm(c, 'b'))} tarafını tut`),
        resolve: (c) => {
          c.h.closeness(String(c.vars.b), 8);
          c.h.closeness(String(c.vars.a), -15);
          return c.t(`You took ${nm(c, 'b')}'s side. ${nm(c, 'a')} kept the jacket out of spite.`, `${gen(nm(c, 'b'))} tarafını tuttun. ${nm(c, 'a')} inadına ceketi geri vermedi.`);
        },
      },
      {
        id: 'mediate',
        label: (c) => c.t('Get everyone round for pizza', 'Herkesi pizzaya çağır'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          if (c.rng.chance(0.4 + c.p.stats.smarts / 300)) {
            c.h.closeness(String(c.vars.a), 5);
            c.h.closeness(String(c.vars.b), 5);
            c.h.stat('happiness', 4);
            return c.t('Peace was restored over pizza you paid for. Diplomacy is expensive.', 'Parasını senin ödediğin pizza eşliğinde barış sağlandı. Diplomasi pahalı iş.');
          }
          c.h.closeness(String(c.vars.a), -4);
          c.h.closeness(String(c.vars.b), -4);
          return c.t('Both of them now think you are on the other side. And you paid for the pizza.', 'İkisi de artık karşı tarafta olduğunu düşünüyor. Üstüne pizzayı da sen ödedin.');
        },
      },
    ],
  },
  {
    id: 'base.gym_phase',
    category: 'health',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 7,
    title: (c) => c.t('You joined a gym and it is now your entire personality.', 'Spor salonuna yazıldın; artık başka hiçbir şeyden bahsetmiyorsun.'),
    text: (c) => c.t('Your friends have muted you.', 'Arkadaşların seni sessize aldı.'),
    choices: [
      {
        id: 'commit',
        label: (c) => c.t(`Commit for a year (${c.h.fmt(wage(c, 200))})`, `Bir yıl devam et (${c.h.fmt(wage(c, 200))})`),
        resolve: (c) => {
          c.h.money(-wage(c, 200));
          c.h.stat('health', 6);
          c.h.stat('looks', 3);
          return c.t('A year in, you open jars for the whole building.', 'Bir yılın sonunda bütün apartmanın kavanozlarını sen açıyorsun.');
        },
        tone: 'good',
      },
      {
        id: 'powder',
        label: (c) => c.t('Mostly buy protein powder', 'Çoğunlukla protein tozu al'),
        resolve: (c) => {
          c.h.money(-wage(c, 60));
          c.h.stat('health', 1);
          return c.t('You bought a giant tub of protein powder. You put it in pancakes. Sometimes.', 'Dev bir kutu protein tozu aldın. Arada bir krepe katıyorsun.');
        },
      },
      {
        id: 'quit',
        label: (c) => c.t('Go three times, then stop', 'Üç kez git, sonra bırak'),
        resolve: (c) => {
          c.h.money(-wage(c, 120));
          c.h.stat('happiness', 1);
          return c.t('You went three times. You kept paying for a year. A generous donation to the gym.', 'Üç kez gittin. Bir yıl boyunca ödemeye devam ettin. Salona cömert bir bağış.');
        },
      },
    ],
  },
  {
    id: 'base.cooking_disaster',
    category: 'random',
    minAge: 18,
    maxAge: 24,
    weight: 6,
    cooldown: 6,
    title: (c) => c.t('You tried a new recipe. The smoke alarm disagrees.', 'Yeni bir tarif denedin. Duman alarmı aynı fikirde değil.'),
    text: (c) => c.t('Your dinner guests arrive in twenty minutes.', 'Misafirler yirmi dakikaya burada.'),
    choices: [
      {
        id: 'takeout',
        label: (c) => c.t('Order takeout and plate it as yours', 'Dışarıdan sipariş ver, kendi tabağına koy'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          c.h.stat('happiness', 2);
          return c.t('You served takeout in your own pots. Someone asked for the recipe.', 'Hazır yemeği kendi tencerelerinde servis ettin. Biri tarifini istedi.');
        },
      },
      {
        id: 'save',
        label: (c) => c.t('Save it with garlic and confidence', 'Sarımsak ve özgüvenle kurtar'),
        resolve: (c) => {
          if (c.rng.chance(c.h.has('teen_can_cook') ? 0.7 : 0.35)) {
            c.h.flag('teen_can_cook');
            c.h.stat('happiness', 5);
            return c.t('You saved it. Compliments all round. Nobody saw the first attempt in the bin.', 'Kurtardın. Herkes iltifat yağdırdı. Çöpteki ilk denemeyi kimse görmedi.');
          }
          c.h.stat('happiness', -3);
          return c.t('It was charcoal with a side of charcoal. Your guests were very polite about it.', 'Yanında kömür garnitürlü kömür oldu. Misafirler çok kibar davrandı.');
        },
      },
      {
        id: 'call',
        label: (c) => c.t('Call home for help', 'Evi arayıp yardım iste'),
        requires: hasParent,
        requiresLabel: 'No opening',
        resolve: (c) => {
          c.h.flag('teen_can_cook');
          closeParents(c, 3);
          c.h.stat('smarts', 1);
          return c.t('Your parents talked you through it on speaker. You now know what "a pinch" means.', 'Ailen telefonda adım adım anlattı. "Bir tutam"ın ne demek olduğunu artık biliyorsun.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_rejections',
    category: 'work',
    minAge: 19,
    maxAge: 24,
    weight: 6,
    cooldown: 4,
    when: (c) => !c.p.jobId && c.p.school === null,
    title: (c) => c.t('Your fourteenth rejection email just arrived.', 'On dördüncü ret e-postan az önce geldi.'),
    text: (c) => c.t('"We were very impressed by your profile, however..."', '"Profiliniz bizi çok etkiledi, ancak..."'),
    choices: [
      {
        id: 'rewrite',
        label: (c) => c.t('Rewrite your résumé from scratch', 'Özgeçmişini sıfırdan yaz'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          const jobs = eligibleJobs(c);
          if (jobs.length && c.rng.chance(0.35 + (c.h.has('teen_volunteer') ? 0.15 : 0))) {
            c.h.setJob(c.rng.pick(jobs).id);
            c.h.stat('happiness', 6);
            return c.t(`Email fifteen said yes! New job title: ${c.h.jobTitle()}.`, `On beşinci e-posta "evet" dedi! Artık ${c.h.jobTitle()} olarak çalışıyorsun.`);
          }
          c.h.stat('happiness', -2);
          return c.t('Your new résumé is beautiful. Rejection fifteen arrived even faster.', 'Yeni özgeçmişin harika oldu. On beşinci ret daha da hızlı geldi.');
        },
      },
      {
        id: 'frame',
        label: (c) => c.t('Print them all and make a collage', 'Hepsini yazdırıp kolaj yap'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You made a collage of rejections. It is art now. Nobody has rejected it yet.', 'Retlerden kolaj yaptın. Artık bir sanat eseri. Henüz kimse reddetmedi.');
        },
      },
      {
        id: 'break',
        label: (c) => c.t('Take a month off', 'Bir ay ara ver'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 1);
          return c.t('You took a month off and slept like a baby. Unemployed, but well rested.', 'Bir ay ara verdin ve bebek gibi uyudun. İşsizsin ama dinlenmişsin.');
        },
      },
    ],
  },
  {
    id: 'base.mentor_letter',
    category: 'work',
    minAge: 19,
    maxAge: 24,
    once: true,
    weight: 9,
    when: (c) => {
      const id = teenState(c).mentor;
      const t = id ? c.h.person(id) : undefined;
      return !!t && t.deathYear === undefined && c.p.school !== 'university';
    },
    setup: (c) => {
      c.vars.pid = String(teenState(c).mentor);
    },
    title: (c) => c.t(`Your old teacher ${nm(c)} sends you a message.`, `Eski öğretmenin ${nm(c)} sana bir mesaj attı.`),
    text: (c) =>
      c.t(`A friend of ${his(who(c))} is hiring, and ${he(who(c))} has already put in a word for you.`, 'Bir tanıdığı eleman arıyormuş, senin için çoktan iyi bir söz söylemiş bile.'),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Go to the interview', 'Görüşmeye git'),
        badge: 'Big change',
        resolve: (c) => {
          const jobs = eligibleJobs(c);
          if (jobs.length) {
            c.h.setJob(c.rng.pick(jobs).id);
            c.h.stat('happiness', 7);
            return c.t(
              `Thanks to ${nm(c)}, you got the job: ${c.h.jobTitle()}. You sent ${him(who(c))} chocolates and a very long thank-you card.`,
              `${nm(c)} sayesinde artık ${c.h.jobTitle()} olarak çalışıyorsun. Kutu kutu çikolata ve upuzun bir teşekkür kartı gönderdin.`,
            );
          }
          c.h.stat('happiness', -1);
          return c.t('The job needed a diploma you do not have. The interviewer was very kind about it.', 'İş, sende olmayan bir diploma istiyordu. Görüşmeci çok nazik davrandı ama.');
        },
        tone: 'good',
      },
      {
        id: 'decline',
        label: (c) => c.t('Say you are doing fine', 'İdare ettiğini söyle'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(`You told ${nm(c)} you were doing fine. You were not doing fine.`, `${dat(nm(c))} idare ettiğini söyledin. Etmiyordun.`);
        },
      },
    ],
  },
  {
    id: 'base.band_reunion',
    category: 'random',
    minAge: 19,
    maxAge: 26,
    once: true,
    weight: 10,
    when: (c) => c.h.has('teen_band'),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age }).id;
    },
    title: (c) => c.t(`${nm(c)} from the old school band wants a reunion gig.`, `Okul bandosundan ${nm(c)} bir buluşma konseri yapmak istiyor.`),
    text: (c) => c.t('A café that seats thirty. Twelve people have confirmed.', 'Otuz kişilik bir kafe. On iki kişi geleceğini söyledi.'),
    choices: [
      {
        id: 'play',
        label: (c) => c.t('Dust off your instrument', 'Enstrümanının tozunu al'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 8);
          const tips = wage(c, c.rng.int(30, 90));
          c.h.money(tips);
          return c.t(
            `You and ${nm(c)} played every song you knew, twice. The tip jar held ${c.h.fmt(tips)}.`,
            `${wth(nm(c))} bildiğiniz bütün şarkıları ikişer kez çaldınız. Bahşiş kavanozundan ${c.h.fmt(tips)} çıktı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Leave the past in the past', 'Geçmiş geçmişte kalsın'),
        resolve: (c) => c.t('You declined. Somewhere, a tuba wept.', 'Teklifi geri çevirdin. Bir yerlerde bir tuba ağladı.'),
      },
    ],
  },
  {
    id: 'base.cousin_wedding',
    category: 'family',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.cousin = c.h.newPerson({ age: c.age + c.rng.int(2, 6) }).id;
      c.vars.pid = c.h.newPerson({ age: Math.max(18, c.age + c.rng.int(-2, 3)), gender: opposite(c) }).id;
    },
    title: (c) => c.t(`Your cousin ${nm(c, 'cousin')} is getting married.`, `Kuzenin ${nm(c, 'cousin')} evleniyor.`),
    text: (c) =>
      single(c)
        ? c.t(`You've been seated at the singles table, next to ${nm(c)}.`, `Seni bekârlar masasına, ${gen(nm(c))} yanına oturttular.`)
        : c.t('Every aunt in the room wants to know when it is your turn.', 'Salondaki bütün teyzeler sıranın ne zaman sana geleceğini merak ediyor.'),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Dance until the band goes home', 'Orkestra gidene kadar dans et'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('health', 1);
          return c.t('You danced so hard you lost a shoe. It was found in the cake.', 'Öyle oynadın ki bir ayakkabını kaybettin. Pastanın içinden çıktı.');
        },
        tone: 'good',
      },
      {
        id: 'gift',
        label: (c) => c.t(`Give a generous envelope (${c.h.fmt(wage(c, 150))})`, `Cömert bir zarf ver (${c.h.fmt(wage(c, 150))})`),
        resolve: (c) => {
          c.h.money(-wage(c, 150));
          c.h.stat('happiness', 2);
          return c.t(
            'You handed over a fat envelope. An aunt peeked inside right in front of you and nodded.',
            'Kalın bir zarf uzattın. Bir teyze gözünün önünde içine bakıp onaylarcasına başını salladı.',
          );
        },
      },
      {
        id: 'flirt',
        label: (c) => c.t(`Chat up ${nm(c)}`, `${wth(nm(c))} sohbeti koyulaştır`),
        requires: (c) => single(c) && c.age >= 18,
        requiresLabel: 'No opening',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.looks / 250)) {
            c.h.addRelation(who(c), 'partner', c.rng.int(55, 75));
            c.h.stat('happiness', 8);
            return c.t(
              `You and ${nm(c)} are together now. You met at a wedding, which the aunts will never stop mentioning.`,
              `${wth(nm(c))} artık sevgilisiniz. Bir düğünde tanıştınız; teyzeler bunu ömür boyu anlatacak.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t(`${nm(c)} only wanted to talk about the buffet. At length.`, `${nm(c)} sadece açık büfeden bahsetmek istedi. Uzun uzun.`);
        },
      },
    ],
  },
  {
    id: 'base.blind_date',
    category: 'love',
    minAge: 18,
    maxAge: 24,
    weight: 6,
    cooldown: 6,
    when: (c) => single(c) && friends(c).length > 0,
    setup: (c) => {
      c.vars.fid = c.rng.pick(friends(c)).person.id;
      c.vars.pid = c.h.newPerson({ age: Math.max(18, c.age + c.rng.int(-2, 3)), gender: opposite(c) }).id;
    },
    title: (c) =>
      c.t(`${nm(c, 'fid')} wants to set you up with ${his(who(c, 'fid'))} cousin ${nm(c)}.`, `${nm(c, 'fid')} seni kuzeni ${wth(nm(c))} tanıştırmak istiyor.`),
    text: (c) => c.t(`"Trust me," ${he(who(c, 'fid'))} said. Nothing good has ever followed those words.`, '"Bana güven" dedi. Bu sözden sonra hiç iyi bir şey olmamıştır.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go on the date', 'Buluşmaya git'),
        resolve: (c) => {
          c.h.money(-wage(c, 40));
          if (c.rng.chance(0.3 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(who(c), 'partner', c.rng.int(55, 80));
            c.h.closeness(String(c.vars.fid), 6);
            c.h.stat('happiness', 8);
            return c.t(
              `You and ${nm(c)} talked until the café closed. You're officially together, and ${nm(c, 'fid')} won't stop taking credit.`,
              `${wth(nm(c))} kafe kapanana kadar konuştunuz. Artık resmen birliktesiniz. Bütün övgüyü ise ${nm(c, 'fid')} üstüne alıyor.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            `${nm(c)} spent the evening explaining cryptocurrency. You faked a phone call.`,
            `${nm(c)} bütün akşam kripto parayı anlattı. Sen de sahte bir telefon görüşmesiyle kaçtın.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.fid), -2);
          return c.t(`You declined. ${nm(c, 'fid')} said "your loss" and meant it.`, `Reddettin. ${nm(c, 'fid')} "Sen kaybedersin" dedi ve ciddiydi.`);
        },
      },
    ],
  },
  {
    id: 'base.friend_with_car',
    category: 'random',
    minAge: 18,
    maxAge: 24,
    weight: 6,
    cooldown: 5,
    when: (c) => c.h.has('license') && friends(c).length > 0,
    title: (c) => c.t('You are the only friend with a car.', 'Arkadaşların arasında arabası olan tek kişi sensin.'),
    text: (c) => c.t('Your phone buzzes: "can u drive us?" It is the fifth time this week.', 'Telefonun titriyor: "Bizi bırakabilir misin?" Bu hafta beşinci oluyor.'),
    choices: [
      {
        id: 'gas',
        label: (c) => c.t('Ask for gas money', 'Benzin parası iste'),
        resolve: (c) => {
          c.h.money(wage(c, 60));
          friends(c).forEach((f) => c.h.closeness(f.person.id, -2));
          return c.t('They paid, grumbling, in coins.', 'Ödediler. Söylene söylene, bozuk parayla.');
        },
      },
      {
        id: 'yes',
        label: (c) => c.t('Drive everyone, always', 'Herkesi her yere götür'),
        resolve: (c) => {
          c.h.money(-wage(c, 80));
          friends(c).forEach((f) => c.h.closeness(f.person.id, 4));
          c.h.stat('happiness', 2);
          return c.t('You became the group taxi. Unpaid, but you control the music.', 'Grubun taksisi oldun. Para yok ama müzik senin elinde.');
        },
        tone: 'good',
      },
      {
        id: 'excuse',
        label: (c) => c.t('Say the car is "making a noise"', 'Arabanın "ses yaptığını" söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You lied about a noise. A week later, the car started making a noise. Karma.', 'Ses yapıyor diye yalan söyledin. Bir hafta sonra araba gerçekten ses yapmaya başladı. Ne ekersen onu biçersin.');
        },
      },
    ],
  },
  {
    id: 'base.credit_card',
    category: 'money',
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 7,
    title: (c) => c.t('Your bank offers you a shiny credit card.', 'Bankan sana pırıl pırıl bir kredi kartı teklif ediyor.'),
    text: (c) =>
      c.t(`The limit is ${c.h.fmt(wage(c, 1500))}. The interest rate is in very, very small print.`, `Limit ${c.h.fmt(wage(c, 1500))}. Faiz oranı ise çok ama çok küçük puntolarla yazılmış.`),
    choices: [
      {
        id: 'splurge',
        label: (c) => c.t('Max it out on nice things', 'Limiti güzel şeylere harca'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.flag('teen_card_debt');
          c.h.stat('happiness', 7);
          c.h.stat('looks', 2);
          return c.t('You maxed it out in one glorious weekend. Future you will deal with it.', 'Muhteşem bir hafta sonunda limiti doldurdun. Gelecekteki sen halleder.');
        },
      },
      {
        id: 'careful',
        label: (c) => c.t('Use it only for emergencies', 'Sadece acil durumlarda kullan'),
        resolve: (c) => {
          c.h.flag('teen_good_credit');
          c.h.stat('smarts', 2);
          return c.t('You kept it for emergencies. A pizza at 2 a.m. was declared an emergency once.', 'Kartı acil durumlar için sakladın. Bir kez gece yarısı pizzası acil durum ilan edildi.');
        },
        tone: 'good',
      },
      {
        id: 'cut',
        label: (c) => c.t('Cut it in half', 'Ortadan ikiye kes'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You cut the card in half with kitchen scissors. It felt incredible.', 'Kartı mutfak makasıyla ortadan ikiye kestin. Müthiş bir histi.');
        },
      },
    ],
  },
  {
    id: 'base.card_debt_due',
    category: 'money',
    minAge: 19,
    maxAge: 30,
    once: true,
    weight: 10,
    when: (c) => c.h.has('teen_card_debt') && c.s.year - c.p.flags['teen_card_debt'] >= 1,
    title: (c) => c.t('The credit card bill caught up with you.', 'Kredi kartı borcu sonunda yakana yapıştı.'),
    text: (c) =>
      c.t(`With interest, that one weekend now costs ${c.h.fmt(wage(c, 2200))}.`, `Faiziyle birlikte o tek hafta sonunun bedeli artık ${c.h.fmt(wage(c, 2200))}.`),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay it off and eat lentils', 'Borcu kapat, mercimekle idare et'),
        resolve: (c) => {
          c.h.unflag('teen_card_debt');
          c.h.money(-wage(c, 2200));
          c.h.stat('happiness', -3);
          c.h.stat('smarts', 2);
          return c.t('You paid it all and ate lentils for three months. Lesson learned, deliciously.', 'Hepsini ödedin ve üç ay mercimek yedin. Ders alındı, hem de lezzetli bir şekilde.');
        },
      },
      {
        id: 'parents',
        label: (c) => c.t('Ask your parents for help', 'Ailenden yardım iste'),
        requires: hasParent,
        requiresLabel: 'No opening',
        resolve: (c) => {
          c.h.unflag('teen_card_debt');
          c.h.money(-wage(c, 800));
          closeParents(c, -5);
          c.h.stat('happiness', -4);
          return c.t('Your parents covered most of it, plus a free two-hour lecture.', 'Borcun çoğunu ailen kapattı. Yanında da iki saatlik bedava nutuk.');
        },
      },
    ],
  },
  {
    id: 'base.sibling_secret',
    category: 'family',
    minAge: 14,
    maxAge: 22,
    once: true,
    weight: 6,
    when: (c) => nearSiblings(c).length > 0 && hasParent(c),
    setup: (c) => {
      c.vars.sib = c.rng.pick(nearSiblings(c)).person.id;
      c.vars.secret = c.rng.int(0, SECRETS.length - 1);
    },
    title: (c) => c.t(`Your ${ke(c, 'sib')} ${nm(c, 'sib')} tells you a secret.`, `${cap(kt(c, 'sib'))} ${nm(c, 'sib')} sana bir sır verdi.`),
    text: (c) => {
      const [en, tr] = SECRETS[Number(c.vars.secret)];
      return c.t(`${nm(c, 'sib')} ${en}.`, `${nm(c, 'sib')} sana ${tr} itiraf etti.`);
    },
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Take it to the grave', 'Sırrı mezara götür'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), 8);
          if (c.rng.chance(0.3)) {
            closeParents(c, -3);
            return c.t(
              'You kept the secret. Your parents found out anyway, and now you are both in trouble.',
              'Sırrı tuttun. Ailen yine de öğrendi ve şimdi ikiniz birden başınız dertte.',
            );
          }
          return c.t(`You kept the secret. You and ${nm(c, 'sib')} are a team now.`, `Sırrı tuttun. ${wth(nm(c, 'sib'))} artık bir takımsınız.`);
        },
        tone: 'good',
      },
      {
        id: 'tell',
        label: (c) => c.t('Tell your parents', 'Ailene söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), -10);
          closeParents(c, 3);
          return c.t(`You told your parents. ${nm(c, 'sib')} has not spoken to you in a week.`, `Ailene söyledin. ${nm(c, 'sib')} bir haftadır seninle konuşmuyor.`);
        },
      },
      {
        id: 'chores',
        label: (c) => c.t(`Trade your silence for ${his(who(c, 'sib'))} chores`, 'Susmanın karşılığında işlerini yaptır'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.sib), -3);
          c.h.stat('happiness', 4);
          return c.t(`${nm(c, 'sib')} has done your dishes for two months. Business is business.`, `${nm(c, 'sib')} iki aydır senin bulaşıklarını yıkıyor. İş iştir.`);
        },
      },
    ],
  },
];

// ------------------------------------------------ shared resolvers

function interview(c: Ctx, base: number): string {
  const bonus = c.h.has('teen_volunteer') ? 0.2 : 0;
  const [en, tr] = FIRST_JOBS[Number(c.vars.place)];
  if (c.rng.chance(base + bonus)) {
    const pay = wage(c, c.rng.int(500, 1200));
    c.h.money(pay);
    c.h.flag('teen_first_job');
    c.h.stat('happiness', 5);
    const extra = bonus
      ? c.t(' They loved your shelter volunteering.', ' Barınaktaki gönüllülüğün çok hoşlarına gitti.')
      : '';
    return (
      c.t(
        `You got the weekend job at ${en} and earned ${c.h.fmt(pay)} this year.`,
        `${cap(tr)} hafta sonu işini kaptın. Bu yıl ${c.h.fmt(pay)} kazandın.`,
      ) + extra
    );
  }
  c.h.stat('happiness', -3);
  return c.t(
    `The manager at ${en} said they would "keep your details on file." Forever, probably.`,
    `Müdür "Bilgilerinizi dosyada tutacağız" dedi. Muhtemelen sonsuza kadar.`,
  );
}

quietInMourning(teenEvents);
