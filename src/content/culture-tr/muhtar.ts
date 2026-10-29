import type { ActivityDef, ChoiceDef, Ctx, EventDef } from '../types';
import type { Player } from '../../engine/types';
import { wage } from '../base/util';
import { inTR } from './common';
import { emig } from '../base/abroad';

/*
 * Round 7 (balance): running for muhtar, so the "Get elected neighborhood muhtar" goal is in the player's own hands
 * (review 6 §3.1: given in 29% of Turkish lives, won twice in 967, only through a random event at 55–80).
 *
 *   activity  "Muhtarlığa aday ol" from 40, in Türkiye, with a clean record: the announcement (a campaign style)
 *   activity  the same slot, "Kampanya yap", once a year until the vote: one campaign moment with choices
 *   election  the local-election year (2029, 2034, …; at least a year after announcing), opened by the pack's schedule:
 *             the count and the result. The odds follow the campaign, friends, happiness and age; a loss can be
 *             tried again at the next election.
 *
 * State: p.ext.muhtar (JSON only). RNG calls never depend on the language.
 */

export const MUHTAR_MIN_AGE = 40;
export const MUHTAR_MAX_AGE = 80;
/** Türkiye's local elections: every five years from 2024. */
const ELECTION_BASE = 2024;
export const nextElection = (year: number) => {
  let y = year + 1;
  while ((y - ELECTION_BASE) % 5 !== 0) y++;
  return y;
};

interface MuhtarState {
  /** The election the running campaign is for (unset when not running). */
  election?: number;
  /** Campaign points so far. */
  score?: number;
  /** Year of the last campaign moment. */
  campaigned?: number;
  /** Elections lost so far. */
  lost?: number;
  /** Year elected. */
  won?: number;
}
const peek = (p: Player) => p.ext?.muhtar as MuhtarState | undefined;
const state = (p: Player): MuhtarState => ((p.ext ??= {}).muhtar ??= {}) as MuhtarState;
export const muhtarRunning = (p: Player) => peek(p)?.election !== undefined;
const isMuhtar = (p: Player) => p.achievements.includes('tr_muhtar');
const add = (c: Ctx, n: number) => {
  const st = state(c.p);
  st.score = (st.score ?? 0) + n;
};

/** Chance to win the vote, 5%–75%: a strong campaign counts for most of it. */
export function muhtarOdds(c: Ctx): number {
  const st = peek(c.p) ?? {};
  const friends = Math.min(5, c.h.relatives('friend').length);
  const p =
    0.1 +
    0.06 * Math.min(8, st.score ?? 0) +
    0.03 * friends +
    (c.p.stats.happiness - 50) / 250 +
    (c.age >= 50 ? 0.05 : 0) +
    (c.p.home.owned ? 0.04 : 0) +
    0.05 * Math.min(2, st.lost ?? 0);
  return Math.max(0.05, Math.min(0.75, p));
}

/** ContentPack.schedule hook (index.ts wraps the milestones' schedule with it): the vote, in its year. */
export function muhtarSchedule(c: Ctx, current: string | null): string | null {
  const st = peek(c.p);
  if (st?.election === undefined) return current;
  // a move abroad or a conviction ends the campaign
  if (!inTR(c) || c.p.criminalRecord > 0) {
    delete st.election;
    st.score = 0;
    c.h.log(c.t('Your run for muhtar is over before the vote: your name came off the list.', 'Muhtarlık adaylığın sandıktan önce bitti: adın listeden düştü.'));
    return current;
  }
  if (current || c.p.jailYears > 0) return current;
  return c.s.year >= st.election ? 'tr.muhtar_election' : current;
}

const yearOf = (c: Ctx) => String(peek(c.p)?.election ?? nextElection(c.s.year));

// ------------------------------------------------------------------ the announcement

const announce: EventDef = {
  id: 'tr.muhtar_announce',
  category: 'milestone',
  scheduled: true,
  when: (c) => inTR(c) && !isMuhtar(c.p),
  title: (c) => c.t('You are running for muhtar.', 'Muhtarlığa aday oluyorsun.'),
  text: (c) =>
    c.t(
      `The next local election is in ${yearOf(c)}. The muhtar keeps the neighborhood's seal, its paperwork and its secrets. How do you start?`,
      `Bir sonraki yerel seçim ${yearOf(c)} yılında. Muhtar mahallenin mührünü, evrakını ve sırlarını taşır. Nereden başlıyorsun?`,
    ),
  choices: [
    {
      id: 'doors',
      label: (c) => c.t('Knock on every door with a tray of tea', 'Çay tepsisiyle kapı kapı dolaş'),
      resolve: (c) => {
        start(c, 2);
        c.h.stat('health', -1);
        c.h.stat('happiness', 2);
        return c.t(
          'You knocked on every door in the neighborhood. Forty glasses of tea later, everyone knew your name and your blood pressure.',
          'Mahallede çalmadığın kapı kalmadı. Kırk bardak çaydan sonra herkes adını da tansiyonunu da öğrendi.',
        );
      },
    },
    {
      id: 'kahve',
      label: (c) => c.t('Make the coffeehouse your campaign office', 'Kıraathaneyi seçim bürosu yap'),
      resolve: (c) => {
        start(c, 2);
        c.h.stat('happiness', 3);
        return c.t(
          'You set up at the corner table of the coffeehouse. By evening the regulars had a campaign plan and three conditions.',
          'Kıraathanenin köşe masasına yerleştin. Akşama kadar müdavimler bir seçim planı ve üç şart hazırlamıştı bile.',
        );
      },
    },
    {
      id: 'posters',
      label: (c) => c.t('Print posters with your best photo', 'En güzel fotoğrafınla afiş bastır'),
      badge: 'Costs more',
      resolve: (c) => {
        c.h.money(-wage(c, 300));
        start(c, c.p.stats.looks >= 60 ? 3 : 1);
        return c.p.stats.looks >= 60
          ? c.t('Your posters went up on every lamppost. People stop to look, and most of them like what they see.', 'Afişlerin her direğe asıldı. Önünden geçen durup bakıyor; beğenenler çoğunlukta.')
          : c.t('Your posters went up on every lamppost. The neighbor upstairs says the photo makes you look "tired but honest".', 'Afişlerin her direğe asıldı. Üst kattaki komşun fotoğrafta "yorgun ama dürüst" göründüğünü söylüyor.');
      },
    },
  ],
};

function start(c: Ctx, points: number) {
  const st = state(c.p);
  st.election = nextElection(c.s.year);
  st.score = points;
  st.campaigned = c.s.year;
}

// ------------------------------------------------------------------ campaign moments

type Moment = { title: [string, string]; text: [string, string]; choices: { id: string; label: [string, string]; points: number; run?: (c: Ctx) => void; line: [string, string] }[] };

const MOMENTS: Moment[] = [
  {
    title: ['Your rival is holding court at the coffeehouse.', 'Rakibin kıraathanede meclis kurmuş.'],
    text: ['He is promising a new park on the empty lot. The empty lot belongs to his brother-in-law.', 'Boş arsaya park sözü veriyor. Boş arsa da kayınbiraderinin.'],
    choices: [
      { id: 'lights', label: ['Bring up the broken streetlights', 'Bozuk sokak lambalarını gündeme getir'], points: 2, line: ['You listed every broken streetlight by name. Even the rival\'s table nodded along.', 'Bozuk sokak lambalarını tek tek saydın. Rakibin masası bile başını salladı.'] },
      { id: 'tea', label: ['Buy everyone a round of tea', 'Herkese birer çay ısmarla'], points: 1, run: (c) => c.h.money(-wage(c, 20)), line: ['You bought the whole coffeehouse a round. They drank it, thanked you and stayed undecided.', 'Bütün kıraathaneye çay ısmarladın. İçtiler, teşekkür ettiler, kararsız kaldılar.'] },
      { id: 'temper', label: ['Tell him what you think of his park', 'Parkı hakkında ne düşündüğünü söyle'], points: -1, line: ['You raised your voice. Somebody filmed it. The video reached the neighborhood group before you reached home.', 'Sesini yükselttin. Biri videoya çekti. Video mahalle grubuna senden önce ulaştı.'] },
    ],
  },
  {
    title: ['The neighborhood group chat wants answers.', 'Mahallenin mesaj grubu cevap bekliyor.'],
    text: ['Two hundred neighbors, one question about the garbage collection, and a lot of voice messages.', 'İki yüz komşu, çöp toplama saatiyle ilgili tek bir soru ve bir sürü sesli mesaj.'],
    choices: [
      { id: 'answer', label: ['Answer every message yourself', 'Her mesaja tek tek cevap ver'], points: 2, run: (c) => c.h.stat('health', -2), line: ['You answered every message until two in the morning. The group now calls you "our candidate".', 'Gece ikiye kadar her mesaja cevap verdin. Grup artık senden "adayımız" diye bahsediyor.'] },
      { id: 'video', label: ['Post a short video promise', 'Kısa bir video ile söz ver'], points: 1, line: ['You recorded a one-minute promise. It took forty takes and the help of the neighbor\'s son.', 'Bir dakikalık bir söz videosu çektin. Kırk deneme ve komşunun oğlunun yardımı gerekti.'] },
      { id: 'mute', label: ['Mute the group', 'Grubu sessize al'], points: 0, run: (c) => c.h.stat('happiness', 2), line: ['You muted the group and slept well. The garbage question is still open.', 'Grubu sessize alıp güzel bir uyku çektin. Çöp meselesi hâlâ ortada.'] },
    ],
  },
  {
    title: ['It is market day.', 'Bugün pazar günü.'],
    text: ['Half the neighborhood is between the tomatoes and the cheese stalls.', 'Mahallenin yarısı domates tezgâhıyla peynirci arasında.'],
    choices: [
      { id: 'cologne', label: ['Hand out lemon cologne', 'Limon kolonyası dağıt'], points: 2, run: (c) => c.h.money(-wage(c, 40)), line: ['You poured lemon cologne into a hundred palms. The whole market smelled of your campaign.', 'Yüz avuca limon kolonyası döktün. Bütün pazar senin kampanyan gibi kokuyordu.'] },
      { id: 'bags', label: ['Carry the shopping of the elderly', 'Yaşlıların filelerini taşı'], points: 2, run: (c) => c.h.stat('health', -1), line: ['You carried bags up four flights of stairs, eleven times. Eleven households will vote for you, and their cousins.', 'On bir kez dört kat merdiven çıkıp file taşıdın. On bir hane sana oy verecek, kuzenleri de.'] },
      { id: 'shop', label: ['Just do your shopping', 'Sadece alışverişini yap'], points: 0, line: ['You bought tomatoes and went home. The tomatoes were good.', 'Domatesini alıp eve döndün. Domatesler güzeldi.'] },
    ],
  },
  {
    title: ['The grocer offers his shop window.', 'Bakkal vitrinini teklif ediyor.'],
    text: ['"Your poster, my window. Everyone passes here for bread," he says.', '"Afiş senden, vitrin benden. Ekmek almaya herkes buradan geçer," diyor.'],
    choices: [
      { id: 'barber', label: ['Ask the barber and the baker too', 'Berberle fırıncıya da sor'], points: 2, line: ['Three shop windows, three endorsements. The barber adds a free shave for undecided voters.', 'Üç vitrin, üç destek. Berber kararsız seçmenlere bedava tıraş da ekledi.'] },
      { id: 'thanks', label: ['Thank him with a box of baklava', 'Bir kutu baklavayla teşekkür et'], points: 1, run: (c) => c.h.money(-wage(c, 25)), line: ['Your poster went up between the bread and the lottery tickets. Prime position.', 'Afişin ekmekle piyango biletlerinin arasına asıldı. En görünür yer.'] },
    ],
  },
  {
    title: ['A neighbor asks for help with paperwork.', 'Bir komşu evrak işi için yardım istiyor.'],
    text: ['Her pension papers came back with a stamp missing. The current muhtar is "out".', 'Emeklilik evrakı bir mühür eksik diye geri gelmiş. Şimdiki muhtar "dışarıda".'],
    choices: [
      { id: 'help', label: ['Spend the day at the offices with her', 'Bütün günü onunla dairelerde geçir'], points: 2, run: (c) => c.h.stat('happiness', 1), line: ['You queued at three offices and got the stamp. She told the whole street by dinner.', 'Üç dairede sıra bekleyip mührü aldırdın. Akşam yemeğine kadar bütün sokağa anlatmıştı.'] },
      { id: 'advise', label: ['Tell her which office to go to', 'Hangi daireye gideceğini söyle'], points: 1, line: ['You wrote her the right office and the right window on a napkin. It worked.', 'Doğru daireyi ve doğru gişeyi bir peçeteye yazdın. İşe yaradı.'] },
    ],
  },
];

const momentChoice = (k: number): ChoiceDef => ({
  id: `m${k}`,
  label: (c) => {
    const ch = MOMENTS[Number(c.vars.m)].choices[k];
    return ch ? c.t(ch.label[0], ch.label[1]) : '—';
  },
  hidden: (c) => !MOMENTS[Number(c.vars.m)].choices[k],
  resolve: (c) => {
    const ch = MOMENTS[Number(c.vars.m)].choices[k];
    add(c, ch.points);
    ch.run?.(c);
    state(c.p).campaigned = c.s.year;
    return c.t(ch.line[0], ch.line[1]);
  },
});

const campaign: EventDef = {
  id: 'tr.muhtar_campaign',
  category: 'milestone',
  scheduled: true,
  when: (c) => inTR(c) && muhtarRunning(c.p),
  setup: (c) => {
    c.vars.m = c.rng.int(0, MOMENTS.length - 1);
  },
  title: (c) => c.t(MOMENTS[Number(c.vars.m)].title[0], MOMENTS[Number(c.vars.m)].title[1]),
  text: (c) => c.t(MOMENTS[Number(c.vars.m)].text[0], MOMENTS[Number(c.vars.m)].text[1]),
  choices: [0, 1, 2].map(momentChoice),
};

// ------------------------------------------------------------------ the vote

function count(c: Ctx, wait: boolean): string {
  const st = state(c.p);
  const win = c.rng.chance(muhtarOdds(c));
  const margin = c.rng.int(3, 140);
  delete st.election;
  st.score = 0;
  if (win) {
    st.won = c.s.year;
    c.h.achieve('tr_muhtar');
    c.h.flag('tr_muhtar');
    c.h.stat('happiness', 10);
    return wait
      ? c.t(
          `You won by ${margin} votes. The count ended after midnight, and the whole schoolyard clapped. Your first act as muhtar: a new bench under the old plane tree.`,
          `${margin} oy farkla kazandın! Sayım gece yarısını geçti, bütün okul bahçesi alkışladı. Muhtar olarak ilk icraatın çınarın altına yeni bir bank koydurmak oldu.`,
        )
      : c.t(
          `You won by ${margin} votes. The neighbors rang your doorbell with the news before the TV had it. You were handed the seal the next morning.`,
          `${margin} oy farkla kazandın! Komşular haberi televizyondan önce kapını çalarak verdi. Mührü ertesi sabah teslim aldın.`,
        );
  }
  st.lost = (st.lost ?? 0) + 1;
  c.h.stat('happiness', -4);
  return c.t(
    `You lost by ${margin} votes. Your rival sent a box of lokum and a seat on his council. There is another election in five years.`,
    `${margin} oy farkla kaybettin. Rakibin bir kutu lokumla ihtiyar heyetinde bir koltuk teklif etti. Beş yıl sonra yine sandık var.`,
  );
}

const election: EventDef = {
  id: 'tr.muhtar_election',
  category: 'milestone',
  scheduled: true,
  when: (c) => inTR(c) && muhtarRunning(c.p),
  title: (c) => c.t('Election day: the muhtar vote.', 'Seçim günü: muhtarlık için sandık başı.'),
  text: (c) =>
    c.t(
      'The ballot boxes are in the school gym. Your rival is handing out tea at the gate.',
      'Sandıklar okulun spor salonuna kuruldu. Rakibin kapıda herkese çay dağıtıyor.',
    ),
  choices: [
    { id: 'wait', label: (c) => c.t('Wait for the count in the schoolyard', 'Sayımı okul bahçesinde bekle'), tone: 'big', resolve: (c) => count(c, true) },
    { id: 'home', label: (c) => c.t('Brew tea at home and wait for the news', 'Evde çay demleyip haberi bekle'), tone: 'big', resolve: (c) => count(c, false) },
  ],
};

export const muhtarEvents: EventDef[] = [announce, campaign, election];

// ------------------------------------------------------------------ the activity

/** A local with a clean record (someone who moved to Türkiye from abroad is not on the neighborhood's voter roll). */
const canRun = (c: Ctx) => inTR(c) && !emig(c) && c.p.jailYears === 0 && c.p.criminalRecord === 0 && !isMuhtar(c.p);

export const muhtarActivities: ActivityDef[] = [
  {
    id: 'tr_muhtar_run',
    label: (c) => (muhtarRunning(c.p) ? c.t('Campaign for muhtar', 'Muhtarlık kampanyası yap') : c.t('Run for muhtar', 'Muhtarlığa aday ol')),
    description: (c) =>
      muhtarRunning(c.p)
        ? c.s.year >= (peek(c.p)?.election ?? 0)
          ? c.t('The vote is this year', 'Sandık bu yıl kuruluyor')
          : peek(c.p)?.campaigned === c.s.year
            ? c.t('Enough campaigning for this year', 'Bu yıllık kampanya yeter')
            : c.t(`Win votes before the ${yearOf(c)} election`, `${yearOf(c)} seçiminden önce oy topla`)
        : c.t('Lead your neighborhood', 'Mahallenin muhtarı ol'),
    group: 'Career',
    minAge: MUHTAR_MIN_AGE,
    maxAge: MUHTAR_MAX_AGE,
    jailOk: false,
    hideWhenUnavailable: true,
    available: (c) => {
      if (!canRun(c)) return false;
      const st = peek(c.p);
      if (st?.election === undefined) return true;
      return c.s.year < st.election && st.campaigned !== c.s.year;
    },
    run: (c) => ({ event: muhtarRunning(c.p) ? 'tr.muhtar_campaign' : 'tr.muhtar_announce' }),
  },
];
