import type { ActivityDef, Ctx, EventDef } from '../types';
import type { GameState } from '../../engine/types';
import type { GoalDef } from '../../engine/goals';
import { wage } from '../base/util';
import { pickIndex, type Pair } from '../base/lines';
import { fameLevel, fameState, gainFans, pathOrLast, peekFame } from './state';
import { compact, free } from './util';

// Round 6 (item 1): Fame goals for the middle and the end of a life, and what it takes to reach them:
// a comeback after fifty (an activity) and a lifetime achievement award (a scheduled moment late in life).

const ageOf = (s: GameState) => s.year - s.player.birthYear;
const peak = (s: GameState) => peekFame(s.player)?.peakFame ?? 0;
const has = (s: GameState, a: string) => s.player.achievements.includes(a);

/** Comeback lines per path: [music, social, acting], each an [en, tr] list; one rng call picks the row. */
const COMEBACK_HIT: Record<'music' | 'social' | 'acting', Pair[]> = {
  music: [
    ['You put the old band back together for one album. The reviews used the word "ageless" four times.', 'Eski grubu bir albümlüğüne yeniden topladın. Eleştirmenler dört kez "yaşlanmayan" dedi.'],
    ['Your comeback single opened with a cough and a laugh. It went straight to number one.', 'Geri dönüş şarkın bir öksürük ve bir kahkahayla başlıyor. Doğrudan listelerin tepesine yerleşti.'],
    ['You played the club where you started. The queue went round the block twice, mostly in reading glasses.', 'Kariyerine başladığın kulüpte çaldın. Kuyruk sokağı iki kez dolandı; çoğunun elinde okuma gözlüğü vardı.'],
  ],
  social: [
    ['You came back online with one honest video about getting older. Ten million people watched it to the end.', 'Yaşlanmak üzerine dürüst bir videoyla geri döndün. On milyon kişi sonuna kadar izledi.'],
    ["The neighbour's teenager set up the camera. You did the rest, and the internet adopted you again.", 'Kamerayı komşunun ergen oğlu kurdu, gerisini sen hallettin. İnternet seni yeniden bağrına bastı.'],
    ['Your first post in years was a photo of your old ring light. The comments filled up with "welcome back".', 'Yıllar sonraki ilk paylaşımın eski halka ışığının bir fotoğrafıydı. Yorumlar "hoş geldin"le doldu.'],
  ],
  acting: [
    ['A young director wrote a part for you. The critics called it the role of a lifetime, which was a little rude to the others.', 'Genç bir yönetmen senin için bir rol yazdı. Eleştirmenler "hayatının rolü" dedi; öncekilere biraz ayıp oldu.'],
    ['You took a small part in a big film and stole every scene you were in.', 'Büyük bir filmde küçük bir rol aldın ve girdiğin her sahneyi kendine çaldın.'],
    ['You went back on stage for one season. The last night, the cast stood and applauded you.', 'Bir sezonluğuna yeniden sahneye çıktın. Son gece bütün kadro ayağa kalkıp seni alkışladı.'],
  ],
};
const COMEBACK_MISS: Pair[] = [
  ['You booked a comeback show. Forty people came, and three of them were your family.', 'Bir geri dönüş gösterisi ayarladın. Kırk kişi geldi, üçü de ailendendi.'],
  ['The comeback was announced, then postponed, then quietly forgotten. You kept the poster.', 'Geri dönüş duyuruldu, sonra ertelendi, sonra sessizce unutuldu. Afişi sakladın.'],
  ['Your manager said the timing was not right. Your knees agreed with him.', 'Menajerin zamanlamanın doğru olmadığını söyledi. Dizlerin de ona hak verdi.'],
  ['You rehearsed for months. The venue went bust a week before the show.', 'Aylarca prova yaptın. Gösteriden bir hafta önce mekân battı.'],
];

export const fameLaterActivities: ActivityDef[] = [
  {
    id: 'fame_comeback',
    label: (c) => c.t('Plan a comeback', 'Geri dönüşünü planla'),
    description: (c) => c.t('Old fans, new stage. Costs money, may not work', 'Eski hayranlar, yeni sahne. Para ister, tutmayabilir'),
    group: 'Fame',
    minAge: 50,
    available: (c) => {
      const f = peekFame(c.p);
      return free(c) && !!f && f.peakFame >= 25 && !c.p.achievements.includes('comeback50') && fameLevel(f.fans) <= f.peakFame - 10;
    },
    run: (c) => {
      const f = fameState(c.p);
      const cost = wage(c, 4000);
      c.h.money(-cost);
      const hit = c.rng.chance(Math.min(0.85, 0.35 + f.peakFame / 200 + f.skill / 500));
      if (!hit) {
        c.h.stat('happiness', -3);
        const [en, tr] = COMEBACK_MISS[pickIndex(c, 'fame_comeback.miss', COMEBACK_MISS.length)];
        return c.t(en, tr);
      }
      const path = pathOrLast(f);
      const list = COMEBACK_HIT[path];
      const [en, tr] = list[pickIndex(c, `fame_comeback.${path}`, list.length)];
      const g = gainFans(c, f, f.fans + 50_000);
      f.lastActiveYear = c.s.year;
      const pay = wage(c, 30_000);
      c.h.money(pay);
      c.h.stat('happiness', 12);
      c.h.achieve('comeback50');
      return c.t(`${en} ${compact(c, g)} fans came back, and ${c.h.fmt(pay)} with them.`, `${tr} ${compact(c, g)} hayran geri döndü, yanlarında ${c.h.fmt(pay)} da getirdiler.`);
    },
  },
];

/** Awards nights late in life: who comes up on stage with you. One rng call picks the line. */
const LIFETIME_TEXT: Pair = [
  'The academy wants you on stage one more time. Someone has spent a month on the montage.',
  'Akademi seni bir kez daha sahnede görmek istiyor. Biri bir ay boyunca senin için derleme video hazırlamış.',
];

export const fameLaterEvents: EventDef[] = [
  {
    id: 'fame.lifetime_award',
    category: 'fame',
    scheduled: true,
    once: true,
    title: (c) => c.t('A lifetime achievement award', 'Sana onur ödülü veriliyor'),
    text: (c) => c.t(LIFETIME_TEXT[0], LIFETIME_TEXT[1]),
    choices: [
      {
        id: 'short',
        label: (c) => c.t('Keep the speech short', 'Kısa bir konuşma yap'),
        resolve: (c) => {
          c.h.achieve('lifetime_award');
          c.h.stat('happiness', 10);
          const f = fameState(c.p);
          const g = gainFans(c, f, f.fans * 0.2 + 20_000);
          return c.t(
            `You said thank you, said one funny thing and sat down. It was the best speech of the night. ${compact(c, g)} new fans.`,
            `Teşekkür ettin, bir de komik bir şey söyleyip yerine oturdun. Gecenin en iyi konuşmasıydı. ${compact(c, g)} yeni hayran.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'everyone',
        label: (c) => c.t('Thank everyone, even your first teacher', 'Herkese, ilk öğretmenine kadar teşekkür et'),
        resolve: (c) => {
          c.h.achieve('lifetime_award');
          c.h.stat('happiness', 12);
          for (const r of c.p.relations) if (r.kind === 'child' || r.kind === 'spouse') c.h.closeness(r.personId, 4);
          return c.t(
            'You thanked forty-one people by name. The orchestra tried to play you off twice and gave up.',
            'Kırk bir kişiye tek tek adıyla teşekkür ettin. Orkestra seni iki kez müzikle susturmaya çalıştı, sonra pes etti.',
          );
        },
        tone: 'big',
      },
      {
        id: 'home',
        label: (c) => c.t('Accept it by video from home', 'Ödülü evden videoyla kabul et'),
        resolve: (c) => {
          c.h.achieve('lifetime_award');
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          return c.t(
            'You accepted it from your armchair, in slippers. The hall laughed, then stood up anyway.',
            'Ödülü koltuğundan, terlikle kabul ettin. Salon önce güldü, sonra yine de ayağa kalktı.',
          );
        },
        tone: 'good',
      },
    ],
  },
];

/** The award comes on its own late in a famous life: a scheduled moment, a fair chance each year from 60. */
export function fameSchedule(c: Ctx, current: string | null): string | null {
  if (current || c.age < 60 || c.p.jailYears > 0) return current;
  const f = peekFame(c.p);
  if (!f || f.peakFame < 45 || c.p.achievements.includes('lifetime_award')) return current;
  return c.rng.chance(0.2) ? 'fame.lifetime_award' : current;
}

export const fameLaterGoals: GoalDef[] = [
  {
    id: 'fame_albums3',
    label: 'Release three albums',
    labelTr: 'Üç albüm çıkar',
    stage: 'mid',
    available: (s) => ageOf(s) >= 22 && ageOf(s) < 55 && peekFame(s.player)?.path === 'music',
    weight: () => 1.5,
    check: (s) => (peekFame(s.player)?.albums.length ?? 0) >= 3,
  },
  {
    id: 'fame_award',
    label: 'Win a major award',
    labelTr: 'Büyük bir ödül kazan',
    stage: 'mid',
    available: (s) => ageOf(s) >= 25 && ageOf(s) < 60 && !!peekFame(s.player)?.path && peak(s) >= 40,
    weight: () => 1.5,
    check: (s) => has(s, 'award'),
  },
  {
    id: 'fame_comeback',
    label: 'Make a comeback after 50',
    labelTr: '50 yaşından sonra sahnelere geri dön',
    stage: 'late',
    available: (s) => ageOf(s) >= 45 && ageOf(s) < 78 && peak(s) >= 25,
    weight: () => 2,
    check: (s) => has(s, 'comeback50'),
  },
  {
    id: 'fame_lifetime',
    label: 'Receive a lifetime achievement award',
    labelTr: 'Onur ödülü al',
    stage: 'late',
    available: (s) => ageOf(s) >= 50 && ageOf(s) < 85 && peak(s) >= 45,
    weight: () => 2,
    check: (s) => has(s, 'lifetime_award'),
  },
];
