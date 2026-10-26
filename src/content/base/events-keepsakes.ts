import type { Ctx, EventDef } from '../types';
import type { HeirloomType } from '../../engine/heirlooms';
import { dat, gen, quietInMourning, wage } from './util';
import type { Pair } from './keepsakes';

// How a family first comes to own the newer kinds of heirloom (radio, saz, backgammon set, coffee pot, photo album,
// fountain pen). Every one is the same small story, so they are built from one description: something is offered,
// you take it (sometimes for a price, sometimes only if you win it) or you let it go.
//
// The engine side of each kind (icon, passives, words) lives in engine/heirlooms.ts, and the text its later events
// use in content/base/keepsakes/. Nothing here may touch the random stream before the player has chosen, and each
// choice makes at most one draw, so the same seed plays the same life in English and in Turkish.

interface Offer {
  id: string;
  type: HeirloomType;
  ages: [number, number];
  /** Low on purpose: the average life gets a handful of heirlooms, not one a decade each of these. */
  weight: number;
  /** Extra eligibility on top of "the family does not own this kind yet". */
  when?: (c: Ctx) => boolean;
  title: Pair;
  text: Pair;
  take: {
    label: Pair;
    /** Price in US dollars before the country's wage factor; the choice is disabled without the money. */
    priceUsd?: number;
    /** Chance (0..1) that taking it works out. One draw, made before any text is built. Omit for a sure thing. */
    chance?: (c: Ctx) => number;
    /** The heirloom's name and the line that starts its story. */
    name: (c: Ctx) => Pair;
    story: (c: Ctx) => Pair;
    result: (c: Ctx) => Pair;
    /** Only with `chance`: what happens when it does not work out. */
    missed?: Pair;
  };
  leave: { label: Pair; result: Pair };
}

const first = (c: Ctx) => c.p.firstName;

function offer(o: Offer): EventDef {
  const price = (c: Ctx) => wage(c, o.take.priceUsd ?? 0);
  return {
    id: o.id,
    category: 'heirloom',
    minAge: o.ages[0],
    maxAge: o.ages[1],
    weight: o.weight,
    once: true,
    when: (c) => !c.h.hasHeirloom(o.type) && (o.when ? o.when(c) : true),
    setup: (c) => {
      if (o.take.priceUsd) c.vars.amt = price(c);
    },
    title: (c) => c.t(...o.title),
    text: (c) => c.t(...o.text),
    choices: [
      {
        id: 'take',
        label: (c) => c.t(...o.take.label),
        requires: o.take.priceUsd ? (c) => c.p.money >= price(c) : undefined,
        requiresLabel: o.take.priceUsd ? 'Not enough money' : undefined,
        tone: 'good',
        resolve: (c) => {
          if (o.take.priceUsd) c.h.money(-price(c));
          const works = o.take.chance ? c.rng.chance(o.take.chance(c)) : true;
          if (!works) return c.t(...o.take.missed!);
          c.h.addHeirloom(o.type, c.t(...o.take.name(c)), c.t(...o.take.story(c)));
          return c.t(...o.take.result(c));
        },
      },
      {
        id: 'leave',
        label: (c) => c.t(...o.leave.label),
        resolve: (c) => c.t(...o.leave.result),
      },
    ],
  };
}

const offers: Offer[] = [
  {
    id: 'base.keepsake_radio',
    type: 'radio',
    ages: [18, 60],
    weight: 2.5,
    title: ['A stall at the flea market has an old radio.', 'Bit pazarında bir tezgâhta eski bir radyo var.'],
    text: [
      'Walnut cabinet, a dial that glows orange, and a seller who swears it once picked up Cairo. It crackles when you touch it.',
      'Ceviz kasa, turuncu parlayan bir kadran ve bir zamanlar Kahire’yi çektiğine yemin eden bir satıcı. Dokununca cızırdıyor.',
    ],
    take: {
      label: ['Buy it', 'Satın al'],
      priceUsd: 80,
      name: (c) => [`${first(c)}'s walnut radio`, `${gen(first(c))} ceviz radyosu`],
      story: (c) => [
        `${first(c)} bought it at a flea market in ${c.s.year}. It still finds one station perfectly.`,
        `${first(c)} onu ${c.s.year} yılında bir bit pazarından aldı. Hâlâ bir istasyonu kusursuz çekiyor.`,
      ],
      result: () => [
        'You carried it home in both arms. That evening a faraway voice read the weather, and the kitchen went quiet to listen.',
        'Onu iki kolunla eve taşıdın. O akşam uzaktan bir ses hava durumunu okudu ve mutfak dinlemek için sustu.',
      ],
    },
    leave: {
      label: ['Walk on', 'Yoluna devam et'],
      result: ['You walked on. Somewhere behind you the dial kept glowing for someone else.', 'Yürüyüp gittin. Arkanda kadran bir başkası için parlamaya devam etti.'],
    },
  },
  {
    id: 'base.keepsake_saz',
    type: 'saz',
    ages: [14, 45],
    weight: 1.5,
    title: ['An old neighbour wants to give you his saz.', 'Yaşlı bir komşu bağlamasını sana vermek istiyor.'],
    text: [
      'Hasan Usta has played it at every wedding on the street, but his fingers do not obey him any more. "It needs someone who will sing with it," he says.',
      'Hasan Usta onu sokaktaki her düğünde çaldı ama parmakları artık sözünü dinlemiyor. "Onunla birlikte türkü söyleyecek birine ihtiyacı var" diyor.',
    ],
    take: {
      label: ['Accept it and promise to learn', 'Kabul et ve öğrenmeye söz ver'],
      name: () => ["Hasan Usta's saz", "Hasan Usta'nın bağlaması"],
      story: (c) => [
        `Hasan Usta gave it to ${first(c)} in ${c.s.year}, on one condition: that it is played at weddings.`,
        `Hasan Usta onu ${dat(first(c))} ${c.s.year} yılında verdi, tek şartla: düğünlerde çalınacak.`,
      ],
      result: () => [
        'He placed it in your arms like a sleeping child. Your first chord sounded like a door slamming, and he smiled anyway.',
        'Onu uyuyan bir çocuk gibi kollarına bıraktı. İlk akorun kapı çarpması gibi çıktı; yine de gülümsedi.',
      ],
    },
    leave: {
      label: ['Politely refuse', 'Nazikçe reddet'],
      result: ['You said you would never do it justice. He nodded slowly and hung it back on its nail.', 'Hakkını veremeyeceğini söyledin. Başını yavaşça salladı ve onu çivisine geri astı.'],
    },
  },
  {
    id: 'base.keepsake_tavla',
    type: 'tavla',
    ages: [18, 70],
    weight: 1.5,
    title: ['The coffeehouse is holding a backgammon tournament.', 'Kahvehanede bir tavla turnuvası var.'],
    text: [
      'The prize is the owner’s own backgammon set, a worn board with a hundred years of arguments in its felt.',
      'Ödül, kahvehane sahibinin kendi tavlası: keçesinde yüz yıllık tartışmalar olan yıpranmış bir tahta.',
    ],
    take: {
      label: ['Enter the tournament', 'Turnuvaya katıl'],
      chance: (c) => 0.3 + c.p.stats.smarts / 300,
      name: () => ['The coffeehouse backgammon set', 'Kahvehane tavlası'],
      story: (c) => [
        `${first(c)} won it at the coffeehouse tournament in ${c.s.year}, in a final that ended on the very last roll.`,
        `${first(c)} onu ${c.s.year} yılındaki kahvehane turnuvasında kazandı; final son zarda bitti.`,
      ],
      result: () => [
        'You won on the last roll. The room fell silent, then roared. The owner handed over the set with a little bow.',
        'Son zarda kazandın. Salon sustu, sonra gürledi. Sahibi tavlayı küçük bir selamla teslim etti.',
      ],
      missed: [
        'You lost in the semi-final to a retired judge. He bought you a tea and spent an hour explaining your mistakes.',
        'Yarı finalde emekli bir hâkime kaybettin. Sana çay ısmarladı ve bir saat boyunca hatalarını anlattı.',
      ],
    },
    leave: {
      label: ['Watch from the side', 'Kenardan izle'],
      result: ['You watched, shouting advice nobody asked for. It was a very good evening.', 'İzledin ve kimsenin istemediği tavsiyeler verdin. Çok güzel bir akşamdı.'],
    },
  },
  {
    id: 'base.keepsake_cezve',
    type: 'cezve',
    ages: [22, 60],
    weight: 1.5,
    title: ['Aunt Fatma is clearing out her kitchen.', 'Fatma Teyze mutfağını boşaltıyor.'],
    text: [
      'She hands you a dented copper coffee pot. "Forty years of mornings," she says. "Nobody else will make it the slow way."',
      'Sana ezik bir bakır cezve uzatıyor. "Kırk yıllık sabahlar" diyor. "Onu yavaş yoldan yapacak başka kimse yok."',
    ],
    take: {
      label: ['Take it', 'Al'],
      name: () => ["Aunt Fatma's coffee pot", 'Fatma Teyze’nin cezvesi'],
      story: (c) => [
        `Aunt Fatma gave it to ${first(c)} in ${c.s.year} while clearing her kitchen, with a lesson in foam.`,
        `Fatma Teyze onu ${c.s.year} yılında mutfağını boşaltırken ${dat(first(c))} verdi, köpük dersiyle birlikte.`,
      ],
      result: () => [
        'She taught you the foam in one long minute: slow flame, no stirring, and a look that says everything. The coffee was the best you have ever had.',
        'Köpüğü sana uzun bir dakikada öğretti: kısık ateş, karıştırmak yok ve her şeyi anlatan bir bakış. Hayatında içtiğin en güzel kahveydi.',
      ],
    },
    leave: {
      label: ['Say you have one already', 'Zaten bir tane var de'],
      result: ['She gave it to the neighbour. You are sure the neighbour will not make it as well.', 'Komşuya verdi. Komşunun onu senin kadar iyi yapamayacağına eminsin.'],
    },
  },
  {
    id: 'base.keepsake_album',
    type: 'album',
    ages: [25, 75],
    weight: 1.2,
    title: ['A cousin has found a box in the attic.', 'Bir kuzen tavan arasında bir kutu bulmuş.'],
    text: [
      'Inside is a blue photo album with faces nobody can name. "Somebody ought to keep it," says Leyla, "and I know a person who writes the names in pencil."',
      'İçinde kimsenin adını bilmediği yüzlerle dolu mavi bir fotoğraf albümü var. "Birinin saklaması lazım" diyor Leyla, "ve isimleri kurşun kalemle yazan birini tanıyorum."',
    ],
    take: {
      label: ['Keep it', 'Sen sakla'],
      name: () => ['The blue photo album', 'Mavi fotoğraf albümü'],
      story: (c) => [
        `Cousin Leyla found it in the attic in ${c.s.year}. ${first(c)} wrote the names under the faces, in pencil.`,
        `Kuzen Leyla onu ${c.s.year} yılında tavan arasında buldu. ${first(c)} yüzlerin altına isimleri kurşun kalemle yazdı.`,
      ],
      result: () => [
        'You spent a week with a lamp and a pencil. By the end half the faces had names, and the other half had arguments.',
        'Bir hafta boyunca bir lamba ve bir kurşun kalemle uğraştın. Sonunda yüzlerin yarısının ismi, yarısının tartışması vardı.',
      ],
    },
    leave: {
      label: ['Let Leyla keep it', 'Leyla saklasın'],
      result: ['Leyla took it home. You promise to look through it together, one day.', 'Leyla onu eve götürdü. Bir gün birlikte bakmak üzere sözleştiniz.'],
    },
  },
  {
    id: 'base.keepsake_pen',
    type: 'pen',
    ages: [17, 30],
    weight: 2.5,
    when: (c) => c.p.education === 'highschool' || c.p.education === 'university',
    title: ['A relative gives you a fountain pen for your graduation.', 'Bir akraban mezuniyetin için sana dolma kalem hediye ediyor.'],
    text: [
      'It comes in a worn leather case with a bottle of blue ink. "I signed my first contract with it," she says. "Sign yours."',
      'Aşınmış bir deri kutuda, bir şişe mavi mürekkeple geliyor. "İlk sözleşmemi bununla imzaladım" diyor. "Seninkini de bununla imzala."',
    ],
    take: {
      label: ['Accept it with thanks', 'Teşekkürle kabul et'],
      name: (c) => [`${first(c)}'s fountain pen`, `${gen(first(c))} dolma kalemi`],
      story: (c) => [
        `A relative gave it to ${first(c)} for graduation in ${c.s.year}, with a bottle of blue ink and one instruction: sign well.`,
        `Bir akraba onu ${c.s.year} yılında mezuniyet için ${dat(first(c))} bir şişe mavi mürekkeple verdi; tek tembih: iyi imzala.`,
      ],
      result: () => [
        'You wrote your name with it three times, to practise. The third looked like it belonged to someone who had a plan.',
        'İsmini alıştırma olsun diye üç kez yazdın. Üçüncüsü planı olan birine aitmiş gibi görünüyordu.',
      ],
    },
    leave: {
      label: ['Say it is too precious', 'Çok değerli olduğunu söyle'],
      result: ['She smiled and said that was exactly why. You kept the ink, and wrote with a ballpoint.', 'Gülümsedi ve tam da bu yüzden dedi. Mürekkebi sen aldın ama tükenmezle yazmaya devam ettin.'],
    },
  },
];

export const keepsakeEvents: EventDef[] = quietInMourning(offers.map(offer));
