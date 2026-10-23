import type { ActivityDef } from '../types';
import type { Ctx } from '../types';
import { acc, cap, gen as gen2, kin, single, wage, wth } from './util';

/** Picks one [English, Turkish] line with a single rng call, so both languages stay in step. */
const line = (c: Ctx, lines: [string, string][]) => {
  const [en, tr] = lines[c.rng.int(0, lines.length - 1)];
  return c.t(en, tr);
};

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
      return line(c, [
        ['You had a great workout.', 'Harika bir antrenman yaptın.'],
        ['You lifted heavier than ever.', 'Hayatında kaldırdığın en ağır ağırlığı kaldırdın.'],
        ['You ran 5 km without stopping.', 'Hiç durmadan 5 km koştun.'],
        ['You tried a spin class. Your legs filed a complaint.', 'Bisiklet dersine girdin. Bacakların resmi şikâyette bulundu.'],
        ['A stranger asked you for gym advice. You gave it with total confidence.', 'Bir yabancı sana spor tavsiyesi sordu. Kendinden son derece emin bir şekilde verdin.'],
        ['You spent more time choosing a playlist than working out. Still counts.', 'Antrenmandan çok çalma listesi seçtin. Yine de sayılır.'],
      ]);
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
      return line(c, [
        ['You read a book about black holes.', 'Kara delikler hakkında bir kitap okudun.'],
        ['You read a dusty history of your city.', 'Şehrinin tozlu bir tarih kitabını okudun.'],
        ['You fell asleep on a philosophy book, but some of it went in.', 'Bir felsefe kitabının üstünde uyuyakaldın ama bir kısmı yine de kafana girdi.'],
        ['You finished a 900-page novel. You need to tell someone about it.', '900 sayfalık bir roman bitirdin. Birine anlatmazsan çatlayacaksın.'],
        ['The librarian recommended a book. It was perfect. Librarians know.', 'Kütüphaneci sana bir kitap önerdi. Tam isabet. Kütüphaneciler bilir.'],
        ['You read about octopuses for three hours. They have three hearts.', 'Üç saat boyunca ahtapotlar hakkında okudun. Üç kalpleri varmış.'],
        ['You learned twenty words of a new language. You already forgot eight.', 'Yeni bir dilden yirmi kelime öğrendin. Sekizini çoktan unuttun.'],
      ]);
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
      return line(c, [
        ['You meditated for an hour. Your mind is a calm lake. With one duck.', 'Bir saat meditasyon yaptın. Zihnin durgun bir göl gibi. Üstünde tek bir ördek var.'],
        ['You tried to empty your mind. It filled up with grocery lists.', 'Zihnini boşaltmaya çalıştın. Market listeleriyle doldu.'],
        ['Ten quiet minutes by the window. The world can wait.', 'Pencere kenarında on sessiz dakika. Dünya biraz bekleyebilir.'],
        ['You did a breathing exercise and finally noticed your shoulders were up by your ears.', 'Nefes egzersizi yaptın ve omuzlarının kulaklarına kadar kalktığını ancak fark ettin.'],
        ['A guided meditation told you to be a mountain. You were a very good mountain.', 'Rehberli meditasyon sana dağ olmanı söyledi. Çok iyi bir dağ oldun.'],
      ]);
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
      return line(c, [
        ['The doctor gave you vitamins and a lecture.', 'Doktor sana vitamin ve uzun bir nasihat verdi.'],
        ['The doctor said "drink more water". You nodded like you would.', 'Doktor "Daha çok su iç" dedi. İçecekmiş gibi başını salladın.'],
        ['Blood test results: everything normal. You feel oddly proud.', 'Kan tahlili sonuçları: her şey normal. Garip bir şekilde gurur duydun.'],
        ['You waited two hours for a five-minute check-up. Worth it.', 'Beş dakikalık muayene için iki saat bekledin. Yine de değdi.'],
      ]);
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
      return line(c, [
        ['You got a fresh haircut. You keep catching your reflection.', 'Saçlarını yeni kestirdin. Her vitrinde kendine bakıp duruyorsun.'],
        ['New clothes, new you. Same old shoes.', 'Yeni kıyafetler, yeni sen. Ayakkabılar aynı tabii.'],
        ['The barber talked politics the whole time. The haircut is great, though.', 'Berber baştan sona siyaset konuştu. Ama saç harika oldu.'],
        ['You tried a bold new look. Your family is still getting used to it.', 'Cesur bir tarz denedin. Ailen hâlâ alışmaya çalışıyor.'],
      ]);
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
      const who = r.rel.kind === 'mother' ? 'Anneni' : 'Babanı';
      const n = r.person.firstName;
      return line(c, [
        [`You called your ${k}. ${n} talked for an hour about the neighbors.`, `${who} aradın. ${n} bir saat boyunca komşuları anlattı.`],
        [`You called your ${k}. ${n} asked if you are eating properly. Three times.`, `${who} aradın. ${n} düzgün yemek yiyip yemediğini üç kere sordu.`],
        [`You called your ${k} just to say hi. ${n} assumed something was wrong.`, `${who} sadece selam vermek için aradın. ${n} kötü bir şey olduğunu sandı.`],
        [`A video call with your ${k}. You saw a lot of ${n}'s forehead.`, `${who} görüntülü aradın. Ekranda çoğunlukla ${gen2(n)} alnını gördün.`],
      ]);
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
      const n = s.person.firstName;
      return line(c, [
        [`You and your ${k} ${n} played old video games all night.`, `${cap(k)} ${wth(n)} bütün gece eski video oyunları oynadınız.`],
        [`You and ${n} went through old family photos and laughed until it hurt.`, `${wth(n)} eski aile fotoğraflarına bakıp karnınız ağrıyana kadar güldünüz.`],
        [`You and ${n} argued about who was the favorite child. Unresolved.`, `${wth(n)} ailenin gözdesinin kim olduğunu tartıştınız. Sonuç çıkmadı.`],
        [`You and ${n} cooked your grandmother's recipe. It was almost right.`, `${wth(n)} ninenizin tarifini pişirdiniz. Neredeyse aynısı oldu.`],
      ]);
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
      return line(c, [
        ['You took the kids to the park. Somebody ended up in the fountain.', 'Çocukları parka götürdün. Biri kendini fıskiyeli havuzun içinde buldu.'],
        ['Board game night. Someone flipped the board. It was you.', 'Kutu oyunu gecesi. Biri tahtayı devirdi. O kişi sendin.'],
        ['You built a blanket fort together. Nobody wanted to leave it.', 'Birlikte battaniyeden kale yaptınız. Kimse çıkmak istemedi.'],
        ['You helped with homework. You also learned something about fractions.', 'Ödevlere yardım ettin. Kesirler hakkında sen de bir şey öğrendin.'],
        ['A day at the beach: sunburn, sand everywhere, perfect.', 'Deniz günü: güneş yanığı, her yerde kum, mükemmel.'],
      ]);
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
      return line(c, [
        ['You stayed late every night this month. Your boss nodded at you once.', 'Bu ay her gece mesaiye kaldın. Patronun sana bir kere başıyla selam verdi.'],
        ['You answered emails on a Sunday. Nobody noticed. Except your back.', 'Pazar günü e-postalara cevap verdin. Kimse fark etmedi. Belin hariç.'],
        ['You fixed a problem nobody else could. Someone else presented it.', 'Kimsenin çözemediği bir sorunu çözdün. Sunumu başkası yaptı.'],
        ['You became the person who knows where everything is. A blessing and a curse.', 'Her şeyin nerede olduğunu bilen kişi oldun. Hem nimet hem bela.'],
      ]);
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
  // buying, selling and moving homes live in activities-home.ts (home_search, home_sell, home_renovate)
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
      return line(c, [
        ['You lost. The ticket is now a bookmark.', 'Kaybettin. Bilet artık kitap ayracı.'],
        ['Not a single matching number. Impressive, in a way.', 'Tek bir rakam bile tutmadı. Bir bakıma etkileyici.'],
        ['You lost, but you spent a lovely evening planning how to spend it.', 'Kaybettin ama parayı nasıl harcayacağını planlarken çok güzel bir akşam geçirdin.'],
      ]);
    },
  },
];
