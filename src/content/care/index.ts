import type { ActivityDef, ContentPack } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { careEvents } from './events';

// "Care" expansion: looking after the people who looked after you, and the slower years of your own body.
export const CARE_ENTITLEMENT = 'pack.care';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;

const CALL: Pair[] = [
  ['You rang and heard about the neighbour’s hip, the price of eggs and a dream with a goat in it. It was lovely.', 'Aradın; komşunun kalçasını, yumurta fiyatını ve içinde keçi olan bir rüyayı dinledin. Çok güzeldi.'],
  ['A long call. The best part was the pause before “Well. Look after yourself.”', 'Uzun bir görüşme. En güzel kısmı “Neyse. Kendine iyi bak” öncesindeki duraklamaydı.'],
  ['You asked what they had for lunch and got an answer that went back to 1964.', 'Öğle yemeğinde ne yediklerini sordun ve 1964’e kadar uzanan bir cevap aldın.'],
];
const SIT: Pair[] = [
  ['You sat with them and did nothing at all. It was the most useful thing you did all week.', 'Yanlarında oturup hiçbir şey yapmadın. Haftanın en yararlı işiydi.'],
  ['You went through a box of photographs together. They knew every face. You pretended to know them too.', 'Birlikte bir kutu fotoğrafa baktınız. Her yüzü tanıdılar. Sen de tanıyormuş gibi yaptın.'],
  ['You tidied the cupboard they have been meaning to tidy since 1998. They supervised from a chair.', 'Onların 1998’den beri toplamayı düşündüğü dolabı topladın. Bir sandalyeden gözetim yaptılar.'],
];
const MOVE: Pair[] = [
  ['Gentle exercise, slow stretches, and a teacher who said “well done” at every wobble.', 'Hafif egzersiz, yavaş esnemeler ve her sendelemede “aferin” diyen bir öğretmen.'],
  ['A class of eleven people and a radio. You were the third-best in the room, which pleased you out of all proportion.', 'On bir kişilik bir sınıf ve bir radyo. Odadaki üçüncü en iyiydin; bu seni orantısız derecede mutlu etti.'],
  ['You walked the long way round the park and said hello to a heron.', 'Parkta uzun yoldan yürüdün ve bir balıkçıla selam verdin.'],
];

const activities: ActivityDef[] = [
  {
    id: 'care_call',
    label: (c) => c.t('Call your parent', 'Ebeveynini ara'),
    description: (c) => c.t('+Happiness, closer', '+Mutluluk, yakınlık'),
    group: 'Family',
    minAge: 16,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 2);
      for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, 2);
      return say(c, 'care_call', CALL);
    },
  },
  {
    id: 'care_sit',
    label: (c) => c.t('Spend an afternoon with your parent', 'Ebeveynine bir öğleden sonra ayır'),
    description: (c) => c.t('+Happiness, much closer', '+Mutluluk, çok daha yakın'),
    group: 'Family',
    minAge: 20,
    available: (c) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 60),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 3);
      for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, 5);
      return say(c, 'care_sit', SIT);
    },
  },
  {
    id: 'care_move',
    label: (c) => c.t('Join a gentle exercise class', 'Hafif egzersiz sınıfına katıl'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 45,
    run: (c) => {
      c.h.stat('health', 3);
      c.h.stat('happiness', 2);
      return say(c, 'care_move', MOVE);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'carer',
    name: 'The Carer',
    desc: 'Looked after a parent in their last years.',
    nameTr: 'Bakım Veren',
    descTr: 'Ebeveynine son yıllarında baktı.',
    test: (_r, p) => flag(p, 'care_parent'),
  },
  {
    id: 'long_haul',
    name: 'The Long Haul',
    desc: 'Lived 75+ years with a lasting condition.',
    nameTr: 'Uzun Yol',
    descTr: 'Kalıcı bir rahatsızlıkla 75+ yıl yaşadı.',
    test: (r, p) => flag(p, 'care_condition') && r.age >= 75,
  },
];

const goals: GoalDef[] = [
  { id: 'care_parent', label: 'Look after a parent as they grow old', labelTr: 'Yaşlanan bir ebeveyne bak', check: (s) => flag(s.player, 'care_parent') },
  { id: 'care_recorded', label: 'Record a parent’s life story', labelTr: 'Bir ebeveynin hayat hikâyesini kaydet', check: (s) => flag(s.player, 'care_recorded') },
];

export const carePack: ContentPack = {
  id: 'care',
  title: 'Care',
  description: 'Looking after the people who looked after you, and the slower years of your own body: doctors, routines, good days and quiet ones.',
  rating: 'all',
  entitlement: CARE_ENTITLEMENT,
  events: careEvents,
  activities,
  ribbons,
  goals,
};
