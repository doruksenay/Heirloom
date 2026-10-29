import type { ActivityDef, EventDef } from '../types';
import type { GameState, Player } from '../../engine/types';
import type { GoalDef } from '../../engine/goals';
import { wage } from '../base/util';
import { pickIndex, type Pair } from '../base/lines';
import { crimeState, free, peekCrime } from './state';

// Round 6 (item 1): Crime goals for the middle and the end of a life. Someone with a past can stay clean for twenty
// years and, later, write the memoir; someone who never broke the law can help catch a burglar on their own street.

const ageOf = (s: GameState) => s.year - s.player.birthYear;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);

/** A record, or crimes you got away with. */
export const hasPast = (p: Player) => p.criminalRecord > 0 || (peekCrime(p)?.scores ?? 0) > 0;

/** Years since the last crime or the last day inside, whichever is later (0 while inside, on the run or on bail). */
export function cleanYears(s: GameState): number {
  const p = s.player;
  const st = peekCrime(p);
  if (!st || p.jailYears > 0 || st.fugitive || st.charge) return 0;
  const last = Math.max(st.lastCrimeYear, st.releasedYear);
  return last > 0 ? s.year - last : 0;
}

const WATCH_QUIET: Pair[] = [
  ['You walked the street with a torch and a thermos. The only suspect was a fox, and it got away.', 'Elde fener, yanında termos, sokağı turladın. Tek şüpheli bir tilkiydi, o da kaçtı.'],
  ['Your neighbourhood watch met in your kitchen. Two hours of gossip, ten minutes of watch.', 'Mahalle nöbeti senin mutfağında toplandı. İki saat dedikodu, on dakika nöbet.'],
  ['You reported a suspicious van. It was the neighbour\'s nephew, moving a sofa.', 'Şüpheli bir minibüsü ihbar ettin. Komşunun yeğeniymiş, kanepe taşıyormuş.'],
  ['You stayed up all night on watch. The street has never been safer, or sleepier.', 'Bütün gece nöbet tuttun. Sokak hiç bu kadar güvenli, sen de hiç bu kadar uykusuz olmamıştın.'],
];
const WATCH_CAUGHT: Pair[] = [
  ['You saw a man climbing into the house across the road and called the police. They caught him with the neighbour\'s television in his arms.', 'Karşıdaki eve tırmanan bir adamı görüp polisi aradın. Komşunun televizyonu kucağındayken yakaladılar.'],
  ['You noticed the same car circling the street three nights in a row and wrote down the plate. The police thanked you on the local news.', 'Aynı arabanın üç gecedir sokakta tur attığını fark edip plakasını not ettin. Polis yerel haberlerde sana teşekkür etti.'],
  ['You shouted "Hey!" at a burglar from your balcony. He dropped everything and ran straight into a patrol car.', 'Balkondan bir hırsıza "Hey!" diye bağırdın. Elindekileri bırakıp doğruca bir devriye arabasının içine koştu.'],
];

const MEMOIR_TRUTH: Pair[] = [
  ['Your memoir told everything, names changed only a little. It sold well, and an old friend has stopped calling.', 'Anıların her şeyi anlattı; isimler sadece biraz değişti. Kitap iyi sattı, eski bir dostun da artık aramıyor.'],
  ['The memoir came out with your mugshot on the cover. Book clubs loved it. The detective who chased you bought two copies.', 'Anıların kapağında sabıka fotoğrafınla çıktı. Okuma grupları bayıldı. Bir zamanlar peşine düşen komiser iki tane aldı.'],
];
const MEMOIR_SOFT: Pair[] = [
  ['You wrote it as a novel, so nobody could prove anything. Everyone knew anyway.', 'Hiçbir şey kanıtlanamasın diye her şeyi roman gibi yazdın. Yine de herkes anladı.'],
  ['Your memoir is mostly about your mother\'s cooking and one very long night. Critics called it "tender".', 'Anıların çoğunlukla annenin yemekleri ve çok uzun bir gece hakkında. Eleştirmenler "içten" dedi.'],
];

export const crimeLaterActivities: ActivityDef[] = [
  {
    id: 'crime_watch',
    label: (c) => c.t('Join the neighbourhood watch', 'Mahalle nöbetine katıl'),
    description: (c) => c.t('A torch, a thermos and a lot of curtains to look past', 'Bir fener, bir termos ve aralanan perdeler'),
    group: 'After dark',
    minAge: 30,
    maxAge: 85,
    available: (c) => free(c) && !hasPast(c.p),
    run: (c) => {
      if (!c.p.achievements.includes('caught_thief') && c.rng.chance(0.3)) {
        c.h.achieve('caught_thief');
        c.h.stat('happiness', 8);
        const [en, tr] = WATCH_CAUGHT[pickIndex(c, 'crime_watch.caught', WATCH_CAUGHT.length)];
        return c.t(en, tr);
      }
      c.h.stat('happiness', 2);
      const [en, tr] = WATCH_QUIET[pickIndex(c, 'crime_watch', WATCH_QUIET.length)];
      return c.t(en, tr);
    },
  },
  {
    id: 'crime_memoir',
    label: (c) => c.t('Write your memoir', 'Anılarını yaz'),
    description: (c) => c.t('Every word true. Or most of them', 'Her kelimesi gerçek. Ya da çoğu'),
    group: 'Mind & Body',
    minAge: 45,
    available: (c) => free(c) && hasPast(c.p) && !c.p.achievements.includes('memoir'),
    run: () => ({ event: 'crime.memoir' }),
  },
];

export const crimeLaterEvents: EventDef[] = [
  {
    id: 'crime.memoir',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('A publisher wants your story.', 'Bir yayınevi hikâyeni istiyor.'),
    text: (c) => c.t('They want the whole truth. Your lawyer wants a lot less of it.', 'Yayınevi gerçeğin tamamını istiyor. Avukatın çok daha azını.'),
    choices: [
      {
        id: 'truth',
        label: (c) => c.t('Tell all of it', 'Her şeyi anlat'),
        resolve: (c) => {
          c.h.achieve('memoir');
          const pay = wage(c, 25_000);
          c.h.money(pay);
          c.h.stat('happiness', 6);
          const st = crimeState(c.p);
          // an unsolved case still inside the statute of limitations: the police read books too
          if (st.coldCase) st.heat = Math.min(100, st.heat + 35);
          const [en, tr] = MEMOIR_TRUTH[pickIndex(c, 'crime.memoir.truth', MEMOIR_TRUTH.length)];
          return c.t(`${en} The advance: ${c.h.fmt(pay)}.`, `${tr} Avans olarak ${c.h.fmt(pay)} aldın.`);
        },
        tone: 'big',
      },
      {
        id: 'soft',
        label: (c) => c.t('Change the names, soften the rest', 'İsimleri değiştir, gerisini yumuşat'),
        resolve: (c) => {
          c.h.achieve('memoir');
          const pay = wage(c, 8_000);
          c.h.money(pay);
          c.h.stat('happiness', 4);
          const [en, tr] = MEMOIR_SOFT[pickIndex(c, 'crime.memoir.soft', MEMOIR_SOFT.length)];
          return c.t(`${en} The advance: ${c.h.fmt(pay)}.`, `${tr} Avans olarak ${c.h.fmt(pay)} aldın.`);
        },
        tone: 'good',
      },
      {
        id: 'drawer',
        label: (c) => c.t('Write it for the drawer', 'Yaz ama çekmecede kalsın'),
        resolve: (c) => {
          c.h.achieve('memoir');
          c.h.stat('happiness', 5);
          return c.t(
            'You wrote it all down, every word, and locked it in a drawer. One day someone in the family will find it.',
            'Hepsini kelimesi kelimesine yazıp bir çekmeceye kilitledin. Bir gün aileden biri bulacak.',
          );
        },
      },
    ],
  },
];

export const crimeLaterGoals: GoalDef[] = [
  {
    id: 'crime_straight20',
    label: 'Stay out of trouble for 20 years',
    labelTr: 'Yirmi yıl boyunca suça bulaşma',
    stage: 'mid',
    available: (s) => ageOf(s) >= 25 && ageOf(s) < 70 && hasPast(s.player),
    weight: () => 2,
    check: (s) => hasPast(s.player) && cleanYears(s) >= 20,
  },
  {
    id: 'crime_memoir',
    label: 'Write your memoir',
    labelTr: 'Anılarını yaz',
    stage: 'late',
    available: (s) => ageOf(s) >= 40 && ageOf(s) < 85 && hasPast(s.player),
    weight: () => 2,
    check: (s) => has(s, 'memoir'),
  },
  {
    id: 'crime_watch',
    label: 'Help catch a burglar',
    labelTr: 'Bir hırsızın yakalanmasına yardım et',
    stage: 'mid',
    available: (s) => ageOf(s) >= 28 && ageOf(s) < 80 && !hasPast(s.player),
    check: (s) => has(s, 'caught_thief'),
  },
];
