import type { ContentPack } from '../types';
import type { Player } from '../../engine/types';
import { loc } from '../base/util';
import { cityName } from '../../engine/places';
import { crimeActivities } from './activities';
import { afterEvents } from './events-after';
import { justiceEvents } from './events-justice';
import { prisonEvents } from './events-prison';
import { streetEvents } from './events-street';
import { convictFor, crimeState, isPetty, localMoney, peekCrime, yearsServed } from './state';

// "Crime World" expansion (18+). Bundled with the app, unlocked by purchase + adult-content opt-in.
// Tone: satirical with real consequences (prison, lost jobs, broken relationships). No real-world how-to.
//
// Builds on the free street crime (base/street-crime.ts: shoplifting, pickpocketing, graffiti, fights, the court date,
// short sentences and a few things to do inside). Both use the same state in p.ext.crime (base/street-law.ts).
//
// Files:
//   state.ts          re-exports base/street-law.ts: crime state, convict() / arrest() / sentence caps
//   events-street.ts  the crime ladder: burglary, gang, knockoffs, car theft, heist, embezzlement, tax fraud, raid
//   events-justice.ts trial, detective, statute of limitations
//   events-prison.ts  fights, classes, parole, cellmate, letters, riot, escape
//   events-after.ts   job hunting with a record, kids asking, old crew, redemption, the attic
//   activities.ts     After dark activities and the prison workshop

export const CRIME_ENTITLEMENT = 'pack.crime_world';
export { convict } from './state';

/** A parent the town still talks about: three or more years sentenced or three convictions, the last within 30 years. */
export function infamous(prev: Player, year: number): boolean {
  const st = peekCrime(prev);
  const big = (st?.sentenced ?? 0) >= 3 || prev.criminalRecord >= 3;
  const recent = !!st && st.lastCrimeYear > 0 && year - st.lastCrimeYear <= 30;
  return big && recent;
}

export const crimePack: ContentPack = {
  id: 'crime_world',
  title: 'Crime World',
  description: 'Burglary, gangs, heists, big trials and prison life in depth. Builds on the free street crime: every choice has a cost, and your family remembers.',
  rating: 'mature',
  entitlement: CRIME_ENTITLEMENT,
  events: [...streetEvents, ...justiceEvents, ...prisonEvents, ...afterEvents],
  activities: crimeActivities,

  // heat cooling and noticing a release run in the free game (base/street.ts streetOnYear) on the same state
  onYear: (c) => {
    // a big charge that waited three years for crime.trial (the year's slot kept going to life-stage moments) is
    // tried anyway: the plea deal, half the sentence asked for
    const ch = peekCrime(c.p)?.charge;
    if (ch && !isPetty(ch.crime) && c.p.jailYears === 0 && c.s.year - ch.year >= 3) {
      crimeState(c.p).charge = null;
      c.h.log(c.t('Your trial finally came round. Your lawyer took the plea deal. ', 'Davan sonunda görüldü. Avukatın itiraf pazarlığını kabul etti. ') + convictFor(c, ch.crime, Math.max(1, Math.ceil(ch.years / 2))), 'bad');
    }
    if (c.h.has('lied_on_cv')) {
      if (!c.p.jobId) c.h.unflag('lied_on_cv');
      else if (c.rng.chance(0.15)) {
        c.h.unflag('lied_on_cv');
        c.h.setJob(null);
        c.h.stat('happiness', -8);
        c.h.log(c.t('HR finally checked your record. You were fired for lying on your application.', 'İnsan kaynakları sonunda sicil kaydına baktı. Başvuruda yalan söylediğin için kovuldun.'), 'bad');
      }
    }
  },

  lifeTiles: (s) => {
    const p = s.player;
    const st = peekCrime(p);
    const tr = s.lang === 'tr';
    const tiles: { label: string; value: string }[] = [];
    if (p.criminalRecord > 0) tiles.push({ label: tr ? 'Sabıka' : 'Record', value: tr ? `${p.criminalRecord} kayıt` : `${p.criminalRecord} conviction${p.criminalRecord > 1 ? 's' : ''}` });
    if (!st || p.jailYears > 0) return tiles;
    if (st.charge) tiles.push({ label: tr ? 'Dava' : 'Trial', value: tr ? 'Kefaletle dışarıda' : 'Out on bail' });
    else if (st.fugitive) tiles.push({ label: tr ? 'Durum' : 'Status', value: tr ? 'Firari' : 'Fugitive' });
    else if (st.heat >= 30) tiles.push({ label: tr ? 'Polis' : 'Police', value: st.heat >= 60 ? (tr ? 'Peşinde' : 'On your trail') : tr ? 'Şüpheleniyor' : 'Suspicious' });
    return tiles;
  },

  goals: [
    { id: 'crime_heist', label: 'Pull off a heist', labelTr: 'Bir soygunu başarıyla tamamla', check: (s) => s.player.achievements.includes('heist') },
    { id: 'crime_reformed', label: 'Turn your life around after a conviction', labelTr: 'Sabıkadan sonra hayatını düzene sok', check: (s) => s.player.achievements.includes('reformed') },
  ],

  ribbons: [
    { id: 'crime_ghost', name: 'Ghost', desc: 'Pulled off a heist and never spent a day inside.', nameTr: 'Hayalet', descTr: 'Büyük bir soygunu başardı ve bir gün bile içeri girmedi.', test: (_r, p) => p.achievements.includes('heist') && p.criminalRecord === 0 },
    { id: 'crime_second_chance', name: 'Second Chance', desc: 'Went to prison, turned it all around and never looked back.', nameTr: 'İkinci Şans', descTr: 'Hapse girdi, sonra hayatını baştan kurdu ve bir daha geri dönmedi.', test: (_r, p) => {
      const st = peekCrime(p);
      return p.achievements.includes('reformed') && p.criminalRecord > 0 && !!st?.reformedYear && st.lastCrimeYear < st.reformedYear;
    } },
    { id: 'crime_lifer', name: 'Jailbird', desc: 'Spent fifteen or more years behind bars.', nameTr: 'Kader Mahkûmu', descTr: 'On beş yıl ya da daha fazlasını parmaklıklar ardında geçirdi.', test: (_r, p) => yearsServed(p) >= 15 },
  ],

  onInherit: (prev, next, s) => {
    const st = peekCrime(prev);
    const secret = prev.criminalRecord > 0 || (st?.scores ?? 0) >= 2 || prev.achievements.includes('heist');
    if (!secret) return;
    // a parent who got away with something big may have left a little something behind
    const stash = st?.coldCase && st.bigScore > 0 ? Math.min(Math.round(st.bigScore * 0.25), localMoney(prev, 20000)) : 0;
    crimeState(next).legacy = { name: prev.firstName, record: prev.criminalRecord, stash, id: prev.id, famous: infamous(prev, s.year) };
    if (prev.criminalRecord === 0) return; // the secret waits in the attic
    // the whole town only remembers a real reputation: years inside or a long record, not too long ago
    // (playtest 3 §2.14: one shoplifting conviction at 20, 45 years earlier, was "the trial everyone remembers")
    if (!infamous(prev, s.year)) return;
    next.stats.happiness = Math.max(0, next.stats.happiness - 3);
    const tr = s.lang === 'tr';
    return tr
      ? `${loc(cityName(prev.city, 'tr'))} herkes ${prev.firstName} ${prev.lastName} davasını hâlâ hatırlıyor. Fırıncı paranın üstünü sana iki kez sayıyor.`
      : `Everyone in ${prev.city} still remembers ${prev.firstName} ${prev.lastName}'s trial. The baker counts your change twice.`;
  },
};
