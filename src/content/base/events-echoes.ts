import type { Ctx, EventDef } from '../types';
import type { LifeRecord } from '../../engine/types';
import { gen, wage } from './util';

// Echoes of the family's earlier lives. A dynasty is the point of the game, yet most events only knew the person
// in front of them. These look back at the life that came just before (or the one before that), using only things
// that are the same in either language: a first name and a number of years.
//
// Pure functions of the saved dynasty, no rng, so they shift nobody's seed.

/** The life that ended just before this one, if the family has one and it was a real death (not a hand-over). */
const previousLife = (c: Ctx): LifeRecord | undefined => {
  const last = c.s.dynasty.lives[c.s.dynasty.lives.length - 1];
  return last && !last.handedOver ? last : undefined;
};
const firstName = (l: LifeRecord) => l.name.split(' ')[0];

export const echoEvents: EventDef[] = [
  {
    id: 'base.echo_same_age',
    category: 'milestone',
    minAge: 25,
    maxAge: 95,
    once: true,
    when: (c) => {
      const prev = previousLife(c);
      return !!prev && c.age === prev.age;
    },
    setup: (c) => {
      c.vars.name = firstName(previousLife(c)!);
    },
    title: (c) => c.t(`You are now the age ${String(c.vars.name)} was at the end.`, `Artık ${String(c.vars.name)} ile aynı yaştasın; onun son yaşı.`),
    text: (c) =>
      c.t(
        `Same number, different life. You notice the date on a form and feel it for a moment, like a hand on your shoulder.`,
        `Aynı sayı, başka bir hayat. Bir formdaki yaşa bakıyorsun ve bir an omzunda bir el hissediyorsun.`,
      ),
    choices: [
      {
        id: 'live',
        label: (c) => c.t('Do something you have been putting off', 'Ertelediğin bir şeyi yap'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            `You did the thing. You do not know whether ${String(c.vars.name)} would have done it, but you think they would have been pleased.`,
            `O şeyi yaptın. ${String(c.vars.name)} yapar mıydı bilmiyorsun ama memnun olacağını düşünüyorsun.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'checkup',
        label: (c) => c.t('Book a proper check-up', 'Düzgün bir kontrol için randevu al'),
        requires: (c) => c.p.money >= wage(c, 300),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          c.h.stat('health', 4);
          return c.t('The doctor found nothing to worry about and a few things to improve. You came home with a list and, oddly, with a lighter heart.', 'Doktor endişelenecek bir şey bulmadı, düzeltilecek birkaç şey buldu. Eve bir listeyle ve garip biçimde daha hafif bir kalple döndün.');
        },
      },
    ],
  },
  {
    id: 'base.echo_grave',
    category: 'family',
    minAge: 20,
    maxAge: 85,
    once: true,
    when: (c) => {
      const prev = previousLife(c);
      return !!prev && c.s.year - prev.deathYear >= 5 && c.s.year - prev.deathYear <= 40;
    },
    setup: (c) => {
      c.vars.name = firstName(previousLife(c)!);
    },
    title: (c) => c.t(`You have not visited ${String(c.vars.name)}’s grave in a long time.`, `${gen(String(c.vars.name))} mezarına uzun zamandır gitmedin.`),
    text: (c) =>
      c.t(
        'The path has grown over a little. Somebody has been leaving a flower there, and it is not you.',
        'Patika biraz otla kaplanmış. Biri oraya çiçek bırakıyor ve bu sen değilsin.',
      ),
    choices: [
      {
        id: 'visit',
        label: (c) => c.t('Go, and take something to plant', 'Git ve dikecek bir şey götür'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('smarts', 1);
          return c.t(
            `You planted something small, tidied the path and told ${String(c.vars.name)} about your year. It felt like they listened.`,
            `Küçük bir şey diktin, patikayı topladın ve ${String(c.vars.name)} ile yılını konuştun. Dinliyormuş gibi hissettirdi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'later',
        label: (c) => c.t('Plan to go next month', 'Gelecek ay gitmeyi planla'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('Next month became next year. The flower, whoever leaves it, was there again.', 'Gelecek ay gelecek yıla döndü. Çiçek, kim bırakıyorsa, yine oradaydı.');
        },
      },
    ],
  },
  {
    id: 'base.echo_story',
    category: 'family',
    minAge: 18,
    maxAge: 85,
    once: true,
    when: (c) => c.s.dynasty.lives.length >= 2 && c.s.dynasty.generation >= 3,
    setup: (c) => {
      const lives = c.s.dynasty.lives;
      c.vars.name = firstName(lives[lives.length - 2]);
    },
    title: (c) => c.t(`Someone at dinner tells a story about ${String(c.vars.name)}.`, `Yemekte biri ${String(c.vars.name)} hakkında bir hikâye anlatıyor.`),
    text: (c) =>
      c.t(
        'It has been told so many times that the details have started to swap places. You are not sure it ever happened that way, but everyone listens as if it did.',
        'O kadar çok anlatılmış ki ayrıntılar yer değiştirmeye başlamış. Hiç böyle olup olmadığından emin değilsin ama herkes olmuş gibi dinliyor.',
      ),
    choices: [
      {
        id: 'ask',
        label: (c) => c.t('Ask for the real version', 'Gerçek versiyonunu sor'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'The real version turned out to be shorter, odder and much better. You asked someone to write it down before it changed again.',
            'Gerçek versiyon daha kısa, daha tuhaf ve çok daha iyi çıktı. Yeniden değişmeden önce birinden yazmasını istedin.',
          );
        },
        tone: 'good',
      },
      {
        id: 'enjoy',
        label: (c) => c.t('Just enjoy it', 'Sadece keyfini çıkar'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You let the story be what it was. It got a laugh in the right place and a sigh in the other.', 'Hikâyenin olduğu gibi kalmasına izin verdin. Doğru yerde bir kahkaha, öbüründe bir iç çekiş aldı.');
        },
      },
    ],
  },
];
