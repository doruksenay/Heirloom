import type { ActivityDef } from '../types';
import { acc, wage } from './util';
import { elderState, ensureGrandkids, gkAge, grandkids, peekElder } from './events-elder';

// Things to do in old age (60+). Small, steady effects; the memoir pays off after four years.

const MEMOIR_CHAPTERS: [string, string][] = [
  [
    'Chapter one: "The Early Years." You remembered your first teacher\'s name after fifty years.',
    'Birinci bölüm: "İlk Yıllar." Elli yıl sonra ilk öğretmeninin adını hatırladın.',
  ],
  [
    'Chapter two: "Love and Other Disasters." You laughed so hard you had to lie down.',
    'İkinci bölüm: "Aşk ve Diğer Felaketler." Öyle güldün ki uzanman gerekti.',
  ],
  [
    'Chapter three: "Things I Never Told Anyone." You wrote it, read it twice and locked the drawer.',
    'Üçüncü bölüm: "Kimseye Anlatmadıklarım." Yazdın, iki kere okudun ve çekmeceyi kilitledin.',
  ],
];
export const MEMOIR_LENGTH = MEMOIR_CHAPTERS.length + 1;

export const elderActivities: ActivityDef[] = [
  {
    id: 'elder_garden',
    label: (c) => c.t('Tend your garden', 'Bahçeyle uğraş'),
    description: (c) => c.t('+Happiness, +Health', '+Mutluluk, +Sağlık'),
    group: 'Mind & Body',
    minAge: 60,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(3, 5));
      c.h.stat('health', 1);
      const i = c.rng.int(0, 3);
      return c.t(
        [
          'You talked to your tomatoes for an hour. They seemed to appreciate it.',
          'You declared war on a snail. The snail is winning.',
          'Your peppers came up. You photographed each one individually.',
          'You gave the neighbors so many zucchini that they stopped opening the door.',
        ][i],
        [
          'Domateslerinle bir saat sohbet ettin. Memnun göründüler.',
          'Bir salyangoza savaş açtın. Salyangoz önde.',
          'Biberlerin boy verdi. Her birinin tek tek fotoğrafını çektin.',
          'Komşulara o kadar çok kabak verdin ki artık kapıyı açmıyorlar.',
        ][i],
      );
    },
  },
  {
    id: 'elder_walk',
    label: (c) => c.t('Take a morning walk', 'Sabah yürüyüşüne çık'),
    description: (c) => c.t('+Health', '+Sağlık'),
    group: 'Mind & Body',
    minAge: 60,
    run: (c) => {
      c.h.stat('health', c.rng.int(2, 3) + (c.h.has('elder_walker') ? 1 : 0));
      c.h.stat('happiness', 1);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          'You walked by the water at dawn and greeted every dog by name.',
          'You power-walked past a group of joggers. They took it personally.',
          'You walked to the bakery and back. The bread was still warm. Life is good.',
        ][i],
        [
          'Şafakta sahil boyunca yürüdün ve her köpeği adıyla selamladın.',
          'Bir grup koşucuyu tempolu yürüyüşle geçtin. Kendilerine yediremediler.',
          'Fırına kadar yürüyüp döndün. Simit sıcacıktı. Hayat güzel.',
        ][i],
      );
    },
  },
  {
    id: 'elder_backgammon',
    label: (c) => c.t('Play backgammon in the park', 'Parkta tavla oyna'),
    description: (c) => c.t('+Smarts, +Happiness', '+Zekâ, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 60,
    run: (c) => {
      c.h.stat('smarts', c.rng.int(1, 2));
      if (c.rng.chance(0.5 + c.p.stats.smarts / 400)) {
        c.h.stat('happiness', 4);
        return c.t(
          'You won three games in a row and slammed the board shut like a professional.',
          'Üst üste üç oyun kazandın ve tavlayı bir profesyonel gibi küt diye kapattın.',
        );
      }
      c.h.stat('happiness', 1);
      return c.t(
        'You lost to a retired dentist who reads every dice roll out loud. Every. Single. Roll.',
        'Her zarı yüksek sesle okuyan emekli bir dişçiye yenildin. Her. Bir. Zarı.',
      );
    },
  },
  {
    id: 'elder_visit_grandkids',
    label: (c) => c.t('Visit the grandkids', 'Torunları ziyaret et'),
    description: (c) => c.t('+Family closeness, +Happiness', '+Aile bağı, +Mutluluk'),
    group: 'Family',
    minAge: 60,
    available: (c) => grandkids(c).length > 0,
    run: (c) => {
      const all = ensureGrandkids(c);
      const g = all[c.rng.int(0, all.length - 1)];
      c.h.closeness(g.p, 5);
      c.h.stat('happiness', c.rng.int(4, 6));
      const age = gkAge(c, g);
      if (age < 2)
        return c.t(
          `You held baby ${g.n} for two hours and refused to give them back.`,
          `Bebek ${acc(g.n)} iki saat kucağından indirmedin ve geri vermeyi reddettin.`,
        );
      if (age < 7)
        return c.t(
          `You and ${g.n} built a fort out of sofa cushions. You are still stuck inside it.`,
          `${g.n} ile kanepe minderlerinden kale yaptınız. Hâlâ içinden çıkamadın.`,
        );
      if (age < 18)
        return c.t(
          `${g.n} taught you a dance from the internet. You will never do it in public again.`,
          `${g.n} sana internetten bir dans öğretti. Bir daha asla kimsenin önünde yapmayacaksın.`,
        );
      return c.t(
        `You took ${g.n} out for lunch. ${g.n} paid, and you pretended to be offended.`,
        `${acc(g.n)} öğle yemeğine çıkardın. Hesabı ${g.n} ödedi, sen de alınmış gibi yaptın.`,
      );
    },
  },
  {
    id: 'elder_memoir',
    label: (c) => c.t('Write your memoir', 'Anılarını yaz'),
    description: (c) => c.t('One chapter a year', 'Yılda bir bölüm'),
    group: 'Family',
    minAge: 60,
    available: (c) => !peekElder(c)?.memoirDone,
    run: (c) => {
      const st = elderState(c);
      st.memoir++;
      c.h.stat('smarts', 1);
      c.h.stat('happiness', 2);
      if (st.memoir >= MEMOIR_LENGTH) {
        st.memoirDone = true;
        return { event: 'base.elder_memoir_done' };
      }
      const line = MEMOIR_CHAPTERS[st.memoir - 1];
      return c.t(line[0], line[1]);
    },
  },
  {
    id: 'elder_volunteer',
    label: (c) => c.t('Volunteer in the neighborhood', 'Mahallede gönüllü çalış'),
    description: (c) => c.t('+Happiness, +Smarts', '+Mutluluk, +Zekâ'),
    group: 'Career',
    minAge: 60,
    available: (c) => !c.p.jobId,
    run: (c) => {
      c.h.stat('happiness', c.rng.int(4, 6));
      c.h.stat('smarts', 1);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          "You served soup at the community kitchen and corrected everyone's portion sizes.",
          'You helped kids with homework at the library. You got one math answer wrong and will never admit it.',
          'You planted trees with the neighborhood association. One of them is officially yours.',
        ][i],
        [
          'Aşevinde çorba dağıttın ve herkesin porsiyonunu düzelttin.',
          'Kütüphanede çocuklara ödevlerinde yardım ettin. Bir matematik sorusunu yanlış yaptın ve bunu asla kabul etmeyeceksin.',
          'Mahalle derneğiyle ağaç diktin. İçlerinden biri resmen senin ağacın sayılıyor.',
        ][i],
      );
    },
  },
  {
    id: 'elder_flea_market',
    label: (c) => c.t('Sell old things at the flea market', 'Bit pazarında eski eşya sat'),
    description: (c) => c.t('A little pocket money', 'Biraz cep harçlığı'),
    group: 'Money',
    minAge: 60,
    run: (c) => {
      if (c.rng.chance(0.03)) {
        const amt = wage(c, c.rng.int(15, 40) * 100);
        c.h.money(amt);
        c.h.stat('happiness', 6);
        return c.t(
          `An antique dealer paid ${c.h.fmt(amt)} for the lamp you used as a doorstop.`,
          `Kapı dayamak için kullandığın lamba için bir antikacı ${c.h.fmt(amt)} ödedi.`,
        );
      }
      const amt = wage(c, c.rng.int(3, 15) * 10);
      c.h.money(amt);
      c.h.stat('happiness', 2);
      const i = c.rng.int(0, 1);
      return c.t(
        [
          `You sold a box of old cassettes for ${c.h.fmt(amt)}. You bought a lamp on the way home.`,
          `You haggled over a teapot all day and went home with ${c.h.fmt(amt)}. Worth it.`,
        ][i],
        [
          `Bir kutu eski kaseti ${c.h.fmt(amt)} karşılığında sattın. Dönüşte bir lamba aldın.`,
          `Bütün gün bir çaydanlık için pazarlık ettin ve eve ${c.h.fmt(amt)} ile döndün. Değdi.`,
        ][i],
      );
    },
  },
];
