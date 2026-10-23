import type { ActivityDef } from '../types';
import { acc, cap, kin, loc, single, wage, wth } from './util';

export const baseActivities: ActivityDef[] = [
  // ------------------------------------------------ Mind & Body
  {
    id: 'gym',
    label: (c) => c.t('Go to the gym', 'Spor salonuna git'),
    description: (c) => c.t('+Health, +Looks', '+Sağlık, +Görünüş'),
    group: 'Mind & Body',
    minAge: 12,
    perYear: 2,
    run: (c) => {
      if (c.rng.chance(0.06)) {
        c.h.stat('health', -4);
        return c.t('You dropped a dumbbell on your foot at the gym.', 'Spor salonunda dambılı ayağına düşürdün.');
      }
      c.h.stat('health', c.rng.int(3, 6));
      c.h.stat('looks', 1);
      const i = c.rng.int(0, 2);
      return c.t(
        ['You had a great workout.', 'You lifted heavier than ever.', 'You ran 5 km without stopping.'][i],
        ['Harika bir antrenman yaptın.', 'Hayatında kaldırdığın en ağır ağırlığı kaldırdın.', 'Hiç durmadan 5 km koştun.'][i],
      );
    },
  },
  {
    id: 'library',
    label: (c) => c.t('Read at the library', 'Kütüphanede kitap oku'),
    description: (c) => c.t('+Smarts', '+Zekâ'),
    group: 'Mind & Body',
    minAge: 6,
    perYear: 2,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(2, 4));
      const i = c.rng.int(0, 2);
      return c.t(
        [
          'You read a book about black holes.',
          'You read a dusty history of your city.',
          'You fell asleep on a philosophy book, but some of it went in.',
        ][i],
        [
          'Kara delikler hakkında bir kitap okudun.',
          'Şehrinin tozlu bir tarih kitabını okudun.',
          'Bir felsefe kitabının üstünde uyuyakaldın ama bir kısmı yine de kafana girdi.',
        ][i],
      );
    },
  },
  {
    id: 'meditate',
    label: (c) => c.t('Meditate', 'Meditasyon yap'),
    description: (c) => c.t('+Happiness', '+Mutluluk'),
    group: 'Mind & Body',
    minAge: 10,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 8));
      return c.t(
        'You meditated for an hour. Your mind is a calm lake. With one duck.',
        'Bir saat meditasyon yaptın. Zihnin durgun bir göl gibi. Üstünde tek bir ördek var.',
      );
    },
  },
  {
    id: 'doctor',
    label: (c) => c.t('See a doctor', 'Doktora görün'),
    description: (c) => c.t('+Health', '+Sağlık'),
    group: 'Mind & Body',
    minAge: 0,
    run: (c) => {
      if (c.age >= 18) c.h.money(-wage(c, 300));
      c.h.stat('health', c.rng.int(6, 12));
      return c.t('The doctor gave you vitamins and a lecture.', 'Doktor sana vitamin ve uzun bir nasihat verdi.');
    },
  },
  {
    id: 'salon',
    label: (c) => c.t('Get a makeover', 'Tarzını yenile'),
    description: (c) => c.t('+Looks', '+Görünüş'),
    group: 'Mind & Body',
    minAge: 14,
    run: (c) => {
      c.h.money(-wage(c, 120));
      c.h.stat('looks', c.rng.int(3, 6));
      return c.t(
        'You got a fresh haircut. You keep catching your reflection.',
        'Saçlarını yeni kestirdin. Her vitrinde kendine bakıp duruyorsun.',
      );
    },
  },

  // ------------------------------------------------ Love
  {
    id: 'date',
    label: (c) => c.t('Go on a date', 'Randevuya çık'),
    description: (c) => c.t('Meet someone new', 'Yeni biriyle tanış'),
    group: 'Love',
    minAge: 16,
    available: (c) => single(c) && c.p.jailYears === 0,
    run: () => ({ event: 'base.date_match' }),
  },
  {
    id: 'partner_time',
    label: (c) => c.t('Spend time with your partner', 'Sevdiğinle vakit geçir'),
    description: (c) => c.t('+Love', '+Aşk'),
    group: 'Love',
    minAge: 16,
    available: (c) => !!c.h.partner(),
    run: (c) => {
      const p = c.h.partner()!;
      c.h.closeness(p.person.id, 8);
      c.h.stat('happiness', 3);
      const n = p.person.firstName;
      const i = c.rng.int(0, 2);
      return c.t(
        [`You and ${n} cooked dinner together.`, `You took ${n} to the seaside.`, `You and ${n} binge-watched a terrible show.`][i],
        [`${wth(n)} birlikte akşam yemeği yaptınız.`, `${acc(n)} deniz kenarına götürdün.`, `${wth(n)} berbat bir diziyi bir oturuşta bitirdiniz.`][i],
      );
    },
  },
  {
    id: 'propose',
    label: (c) => c.t('Propose', 'Evlenme teklif et'),
    description: (c) => c.t('Ask your partner to marry you', 'Diz çök, yüzüğü çıkar'),
    group: 'Love',
    minAge: 18,
    available: (c) => c.h.relatives('partner').length > 0 && c.s.year - c.h.relatives('partner')[0].rel.sinceYear >= 1,
    run: () => ({ event: 'base.proposal' }),
  },
  {
    id: 'baby',
    label: (c) => c.t('Try for a baby', 'Bebek yapmayı dene'),
    description: (c) => c.t('Grow the family', 'Aileyi büyüt'),
    group: 'Love',
    minAge: 20,
    maxAge: 55,
    available: (c) => {
      const p = c.h.partner();
      if (!p) return false;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      return (c.p.gender === 'female' || p.person.gender === 'female') && herAge <= 45;
    },
    run: (c) => {
      const p = c.h.partner()!;
      const herAge = c.p.gender === 'female' ? c.age : c.h.ageOf(p.person);
      if (c.rng.chance(herAge < 35 ? 0.6 : 0.35)) return { event: 'base.baby_name' };
      return c.t('No baby news this year. Maybe next year.', 'Bu yıl bebek haberi yok. Belki seneye.');
    },
  },

  // ------------------------------------------------ Family
  {
    id: 'call_parents',
    label: (c) => c.t('Call your parents', 'Anneni babanı ara'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 8,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    run: (c) => {
      const ps = c.h.relatives(['mother', 'father']);
      ps.forEach((r) => c.h.closeness(r.person.id, 6));
      const r = ps[0];
      const k = kin(c, r.person, r.rel.kind);
      return c.t(
        `You called your ${k}. ${r.person.firstName} talked for an hour about the neighbors.`,
        `${r.rel.kind === 'mother' ? 'Anneni' : 'Babanı'} aradın. ${r.person.firstName} bir saat boyunca komşuları anlattı.`,
      );
    },
  },
  {
    id: 'siblings',
    label: (c) => c.t('Hang out with siblings', 'Kardeşlerinle takıl'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 6,
    available: (c) => c.h.relatives('sibling').length > 0,
    run: (c) => {
      const s = c.rng.pick(c.h.relatives('sibling'));
      c.h.closeness(s.person.id, 8);
      c.h.stat('happiness', 2);
      const k = kin(c, s.person, 'sibling');
      return c.t(
        `You and your ${k} ${s.person.firstName} played old video games all night.`,
        `${cap(k)} ${wth(s.person.firstName)} bütün gece eski video oyunları oynadınız.`,
      );
    },
  },
  {
    id: 'kids',
    label: (c) => c.t('Spend time with your kids', 'Çocuklarınla vakit geçir'),
    description: (c) => c.t('+Family closeness', '+Aile bağı'),
    group: 'Family',
    minAge: 18,
    available: (c) => c.h.relatives('child').length > 0,
    run: (c) => {
      c.h.relatives('child').forEach((k) => c.h.closeness(k.person.id, 6));
      c.h.stat('happiness', 4);
      return c.t(
        'You took the kids to the park. Somebody ended up in the fountain.',
        'Çocukları parka götürdün. Biri kendini fıskiyeli havuzun içinde buldu.',
      );
    },
  },

  // ------------------------------------------------ Career
  {
    id: 'job_search',
    label: (c) => c.t('Look for a job', 'İş ara'),
    description: (c) => c.t('Browse job listings', 'İş ilanlarına göz at'),
    group: 'Career',
    minAge: 16,
    available: (c) => c.p.jailYears === 0 && !c.p.retired && c.p.school !== 'primary',
    run: () => ({ event: 'base.job_search' }),
  },
  {
    id: 'work_hard',
    label: (c) => c.t('Work extra hard', 'Canını dişine tak'),
    description: (c) => c.t('Better promotion odds, −Health', 'Terfi şansı artar, −Sağlık'),
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      c.h.stat('health', -2);
      if (c.rng.chance(0.2 + c.p.stats.smarts / 400) && c.h.promote()) {
        c.h.stat('happiness', 6);
        return c.t(
          `Your hard work paid off. You were promoted to ${c.h.jobTitle()}!`,
          `Emeklerin karşılıksız kalmadı. ${c.h.jobTitle()} pozisyonuna terfi ettin!`,
        );
      }
      return c.t(
        'You stayed late every night this month. Your boss nodded at you once.',
        'Bu ay her gece mesaiye kaldın. Patronun sana bir kere başıyla selam verdi.',
      );
    },
  },
  {
    id: 'university',
    label: (c) => c.t('Go to university', 'Üniversiteye git'),
    description: (c) => c.t('A 4-year degree', '4 yıllık lisans'),
    group: 'Career',
    minAge: 18,
    maxAge: 45,
    available: (c) => c.p.education === 'highschool' && c.p.school === null && c.p.jailYears === 0,
    run: (c) => {
      c.p.school = 'university';
      c.p.schoolYears = 0;
      if (c.p.stats.smarts >= 80) {
        c.h.flag('scholarship');
        return c.t('You enrolled at university with a scholarship.', 'Üniversiteye burslu kaydoldun.');
      }
      return c.t('You enrolled at university. Back to cheap noodles.', 'Üniversiteye kaydoldun. Yeniden hazır noodle günlerine dönüş.');
    },
  },
  {
    id: 'quit',
    label: (c) => c.t('Quit your job', 'İstifa et'),
    description: (c) => c.t('Walk out', 'Kapıyı çarpıp çık'),
    group: 'Career',
    minAge: 16,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.h.setJob(null);
      c.h.stat('happiness', 4);
      return c.t(
        `You quit your job as ${title}. It felt amazing for about a day.`,
        `${title} olarak çalıştığın işten istifa ettin. Yaklaşık bir gün boyunca harika hissettirdi.`,
      );
    },
  },
  {
    id: 'retire',
    label: (c) => c.t('Retire', 'Emekli ol'),
    description: (c) => c.t('Live on your pension', 'Emekli maaşıyla yaşa'),
    group: 'Career',
    minAge: 60,
    available: (c) => !!c.p.jobId,
    run: (c) => {
      const title = c.h.jobTitle();
      c.p.retired = true;
      c.p.jobId = null;
      c.p.jobTitle = title;
      c.h.stat('happiness', 8);
      return c.t(`You retired as ${title}.`, `${title} olarak emekli oldun.`);
    },
  },

  // ------------------------------------------------ Money
  {
    id: 'buy_home',
    label: (c) => c.t('Buy a home', 'Ev satın al'),
    description: (c) => c.t('Stop paying rent', 'Kiraya son ver'),
    group: 'Money',
    minAge: 20,
    available: (c) => !c.p.home.owned && c.p.money >= wage(c, 120000),
    run: (c) => {
      const price = wage(c, 120000);
      c.h.money(-price);
      c.p.home = {
        name: c.t(`Your flat in ${c.p.city}`, `${loc(c.p.city)}ki dairen`),
        value: price,
        owned: true,
        furniture: c.p.home.furniture,
      };
      c.h.stat('happiness', 10);
      c.h.achieve('homeowner');
      return c.t(
        `You bought a flat in ${c.p.city} for ${c.h.fmt(price)}. It's yours. All yours. Including the leaky tap.`,
        `${loc(c.p.city)} ${c.h.fmt(price)} vererek bir daire aldın. Senin. Tamamen senin. Damlatan musluğu da dahil.`,
      );
    },
  },
  {
    id: 'lottery',
    label: (c) => c.t('Buy a lottery ticket', 'Piyango bileti al'),
    description: (c) => c.t('Feeling lucky?', 'Şansına güveniyor musun?'),
    group: 'Money',
    minAge: 18,
    perYear: 3,
    run: (c) => {
      c.h.money(-wage(c, 5));
      if (c.rng.chance(1 / 4000)) {
        const prize = wage(c, 1_000_000);
        c.h.money(prize);
        c.h.achieve('jackpot');
        return c.t(`YOU WON THE JACKPOT! ${c.h.fmt(prize)}!`, `BÜYÜK İKRAMİYE ÇIKTI! ${c.h.fmt(prize)}!`);
      }
      if (c.rng.chance(1 / 40)) {
        c.h.money(wage(c, 300));
        return c.t('You won a small prize. Enough for a nice dinner.', 'Küçük bir ikramiye çıktı. Güzel bir akşam yemeğine yeter.');
      }
      return c.t('You lost. The ticket is now a bookmark.', 'Kaybettin. Bilet artık kitap ayracı.');
    },
  },
];
