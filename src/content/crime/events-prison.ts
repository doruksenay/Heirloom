import type { EventDef } from '../types';
import { nm } from '../base/util';
import { addJail, crimeState, inside, release } from './state';
import { say, type Pair } from '../base/lines';
import { inTr } from '../base/events-flavour';
import { streetCrimeEvents } from '../base/street-crime';

// Life on the inside. Only crime-category events fire while you are in prison, so these carry those years.


// Prison years come in runs, so the repeatable outcomes draw from pools (one rng call each, see base/lines.ts).
const FIGHT_WON: Pair[] = [
  ['You stood your ground. Nobody touches your dessert now.', 'Geri adım atmadın. Artık kimse tatlına dokunamıyor.'],
  ['You said no, loudly, in front of everyone. He laughed, then left you alone for good.', 'Herkesin önünde, yüksek sesle hayır dedin. Güldü, sonra seni bir daha rahatsız etmedi.'],
  ['One shove each, then a guard walked past and you both pretended to be discussing the weather. The dessert stayed yours.', 'Birer itiş, sonra bir gardiyan geçti ve ikiniz de hava durumunu konuşuyormuş gibi yaptınız. Tatlı sende kaldı.'],
  ['You ate the dessert in one bite while staring at him. The block talked about it for a week.', 'Ona bakarak tatlıyı tek lokmada yedin. Koğuş bir hafta bundan bahsetti.'],
];
const FIGHT_LOST: Pair[] = [
  ['The fight went badly and the guards added a year to your sentence.', 'Kavga kötü bitti, gardiyanlar cezana bir yıl ekletti.'],
  ['You threw the first punch and missed. The guards did not. One more year.', 'İlk yumruğu sen attın ve ıskaladın. Gardiyanlar ıskalamadı. Bir yıl daha.'],
  ['You won the fight and lost a year. The disciplinary board does not care who started it.', 'Kavgayı kazandın, bir yılı kaybettin. Disiplin kurulu kimin başlattığıyla ilgilenmiyor.'],
  ['A tray, a bench and three guards later, you had a black eye and an extra year.', 'Bir tepsi, bir bank ve üç gardiyan sonra elinde morarmış bir göz ve fazladan bir yıl kaldı.'],
];
const FIGHT_GIVE: Pair[] = [
  ['You handed it over. You have not tasted pudding in months.', 'Tatlıyı verdin. Aylardır ağzına tatlı koymadın.'],
  ['You slid the tray across without a word. Peace has a price, and it is semolina.', 'Tepsiyi tek kelime etmeden uzattın. Huzurun bir bedeli var; o da irmik tatlısı.'],
  ['You gave him the dessert. A week later he gave you half an orange. Prison diplomacy.', 'Tatlıyı ona verdin. Bir hafta sonra o sana yarım portakal verdi. Cezaevi diplomasisi.'],
  ['You gave it up and told yourself you were on a diet anyway.', 'Tatlıdan vazgeçtin ve kendine zaten diyette olduğunu söyledin.'],
];


// The evening classes and the letters from home moved to the free game in round 4 (base.jail_class, base.jail_letters).
// Their old ids stay here as never-random aliases, so a save made while one of them was open still resolves.
const alias = (id: string, of: string): EventDef => ({ ...streetCrimeEvents.find((e) => e.id === of)!, id, when: () => false, weight: 0 });

export const prisonEvents: EventDef[] = [
  alias('crime.prison_class', 'base.jail_class'),
  alias('crime.letters', 'base.jail_letters'),
  {
    id: 'crime.prison_fight',
    category: 'crime',
    inJail: 'only',
    when: inside,
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
            return say(c, 'crime.prison_fight.won', FIGHT_WON);
          }
          c.h.stat('health', -12);
          addJail(c, 1);
          return say(c, 'crime.prison_fight.lost', FIGHT_LOST);
        },
      },
      {
        id: 'give',
        label: (c) => c.t('Hand it over', 'Ver gitsin'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return say(c, 'crime.prison_fight.give', FIGHT_GIVE);
        },
      },
    ],
  },
  {
    id: 'crime.parole',
    category: 'crime',
    inJail: 'only',
    when: (c) => c.p.jailYears >= 2,
    title: (c) => c.t('Your parole hearing is today.', 'Bugün şartlı tahliye duruşman var.'),
    text: (c) => c.t('Three people behind a table will decide your next years.', 'Masanın arkasındaki üç kişi önümüzdeki yıllarına karar verecek.'),
    choices: [
      {
        id: 'remorse',
        label: (c) => c.t('Show genuine remorse', 'İçtenlikle pişmanlığını göster'),
        resolve: (c) => {
          const st = crimeState(c.p);
          const bonus = (st.trade >= 2 ? 0.15 : 0) + (c.h.has('prison_class') ? 0.1 : 0);
          if (c.rng.chance(0.45 + bonus)) {
            release(c);
            c.h.stat('happiness', 15);
            return bonus > 0
              ? c.t('Parole granted. The board liked your certificates more than your speech. You walked out into the sunlight.', 'Şartlı tahliye kabul edildi. Kurul, konuşmandan çok sertifikalarını beğendi. Kapıdan güneşe doğru yürüdün.')
              : c.t('Parole granted. You walked out into the sunlight.', 'Şartlı tahliye kabul edildi. Kapıdan güneşe doğru yürüdün.');
          }
          return c.t('Parole denied. Back to your cell.', 'Şartlı tahliye reddedildi. Koğuşa geri dön.');
        },
      },
      { id: 'silent', label: (c) => c.t('Say nothing', 'Hiçbir şey söyleme'), resolve: (c) => c.t('You said nothing. Parole denied.', 'Tek kelime etmedin. Şartlı tahliye reddedildi.') },
    ],
  },
  {
    id: 'crime.cellmate',
    category: 'crime',
    inJail: 'only',
    cooldown: 6,
    when: inside,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ gender: c.p.gender, age: Math.max(20, c.age + c.rng.int(-5, 25)) }).id;
    },
    title: (c) => c.t(`You have a new cellmate: ${nm(c)}.`, `Yeni koğuş arkadaşın: ${nm(c)}.`),
    text: (c) => c.t(`${nm(c)} swears to be innocent and has already rearranged your shelf.`, `${nm(c)} masum olduğuna yemin ediyor ve rafını çoktan yeniden düzenlemiş.`),
    choices: [
      {
        id: 'listen',
        label: (c) => c.t('Listen to the stories', 'Hikâyelerini dinle'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(60, 80));
          c.h.stat('happiness', 5);
          return c.t(`${nm(c)} told stories about the old days every night. You laughed more than you had in years.`, `${nm(c)} her gece eski günlerin hikâyelerini anlattı. Yıllardır bu kadar gülmemiştin.`);
        },
        tone: 'good',
      },
      {
        id: 'chess',
        label: (c) => c.t('Learn chess together', 'Birlikte satranç öğrenin'),
        resolve: (c) => {
          c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', c.rng.int(45, 65));
          c.h.stat('smarts', 4);
          return c.t(`${nm(c)} taught you chess with pieces carved from soap. You lost 212 games in a row.`, `${nm(c)} sana sabundan oyulmuş taşlarla satranç öğretti. Üst üste 212 oyun kaybettin.`);
        },
      },
      {
        id: 'transfer',
        label: (c) => c.t('Ask for a transfer', 'Koğuş değişikliği iste'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You got your transfer. The new cellmate snores in two languages.', 'İsteğin kabul edildi. Yeni koğuş arkadaşın iki dilde horluyor.');
        },
      },
    ],
  },
  {
    id: 'crime.riot',
    category: 'crime',
    inJail: 'only',
    weight: 5,
    cooldown: 8,
    when: inside,
    title: (c) => c.t('A riot breaks out in the cafeteria.', 'Yemekhanede isyan çıktı.'),
    text: (c) =>
      inTr(c)
        ? c.t('It started over the lentil soup. It is no longer about the lentil soup.', 'Mercimek çorbası yüzünden başladı. Artık mesele mercimek çorbası değil.')
        : c.t('It started over the mashed potatoes. It is no longer about the mashed potatoes.', 'Patates püresi yüzünden başladı. Artık mesele patates püresi değil.'),
    choices: [
      {
        id: 'hide',
        label: (c) => c.t('Stay in your cell', 'Koğuşunda kal'),
        badge: 'Safe',
        resolve: (c) => {
          if (c.rng.chance(0.8)) return c.t('You read the same magazine four times while it raged outside.', 'Dışarısı birbirine girerken aynı dergiyi dört kez okudun.');
          c.h.stat('health', -8);
          return c.t('A flying tray found you anyway.', 'Uçan bir tepsi seni yine de buldu.');
        },
      },
      {
        id: 'help',
        label: (c) => c.t('Help an injured guard', 'Yaralı bir gardiyana yardım et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          if (c.p.jailYears >= 2) {
            addJail(c, -1);
            return c.t('You dragged an injured guard to safety. The board took a year off your sentence.', 'Yaralı bir gardiyanı güvenli bir yere taşıdın. Kurul cezandan bir yıl sildi.');
          }
          return c.t('You dragged an injured guard to safety. He slips you extra bread now.', 'Yaralı bir gardiyanı güvenli bir yere taşıdın. Artık sana gizlice fazladan ekmek veriyor.');
        },
        tone: 'good',
      },
      {
        id: 'join',
        label: (c) => c.t('Join in', 'Sen de katıl'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('You flipped a table and felt alive for the first time in months. Nobody saw.', 'Bir masayı devirdin ve aylardır ilk kez kendini canlı hissettin. Kimse görmedi.');
          }
          c.h.stat('health', -6);
          addJail(c, 2);
          return c.t('The cameras saw everything. Two more years.', 'Kameralar her şeyi gördü. Cezana iki yıl eklendi.');
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'crime.escape',
    category: 'crime',
    inJail: 'only',
    weight: 4,
    cooldown: 10,
    when: (c) => c.p.jailYears >= 3,
    title: (c) => c.t('Your cellmate has an escape plan.', 'Koğuş arkadaşının bir firar planı var.'),
    text: (c) => c.t('It involves the laundry truck, a lot of sheets and "a bit of luck".', 'Planın içinde çamaşırhane kamyonu, bir sürü çarşaf ve "biraz şans" var.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Go along with it', 'Plana dahil ol'),
        badge: 'Risky',
        resolve: (c) => {
          const st = crimeState(c.p);
          if (c.rng.chance(0.15)) {
            st.owed = Math.min(4, c.p.jailYears);
            release(c);
            st.fugitive = true;
            st.wanted = 'escape';
            st.heat = 90;
            st.escapes++;
            c.h.stat('happiness', 10);
            return c.t('Against all odds, it worked. You are free, sort of, and you flinch at every siren.', 'Bütün ihtimallere rağmen işe yaradı. Özgürsün, yani bir bakıma. Her sirende irkiliyorsun.');
          }
          addJail(c, 2);
          c.h.stat('health', -5);
          c.h.stat('happiness', -5);
          return c.t('You got as far as the laundry room. Two more years, and a new nickname: "Sheets".', 'Çamaşırhaneye kadar gidebildin. Cezana iki yıl eklendi, bir de yeni lakap: "Çarşaf".');
        },
        tone: 'big',
      },
      {
        id: 'stay',
        label: (c) => c.t('Serve your time', 'Cezanı çek'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('Your cellmate went alone and was back before lunch.', 'Koğuş arkadaşın tek başına gitti ve öğle yemeğine geri dönmüştü.');
        },
      },
    ],
  },
];

