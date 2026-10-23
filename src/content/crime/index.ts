import type { ContentPack, Ctx, EventDef, ActivityDef } from '../types';
import { wage } from '../base/util';

// "Crime World" expansion (18+). Bundled with the app, unlocked by purchase + adult-content opt-in.
// Tone: satirical with real consequences (prison, lost jobs, broken relationships). No real-world how-to.

export const CRIME_ENTITLEMENT = 'pack.crime_world';

function convict(c: Ctx, years: number, crime: string, crimeTr: string): string {
  c.p.jailYears = years;
  c.p.criminalRecord++;
  const title = c.h.jobTitle();
  if (c.p.jobId) c.h.setJob(null);
  c.h.stat('happiness', -15);
  c.h.relatives(['mother', 'father']).forEach((r) => c.h.closeness(r.person.id, -15));
  const partner = c.h.partner();
  let extra = '';
  if (partner && c.rng.chance(0.4)) {
    c.h.setKind(partner.person.id, 'ex');
    extra = c.t(` ${partner.person.firstName} left you.`, ` ${partner.person.firstName} seni terk etti.`);
  }
  return c.t(
    `You were convicted of ${crime} and sentenced to ${years} year${years > 1 ? 's' : ''} in prison.${title ? ` You lost your job as ${title}.` : ''}${extra}`,
    `${crimeTr} suçundan mahkûm oldun ve ${years} yıl hapis cezası aldın.${title ? ` ${title} olarak çalıştığın işten kovuldun.` : ''}${extra}`,
  );
}

const events: EventDef[] = [
  {
    id: 'crime.burglary',
    category: 'crime',
    scheduled: true,
    title: (c) => c.t('The house on the corner is empty for the weekend.', 'Köşedeki ev hafta sonu boş.'),
    text: (c) => c.t('Your friend says the back door does not lock.', 'Arkadaşına göre arka kapı kilitlenmiyormuş.'),
    choices: [
      {
        id: 'careful',
        label: (c) => c.t('Wait until it is very late', 'Gecenin bir yarısını bekle'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            const take = wage(c, c.rng.int(1500, 9000));
            c.h.money(take);
            c.h.stat('happiness', -2);
            return c.t(
              `You got away with ${c.h.fmt(take)} in valuables. You jump every time a car slows down outside.`,
              `${c.h.fmt(take)} değerinde eşyayla sıvıştın. Dışarıda bir araba yavaşladığında yerinden zıplıyorsun.`,
            );
          }
          return convict(c, c.rng.int(1, 3), 'burglary', 'Ev soygunu');
        },
        tone: 'bad',
      },
      {
        id: 'backout',
        label: (c) => c.t('Back out', 'Vazgeç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You backed out at the last second. Your friend got caught that night.', 'Son saniyede caydın. Arkadaşın o gece enselendi.');
        },
      },
    ],
  },
  {
    id: 'crime.gang_offer',
    category: 'crime',
    minAge: 18,
    maxAge: 40,
    weight: 6,
    once: true,
    when: (c) => c.p.criminalRecord > 0 || c.p.money < 0,
    title: (c) => c.t('A man in a nice coat says he has "work" for someone like you.', 'Şık paltolu bir adam, senin gibi birine uygun bir "iş"i olduğunu söylüyor.'),
    text: (c) => c.t('He knows your name. And your mother\'s address.', 'Adını biliyor. Annenin adresini de.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Take the work', 'İşi kabul et'),
        badge: 'No way back',
        resolve: (c) => {
          c.h.flag('gang');
          c.h.money(wage(c, 5000));
          c.h.stat('happiness', -4);
          return c.t('You joined the crew. The money is good. The sleep is not.', 'Çeteye katıldın. Para iyi. Uyku o kadar değil.');
        },
        tone: 'bad',
      },
      { id: 'refuse', label: (c) => c.t('Walk away', 'Arkanı dön ve git'), resolve: (c) => c.t('You walked away. He smiled like he would see you again.', 'Arkanı dönüp gittin. Adam, yine görüşeceğiz der gibi gülümsedi.') },
    ],
  },
  {
    id: 'crime.gang_job',
    category: 'crime',
    minAge: 18,
    cooldown: 2,
    when: (c) => c.h.has('gang') && c.p.jailYears === 0,
    title: (c) => c.t('The crew needs a driver tonight.', 'Çetenin bu gece bir şoföre ihtiyacı var.'),
    text: (c) => c.t('No questions. Double the usual cut.', 'Soru sormak yok. Payın her zamankinin iki katı.'),
    choices: [
      {
        id: 'drive',
        label: (c) => c.t('Drive', 'Direksiyona geç'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.money(wage(c, 12000));
            return c.t('The job went smoothly. You counted the money with shaking hands.', 'İş tıkırında gitti. Parayı titreyen ellerle saydın.');
          }
          return convict(c, c.rng.int(3, 8), 'armed robbery', 'Silahlı soygun');
        },
      },
      {
        id: 'out',
        label: (c) => c.t('Tell them you are out', 'Bu işte yokum de'),
        resolve: (c) => {
          c.h.unflag('gang');
          c.h.stat('health', -10);
          return c.t('You told them you were out. They made sure you would remember the conversation.', 'Artık yokum dedin. O konuşmayı asla unutmayacağından emin oldular.');
        },
      },
    ],
  },
  {
    id: 'crime.prison_fight',
    category: 'crime',
    when: (c) => c.p.jailYears > 0,
    title: (c) => c.t('Your cellmate wants your dessert. Every day.', 'Koğuş arkadaşın tatlını istiyor. Her gün.'),
    text: (c) => c.t('Others are watching to see what you do.', 'Herkes ne yapacağını görmek için izliyor.'),
    choices: [
      {
        id: 'fight',
        label: (c) => c.t('Stand up for yourself', 'Kendini savun'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t('You stood your ground. Nobody touches your dessert now.', 'Geri adım atmadın. Artık kimse tatlına dokunamıyor.');
          }
          c.h.stat('health', -12);
          c.p.jailYears++;
          return c.t('The fight went badly and the guards added a year to your sentence.', 'Kavga kötü bitti, gardiyanlar cezana bir yıl ekletti.');
        },
      },
      {
        id: 'give',
        label: (c) => c.t('Hand it over', 'Ver gitsin'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return c.t('You handed it over. You have not tasted pudding in months.', 'Tatlıyı verdin. Aylardır ağzına sütlaç koymadın.');
        },
      },
    ],
  },
  {
    id: 'crime.prison_class',
    category: 'crime',
    when: (c) => c.p.jailYears > 0,
    title: (c) => c.t('The prison library offers evening classes.', 'Cezaevi kütüphanesinde akşam kursları açılmış.'),
    text: (c) => c.t('A retired teacher volunteers every Tuesday.', 'Emekli bir öğretmen her salı gönüllü ders veriyor.'),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Sign up', 'Kaydol'),
        resolve: (c) => {
          c.h.stat('smarts', 6);
          if (c.p.education === 'none' || c.p.education === 'primary') {
            c.p.education = 'highschool';
            return c.t('You earned your high school diploma behind bars. The teacher cried.', 'Parmaklıklar ardında lise diplomanı aldın. Öğretmen ağladı.');
          }
          return c.t('You took a literature class and wrote a poem the warden pinned on his wall.', 'Edebiyat dersine girdin ve müdürün duvarına astığı bir şiir yazdın.');
        },
        tone: 'good',
      },
      {
        id: 'skip',
        label: (c) => c.t('Spend the time in the yard', 'Vaktini havalandırmada geçir'),
        resolve: (c) => (c.h.stat('health', 2), c.t('You did push-ups in the yard instead.', 'Onun yerine havalandırmada şınav çektin.')),
      },
    ],
  },
  {
    id: 'crime.parole',
    category: 'crime',
    when: (c) => c.p.jailYears >= 2,
    title: (c) => c.t('Your parole hearing is today.', 'Bugün şartlı tahliye duruşman var.'),
    text: (c) => c.t('Three people behind a table will decide your next years.', 'Masanın arkasındaki üç kişi önümüzdeki yıllarına karar verecek.'),
    choices: [
      {
        id: 'remorse',
        label: (c) => c.t('Show genuine remorse', 'İçtenlikle pişmanlığını göster'),
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            c.p.jailYears = 0;
            c.h.stat('happiness', 15);
            return c.t('Parole granted. You walked out into the sunlight.', 'Şartlı tahliye kabul edildi. Kapıdan güneşe doğru yürüdün.');
          }
          return c.t('Parole denied. Back to your cell.', 'Şartlı tahliye reddedildi. Koğuşa geri dön.');
        },
      },
      { id: 'silent', label: (c) => c.t('Say nothing', 'Hiçbir şey söyleme'), resolve: (c) => c.t('You said nothing. Parole denied.', 'Tek kelime etmedin. Şartlı tahliye reddedildi.') },
    ],
  },
];

const activities: ActivityDef[] = [
  {
    id: 'shoplift',
    label: (c) => c.t('Shoplift', 'Mağazadan bir şey arakla'),
    description: (c) => c.t('Small risk, small reward', 'Küçük risk, küçük ödül'),
    group: 'After dark',
    minAge: 12,
    available: (c) => c.p.jailYears === 0,
    run: (c) => {
      if (c.rng.chance(0.65)) {
        const v = wage(c, c.rng.int(20, 150));
        c.h.money(v);
        return c.t(`You walked out with ${c.h.fmt(v)} worth of stuff under your jacket.`, `Montunun altında ${c.h.fmt(v)} değerinde eşyayla dışarı çıktın.`);
      }
      if (c.age < 18) {
        c.h.stat('happiness', -6);
        c.p.criminalRecord++;
        return c.t('You were caught shoplifting. Your parents had to pick you up from the police station.', 'Mağazada suçüstü yakalandın. Ailen seni karakoldan almak zorunda kaldı.');
      }
      return c.rng.chance(0.4)
        ? convict(c, 1, 'theft', 'Hırsızlık')
        : (c.h.money(-wage(c, 400)), c.t('You were caught shoplifting and paid a heavy fine.', 'Mağazada suçüstü yakalandın ve tuzlu bir para cezası ödedin.'));
    },
  },
  {
    id: 'burglary',
    label: (c) => c.t('Burgle a house', 'Ev soy'),
    description: (c) => c.t('High risk, high reward', 'Yüksek risk, yüksek ödül'),
    group: 'After dark',
    minAge: 18,
    available: (c) => c.p.jailYears === 0,
    run: () => ({ event: 'crime.burglary' }),
  },
];

export const crimePack: ContentPack = {
  id: 'crime_world',
  title: 'Crime World',
  description: 'Gangs, heists, trials and prison life. Every choice has a cost, and your family remembers.',
  rating: 'mature',
  entitlement: CRIME_ENTITLEMENT,
  events,
  activities,
};
