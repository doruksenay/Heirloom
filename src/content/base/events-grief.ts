import type { Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { acc, dat, gen, wth } from '../../i18n/tr-grammar';
import { wage } from './util';

// Grief for a child or a partner (playtest 3 §2.4: "Kızın Mira, 27 yaşında hayata gözlerini yumdu" was followed by
// a class reunion). The engine opens one of these in the year of the death (scheduled, see yearlyTick in
// engine/game.ts) and sets the `mourning` flag to that year, so light lines can stand aside (inMourning in
// engine/context.ts).

/** The child or partner the engine recorded as this year's loss; falls back to the most recent death of that kind. */
function lostId(c: Ctx, kinds: string[]): string | undefined {
  const eng = c.p.ext?.engine as { loss?: string } | undefined;
  const rel = (id: string) => c.p.relations.find((r) => r.personId === id && kinds.includes(r.kind));
  if (eng?.loss && c.s.people[eng.loss] && rel(eng.loss)) return eng.loss;
  return c.p.relations
    .filter((r) => kinds.includes(r.kind) && c.s.people[r.personId]?.deathYear !== undefined)
    .sort((a, b) => c.s.people[b.personId].deathYear! - c.s.people[a.personId].deathYear!)[0]?.personId;
}

const lost = (c: Ctx): Person => c.s.people[String(c.vars.pid)];
const ageAtDeath = (p: Person) => (p.deathYear ?? 0) - p.birthYear;
const heHer = (p: Person) => (p.gender === 'female' ? 'her' : 'his');

/** Living grandchildren the dead child left, youngest first. */
const leftBehind = (c: Ctx, child: Person): Person[] =>
  (child.childIds ?? [])
    .map((id) => c.s.people[id])
    .filter((q): q is Person => !!q && q.deathYear === undefined)
    .sort((a, b) => b.birthYear - a.birthYear);

/** "You buried your daughter, Mira." / "Kızın Mira'yı toprağa verdin." */
const buriedTitle = (c: Ctx) => {
  const k = lost(c);
  const f = k.gender === 'female';
  return c.t(`You buried your ${f ? 'daughter' : 'son'}, ${k.firstName}.`, `${f ? 'Kızın' : 'Oğlun'} ${acc(k.firstName)} toprağa verdin.`);
};

const keepRoom = {
  id: 'room',
  label: (c: Ctx) => c.t(`Keep ${heHer(lost(c))} room as it was`, 'Odasına dokunma'),
  resolve: (c: Ctx) => {
    const n = lost(c).firstName;
    c.h.stat('happiness', -2);
    return c.t(
      `You closed the door to ${n}'s old room and left everything where it was. Some evenings you sit on the bed for a while.`,
      `${gen(n)} eski odasının kapısını kapattın, her şeyi olduğu yerde bıraktın. Bazı akşamlar gidip yatağın kenarına biraz oturuyorsun.`,
    );
  },
};

/** Titles for the loss of a partner, one picked in setup (one rng call in both languages). */
const SPOUSE_TITLES: [string, string][] = [
  ['The other side of the bed is empty.', 'Yatağın öbür yarısı boş.'],
  ['The house has never been this quiet.', 'Ev hiç bu kadar sessiz olmamıştı.'],
  ['There is one chair too many at the table.', 'Sofrada bir sandalye fazla.'],
];

/** The parent the engine recorded as this year's loss (falls back to the most recently deceased parent). */
function lostParentId(c: Ctx): string | undefined {
  const eng = c.p.ext?.engine as { parentLoss?: string } | undefined;
  if (eng?.parentLoss && c.s.people[eng.parentLoss]) return eng.parentLoss;
  return c.p.relations
    .filter((r) => (r.kind === 'mother' || r.kind === 'father') && c.s.people[r.personId]?.deathYear !== undefined)
    .sort((a, b) => c.s.people[b.personId].deathYear! - c.s.people[a.personId].deathYear!)[0]?.personId;
}
const kindOfLost = (c: Ctx): 'mother' | 'father' => (c.p.relations.find((r) => r.personId === String(c.vars.pid))?.kind === 'father' ? 'father' : 'mother');
const parentWord = (c: Ctx) => (kindOfLost(c) === 'father' ? c.t('father', 'baban') : c.t('mother', 'annen'));
const otherParentAlive = (c: Ctx) => c.h.relatives(['mother', 'father']).length > 0;

const PARENT_TITLES: [string, string][] = [
  ['You are nobody’s child any more, in the way that counts.', 'Artık, önemli olan anlamda, kimsenin çocuğu değilsin.'],
  ['The phone number still comes up first on the list.', 'Numara hâlâ listenin en başında çıkıyor.'],
  ['The house smells of them, and it will for a while.', 'Ev onların kokuyor ve bir süre daha öyle kalacak.'],
];

export const griefEvents: EventDef[] = [
  {
    id: 'base.grief_child',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = lostId(c, ['child']) ?? '';
      const k = lost(c);
      // an older grandchild at the funeral, when there is one
      const gk = k ? leftBehind(c, k).filter((q) => c.h.ageOf(q) >= 10).pop() : undefined;
      c.vars.gk = gk?.firstName ?? '';
    },
    title: buriedTitle,
    text: (c) => {
      const k = lost(c);
      const n = ageAtDeath(k);
      const gk = String(c.vars.gk ?? '');
      const base =
        n < 18
          ? c.t('No parent should outlive a child. The house is full of people, and nobody says a word.', 'Hiçbir anne baba evladını toprağa vermemeli. Ev insan dolu ama kimse tek kelime etmiyor.')
          : c.t(`Everyone says "at least you had ${n} years together". It does not help.`, `Herkes "Hiç değilse ${n} yıl birlikte oldunuz" diyor. Hiç iyi gelmiyor.`);
      return gk ? `${base} ${c.t(`${gk} held your hand all through the funeral.`, `Cenaze boyunca ${gk} elini hiç bırakmadı.`)}` : base;
    },
    choices: [
      keepRoom,
      {
        id: 'together',
        label: (c) => {
          const p = c.h.partner()?.person;
          return p ? c.t(`Lean on ${p.firstName}`, `${dat(p.firstName)} yaslan`) : c.t('Lean on your partner', 'Eşine yaslan');
        },
        requires: (c) => !!c.h.partner(),
        resolve: (c) => {
          const p = c.h.partner()!.person;
          c.h.closeness(p.id, 8);
          c.h.stat('happiness', 1);
          return c.t(
            `You and ${p.firstName} went through the photos together, one album a night. Some nights you only managed one page.`,
            `${wth(p.firstName)} fotoğraflara birlikte baktınız, her gece bir albüm. Bazı geceler tek sayfadan öteye geçemediniz.`,
          );
        },
      },
      {
        id: 'tree',
        label: (c) => c.t(`Plant a tree in ${heHer(lost(c))} name`, 'Onun adına bir fidan dik'),
        resolve: (c) => {
          const n = lost(c).firstName;
          c.h.stat('happiness', 2);
          return c.t(
            `You planted a sapling for ${n}. It is still too small to sit under. You water it every evening.`,
            `${gen(n)} adına bir fidan diktin. Henüz gölgesinde oturulacak kadar büyümedi; her akşam gidip suluyorsun.`,
          );
        },
      },
      {
        id: 'busy',
        label: (c) => c.t('Keep busy', 'Kendini oyala'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          c.h.stat('health', -1);
          return c.p.jobId && !c.p.retired
            ? c.t('You went back to work after three days. Nobody knew what to say, so they kept bringing you tea.', 'Üç gün sonra işe döndün. Kimse ne diyeceğini bilemedi; o yüzden durmadan sana çay getirdiler.')
            : c.t('You cleaned the whole house twice. It did not help, but your hands had something to do.', 'Bütün evi iki kez baştan sona temizledin. İşe yaramadı ama en azından ellerin meşguldü.');
        },
      },
    ],
  },

  {
    // the child left children of their own under 18: what happens to them is the question of the year
    id: 'base.grief_orphan',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = lostId(c, ['child']) ?? '';
      const minors = leftBehind(c, lost(c)).filter((q) => c.h.ageOf(q) < 18);
      c.vars.gid = minors[0]?.id ?? '';
      c.vars.gcount = minors.length;
    },
    title: buriedTitle,
    text: (c) => {
      const k = lost(c);
      const g = c.s.people[String(c.vars.gid)];
      if (!g) return c.t('The house is full of people, and nobody says a word.', 'Ev insan dolu ama kimse tek kelime etmiyor.');
      const mom = k.gender === 'female';
      const many = Number(c.vars.gcount) > 1;
      const a = c.h.ageOf(g);
      return a < 10
        ? c.t(
            `${k.firstName} left ${many ? 'children' : 'a child'} behind. ${g.firstName} is only ${a} and keeps asking, "When is ${mom ? 'Mom' : 'Dad'} coming home?"`,
            `${k.firstName} geride ${many ? 'çocuklar' : 'bir çocuk'} bıraktı. ${g.firstName} daha ${a} yaşında; "${mom ? 'Annem' : 'Babam'} ne zaman gelecek?" diye sorup duruyor.`,
          )
        : c.t(
            `${k.firstName} left ${many ? 'children' : 'a child'} behind. ${g.firstName} is ${a}, has shut the bedroom door and will not talk to anyone.`,
            `${k.firstName} geride ${many ? 'çocuklar' : 'bir çocuk'} bıraktı. ${g.firstName} ${a} yaşında; odasına kapanmış, kimseyle konuşmuyor.`,
          );
    },
    choices: [
      {
        id: 'raise',
        label: (c) => {
          const g = c.s.people[String(c.vars.gid)];
          return g ? c.t(`Raise ${g.firstName} yourself`, `${acc(g.firstName)} yanına al, sen büyüt`) : c.t('Take the children in', 'Çocukları yanına al');
        },
        badge: 'Big change',
        requires: (c) => !!c.s.people[String(c.vars.gid)] && c.p.jailYears === 0,
        resolve: (c) => {
          const k = lost(c);
          const minors = leftBehind(c, k).filter((q) => c.h.ageOf(q) < 18);
          // a grandchild you raise can carry the family on at any age (heirOptions in engine/game.ts)
          for (const q of minors) c.h.flag(`raising:${q.id}`);
          c.h.money(-wage(c, 2000));
          c.h.stat('happiness', -1);
          const g = minors[0] ?? c.s.people[String(c.vars.gid)];
          const f = g.gender === 'female';
          return minors.length > 1
            ? c.t(
                `You brought ${g.firstName} and ${f ? 'her' : 'his'} brothers and sisters home, one suitcase each. The spare room has new names on the door now.`,
                `${acc(g.firstName)} ve kardeşlerini birer bavulla eve getirdin. Misafir odasının kapısında artık yeni isimler var.`,
              )
            : c.h.ageOf(g) < 10
              ? c.t(
                  `You brought ${g.firstName} home with one suitcase and a worn-out teddy bear. The spare room has a new name on the door now.`,
                  `${acc(g.firstName)} tek bir bavul ve yıpranmış bir oyuncak ayıyla eve getirdin. Misafir odasının kapısında artık yeni bir isim var.`,
                )
              : c.t(
                  `${g.firstName} moved in with one suitcase and headphones that never come off. On the third night ${f ? 'she' : 'he'} came down for dinner without being called.`,
                  `${g.firstName} tek bir bavul ve hiç çıkarmadığı kulaklıklarıyla yanına taşındı. Üçüncü akşam, çağırmana gerek kalmadan sofraya indi.`,
                );
        },
        tone: 'big',
      },
      {
        id: 'help',
        label: (c) => c.t('Help from a distance', 'Uzaktan destek ol'),
        resolve: (c) => {
          const g = c.s.people[String(c.vars.gid)];
          const n = lost(c).firstName;
          c.h.money(-wage(c, 3000));
          c.h.stat('happiness', -2);
          const gn = g?.firstName ?? n;
          return c.t(
            `You send money for ${gn} every month and call every Sunday. Every time, ${g?.gender === 'female' ? 'she' : 'he'} asks you something about ${n}.`,
            `${gn} için her ay para gönderiyor, her pazar telefonla arıyorsun. Her seferinde sana ${n} hakkında bir şey soruyor.`,
          );
        },
      },
      keepRoom,
    ],
  },

  {
    id: 'base.grief_spouse',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      const id = lostId(c, ['spouse', 'partner']) ?? '';
      c.vars.pid = id;
      const rel = c.p.relations.find((r) => r.personId === id);
      c.vars.married = rel?.kind === 'spouse' ? 1 : 0;
      c.vars.years = rel ? Math.max(0, c.s.year - rel.sinceYear) : 0;
      c.vars.v = c.rng.int(0, SPOUSE_TITLES.length - 1);
    },
    title: (c) => {
      const t = SPOUSE_TITLES[Number(c.vars.v ?? 0) % SPOUSE_TITLES.length];
      return c.t(t[0], t[1]);
    },
    text: (c) => {
      const n = lost(c).firstName;
      const years = Number(c.vars.years);
      const base = !Number(c.vars.married)
        ? years >= 12
          ? c.t(
              `${years} years with ${n}, and you never made it official. Now there are forms to sign, and none of them has a box for what you were.`,
              `${wth(n)} tam ${years} yıl geçirdiniz ama hiçbir zaman resmiyete dökmediniz. Şimdi imzalanacak kâğıtlar var ve hiçbirinde sizin ne olduğunuz için bir kutucuk yok.`,
            )
          : c.t(`You and ${n} never got round to the wedding. Now there are forms to sign, and none of them has a box for you.`, `${wth(n)} nikâha bir türlü sıra gelmemişti. Şimdi imzalanacak bir sürü kâğıt var ve hiçbirinde senin için bir kutucuk yok.`)
        : years >= 3
          ? Number(c.vars.v) % 2
            ? c.t(`${years} years with ${n}. You still make two cups of tea every morning before you remember.`, `${wth(n)} tam ${years} yıl. Her sabah hâlâ iki bardak çay koyuyorsun, sonra hatırlıyorsun.`)
            : c.t(`${years} years with ${n}, and now the house is far too quiet.`, `${wth(n)} tam ${years} yıl geçirdiniz; şimdi ev fazlasıyla sessiz.`)
          : c.t(`You had so little time with ${n}. The wedding photos are still in their envelope.`, `${wth(n)} o kadar az vaktiniz oldu ki. Düğün fotoğrafları hâlâ zarfında duruyor.`);
      const little = c.h.relatives('child').some((k) => c.h.ageOf(k.person) < 18);
      return little ? `${base} ${c.t('The children still need breakfast in the morning.', 'Ama sabah olunca çocuklar yine kahvaltı bekliyor.')}` : base;
    },
    choices: [
      {
        id: 'coat',
        label: (c) => c.t(`Leave ${heHer(lost(c))} coat on the hook`, 'Paltosu askıda kalsın'),
        resolve: (c) => {
          const n = lost(c).firstName;
          c.h.stat('happiness', -1);
          return c.t(
            `${n}'s coat is still on the hook by the door. You say good morning to it. Nobody has the heart to stop you.`,
            `${gen(n)} paltosu hâlâ kapının yanındaki askıda. Her sabah ona günaydın diyorsun. Kimse seni durdurmaya kıyamıyor.`,
          );
        },
      },
      {
        id: 'kids',
        label: (c) => c.t('Let the children look after you', 'Çocuklarına yaslan'),
        requires: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 18),
        resolve: (c) => {
          const adults = c.h.relatives('child').filter((k) => c.h.ageOf(k.person) >= 18);
          for (const k of adults) c.h.closeness(k.person.id, 6);
          c.h.stat('happiness', 2);
          const k = adults.sort((a, b) => b.rel.closeness - a.rel.closeness)[0].person.firstName;
          return c.t(
            `${k} moved back in for a month and cooked badly on purpose, so you would have something to complain about. It worked.`,
            `${k} bir aylığına yanına taşındı ve sen söylenecek bir şey bulasın diye bilerek kötü yemek yaptı. İşe yaradı.`,
          );
        },
      },
      {
        id: 'yes',
        label: (c) => c.t('Say yes to every invitation', 'Her davete evet de'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'For a year you said yes to every invitation. Most were weddings and funerals. You cried at both.',
            'Bir yıl boyunca her davete evet dedin. Çoğu düğün ve cenazeydi. İkisinde de ağladın.',
          );
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Keep up your old walks', 'Eski yürüyüşlerinize devam et'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', -1);
          return c.t(
            'You kept taking the long walk you used to take together, every day at the same time. Alone, but on the same route.',
            'Eskiden birlikte yaptığınız uzun yürüyüşe her gün aynı saatte çıkmaya devam ettin. Yalnız ama aynı yoldan.',
          );
        },
      },
    ],
  },
  {
    id: 'base.grief_parent_adult',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = lostParentId(c) ?? '';
    },
    title: (c) => {
      const [en, tr] = PARENT_TITLES[(c.s.year + c.age) % PARENT_TITLES.length];
      return c.t(en, tr);
    },
    text: (c) => {
      const n = lost(c)?.firstName ?? '';
      const age = lost(c) ? ageAtDeath(lost(c)) : 0;
      const w = parentWord(c);
      const rest = otherParentAlive(c)
        ? c.t(' The one who is left looks smaller at the funeral than they did last week.', ' Geride kalan, geçen haftadan daha küçük görünüyor cenazede.')
        : c.t(' There is no one left in the older row now, and the row has moved up to you.', ' Büyükler sırasında artık kimse kalmadı ve sıra sana geldi.');
      return c.t(`Your ${w} ${n} died at ${age}. The cupboards are full of things nobody else will know the story of.${rest}`, `${w[0].toLocaleUpperCase('tr')}${w.slice(1)} ${n} ${age} yaşında öldü. Dolaplar, hikâyesini başka kimsenin bilmediği eşyalarla dolu.${rest}`);
    },
    choices: [
      {
        id: 'keep',
        label: (c) => c.t('Keep one thing that was theirs', 'Onlardan kalan bir şeyi sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'A scarf, a cup, a pen that no longer writes. You put it where you would see it every day, and mostly you do not look.',
            'Bir şal, bir fincan, artık yazmayan bir kalem. Her gün göreceğin bir yere koydun ve çoğunlukla bakmıyorsun.',
          );
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Gather the family and tell stories', 'Aileyi topla, hikâyeler anlat'),
        resolve: (c) => {
          for (const r of c.h.relatives(['mother', 'father', 'sibling', 'child'])) c.h.closeness(r.person.id, 3);
          c.h.stat('happiness', 2);
          return c.t(
            'By midnight everyone was laughing at a story about a lost umbrella, and nobody could remember who had told it first.',
            'Gece yarısına kadar herkes kayıp bir şemsiye hikâyesine gülüyordu ve ilk kimin anlattığını kimse hatırlamıyordu.',
          );
        },
      },
      {
        id: 'quiet',
        label: (c) => c.t('Grieve quietly, on your own', 'Sessizce, tek başına yas tut'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.stat('health', -1);
          return c.t(
            'You did the paperwork, answered the messages and cried in the car, once, for a long time.',
            'Evrakları halledip mesajlara cevap verdin ve arabada bir kez, uzun uzun ağladın.',
          );
        },
      },
    ],
  },
];
