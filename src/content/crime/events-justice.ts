import type { Ctx, EventDef } from '../types';
import { nm, wage } from '../base/util';
import { arrest, CRIMES, convictFor, crimeState, free, isCrimeKey, isPetty, MAX_SENTENCE, peekCrime, sentenceFor, type CrimeKey } from './state';

// Trials, the detective who will not let go, and the statute of limitations.

const chargeOf = (c: Ctx): CrimeKey => (isCrimeKey(c.vars.crime) ? c.vars.crime : 'theft');

/** Clears the pending charge and sentences for it. */
function sentence(c: Ctx, years: number): string {
  crimeState(c.p).charge = null;
  return convictFor(c, chargeOf(c), years);
}

function acquit(c: Ctx): void {
  const st = crimeState(c.p);
  st.charge = null;
  st.acquittals++;
  st.heat = 0;
  if (st.coldCase?.crime === chargeOf(c)) st.coldCase = null; // double jeopardy
  c.h.stat('happiness', 12);
}

export const justiceEvents: EventDef[] = [
  {
    id: 'crime.trial',
    category: 'crime',
    minAge: 12,
    weight: 500,
    cooldown: 1,
    maxPerLife: 12, // one trial per charge
    when: (c) => {
      const ch = peekCrime(c.p)?.charge;
      // petty charges go to the free court date (base.court_date); this is the big trial
      return free(c) && !!ch && ch.year < c.s.year && !isPetty(ch.crime);
    },
    setup: (c) => {
      const ch = crimeState(c.p).charge!;
      c.vars.crime = ch.crime;
      c.vars.years = ch.years;
      c.vars.fee = wage(c, 6000 + ch.years * 3000);
    },
    title: (c) => c.t(`Your trial for ${CRIMES[chargeOf(c)].en} starts today.`, `${CRIMES[chargeOf(c)].tr} davan bugün başlıyor.`),
    text: (c) =>
      c.t(
        `The prosecutor wants ${c.vars.years} year${Number(c.vars.years) > 1 ? 's' : ''}. The judge clearly skipped lunch.`,
        `Savcı ${c.vars.years} yıl hapis istiyor. Hâkimin öğle yemeğini atladığı her halinden belli.`,
      ),
    choices: [
      {
        id: 'plead',
        label: (c) => c.t('Plead guilty', 'Suçunu kabul et'),
        resolve: (c) => {
          const years = Math.max(1, Math.ceil(Number(c.vars.years) / 2));
          return c.t('You pleaded guilty and the judge, grateful to skip the speeches, cut your sentence. ', 'Suçunu kabul ettin. Uzun konuşmalardan kurtulduğuna sevinen hâkim cezanı indirdi. ') + sentence(c, years);
        },
        tone: 'bad',
      },
      {
        id: 'lawyer',
        label: (c) => c.t(`Hire an expensive lawyer (${c.h.fmt(Number(c.vars.fee))})`, `Pahalı bir avukat tut (${c.h.fmt(Number(c.vars.fee))})`),
        badge: 'Costs more',
        requires: (c) => c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.fee));
          if (c.rng.chance(0.6)) {
            acquit(c);
            return c.t(
              'Your lawyer, in a suit worth more than your car, found a missing comma in the police report. Case dismissed.',
              'Arabandan pahalı takım elbisesiyle avukatın, polis tutanağında eksik bir virgül buldu. Dava düştü.',
            );
          }
          return c.t(`You paid the lawyer ${c.h.fmt(Number(c.vars.fee))} and still lost. He sent flowers. `, `Avukata ${c.h.fmt(Number(c.vars.fee))} ödedin, yine de kaybettin. Sana çiçek gönderdi. `) + sentence(c, Number(c.vars.years));
        },
        tone: 'big',
      },
      {
        id: 'self',
        label: (c) => c.t('Represent yourself', 'Kendini kendin savun'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.08 + c.p.stats.smarts / 500)) {
            acquit(c);
            return c.t(
              'You represented yourself and confused the court so thoroughly that it found you not guilty just to make you stop talking.',
              'Kendini kendin savundun ve mahkemenin kafasını öyle karıştırdın ki susman için beraatine karar verdiler.',
            );
          }
          return c.t('You cross-examined yourself. You lost. ', 'Kendini çapraz sorguya çektin. Kaybettin. ') + sentence(c, Math.min(MAX_SENTENCE, Number(c.vars.years) + 1));
        },
      },
      {
        id: 'flee',
        label: (c) => c.t('Skip town', 'Şehirden kaç'),
        badge: 'No way back',
        resolve: (c) => {
          const st = crimeState(c.p);
          st.charge = null;
          st.fugitive = true;
          st.wanted = chargeOf(c);
          st.owed = 0;
          st.heat = 80;
          c.h.money(-wage(c, 2000));
          c.h.stat('happiness', -6);
          c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -10));
          return c.t(
            'You skipped town the night before the trial. Somewhere, a judge is writing your name down very slowly.',
            'Duruşmadan önceki gece şehirden sıvıştın. Bir yerlerde bir hâkim adını çok yavaş, harf harf yazıyor.',
          );
        },
        tone: 'big',
      },
    ],
  },
  {
    id: 'crime.detective',
    category: 'crime',
    minAge: 18,
    cooldown: 3,
    weight: (c) => (peekCrime(c.p)?.fugitive ? 25 : Math.round((peekCrime(c.p)?.heat ?? 0) / 4)),
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st && !st.charge && (st.heat >= 35 || st.fugitive);
    },
    setup: (c) => {
      const st = crimeState(c.p);
      // the same detective comes back, until they retire (or die): then the case goes to someone new
      const old = st.detective ? c.h.person(st.detective) : undefined;
      c.vars.again = old && old.deathYear === undefined && c.h.ageOf(old) <= 65 ? 1 : 0;
      if (!c.vars.again) st.detective = c.h.newPerson({ age: c.rng.int(38, 55) }).id;
      c.vars.pid = st.detective!;
      c.vars.fugitive = st.fugitive ? 1 : 0;
      c.vars.fee = wage(c, 2500);
    },
    title: (c) =>
      Number(c.vars.again)
        ? c.t(`Detective ${nm(c)} is at your door again.`, `Komiser ${nm(c)} yine kapında.`)
        : c.t(`A detective named ${nm(c)} knocks on your door.`, `${nm(c)} adında bir komiser kapını çalıyor.`),
    text: (c) =>
      Number(c.vars.fugitive)
        ? c.t(`${nm(c)} has an old photo of you, a new photo of you and a very patient face.`, `${nm(c)} elinde eski bir fotoğrafın, yeni bir fotoğrafın ve sonsuz bir sabırla duruyor.`)
        : c.t(`A witness saw someone who looks a lot like you. ${nm(c)} just wants to "ask a few questions".`, `Bir tanık sana çok benzeyen birini görmüş. ${nm(c)} sadece "birkaç soru sormak" istiyor.`),
    choices: [
      {
        id: 'calm',
        label: (c) => c.t('Stay calm and answer', 'Sakin ol ve cevap ver'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          const fug = st.fugitive;
          if (c.rng.chance((fug ? 0.25 : 0.35) + c.p.stats.smarts / 250)) {
            st.heat = Math.max(0, st.heat - 30);
            return c.t(
              `You answered every question with a polite, boring lie. ${nm(c)} left a business card "in case you remember something".`,
              `Her soruya kibar ve sıkıcı bir yalanla cevap verdin. ${nm(c)}, "bir şey hatırlarsan diye" kartvizitini bıraktı.`,
            );
          }
          return c.t(`Your story fell apart on the third question. ${nm(c)} did not even look surprised. `, `Hikâyen üçüncü soruda çöktü. ${nm(c)} şaşırmadı bile. `) + caught(c, 0);
        },
      },
      {
        id: 'lawyer',
        label: (c) =>
          Number(c.vars.fugitive)
            ? c.t('Run again', 'Yine kaç')
            : c.t(`Say nothing without a lawyer (${c.h.fmt(Number(c.vars.fee))})`, `Avukatsız konuşmam de (${c.h.fmt(Number(c.vars.fee))})`),
        requires: (c) => !!Number(c.vars.fugitive) || c.p.money >= Number(c.vars.fee),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const st = crimeState(c.p);
          if (st.fugitive) {
            if (c.rng.chance(0.5)) {
              st.heat = 80;
              c.h.money(-wage(c, 1500));
              c.h.stat('happiness', -5);
              return c.t('You went out the bathroom window and started over in another city. Again.', 'Banyo penceresinden çıkıp başka bir şehirde sıfırdan başladın. Yine.');
            }
            return c.t(`${nm(c)} was waiting under the bathroom window. `, `${nm(c)} banyo penceresinin altında bekliyordu. `) + caught(c, 1);
          }
          c.h.money(-Number(c.vars.fee));
          st.heat = Math.max(0, st.heat - 40);
          return c.t(`Your lawyer did all the talking. On the way out ${nm(c)} said, "That is what guilty people do."`, `Bütün konuşmayı avukatın yaptı. ${nm(c)} çıkarken "Suçlular hep böyle yapar," dedi.`);
        },
      },
      {
        id: 'confess',
        label: (c) => c.t('Confess everything', 'Her şeyi itiraf et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(`Saying it out loud felt strangely good. ${nm(c)} bought you a cup of tea before the paperwork. `, `Her şeyi yüksek sesle söylemek tuhaf bir şekilde iyi geldi. ${nm(c)} evrak işinden önce sana bir çay ısmarladı. `) + caught(c, -1);
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'crime.statute',
    category: 'crime',
    minAge: 25,
    cooldown: 2,
    weight: 30,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st?.coldCase && !st.fugitive && !st.charge && c.s.year - st.coldCase.year >= 10;
    },
    text: '',
    apply: (c) => {
      const st = crimeState(c.p);
      if (!st.coldCase) return;
      const k = st.coldCase.crime;
      st.coldCase = null;
      st.heat = 0;
      c.h.stat('happiness', 10);
      const i = c.rng.int(0, 2);
      const head = c.t(`Ten years on, the ${CRIMES[k].en} case hit the statute of limitations.`, `${CRIMES[k].tr} dosyası on yıl sonra zaman aşımına uğradı.`);
      return `${head} ${c.t(
        ['You celebrated alone with a whole cake and told nobody why.', 'You slept eight hours straight for the first time in a decade.', 'You threw away the fake mustache you had kept in a drawer, just in case.'][i],
        ['Kimseye nedenini söylemeden koca bir pastayı tek başına yiyerek kutladın.', 'On yıldır ilk kez deliksiz sekiz saat uyudun.', 'Ne olur ne olmaz diye çekmecede sakladığın takma bıyığı nihayet çöpe attın.'][i],
      )}`;
    },
    tone: 'good',
  },
];

/**
 * The detective got you. `mod` is a sentence change: -1 for confessing (sentenced on the spot), +1 for running again.
 * Fugitives go straight to prison with the time they still owe; everyone else is arrested and goes to trial.
 */
function caught(c: Ctx, mod: number): string {
  const st = crimeState(c.p);
  if (st.fugitive) {
    const k = st.wanted ?? 'escape';
    return convictFor(c, k, sentenceFor(c, k) + mod); // convict() adds the time owed for running
  }
  const k = st.coldCase?.crime ?? 'theft';
  st.coldCase = null;
  if (mod >= 0) return arrest(c, k);
  return convictFor(c, k, Math.max(1, sentenceFor(c, k) + mod));
}
