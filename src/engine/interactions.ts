import type { Ctx } from '../content/types';
import type { GameState, Person, Relation, RelationKind } from './types';
import { ageOf, makeCtx } from './context';
import { getCountry } from './world';
import { dat, gen, wth } from '../i18n/tr-grammar';

/** How many times per year the player can interact with the same person. */
export const INTERACTIONS_PER_PERSON = 2;

export interface InteractionDef {
  id: string;
  label: string;
  labelTr: string;
  kinds: RelationKind[];
  minAge?: number; // the player's age
  available?: (c: Ctx, person: Person, rel: Relation) => boolean;
  run: (c: Ctx, person: Person, rel: Relation) => string;
}

const ALL: RelationKind[] = ['mother', 'father', 'sibling', 'partner', 'spouse', 'child', 'friend'];
const wage = (c: Ctx, usd: number) => Math.round(usd * getCountry(c.p.countryId).wageFactor);

export const INTERACTIONS: InteractionDef[] = [
  {
    id: 'time',
    label: 'Spend time together',
    labelTr: 'Birlikte vakit geçir',
    kinds: ALL,
    run: (c, p) => {
      c.h.closeness(p.id, c.rng.int(4, 9));
      c.h.stat('happiness', 2);
      const i = c.rng.int(0, 3);
      return c.t(
        [
          `You and ${p.firstName} went for a long walk by the water.`,
          `You and ${p.firstName} cooked together and burned the rice.`,
          `You and ${p.firstName} watched an old movie and talked through all of it.`,
          `You and ${p.firstName} sat on the balcony drinking tea until midnight.`,
        ][i],
        [
          `${wth(p.firstName)} sahilde uzun bir yürüyüş yaptınız.`,
          `${wth(p.firstName)} birlikte yemek yaptınız ve pilavı yaktınız.`,
          `${wth(p.firstName)} eski bir film izlediniz ve film boyunca hiç susmadınız.`,
          `${wth(p.firstName)} gece yarısına kadar balkonda çay içtiniz.`,
        ][i],
      );
    },
  },
  {
    id: 'gift',
    label: 'Give a gift',
    labelTr: 'Hediye al',
    kinds: ALL,
    minAge: 12,
    available: (c) => c.p.money >= wage(c, 50),
    run: (c, p) => {
      const cost = wage(c, c.rng.int(30, 120));
      c.h.money(-cost);
      c.h.closeness(p.id, c.rng.int(8, 14));
      const i = c.rng.int(0, 4);
      const gift = ['a scarf', 'a book', 'a plant', 'concert tickets', 'a framed photo of you two'][i];
      const giftTr = ['bir atkı', 'bir kitap', 'bir saksı çiçeği', 'konser bileti', 'ikinizin çerçeveli bir fotoğrafını'][i];
      return c.t(`You gave ${p.firstName} ${gift}. ${c.h.he(p) === 'she' ? 'She' : 'He'} loved it.`, `${dat(p.firstName)} ${giftTr} hediye ettin. Çok sevdi.`);
    },
  },
  {
    id: 'compliment',
    label: 'Pay a compliment',
    labelTr: 'İltifat et',
    kinds: ALL,
    minAge: 4,
    run: (c, p) => {
      if (c.rng.chance(0.85)) {
        c.h.closeness(p.id, c.rng.int(3, 6));
        return c.t(`You told ${p.firstName} how much they mean to you.`, `${dat(p.firstName)} senin için ne kadar değerli olduğunu söyledin.`);
      }
      c.h.closeness(p.id, -1);
      return c.t(
        `You complimented ${p.firstName}'s haircut. It was the same haircut as always. Awkward.`,
        `${gen(p.firstName)} yeni saçını övdün. Saçı hep böyleydi. Biraz garip oldu.`,
      );
    },
  },
  {
    id: 'story',
    label: 'Read a bedtime story',
    labelTr: 'Masal oku',
    kinds: ['child'],
    available: (c, p) => c.h.ageOf(p) <= 10,
    run: (c, p) => {
      c.h.closeness(p.id, 10);
      p.stats.smarts = Math.min(100, p.stats.smarts + 2);
      return c.t(
        `You read ${p.firstName} a bedtime story. ${c.h.he(p) === 'she' ? 'She' : 'He'} was asleep before the dragon showed up.`,
        `${dat(p.firstName)} masal okudun. Ejderha daha sahneye çıkmadan uyudu.`,
      );
    },
  },
  {
    id: 'money',
    label: 'Ask for money',
    labelTr: 'Para iste',
    kinds: ['mother', 'father'],
    minAge: 8,
    run: (c, p, r) => {
      if (c.rng.chance(r.closeness / 140)) {
        const amt = wage(c, c.age < 18 ? c.rng.int(5, 60) : c.rng.int(200, 3000));
        c.h.money(amt);
        c.h.closeness(p.id, -2);
        return c.t(`${p.firstName} gave you ${c.h.fmt(amt)} and a speech about saving.`, `${p.firstName} sana ${c.h.fmt(amt)} verdi. Üstüne de tasarruf üzerine uzun bir nutuk attı.`);
      }
      c.h.closeness(p.id, -6);
      return c.t(
        `${p.firstName} said no. Then asked when you are going to "get serious about life."`,
        `${p.firstName} hayır dedi. Sonra da "Ne zaman adam olacaksın?" diye sordu.`,
      );
    },
  },
  {
    id: 'advice',
    label: 'Ask for advice',
    labelTr: 'Tavsiye iste',
    kinds: ['mother', 'father', 'sibling', 'spouse', 'partner', 'friend'],
    minAge: 10,
    run: (c, p) => {
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      c.h.closeness(p.id, 3);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          `${p.firstName} told you: "Never trust a man with two phones."`,
          `${p.firstName} told you: "Buy cheap, cry twice."`,
          `${p.firstName} told you to call your grandmother more. Fair.`,
        ][i],
        [
          `${p.firstName} dedi ki: "İki telefonu olan adama asla güvenme."`,
          `${p.firstName} dedi ki: "Ucuz etin yahnisi yavan olur."`,
          `${p.firstName} anneanneni daha sık aramanı söyledi. Haklı.`,
        ][i],
      );
    },
  },
  {
    id: 'argue',
    label: 'Pick a fight',
    labelTr: 'Kavga çıkar',
    kinds: ALL,
    minAge: 6,
    run: (c, p) => {
      if (c.rng.chance(0.15)) {
        c.h.closeness(p.id, 2);
        return c.t(`You started an argument with ${p.firstName}, but you both ended up laughing.`, `${wth(p.firstName)} tartışma başlattın ama sonunda ikiniz de gülmekten kırıldınız.`);
      }
      c.h.closeness(p.id, -c.rng.int(4, 10));
      c.h.stat('happiness', -2);
      return c.t(
        `You argued with ${p.firstName} about something neither of you will remember next week.`,
        `${wth(p.firstName)} haftaya ikinizin de hatırlamayacağı bir şey yüzünden tartıştınız.`,
      );
    },
  },
  {
    id: 'breakup',
    label: 'Break up',
    labelTr: 'Ayrıl',
    kinds: ['partner'],
    run: (c, p) => {
      c.h.setKind(p.id, 'ex');
      c.h.stat('happiness', -8);
      return c.t(`You broke up with ${p.firstName}.`, `${wth(p.firstName)} ayrıldın.`);
    },
  },
  {
    id: 'divorce',
    label: 'Divorce',
    labelTr: 'Boşan',
    kinds: ['spouse'],
    run: (c, p) => {
      const half = Math.max(0, Math.round(c.p.money / 2));
      c.h.money(-half);
      c.h.setKind(p.id, 'ex');
      c.h.stat('happiness', -12);
      return c.t(
        `You divorced ${p.firstName}. ${half > 0 ? `The lawyers made sure ${c.h.he(p)} got ${c.h.fmt(half)}.` : ''}`.trim(),
        `${wth(p.firstName)} boşandın. ${half > 0 ? `Avukatlar ${gen(p.firstName)} ${c.h.fmt(half)} almasını sağladı.` : ''}`.trim(),
      );
    },
  },
];

export interface InteractionOption {
  id: string;
  label: string;
  disabled: boolean;
}

export function usesWith(s: GameState, personId: string): number {
  return s.player.actionsThisYear[`rel:${personId}`] ?? 0;
}

export function interactionsFor(s: GameState, personId: string): InteractionOption[] {
  const rel = s.player.relations.find((r) => r.personId === personId);
  const person = s.people[personId];
  if (!rel || !person || person.deathYear !== undefined) return [];
  const c = makeCtx(s); // availability checks only read state
  const limitHit = usesWith(s, personId) >= INTERACTIONS_PER_PERSON || s.player.jailYears > 0 || !!s.pending || !!s.dead;
  return INTERACTIONS.filter((d) => d.kinds.includes(rel.kind) && c.age >= (d.minAge ?? 0)).map((d) => ({
    id: d.id,
    label: s.lang === 'tr' ? d.labelTr : d.label,
    disabled: limitHit || (d.available ? !d.available(c, person, rel) : false),
  }));
}

/** Runs an interaction, logs it and returns the line (or null if not allowed). */
export function interact(s: GameState, personId: string, id: string): string | null {
  const opt = interactionsFor(s, personId).find((o) => o.id === id);
  const def = INTERACTIONS.find((d) => d.id === id);
  if (!opt || opt.disabled || !def) return null;
  const c = makeCtx(s);
  const person = s.people[personId];
  const rel = s.player.relations.find((r) => r.personId === personId)!;
  s.player.actionsThisYear[`rel:${personId}`] = usesWith(s, personId) + 1;
  const line = def.run(c, person, rel);
  c.h.log(line);
  return line;
}

export { ageOf };
