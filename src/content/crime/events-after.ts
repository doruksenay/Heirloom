import type { Ctx, EventDef } from '../types';
import { aOrAn, cap, dat, eligibleJobs, gen, kin, nm, wage } from '../base/util';
import { titleFor } from '../../engine/careers';
import { arrest, crimeState, free, gotAway, goneStraight, heatOf, peekCrime, reform } from './state';

// After prison: a record that follows you, kids who ask questions, old friends who want "one last job",
// a way back, and secrets the next generation finds in the attic.

/** What is in the attic box: clippings for a famous trial or a cold case, a court letter for a small record. */
const papers = (c: Ctx): [string, string] =>
  Number(c.vars.record) && !Number(c.vars.famous ?? 1) ? ['the papers', 'Kâğıtları'] : ['the clippings', 'Kupürleri'];

export const afterEvents: EventDef[] = [
  {
    id: 'crime.record_interview',
    category: 'crime',
    minAge: 20,
    maxAge: 60,
    weight: 12,
    cooldown: 5,
    when: (c) => free(c) && c.p.criminalRecord > 0 && !c.p.jobId && !c.p.retired && c.p.school === null && eligibleJobs(c).length > 0,
    setup: (c) => {
      const job = c.rng.pick(eligibleJobs(c));
      c.vars.job = job.id;
      c.vars.title = titleFor(job, 0, 'en');
      c.vars.titleTr = titleFor(job, 0, 'tr');
    },
    title: (c) => c.t(`A job opening: ${c.vars.title}.`, `Bir iş ilanı: ${c.vars.titleTr}.`),
    text: (c) =>
      c.t(
        `The form has one checkbox you cannot stop staring at: "Have you ever been convicted of a crime?"`,
        `Başvuru formunda gözünü alamadığın tek bir kutucuk var: "Hiç sabıkanız oldu mu?"`,
      ),
    choices: [
      {
        id: 'truth',
        label: (c) => c.t('Tick the box and explain', 'Kutucuğu işaretle ve anlat'),
        resolve: (c) => {
          const st = crimeState(c.p);
          const odds = 0.3 + (st.trade >= 2 ? 0.25 : 0) + (c.h.has('prison_class') ? 0.1 : 0) + (c.p.achievements.includes('reformed') ? 0.2 : 0);
          if (c.rng.chance(odds)) {
            c.h.setJob(String(c.vars.job));
            c.h.stat('happiness', 8);
            return c.t(
              `The manager said everyone deserves a second chance. You are now ${aOrAn(c.h.jobTitle() ?? '')}. He still counts the teaspoons.`,
              `Müdür herkesin ikinci bir şansı hak ettiğini söyledi. Artık ${c.h.jobTitle()} olarak çalışıyorsun. Çay kaşıklarını yine de sayıyor.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t('They thanked you for your honesty. They never called back.', 'Dürüstlüğün için teşekkür ettiler. Bir daha aramadılar.');
        },
      },
      {
        id: 'lie',
        label: (c) => c.t('Leave it blank', 'Boş bırak'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.setJob(String(c.vars.job));
            c.h.flag('lied_on_cv');
            return c.t(
              `You left the box blank and got the job as ${aOrAn(c.h.jobTitle() ?? '')}. Every time HR emails you, your heart stops.`,
              `Kutucuğu boş bıraktın ve ${c.h.jobTitle()} olarak işe girdin. İnsan kaynaklarından her e-posta geldiğinde kalbin duruyor.`,
            );
          }
          c.h.stat('happiness', -5);
          return c.t('They ran a background check anyway. The interviewer suddenly remembered another meeting.', 'Yine de sicil kaydına baktılar. Mülakatı yapan kişinin birden başka bir toplantısı olduğu aklına geldi.');
        },
      },
      {
        id: 'skip',
        label: (c) => c.t('Close the tab', 'Sekmeyi kapat'),
        resolve: (c) => c.t('You closed the tab. Maybe next year.', 'Sekmeyi kapattın. Belki seneye.'),
      },
    ],
  },
  {
    id: 'crime.child_asks',
    category: 'crime',
    minAge: 25,
    once: true,
    when: (c) => c.p.criminalRecord > 0 && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 8 && c.h.ageOf(k.person) <= 17),
    setup: (c) => {
      const k = c.rng.pick(c.h.relatives('child').filter((x) => c.h.ageOf(x.person) >= 8 && c.h.ageOf(x.person) <= 17));
      c.vars.pid = k.person.id;
    },
    title: (c) => c.t(`${nm(c)} found your old mugshot online.`, `${nm(c)} internette eski sabıka fotoğrafını bulmuş.`),
    text: (c) => {
      const k = kin(c, c.h.person(String(c.vars.pid)), 'child');
      return c.t(`Your ${k} holds up the phone. "Is this you? Why are you holding a number?"`, `${cap(k)}, telefonu sana doğru uzatıyor: "Bu sen misin? Neden elinde numara var?"`);
    },
    choices: [
      {
        id: 'truth',
        label: (c) => c.t('Tell the whole truth', 'Bütün gerçeği anlat'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', -2);
          return c.t(`You told ${nm(c)} everything. ${nm(c)} was quiet for a long time, then hugged you.`, `${dat(nm(c))} her şeyi anlattın. ${nm(c)} uzun süre sustu, sonra sana sarıldı.`);
        },
        tone: 'good',
      },
      {
        id: 'costume',
        label: (c) => c.t('Say it was a costume party', 'Kostüm partisi olduğunu söyle'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), 2);
            return c.t(`${nm(c)} believed you and asked to come to the next costume party. You are running out of excuses.`, `${nm(c)} sana inandı ve bir sonraki kostüm partisine gelmek istedi. Bahanelerin tükeniyor.`);
          }
          c.h.closeness(String(c.vars.pid), -8);
          return c.t(`${nm(c)} found the court records the next day. "Costume party," ${nm(c)} says now, every time you lie.`, `${nm(c)} ertesi gün mahkeme kayıtlarını da buldu. Artık her yalanında sana "kostüm partisi" diyor.`);
        },
      },
      {
        id: 'subject',
        label: (c) => c.t('Ask about homework', 'Ödevlerini sor'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -5);
          return c.t(`You asked about homework instead. ${nm(c)} has never been more suspicious of anything.`, `Onun yerine ödevlerini sordun. ${nm(c)} hayatında hiçbir şeyden bu kadar şüphelenmemişti.`);
        },
      },
    ],
  },
  {
    id: 'crime.old_crew',
    category: 'crime',
    minAge: 25,
    maxAge: 70,
    weight: 6,
    cooldown: 10,
    when: (c) => {
      const st = peekCrime(c.p);
      return free(c) && !!st && !st.charge && !st.fugitive && st.lastCrimeYear > 0 && c.s.year - st.lastCrimeYear >= 6 && (c.p.criminalRecord > 0 || st.scores >= 2 || c.h.has('gang'));
    },
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(-5, 5) }).id;
    },
    title: (c) => c.t(`${nm(c)} from the old crew is back in town.`, `Eski ekipten ${nm(c)} şehre dönmüş.`),
    text: (c) => c.t(`"One last job," ${nm(c)} says. "Then we all retire somewhere with a beach."`, `"Son bir iş," diyor ${nm(c)}. "Sonra hepimiz deniz kenarında bir yerde emekli oluruz."`),
    choices: [
      {
        id: 'last',
        label: (c) => c.t('One last job', 'Son bir iş'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5 - heatOf(c) / 300)) {
            const take = wage(c, c.rng.int(10000, 35000));
            c.h.money(take);
            gotAway(c, 'robbery', take, 30);
            return c.t(
              `It actually went smoothly. Your share was ${c.h.fmt(take)}. Nobody has ever retired after the last job.`,
              `İş gerçekten de tıkırında gitti. Payına ${c.h.fmt(take)} düştü. Son işten sonra emekli olan da hiç görülmemiştir.`,
            );
          }
          return c.t('It was not the last job. It was the one that went wrong. ', 'Son iş değildi. Ters giden işti. ') + arrest(c, 'robbery');
        },
        tone: 'bad',
      },
      {
        id: 'refuse',
        label: (c) => c.t('Say you are done', 'Ben bu işleri bıraktım de'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.stat('happiness', 4);
          const partner = c.h.partner();
          if (partner) c.h.closeness(partner.person.id, 5);
          if (c.p.criminalRecord > 0) reform(c);
          return c.t(
            `You told ${nm(c)} you were done, then went home and fixed the kitchen tap. It felt better than any score.`,
            `${dat(nm(c))} bu işleri bıraktığını söyledin, sonra eve gidip mutfak musluğunu tamir ettin. Hiçbir vurgun bu kadar iyi hissettirmemişti.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'tip',
        label: (c) => c.t('Tip off the police', 'Polise ihbar et'),
        resolve: (c) => {
          const st = crimeState(c.p);
          c.h.unflag('gang');
          st.heat = 0;
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -6);
            return c.t('Someone left a dead fish on your doorstep the next morning. Message received.', 'Ertesi sabah kapının önünde ölü bir balık buldun. Mesaj alındı.');
          }
          c.h.stat('happiness', 2);
          return c.t(`${nm(c)} was arrested that week. You never told anyone it was you.`, `${nm(c)} o hafta tutuklandı. Onu senin ihbar ettiğini kimseye söylemedin.`);
        },
      },
    ],
  },
  {
    id: 'crime.redemption',
    category: 'crime',
    minAge: 21,
    maxAge: 80,
    weight: 50,
    cooldown: 4,
    // after "Not yet" the youth center waits a good while before asking again
    when: (c) =>
      free(c) &&
      c.p.criminalRecord > 0 &&
      !peekCrime(c.p)?.fugitive &&
      goneStraight(c, 2) &&
      !c.p.achievements.includes('reformed') &&
      !('crime_talk_later' in c.p.flags && c.s.year - c.p.flags.crime_talk_later < 10),
    title: (c) => c.t('The youth center wants you to give a talk.', 'Gençlik merkezi senden bir konuşma yapmanı istiyor.'),
    text: (c) => c.t('They need someone who has "been there" to talk to teenagers about bad decisions.', 'Gençlere kötü kararları anlatacak, "o yollardan geçmiş" birine ihtiyaçları var.'),
    choices: [
      {
        id: 'talk',
        label: (c) => c.t('Tell them your story', 'Hikâyeni anlat'),
        resolve: (c) => {
          reform(c);
          c.h.stat('happiness', 10);
          c.h.relatives(['mother', 'father', 'child']).forEach((r) => c.h.closeness(r.person.id, 8));
          crimeState(c.p).heat = 0;
          return c.t(
            'You told a room of teenagers about your worst decisions. One stayed behind to ask how you turned it around. You did not have a short answer, so you stayed for two hours.',
            'Bir salon dolusu gence en kötü kararlarını anlattın. Biri sonunda kalıp hayatını nasıl düzelttiğini sordu. Kısa bir cevabın yoktu, iki saat kaldın.',
          );
        },
        tone: 'good',
      },
      {
        id: 'decline',
        label: (c) => c.t('Not yet', 'Henüz değil'),
        resolve: (c) => {
          c.h.flag('crime_talk_later');
          return c.t('You said you were not ready. The coordinator left the door open.', 'Henüz hazır olmadığını söyledin. Koordinatör kapıyı açık bıraktı.');
        },
      },
    ],
  },
  {
    id: 'crime.attic',
    category: 'crime',
    minAge: 14,
    weight: 15,
    once: true,
    when: (c) => {
      const lg = peekCrime(c.p)?.legacy;
      return free(c) && !!lg && !lg.found;
    },
    setup: (c) => {
      const lg = crimeState(c.p).legacy!;
      c.vars.name = lg.name;
      c.vars.stash = lg.stash;
      c.vars.record = lg.record;
      // a small record leaves a small trace; only a real reputation fills a box with clippings (older saves: 3+ convictions)
      c.vars.famous = (lg.famous ?? lg.record >= 3) ? 1 : 0;
      // the parent handed over the torch and is still around (and can be asked)
      const parent = lg.id ? c.h.person(lg.id) : undefined;
      c.vars.alive = parent && parent.deathYear === undefined ? 1 : 0;
    },
    title: (c) => c.t('A shoebox in the attic.', 'Tavan arasında bir ayakkabı kutusu.'),
    text: (c) => {
      const n = String(c.vars.name);
      const what = Number(c.vars.record)
        ? Number(c.vars.famous ?? 1)
          ? c.t('newspaper clippings about the trial, every single one', 'davayla ilgili, tek tek kesilip saklanmış gazete kupürleri')
          : c.t('an old court letter folded very small, and the receipt for a fine', 'çok küçük katlanmış eski bir mahkeme yazısı ve bir para cezası makbuzu')
        : c.t('newspaper clippings about an unsolved robbery, circled in red', 'çözülemeyen bir soygunla ilgili, kırmızı kalemle daire içine alınmış gazete kupürleri');
      return Number(c.vars.stash)
        ? c.t(`Under ${n}'s old coats: ${what}, and a bundle of cash wrapped in a tea towel.`, `${gen(n)} eski paltolarının altında ${what} ve bir mutfak bezine sarılmış bir tomar para var.`)
        : c.t(`Under ${n}'s old coats: ${what}.`, `${gen(n)} eski paltolarının altında ${what} var.`);
    },
    choices: [
      {
        id: 'keep',
        label: (c) => (Number(c.vars.stash) ? c.t('Keep the money', 'Parayı al') : c.t(`Keep ${papers(c)[0]}`, `${papers(c)[1]} sakla`)),
        resolve: (c) => {
          const lg = crimeState(c.p).legacy!;
          lg.found = true;
          const stash = Number(c.vars.stash);
          if (stash) {
            c.h.money(stash);
            c.h.stat('happiness', 4);
            return c.t(`You kept the ${c.h.fmt(stash)}. Some family traditions are harder to break than others.`, `Paranın hepsini aldın: ${c.h.fmt(stash)}. Bazı aile gelenekleri ötekilerden daha zor bozuluyor.`);
          }
          if (Number(c.vars.alive)) {
            return c.t(
              `You put ${papers(c)[0]} back exactly where you found them. You have not said a word to ${c.vars.name}. Yet.`,
              `${papers(c)[1]} bulduğun yere, aynen bulduğun gibi geri koydun. ${dat(String(c.vars.name))} henüz tek kelime etmedin.`,
            );
          }
          return c.t(
            `You put ${papers(c)[0]} in a drawer. Sometimes you read them and wonder who ${c.vars.name} really was.`,
            `${papers(c)[1]} bir çekmeceye koydun. Bazen okuyup ${gen(String(c.vars.name))} aslında kim olduğunu düşünüyorsun.`,
          );
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask the family about it', 'Aileye sor'),
        resolve: (c) => {
          crimeState(c.p).legacy!.found = true;
          c.h.relatives(['mother', 'father', 'sibling']).forEach((r) => c.h.closeness(r.person.id, 5));
          c.h.stat('happiness', 3);
          return c.t(
            'At dinner you asked about the box. Everyone went silent, then your aunt laughed until she cried, and the stories went on all night.',
            'Akşam yemeğinde kutuyu sordun. Herkes sustu, sonra teyzen gözünden yaş gelene kadar güldü ve hikâyeler sabaha kadar sürdü.',
          );
        },
        tone: 'good',
      },
      {
        id: 'donate',
        label: (c) => (Number(c.vars.stash) ? c.t('Give the money away', 'Parayı bağışla') : c.t(`Burn ${papers(c)[0]}`, `${papers(c)[1]} yak`)),
        resolve: (c) => {
          crimeState(c.p).legacy!.found = true;
          const n = String(c.vars.name);
          if (Number(c.vars.stash)) {
            c.h.stat('happiness', 8);
            return c.t(`You gave every note to the children's hospital, anonymously. It seemed like the least ${n} owed the world.`, `Paranın tamamını isimsiz olarak çocuk hastanesine bağışladın. ${gen(n)} dünyaya olan borcunun en azı buydu.`);
          }
          c.h.stat('happiness', -1);
          return c.t(`You burned ${papers(c)[0]} in the garden. Some stories should end with you.`, `${papers(c)[1]} bahçede yaktın. Bazı hikâyeler seninle bitmeli.`);
        },
      },
    ],
  },
];
