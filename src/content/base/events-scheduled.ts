import type { ChoiceDef, Ctx, EventDef } from '../types';
import { eligibleJobs, nm, wage, wth } from './util';
import { firstNames } from '../../engine/world';
import { titleFor } from '../../engine/careers';

// Events opened by the engine at life-stage moments or by activities. They never fire at random.

const VIBES_EN = ['makes you laugh until you snort', 'is a little too into crypto', 'brought you a flower', 'talked about their ex for an hour', 'knows every bird by name'];
const VIBES_TR = [
  'seni gülmekten domuz gibi horlatıyor',
  'kriptoya biraz fazla kafayı takmış',
  'sana bir çiçek getirdi',
  'bir saat boyunca eski sevgilisini anlattı',
  'her kuşu adıyla tanıyor',
];
const vibeTr = (en: string) => VIBES_TR[VIBES_EN.indexOf(en)] ?? en;

const jobChoice = (i: number): ChoiceDef => ({
  id: `job${i}`,
  label: (c) => (c.vars[`job${i}`] ? c.t(`${c.vars[`title${i}`]}`, `${c.vars[`titleTr${i}`] ?? c.vars[`title${i}`]}`) : '—'),
  badge: undefined,
  requires: (c) => !!c.vars[`job${i}`],
  requiresLabel: 'No opening',
  resolve: (c: Ctx) => {
    const id = String(c.vars[`job${i}`]);
    const chance = 0.35 + c.p.stats.smarts / 250 + c.p.stats.looks / 500 - (c.p.criminalRecord > 0 ? 0.2 : 0);
    if (c.rng.chance(chance)) {
      c.h.setJob(id);
      c.h.stat('happiness', 6);
      return c.t(`You got the job! You are now a ${c.h.jobTitle()}.`, `İşi kaptın! Artık ${c.h.jobTitle()} olarak çalışıyorsun.`);
    }
    c.h.stat('happiness', -3);
    return c.t(
      `You interviewed for ${c.vars[`title${i}`]} but they went with someone else.`,
      `${c.vars[`titleTr${i}`] ?? c.vars[`title${i}`]} pozisyonu için mülakata girdin ama başkasını seçtiler.`,
    );
  },
});

const nameChoice = (i: number): ChoiceDef => ({
  id: `name${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const gender = c.vars.gender === 'female' ? 'female' : 'male';
    const baby = c.h.newPerson({ age: 0, gender, lastName: c.p.lastName });
    baby.firstName = String(c.vars[`name${i}`]);
    c.h.addRelation(baby, 'child', 90);
    c.h.stat('happiness', 12);
    c.h.achieve('parent');
    return c.t(
      `You had a baby ${gender === 'female' ? 'girl' : 'boy'}, ${baby.firstName}! Gen ${c.s.dynasty.generation + 1} of the ${c.s.dynasty.familyName} family has arrived.`,
      `${gender === 'female' ? 'Bir kızın' : 'Bir oğlun'} oldu: ${baby.firstName}! ${c.s.dynasty.familyName} ailesinin ${c.s.dynasty.generation + 1}. kuşağı dünyaya geldi.`,
    );
  },
  tone: 'big',
});

export const scheduledEvents: EventDef[] = [
  {
    id: 'base.after_highschool',
    category: 'milestone',
    scheduled: true,
    title: (c) => c.t('High school is over. What now?', 'Lise bitti. Şimdi ne olacak?'),
    text: (c) =>
      c.t(
        'Everyone has an opinion about your future. Especially your relatives.',
        'Geleceğin hakkında herkesin bir fikri var. Özellikle de akrabaların.',
      ),
    choices: [
      {
        id: 'uni',
        label: (c) => c.t('Go to university', 'Üniversiteye git'),
        badge: undefined,
        resolve: (c) => {
          c.p.school = 'university';
          c.p.schoolYears = 0;
          if (c.p.stats.smarts >= 80 || c.h.has('scholarship')) {
            c.h.flag('scholarship');
            return c.t('You got into university with a full scholarship!', 'Üniversiteyi tam bursla kazandın!');
          }
          return c.t('You enrolled at university. Tuition is not cheap.', 'Üniversiteye kaydoldun. Harçlar hiç ucuz değil.');
        },
        tone: 'good',
      },
      {
        id: 'work',
        label: (c) => c.t('Start working', 'Çalışmaya başla'),
        resolve: (c) => c.t('You decided to start working. Time to find a job.', 'Çalışmaya karar verdin. İş bulma vakti.'),
      },
      {
        id: 'gap',
        label: (c) => c.t('Take a gap year and travel', 'Bir yıl ara ver ve gez'),
        resolve: (c) => {
          c.h.money(-wage(c, 2500));
          c.h.stat('happiness', 10);
          c.h.stat('smarts', 2);
          return c.t(
            'You backpacked across the continent and came back with a tan and a philosophy.',
            'Sırt çantanla kıtayı boydan boya gezdin, bronz bir ten ve bir hayat felsefesiyle döndün.',
          );
        },
      },
    ],
  },
  {
    id: 'base.retirement',
    category: 'work',
    scheduled: true,
    title: (c) =>
      c.t('You are 65. Your company offers you a retirement party.', '65 yaşındasın. Şirketin sana emeklilik partisi veriyor.'),
    text: (c) =>
      c.t(
        `After ${c.p.jobYears} years, your colleagues have already bought the cake.`,
        `${c.p.jobYears} yılın ardından iş arkadaşların pastayı çoktan almış bile.`,
      ),
    choices: [
      {
        id: 'retire',
        label: (c) => c.t('Retire', 'Emekli ol'),
        resolve: (c) => {
          c.p.retired = true;
          const title = c.h.jobTitle();
          c.p.jobId = null;
          c.p.jobTitle = title;
          c.h.stat('happiness', 10);
          return c.t(
            `You retired as ${title}. The cake was lemon. You hate lemon.`,
            `${title} olarak emekli oldun. Pasta limonluydu. Limondan nefret edersin.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep working', 'Çalışmaya devam et'),
        resolve: (c) =>
          c.t(
            'You told them to eat the cake without you. You have work to do.',
            'Pastayı sensiz yemelerini söyledin. Daha yapacak işin var.',
          ),
      },
    ],
  },
  {
    id: 'base.job_search',
    category: 'work',
    scheduled: true,
    setup: (c) => {
      const options = [...eligibleJobs(c)].sort(() => c.rng.next() - 0.5).slice(0, 3);
      options.forEach((j, i) => {
        c.vars[`job${i}`] = j.id;
        c.vars[`title${i}`] = j.titles[0];
        c.vars[`titleTr${i}`] = titleFor(j, 0, 'tr');
      });
    },
    title: (c) => c.t('Job listings this week', 'Bu haftanın iş ilanları'),
    text: (c) =>
      c.vars.job0
        ? c.t('Pick one to apply for.', 'Başvurmak için birini seç.')
        : c.t('Nothing matches your education right now.', 'Şu an eğitimine uygun bir ilan yok.'),
    choices: [
      jobChoice(0),
      jobChoice(1),
      jobChoice(2),
      { id: 'none', label: (c) => c.t('Keep looking later', 'Sonra yine bakarsın'), resolve: () => '' },
    ],
  },
  {
    id: 'base.date_match',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      const g = c.p.gender === 'female' ? 'male' : 'female';
      c.vars.pid = c.h.newPerson({ gender: g, age: Math.max(18, c.age + c.rng.int(-5, 5)) }).id;
      c.vars.vibe = c.rng.pick(VIBES_EN);
    },
    title: (c) => c.t(`You went on a date with ${nm(c)}.`, `${wth(nm(c))} randevuya çıktın.`),
    text: (c) => c.t(`${nm(c)} ${c.vars.vibe}.`, `${nm(c)} ${vibeTr(String(c.vars.vibe))}.`),
    choices: [
      {
        id: 'again',
        label: (c) => c.t('Ask for a second date', 'İkinci randevu iste'),
        resolve: (c) => {
          const them = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.3 + c.p.stats.looks / 250 + c.p.stats.happiness / 500)) {
            c.h.addRelation(them, 'partner', c.rng.int(55, 80));
            c.h.stat('happiness', 8);
            return c.t(`You and ${them.firstName} are officially together!`, `${wth(them.firstName)} artık resmen sevgilisiniz!`);
          }
          c.h.stat('happiness', -4);
          return c.t(`${them.firstName} said it was nice, but... no.`, `${them.firstName} "Güzeldi ama... yok" dedi.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Not my type', 'Bana göre değil'),
        resolve: (c) =>
          c.t(
            `You and ${nm(c)} split the bill and went your separate ways.`,
            `${wth(nm(c))} hesabı bölüştünüz ve herkes kendi yoluna gitti.`,
          ),
      },
    ],
  },
  {
    id: 'base.proposal',
    category: 'love',
    scheduled: true,
    setup: (c) => {
      c.vars.pid = c.h.relatives('partner')[0].person.id;
    },
    title: (c) => c.t(`You are about to propose to ${nm(c)}.`, `${nm(c)} için diz çökmek üzeresin.`),
    text: (c) => c.t('Your hands are shaking.', 'Ellerin titriyor.'),
    choices: [
      {
        id: 'grand',
        label: (c) => c.t('A big romantic gesture', 'Büyük, romantik bir sürpriz'),
        badge: 'Costs more',
        resolve: (c) => propose(c, 0.15, wage(c, 3000)),
      },
      { id: 'simple', label: (c) => c.t('A quiet dinner at home', 'Evde sakin bir akşam yemeği'), resolve: (c) => propose(c, 0, wage(c, 200)) },
    ],
  },
  {
    id: 'base.baby_name',
    category: 'family',
    scheduled: true,
    setup: (c) => {
      const g = c.rng.chance(0.5) ? 'female' : 'male';
      c.vars.gender = g;
      const pool = [...firstNames(c.p.countryId, g)].sort(() => c.rng.next() - 0.5);
      for (let i = 0; i < 3; i++) c.vars[`name${i}`] = pool[i];
    },
    title: (c) =>
      c.t(
        `It's a ${c.vars.gender === 'female' ? 'girl' : 'boy'}! What will you name your baby?`,
        `Müjde, ${c.vars.gender === 'female' ? 'kız' : 'oğlan'}! Bebeğine hangi ismi koyacaksın?`,
      ),
    text: (c) => c.t('The nurse is waiting with a pen.', 'Hemşire elinde kalemle bekliyor.'),
    choices: [nameChoice(0), nameChoice(1), nameChoice(2)],
  },
];

function propose(c: Ctx, bonus: number, cost: number): string {
  const pid = String(c.vars.pid);
  const rel = c.p.relations.find((r) => r.personId === pid)!;
  c.h.money(-cost);
  if (c.rng.chance(rel.closeness / 100 + 0.15 + bonus)) {
    c.h.setKind(pid, 'spouse');
    c.h.stat('happiness', 12);
    c.h.achieve('married');
    let line = c.t(`${nm(c)} said yes! You got married.`, `${nm(c)} evet dedi! Evlendiniz.`);
    if (c.h.hasHeirloom('ring')) {
      const ring = c.s.dynasty.heirlooms.find((x) => x.defId === 'ring')!;
      c.h.closeness(pid, 15);
      ring.story.push(c.t(`Worn by ${nm(c)} at the wedding in ${c.s.year}.`, `${c.s.year} yılındaki düğünde ${nm(c)} taktı.`));
      line = c.t(
        `${nm(c)} said yes! You married with ${ring.name}. It finally found a new finger.`,
        `${nm(c)} evet dedi! ${ring.name} ile evlendiniz. Yüzük nihayet yeni bir parmağa kavuştu.`,
      );
    }
    return line;
  }
  c.h.closeness(pid, -15);
  c.h.stat('happiness', -12);
  return c.t(
    `${nm(c)} said "I need more time." The dessert went uneaten.`,
    `${nm(c)} "Biraz daha zamana ihtiyacım var" dedi. Tatlıya kimse dokunmadı.`,
  );
}
