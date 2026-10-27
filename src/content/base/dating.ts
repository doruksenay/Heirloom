import type { Ctx, EventDef } from '../types';
import type { GameState, Player } from '../../engine/types';

// Who the player falls for (round 4). Stored in p.ext.dating: 'other' (the opposite gender, also the default when
// unset), 'same' or 'any'. The engine's dates and set-ups read it through dateGender() in events-scheduled.ts.
// A teenager can say it in the crush event below; the UI can also offer it as a setting (setDatingPref).

export type DatingPref = 'other' | 'same' | 'any';
export const DATING_PREFS: DatingPref[] = ['other', 'same', 'any'];

export function datingPref(p: Player): DatingPref {
  const v = p.ext?.dating;
  return v === 'same' || v === 'any' ? v : 'other';
}

export function setDatingPref(s: GameState, pref: DatingPref): void {
  const p = s.player;
  p.ext = p.ext ?? {};
  if (pref === 'other') delete p.ext.dating;
  else p.ext.dating = pref;
}

/** Labels for a settings row: [English, Turkish] by the player's own gender. */
export function datingPrefLabel(p: Player, pref: DatingPref): [string, string] {
  const f = p.gender === 'female';
  if (pref === 'any') return ['Men and women', 'Kadınlar ve erkekler'];
  const women = (pref === 'same') === f;
  return women ? ['Women', 'Kadınlar'] : ['Men', 'Erkekler'];
}

const set = (c: Ctx, pref: DatingPref) => setDatingPref(c.s, pref);

export const datingEvents: EventDef[] = [
  {
    id: 'base.first_crush_who',
    category: 'love',
    minAge: 13,
    maxAge: 16,
    once: true,
    weight: 14,
    when: (c) => c.p.jailYears === 0 && c.p.ext?.dating === undefined,
    title: (c) => c.t('Your first real crush', 'İlk gerçek hoşlanman'),
    text: (c) => c.t('Your heart does a strange thing every time a certain someone walks into class. Who is it?', 'Biri sınıfa her girdiğinde kalbin tuhaf bir şey yapıyor. Kim o?'),
    choices: [
      {
        id: 'boy',
        label: (c) => c.t('A boy', 'Bir erkek'),
        resolve: (c) => {
          set(c, c.p.gender === 'male' ? 'same' : 'other');
          c.h.stat('happiness', 3);
          return c.t('You wrote his initials in the back of your notebook, then scribbled over them in a panic.', 'Defterinin arkasına onun baş harflerini yazdın, sonra panikle üstünü karaladın.');
        },
      },
      {
        id: 'girl',
        label: (c) => c.t('A girl', 'Bir kız'),
        resolve: (c) => {
          set(c, c.p.gender === 'female' ? 'same' : 'other');
          c.h.stat('happiness', 3);
          return c.t('You practised saying hello to her in the mirror. On the day, you said "hi" and walked into a door.', 'Aynanın karşısında ona merhaba demeyi çalıştın. O gün gelince "Selam" deyip kapıya çarptın.');
        },
      },
      {
        id: 'both',
        label: (c) => c.t('Honestly, it depends on the person', 'Açıkçası, kişiye göre değişiyor'),
        resolve: (c) => {
          set(c, 'any');
          c.h.stat('happiness', 3);
          return c.t('You decided hearts do not read name tags. Yours certainly does not.', 'Kalplerin isim etiketi okumadığına karar verdin. Seninki kesinlikle okumuyor.');
        },
      },
      {
        id: 'nobody',
        label: (c) => c.t('Nobody, yet', 'Henüz kimse'),
        resolve: (c) => {
          set(c, 'other');
          return c.t('You decided crushes are for other people. Football is enough for now.', 'Hoşlanma işlerinin başkalarına göre olduğuna karar verdin. Şimdilik top oynamak yeterli.');
        },
      },
    ],
  },
];
