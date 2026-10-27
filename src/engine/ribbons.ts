import type { GameState, LifeRecord, Player } from './types';
import { packRibbons } from '../content/registry';

/** End-of-life ribbons. Collected across all families in the profile, BitLife-style. First match wins. */
export interface RibbonDef {
  id: string;
  name: string;
  desc: string;
  nameTr?: string;
  descTr?: string;
  test: (r: LifeRecord, p: Player, s: GameState) => boolean;
}

export const RIBBONS: RibbonDef[] = [
  { id: 'centenarian', name: 'Centenarian', desc: 'Lived to 100 or more.', nameTr: 'Asırlık', descTr: '100 yaş ve üstünü gördü.', test: (r) => r.age >= 100 },
  { id: 'gone_soon', name: 'Gone Too Soon', desc: 'Died before 30.', nameTr: 'Erken Gidenler', descTr: '30 yaşından önce öldü.', test: (r) => r.age < 30 },
  { id: 'black_sheep', name: 'Black Sheep', desc: 'Convicted more than once.', nameTr: 'Kara Koyun', descTr: 'Birden fazla kez mahkûm oldu.', test: (_r, p) => p.criminalRecord >= 2 },
  { id: 'tycoon', name: 'Tycoon', desc: 'Ended a life worth a million (US dollars).', nameTr: 'Kodaman', descTr: 'Hayatını bir milyon (ABD doları) servetle tamamladı.', test: (r, p) => isTycoon(r.netWorth, p.money) },
  { id: 'overachiever', name: 'Overachiever', desc: 'Completed all three life goals.', nameTr: 'Başarı Avcısı', descTr: 'Üç hayat hedefinin hepsini tamamladı.', test: (_r, p) => !!p.goals?.length && p.goals.every((g) => g.done) },
  { id: 'big_family', name: 'Big Family', desc: 'Raised four or more children.', nameTr: 'Kalabalık Aile', descTr: 'Dört ya da daha fazla çocuk büyüttü.', test: (r) => r.children >= 4 },
  { id: 'soulmates', name: 'Soulmates', desc: '40+ years with the same partner.', nameTr: 'Ruh İkizleri', descTr: 'Aynı kişiyle 40 yıldan fazla.', test: (r) => (r.partnerYears ?? 0) >= 40 },
  { id: 'top_ladder', name: 'Top of the Ladder', desc: 'Reached the highest title in a career.', nameTr: 'Zirvedeki', descTr: 'Bir kariyerin en üst unvanına ulaştı.', test: (_r, p) => p.achievements.includes('top_job') },
  { id: 'scholar', name: 'Scholar', desc: 'University degree and 90+ Smarts.', nameTr: 'Bilge', descTr: 'Üniversite diploması ve 90+ Zekâ.', test: (_r, p) => p.education === 'university' && p.stats.smarts >= 90 },
  { id: 'keeper', name: 'Keeper of Treasures', desc: 'Held three or more heirlooms.', nameTr: 'Hazine Bekçisi', descTr: 'Üç ya da daha fazla yadigâr taşıdı.', test: (_r, _p, s) => s.dynasty.heirlooms.length >= 3 },
  { id: 'star', name: 'Local Legend', desc: 'Won the talent show or went viral.', nameTr: 'Mahallenin Yıldızı', descTr: 'Yetenek yarışmasını kazandı ya da viral oldu.', test: (_r, p) => p.achievements.includes('talent_show') || p.achievements.includes('viral') },
  { id: 'broke', name: 'In the Red', desc: 'Ended a life in debt.', nameTr: 'Eksidekiler', descTr: 'Hayatını borç içinde tamamladı.', test: (r) => r.netWorth < 0 },
  { id: 'lone_wolf', name: 'Lone Wolf', desc: 'No partner, no children, 60+ years.', nameTr: 'Yalnız Kurt', descTr: 'Eş yok, çocuk yok, 60+ yıl.', test: (r) => !r.partnerName && r.children === 0 && r.age >= 60 },
  { id: 'content', name: 'Content', desc: 'Died with 85+ Happiness.', nameTr: 'Huzurlu', descTr: '85+ Mutlulukla öldü.', test: (_r, p) => p.stats.happiness >= 85 },
  { id: 'ordinary', name: 'Quietly Ordinary', desc: 'A normal life, and that is fine.', nameTr: 'Sıradan ve Güzel', descTr: 'Normal bir hayat; bunda bir sorun yok.', test: () => true },
];

/**
 * A tycoon is worth a million in the end, counting the home, the car and the business and subtracting what is owed,
 * and does not live on borrowed money: a big mortgaged home with the bank account deep in the red (debt above a
 * quarter of the net worth) is not a fortune (playtest: "Tycoon" on a life that ended in heavy debt).
 */
export const isTycoon = (netWorth: number, money: number) => netWorth >= 1_000_000 && money >= -0.25 * netWorth;

export function ribbonFor(r: LifeRecord, p: Player, s: GameState): RibbonDef {
  return [...packRibbons(s.enabledPacks), ...RIBBONS].find((x) => x.test(r, p, s)) ?? RIBBONS[RIBBONS.length - 1];
}

/** Every ribbon that exists, including ones from expansions the player may not own yet. */
export function allRibbons(): RibbonDef[] {
  return [...packRibbons(), ...RIBBONS];
}

export function getRibbon(id: string | undefined): RibbonDef | undefined {
  return allRibbons().find((x) => x.id === id);
}

export const ribbonName = (r: RibbonDef, lang?: string) => (lang === 'tr' && r.nameTr ? r.nameTr : r.name);
export const ribbonDesc = (r: RibbonDef, lang?: string) => (lang === 'tr' && r.descTr ? r.descTr : r.desc);
