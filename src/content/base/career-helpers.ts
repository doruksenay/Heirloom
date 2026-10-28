import type { Ctx } from '../types';
import { wage, workKind } from './util';
import { isJob } from './activities-careers';

// Small helpers for the round 4 career events (events-careers-r4*.ts).

/** A bilingual text for title/text/label: L('English', 'Türkçe'). */
export const L = (en: string, tr: string) => (c: Ctx) => c.t(en, tr);

/** The player works (not retired, not in prison) in one of these jobs. */
export const onAny =
  (...ids: string[]) =>
  (c: Ctx) =>
    ids.some((id) => isJob(c, id));

/** Try a promotion; returns the sentence that announces it (with a leading space), or '' when it is not due. */
export function promo(c: Ctx): string {
  if (!c.h.promote()) return '';
  c.h.stat('happiness', 4);
  return c.t(` You were promoted to ${c.h.jobTitle()}.`, ` Terfi geldi: artık ${c.h.jobTitle()} oldun.`);
}

/** Lose the job. */
export function fire(c: Ctx): void {
  c.h.setJob(null);
  c.h.stat('happiness', -8);
}

/** Add (or take, with a negative amount) money scaled to the country; returns the formatted amount (always positive). */
export function cash(c: Ctx, usd: number): string {
  const amt = wage(c, usd);
  c.h.money(amt);
  return c.h.fmt(Math.abs(amt));
}

/**
 * The retirement party fits the work (review 5 §3.13: "your company" threw a party for a surgeon and a councillor):
 * the self-employed close the shop, public servants get a plaque from the institution, office staff the company
 * party, trades the crew at the site, health the ward, schools the staff room. Text only, no RNG.
 */
export function retirementScene(c: Ctx): { title: string; text: string } {
  const job = c.h.job();
  const y = c.p.jobYears;
  const kind = workKind(c);
  const selfEmployed = kind === 'none' || !!job?.freelance;
  const yrsEn = `${y} year${y === 1 ? '' : 's'}`;
  if (selfEmployed)
    return {
      title: c.t(`You are ${c.age}. Time to hand over the keys?`, `${c.age} yaşındasın. Anahtarları devretme vakti mi?`),
      text: c.t(
        `After ${yrsEn} as your own boss, your regulars brought a cake and asked who will take over.`,
        `${y} yıl kendi işinin patronu olduktan sonra müdavimlerin bir pasta getirdi ve işi kimin devralacağını sordu.`,
      ),
    };
  if (kind === 'uniform' || kind === 'school' || job?.field === 'public')
    return {
      title: c.t(`You are ${c.age}. Your service is ending.`, `${c.age} yaşındasın. Emeklilik dilekçen masada.`),
      text: c.t(
        `After ${yrsEn} of service there is a plaque with your name on it, slightly misspelled, and a cake in the ${kind === 'school' ? 'staff room' : 'tea room'}.`,
        `${y} yıllık hizmetin ardından adının yazılı olduğu bir plaket hazırlanmış, adın biraz yanlış yazılmış; ${kind === 'school' ? 'öğretmenler odasında' : 'çay ocağının yanında'} da bir pasta var.`,
      ),
    };
  if (kind === 'trade')
    return {
      title: c.t(`You are ${c.age}. The crew is throwing you a send-off.`, `${c.age} yaşındasın. Ekip sana bir veda yemeği veriyor.`),
      text: c.t(
        `After ${yrsEn}, the crew put a cake on the workbench and signed your old work gloves.`,
        `${y} yılın ardından ekip tezgâhın üstüne bir pasta koydu ve eski iş eldivenlerini imzaladı.`,
      ),
    };
  if (kind === 'health')
    return {
      title: c.t(`You are ${c.age}. The ward is saying goodbye.`, `${c.age} yaşındasın. Servis sana veda ediyor.`),
      text: c.t(
        `After ${yrsEn}, the night shift hid a cake in the medicine fridge. Nobody is telling the pharmacist.`,
        `${y} yılın ardından gece nöbetindekiler ilaç buzdolabına bir pasta saklamış. Eczacıya kimse söylemeyecek.`,
      ),
    };
  if (kind === 'office')
    return {
      title: c.t(`You are ${c.age}. Your company offers you a retirement party.`, `${c.age} yaşındasın. Şirketin sana emeklilik partisi veriyor.`),
      text: c.t(
        `After ${yrsEn}, your colleagues have already bought the cake and signed a card the size of a door.`,
        `${y} yılın ardından iş arkadaşların pastayı çoktan almış ve kapı büyüklüğünde bir kartı imzalamış bile.`,
      ),
    };
  return {
    title: c.t(`You are ${c.age}. Your workplace is throwing you a retirement party.`, `${c.age} yaşındasın. İş yerin sana emeklilik partisi veriyor.`),
    text: c.t(`After ${yrsEn}, your colleagues have already bought the cake.`, `${y} yılın ardından iş arkadaşların pastayı çoktan almış bile.`),
  };
}
