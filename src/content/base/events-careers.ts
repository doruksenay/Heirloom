import type { Ctx, EventDef } from '../types';
import { loc, wage } from './util';
import { promoteAnyway } from '../../engine/context';
import { byCountry, cityOf, coastal, inTr, type ByCountry } from './events-flavour';
import { canEnlist, canTryOut, isJob } from './activities-careers';
import { jobBoardEvents } from './job-board';
import { careerEventsR4 } from './events-careers-r4';
import { majorEvents } from './events-careers-majors';
import { careerEventsR5 } from './events-careers-r5';

// v0.7 careers: job-specific events. Every event is guarded by the player's current job.

const on = (id: string) => (c: Ctx) => isJob(c, id);

/** Try a promotion; returns the sentence that announces it, or '' at the top of the ladder. */
function promo(c: Ctx): string {
  if (!c.h.promote()) return '';
  c.h.stat('happiness', 4);
  return c.t(` You were promoted to ${c.h.jobTitle()}.`, ` Terfi geldi: artık ${c.h.jobTitle()} oldun.`);
}

/** Lose the job. */
function fire(c: Ctx): void {
  c.h.setJob(null);
  c.h.stat('happiness', -8);
}

const CLUBS = ['Atlas FC', 'Porto Verde', 'Northbridge United', 'Kartal SK', 'Real Montaña'];
/** Clubs of a Turkish league for lives in Türkiye (same length as CLUBS: one index, picked once). */
const CLUBS_TR = ['Atlas FK', 'Poyraz SK', 'Kuzeyspor', 'Kartal SK', 'Ege Yıldızı'];
/** The club in vars.ci for this country (older saves kept the name in vars.club). */
const club = (c: Ctx) => (c.vars.ci === undefined ? String(c.vars.club) : (c.p.countryId === 'tr' ? CLUBS_TR : CLUBS)[Number(c.vars.ci)] ?? CLUBS[0]);

/** What a patrol partner is eating: [English, Turkish genitive-possessive "…in yarısında"]. */
const PATROL_SNACK: ByCountry<[string, string]> = {
  tr: ['simit', 'simidinin'],
  us: ['donut', 'donutunun'],
  uk: ['sausage roll', 'sosisli böreğinin'],
  de: ['pretzel', 'pretzelinin'],
  br: ['cheese bread', 'peynirli ekmeğinin'],
  other: ['sandwich', 'sandviçinin'],
};

/** Fishing words for the player's city: the sea and its fish on the coast, a lake inland. */
function waters(c: Ctx) {
  if (!coastal(c))
    return {
      run: c.t('The fish are biting on the lake, but a storm is coming.', 'Gölde balık bol ama fırtına geliyor.'),
      boats: c.t('Every boat on the lake is waiting to see who goes out first.', 'Göldeki bütün tekneler önce kimin açılacağını bekliyor.'),
      port: c.t('jetty', 'iskele'),
      portIn: c.t('Stay ashore and mend nets', 'Kıyıda kal, ağ ör'),
      big: c.t('a catfish as big as a sofa', 'kanepe büyüklüğünde bir yayın balığını'),
      back: c.t('Let it go', 'Suya geri bırak'),
      backLine: c.t('You let it go. Nobody at the jetty believes your story, and that is fine.', 'Onu suya geri bıraktın. İskelede kimse hikâyene inanmıyor; olsun.'),
    };
  const [fish, fishTr] = byCountry<[string, string]>(c, {
    tr: ['İzmir', 'Antalya'].includes(c.p.city) ? ['sardines', 'Sardalya'] : ['anchovies', 'Hamsi'],
    de: ['herring', 'Ringa'],
    uk: ['mackerel', 'Uskumru'],
    br: ['sardines', 'Sardalya'],
    other: ['mackerel', 'Uskumru'],
  });
  return {
    run: c.t(`The ${fish} are running, but a storm is coming.`, `${fishTr} geldi ama fırtına da geliyor.`),
    boats: c.t('Every boat in the harbor is waiting to see who goes out first.', 'Limandaki bütün tekneler önce kimin açılacağını bekliyor.'),
    port: c.t('harbor', 'liman'),
    portIn: c.t('Stay in port and mend nets', 'Limanda kal, ağ ör'),
    big: c.t('a bluefin tuna as big as a sofa', 'kanepe büyüklüğünde bir orkinosu'),
    back: c.t('Let it go', 'Denize geri bırak'),
    backLine: c.t('You let it go. Nobody at the harbor believes your story, and that is fine.', 'Onu denize geri bıraktın. Limanda kimse hikâyene inanmıyor; olsun.'),
  };
}

export const careerEvents: EventDef[] = [
  // ================================================================ getting in
  {
    id: 'base.job_scout',
    category: 'work',
    minAge: 16,
    maxAge: 21,
    once: true,
    weight: 7,
    when: (c) => canTryOut(c) && !c.p.retired,
    title: (c) => c.t('A scout watched your Sunday match.', 'Pazar maçında seni bir futbol gözlemcisi izledi.'),
    text: (c) =>
      c.t(
        'He has a clipboard, a club scarf and an offer from the youth academy.',
        'Elinde bir dosya, boynunda kulüp atkısı, cebinde de altyapı teklifi var.',
      ),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign with the academy', 'Altyapıya imza at'),
        badge: 'Big change',
        resolve: (c) => {
          c.h.setJob('athlete');
          c.h.stat('happiness', 8);
          return c.t(
            `You signed! Your new title: ${c.h.jobTitle()}. The neighborhood pitch is very proud.`,
            `İmzayı attın! Artık ${c.h.jobTitle()} olarak forma giyiyorsun. Mahallenin halı sahası seninle gurur duyuyor.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'trial',
        label: (c) => c.t('Ask for a first-team trial', 'Doğrudan A takımda deneme iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.setJob('athlete');
            promoteAnyway(c); // signed straight into the first team
            c.h.stat('happiness', 10);
            return c.t(
              `You scored twice in the trial and went straight in. Your new title: ${c.h.jobTitle()}.`,
              `Denemede iki gol attın ve doğrudan ${c.h.jobTitle()} olarak kadroya girdin.`,
            );
          }
          c.h.stat('happiness', -5);
          return c.t('The coach laughed, then left. No contract.', 'Hoca güldü, sonra çekip gitti. Sözleşme yok.');
        },
      },
      {
        id: 'study',
        label: (c) => c.t('Focus on your studies', 'Derslerine odaklan'),
        resolve: (c) => {
          c.h.stat('smarts', 3);
          c.h.stat('happiness', -3);
          return c.t('You said no. Somewhere, a commentator sighed.', 'Hayır dedin. Bir yerlerde bir spiker derin bir iç çekti.');
        },
      },
    ],
  },
  {
    id: 'base.job_recruiter',
    category: 'work',
    minAge: 18,
    maxAge: 26,
    once: true,
    weight: 6,
    when: (c) => canEnlist(c) && !c.p.jobId && !c.p.retired,
    title: (c) =>
      c.t('At the army recruitment stand, a sergeant looks you up and down.', 'Ordunun tanıtım standındaki astsubay seni tepeden tırnağa süzüyor.'),
    text: (c) =>
      c.t('Steady pay, free boots and a haircut you did not ask for.', 'Düzenli maaş, bedava postal ve senin istemediğin bir saç tıraşı.'),
    choices: [
      {
        id: 'enlist',
        label: (c) => c.t('Enlist as a soldier', 'Asker olarak orduya katıl'),
        requires: (c) => c.p.stats.health >= 40,
        requiresLabel: 'Needs Health 40+',
        resolve: (c) => {
          c.h.setJob('soldier');
          c.h.stat('health', 3);
          return c.t(
            `You signed up. Basic training was cold, loud and early. Your rank: ${c.h.jobTitle()}.`,
            `İmzayı attın. Temel eğitim soğuk, gürültülü ve çok erkendi. ${c.h.jobTitle() === 'Sözleşmeli Er' ? 'Artık Sözleşmeli Ersin.' : `Artık ${c.h.jobTitle()} olarak görevdesin.`}`,
          );
        },
        tone: 'big',
      },
      {
        id: 'officer',
        label: (c) => c.t('Apply for officer training', 'Subay eğitimine başvur'),
        requires: (c) => c.p.education === 'university' && c.p.stats.health >= 40 && c.p.stats.smarts >= 50,
        requiresLabel: 'No opening',
        resolve: (c) => {
          c.h.setJob('officer');
          c.h.stat('smarts', 2);
          return c.t(
            `You passed officer training and pinned on your first rank: ${c.h.jobTitle()}.`,
            `Subay eğitimini tamamladın ve ilk rütbeni taktın: ${c.h.jobTitle()}.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'leave',
        label: (c) => c.t('Thank them and leave', 'Teşekkür et ve çık'),
        resolve: (c) =>
          c.t('You took a brochure. It has a very dramatic eagle on it.', 'Bir broşür aldın. Üstünde çok dramatik bir kartal var.'),
      },
    ],
  },

  // ================================================================ athlete
  {
    id: 'base.job_athlete_derby',
    category: 'work',
    minAge: 16,
    maxAge: 40,
    weight: 18,
    cooldown: 3,
    when: on('athlete'),
    title: (c) => c.t('It is derby day.', 'Bugün derbi günü.'),
    text: (c) =>
      c.t(
        'Your ankle is taped, the stands are full and it is 1–1 in the 89th minute.',
        'Bileğin bantlı, tribünler tıklım tıklım, 89. dakikada skor 1-1.',
      ),
    choices: [
      {
        id: 'shoot',
        label: (c) => c.t('Take the long shot', 'Uzaktan vur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.health / 400)) {
            c.h.money(wage(c, 5000));
            c.h.stat('happiness', 10);
            return (
              c.t(
                'Top corner. The stadium shook and your name trended for a week.',
                'Doksana taktın. Stadyum sallandı, adın bir hafta gündemden düşmedi.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -6);
          return c.t(
            'The ball hit the corner flag. The away fans still sing about it.',
            'Top köşe gönderine çarptı. Deplasman tribünü hâlâ bunun şarkısını söylüyor.',
          );
        },
        tone: 'big',
      },
      {
        id: 'pass',
        label: (c) => c.t('Pass to the striker', 'Golcüye pas ver'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('He scored. You got the assist, he got the shirt sales.', 'Golü o attı. Asist senin, forma satışları onun.');
        },
      },
      {
        id: 'dive',
        label: (c) => c.t('Go down in the box', 'Ceza sahasında kendini yere at'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', 4);
            return c.t(
              'Penalty! It went in. The replay is not something you will be watching.',
              'Penaltı! Gol oldu. Tekrar görüntülerini izlemeyi pek düşünmüyorsun.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'The referee checked the replay for four minutes. Yellow card for diving.',
            'Hakem dört dakika boyunca ekrana baktı. Kendini attığın için sarı kart gördün.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_athlete_transfer',
    category: 'work',
    minAge: 18,
    maxAge: 33,
    weight: 14,
    cooldown: 5,
    when: (c) => isJob(c, 'athlete') && c.p.jobLevel >= 1,
    setup: (c) => {
      c.vars.ci = c.rng.int(0, CLUBS.length - 1);
      c.vars.fee = wage(c, c.rng.int(15, 60) * 1000);
    },
    title: (c) => c.t(`${club(c)} wants to sign you.`, `${club(c)} seni transfer etmek istiyor.`),
    text: (c) =>
      c.t(
        `Their offer comes with a signing bonus of ${c.h.fmt(Number(c.vars.fee))} and a very shiny pen.`,
        `Teklifte ${c.h.fmt(Number(c.vars.fee))} imza parası ve pırıl pırıl bir dolma kalem var.`,
      ),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign the contract', 'Sözleşmeyi imzala'),
        badge: 'Big money',
        resolve: (c) => {
          c.h.money(Number(c.vars.fee));
          c.h.stat('happiness', 5);
          return (
            c.t(
              `You joined ${club(c)}. The bonus cleared on Monday.`,
              `${club(c)} ile anlaştın. İmza parası pazartesi hesabına yattı.`,
            ) + promo(c)
          );
        },
        tone: 'good',
      },
      {
        id: 'loyal',
        label: (c) => c.t('Stay loyal to your club', 'Kulübüne sadık kal'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'The fans made a giant banner of your face. It is not a good likeness.',
            'Taraftar yüzünün olduğu dev bir pankart astı. Pek benzememişsin.',
          );
        },
      },
      {
        id: 'agent',
        label: (c) => c.t('Let your agent squeeze them', 'Menajerine pazarlık yaptır'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const fee = Math.round(Number(c.vars.fee) * 1.6);
            c.h.money(fee);
            c.h.stat('happiness', 7);
            return (
              c.t(
                `Your agent got you ${c.h.fmt(fee)}. He also bought a boat.`,
                `Menajerin sana ${c.h.fmt(fee)} kopardı. Kendine de bir tekne aldı.`,
              ) + promo(c)
            );
          }
          c.h.money(-wage(c, 1000));
          c.h.stat('happiness', -5);
          return c.t('The deal collapsed. Your agent still sent an invoice.', 'Anlaşma suya düştü. Menajerin yine de faturasını gönderdi.');
        },
      },
    ],
  },
  {
    id: 'base.job_athlete_national',
    category: 'work',
    minAge: 19,
    maxAge: 34,
    once: true,
    weight: 25,
    when: (c) => isJob(c, 'athlete') && c.p.jobLevel >= 2,
    title: (c) => c.t('The national team is calling.', 'Milli takımdan davet var.'),
    text: (c) => c.t('An unknown number. It is the national coach.', 'Telefonda tanımadığın bir numara. Arayan milli takımın hocası.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Answer the call', 'Davete koş'),
        resolve: (c) => {
          c.h.achieve('national_team');
          c.h.stat('happiness', 12);
          return (
            c.t(
              'You sang the anthem with your eyes closed. Your whole street watched.',
              'Marşı gözlerin kapalı okudun. Bütün sokak seni izledi.',
            ) + promo(c)
          );
        },
        tone: 'big',
      },
      {
        id: 'rest',
        label: (c) => c.t('Decline to rest your knees', 'Dizlerini dinlendirmek için reddet'),
        resolve: (c) => {
          c.h.stat('health', 5);
          c.h.stat('happiness', -3);
          return c.t(
            'You said no. The sports pages called you a traitor for a week.',
            'Hayır dedin. Spor sayfaları bir hafta boyunca sana hain dedi.',
          );
        },
      },
    ],
  },

  // ================================================================ coach
  {
    id: 'base.job_coach_offer',
    category: 'work',
    minAge: 24,
    maxAge: 62,
    once: true,
    weight: 60,
    when: (c) => c.h.has('ex_athlete') && c.p.jobId !== 'coach' && c.p.jobId !== 'athlete' && !c.p.retired && c.p.jailYears === 0,
    title: (c) => c.t('Your old club wants you back. On the bench.', 'Eski kulübün seni geri istiyor. Bu sefer kenarda.'),
    text: (c) =>
      c.t(
        'They need a coach for the youth teams. The pay is modest, the tracksuit is free.',
        'Altyapı takımlarına antrenör lazım. Maaş mütevazı, eşofman bedava.',
      ),
    choices: [
      {
        id: 'coach',
        label: (c) => c.t('Take the whistle', 'Düdüğü al'),
        resolve: (c) => {
          c.h.setJob('coach');
          if (c.h.has('athlete_star')) promoteAnyway(c); // a former star starts one rung up
          c.h.stat('happiness', 6);
          return c.t(
            `Your new title: ${c.h.jobTitle()}. You already yell "Spread out!" in your sleep.`,
            `Artık ${c.h.jobTitle()} oldun. Uykunda bile "Açılın!" diye bağırıyorsun.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'pundit',
        label: (c) => c.t('Become a TV pundit', 'Televizyonda yorumcu ol'),
        resolve: (c) => {
          const pay = wage(c, c.rng.int(4, 12) * 1000);
          c.h.money(pay);
          c.h.stat('happiness', 3);
          return c.t(
            `You argued about offside on live TV for a season and earned ${c.h.fmt(pay)}.`,
            `Bir sezon boyunca canlı yayında ofsayt tartıştın. Hesabına ${c.h.fmt(pay)} yattı.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Leave football behind', 'Futbolu geride bırak'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You said no. You still check the scores every Sunday.', 'Hayır dedin. Ama her pazar skorlara yine de bakıyorsun.');
        },
      },
    ],
  },
  {
    id: 'base.job_coach_star',
    category: 'work',
    minAge: 25,
    weight: 20,
    when: on('coach'),
    title: (c) => c.t('Your star player skipped training again.', 'Yıldız oyuncun yine antrenmana gelmedi.'),
    text: (c) =>
      c.t('He posted a photo from a yacht. The caption says "recovery".', 'Bir yattan fotoğraf paylaşmış. Altına "rejenerasyon" yazmış.'),
    choices: [
      {
        id: 'bench',
        label: (c) => c.t('Bench him for the big match', 'Büyük maçta yedeğe çek'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 8);
            return (
              c.t(
                'You won without him. The dressing room has never been quieter.',
                'Onsuz kazandınız. Soyunma odası hiç bu kadar sessiz olmamıştı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -6);
          if (c.rng.chance(0.3)) {
            fire(c);
            return c.t(
              'You lost 3–0. The board fired you the next morning.',
              'Maçı 3-0 kaybettiniz. Yönetim ertesi sabah seni kapının önüne koydu.',
            );
          }
          return c.t(
            'You lost 3–0. The fans chanted his name, then yours, less kindly.',
            'Maçı 3-0 kaybettiniz. Tribün önce onun adını, sonra seninkini pek de sevgiyle olmayan bir şekilde haykırdı.',
          );
        },
      },
      {
        id: 'slide',
        label: (c) => c.t('Let it slide', 'Görmezden gel'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'He scored a hat-trick and thanked "the coach who believes in me". Fine.',
            'Hat-trick yaptı ve "bana inanan hocama" teşekkür etti. Peki.',
          );
        },
      },
      {
        id: 'laps',
        label: (c) => c.t('Make him run laps with the kids', 'Ona altyapıyla tur attır'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'He ran laps with the under-12s. They lapped him twice.',
            '12 yaş altı takımıyla tur attırdın. Çocuklar onu iki kere turladı.',
          );
        },
      },
    ],
  },

  // ================================================================ artist
  {
    id: 'base.job_artist_commission',
    category: 'work',
    minAge: 16,
    weight: 20,
    when: on('artist'),
    title: (c) => c.t('A rich client wants a portrait of their dog.', 'Zengin bir müşteri köpeğinin portresini istiyor.'),
    text: (c) =>
      c.t(
        'The dog is a pug named Napoleon. They want him "on a horse, conquering".',
        'Köpek, Napolyon adında bir pug. Müşteri onu "atın üstünde, fetih yaparken" istiyor.',
      ),
    choices: [
      {
        id: 'emperor',
        label: (c) => c.t('Paint the emperor pug', 'İmparator köpeği resmet'),
        resolve: (c) => {
          const pay = wage(c, c.rng.int(2, 6) * 1000);
          c.h.money(pay);
          c.h.stat('happiness', -2);
          return c.t(
            `You were paid ${c.h.fmt(pay)}. The pug looks magnificent. You feel nothing.`,
            `Eline ${c.h.fmt(pay)} geçti. Köpek muhteşem görünüyor. Sen hiçbir şey hissetmiyorsun.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'honest',
        label: (c) => c.t('Paint the dog as it really is', 'Köpeği olduğu gibi resmet'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.money(wage(c, 4000));
            c.h.stat('happiness', 8);
            return (
              c.t(
                'The client wept. "You captured his soul." Your prices doubled.',
                'Müşteri ağladı: "Ruhunu yakalamışsın." Fiyatların ikiye katlandı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'The client said the painting "lacks horse" and refused to pay.',
            'Müşteri tabloda "at eksik" dedi ve ödemeyi reddetti.',
          );
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Turn it down', 'Reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'You turned it down. Art is not for sale. Rent, unfortunately, is.',
            'Reddettin. Sanat satılık değil. Kira ise maalesef öyle.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_artist_show',
    category: 'work',
    minAge: 18,
    weight: 14,
    cooldown: 6,
    when: on('artist'),
    title: (c) => c.t('An exhibition of your work opens tonight.', 'Bu akşam eserlerinden oluşan bir sergi açılıyor.'),
    text: (c) =>
      c.t('Cheap wine, expensive lighting and one important critic.', 'Ucuz şarap, pahalı ışıklandırma ve önemli bir eleştirmen.'),
    choices: [
      {
        id: 'explain',
        label: (c) => c.t('Explain every painting', 'Her tabloyu tek tek anlat'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', 6);
            return (
              c.t(
                'The critic wrote that you are "finally saying something".',
                'Eleştirmen, nihayet "bir şey söyleyen" bir ressam olduğunu yazdı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'The critic left during painting four. You were still on painting two.',
            'Eleştirmen dördüncü tabloda çıkıp gitti. Sen hâlâ ikinciyi anlatıyordun.',
          );
        },
      },
      {
        id: 'mystery',
        label: (c) => c.t('Stay mysterious', 'Gizemli kal'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.looks / 300)) {
            const sale = wage(c, c.rng.int(3, 15) * 1000);
            c.h.money(sale);
            c.h.stat('happiness', 8);
            return c.t(
              `"Untitled No. 7" sold for ${c.h.fmt(sale)}. Nobody knows what it is. Including you.`,
              `"İsimsiz 7" tam ${c.h.fmt(sale)} karşılığında satıldı. Ne olduğunu kimse bilmiyor. Sen de.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'Everyone thought you were the waiter. Two people asked you for ice.',
            'Herkes seni garson sandı. İki kişi senden buz istedi.',
          );
        },
      },
      {
        id: 'wine',
        label: (c) => c.t('Drink the cheap wine', 'Ucuz şaraba yüklen'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', 5);
          return c.t(
            'You remember nothing. The reviews say you were "electric".',
            'Açılıştan hiçbir şey hatırlamıyorsun. Eleştirilerde "elektrik gibiydi" yazıyor.',
          );
        },
      },
    ],
  },

  // ================================================================ military
  {
    id: 'base.job_soldier_watch',
    category: 'work',
    minAge: 18,
    weight: 20,
    when: on('soldier'),
    title: (c) => c.t('Something is moving near the post at 3 a.m.', 'Gece üçte karakolun yakınında bir şey kıpırdıyor.'),
    text: (c) =>
      c.t('It is your watch. The radio crackles. The bushes rustle again.', 'Nöbet sende. Telsiz cızırdıyor. Çalılar yine hışırdıyor.'),
    choices: [
      {
        id: 'halt',
        label: (c) => c.t('Shout "Halt! Who goes there?"', '"Dur! Kimdir o?" diye bağır'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'A goat stepped out, unimpressed. The unit adopted it as a mascot.',
            'Çalıdan pek de etkilenmemiş bir keçi çıktı. Bölük onu maskot ilan etti.',
          );
        },
      },
      {
        id: 'radio',
        label: (c) => c.t('Report it by the book', 'Usulüne uygun telsizle bildir'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          const up = c.rng.chance(0.15) ? promo(c) : '';
          return (
            c.t(
              'Textbook report. It was a goat. The commander praised your procedure and named the goat after you.',
              'Kusursuz rapor verdin. Bir keçiymiş. Komutan prosedürünü övdü, keçiye de senin adını verdi.',
            ) + up
          );
        },
      },
      {
        id: 'wake',
        label: (c) => c.t('Wake your commander', 'Komutanını uyandır'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'Your commander got up, saw the goat and gave you extra watch for a week.',
            'Komutanın kalktı, keçiyi gördü ve sana bir hafta fazladan nöbet yazdı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_military_flood',
    category: 'work',
    minAge: 18,
    weight: 12,
    cooldown: 6,
    when: (c) => isJob(c, 'soldier') || isJob(c, 'officer'),
    title: (c) => c.t('Your unit is sent to help after a flood.', 'Birliğin sel bölgesine yardıma gönderildi.'),
    text: (c) =>
      c.t(
        'Roads are gone, phones are down and a village is waiting for supplies.',
        'Yollar çökmüş, telefonlar çekmiyor ve bir köy erzak bekliyor.',
      ),
    choices: [
      {
        id: 'truck',
        label: (c) => c.t('Drive the supply truck through', 'Erzak kamyonunu sudan geçir'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -3);
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 8);
            return (
              c.t(
                'You got the truck through. The village grandmothers fed your whole unit for three days.',
                'Kamyonu karşıya geçirdin. Köyün nineleri bütün birliği üç gün boyunca doyurdu.',
              ) + promo(c)
            );
          }
          c.h.stat('health', -4);
          c.h.stat('happiness', 3);
          return c.t(
            'The truck got stuck halfway. You carried the flour on your back, sack by sack.',
            'Kamyon yarı yolda saplandı. Unu sırtında, çuval çuval taşıdın.',
          );
        },
      },
      {
        id: 'kitchen',
        label: (c) => c.t('Run the field kitchen', 'Sahra mutfağını yönet'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'You made lentil soup for 400 people. Nobody asked for the recipe, everyone asked for seconds.',
            'Dört yüz kişiye mercimek çorbası yaptın. Tarifini soran olmadı ama herkes ikinci tabak istedi.',
          );
        },
      },
      {
        id: 'mast',
        label: (c) => c.t('Fix the village radio mast', 'Köyün telsiz direğini onar'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return (
            c.t(
              'The first call through was a grandson abroad, asking if his grandma was okay. She was.',
              'İlk arayan, yurt dışından babaannesini merak eden bir torundu. Babaanne iyiydi.',
            ) + promo(c)
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_officer_inspection',
    category: 'work',
    minAge: 21,
    weight: 16,
    when: (c) => isJob(c, 'officer') && c.p.jobLevel < 4,
    title: (c) => c.t('A general is coming for a surprise inspection.', 'Bir general habersiz teftişe geliyor.'),
    text: (c) => c.t('You have two hours. The barracks smell of socks.', 'İki saatin var. Koğuş çorap kokuyor.'),
    choices: [
      {
        id: 'paint',
        label: (c) => c.t('Paint everything that does not move', 'Kıpırdamayan her şeyi boyat'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const up = c.rng.chance(0.25) ? promo(c) : '';
          return (
            c.t(
              'The general praised the fresh paint. Some of it was still on a private.',
              'General taze boyayı övdü. Boyanın bir kısmı hâlâ bir erin üstündeydi.',
            ) + up
          );
        },
      },
      {
        id: 'honest',
        label: (c) => c.t('Report the real problems', 'Gerçek sorunları raporla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return (
              c.t(
                'The general liked your honesty and had the boiler fixed by Friday.',
                'General dürüstlüğünü beğendi ve kazanı cumaya kadar tamir ettirdi.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -8);
          return c.t(
            'The general did not like surprises during a surprise inspection. You were posted somewhere very remote.',
            'General, habersiz teftişte sürpriz sevmiyormuş. Çok uzak bir birliğe tayinin çıktı.',
          );
        },
      },
      {
        id: 'hide',
        label: (c) => c.t('Hide the broken boiler', 'Bozuk kazanı sakla'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', -2);
          return c.t(
            'The general never saw the boiler. Your unit spent the winter in coats.',
            'General kazanı hiç görmedi. Birlik bütün kışı montlarla geçirdi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_officer_college',
    category: 'work',
    minAge: 26,
    once: true,
    weight: 14,
    when: (c) => isJob(c, 'officer') && c.p.jobLevel >= 1 && c.p.jobLevel <= 3,
    title: (c) => c.t('You are offered a place at the war college.', 'Harp Akademisi için seçildin.'),
    text: (c) => c.t('Two years of maps, strategy and very long lectures.', 'İki yıl boyunca haritalar, strateji ve çok uzun dersler.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Accept', 'Kabul et'),
        requires: (c) => c.p.stats.smarts >= 65,
        requiresLabel: 'Needs Smarts 65+',
        resolve: (c) => {
          c.h.stat('smarts', 4);
          return c.t('You graduated near the top of your class.', 'Sınıfının ilk sıralarında mezun oldun.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay with your unit', 'Birliğinde kal'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            `You stayed with your soldiers. They surprised you with canteen ${inTr(c) ? 'baklava' : 'cake'}.`,
            `Askerlerinin yanında kaldın. Kantinden aldıkları ${inTr(c) ? 'baklavayla' : 'pastayla'} sana sürpriz yaptılar.`,
          );
        },
      },
    ],
  },

  // ================================================================ pilot
  {
    id: 'base.job_pilot_birds',
    category: 'work',
    minAge: 22,
    weight: 20,
    when: on('pilot'),
    title: (c) => c.t('Birds hit your engine on takeoff.', 'Kalkışta motora kuş sürüsü çarptı.'),
    text: (c) =>
      c.t(
        '180 passengers, one coughing engine and a tower asking for your intentions.',
        '180 yolcu, öksüren bir motor ve ne yapmak istediğini soran bir kule.',
      ),
    choices: [
      {
        id: 'return',
        label: (c) => c.t('Return to the airport', 'Havalimanına geri dön'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 5);
          const up = c.rng.chance(0.25) ? promo(c) : '';
          return (
            c.t(
              'You landed smoothly on one engine. The passengers clapped, for once with good reason.',
              'Tek motorla yumuşak bir iniş yaptın. Yolcular alkışladı; bu sefer haklı olarak.',
            ) + up
          );
        },
        tone: 'good',
      },
      {
        id: 'continue',
        label: (c) => c.t('Continue to the destination', 'Varış noktasına devam et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(wage(c, 2000));
            return c.t(
              'You arrived on time. The airline sent a bonus and a warning letter in the same envelope.',
              'Zamanında indin. Havayolu aynı zarfın içinde hem prim hem de uyarı yazısı gönderdi.',
            );
          }
          c.h.money(-wage(c, 8000));
          c.h.stat('happiness', -8);
          return c.t(
            'An inspector reviewed the flight. You were grounded for three months without pay.',
            'Uçuşu bir müfettiş inceledi. Üç ay maaşsız uçuştan men edildin.',
          );
        },
      },
      {
        id: 'charm',
        label: (c) => c.t('Return, with a charming announcement', 'Geri dön ve tatlı bir anons yap'),
        requires: (c) => c.p.stats.smarts >= 75,
        requiresLabel: 'Needs Smarts 75+',
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return (
            c.t(
              'Your announcement went viral: "Folks, we will be landing a little early. The birds had other plans."',
              'Anonsun viral oldu: "Sayın yolcularımız, kuşların başka planları olduğu için biraz erken iniyoruz."',
            ) + promo(c)
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_pilot_proposal',
    category: 'work',
    minAge: 22,
    weight: 16,
    when: on('pilot'),
    title: (c) => c.t('A passenger asks you to announce a marriage proposal.', 'Bir yolcu senden evlenme teklifini anons etmeni istiyor.'),
    text: (c) =>
      c.t(
        'He has the ring. She is in seat 23C. You are at 35,000 feet.',
        'Yüzük hazır. Kız 23C numaralı koltukta. Sen de 11 kilometre yükseklikte uçağı uçuruyorsun.',
      ),
    choices: [
      {
        id: 'announce',
        label: (c) => c.t('Make the announcement', 'Anonsu yap'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t(
            'She said yes. The whole cabin cheered and the trolley ran out of juice.',
            'Kız evet dedi. Bütün kabin alkışladı, içecek arabasında meyve suyu kalmadı.',
          );
        },
        tone: 'good',
      },
      {
        id: 'rules',
        label: (c) => c.t('Rules are rules', 'Kural kuraldır'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'You refused. He proposed anyway, during the safety demonstration.',
            'Reddettin. Adam yine de, emniyet gösterimi sırasında diz çöktü.',
          );
        },
      },
      {
        id: 'ground',
        label: (c) => c.t('Tell them to wait until landing', 'İnişi beklemelerini söyle'),
        resolve: (c) =>
          c.t(
            'He proposed at baggage claim, between two suitcases. Still counts.',
            'Adam bagaj bandında, iki valizin arasında diz çöktü. Yine de sayılır.',
          ),
      },
    ],
  },

  // ================================================================ firefighter
  {
    id: 'base.job_firefighter_cat',
    category: 'work',
    minAge: 18,
    weight: 20,
    when: on('firefighter'),
    title: (c) => c.t('A cat is stuck at the top of a very tall tree.', 'Bir kedi çok yüksek bir ağacın tepesinde mahsur kaldı.'),
    text: (c) =>
      c.t(
        'Half the neighborhood is filming. The cat looks calm. The owner does not.',
        'Mahallenin yarısı video çekiyor. Kedi sakin. Sahibi hiç değil.',
      ),
    choices: [
      {
        id: 'climb',
        label: (c) => c.t('Climb the ladder yourself', 'Merdivene kendin tırman'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 5);
            c.h.stat('looks', -1);
            return c.t(
              'You brought the cat down. It scratched you, then purred. Classic.',
              'Kediyi indirdin. Önce seni tırmaladı, sonra mırladı. Klasik.',
            );
          }
          c.h.stat('happiness', -2);
          return c.t(
            'The cat jumped down the second you reached the top. You stayed up there a while.',
            'Tam tepeye vardığında kedi kendi kendine aşağı atladı. Sen bir süre orada kaldın.',
          );
        },
      },
      {
        id: 'tuna',
        label: (c) => c.t('Wait it out with a tin of tuna', 'Bir kutu ton balığıyla bekle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'Twenty minutes and one tin of tuna later, the cat came down and left without a thank-you.',
            'Yirmi dakika ve bir kutu ton balığı sonra kedi indi ve teşekkür etmeden yürüyüp gitti.',
          );
        },
      },
      {
        id: 'rookie',
        label: (c) => c.t('Let the rookie do it', 'İşi çaylağa bırak'),
        resolve: (c) =>
          c.t('The rookie got the cat and the applause. You got the paperwork.', 'Kediyi de alkışı da çaylak aldı. Sana evrak işi kaldı.'),
      },
    ],
  },
  {
    id: 'base.job_firefighter_blaze',
    category: 'work',
    minAge: 18,
    weight: 14,
    cooldown: 5,
    when: on('firefighter'),
    title: (c) =>
      c.t(
        'A warehouse is on fire and the owner says his dog is inside.',
        'Bir depo yanıyor ve sahibi köpeğinin içeride olduğunu söylüyor.',
      ),
    text: (c) =>
      c.t('The smoke is black. Protocol says wait for the second truck.', 'Duman simsiyah. Talimata göre ikinci aracı beklemen gerekiyor.'),
    choices: [
      {
        id: 'in',
        label: (c) => c.t('Go in now', 'Hemen içeri gir'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -5);
          if (c.rng.chance(0.6 + c.p.stats.health / 500)) {
            c.h.achieve('hero');
            c.h.stat('happiness', 10);
            return (
              c.t(
                'You came out with a very sooty, very happy dog. The photo made the front page.',
                'İsten kapkara olmuş, çok mutlu bir köpekle çıktın. Fotoğrafınız gazetelere manşet oldu.',
              ) + promo(c)
            );
          }
          c.h.stat('health', -6);
          c.h.stat('happiness', -2);
          return c.t(
            'The roof groaned and you had to back out. The dog had already escaped through a window.',
            'Çatı inleyince geri çekilmek zorunda kaldın. Köpek zaten bir pencereden kaçmıştı.',
          );
        },
        tone: 'big',
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait for backup', 'Takviyeyi bekle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'Backup came in four minutes. The dog trotted out on its own, smelling of smoke and pride.',
            'Takviye dört dakikada geldi. Köpek kendi kendine, duman ve gurur kokarak dışarı çıktı.',
          );
        },
      },
      {
        id: 'wall',
        label: (c) => c.t('Cut in through the side wall', 'Yan duvardan delik aç'),
        requires: (c) => c.p.stats.smarts >= 55,
        requiresLabel: 'Needs Smarts 55+',
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return (
            c.t(
              'You found the safest way in and out. Your plan is now taught in training.',
              'En güvenli giriş-çıkış yolunu buldun. Planın artık eğitimlerde anlatılıyor.',
            ) + promo(c)
          );
        },
        tone: 'good',
      },
    ],
  },

  // ================================================================ farmer
  {
    id: 'base.job_farmer_hail',
    category: 'work',
    minAge: 16,
    weight: 20,
    when: on('farmer'),
    title: (c) => c.t('Hail is forecast a week before harvest.', 'Hasattan bir hafta önce dolu uyarısı var.'),
    text: (c) =>
      c.t(
        'The crop is almost ready. The sky is turning a color you do not like.',
        'Ürün neredeyse hazır. Gökyüzü hiç sevmediğin bir renge dönüyor.',
      ),
    choices: [
      {
        id: 'early',
        label: (c) => c.t('Harvest early', 'Erken hasat yap'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 1500));
          return c.t('You harvested early. A smaller crop, but it is in the barn.', 'Erken hasat yaptın. Ürün az ama ambarda.');
        },
      },
      {
        id: 'gamble',
        label: (c) => c.t('Bet on the forecast being wrong', 'Hava durumunun yanılmasına bel bağla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const gain = wage(c, c.rng.int(5, 12) * 1000);
            c.h.money(gain);
            c.h.stat('happiness', 7);
            return c.t(
              `The hail went round your valley. Best harvest in years: ${c.h.fmt(gain)}.`,
              `Dolu vadinin etrafından dolandı. Yılların en bereketli hasadı; kazancın ${c.h.fmt(gain)}.`,
            );
          }
          const loss = wage(c, c.rng.int(3, 7) * 1000);
          c.h.money(-loss);
          c.h.stat('happiness', -8);
          return c.t(
            'The hail came at 4 a.m. You stood in the field in your slippers.',
            'Dolu sabaha karşı dörtte bastırdı. Terliklerinle tarlanın ortasında kaldın.',
          );
        },
      },
      {
        id: 'insure',
        label: (c) => c.t('Buy crop insurance', 'Ürününü sigortalat'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          return c.t(
            'You insured the crop. The hail never came. Somewhere, an insurance agent smiled.',
            'Ürünü sigortalattın. Dolu hiç gelmedi. Bir yerlerde bir sigortacı gülümsedi.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_farmer_market',
    category: 'work',
    minAge: 16,
    weight: 18,
    when: on('farmer'),
    title: (c) => c.t('A supermarket chain wants your whole crop.', 'Bir market zinciri bütün ürününü almak istiyor.'),
    text: (c) => c.t('The price is low, but they will take every last tomato.', 'Fiyat düşük ama son domatesine kadar hepsini alacaklar.'),
    choices: [
      {
        id: 'deal',
        label: (c) => c.t('Sign the deal', 'Anlaşmayı imzala'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 3000));
          c.h.stat('happiness', -2);
          return c.t(
            'They paid on time and complained about the shape of your cucumbers.',
            'Paranı zamanında ödediler, salatalıklarının şekline de laf ettiler.',
          );
        },
      },
      {
        id: 'bazaar',
        label: (c) => c.t('Sell at the village market', 'Pazarda kendin sat'),
        resolve: (c) => {
          const gain = wage(c, c.rng.int(2, 6) * 1000);
          c.h.money(gain);
          c.h.stat('happiness', 5);
          return c.t(
            `You sold everything at the Sunday market and came home with ${c.h.fmt(gain)} and a sack of gossip.`,
            `Pazarda tezgâh açtın; eve ${c.h.fmt(gain)} ve bir çuval dedikoduyla döndün.`,
          );
        },
      },
      {
        id: 'organic',
        label: (c) => c.t('Call it organic and triple the price', 'Organik etiketi yapıştır, fiyatı üçe katla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 400)) {
            c.h.money(wage(c, 8000));
            c.h.stat('happiness', 6);
            return (
              c.t(
                'City folk paid triple and posted photos of your carrots.',
                'Şehirliler üç katını ödedi ve havuçlarının fotoğrafını paylaştı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'Nobody bought the "artisanal" potatoes. You ate them all winter.',
            '"Butik" patatesleri kimse almadı. Bütün kış patates yedin.',
          );
        },
      },
    ],
  },

  // ================================================================ fisher
  {
    id: 'base.job_fisher_storm',
    category: 'work',
    minAge: 16,
    weight: 20,
    when: on('fisher'),
    title: (c) => waters(c).run,
    text: (c) => waters(c).boats,
    choices: [
      {
        id: 'out',
        label: (c) => c.t('Head out before it hits', 'Fırtına vurmadan açıl'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            const gain = wage(c, c.rng.int(4, 10) * 1000);
            c.h.money(gain);
            c.h.stat('happiness', 6);
            return c.t(
              `You came back with the nets bursting: ${c.h.fmt(gain)}. The whole ${waters(c).port} bought you tea.`,
              `Ağlar patlayacak kadar dolu döndün; kazancın ${c.h.fmt(gain)}. Bütün ${waters(c).port} sana çay ısmarladı.`,
            );
          }
          c.h.stat('health', -8);
          c.h.money(-wage(c, 2000));
          return c.t(
            'The storm caught you halfway. You lost a net and most of your breakfast.',
            'Fırtına seni yarı yolda yakaladı. Bir ağını ve kahvaltının çoğunu kaybettin.',
          );
        },
        tone: 'big',
      },
      {
        id: 'mend',
        label: (c) => waters(c).portIn,
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You mended nets and listened to the old captains lie about fish they once caught.',
            'Ağ örerken yaşlı reislerin bir zamanlar tuttukları balıklarla ilgili yalanlarını dinledin.',
          );
        },
      },
      {
        id: 'rent',
        label: (c) => c.t('Rent your spot to a braver boat', 'Yerini cesur bir tekneye kirala'),
        resolve: (c) => {
          c.h.money(wage(c, 800));
          return c.t(
            'A young crew paid to use your spot. They came back soaked and rich.',
            'Genç bir tayfa yerini kullanmak için sana para verdi. Sırılsıklam ama zengin döndüler.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_fisher_giant',
    category: 'work',
    minAge: 16,
    weight: 12,
    cooldown: 6,
    when: on('fisher'),
    title: (c) => c.t('Something enormous is pulling on your line.', 'Oltana devasa bir şey takıldı.'),
    text: (c) =>
      c.t(
        `After an hour of fighting, you land ${waters(c).big}.`,
        `Bir saatlik mücadeleden sonra ${waters(c).big} tekneye aldın.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell it to a fancy restaurant', 'Lüks bir restorana sat'),
        resolve: (c) => {
          const gain = wage(c, c.rng.int(3, 9) * 1000);
          c.h.money(gain);
          return c.t(
            `A chef paid ${c.h.fmt(gain)} and named a dish after you.`,
            `Bir şef ${c.h.fmt(gain)} ödedi ve bir yemeğe senin adını verdi.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'feast',
        label: (c) => c.t('Throw a feast for the neighborhood', 'Mahalleye ziyafet çek'),
        resolve: (c) => {
          c.h.stat('happiness', 8);
          return c.t(
            'You fed the whole street. Your name is now said with respect at the coffee house.',
            'Bütün sokağı doyurdun. Kahvehanede artık adın saygıyla anılıyor.',
          );
        },
      },
      {
        id: 'free',
        label: (c) => waters(c).back,
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return waters(c).backLine;
        },
      },
    ],
  },

  // ================================================================ taxi
  {
    id: 'base.job_taxi_labor',
    category: 'work',
    minAge: 18,
    weight: 20,
    when: on('taxi'),
    title: (c) => c.t('Your passenger has gone into labor.', 'Yolcunun doğum sancısı başladı.'),
    text: (c) => c.t('The hospital is twenty minutes away. The traffic says forty.', 'Hastane yirmi dakika uzakta. Trafik kırk diyor.'),
    choices: [
      {
        id: 'floor',
        label: (c) => c.t('Floor it and flash your lights', 'Gaza bas, selektör yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 8);
            return c.t(
              'You made it in twelve minutes. The baby will be named after you. Probably.',
              'On iki dakikada yetiştin. Bebeğe senin adını koyacaklarmış. Muhtemelen.',
            );
          }
          c.h.money(-wage(c, 300));
          return c.t(
            'A traffic cop stopped you, then escorted you with sirens. You still got the ticket.',
            'Trafik polisi seni durdurdu, sonra sirenle eskort etti. Cezayı yine de yedin.',
          );
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Take the back streets', 'Ara sokaklardan git'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          if (c.rng.chance(0.5))
            return c.t(
              'You knew every shortcut. Mother and baby are doing great.',
              'Bütün kestirmeleri biliyordun. Anne de bebek de turp gibi.',
            );
          return c.t(
            'The baby was born in your back seat. You charged nothing and cleaned for a week.',
            'Bebek arka koltukta doğdu. Para almadın, bir hafta da koltuk temizledin.',
          );
        },
      },
      {
        id: 'ambulance',
        label: (c) => c.t('Call an ambulance and wait', 'Ambulans çağır ve bekle'),
        badge: 'Safe',
        resolve: (c) =>
          c.t(
            'The ambulance came. The meter kept running. Nobody was happy about that.',
            'Ambulans geldi. Taksimetre işlemeye devam etti. Bundan kimse memnun değildi.',
          ),
      },
    ],
  },
  {
    id: 'base.job_taxi_bag',
    category: 'work',
    minAge: 18,
    weight: 14,
    cooldown: 8,
    when: on('taxi'),
    setup: (c) => {
      c.vars.cash = wage(c, c.rng.int(3, 12) * 1000);
    },
    title: (c) => c.t('A passenger left a bag of cash in your back seat.', 'Bir yolcu arka koltukta para dolu bir çanta unuttu.'),
    text: (c) => c.t(`You counted it twice: ${c.h.fmt(Number(c.vars.cash))}.`, `İki kere saydın: tam ${c.h.fmt(Number(c.vars.cash))}.`),
    choices: [
      {
        id: 'return',
        label: (c) => c.t('Return it to the owner', 'Sahibine geri ver'),
        resolve: (c) => {
          c.h.money(wage(c, 500));
          c.h.stat('happiness', 6);
          return c.t(
            'The owner cried, hugged you and tipped well. You were on the evening news.',
            'Sahibi ağladı, sana sarıldı ve güzel bir bahşiş verdi. Akşam haberlerine çıktın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'police',
        label: (c) => c.t('Hand it in to the police', 'Karakola teslim et'),
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.money(Number(c.vars.cash));
            return c.t(
              'Nobody claimed it for a year, so the police gave it all to you.',
              'Bir yıl boyunca kimse sahip çıkmadı, polis de parayı sana verdi.',
            );
          }
          c.h.stat('happiness', 2);
          return c.t(
            'You handed it in. A thank-you letter arrived six months later.',
            'Teslim ettin. Altı ay sonra bir teşekkür mektubu geldi.',
          );
        },
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it', 'Parayı cebe at'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.money(Number(c.vars.cash));
            c.h.stat('happiness', -2);
            return c.t(
              'You kept it. Now you check the mirror for black cars.',
              'Parayı tuttun. Artık dikiz aynasında siyah araba arıyorsun.',
            );
          }
          fire(c);
          return c.t(
            'The passenger came back with a lawyer and dashcam footage. You lost your taxi license.',
            'Yolcu yanında avukat ve araç kamerası kaydıyla geri geldi. Taksi ruhsatını kaybettin.',
          );
        },
      },
    ],
  },

  // ================================================================ mechanic
  {
    id: 'base.job_mechanic_classic',
    category: 'work',
    minAge: 16,
    weight: 20,
    when: on('mechanic'),
    title: (c) => c.t('A customer rolls in a classic car.', 'Bir müşteri tamire klasik bir araba getirdi.'),
    text: (c) =>
      c.t(
        'The engine has not run since disco was cool. They want it fixed cheap.',
        'Motor, disko modası geçtiğinden beri çalışmıyor. Ucuza yapılmasını istiyorlar.',
      ),
    choices: [
      {
        id: 'restore',
        label: (c) => c.t('Restore it properly', 'Aslına uygun restore et'),
        resolve: (c) => {
          c.h.money(wage(c, 2500));
          c.h.stat('happiness', 5);
          const up = c.rng.chance(0.3) ? promo(c) : '';
          return (
            c.t('It took three months. It purrs like a cat and the customer cried.', 'Üç ay sürdü. Kedi gibi mırlıyor; müşteri ağladı.') +
            up
          );
        },
        tone: 'good',
      },
      {
        id: 'quick',
        label: (c) => c.t('Do a quick fix', 'Şöyle bir toparla'),
        resolve: (c) => {
          c.h.money(wage(c, 700));
          return c.t('It started. It made it to the end of the street. That counts.', 'Çalıştı. Sokağın sonuna kadar gitti. Sayılır.');
        },
      },
      {
        id: 'buy',
        label: (c) => c.t('Offer to buy it', 'Arabayı satın almayı teklif et'),
        badge: 'Costs more',
        requires: (c) => c.p.money >= wage(c, 6000),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-wage(c, 6000));
          if (c.rng.chance(0.6)) {
            const sale = wage(c, 14000);
            c.h.money(sale);
            return c.t(
              `You fixed it up and sold it to a collector for ${c.h.fmt(sale)}.`,
              `Arabayı elden geçirip bir koleksiyoncuya ${c.h.fmt(sale)} karşılığında sattın.`,
            );
          }
          c.h.stat('happiness', 8);
          return c.t(
            'You fixed it up and fell in love. It is not for sale anymore.',
            'Arabayı elden geçirdin ve âşık oldun. Artık satılık değil.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_mechanic_noise',
    category: 'work',
    minAge: 16,
    weight: 16,
    when: on('mechanic'),
    title: (c) => c.t('A customer says the car "makes a noise".', 'Müşteri arabanın "bir ses yaptığını" söylüyor.'),
    text: (c) => c.t('They imitate the noise for you. It goes on for a while.', 'Sesi sana taklit ederek gösteriyor. Epey uzun sürüyor.'),
    choices: [
      {
        id: 'strip',
        label: (c) => c.t('Take the engine apart', 'Motoru sök'),
        resolve: (c) => {
          c.h.money(wage(c, 400));
          c.h.stat('happiness', 5);
          return c.t(
            'It was a lost kitten in the engine bay. It now lives at your garage.',
            'Motor bölmesinden kaybolmuş bir yavru kedi çıktı. Artık senin dükkânında yaşıyor.',
          );
        },
      },
      {
        id: 'radio',
        label: (c) => c.t('Turn the radio up', 'Radyonun sesini aç'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You turned up the radio. The noise went away. The customer is thrilled.',
            'Radyonun sesini açtın. Ses gitti. Müşteri çok memnun.',
          );
        },
      },
      {
        id: 'mimic',
        label: (c) => c.t('Make the noise back at them', 'Sesi sen de taklit et'),
        resolve: (c) => {
          c.h.money(wage(c, 1200));
          return c.t(
            'You made the noise at each other for a full minute. It was the gearbox.',
            'Bir dakika boyunca karşılıklı aynı sesi çıkardınız. Şanzımanmış.',
          );
        },
      },
    ],
  },

  // ================================================================ architect
  {
    id: 'base.job_architect_client',
    category: 'work',
    minAge: 22,
    weight: 20,
    when: on('architect'),
    title: (c) => c.t('A client wants a villa with seven balconies.', 'Bir müşteri yedi balkonlu bir villa istiyor.'),
    text: (c) =>
      c.t(
        'Also a castle tower, a pool on the roof and "a bit of Versailles".',
        'Bir de şato kulesi, çatıda havuz ve "biraz Versay havası".',
      ),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Give them everything', 'Ne istiyorlarsa ver'),
        resolve: (c) => {
          const pay = wage(c, c.rng.int(4, 10) * 1000);
          c.h.money(pay);
          c.h.stat('happiness', -3);
          return c.t(
            `You built it. The neighbors call it "the wedding cake". Your fee: ${c.h.fmt(pay)}.`,
            `Yaptın. Komşular ona "düğün pastası" diyor. Ücretin ${c.h.fmt(pay)} oldu.`,
          );
        },
      },
      {
        id: 'elegant',
        label: (c) => c.t('Talk them into something elegant', 'Zarif bir tasarıma ikna et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 250)) {
            c.h.stat('happiness', 7);
            return (
              c.t(
                'The house won a design award. The client now says it was their idea.',
                'Ev bir tasarım ödülü kazandı. Müşteri artık bunun kendi fikri olduğunu söylüyor.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -4);
          return c.t('They hired another architect who said yes to everything.', 'Her şeye evet diyen başka bir mimarla anlaştılar.');
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Refuse the project', 'Projeyi reddet'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You said no and framed their sketch as a warning to future generations.',
            'Hayır dedin. Gönderdikleri eskizi gelecek nesillere ibret olsun diye çerçeveletip astın.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_architect_competition',
    category: 'work',
    minAge: 24,
    weight: 12,
    cooldown: 6,
    when: on('architect'),
    title: (c) => c.t('The city opens a design competition for a new library.', 'Belediye yeni kütüphane için proje yarışması açtı.'),
    text: (c) =>
      c.t('The deadline is in three weeks. Your weekends just vanished.', 'Teslim üç hafta sonra. Hafta sonların az önce buharlaştı.'),
    choices: [
      {
        id: 'allnighter',
        label: (c) => c.t('Pull all-nighters', 'Sabahlara kadar çalış'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -4);
          if (c.rng.chance(0.25 + c.p.stats.smarts / 300)) {
            c.h.money(wage(c, 15000));
            c.h.achieve('design_award');
            c.h.stat('happiness', 10);
            return (
              c.t(
                `You won! Your library will stand in ${c.p.city} for a hundred years.`,
                `Kazandın! Kütüphanen ${loc(cityOf(c))} yüz yıl ayakta kalacak.`,
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'You came second. The winning design looks suspiciously like yours.',
            'İkinci oldun. Kazanan proje seninkine şüpheli derecede benziyor.',
          );
        },
        tone: 'big',
      },
      {
        id: 'team',
        label: (c) => c.t('Team up with an old rival', 'Eski rakibinle güçlerini birleştir'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.money(wage(c, 7000));
            c.h.stat('happiness', 6);
            return (
              c.t(
                'You won together. You still argue about who drew the staircase.',
                'Birlikte kazandınız. Merdiveni kimin çizdiğini hâlâ tartışıyorsunuz.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'You argued about the windows for three weeks and missed the deadline.',
            'Üç hafta pencereler yüzünden tartıştınız ve teslim tarihini kaçırdınız.',
          );
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Skip it', 'Bu yarışmayı pas geç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            "You spent your weekends outdoors and looked at other people's buildings.",
            'Hafta sonlarını dışarıda, başkalarının binalarına bakarak geçirdin.',
          );
        },
      },
    ],
  },

  // ================================================================ vet
  {
    id: 'base.job_vet_calving',
    category: 'work',
    minAge: 22,
    weight: 20,
    when: on('vet'),
    title: (c) => c.t('A farmer calls at 3 a.m. A cow is calving.', 'Gece üçte bir çiftçi aradı. İnek doğuruyor.'),
    text: (c) =>
      c.t(
        'The calf is coming backwards and the farmer is panicking in two dialects.',
        'Buzağı ters geliyor ve çiftçi iki ayrı şiveyle panik yapıyor.',
      ),
    choices: [
      {
        id: 'drive',
        label: (c) => c.t('Drive out in your pajamas', 'Pijamalarla yola çık'),
        resolve: (c) => {
          c.h.stat('health', -1);
          if (c.rng.chance(0.8)) {
            c.h.stat('happiness', 7);
            return c.t(
              'Mother and calf are fine. The farmer named the calf after you and paid in cheese.',
              'Anne de buzağı da iyi. Çiftçi buzağıya senin adını verdi, ücreti peynirle ödedi.',
            );
          }
          return c.t(
            'The calf arrived before you did. You stayed for tea anyway.',
            'Sen varmadan buzağı doğmuştu. Yine de bir çay içip döndün.',
          );
        },
        tone: 'good',
      },
      {
        id: 'phone',
        label: (c) => c.t('Talk the farmer through it by phone', 'Çiftçiyi telefondan yönlendir'),
        requires: (c) => c.p.stats.smarts >= 70,
        requiresLabel: 'Needs Smarts 70+',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const title = c.p.gender === 'female' ? 'doktor hanım' : 'doktor bey';
          return (
            c.t(
              'You guided the whole birth by phone. The farmer now calls you "doc" with deep feeling.',
              `Bütün doğumu telefondan yönettin. Çiftçi artık sana büyük bir hürmetle "${title}" diyor.`,
            ) + promo(c)
          );
        },
      },
      {
        id: 'intern',
        label: (c) => c.t('Send the intern', 'Stajyeri gönder'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t(
            'The intern came back at dawn, covered in things you do not want to know about.',
            'Stajyer sabaha karşı, bilmek istemediğin şeylere bulanmış olarak döndü.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_vet_parrot',
    category: 'work',
    minAge: 22,
    weight: 16,
    when: on('vet'),
    title: (c) => c.t('A parrot in your clinic swears in three languages.', 'Muayenehanendeki bir papağan üç dilde küfrediyor.'),
    text: (c) =>
      c.t(
        'Its owner, a very proper old lady, has "no idea where he learned it".',
        'Sahibi son derece kibar, yaşlı bir hanımefendi. "Nereden öğrendi hiç bilmiyorum" diyor.',
      ),
    choices: [
      {
        id: 'treat',
        label: (c) => c.t('Treat it professionally', 'Profesyonelce tedavi et'),
        resolve: (c) => {
          c.h.money(wage(c, 200));
          return c.t(
            'You treated its feathers. It called you something unrepeatable on the way out.',
            'Tüylerini tedavi ettin. Çıkarken sana tekrarlanamayacak bir şey söyledi.',
          );
        },
      },
      {
        id: 'teach',
        label: (c) => c.t('Teach it a nicer word', 'Ona güzel bir kelime öğret'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t(
            'You taught it "thank you". It now says it before every swear word.',
            'Ona "teşekkürler" demeyi öğrettin. Artık her küfürden önce söylüyor.',
          );
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask the lady about her past', 'Hanımefendiye geçmişini sor'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'She winked. Thirty years in the merchant navy, it turns out.',
            'Göz kırptı. Meğer otuz yıl ticaret gemilerinde çalışmış.',
          );
        },
      },
    ],
  },

  // ================================================================ dentist
  {
    id: 'base.job_dentist_wrestler',
    category: 'work',
    minAge: 22,
    weight: 20,
    when: on('dentist'),
    title: (c) => c.t('A huge wrestler faints at the sight of your drill.', 'Dev gibi bir güreşçi matkabı görünce bayıldı.'),
    text: (c) => c.t('He was fine with the needle. It was the noise.', 'İğneye ses etmedi. Matkabın sesi yüzünden oldu.'),
    choices: [
      {
        id: 'finish',
        label: (c) => c.t('Finish while he is out', 'O baygınken işi bitir'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.money(wage(c, 400));
            return c.t(
              'He woke up with a perfect filling and no memory. Five stars.',
              'Kusursuz bir dolguyla ve hiçbir şey hatırlamadan uyandı. Beş yıldız.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'He woke up halfway. You spent the afternoon holding his hand.',
            'Yarıda uyandı. Öğleden sonrayı elini tutarak geçirdin.',
          );
        },
      },
      {
        id: 'music',
        label: (c) => c.t('Play him calming music', 'Sakinleştirici müzik aç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You played whale songs. He cried, but stayed in the chair.', 'Balina sesleri açtın. Ağladı ama koltuktan kalkmadı.');
        },
      },
      {
        id: 'sedate',
        label: (c) => c.t('Reschedule with sedation', 'Sedasyonla yeni randevu ver'),
        resolve: (c) => {
          c.h.money(wage(c, 800));
          return c.t('He came back sedated and asked you to be his best man.', 'Sedasyonla geri geldi ve sana sağdıcı olmanı teklif etti.');
        },
      },
    ],
  },
  {
    id: 'base.job_dentist_clinic',
    category: 'work',
    minAge: 28,
    once: true,
    weight: 14,
    when: (c) => isJob(c, 'dentist') && c.p.jobLevel < 3,
    title: (c) => c.t('You could open your own clinic.', 'Kendi muayenehaneni açabilirsin.'),
    text: (c) =>
      c.t(
        `It would cost ${c.h.fmt(wage(c, 30000))} up front. The dental chairs alone cost a fortune.`,
        `Başlangıçta ${c.h.fmt(wage(c, 30000))} gerekiyor. Sadece koltuklar bile bir servet.`,
      ),
    choices: [
      {
        id: 'open',
        label: (c) => c.t('Take a loan and open it', 'Kredi çek ve aç'),
        badge: 'Bank loan',
        resolve: (c) => {
          c.h.money(-wage(c, 30000));
          if (c.rng.chance(0.65)) {
            while (promoteAnyway(c)); // your own clinic: straight to the top title
            c.h.stat('happiness', 8);
            return c.t(
              `Your clinic opened with flowers at the door. New title: ${c.h.jobTitle()}.`,
              `Muayenehanen açıldı, kapına çiçekler geldi. Artık ${c.h.jobTitle()} oldun.`,
            );
          }
          c.h.stat('happiness', -8);
          return c.t(
            'The clinic struggled for a year. You closed it and went back to a hospital job.',
            'Muayenehane bir yıl zorlandı. Kapattın ve hastaneye geri döndün.',
          );
        },
        tone: 'big',
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay on salary', 'Maaşlı devam et'),
        badge: 'Safe',
        resolve: (c) => c.t('You kept your salary and your weekends.', 'Maaşını da hafta sonlarını da korudun.'),
      },
    ],
  },

  // ================================================================ cabin crew
  {
    id: 'base.job_cabin_unruly',
    category: 'work',
    minAge: 18,
    weight: 20,
    when: on('cabin_crew'),
    title: (c) => c.t('A passenger refuses to sit down.', 'Bir yolcu yerine oturmayı reddediyor.'),
    text: (c) =>
      c.t(
        'He says he "paid for this plane" and wants to see the cockpit.',
        '"Bu uçağın parasını ben ödedim" diyor ve kokpiti görmek istiyor.',
      ),
    choices: [
      {
        id: 'juice',
        label: (c) => c.t('Smile and offer a free juice', 'Gülümse ve meyve suyu ikram et'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'He sat down for the juice. He stood up again for the second juice.',
            'Meyve suyu için oturdu. İkinci meyve suyu için yine kalktı.',
          );
        },
      },
      {
        id: 'captain',
        label: (c) => c.t('Call the captain', 'Kaptanı çağır'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'The captain came out and said two words. He was quiet for the rest of the flight.',
            'Kaptan geldi ve iki kelime söyledi. Adam uçuşun geri kalanında sesini çıkarmadı.',
          );
        },
      },
      {
        id: 'law',
        label: (c) => c.t('Recite aviation law word for word', 'Havacılık mevzuatını kelimesi kelimesine oku'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const up = c.rng.chance(0.4) ? promo(c) : '';
          return (
            c.t(
              'He sat down out of sheer boredom. The crew will tell this story for years.',
              'Adam sırf sıkıldığı için oturdu. Ekip bunu yıllarca anlatacak.',
            ) + up
          );
        },
      },
    ],
  },
  {
    id: 'base.job_cabin_celebrity',
    category: 'work',
    minAge: 18,
    weight: 16,
    when: on('cabin_crew'),
    title: (c) => c.t('A famous actor is in seat 1A.', 'Ünlü bir oyuncu 1A numaralı koltukta.'),
    text: (c) =>
      c.t('The whole crew has found a reason to walk past the front row.', 'Bütün ekip ön sıranın yanından geçmek için bir bahane buldu.'),
    choices: [
      {
        id: 'normal',
        label: (c) => c.t('Act completely normal', 'Tamamen normal davran'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'The actor asked your name. You panicked and said "chicken or pasta?"',
            'Oyuncu adını sordu. Panikledin ve "Tavuk mu, makarna mı?" dedin.',
          );
        },
      },
      {
        id: 'photo',
        label: (c) => c.t('Ask for a photo', 'Fotoğraf iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t(
              'You got the photo. It is now the wallpaper of every cousin you have.',
              'Fotoğrafı çektin. Artık bütün kuzenlerinin telefon duvar kâğıdı.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'Your supervisor saw. You got a long lecture on professionalism.',
            'Amirin gördü. Profesyonellik üzerine uzun bir nutuk dinledin.',
          );
        },
      },
      {
        id: 'script',
        label: (c) => c.t('Slip them your screenplay', 'Yazdığın senaryoyu sıkıştır'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.15)) {
            const pay = wage(c, 10000);
            c.h.money(pay);
            c.h.stat('happiness', 10);
            return c.t(
              `They actually read it. A producer bought the rights for ${c.h.fmt(pay)}.`,
              `Gerçekten okudu. Bir yapımcı senaryonun haklarını ${c.h.fmt(pay)} karşılığında aldı.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t('They used it as a coaster.', 'Bardak altlığı olarak kullandı.');
        },
      },
    ],
  },

  // ================================================================ estate agent
  {
    id: 'base.job_realtor_haunted',
    category: 'work',
    minAge: 18,
    weight: 20,
    when: on('realtor'),
    title: (c) => c.t('You have to sell a house everyone says is haunted.', 'Herkesin perili dediği bir evi satman lazım.'),
    text: (c) =>
      c.t(
        'The doors creak, the lights flicker and the last owner left in the middle of dinner.',
        'Kapılar gıcırdıyor, ışıklar titriyor ve son sahibi akşam yemeğinin ortasında evi terk etmiş.',
      ),
    choices: [
      {
        id: 'character',
        label: (c) => c.t('Advertise it as "full of character"', '"Karakterli" diye ilan ver'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const fee = wage(c, c.rng.int(3, 8) * 1000);
            c.h.money(fee);
            return c.t(
              `A young couple loved the "character". Commission: ${c.h.fmt(fee)}. They have not called since.`,
              `Genç bir çift "karakterine" bayıldı. Komisyonun ${c.h.fmt(fee)}. O günden beri aramadılar.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t('Three viewings, three people ran out. One left a shoe.', 'Üç gösterim, üç kaçan müşteri. Biri ayakkabısını bıraktı.');
        },
      },
      {
        id: 'hunters',
        label: (c) => c.t('Sell it to ghost hunters', 'Hayalet avcılarına sat'),
        resolve: (c) => {
          c.h.money(wage(c, c.rng.int(2, 5) * 1000));
          c.h.stat('happiness', 3);
          return c.t(
            'A paranormal TV show bought it. They found nothing but a very old cat.',
            'Paranormal bir televizyon programı evi aldı. Çok yaşlı bir kediden başka bir şey bulamadılar.',
          );
        },
      },
      {
        id: 'wiring',
        label: (c) => c.t('Fix the wiring first', 'Önce elektrik tesisatını yenile'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 1000));
          c.h.money(wage(c, 6000));
          const up = c.rng.chance(0.3) ? promo(c) : '';
          return (
            c.t(
              'The flickering stopped. So did the haunting. Sold within a week.',
              'Işıkların titremesi kesildi. Perilik de. Ev bir haftada satıldı.',
            ) + up
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_realtor_bidding',
    category: 'work',
    minAge: 20,
    weight: 12,
    when: (c) => isJob(c, 'realtor') && c.p.jobLevel >= 1,
    title: (c) => c.t('Two buyers want the same flat.', 'İki alıcı aynı daireye talip.'),
    text: (c) =>
      c.t(
        'One is a sweet young family. The other is waving a much bigger number.',
        'Biri sevimli, genç bir aile. Diğeri çok daha büyük bir rakam sallıyor.',
      ),
    choices: [
      {
        id: 'push',
        label: (c) => c.t('Push the family to bid higher', 'Aileyi daha yüksek teklife zorla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(wage(c, 6000));
            c.h.stat('happiness', -1);
            return c.t(
              'They paid more than they could afford. You bought new shoes and feel weird about it.',
              'Güçlerinin üstünde ödediler. Kendine yeni ayakkabı aldın ama içinde bir burukluk var.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'Both buyers walked away. Your boss is "disappointed".',
            'İki alıcı da vazgeçti. Patronun "hayal kırıklığına uğradığını" söyledi.',
          );
        },
      },
      {
        id: 'big',
        label: (c) => c.t('Take the big number', 'Büyük teklifi al'),
        badge: 'Big money',
        resolve: (c) => {
          c.h.money(wage(c, 5000));
          c.h.stat('happiness', -2);
          return c.t(
            'You closed the deal. The buyer turned it into a holiday rental the next week.',
            'Satışı kapattın. Alıcı daireyi ertesi hafta günlük kiralığa çevirdi.',
          );
        },
      },
      {
        id: 'family',
        label: (c) => c.t('Help the family get it', 'Ailenin almasına yardım et'),
        resolve: (c) => {
          c.h.money(wage(c, 1500));
          c.h.stat('happiness', 6);
          return c.t(
            'The family got the flat. Their kid drew you a picture. It is on your fridge.',
            'Daire ailenin oldu. Çocukları sana bir resim çizdi. Şimdi buzdolabının kapağında.',
          );
        },
        tone: 'good',
      },
    ],
  },

  // ================================================================ the original fourteen
  {
    id: 'base.job_nurse_night',
    category: 'work',
    minAge: 21,
    weight: 18,
    when: on('nurse'),
    title: (c) => c.t('Your night shift on the ward just got busy.', 'Servisteki gece nöbetin bir anda hareketlendi.'),
    text: (c) =>
      c.t(
        'Three call bells at once, a confused grandpa looking for his horse and a new doctor who has not slept.',
        'Aynı anda üç zil, atını arayan şaşkın bir dede ve hiç uyumamış yeni bir doktor.',
      ),
    choices: [
      {
        id: 'command',
        label: (c) => c.t('Run the ward like a general', 'Servisi general gibi yönet'),
        resolve: (c) => {
          c.h.stat('health', -3);
          const up = c.rng.chance(0.4) ? promo(c) : '';
          return (
            c.t(
              'By dawn everyone was settled and calm. Even the horse was found. (It was a mop.)',
              'Sabaha kadar herkes yatıştı. At bile bulundu. (Paspasmış.)',
            ) + up
          );
        },
      },
      {
        id: 'grandpa',
        label: (c) => c.t('Sit with the grandpa', 'Dedenin yanına otur'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t(
            'He told you about the horse for an hour. It was a very good horse.',
            'Sana bir saat boyunca atını anlattı. Çok iyi bir atmış.',
          );
        },
      },
      {
        id: 'dose',
        label: (c) => c.t("Double-check the new doctor's orders", 'Yeni doktorun yazdığı ilaçları kontrol et'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return (
            c.t(
              'You caught a wrong dose before it reached a patient. The doctor now brings you coffee every shift.',
              'Yanlış dozu hastaya ulaşmadan fark ettin. Doktor artık her nöbette sana kahve getiriyor.',
            ) + promo(c)
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_teacher_parents',
    category: 'work',
    minAge: 21,
    weight: 18,
    when: on('teacher'),
    title: (c) => c.t('Parent-teacher meeting night.', 'Veli toplantısı akşamı.'),
    text: (c) =>
      c.t(
        'One father is sure his son is a genius. Today his son ate a glue stick.',
        'Bir baba oğlunun dâhi olduğuna emin. Oğlu bugün bir stick yapıştırıcı yedi.',
      ),
    choices: [
      {
        id: 'honest',
        label: (c) => c.t('Be brutally honest', 'Acı gerçeği söyle'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 3);
            return c.t(
              'He thanked you and found a tutor. The boy improved. The glue did not survive.',
              'Teşekkür etti ve özel hoca tuttu. Çocuk gelişti. Yapıştırıcılar ise kurtulamadı.',
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            'He complained to the education office. You spent a week writing a report about glue.',
            `${inTr(c) ? "Milli Eğitim'e" : 'Eğitim müdürlüğüne'} şikâyet etti. Bir haftanı yapıştırıcı hakkında rapor yazarak geçirdin.`,
          );
        },
      },
      {
        id: 'nice',
        label: (c) => c.t('Find something nice to say', 'Güzel bir şey bulup söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'You said the boy has "a very curious mouth". The father glowed.',
            'Çocuğun "çok meraklı bir ağzı olduğunu" söyledin. Babanın gözleri parladı.',
          );
        },
      },
      {
        id: 'cookies',
        label: (c) => c.t('Bring cookies and win the room', 'Kurabiye götür, herkesin gönlünü al'),
        resolve: (c) => {
          c.h.money(-wage(c, 30));
          c.h.stat('happiness', 3);
          const up = c.rng.chance(0.25) ? promo(c) : '';
          return (
            c.t(
              'The parents left happy and full. Next year they asked for you by name.',
              'Veliler mutlu ve tok ayrıldı. Ertesi yıl özellikle seni istediler.',
            ) + up
          );
        },
      },
    ],
  },
  {
    id: 'base.job_chef_critic',
    category: 'work',
    minAge: 18,
    weight: 18,
    when: on('chef'),
    title: (c) => c.t('A famous food critic just sat at table seven.', 'Ünlü bir yemek eleştirmeni yedi numaralı masaya oturdu.'),
    text: (c) => c.t('She ordered the soup of the day. There is no soup of the day.', 'Günün çorbasını sipariş etti. Günün çorbası yok.'),
    choices: [
      {
        id: 'invent',
        label: (c) => c.t('Invent a soup on the spot', 'Anında bir çorba uydur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 400)) {
            c.h.money(wage(c, 2000));
            c.h.stat('happiness', 8);
            return (
              c.t(
                'She called it "a soup with opinions". Bookings tripled.',
                'Ona "fikri olan bir çorba" dedi. Rezervasyonlar üçe katlandı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -6);
          return c.t(
            'She called it "brave". In critic language, that means terrible.',
            'Ona "cesur" dedi. Eleştirmen dilinde bu "berbat" demek.',
          );
        },
      },
      {
        id: 'grandma',
        label: (c) => c.t("Serve your grandmother's lentil soup", 'Ninenin mercimek çorbasını yap'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return c.t('She asked for the recipe. You said no. She respected that.', 'Tarifini istedi. Vermedin. Buna saygı duydu.');
          }
          c.h.stat('happiness', 1);
          return c.t(
            'She said it "tasted like someone\'s grandmother". You are taking that as a compliment.',
            'Çorbanın "birinin ninesi gibi" koktuğunu yazdı. Sen bunu iltifat olarak kabul ediyorsun.',
          );
        },
      },
      {
        id: 'admit',
        label: (c) => c.t('Admit there is no soup', 'Çorba olmadığını itiraf et'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t(
            'She wrote that honesty was the best thing on the menu. Two stars.',
            'Menüdeki en iyi şeyin dürüstlük olduğunu yazdı. İki yıldız.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_police_chase',
    category: 'work',
    minAge: 18,
    weight: 18,
    when: on('police'),
    title: (c) => c.t('A suspect on a motorbike just ran a red light.', 'Motosikletli bir şüpheli kırmızı ışıkta geçti.'),
    text: (c) =>
      c.t(
        `Your partner is mid-${byCountry(c, PATROL_SNACK)[0]}. The motorbike is getting away.`,
        `Ekip arkadaşın ${byCountry(c, PATROL_SNACK)[1]} yarısında. Motosiklet uzaklaşıyor.`,
      ),
    choices: [
      {
        id: 'foot',
        label: (c) => c.t('Chase on foot', 'Yaya olarak kovala'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -2);
          if (c.rng.chance(0.3 + c.p.stats.health / 250)) {
            c.h.stat('happiness', 7);
            return (
              c.t(
                'You caught him three streets later, with a bag of stolen phones and a lot of regret.',
                'Onu üç sokak ötede yakaladın. Üstünden bir torba çalıntı telefon ve bolca pişmanlık çıktı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -3);
          return c.t('He got away. You got shin splints.', 'Kaçtı. Sana da kaval kemiği ağrısı kaldı.');
        },
      },
      {
        id: 'radio',
        label: (c) => c.t('Radio ahead and cut him off', 'Telsizle haber ver, önünü kes'),
        requires: (c) => c.p.stats.smarts >= 50,
        requiresLabel: 'Needs Smarts 50+',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          const up = c.rng.chance(0.5) ? promo(c) : '';
          return (
            c.t('The patrol at the next corner picked him up like a parcel.', 'Bir sonraki köşedeki ekip onu paket gibi teslim aldı.') + up
          );
        },
        tone: 'good',
      },
      {
        id: 'tea',
        label: (c) => c.t('Let him go and finish your tea', 'Bırak gitsin, çayını bitir'),
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', -4);
            return c.t(
              'Your chief watched the whole thing on camera. Desk duty for a month.',
              'Amirin her şeyi kameradan izlemiş. Bir ay masa başı görev.',
            );
          }
          c.h.stat('happiness', 2);
          return c.t('He got away. The tea, however, was perfect.', 'Kaçtı. Ama çay tam kıvamındaydı.');
        },
      },
    ],
  },
  {
    id: 'base.job_miner_gas',
    category: 'work',
    minAge: 18,
    weight: 18,
    when: on('miner'),
    title: (c) => c.t('The gas alarm went off deep in the shaft.', 'Ocağın derinlerinde gaz alarmı çaldı.'),
    text: (c) =>
      c.t(
        'It might be a faulty sensor. It might not. Your crew is looking at you.',
        'Sensör arızalı olabilir. Olmayabilir de. Ekip sana bakıyor.',
      ),
    choices: [
      {
        id: 'evacuate',
        label: (c) => c.t('Get everyone out, now', 'Herkesi hemen dışarı çıkar'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const up = c.rng.chance(0.3) ? promo(c) : '';
          return (
            c.t(
              'Everyone made it up. It was a real leak, caught early. The old miners shook your hand without a word.',
              'Herkes yukarı çıktı. Gerçek bir sızıntıymış ve erken yakalandı. Eski madenciler tek kelime etmeden elini sıktı.',
            ) + up
          );
        },
        tone: 'good',
      },
      {
        id: 'check',
        label: (c) => c.t('Check the sensor yourself', 'Sensörü kendin kontrol et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('health', -1);
            return c.t(
              'The sensor was faulty. You fixed it and the shift went on. Your heart took longer to calm down.',
              'Sensör arızalıymış. Tamir ettin, vardiya devam etti. Kalbinin sakinleşmesi biraz daha uzun sürdü.',
            );
          }
          c.h.stat('health', -8);
          c.h.stat('happiness', -4);
          return c.t(
            'The gas was real. You got out coughing and spent a week in hospital.',
            'Gaz gerçekmiş. Öksürerek çıktın ve bir hafta hastanede yattın.',
          );
        },
      },
      {
        id: 'surface',
        label: (c) => c.t('Call the surface for orders', 'Yukarıyı ara, talimat iste'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t(
            'The surface said "Get out!" Your crew was already halfway to the cage.',
            'Yukarıdan "Çıkın!" dediler. Ekip zaten asansörün yarı yolundaydı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_lawyer_case',
    category: 'work',
    minAge: 22,
    weight: 14,
    cooldown: 6,
    when: on('lawyer'),
    title: (c) => c.t('You landed the biggest case of your career.', 'Kariyerinin en büyük davası sana düştü.'),
    text: (c) =>
      c.t(
        'A tiny bakery is suing a giant chain for stealing its croissant recipe.',
        'Küçük bir fırın, poğaça tarifini çaldığı için dev bir zinciri dava ediyor.',
      ),
    choices: [
      {
        id: 'fight',
        label: (c) => c.t('Fight it all the way', 'Sonuna kadar savaş'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 300)) {
            const fee = wage(c, c.rng.int(10, 40) * 1000);
            c.h.money(fee);
            c.h.stat('happiness', 10);
            return (
              c.t(
                `You won, and your fee was ${c.h.fmt(fee)}. The bakery sends you free pastries for life. Your cholesterol has concerns.`,
                `Kazandın; ücretin ${c.h.fmt(fee)}. Fırın sana ömür boyu bedava poğaça gönderiyor. Kolesterolün endişeli.`,
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -6);
          return c.t('You lost on a technicality. The baker hugged you anyway.', 'Usulden kaybettin. Fırıncı yine de sana sarıldı.');
        },
        tone: 'big',
      },
      {
        id: 'settle',
        label: (c) => c.t('Settle for a good deal', 'İyi bir uzlaşmaya git'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.money(wage(c, 5000));
          return c.t(
            'You settled. Everyone got paid, nobody got justice. Classic.',
            'Uzlaştınız. Herkes parasını aldı, adalet kimseye düşmedi. Klasik.',
          );
        },
      },
      {
        id: 'drop',
        label: (c) => c.t('Drop it for a bigger client', 'Daha büyük bir müvekkil için bırak'),
        badge: 'Big money',
        resolve: (c) => {
          c.h.money(wage(c, 15000));
          c.h.stat('happiness', -8);
          return c.t(
            'You took a shipping magnate instead. The money was huge. The baker will not look at you.',
            'Onun yerine bir armatörün davasını aldın. Para çok büyüktü. Fırıncı artık yüzüne bakmıyor.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_doctor_mystery',
    category: 'work',
    minAge: 24,
    weight: 18,
    when: on('doctor'),
    title: (c) => c.t('A patient has symptoms nobody can explain.', 'Kimsenin açıklayamadığı belirtileri olan bir hasta var.'),
    text: (c) =>
      c.t(
        'Fever, purple fingers and a sudden love of jazz. Five specialists gave up.',
        'Ateş, mor parmaklar ve aniden başlayan bir caz tutkusu. Beş uzman pes etti.',
      ),
    choices: [
      {
        id: 'journals',
        label: (c) => c.t('Read every journal overnight', 'Bütün gece makale tara'),
        resolve: (c) => {
          c.h.stat('health', -3);
          if (c.rng.chance(0.3 + c.p.stats.smarts / 250)) {
            c.h.stat('happiness', 8);
            return (
              c.t(
                'A rare parasite from a souvenir drum. You are now a case study.',
                'Hediyelik bir davuldan gelen nadir bir parazitmiş. Artık tıp kitaplarında bir vaka olarak geçiyorsun.',
              ) + promo(c)
            );
          }
          return c.t(
            'You found nothing. The patient got better on their own. Nobody knows why.',
            'Hiçbir şey bulamadın. Hasta kendi kendine iyileşti. Kimse nedenini bilmiyor.',
          );
        },
      },
      {
        id: 'holiday',
        label: (c) => c.t('Ask about their last holiday', 'Son tatilini sor'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 7);
            return (
              c.t(
                'A street market abroad, a drum, a parasite. Diagnosis in ten minutes. The specialists are furious.',
                'Yurt dışında bir pazar, bir davul, bir parazit. On dakikada teşhis. Uzmanlar küplere bindi.',
              ) + promo(c)
            );
          }
          return c.t("They spent it at their aunt's house. That did not help.", 'Tatili teyzesinde geçirmiş. Bunun bir faydası olmadı.');
        },
      },
      {
        id: 'refer',
        label: (c) => c.t('Refer them to another hospital', 'Başka hastaneye sevk et'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You referred them on. Someone else will write the journal article.', 'Hastayı sevk ettin. Makaleyi başkası yazacak.');
        },
      },
    ],
  },
  {
    id: 'base.job_journalist_scoop',
    category: 'work',
    minAge: 21,
    weight: 18,
    when: on('journalist'),
    title: (c) => c.t('A source slips you a secret document.', 'Bir kaynak sana gizli bir belge sızdırdı.'),
    text: (c) =>
      c.t(
        'It shows the mayor building a private pool with city money.',
        'Belgeye göre belediye başkanı şehrin parasıyla kendine özel havuz yaptırıyor.',
      ),
    choices: [
      {
        id: 'publish',
        label: (c) => c.t('Publish tonight', 'Bu gece yayımla'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('happiness', 8);
            return (
              c.t(
                'The story exploded. The pool became a free swimming school for kids.',
                'Haber bomba gibi patladı. Havuz, çocuklar için ücretsiz bir yüzme okuluna dönüştü.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -8);
          if (c.rng.chance(0.3)) {
            fire(c);
            return c.t(
              'The document was fake. The paper let you go before lunch.',
              'Belge sahteymiş. Gazete seni öğle yemeğinden önce kapı dışarı etti.',
            );
          }
          return c.t(
            'The document was fake. Your editor made you write the correction yourself.',
            'Belge sahteymiş. Düzeltme yazısını editörün sana yazdırdı.',
          );
        },
        tone: 'big',
      },
      {
        id: 'verify',
        label: (c) => c.t('Verify every detail first', 'Önce her ayrıntıyı doğrula'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          if (c.rng.chance(0.5))
            return (
              c.t(
                'It took a month, but every word held up. People started saying "award".',
                'Bir ay sürdü ama her kelimesi sağlam çıktı. Ödüllerden söz edilmeye başlandı.',
              ) + promo(c)
            );
          c.h.stat('happiness', -3);
          return c.t('While you were checking, a rival paper ran it first.', 'Sen doğrularken rakip gazete haberi önce verdi.');
        },
      },
      {
        id: 'bury',
        label: (c) => c.t('Accept the mayor\'s "advertising deal"', 'Başkanın "reklam anlaşmasını" kabul et'),
        badge: 'Illegal',
        resolve: (c) => {
          c.h.money(wage(c, 8000));
          c.h.stat('happiness', -6);
          return c.t(
            'You buried the story. The paper now runs a lot of full-page ads about city parks.',
            'Haberi gömdün. Gazetede artık belediye parklarıyla ilgili bir sürü tam sayfa ilan çıkıyor.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_engineer_outage',
    category: 'work',
    minAge: 21,
    weight: 18,
    when: on('engineer'),
    title: (c) => c.t('Production is down. It is 3 a.m.', 'Sistem çöktü. Saat gece üç.'),
    text: (c) =>
      c.t(
        'Your phone is buzzing like an angry wasp. Thousands of users cannot log in.',
        'Telefonun kızgın bir eşek arısı gibi titriyor. Binlerce kullanıcı giriş yapamıyor.',
      ),
    choices: [
      {
        id: 'fix',
        label: (c) => c.t('Fix it in your pajamas', 'Pijamalarla düzelt'),
        resolve: (c) => {
          if (c.rng.chance(0.45 + c.p.stats.smarts / 300)) {
            c.h.stat('happiness', 6);
            return (
              c.t(
                'You found a missing semicolon at 4:12 a.m. You are a legend in the team chat.',
                'Sabaha karşı eksik bir noktalı virgül buldun. Ekip sohbetinde efsane oldun.',
              ) + promo(c)
            );
          }
          c.h.stat('health', -3);
          return c.t(
            'You fixed it by 7 a.m., then went straight to your 9 a.m. meeting.',
            'Sabah yediye doğru düzelttin, sonra doğruca dokuzdaki toplantıya gittin.',
          );
        },
      },
      {
        id: 'rollback',
        label: (c) => c.t('Roll back the last update', 'Son güncellemeyi geri al'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'Everything works again. Nobody will ever know who broke it. (It was you.)',
            'Her şey yeniden çalışıyor. Kimin bozduğunu kimse bilmeyecek. (Sendin.)',
          );
        },
      },
      {
        id: 'silent',
        label: (c) => c.t('Put your phone on silent', 'Telefonu sessize al'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            fire(c);
            return c.t('You slept beautifully. You woke up unemployed.', 'Mışıl mışıl uyudun. İşsiz uyandın.');
          }
          c.h.stat('happiness', 1);
          return c.t(
            'A colleague fixed it. You said your phone died. Nobody believes you.',
            'Bir iş arkadaşın düzeltti. Şarjın bittiğini söyledin. Kimse inanmadı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.job_barista_order',
    category: 'work',
    minAge: 16,
    weight: 16,
    when: on('barista'),
    title: (c) => c.t('A regular orders the most complicated drink ever.', 'Müdavimlerden biri dünyanın en karmaşık kahvesini istedi.'),
    text: (c) =>
      c.t(
        'Half-caf, oat milk, extra hot, two pumps of hazelnut, "but not too sweet".',
        'Yarım kafeinli, yulaf sütlü, ekstra sıcak, iki pompa fındık şuruplu, "ama çok tatlı olmasın".',
      ),
    choices: [
      {
        id: 'perfect',
        label: (c) => c.t('Make it perfectly', 'Kusursuz hazırla'),
        resolve: (c) => {
          c.h.money(wage(c, 150));
          c.h.stat('happiness', 2);
          return c.t(
            'You nailed it. They tipped well and told their whole office.',
            'Tam isabet. Güzel bir bahşiş bıraktı ve bütün ofise anlattı.',
          );
        },
      },
      {
        id: 'latte',
        label: (c) => c.t('Make a normal latte and smile', 'Normal bir latte yap ve gülümse'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) return c.t('They said it was your best one yet.', 'Bugüne kadarki en iyisi olduğunu söyledi.');
          c.h.stat('happiness', -2);
          return c.t('They noticed. They always notice.', 'Fark etti. Hep fark ederler.');
        },
      },
      {
        id: 'poem',
        label: (c) => c.t('Write a poem on the cup', 'Bardağa şiir yaz'),
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.stat('happiness', 6);
            return (
              c.t(
                'A photo of the cup went viral. Now there is a queue around the block.',
                'Bardağın fotoğrafı viral oldu. Artık kafenin önünde sokağın sonuna kadar kuyruk var.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', 3);
          return c.t('They kept the cup. You saw it on their desk a month later.', 'Bardağı saklamış. Bir ay sonra masasında gördün.');
        },
      },
    ],
  },
  {
    id: 'base.job_accountant_shoebox',
    category: 'work',
    minAge: 21,
    weight: 16,
    when: on('accountant'),
    title: (c) => c.t('Tax season. A client brings a shoebox.', 'Vergi dönemi. Bir müşteri ayakkabı kutusuyla geldi.'),
    text: (c) =>
      c.t(
        'Inside: 400 crumpled receipts, a lottery ticket and a sandwich.',
        'İçinde dört yüz buruşuk fiş, bir piyango bileti ve bir sandviç var.',
      ),
    choices: [
      {
        id: 'sort',
        label: (c) => c.t('Sort it all by hand', 'Hepsini tek tek ayıkla'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.money(wage(c, 1200));
          const up = c.rng.chance(0.2) ? promo(c) : '';
          return (
            c.t(
              'It took a week. You found a deduction that saved them a fortune.',
              'Bir hafta sürdü. Onlara servet kazandıran bir vergi indirimi buldun.',
            ) + up
          );
        },
      },
      {
        id: 'ticket',
        label: (c) => c.t('Check the lottery ticket', 'Piyango biletine bak'),
        resolve: (c) => {
          if (c.rng.chance(0.08)) {
            c.h.money(wage(c, 3000));
            c.h.stat('happiness', 6);
            return c.t(
              'It was a winner! The client gave you a cut out of pure shock.',
              'Bilet ikramiye çıkmış! Müşteri şaşkınlıktan sana da pay verdi.',
            );
          }
          return c.t('Not a winner. The sandwich, however, was still fresh.', 'İkramiye yok. Sandviç ise hâlâ tazeydi.');
        },
      },
      {
        id: 'return',
        label: (c) => c.t('Send the box back', 'Kutuyu geri gönder'),
        resolve: (c) =>
          c.t(
            'You sent it back. It returned the next day with more receipts.',
            'Kutuyu geri gönderdin. Ertesi gün daha fazla fişle geri geldi.',
          ),
      },
    ],
  },
  {
    id: 'base.job_designer_logo',
    category: 'work',
    minAge: 21,
    weight: 16,
    when: on('designer'),
    title: (c) => c.t('The client wants the logo bigger.', 'Müşteri logonun daha büyük olmasını istiyor.'),
    text: (c) =>
      c.t(
        'It already fills the whole page. They also want it to "pop".',
        'Logo zaten bütün sayfayı kaplıyor. Bir de "patlasın" istiyorlar.',
      ),
    choices: [
      {
        id: 'bigger',
        label: (c) => c.t('Make it bigger', 'Büyüt'),
        resolve: (c) => {
          c.h.money(wage(c, 500));
          return c.t('You made it bigger. They asked for the first version back.', 'Büyüttün. İlk versiyonu geri istediler.');
        },
      },
      {
        id: 'space',
        label: (c) => c.t('Defend the white space', 'Boşluğun hakkını savun'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 400)) {
            c.h.stat('happiness', 6);
            return (
              c.t(
                'You gave a speech about breathing room. They listened. The campaign won awards.',
                'Nefes alan tasarım üzerine bir konuşma yaptın. Dinlediler. Kampanya ödüller kazandı.',
              ) + promo(c)
            );
          }
          c.h.stat('happiness', -4);
          return c.t('They did not listen. An intern made it bigger instead.', 'Dinlemediler. Logoyu bir stajyere büyüttürdüler.');
        },
      },
      {
        id: 'flare',
        label: (c) => c.t('Add a lens flare', 'Bir parlama efekti ekle'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.money(wage(c, 300));
          return c.t(
            'They loved the lens flare. You will never be the same.',
            'Parlama efektine bayıldılar. Sen artık eskisi gibi olmayacaksın.',
          );
        },
      },
    ],
  },
  // round 4: the job board and events for the new jobs
  ...jobBoardEvents,
  ...careerEventsR4,
  ...majorEvents,
  ...careerEventsR5,
];
