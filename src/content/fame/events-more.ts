import type { ChoiceDef, Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { acc, cap, dat, gen, kin, wage, wth } from '../base/util';
import { fameState, gainFans, isPath, loseFans, peekFame, songTitle, type FameState } from './state';
import { compact, fameOf, free, hasPath, motherAlive } from './util';

// Fame v0.7: 31 more events. Music, social media, acting, and the life around fame (dynasty included).

const fs = (c: Ctx): FameState => fameState(c.p);
const music = (c: Ctx) => isPath(c, 'music');
const social = (c: Ctx) => isPath(c, 'social');
const acting = (c: Ctx) => isPath(c, 'acting');
const released = (c: Ctx) => (peekFame(c.p)?.songs ?? []).filter((s) => s.released);
const kidsAged = (c: Ctx, min: number, max: number) => c.h.relatives('child').filter((k) => c.h.ageOf(k.person) >= min && c.h.ageOf(k.person) <= max);
const pp = (c: Ctx): Person => c.h.person(String(c.vars.pid));
/** Children of duet age who have not asked yet. */
const duetKids = (c: Ctx) => kidsAged(c, 10, 35).filter((k) => !c.h.has(`fame_duet:${k.person.id}`));
const pn = (c: Ctx) => pp(c)?.firstName ?? '';
/** Same text in both languages, path-dependent: [music, social, acting]. */
const byPath = (c: Ctx, en: [string, string, string], tr: [string, string, string]) => {
  const i = { music: 0, social: 1, acting: 2 }[peekFame(c.p)?.path ?? 'music'];
  return c.t(en[i], tr[i]);
};
const scandal = (c: Ctx, share: number) => {
  const f = fs(c);
  f.scandals++;
  return loseFans(f, share);
};

/** Bigger stars who might call. Proper names, the same in both languages. */
const STARS = ['Lara Vega', 'Kaan Tempo', 'Mira Sol', 'DJ Poyraz', 'Nova Reyes', 'Selin Mavi'];
/** Which of STARS are women (for she/he in English). */
const STAR_FEMALE = new Set(['Lara Vega', 'Mira Sol', 'Nova Reyes', 'Selin Mavi']);
const inTR = (c: Ctx) => c.p.countryId === 'tr';
/** him / her and he / she for the person in c.vars.pid (English only). */
const himOf = (c: Ctx) => (pp(c)?.gender === 'female' ? 'her' : 'him');
const heOf = (c: Ctx) => (pp(c)?.gender === 'female' ? 'she' : 'he');
/** Rival creators' handles. */
const HANDLES = ['@tostkral', '@vlogbaba', '@glowupgizem', '@kahvefali', '@gymbro_deniz', '@minikmutfak'];
const ADS = ['A fabric softener', 'A bank', 'A car company', 'A yoghurt brand'];
const ADS_TR = ['Bir yumuşatıcı markası', 'Bir banka', 'Bir otomobil markası', 'Bir yoğurt markası'];
const ADS_THING = ['fabric softener', 'loans', 'hatchbacks', 'yoghurt'];
const ADS_THING_TR = ['yumuşatıcı', 'kredi', 'hatchback araba', 'yoğurt'];

export const moreFameEvents: EventDef[] = [
  // ================================================================ music
  {
    id: 'fame.collab_star',
    category: 'fame',
    minAge: 15,
    cooldown: 6,
    when: (c) => music(c) && free(c) && fs(c).fans >= 15000 && released(c).length > 0,
    setup: (c) => {
      c.vars.star = STARS[c.rng.int(0, STARS.length - 1)];
    },
    title: (c) => c.t(`${c.vars.star} wants to record a song with you.`, `${c.vars.star} seninle şarkı kaydetmek istiyor.`),
    text: (c) => c.t(`${STAR_FEMALE.has(String(c.vars.star)) ? 'She has' : 'He has'} a private jet. You have a bus pass.`, 'Onun özel jeti var. Senin akbilin.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Say yes', 'Kabul et'),
        resolve: (c) => {
          const f = fs(c);
          const star = String(c.vars.star);
          f.skill = Math.min(100, f.skill + 3);
          if (c.rng.chance(0.3)) {
            const g = gainFans(c, f, f.fans * 0.1);
            return c.t(
              `You wrote the chorus, ${star} sang it and called it "our little idea". Still, ${compact(c, g)} new fans.`,
              `Nakaratı sen yazdın, ${star} söyledi ve ona "bizim küçük fikrimiz" dedi. Yine de ${compact(c, g)} yeni hayran.`,
            );
          }
          const g = gainFans(c, f, f.fans * 0.4 + 20000);
          c.h.stat('happiness', 6);
          return c.t(
            `Your duet with ${star} went straight into the charts. ${compact(c, g)} new fans.`,
            `${wth(star)} düetin doğrudan listelere girdi. ${compact(c, g)} yeni hayran.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'credit',
        label: (c) => c.t('Demand equal credit', 'Eşit isim hakkı iste'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          const star = String(c.vars.star);
          if (c.rng.chance(0.5)) {
            const g = gainFans(c, f, f.fans * 0.6 + 30000);
            const pay = wage(c, 20000);
            c.h.money(pay);
            return c.t(
              `${star} respected the nerve. Your name is on the cover in the same font size. ${compact(c, g)} new fans and ${c.h.fmt(pay)} in royalties.`,
              `${star} bu cesarete saygı duydu. Kapakta adın aynı punto boyutunda. ${compact(c, g)} yeni hayran, üstüne ${c.h.fmt(pay)} telif.`,
            );
          }
          c.h.stat('happiness', -4);
          return c.t(`${star}'s manager laughed for a full minute and hung up.`, `${gen(star)} menajeri bir dakika boyunca güldü, sonra telefonu kapattı.`);
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Turn it down', 'Geri çevir'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return motherAlive(c)
            ? c.t('You said no. Your mother still has not forgiven you.', 'Hayır dedin. Annen hâlâ seni affetmedi.')
            : c.t('You said no. Your fan club still has not forgiven you.', 'Hayır dedin. Hayran kulübün hâlâ seni affetmedi.');
        },
      },
    ],
  },
  {
    id: 'fame.plagiarism',
    category: 'fame',
    minAge: 15,
    cooldown: 8,
    when: (c) => music(c) && released(c).some((s) => s.quality >= 50),
    setup: (c) => {
      const best = [...released(c)].sort((a, b) => b.quality - a.quality)[0];
      c.vars.title = best.title;
    },
    title: (c) => c.t(`A rival band's new hit sounds a lot like "${c.vars.title}".`, `Rakip bir grubun yeni hiti, "${c.vars.title}" şarkına fena benziyor.`),
    text: (c) => c.t('Same chorus, same chords, same suspicious key change.', 'Aynı nakarat, aynı akorlar, aynı şüpheli ton değişimi.'),
    choices: [
      {
        id: 'sue',
        label: (c) => c.t('Sue them', 'Dava aç'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          const fee = wage(c, 8000);
          c.h.money(-fee);
          if (c.rng.chance(0.45 + f.skill / 400)) {
            const won = wage(c, c.rng.int(30, 90) * 1000);
            c.h.money(won);
            const g = gainFans(c, f, f.fans * 0.05);
            return c.t(
              `You won the case. The court awarded you ${c.h.fmt(won)}, and ${compact(c, g)} people discovered the original.`,
              `Davayı kazandın. Mahkeme sana ${c.h.fmt(won)} tazminat verdi; ${compact(c, g)} kişi de orijinal şarkıyı keşfetti.`,
            );
          }
          c.h.stat('happiness', -5);
          return c.t(
            `You lost. The judge said all pop songs sound the same now. The lawyers cost ${c.h.fmt(fee)}.`,
            `Davayı kaybettin. Hâkim, artık bütün pop şarkılarının birbirine benzediğini söyledi. Avukatlar ${c.h.fmt(fee)} tuttu.`,
          );
        },
      },
      {
        id: 'expose',
        label: (c) => c.t('Post a side-by-side video', 'Karşılaştırma videosu paylaş'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.1 + 2000);
          return c.t(
            `Your side-by-side video went everywhere. Your song is back in the charts with ${compact(c, g)} new fans.`,
            `Karşılaştırma videon her yere yayıldı. Şarkın ${compact(c, g)} yeni hayranla listelere geri döndü.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'flattered',
        label: (c) => c.t('Take it as a compliment', 'İltifat say'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Imitation is the sincerest form of flattery. Flattery does not pay rent.', 'Taklit en büyük iltifattır derler. İltifatla kira ödenmiyor ama.');
        },
      },
    ],
  },
  {
    id: 'fame.tv_ad',
    category: 'fame',
    minAge: 14,
    cooldown: 6,
    when: (c) => music(c) && fs(c).fans >= 5000 && released(c).length > 0,
    setup: (c) => {
      const songs = released(c);
      c.vars.title = songs[c.rng.int(0, songs.length - 1)].title;
      c.vars.ad = c.rng.int(0, ADS.length - 1);
      c.vars.amt = wage(c, Math.min(150000, 8000 + fs(c).fans * 0.05));
    },
    title: (c) => {
      const i = Number(c.vars.ad);
      return c.t(`${ADS[i]} wants "${c.vars.title}" for its TV ad.`, `${ADS_TR[i]}, televizyon reklamında "${c.vars.title}" şarkını kullanmak istiyor.`);
    },
    text: (c) =>
      c.t(
        `They offer ${c.h.fmt(Number(c.vars.amt))}. The ad features a golden retriever running in slow motion.`,
        `${c.h.fmt(Number(c.vars.amt))} teklif ediyorlar. Reklamda ağır çekimde koşan bir golden retriever var.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell the song', 'Şarkıyı sat'),
        badge: 'Big money',
        resolve: (c) => {
          const f = fs(c);
          const i = Number(c.vars.ad);
          c.h.money(Number(c.vars.amt));
          if (c.rng.chance(0.3)) {
            const lost = loseFans(f, 0.06);
            return c.t(
              `You took the money. Now everyone hears your song and thinks of ${ADS_THING[i]}. ${compact(c, lost)} fans called you a sellout.`,
              `Parayı aldın. Artık herkes şarkını duyunca aklına ${ADS_THING_TR[i]} geliyor. ${compact(c, lost)} hayran sana "satılmış" dedi.`,
            );
          }
          const g = gainFans(c, f, f.fans * 0.1 + 3000);
          return c.t(
            `The ad ran every evening for a year. ${compact(c, g)} people looked up the song, and the cheque cleared.`,
            `Reklam bir yıl boyunca her akşam döndü. ${compact(c, g)} kişi şarkıyı aradı, çek de karşılıksız çıkmadı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'refuse',
        label: (c) => c.t('Keep your art pure', 'Sanatını satma'),
        resolve: (c) => {
          gainFans(c, fs(c), 1000);
          return c.t('You refused. Underground blogs called you a legend. Underground blogs do not pay.', 'Reddettin. Yeraltı blogları sana efsane dedi. Yeraltı blogları para ödemiyor tabii.');
        },
      },
    ],
  },
  {
    id: 'fame.festival',
    category: 'fame',
    minAge: 16,
    cooldown: 5,
    when: (c) => music(c) && free(c) && fs(c).fans >= 80000,
    setup: (c) => {
      c.vars.pay = wage(c, Math.min(400000, 20000 + fs(c).fans * 0.02));
    },
    title: (c) => c.t('A big summer festival wants you as its headliner.', 'Büyük bir yaz festivali kapanış konserini senin vermeni istiyor.'),
    text: (c) =>
      c.t(
        `Eighty thousand people, one muddy field, a midnight curfew and ${c.h.fmt(Number(c.vars.pay))}.`,
        `Seksen bin kişi, çamurlu bir tarla, gece yarısı ses yasağı ve ${c.h.fmt(Number(c.vars.pay))} ücret.`,
      ),
    choices: [
      {
        id: 'hits',
        label: (c) => c.t('Play all the hits', 'Bütün hitlerini çal'),
        resolve: (c) => {
          const f = fs(c);
          c.h.money(Number(c.vars.pay));
          const g = gainFans(c, f, f.fans * 0.12);
          c.h.stat('happiness', 6);
          c.h.stat('health', -2);
          c.h.achieve('headliner');
          return c.t(
            `Eighty thousand people sang every word. ${compact(c, g)} new fans and mud in places you did not know you had.`,
            `Seksen bin kişi her kelimeyi seninle söyledi. ${compact(c, g)} yeni hayran ve varlığından haberdar olmadığın yerlerde çamur.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'new',
        label: (c) => c.t('Play only your new experimental songs', 'Sadece yeni deneysel şarkılarını çal'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          c.h.money(Number(c.vars.pay));
          c.h.achieve('headliner');
          if (c.rng.chance(0.4)) {
            const g = gainFans(c, f, f.fans * 0.2);
            f.skill = Math.min(100, f.skill + 4);
            return c.t(
              `Critics called it "a brave new era". ${compact(c, g)} new fans who own turtlenecks.`,
              `Eleştirmenler "cesur bir yeni dönem" dedi. Balıkçı yaka giyen ${compact(c, g)} yeni hayran.`,
            );
          }
          const lost = loseFans(f, 0.05);
          c.h.stat('happiness', -5);
          return c.t(
            `The crowd chanted the name of your old hit for an hour. ${compact(c, lost)} fans went to the food trucks and never came back.`,
            `Seyirci bir saat boyunca eski hitinin adını bağırdı. ${compact(c, lost)} hayran yemek kamyonlarına gitti ve bir daha dönmedi.`,
          );
        },
      },
      {
        id: 'fire',
        label: (c) => c.t('Add a lot of pyrotechnics', 'Bol bol havai fişek patlat'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          c.h.money(Number(c.vars.pay));
          c.h.achieve('headliner');
          if (c.rng.chance(0.7)) {
            const g = gainFans(c, f, f.fans * 0.18);
            return c.t(
              `The finale lit up the whole valley. People in the next town filmed it. ${compact(c, g)} new fans.`,
              `Final bütün vadiyi aydınlattı. Yan kasabadakiler bile videoya çekti. ${compact(c, g)} yeni hayran.`,
            );
          }
          c.h.stat('health', -5);
          return c.t('A firework went sideways. You finished the show without your eyebrows. They grew back by spring.', 'Bir havai fişek yana saptı. Konseri kaşsız bitirdin. Bahara kadar geri çıktılar.');
        },
      },
    ],
  },
  {
    id: 'fame.writers_block',
    category: 'fame',
    minAge: 14,
    cooldown: 6,
    when: (c) => music(c) && free(c) && fs(c).songs.length >= 3,
    title: (c) => c.t('You have not written a decent song in a year.', 'Bir yıldır doğru dürüst bir şarkı yazamadın.'),
    text: (c) => c.t('You stare at the blank page. The blank page stares back.', 'Boş sayfaya bakıyorsun. Boş sayfa da sana.'),
    choices: [
      {
        id: 'cabin',
        label: (c) => c.t('Rent a house by the sea', 'Deniz kenarında bir ev kirala'),
        badge: 'Costs more',
        resolve: (c) => {
          const f = fs(c);
          const cost = wage(c, 3000);
          c.h.money(-cost);
          c.h.stat('happiness', 5);
          f.skill = Math.min(100, f.skill + 3);
          const q = Math.max(1, Math.min(100, Math.round(f.skill * 0.6 + c.p.stats.smarts * 0.2 + 15 + c.rng.int(-10, 10))));
          const title = songTitle(c);
          f.songs.push({ title, quality: q, year: c.s.year, released: false });
          return c.t(
            `A month of seagulls and silence. You came back with "${title}" (quality ${q}).`,
            `Bir ay boyunca martılar ve sessizlik. "${title}" adlı şarkıyla döndün (kalite ${q}).`,
          );
        },
        tone: 'good',
      },
      {
        id: 'stranger',
        label: (c) => c.t('Co-write with a stranger at the bar', 'Bardaki bir yabancıyla yaz'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.5)) {
            const q = c.rng.int(60, 92);
            const title = songTitle(c);
            f.songs.push({ title, quality: q, year: c.s.year, released: false });
            return c.t(
              `The stranger turned out to be a retired session guitarist. You wrote "${title}" (quality ${q}) on a napkin.`,
              `Yabancı, emekli bir stüdyo gitaristi çıktı. "${title}" şarkısını (kalite ${q}) bir peçeteye yazdınız.`,
            );
          }
          c.h.stat('happiness', -2);
          return c.t('The stranger only wanted to write about his ex. Eleven verses. No chorus.', 'Yabancı sadece eski sevgilisini yazmak istedi. On bir kıta. Nakarat yok.');
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait for it to pass', 'Bekle, geçer'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          fs(c).skill = Math.min(100, fs(c).skill + 1);
          return c.t('Inspiration came back eight months later, on a night bus, while you had no pen.', 'İlham sekiz ay sonra bir gece otobüsünde geri geldi. Tam da yanında kalem yokken.');
        },
      },
    ],
  },
  {
    id: 'fame.late_viral',
    category: 'fame',
    minAge: 25,
    once: true,
    weight: 6,
    when: (c) => released(c).some((s) => c.s.year - s.year >= 10),
    setup: (c) => {
      const old = released(c).filter((s) => c.s.year - s.year >= 10);
      const s = old[c.rng.int(0, old.length - 1)];
      c.vars.title = s.title;
      c.vars.yrs = c.s.year - s.year;
    },
    text: '',
    apply: (c) => {
      const f = fs(c);
      const g = gainFans(c, f, Math.max(30000, f.fans * 0.5));
      const pay = wage(c, Math.min(80000, 5000 + f.fans * 0.01));
      c.h.money(pay);
      c.h.stat('happiness', 8);
      c.h.achieve('viral');
      return c.t(
        `Teenagers discovered "${c.vars.title}", a song you wrote ${c.vars.yrs} years ago. It is in every short video. ${compact(c, g)} new fans, and ${c.h.fmt(pay)} in royalties woke up from a coma.`,
        `Gençler, ${c.vars.yrs} yıl önce yazdığın "${c.vars.title}" şarkısını keşfetti. Bütün kısa videolarda o çalıyor. ${compact(c, g)} yeni hayran; telif gelirin de komadan uyandı: ${c.h.fmt(pay)}.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'fame.duet_child',
    category: 'fame',
    weight: 25,
    cooldown: 8,
    // each child asks once: after a duet (or a "no") they stop practising in the bathroom
    when: (c) => music(c) && free(c) && fs(c).fans >= 10000 && duetKids(c).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(duetKids(c)).person.id;
    },
    title: (c) => c.t(`${pn(c)} wants to sing a duet with you.`, `${pn(c)} seninle düet yapmak istiyor.`),
    text: (c) =>
      c.t(
        `Your ${kin(c, pp(c), 'child')} has been practising your songs in the bathroom for years. Everyone in the building knows.`,
        `${cap(kin(c, pp(c), 'child'))} yıllardır banyoda senin şarkılarını çalışıyor. Bütün apartman biliyor.`,
      ),
    choices: [
      {
        id: 'duet',
        label: (c) => c.t('Record the duet', 'Düeti kaydet'),
        resolve: (c) => {
          c.h.flag(`fame_duet:${c.vars.pid}`);
          const f = fs(c);
          const n = pn(c);
          c.h.closeness(String(c.vars.pid), 12);
          c.h.stat('happiness', 8);
          if (c.rng.chance(0.25)) {
            const g = gainFans(c, f, f.fans * 0.3 + 10000);
            return c.t(
              `The duet became a hit. ${compact(c, g)} new fans, and ${n} now has more followers than you.`,
              `Düet hit oldu. ${compact(c, g)} yeni hayran; ${n} artık senden çok takipçiye sahip.`,
            );
          }
          const g = gainFans(c, f, f.fans * 0.08 + 3000);
          return c.t(
            `You sang together. ${n} hit a note you have not reached in years. ${compact(c, g)} new fans.`,
            `Birlikte söylediniz. ${n}, senin yıllardır çıkamadığın bir notaya çıktı. ${compact(c, g)} yeni hayran.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'protect',
        label: (c) => c.t(`Keep ${himOf(c)} out of the business`, 'Onu bu sektörden uzak tut'),
        resolve: (c) => {
          c.h.flag(`fame_duet:${c.vars.pid}`);
          c.h.closeness(String(c.vars.pid), -5);
          const n = pn(c);
          return c.t(
            `You said show business eats children. ${n} slammed the door, then looked up music schools.`,
            `Şov dünyasının çocukları yiyip yuttuğunu söyledin. ${n} kapıyı çarptı, sonra da konservatuvarları araştırmaya başladı.`,
          );
        },
      },
    ],
  },
  {
    id: 'fame.song_contest',
    category: 'fame',
    minAge: 16,
    once: true,
    when: (c) => music(c) && free(c) && fs(c).fans >= 30000 && fs(c).songs.length > 0,
    title: (c) => c.t('You have been picked to represent the country at the big song contest.', 'Büyük uluslararası şarkı yarışmasında ülkeyi temsil etmek için seçildin.'),
    text: (c) =>
      c.t('Forty countries, one stage, a wind machine and a voting system nobody understands.', 'Kırk ülke, tek sahne, bir rüzgâr makinesi ve kimsenin anlamadığı bir oylama sistemi.'),
    choices: [
      ...(['ballad', 'dance'] as const).map(
        (style): ChoiceDef => ({
          id: style,
          label: (c) => (style === 'ballad' ? c.t('Sing a heartfelt ballad', 'Duygusal bir baladla çık') : c.t('Go with a wild dance number', 'Çılgın bir dans şovuyla çık')),
          badge: style === 'dance' ? 'Risky' : undefined,
          resolve: (c) => {
            const f = fs(c);
            const best = Math.max(0, ...f.songs.map((s) => s.quality));
            const score = style === 'ballad' ? f.skill * 0.5 + best * 0.25 + c.rng.int(0, 35) : f.skill * 0.3 + c.p.stats.looks * 0.2 + c.rng.int(0, 70);
            if (score >= 85) {
              const g = gainFans(c, f, f.fans * 0.5 + 200000);
              c.h.stat('happiness', 15);
              c.h.achieve('song_contest');
              return c.t(
                `You won! The whole country stayed up until 2 am. ${compact(c, g)} new fans, and next year the contest is held at home.`,
                `Kazandın! Bütün ülke gece ikiye kadar uyumadı. ${compact(c, g)} yeni hayran; seneye yarışma bizde yapılacak.`,
              );
            }
            if (score >= 55) {
              const g = gainFans(c, f, f.fans * 0.12 + 20000);
              c.h.stat('happiness', 4);
              const europe = ['tr', 'uk', 'de'].includes(c.p.countryId);
              return europe
                ? c.t(`You finished in the top ten. Respectable. ${compact(c, g)} new fans across Europe.`, `İlk ona girdin. Gayet saygın bir derece. Avrupa'nın dört bir yanından ${compact(c, g)} yeni hayran.`)
                : c.t(`You finished in the top ten. Respectable. ${compact(c, g)} new fans around the world.`, `İlk ona girdin. Gayet saygın bir derece. Dünyanın dört bir yanından ${compact(c, g)} yeni hayran.`);
            }
            c.h.stat('happiness', -6);
            const g = gainFans(c, f, f.fans * 0.04);
            return c.t(
              `You got zero points. The neighbours gave you twelve, but they were not on the jury. The memes brought ${compact(c, g)} fans.`,
              `Sıfır puan aldın. Komşular sana on iki puan verdi ama jüride değillerdi. Capsler sayesinde ${compact(c, g)} hayran geldi.`,
            );
          },
          tone: 'big',
        }),
      ),
      {
        id: 'withdraw',
        label: (c) => c.t('Withdraw', 'Çekil'),
        resolve: (c) => c.t('You pulled out. The country sent a man with a goat instead. He came fourth.', 'Çekildin. Ülke senin yerine keçili bir adam gönderdi. Dördüncü oldu.'),
      },
    ],
  },

  // ================================================================ social media
  {
    id: 'fame.brand_disaster',
    category: 'fame',
    weight: 20,
    once: true,
    when: (c) => {
      const last = c.p.eventLastAge['fame.brand_deal'];
      return social(c) && fs(c).fans >= 20000 && last !== undefined && c.age - last <= 5;
    },
    title: (c) => c.t('The product you promoted turned out to be a disaster.', 'Reklamını yaptığın ürün tam bir felaket çıktı.'),
    text: (c) =>
      c.t('Customers say it melted, exploded or turned their teeth blue. Possibly all three.', 'Müşteriler ürünün eridiğini, patladığını ya da dişlerini maviye boyadığını söylüyor. Belki üçü birden.'),
    choices: [
      {
        id: 'refund',
        label: (c) => c.t('Apologise and refund your fans', 'Özür dile, hayranlarına parayı iade et'),
        badge: 'Costs more',
        resolve: (c) => {
          const cost = wage(c, Math.min(50000, fs(c).fans * 0.1));
          c.h.money(-cost);
          const g = gainFans(c, fs(c), fs(c).fans * 0.03);
          return c.t(
            `You refunded ${c.h.fmt(cost)} out of your own pocket. People were stunned. ${compact(c, g)} new followers trust you now.`,
            `Kendi cebinden ${c.h.fmt(cost)} iade ettin. Herkes şaşırdı. ${compact(c, g)} yeni takipçi artık sana güveniyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'blame',
        label: (c) => c.t('Blame the brand', 'Suçu markaya at'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) return c.t('You said you were lied to as well. Everyone believed you. This time.', 'Sana da yalan söylendiğini anlattın. Herkes inandı. Bu seferlik.');
          const lost = scandal(c, 0.12);
          return c.t(
            `Someone leaked your messages with the brand. You knew everything. ${compact(c, lost)} followers left.`,
            `Biri markayla yazışmalarını sızdırdı. Her şeyi biliyormuşsun. ${compact(c, lost)} takipçi gitti.`,
          );
        },
      },
      {
        id: 'delete',
        label: (c) => c.t('Delete the posts and pretend nothing happened', 'Paylaşımları sil, hiçbir şey olmamış gibi yap'),
        resolve: (c) => {
          const lost = scandal(c, 0.08);
          return c.t(`The internet never forgets. It had screenshots. ${compact(c, lost)} followers left.`, `İnternet hiçbir şeyi unutmaz. Ekran görüntüleri çoktan alınmıştı. ${compact(c, lost)} takipçi gitti.`);
        },
        tone: 'bad',
      },
    ],
  },
  {
    id: 'fame.fake_followers',
    category: 'fame',
    once: true,
    when: (c) => social(c) && fs(c).fans >= 50000,
    title: (c) => c.t('A journalist says a third of your followers are bots.', 'Bir gazeteci, takipçilerinin üçte birinin bot olduğunu iddia ediyor.'),
    text: (c) => c.t('One of them is called "user8847261" and follows nine thousand accounts.', 'Birinin adı "user8847261" ve dokuz bin hesabı takip ediyor.'),
    choices: [
      {
        id: 'purge',
        label: (c) => c.t('Admit it and delete the bots', 'Kabul et, botları temizle'),
        resolve: (c) => {
          const lost = loseFans(fs(c), 0.25);
          c.h.stat('happiness', 3);
          return c.t(`You deleted ${compact(c, lost)} bots. Your numbers dropped. Your conscience rose.`, `${compact(c, lost)} botu sildin. Rakamların düştü, vicdanın rahatladı.`);
        },
        tone: 'good',
      },
      {
        id: 'deny',
        label: (c) => c.t('Deny everything', 'Her şeyi inkâr et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) return c.t('You denied it and the story died in a day. The bots liked your statement.', 'İnkâr ettin, haber bir günde unutuldu. Açıklamanı botlar beğendi.');
          const lost = scandal(c, 0.2);
          return c.t(`A second journalist proved it. ${compact(c, lost)} real followers left too.`, `İkinci bir gazeteci bunu kanıtladı. ${compact(c, lost)} gerçek takipçi de gitti.`);
        },
      },
      {
        id: 'cousin',
        label: (c) => c.t('Blame your cousin who "manages the account"', 'Hesabı "yöneten" kuzenini suçla'),
        resolve: (c) => {
          const lost = loseFans(fs(c), 0.1);
          return c.t(
            `You lost ${compact(c, lost)} followers. Your cousin has not spoken to you since. The bots still like every post.`,
            `${compact(c, lost)} takipçi kaybettin. Kuzenin o günden beri seninle konuşmuyor. Botlar ise hâlâ her paylaşımını beğeniyor.`,
          );
        },
      },
    ],
  },
  {
    id: 'fame.livestream_mishap',
    category: 'fame',
    minAge: 13,
    cooldown: 6,
    when: (c) => social(c) && fs(c).fans >= 2000,
    setup: (c) => {
      c.vars.what = c.rng.int(0, 2);
      c.vars.viewers = Math.max(40, Math.round(fs(c).fans * 0.05));
    },
    title: (c) => c.t('You forgot to end your livestream.', 'Canlı yayını kapatmayı unuttun.'),
    text: (c) => {
      const i = Number(c.vars.what);
      const v = compact(c, Number(c.vars.viewers));
      const mom = motherAlive(c);
      return c.t(
        `For forty minutes, ${v} people watched ${['you sing to your fridge', mom ? 'your mother ask loudly when you will get a real job' : 'your neighbour bang on the wall and shout "Some of us work in the morning!"', 'you argue with your router'][i]}.`,
        `Kırk dakika boyunca ${v} kişi ${['buzdolabına şarkı söyleyişini', mom ? 'annenin "Ne zaman doğru dürüst bir iş bulacaksın?" diye bağırışını' : 'komşunun duvarı yumruklayıp "Sabah işe gidecek insanlar var!" diye bağırışını', 'modeminle kavganı'][i]} izledi.`,
      );
    },
    choices: [
      {
        id: 'own',
        label: (c) => c.t('Lean into it', 'Olayı sahiplen'),
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.7)) {
            const g = gainFans(c, f, f.fans * 0.15 + 3000);
            return c.t(`You turned it into a weekly series. ${compact(c, g)} new followers.`, `Bunu haftalık bir seriye çevirdin. ${compact(c, g)} yeni takipçi.`);
          }
          return c.t('You tried to make it a series. The second episode felt staged, because it was.', 'Bunu seriye çevirmeye çalıştın. İkinci bölüm kurgu gibi durdu, çünkü kurguydu.');
        },
        tone: 'good',
      },
      {
        id: 'hide',
        label: (c) => c.t('Delete the recording and hide', 'Kaydı sil ve saklan'),
        resolve: (c) => {
          const lost = loseFans(fs(c), 0.03);
          c.h.stat('happiness', -3);
          return c.t(`You deleted it, but the clips live forever. ${compact(c, lost)} followers left.`, `Kaydı sildin ama kesitler sonsuza dek yaşıyor. ${compact(c, lost)} takipçi gitti.`);
        },
      },
    ],
  },
  {
    id: 'fame.hater_fan',
    category: 'fame',
    once: true,
    when: (c) => hasPath(c) && fameOf(c) >= 25,
    text: '',
    apply: (c) => {
      gainFans(c, fs(c), 500);
      c.h.stat('happiness', 6);
      return c.t(
        'Your most loyal hater, who wrote "cringe" under 412 of your posts, admitted they actually love your work. They now run your fan club.',
        '412 paylaşımının altına "cringe" yazan en sadık trolün, aslında işlerine bayıldığını itiraf etti. Artık hayran kulübünü o yönetiyor.',
      );
    },
    tone: 'good',
  },
  {
    id: 'fame.creator_feud',
    category: 'fame',
    minAge: 13,
    cooldown: 6,
    when: (c) => social(c) && fs(c).fans >= 10000,
    setup: (c) => {
      c.vars.rival = HANDLES[c.rng.int(0, HANDLES.length - 1)];
    },
    title: (c) => c.t(`${c.vars.rival} posted a video mocking you.`, `${c.vars.rival} seninle dalga geçtiği bir video paylaştı.`),
    text: (c) => c.t('The thumbnail is your face next to a crying emoji.', 'Kapak görselinde senin yüzün ve ağlayan bir emoji var.'),
    choices: [
      {
        id: 'diss',
        label: (c) => c.t('Make a reply video', 'Cevap videosu çek'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.55)) {
            const g = gainFans(c, f, f.fans * 0.25);
            return c.t(`Your reply was devastating and funny. ${compact(c, g)} new followers picked a side: yours.`, `Cevabın hem yıkıcı hem komikti. ${compact(c, g)} yeni takipçi taraf seçti: seni.`);
          }
          const lost = scandal(c, 0.08);
          return c.t(`Your reply aged badly within the hour. ${compact(c, lost)} followers left.`, `Cevap videon bir saat içinde eskidi. ${compact(c, lost)} takipçi gitti.`);
        },
      },
      {
        id: 'peace',
        label: (c) => c.t('Suggest a joint video', 'Ortak video teklif et'),
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.6)) {
            const g = gainFans(c, f, f.fans * 0.15);
            return c.t(
              `You filmed a "we were never enemies" video together. Both of you gained followers, ${compact(c, g)} for you.`,
              `Birlikte "biz hiç düşman olmadık" videosu çektiniz. İkiniz de kazandınız; sana ${compact(c, g)} yeni takipçi.`,
            );
          }
          return c.t(`${c.vars.rival} left you on read.`, `${c.vars.rival} mesajını görüp cevap vermedi.`);
        },
        tone: 'good',
      },
      {
        id: 'ignore',
        label: (c) => c.t('Ignore it', 'Görmezden gel'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You ignored it. You also watched it nineteen times.', 'Görmezden geldin. Bir de on dokuz kez izledin.');
        },
      },
    ],
  },
  {
    id: 'fame.stalker',
    category: 'fame',
    minAge: 16,
    maxAge: 85,
    cooldown: 12,
    when: (c) => hasPath(c) && free(c) && fameOf(c) >= 40,
    title: (c) => c.t('Someone has been following you everywhere.', 'Biri her yerde peşinden geliyor.'),
    text: (c) => c.t('Letters at your door, the same face at every event. Your manager is worried.', 'Kapında mektuplar, her etkinlikte aynı yüz. Menajerin endişeli.'),
    choices: [
      {
        id: 'police',
        label: (c) => c.t('Go to the police', 'Polise git'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t(
            'The police took it seriously. A restraining order was issued, and the letters stopped.',
            'Polis meseleyi ciddiye aldı. Uzaklaştırma kararı çıktı ve mektuplar kesildi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'security',
        label: (c) => c.t('Hire a security team', 'Koruma tut'),
        badge: 'Costs more',
        resolve: (c) => {
          const cost = wage(c, 25000);
          c.h.money(-cost);
          c.h.stat('happiness', 2);
          return c.t(
            `You hired security for ${c.h.fmt(cost)} and reported everything. You feel safe again, even if your bodyguard judges your snacks.`,
            `${c.h.fmt(cost)} verip koruma tuttun ve her şeyi resmî makamlara bildirdin. Yeniden güvendesin; gerçi koruman atıştırmalıklarını yargılıyor.`,
          );
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Move house quietly', 'Sessizce taşın'),
        resolve: (c) => {
          const cost = wage(c, 8000);
          c.h.money(-cost);
          c.h.stat('happiness', -2);
          return c.t(
            'You moved and gave the new address only to family. It was hard, but it ended there.',
            'Yeni bir eve taşındın ve adresi sadece ailene verdin. Zordu ama mesele orada kapandı.',
          );
        },
      },
    ],
  },

  // ================================================================ acting
  {
    id: 'fame.dizi_audition',
    category: 'fame',
    minAge: 16,
    maxAge: 70,
    cooldown: 6,
    when: (c) => acting(c) && free(c) && fs(c).roles >= 1,
    title: (c) => c.t('A huge historical drama series is casting.', 'Dev bir tarihî dizi için oyuncu aranıyor.'),
    text: (c) =>
      c.t('Horses, swords, 150-minute episodes and a moustache with its own trailer.', 'Atlar, kılıçlar, 150 dakikalık bölümler ve kendine ait karavanı olan bir bıyık.'),
    choices: [
      {
        id: 'lead',
        label: (c) => c.t('Train in riding and swordplay for the lead', 'Başrol için binicilik ve kılıç dersi al'),
        badge: 'Costs more',
        resolve: (c) => {
          const f = fs(c);
          c.h.money(-wage(c, 2000));
          f.skill = Math.min(100, f.skill + 2);
          f.roles++;
          if (c.rng.chance(0.35 + f.skill / 250)) {
            const pay = wage(c, 80000);
            c.h.money(pay);
            const g = gainFans(c, f, f.fans * 0.3 + 60000);
            return c.t(
              `You got the lead. Three seasons, ${c.h.fmt(pay)}, and ${compact(c, g)} new fans in forty countries who dub you in their own language.`,
              `Başrolü kaptın. Üç sezon, ${c.h.fmt(pay)} ve seni kendi dillerinde seslendiren kırk ülkeden ${compact(c, g)} yeni hayran.`,
            );
          }
          const pay = wage(c, 12000);
          c.h.money(pay);
          gainFans(c, f, 5000);
          return c.t(
            `The lead went to someone else, but you got the hero's loyal friend. You fell off a horse twice and earned ${c.h.fmt(pay)}.`,
            `Başrol başkasına gitti ama kahramanın sadık dostu rolünü aldın. İki kez attan düştün, ${c.h.fmt(pay)} kazandın.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'taster',
        label: (c) =>
          inTR(c)
            ? c.t("Audition for the sultan's food taster", 'Padişahın çeşnicibaşısı rolüne seçmelere gir')
            : c.t("Audition for the king's food taster", 'Kralın çeşnicibaşısı rolüne seçmelere gir'),
        resolve: (c) => {
          const f = fs(c);
          f.roles++;
          const pay = wage(c, 10000);
          c.h.money(pay);
          const g = gainFans(c, f, 8000);
          return c.t(
            `You got the part. You die heroically in episode three, after a soup. ${c.h.fmt(pay)} and ${compact(c, g)} new fans.`,
            `Rolü kaptın. Üçüncü bölümde bir çorbanın ardından kahramanca ölüyorsun. ${c.h.fmt(pay)} ve ${compact(c, g)} yeni hayran.`,
          );
        },
      },
      {
        id: 'pass',
        label: (c) => c.t('Pass', 'Pas geç'),
        resolve: (c) => c.t('You passed. The show ran for six seasons. Your aunt watches it every night.', 'Pas geçtin. Dizi altı sezon sürdü. Teyzen her akşam izliyor.'),
      },
    ],
  },
  {
    id: 'fame.typecast',
    category: 'fame',
    cooldown: 10,
    when: (c) => acting(c) && fs(c).roles >= 3,
    setup: (c) => {
      c.vars.type = c.rng.int(0, 2);
    },
    title: (c) => {
      const i = Number(c.vars.type);
      return c.t(`You have played ${['the villain', 'the cheating spouse', 'the nosy neighbour'][i]} in your last five roles.`, `Son beş rolünün hepsinde ${['kötü karakteri', 'aldatan eşi', 'meraklı komşuyu'][i]} oynadın.`);
    },
    text: (c) => c.t('People at the market treat you like the character. An aunt hit you with her handbag.', 'Pazarda insanlar sana karakterine davranır gibi davranıyor. Bir teyze çantasıyla vurdu bile.'),
    choices: [
      {
        id: 'embrace',
        label: (c) => c.t('Embrace it', 'Kabullen'),
        resolve: (c) => {
          const pay = wage(c, 30000);
          c.h.money(pay);
          const g = gainFans(c, fs(c), fs(c).fans * 0.05 + 1000);
          return c.t(
            `You signed for three more of the same. ${c.h.fmt(pay)} and ${compact(c, g)} new fans. Typecasting pays very well.`,
            `Aynı rolden üç tane daha imzaladın. ${c.h.fmt(pay)} ve ${compact(c, g)} yeni hayran. Aynı rolü oynamak çok iyi para ediyor.`,
          );
        },
      },
      {
        id: 'theatre',
        label: (c) => c.t('Go back to the theatre', 'Tiyatroya dön'),
        resolve: (c) => {
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 6);
          c.h.stat('happiness', 6);
          loseFans(f, 0.05);
          f.lastActiveYear = c.s.year;
          return c.t('You played Hamlet in a ninety-seat theatre. The critics wept. So did your accountant.', 'Doksan kişilik bir salonda Hamlet oynadın. Eleştirmenler ağladı. Muhasebecin de ağladı.');
        },
        tone: 'good',
      },
      {
        id: 'comedy',
        label: (c) => c.t('Pitch yourself for a comedy', 'Kendini bir komediye öner'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.4 + f.skill / 300)) {
            f.roles++;
            const g = gainFans(c, f, f.fans * 0.2 + 2000);
            return c.t(`Nobody knew you were funny. Now everybody does. ${compact(c, g)} new fans.`, `Kimse komik olduğunu bilmiyordu. Artık herkes biliyor. ${compact(c, g)} yeni hayran.`);
          }
          c.h.stat('happiness', -4);
          loseFans(f, 0.05);
          return c.t('The comedy flopped. Audiences kept waiting for you to betray someone.', 'Komedi çakıldı. Seyirci senin birine ihanet etmeni bekleyip durdu.');
        },
      },
    ],
  },
  {
    id: 'fame.stunt',
    category: 'fame',
    minAge: 18,
    maxAge: 65,
    cooldown: 6,
    when: (c) => acting(c) && free(c) && fs(c).roles >= 2,
    title: (c) => c.t('The director wants you to do your own stunt.', 'Yönetmen sahneyi dublörsüz çekmek istiyor.'),
    text: (c) =>
      c.t('A jump from a moving truck onto a moving boat. The insurance man has gone pale.', 'Hareket eden bir kamyondan hareket eden bir tekneye atlayış. Sigortacının yüzü bembeyaz.'),
    choices: [
      {
        id: 'self',
        label: (c) => c.t('Do it yourself', 'Kendin yap'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.6 + c.p.stats.health / 500)) {
            const g = gainFans(c, f, f.fans * 0.15 + 5000);
            c.h.stat('happiness', 6);
            return c.t(`You nailed it. The shot opens every trailer. ${compact(c, g)} new fans.`, `Tek seferde yaptın. O sahne bütün fragmanların açılışında. ${compact(c, g)} yeni hayran.`);
          }
          const hurt = c.rng.int(8, 18);
          c.h.stat('health', -hurt);
          c.h.stat('happiness', -5);
          return c.t('You missed the boat. Literally. Three weeks in a cast, and the film is delayed.', 'Tekneyi kaçırdın. Kelimenin tam anlamıyla. Üç hafta alçıda kaldın, film de ertelendi.');
        },
      },
      {
        id: 'double',
        label: (c) => c.t('Use the stunt double', 'Dublörü kullan'),
        resolve: (c) => c.t('Your stunt double did it perfectly. He now gets more fan mail than you.', 'Dublörün kusursuz yaptı. Artık senden çok hayran mektubu alıyor.'),
      },
    ],
  },
  {
    id: 'fame.method',
    category: 'fame',
    cooldown: 8,
    when: (c) => acting(c) && fs(c).skill >= 30,
    setup: (c) => {
      c.vars.role = c.rng.int(0, 2);
    },
    title: (c) => {
      const i = Number(c.vars.role);
      return c.t(
        `You are preparing to play ${['a lonely lighthouse keeper', 'a 17th-century fisherman', 'a very strict headmaster'][i]}.`,
        `${cap(['yalnız bir deniz feneri bekçisi', '17. yüzyıldan bir balıkçı', 'çok sert bir okul müdürü'][i])} rolüne hazırlanıyorsun.`,
      );
    },
    text: (c) => c.t('Your coach suggests staying in character for three months. Day and night.', 'Hocan üç ay boyunca, gece gündüz karakterden çıkmamanı öneriyor.'),
    choices: [
      {
        id: 'method',
        label: (c) => c.t('Go full method', 'Tamamen karaktere bürün'),
        resolve: (c) => {
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 8);
          c.h.stat('happiness', -3);
          const partner = c.h.partner();
          if (partner) c.h.closeness(partner.person.id, -6);
          if (c.rng.chance(0.3)) {
            const g = gainFans(c, f, f.fans * 0.1 + 1000);
            return c.t(
              `You stayed in character for three months. The performance had critics whispering "award". ${compact(c, g)} new fans.`,
              `Üç ay karakterden çıkmadın. Eleştirmenler kulaktan kulağa "ödül" diye fısıldıyor. ${compact(c, g)} yeni hayran.`,
            );
          }
          return c.t(
            "You stayed in character for three months. Your family started calling you by the character's name, and not kindly.",
            'Üç ay karakterden çıkmadın. Ailen sana karakterin adıyla seslenmeye başladı, hem de hiç sevecen olmayan bir tonla.',
          );
        },
      },
      {
        id: 'lines',
        label: (c) => c.t('Just learn your lines', 'Sadece repliklerini ezberle'),
        resolve: (c) => {
          fs(c).skill = Math.min(100, fs(c).skill + 3);
          return c.t('You learned your lines and went home at six. A revolutionary approach.', 'Repliklerini ezberledin ve saat altıda evine gittin. Devrim niteliğinde bir yöntem.');
        },
      },
    ],
  },
  {
    id: 'fame.director_tantrum',
    category: 'fame',
    cooldown: 6,
    when: (c) => acting(c) && free(c) && fs(c).roles >= 1,
    title: (c) => c.t('The director just threw a chair across the set.', 'Yönetmen az önce sette sandalye fırlattı.'),
    text: (c) => c.t('Apparently the light was "emotionally wrong". Everyone is looking at you.', 'Gerekçe: ışık "duygusal açıdan yanlış". Herkes sana bakıyor.'),
    choices: [
      {
        id: 'tea',
        label: (c) => c.t('Calm him down with a glass of tea', 'Bir bardak çayla sakinleştir'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            fs(c).skill = Math.min(100, fs(c).skill + 2);
            c.h.stat('happiness', 3);
            return c.t('He drank the tea, cried a little and called you his muse.', 'Çayı içti, biraz ağladı ve sana ilham perim dedi.');
          }
          return c.t('He threw the tea as well. The glass survived. The set did not.', 'Çayı da fırlattı. Bardak kırılmadı. Dekor kırıldı.');
        },
        tone: 'good',
      },
      {
        id: 'walk',
        label: (c) => c.t('Walk off the set', 'Seti terk et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const pay = wage(c, 5000);
            c.h.money(pay);
            return c.t(`The producers took your side and paid ${c.h.fmt(pay)} extra to keep you happy.`, `Yapımcılar senin tarafını tuttu; gönlün olsun diye ${c.h.fmt(pay)} ek ödeme yaptılar.`);
          }
          const lost = loseFans(fs(c), 0.05);
          return c.t(`The tabloids called you a diva. ${compact(c, lost)} fans agreed.`, `Magazin basını sana diva dedi. ${compact(c, lost)} hayran da hak verdi.`);
        },
      },
      {
        id: 'chair',
        label: (c) => c.t('Throw a chair back', 'Sen de bir sandalye fırlat'),
        resolve: (c) => {
          const f = fs(c);
          f.scandals++;
          const g = gainFans(c, f, f.fans * 0.05 + 800);
          return c.t(
            `The footage leaked. Half the country is on your side. The other half bought chairs. ${compact(c, g)} new fans anyway.`,
            `Görüntüler sızdı. Ülkenin yarısı senin tarafında, öbür yarısı sandalye aldı. Yine de ${compact(c, g)} yeni hayran.`,
          );
        },
      },
    ],
  },
  {
    id: 'fame.dubbing',
    category: 'fame',
    cooldown: 7,
    when: (c) => acting(c) && free(c) && fs(c).roles >= 1,
    title: (c) => c.t('A studio wants your voice.', 'Bir stüdyo senin sesini istiyor.'),
    text: (c) =>
      c.t(
        "Dub a Hollywood action star, or be the voice of a talking aubergine in a children's cartoon.",
        'Ya bir Hollywood aksiyon yıldızını seslendireceksin ya da bir çizgi filmdeki konuşan patlıcanı.',
      ),
    choices: [
      {
        id: 'action',
        label: (c) => c.t('Dub the action star', 'Aksiyon yıldızını seslendir'),
        resolve: (c) => {
          const pay = wage(c, 15000);
          c.h.money(pay);
          fs(c).skill = Math.min(100, fs(c).skill + 2);
          return c.t(
            `You shouted "Get down!" four hundred times for ${c.h.fmt(pay)}. Your voice is on every channel at nine in the evening.`,
            `${c.h.fmt(pay)} karşılığında dört yüz kez "Yere yatın!" diye bağırdın. Sesin artık her akşam dokuzda bütün kanallarda.`,
          );
        },
      },
      {
        id: 'aubergine',
        label: (c) => c.t('Voice the aubergine', 'Patlıcanı seslendir'),
        resolve: (c) => {
          const pay = wage(c, 8000);
          c.h.money(pay);
          c.h.stat('happiness', 8);
          const g = gainFans(c, fs(c), fs(c).fans * 0.05 + 10000);
          return c.t(
            `Children recognise your voice at the bakery now. One asked you to say "I am a vegetable!" ${compact(c, g)} new (small) fans.`,
            `Fırında çocuklar sesini tanıyor artık. Biri "Ben bir sebzeyim!" demeni istedi. ${compact(c, g)} yeni (minik) hayran.`,
          );
        },
        tone: 'good',
      },
    ],
  },

  // ================================================================ life around fame
  {
    id: 'fame.fan_wedding',
    category: 'fame',
    minAge: 16,
    cooldown: 6,
    when: (c) => hasPath(c) && free(c) && fameOf(c) >= 25,
    title: (c) => c.t('A fan has invited you to their wedding.', 'Bir hayranın seni düğününe davet etti.'),
    text: (c) =>
      byPath(
        c,
        ['The card says: "Our first dance was your song. Please come, there will be lamb."', 'The card says: "We met in your comment section. Please come, there will be lamb."', 'The card says: "We fell in love watching your show. Please come, there will be lamb."'],
        ['Davetiyede şöyle yazıyor: "İlk dansımızı senin şarkınla yaptık. Lütfen gel, kuzu tandır var."', 'Davetiyede şöyle yazıyor: "Senin paylaşımlarının altındaki yorumlarda tanıştık. Lütfen gel, kuzu tandır var."', 'Davetiyede şöyle yazıyor: "Senin dizini izlerken âşık olduk. Lütfen gel, kuzu tandır var."'],
      ),
    choices: [
      {
        id: 'go',
        label: (c) => (inTR(c) ? c.t('Show up and dance', 'Git ve halay çek') : c.t('Show up and dance', 'Git ve dans et')),
        resolve: (c) => {
          const f = fs(c);
          c.h.money(-wage(c, 200));
          c.h.stat('happiness', 8);
          const big = c.rng.chance(0.3);
          const g = gainFans(c, f, big ? f.fans * 0.2 + 10000 : f.fans * 0.03 + 1000);
          // pinning money on the couple is a Turkish (and Balkan) custom; elsewhere you raise a glass
          const [en, tr] = inTR(c)
            ? ['You danced until 2 am and pinned money on the couple.', 'Gece ikiye kadar halay çektin, çifte para taktın.']
            : ['You danced until 2 am and gave a toast nobody asked for.', 'Gece ikiye kadar dans ettin, kimsenin istemediği bir kadeh konuşması yaptın.'];
          return big
            ? c.t(`${en} The video went everywhere: ${compact(c, g)} new fans.`, `${tr} Video her yere yayıldı: ${compact(c, g)} yeni hayran.`)
            : c.t(`${en} ${compact(c, g)} new fans, mostly aunties.`, `${tr} ${compact(c, g)} yeni hayran; çoğu teyze.`);
        },
        tone: 'good',
      },
      {
        id: 'video',
        label: (c) => c.t('Send a video message', 'Video mesaj gönder'),
        resolve: (c) => {
          gainFans(c, fs(c), 500);
          return c.t('You sent a video message. The groom cried harder than the bride.', 'Video mesaj gönderdin. Damat gelinden çok ağladı.');
        },
      },
      {
        id: 'card',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) => c.t('You sent a card. They framed it anyway.', 'Bir tebrik kartı yolladın. Yine de çerçeveletip duvara astılar.'),
      },
    ],
  },
  {
    id: 'fame.talk_show',
    category: 'fame',
    minAge: 14,
    cooldown: 4,
    when: (c) => hasPath(c) && free(c) && fameOf(c) >= 30,
    title: (c) => c.t('You are a guest on the biggest late-night talk show.', 'En büyük gece kuşağı talk şovuna konuk oldun.'),
    text: (c) => c.t('The host has a desk, a mug and a reputation for making guests cry.', 'Sunucunun bir masası, bir kupası ve konuklarını ağlatmakla ünlü bir şöhreti var.'),
    choices: [
      {
        id: 'story',
        label: (c) => c.t('Tell a funny story', 'Komik bir anını anlat'),
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.35 + c.p.stats.smarts / 200)) {
            const g = gainFans(c, f, f.fans * 0.08 + 5000);
            return c.t(
              `Your story about your grandmother's pressure cooker became a meme. ${compact(c, g)} new fans.`,
              `Ninenin düdüklü tenceresiyle ilgili hikâyen caps oldu. ${compact(c, g)} yeni hayran.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t('Nobody laughed. The band played you off politely.', 'Kimse gülmedi. Orkestra seni kibarca müzikle uğurladı.');
        },
      },
      {
        id: 'plug',
        label: (c) => c.t('Promote your new project', 'Yeni projenin reklamını yap'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.04);
          return c.t(
            `You mentioned your project eleven times. The host started counting out loud. ${compact(c, g)} new fans.`,
            `Projenden on bir kez bahsettin. Sunucu yüksek sesle saymaya başladı. ${compact(c, g)} yeni hayran.`,
          );
        },
      },
      {
        id: 'open',
        label: (c) => c.t('Open up about your childhood', 'Çocukluğunu anlat'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const g = gainFans(c, fs(c), fs(c).fans * 0.06);
          return motherAlive(c)
            ? c.t(
                `You talked about growing up. Your mother called the show live to correct three details. ${compact(c, g)} new fans.`,
                `Çocukluğunu anlattın. Annen canlı yayına bağlanıp üç ayrıntıyı düzeltti. ${compact(c, g)} yeni hayran.`,
              )
            : c.t(
                `You talked about growing up. Your old primary school teacher called the show live to correct three details. ${compact(c, g)} new fans.`,
                `Çocukluğunu anlattın. İlkokul öğretmenin canlı yayına bağlanıp üç ayrıntıyı düzeltti. ${compact(c, g)} yeni hayran.`,
              );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'fame.death_hoax',
    category: 'fame',
    minAge: 18,
    cooldown: 15,
    when: (c) => fameOf(c) >= 45,
    title: (c) => c.t('A website has announced that you are dead.', 'Bir internet sitesi öldüğünü duyurdu.'),
    text: (c) => c.t('You read your own obituary over breakfast. It is quite moving.', 'Kahvaltıda kendi ölüm haberini okuyorsun. Oldukça dokunaklı.'),
    choices: [
      {
        id: 'selfie',
        label: (c) => c.t("Post a selfie with today's newspaper", 'Bugünün gazetesiyle fotoğraf paylaş'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.03);
          return c.t(
            `Your "Still alive" photo got more likes than anything you have ever made. ${compact(c, g)} new fans.`,
            `Gazeteyle çektiğin "Hâlâ hayattayım" fotoğrafı, bugüne kadar yaptığın her şeyden çok beğeni aldı. ${compact(c, g)} yeni hayran.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: (c) => c.t('Stay quiet and see who mourns you', 'Sesini çıkarma, kim yas tutuyor gör'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.1);
            return c.t(
              `Tributes poured in for three days. Then you posted "Thanks, everyone!" ${compact(c, g)} new fans, and a few very annoyed old ones.`,
              `Üç gün boyunca anma mesajları yağdı. Sonra "Herkese teşekkürler!" yazdın. ${compact(c, g)} yeni hayran ve epey sinirli birkaç eskisi.`,
            );
          }
          c.h.relatives(['mother', 'father', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, -8));
          c.h.stat('happiness', -4);
          return c.t('Your family did not find it funny. Not even a little.', 'Ailen bunu hiç komik bulmadı. Zerre kadar.');
        },
      },
      {
        id: 'sue',
        label: (c) => c.t('Sue the website', 'Siteyi dava et'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const won = wage(c, c.rng.int(5, 20) * 1000);
            c.h.money(won);
            return c.t(`You won ${c.h.fmt(won)} in damages. The website announced its own death.`, `Davayı kazandın ve ${c.h.fmt(won)} tazminat aldın. Site de kendi ölümünü duyurdu.`);
          }
          const fee = wage(c, 4000);
          c.h.money(-fee);
          return c.t(`The website was registered on a tiny island. The lawyers cost ${c.h.fmt(fee)}.`, `Site minicik bir adada kayıtlıymış. Avukatlar ${c.h.fmt(fee)} tuttu.`);
        },
      },
    ],
  },
  {
    id: 'fame.kids_paparazzi',
    category: 'fame',
    weight: 20,
    cooldown: 8,
    when: (c) => fameOf(c) >= 45 && kidsAged(c, 6, 15).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 6, 15)).person.id;
    },
    title: (c) => c.t(`Paparazzi photographed ${pn(c)} outside school.`, `Paparaziler ${acc(pn(c))} okul çıkışında görüntüledi.`),
    text: (c) => c.t('The photo is on every gossip site with a silly caption.', 'Fotoğraf saçma bir başlıkla bütün magazin sitelerinde.'),
    choices: [
      {
        id: 'statement',
        label: (c) => c.t('Make a public statement', 'Kamuoyuna açıklama yap'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          gainFans(c, fs(c), fs(c).fans * 0.02);
          return c.t('You asked the press to leave your children alone. Most outlets agreed, and the photos came down.', 'Basından çocuklarını rahat bırakmasını istedin. Çoğu yayın organı kabul etti, fotoğraflar kaldırıldı.');
        },
        tone: 'good',
      },
      {
        id: 'confront',
        label: (c) => c.t('Confront the photographers', 'Fotoğrafçılarla yüzleş'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) return c.t('You told them exactly what you thought. They backed off. Even paparazzi have mothers.', 'Onlara ne düşündüğünü tek tek söyledin. Geri çekildiler. Paparazilerin de annesi var sonuçta.');
          const lost = scandal(c, 0.06);
          return c.t(`The shouting match was filmed from three angles. ${compact(c, lost)} fans left.`, `Bağırış çağırış üç farklı açıdan çekildi. ${compact(c, lost)} hayran gitti.`);
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Move somewhere quieter', 'Daha sakin bir yere taşının'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 15000));
          c.h.closeness(String(c.vars.pid), 8);
          loseFans(fs(c), 0.05);
          const n = pn(c);
          return c.t(`You moved somewhere quiet. ${n} complains about how boring it is, which is the point.`, `Daha sakin bir yere taşındınız. ${n} artık sıkıldığından yakınıyor; amaç da buydu zaten.`);
        },
      },
    ],
  },
  {
    id: 'fame.mansion',
    category: 'fame',
    minAge: 22,
    once: true,
    when: (c) => hasPath(c) && free(c) && fameOf(c) >= 50 && c.p.money >= wage(c, 700000),
    setup: (c) => {
      c.vars.price = wage(c, c.rng.int(5, 8) * 100000);
    },
    title: (c) => c.t('A real estate agent wants to show you a mansion.', 'Bir emlakçı sana bir malikâne göstermek istiyor.'),
    text: (c) =>
      c.t(
        `Twelve bedrooms, a pool shaped like a star and a price of ${c.h.fmt(Number(c.vars.price))}.`,
        `On iki yatak odası, yıldız şeklinde bir havuz. Fiyatı ${c.h.fmt(Number(c.vars.price))}.`,
      ),
    choices: [
      {
        id: 'buy',
        label: (c) => c.t('Buy it', 'Satın al'),
        badge: 'Costs more',
        resolve: (c) => {
          const price = Number(c.vars.price);
          const old = c.p.home.owned ? c.p.home.value : 0;
          c.h.money(old - price);
          c.p.home = { name: c.t('Your mansion', 'Malikânen'), value: price, owned: true, furniture: c.p.home.furniture };
          c.h.stat('happiness', 10);
          c.h.achieve('homeowner');
          return old
            ? c.t(
                `You sold your old place for ${c.h.fmt(old)} and moved into the mansion. On the first night you got lost looking for the kitchen.`,
                `Eski evini ${c.h.fmt(old)} karşılığında satıp malikâneye taşındın. İlk gece mutfağı ararken kayboldun.`,
              )
            : c.t('You bought the mansion. On the first night you got lost looking for the kitchen.', 'Malikâneyi aldın. İlk gece mutfağı ararken kayboldun.');
        },
        tone: 'big',
      },
      {
        id: 'humble',
        label: (c) => c.t('Stay humble', 'Mütevazı kal'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You kept your old place. The neighbour still asks you to help carry his shopping.', 'Eski evinde kaldın. Komşun hâlâ pazar filelerini taşıman için seni çağırıyor.');
        },
      },
    ],
  },
  {
    id: 'fame.reunion_tour',
    category: 'fame',
    minAge: 50,
    maxAge: 85,
    once: true,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f && free(c) && f.peakFame >= 35 && !!(f.band?.name ?? f.oldBand);
    },
    setup: (c) => {
      const f = fs(c);
      c.vars.band = f.band?.name ?? f.oldBand ?? '';
    },
    title: (c) => c.t(`${c.vars.band} wants to get back together for one last tour.`, `${c.vars.band}, son bir turne için yeniden bir araya gelmek istiyor.`),
    text: (c) => c.t('Same songs, slower tempo, more reading glasses.', 'Aynı şarkılar, biraz daha yavaş tempo, biraz daha fazla okuma gözlüğü.'),
    choices: [
      {
        id: 'reunite',
        label: (c) => c.t('Get the band back together', 'Grubu yeniden topla'),
        resolve: (c) => {
          const f = fs(c);
          const pay = wage(c, 30000 + f.peakFame * 3000);
          c.h.money(pay);
          const g = gainFans(c, f, Math.max(20000, f.fans * 0.5));
          c.h.stat('health', -4);
          c.h.stat('happiness', 10);
          return c.t(
            `The reunion tour sold out and earned ${c.h.fmt(pay)}. In the encore you all forgot the second verse together, just like old times. ${compact(c, g)} fans, old and new.`,
            `Turnenin biletleri tükendi, kasaya ${c.h.fmt(pay)} girdi. Bisde ikinci kıtayı hep birlikte unuttunuz; tıpkı eski günlerdeki gibi. Eski yeni ${compact(c, g)} hayran.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'memory',
        label: (c) => c.t('Some songs are better as memories', 'Bazı şarkılar anı olarak kalmalı'),
        resolve: (c) => c.t('You said no. That evening you played the old album alone in the kitchen.', 'Hayır dedin. O akşam eski albümü mutfakta tek başına dinledin.'),
      },
    ],
  },
  {
    id: 'fame.pass_torch',
    category: 'fame',
    weight: 15,
    minAge: 45,
    once: true,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f && !f.torch && f.peakFame >= 40 && kidsAged(c, 16, 40).length > 0;
    },
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 16, 40)).person.id;
    },
    title: (c) => c.t(`${pn(c)} wants to follow in your footsteps.`, `${pn(c)} senin izinden gitmek istiyor.`),
    text: (c) => c.t(`${heOf(c) === 'she' ? 'She wants' : 'He wants'} to use your name on stage and is asking for your blessing.`, 'Sahnede senin adını kullanmak için izin istiyor.'),
    choices: [
      {
        id: 'bless',
        label: (c) => c.t('Give your blessing', 'İzin ver'),
        resolve: (c) => {
          fs(c).torch = String(c.vars.pid);
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 6);
          const n = pn(c);
          return c.t(
            `You gave ${n} your blessing and your old stage jacket. It still smells of smoke machines.`,
            `${dat(n)} hem iznini hem de eski sahne ceketini verdin. Ceket hâlâ sis makinesi kokuyor.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'dentist',
        label: (c) => c.t(`Tell ${himOf(c)} to become a dentist`, 'Diş hekimi olmasını söyle'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -6);
          const n = pn(c);
          return c.t(`You said show business is no life. ${n} said the same about dentistry.`, `Şov dünyasının hayat olmadığını söyledin. ${n} aynısını diş hekimliği için söyledi.`);
        },
      },
    ],
  },
  {
    id: 'fame.nepo_baby',
    category: 'fame',
    weight: 30,
    minAge: 14,
    // "nepo baby" is something columnists call the young: an heir who takes over at 50 has earned the grey hair
    maxAge: 40,
    once: true,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f?.legacyOf && !!f.path;
    },
    title: (c) => {
      const f = fs(c);
      const parent = f.legacyId ? c.h.person(f.legacyId) : undefined;
      const who = parent ? c.t(`your ${parent.gender === 'female' ? 'mom' : 'dad'}`, parent.gender === 'female' ? 'annen' : 'baban') : String(f.legacyOf);
      return c.t(`Everyone says you only made it because of ${who}.`, `Herkes buralara sadece ${who} sayesinde geldiğini söylüyor.`);
    },
    text: (c) => c.t('A columnist called you a "nepo baby". In bold.', 'Bir köşe yazarı sana "torpilli bebek" dedi. Hem de kalın harflerle.'),
    choices: [
      {
        id: 'lean',
        label: (c) => c.t('Lean into it', 'Üstüne oyna'),
        resolve: (c) => {
          const f = fs(c);
          const n = String(f.legacyOf);
          const g = gainFans(c, f, f.fans * 0.2 + 5000);
          return c.t(
            `You posted a baby photo of yourself on stage with ${n}. The internet melted. ${compact(c, g)} new fans.`,
            `${wth(n)} sahnede çekilmiş bebeklik fotoğrafını paylaştın. İnternet eridi. ${compact(c, g)} yeni hayran.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'prove',
        label: (c) => c.t('Prove them wrong', 'Haksız olduklarını kanıtla'),
        resolve: (c) => {
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 8);
          f.lastActiveYear = c.s.year;
          c.h.stat('happiness', -2);
          return c.t('You worked twice as hard as anyone. Nobody noticed, but you got a lot better.', 'Herkesten iki kat fazla çalıştın. Kimse fark etmedi ama çok geliştin.');
        },
      },
      {
        id: 'rename',
        label: (c) => c.t('Change your stage name', 'Sahne adını değiştir'),
        resolve: (c) => {
          const lost = loseFans(fs(c), 0.15);
          c.h.stat('happiness', 4);
          return c.t(
            `You picked a new stage name. ${compact(c, lost)} fans did not realise it was still you.`,
            `Kendine yeni bir sahne adı seçtin. ${compact(c, lost)} hayran, bunun hâlâ sen olduğunu anlamadı.`,
          );
        },
      },
    ],
  },
  {
    id: 'fame.trophy_auction',
    category: 'heirloom',
    minAge: 25,
    cooldown: 15,
    when: (c) => {
      const uids = peekFame(c.p)?.trophyUids ?? [];
      return uids.length > 0 && c.s.dynasty.heirlooms.some((h) => uids.includes(h.uid));
    },
    setup: (c) => {
      const uids = fs(c).trophyUids ?? [];
      const items = c.s.dynasty.heirlooms.filter((h) => uids.includes(h.uid));
      const item = items[c.rng.int(0, items.length - 1)];
      c.vars.uid = item.uid;
      c.vars.amt = wage(c, c.rng.int(4, 15) * 10000);
    },
    title: (c) => {
      const item = c.s.dynasty.heirlooms.find((h) => h.uid === c.vars.uid);
      return c.t(`An auction house wants to sell ${item?.name}.`, `Bir müzayede evi şu yadigârı satışa çıkarmak istiyor: ${item?.name}.`);
    },
    text: (c) =>
      c.t(
        `A collector has already offered ${c.h.fmt(Number(c.vars.amt))}. It would be the star of the night.`,
        `Bir koleksiyoncu şimdiden ${c.h.fmt(Number(c.vars.amt))} teklif etti. Gecenin yıldızı olurdu.`,
      ),
    choices: [
      {
        id: 'sell',
        label: (c) => c.t('Sell it', 'Sat gitsin'),
        badge: 'Breaks the chain',
        resolve: (c) => {
          const item = c.s.dynasty.heirlooms.find((h) => h.uid === c.vars.uid)!;
          c.s.dynasty.heirlooms = c.s.dynasty.heirlooms.filter((h) => h.uid !== c.vars.uid);
          const f = fs(c);
          f.trophyUids = (f.trophyUids ?? []).filter((u) => u !== c.vars.uid);
          c.h.money(Number(c.vars.amt));
          c.h.stat('happiness', -4);
          c.s.dynasty.legacyScore = Math.max(0, c.s.dynasty.legacyScore - 200);
          return c.t(
            `The hammer fell at ${c.h.fmt(Number(c.vars.amt))}. ${item.name} now lives in a stranger's glass case.`,
            `Tokmak ${c.h.fmt(Number(c.vars.amt))} rakamında indi. Yadigâr artık bir yabancının vitrininde: ${item.name}.`,
          );
        },
        tone: 'bad',
      },
      {
        id: 'museum',
        label: (c) => c.t('Lend it to a museum instead', 'Bir müzeye ödünç ver'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          gainFans(c, fs(c), 2000);
          return c.t('You lent it to a museum for a year. It came back with its own fan club.', 'Bir yıllığına bir müzeye ödünç verdin. Kendi hayran kulübüyle geri döndü.');
        },
        tone: 'good',
      },
      {
        id: 'keep',
        label: (c) => c.t('Keep it on the family shelf', 'Ailenin vitrininde kalsın'),
        resolve: (c) =>
          c.t(
            `You said no. It stays on the family shelf and gets dusted every ${inTR(c) ? 'bayram' : 'holiday'}.`,
            `Hayır dedin. Ailenin vitrininde kalıyor; her ${inTR(c) ? 'bayram' : 'yılbaşı'} tozu alınıyor.`,
          ),
      },
    ],
  },
  {
    id: 'fame.memoir_deal',
    category: 'fame',
    minAge: 30,
    once: true,
    when: (c) => fameOf(c) >= 40,
    setup: (c) => {
      c.vars.amt = wage(c, Math.min(250000, 20000 + fs(c).fans * 0.02));
    },
    title: (c) => c.t('A publisher wants your memoir.', 'Bir yayınevi hayatını kitap yapmak istiyor.'),
    text: (c) =>
      c.t(
        `They offer ${c.h.fmt(Number(c.vars.amt))} and a ghostwriter who has already titled it "Unfiltered".`,
        `${c.h.fmt(Number(c.vars.amt))} ve kitaba şimdiden "Filtresiz" adını koymuş bir hayalet yazar teklif ediyorlar.`,
      ),
    choices: [
      {
        id: 'tell_all',
        label: (c) => c.t('Tell everything', 'Her şeyi anlat'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          const pay = Math.round(Number(c.vars.amt) * 0.015) * 100;
          c.h.money(pay);
          gainFans(c, f, f.fans * 0.1);
          c.h.relatives(['mother', 'father', 'sibling', 'spouse', 'partner']).forEach((r) => c.h.closeness(r.person.id, -8));
          if (c.rng.chance(0.5)) f.scandals++;
          return c.t(
            `Your tell-all became a bestseller and paid ${c.h.fmt(pay)}. Three relatives and one ex no longer speak to you.`,
            `İfşa dolu kitabın çok satanlara girdi ve ${c.h.fmt(pay)} kazandırdı. Üç akraban ve bir eski sevgilin artık seninle konuşmuyor.`,
          );
        },
      },
      {
        id: 'gentle',
        label: (c) => c.t('Keep it gentle', 'Tatlı dille anlat'),
        resolve: (c) => {
          const pay = Math.round(Number(c.vars.amt) * 0.006) * 100;
          c.h.money(pay);
          c.h.stat('happiness', 4);
          return c.t(`Your memoir was warm and polite and paid ${c.h.fmt(pay)}. Your aunt bought forty copies.`, `Kitabın sıcak ve kibar oldu, ${c.h.fmt(pay)} kazandırdı. Teyzen kırk tane aldı.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Not yet', 'Henüz değil'),
        resolve: (c) => c.t('You said the best chapters are still unwritten.', 'En güzel bölümlerin henüz yazılmadığını söyledin.'),
      },
    ],
  },
  {
    id: 'fame.wax_figure',
    category: 'fame',
    once: true,
    when: (c) => fameOf(c) >= 70,
    title: (c) => c.t('A wax museum is making a figure of you.', 'Bir balmumu müzesi senin heykelini yapıyor.'),
    text: (c) => c.t('They need to measure your head. Twice.', 'Kafanın ölçüsünü almaları gerekiyor. İki kez.'),
    choices: [
      {
        id: 'unveil',
        label: (c) => c.t('Go to the unveiling', 'Açılışa git'),
        resolve: (c) => {
          c.h.achieve('wax');
          c.h.stat('happiness', 6);
          gainFans(c, fs(c), fs(c).fans * 0.01);
          const i = c.rng.int(0, 2);
          return c.t(
            [
              'It looks like you, if you were a slightly surprised uncle.',
              'It is perfect. Too perfect. You have avoided that room ever since.',
              'It is two centimetres taller than you. You did not complain.',
            ][i],
            ['Sana benziyor; biraz şaşırmış bir dayı olsaydın.', 'Kusursuz. Fazla kusursuz. O günden beri o salona girmiyorsun.', 'Senden iki santim uzun. Hiç itiraz etmedin.'][i],
          );
        },
        tone: 'good',
      },
      {
        id: 'prank',
        label: (c) => c.t('Stand in its place and wave at visitors', 'Onun yerine geç, ziyaretçilere el salla'),
        resolve: (c) => {
          c.h.achieve('wax');
          const g = gainFans(c, fs(c), fs(c).fans * 0.03);
          return c.t(
            `You stood still for an hour, then waved. A tourist dropped his ice cream. The video brought ${compact(c, g)} new fans.`,
            `Bir saat kıpırdamadan durdun, sonra el salladın. Bir turist dondurmasını düşürdü. Video ${compact(c, g)} yeni hayran getirdi.`,
          );
        },
        tone: 'good',
      },
    ],
  },
];

/** Event ids added in v0.7 (the test checks each one fires). */
export const MORE_FAME_EVENT_IDS = moreFameEvents.map((e) => e.id);
