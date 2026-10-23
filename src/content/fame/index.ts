import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef } from '../types';
import { cap, gen, wage } from '../base/util';
import { bandNames, compact as compactN, fameLevel, fameState, fameTitle, gainFans, isPath, loseFans, peekFame, songTitle, type FamePath } from './state';
import type { GameState } from '../../engine/types';

// "Fame" expansion: music, social media and acting careers, the single-player side of Popmundo.
export const FAME_ENTITLEMENT = 'pack.fame';

/** Tour ladder: cities, fans needed to get booked. */
export const TOURS = [
  { cities: 5, fans: 10_000, name: 'regional mini-tour', pitch: 'Five cities, a borrowed van and a merch box you packed yourself.', done: 'You played five sweaty clubs and sold out of T-shirts in two.',
    nameTr: 'bölgesel mini turne', pitchTr: 'Beş şehir, ödünç bir minibüs ve kendi elinle doldurduğun bir koli tişört.', doneTr: 'Beş ter kokulu kulüpte çaldın, tişörtler daha ikinci şehirde bitti.' },
  { cities: 10, fans: 30_000, name: 'national club tour', pitch: 'Ten cities across the country. Real venues, a real sound engineer.', done: 'Ten cities, ten encores. People knew the words.',
    nameTr: 'ulusal kulüp turnesi', pitchTr: 'Ülkenin dört bir yanında on şehir. Gerçek mekânlar, gerçek bir ses teknisyeni.', doneTr: 'On şehir, on bis. İnsanlar sözleri ezbere biliyordu.' },
  { cities: 20, fans: 100_000, name: 'theater tour', pitch: 'Twenty cities with seats, lighting rigs and a tour manager who never sleeps.', done: 'Twenty theaters, twenty standing ovations, one lost suitcase.',
    nameTr: 'tiyatro turnesi', pitchTr: 'Koltuklu salonlar, ışık sistemleri ve hiç uyumayan bir turne menajeriyle yirmi şehir.', doneTr: 'Yirmi tiyatro, yirmi ayakta alkış, bir kayıp bavul.' },
  { cities: 30, fans: 300_000, name: 'arena tour', pitch: 'Thirty cities, thirty nights, one tour bus with a broken toilet.', done: 'Thirty arenas. You cannot remember which city you are in.',
    nameTr: 'arena turnesi', pitchTr: 'Otuz şehir, otuz gece ve tuvaleti bozuk tek bir turne otobüsü.', doneTr: 'Otuz arena. Hangi şehirde olduğunu artık hatırlamıyorsun.' },
  { cities: 50, fans: 1_000_000, name: 'world tour', pitch: 'Fifty cities on five continents. Stadiums. Private jet. Your face on buildings.', done: 'You played fifty cities around the world. A stadium in another continent sang your song back to you.',
    nameTr: 'dünya turnesi', pitchTr: 'Beş kıtada elli şehir. Stadyumlar. Özel jet. Binalarda kocaman suratın.', doneTr: 'Dünya çapında elli şehirde çaldın. Başka bir kıtadaki koca bir stadyum şarkını sana geri söyledi.' },
] as const;

function nextTour(f: { tours?: number }) {
  const done = f.tours ?? 0;
  return done < TOURS.length ? TOURS[done] : TOURS[TOURS.length - 1]; // after the world tour, repeat it
}

const fameOf = (c: Ctx) => fameLevel(peekFame(c.p)?.fans ?? 0);
const hasPath = (c: Ctx) => !!peekFame(c.p)?.path;
const free = (c: Ctx) => c.p.jailYears === 0;
/** Fan counts in the story language: 12.3K / 12,3 B. */
const compact = (c: Ctx | GameState, n: number) => compactN(n, c.lang ?? 'en');

function choosePath(path: FamePath, line: string, lineTr: string): ChoiceDef {
  return {
    id: path,
    label: (c) => ({ music: c.t('Music', 'Müzik'), social: c.t('Social media', 'Sosyal medya'), acting: c.t('Acting', 'Oyunculuk') })[path],
    resolve: (c) => {
      const f = fameState(c.p);
      f.path = path;
      f.lastActiveYear = c.s.year;
      c.h.stat('happiness', 5);
      return c.t(line, lineTr);
    },
    tone: 'big',
  };
}

const bandChoice = (i: number): ChoiceDef => ({
  id: `band${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const f = fameState(c.p);
    const members = [0, 1, 2].map(() => c.h.newPerson({ age: Math.max(14, c.age + c.rng.int(-3, 3)) }));
    members.forEach((m) => c.h.addRelation(m, 'friend', c.rng.int(55, 80)));
    f.band = { name: String(c.vars[`name${i}`]), members: members.map((m) => m.id) };
    const names = members.map((m) => m.firstName).join(', ');
    return c.t(
      `You formed a band called ${f.band.name} with ${names}. First rehearsal is in a garage that smells like oil.`,
      `${names} ile ${f.band.name} adında bir grup kurdun. İlk prova, motor yağı kokan bir garajda.`,
    );
  },
  tone: 'big',
});

const BRANDS = ['a suspicious energy drink', 'a teeth-whitening pen', 'a crypto app', 'a meal-kit company', 'a luxury hotel'];
const BRANDS_TR = ['şüpheli bir enerji içeceği', 'bir diş beyazlatma kalemi', 'bir kripto uygulaması', 'bir hazır yemek kiti şirketi', 'lüks bir otel'];
/** Genitive forms for "___ reklamını yaptın". */
const BRANDS_TR_GEN = ['şüpheli bir enerji içeceğinin', 'bir diş beyazlatma kaleminin', 'bir kripto uygulamasının', 'bir hazır yemek kiti şirketinin', 'lüks bir otelin'];

// ------------------------------------------------------------------ events
const events: EventDef[] = [
  {
    id: 'fame.choose_path',
    category: 'fame',
    scheduled: true,
    title: (c) => c.t('You want to be famous. But for what?', 'Ünlü olmak istiyorsun. Peki ama neyle?'),
    text: (c) => c.t('Every path starts small. Some end on billboards.', 'Her yol küçük başlar. Bazıları dev reklam panolarında biter.'),
    choices: [
      choosePath('music', 'You decided to become a musician. Your neighbors decided to buy earplugs.', 'Müzisyen olmaya karar verdin. Komşuların da kulak tıkacı almaya karar verdi.'),
      choosePath('social', 'You decided to become a content creator. You bought a ring light the same day.', 'İçerik üreticisi olmaya karar verdin. Aynı gün bir halka ışık aldın.'),
      choosePath('acting', 'You decided to become an actor. You practiced crying in the mirror for an hour.', 'Oyuncu olmaya karar verdin. Bir saat boyunca aynanın karşısında ağlama çalıştın.'),
      { id: 'later', label: (c) => c.t('Not yet', 'Şimdi değil'), resolve: (c) => c.t('You decided fame can wait.', 'Şöhret biraz bekleyebilir dedin.') },
    ],
  },
  {
    id: 'fame.band_name',
    category: 'fame',
    scheduled: true,
    setup: (c) => bandNames(c).forEach((n, i) => (c.vars[`name${i}`] = n)),
    title: (c) => c.t('Your new band needs a name.', 'Yeni grubunun bir isme ihtiyacı var.'),
    text: (c) => c.t('Everybody has an opinion. The drummer wants something with "skull" in it.', 'Herkesin bir fikri var. Davulcu içinde "kafatası" geçen bir şey istiyor.'),
    choices: [bandChoice(0), bandChoice(1), bandChoice(2)],
  },
  {
    id: 'fame.label_offer',
    category: 'fame',
    minAge: 16,
    once: true,
    when: (c) => isPath(c, 'music') && !fameState(c.p).label && fameState(c.p).fans >= 5000,
    setup: (c) => {
      c.vars.advance = wage(c, c.rng.int(20000, 80000));
    },
    title: (c) => c.t('A record label wants to sign you.', 'Bir plak şirketi seninle anlaşmak istiyor.'),
    text: (c) =>
      c.t(
        `The major label offers a ${c.h.fmt(Number(c.vars.advance))} advance. A small indie label offers creative freedom and free pizza.`,
        `Büyük plak şirketi ${c.h.fmt(Number(c.vars.advance))} avans teklif ediyor. Küçük bir bağımsız şirket ise yaratıcı özgürlük ve bedava pizza.`,
      ),
    choices: [
      {
        id: 'major',
        label: (c) => c.t('Sign with the major label', 'Büyük şirketle anlaş'),
        badge: 'Big money',
        resolve: (c) => {
          const f = fameState(c.p);
          f.label = 'major';
          c.h.money(Number(c.vars.advance));
          gainFans(c, f, f.fans * 0.5);
          return c.t(
            `You signed with a major label and got a ${c.h.fmt(Number(c.vars.advance))} advance. A man in sunglasses now calls you "kid".`,
            `Büyük bir plak şirketiyle anlaştın ve ${c.h.fmt(Number(c.vars.advance))} avans aldın. Güneş gözlüklü bir adam artık sana "evlat" diyor.`,
          );
        },
        tone: 'big',
      },
      {
        id: 'indie',
        label: (c) => c.t('Go with the indie label', 'Bağımsız şirketi seç'),
        resolve: (c) => {
          const f = fameState(c.p);
          f.label = 'indie';
          c.h.stat('happiness', 6);
          gainFans(c, f, f.fans * 0.2);
          return c.t('You signed with the indie label. The pizza was excellent.', 'Bağımsız şirketle anlaştın. Pizza gerçekten efsaneydi.');
        },
        tone: 'good',
      },
      { id: 'self', label: (c) => c.t('Stay independent', 'Bağımsız kal'), resolve: (c) => c.t('You turned both labels down. You will do it your way.', 'İki şirketi de geri çevirdin. Bu işi kendi bildiğin gibi yapacaksın.') },
    ],
  },
  {
    id: 'fame.viral_song',
    category: 'fame',
    cooldown: 6,
    when: (c) => isPath(c, 'music') && fameState(c.p).songs.some((s) => s.released && s.quality >= 72 && c.s.year - s.year <= 2),
    setup: (c) => {
      const song = fameState(c.p).songs.filter((s) => s.released && s.quality >= 72).pop()!;
      c.vars.title = song.title;
    },
    text: '',
    apply: (c) => {
      const f = fameState(c.p);
      const g = gainFans(c, f, f.fans * 2 + 20000);
      c.h.stat('happiness', 10);
      c.h.achieve('viral');
      return c.t(
        `"${c.vars.title}" blew up on short videos. ${compact(c, g)} new fans in a month. Strangers sing it at you on the bus.`,
        `"${c.vars.title}" kısa videolarda patladı. Bir ayda ${compact(c, g)} yeni hayran. Otobüste yabancılar şarkını sana söylüyor.`,
      );
    },
    tone: 'big',
  },
  {
    id: 'fame.paparazzi',
    category: 'fame',
    cooldown: 3,
    when: (c) => fameOf(c) >= 50 && free(c),
    title: (c) => c.t('Paparazzi are waiting outside your favorite café.', 'En sevdiğin kafenin önünde paparaziler bekliyor.'),
    text: (c) => c.t('You have no make-up, yesterday\'s clothes and a simit in your hand.', 'Makyaj yok, üstünde dünkü kıyafetler, elinde bir simit.'),
    choices: [
      {
        id: 'smile',
        label: (c) => c.t('Smile and wave', 'Gülümse ve el salla'),
        resolve: (c) => {
          gainFans(c, fameState(c.p), 2000);
          return c.t('You smiled and waved. "Down to earth" became your headline.', 'Gülümseyip el salladın. Ertesi gün manşet: "Ne kadar da mütevazı!"');
        },
      },
      {
        id: 'shove',
        label: (c) => c.t('Shove the camera away', 'Kamerayı it'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fameState(c.p);
          if (c.rng.chance(0.5)) {
            f.scandals++;
            const lost = loseFans(f, 0.12);
            return c.t(
              `The photo of you shoving a photographer was everywhere. You lost ${compact(c, lost)} fans.`,
              `Fotoğrafçıyı ittiğin kare her yerdeydi. ${compact(c, lost)} hayran kaybettin.`,
            );
          }
          return c.t('You pushed the camera away. Weirdly, people loved it.', 'Kamerayı ittin. Nedense insanlar bayıldı.');
        },
      },
      { id: 'hide', label: (c) => c.t('Hide behind the menu', 'Menünün arkasına saklan'), resolve: (c) => c.t('You hid behind the menu for two hours. The waiter kept bringing tea.', 'İki saat menünün arkasında saklandın. Garson durmadan çay getirdi.') },
    ],
  },
  {
    id: 'fame.scandal',
    category: 'fame',
    cooldown: 7,
    when: (c) => fameOf(c) >= 40,
    title: (c) => c.t('Your old posts from ten years ago have resurfaced.', 'On yıl önceki eski paylaşımların gün yüzüne çıktı.'),
    text: (c) => c.t('They are... not great. Your name is trending for the wrong reasons.', 'Pek... iç açıcı değiller. Adın yanlış sebeplerle gündemde.'),
    choices: [
      {
        id: 'apologize',
        label: (c) => c.t('Post a sincere apology', 'İçten bir özür paylaş'),
        resolve: (c) => {
          const f = fameState(c.p);
          f.scandals++;
          const lost = loseFans(f, 0.08);
          return c.t(`You apologized. Most people moved on. You lost ${compact(c, lost)} fans.`, `Özür diledin. Çoğu kişi konuyu kapattı. ${compact(c, lost)} hayran kaybettin.`);
        },
      },
      {
        id: 'double',
        label: (c) => c.t('Double down', 'Geri adım atma'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fameState(c.p);
          f.scandals++;
          if (c.rng.chance(0.35)) {
            const g = gainFans(c, f, f.fans * 0.2);
            return c.t(
              `You doubled down. Somehow you gained ${compact(c, g)} fans. The internet is a strange place.`,
              `Arkasında durdun. Nasıl olduysa ${compact(c, g)} hayran kazandın. İnternet tuhaf bir yer.`,
            );
          }
          const lost = loseFans(f, 0.35);
          c.h.stat('happiness', -10);
          return c.t(
            `You doubled down. It went very badly. You lost ${compact(c, lost)} fans and two sponsors.`,
            `Arkasında durdun. Çok kötü oldu. ${compact(c, lost)} hayran ve iki sponsor kaybettin.`,
          );
        },
      },
      {
        id: 'silent',
        label: (c) => c.t('Go silent for a while', 'Bir süre ortadan kaybol'),
        resolve: (c) => {
          const lost = loseFans(fameState(c.p), 0.15);
          return c.t(`You logged off for three months. It blew over, but ${compact(c, lost)} fans left.`, `Üç ay internete girmedin. Fırtına dindi ama ${compact(c, lost)} hayran gitti.`);
        },
      },
    ],
  },
  {
    id: 'fame.award',
    category: 'fame',
    cooldown: 4,
    when: (c) => {
      const f = peekFame(c.p);
      if (!f || fameLevel(f.fans) < 55) return false;
      return f.path === 'acting' ? f.roles >= 3 : f.albums.some((a) => a.quality >= 70 && c.s.year - a.year <= 1) || f.path === 'social';
    },
    title: (c) => c.t('You have been nominated for a major award!', 'Büyük bir ödüle aday gösterildin!'),
    text: (c) => c.t('The ceremony is next month. Your outfit costs more than your first car.', 'Tören gelecek ay. Kıyafetin ilk arabandan pahalı.'),
    choices: [
      {
        id: 'attend',
        label: (c) => c.t('Attend and hope', 'Git ve umut et'),
        resolve: (c) => {
          const f = fameState(c.p);
          c.h.money(-wage(c, 3000));
          if (c.rng.chance(0.35)) {
            f.awards++;
            gainFans(c, f, f.fans * 0.3);
            c.h.achieve('award');
            const path = f.path ?? 'music';
            const trophy = { music: 'Golden Record', social: 'Creator of the Year award', acting: 'Best Performance statuette' }[path];
            // Turkish: plain form for sentences, possessive form after "Ada'nın ..."
            const trophyTr = { music: 'Altın Plak', social: 'Yılın İçerik Üreticisi ödülü', acting: 'En İyi Performans heykelciği' }[path];
            const trophyTrPoss = { music: 'Altın Plağı', social: 'Yılın İçerik Üreticisi Ödülü', acting: 'En İyi Performans Heykelciği' }[path];
            c.h.addHeirloom(
              'trophy',
              c.t(`${c.p.firstName}'s ${trophy}`, `${gen(c.p.firstName)} ${trophyTrPoss}`),
              c.t(`${c.p.firstName} won it on stage in ${c.s.year}.`, `${c.p.firstName} bunu ${c.s.year} yılında sahnede kazandı.`),
            );
            c.h.stat('happiness', 15);
            return c.t(
              `You won! You forgot everyone's name in your speech except your grandmother's. The ${trophy} goes on the family shelf.`,
              `Kazandın! Konuşmanda babaannen dışında herkesin adını unuttun. ${cap(trophyTr)} artık ailenin vitrininde.`,
            );
          }
          c.h.stat('happiness', -3);
          return c.t('You did not win. You clapped so hard for the winner that it became a meme.', 'Kazanamadın. Kazananı öyle coşkuyla alkışladın ki capsi oldun.');
        },
      },
      { id: 'skip', label: (c) => c.t('Skip it', 'Gitme'), resolve: (c) => c.t('You skipped the ceremony and watched it in pajamas.', 'Töreni pijamalarınla evden izledin.') },
    ],
  },
  {
    id: 'fame.bandmate_quits',
    category: 'fame',
    cooldown: 6,
    when: (c) => !!peekFame(c.p)?.band && peekFame(c.p)!.band!.members.length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(fameState(c.p).band!.members);
    },
    title: (c) => {
      const n = c.h.person(String(c.vars.pid)).firstName;
      return c.t(`${n} wants to leave the band.`, `${n} gruptan ayrılmak istiyor.`);
    },
    text: (c) => c.t('Creative differences. Also, they want a salary.', 'Sanatsal görüş ayrılıkları. Bir de maaş istiyor.'),
    choices: [
      {
        id: 'convince',
        label: (c) => c.t('Convince them to stay', 'Kalması için ikna et'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), 8);
            const n = c.h.person(String(c.vars.pid)).firstName;
            return c.t(`${n} agreed to stay. For now.`, `${n} kalmayı kabul etti. Şimdilik.`);
          }
          fameState(c.p).band!.members = fameState(c.p).band!.members.filter((m) => m !== c.vars.pid);
          const n = c.h.person(String(c.vars.pid)).firstName;
          return c.t(`${n} left anyway and started a rival band.`, `${n} yine de ayrıldı ve rakip bir grup kurdu.`);
        },
      },
      {
        id: 'solo',
        label: (c) => c.t('Break up the band and go solo', 'Grubu dağıt, solo kariyere geç'),
        badge: 'Big change',
        resolve: (c) => {
          const f = fameState(c.p);
          const name = f.band!.name;
          f.band = null;
          loseFans(f, 0.1);
          return c.t(`${name} broke up. Your solo career starts now.`, `${name} dağıldı. Solo kariyerin şimdi başlıyor.`);
        },
      },
    ],
  },
  {
    id: 'fame.brand_deal',
    category: 'fame',
    cooldown: 3,
    when: (c) => isPath(c, 'social') && fameState(c.p).fans >= 20000,
    setup: (c) => {
      c.vars.amt = wage(c, Math.min(200000, fameState(c.p).fans * 0.4));
      const bi = c.rng.int(0, BRANDS.length - 1); // same single RNG call as rng.pick(BRANDS)
      c.vars.brand = BRANDS[bi];
      c.vars.bi = bi;
    },
    title: (c) =>
      c.lang === 'tr'
        ? `${cap(BRANDS_TR[Number(c.vars.bi)])} sana reklam teklif ediyor.`
        : `${String(c.vars.brand)[0].toUpperCase()}${String(c.vars.brand).slice(1)} wants you to promote them.`,
    text: (c) => c.t(`They offer ${c.h.fmt(Number(c.vars.amt))} for three posts.`, `Üç paylaşım için ${c.h.fmt(Number(c.vars.amt))} veriyorlar.`),
    choices: [
      {
        id: 'take',
        label: (c) => c.t('Take the money', 'Parayı al'),
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          const brandTr = BRANDS_TR_GEN[Number(c.vars.bi)];
          if (c.rng.chance(0.3)) {
            const lost = loseFans(fameState(c.p), 0.1);
            return c.t(
              `You promoted ${c.vars.brand}. Your fans called you a sellout and ${compact(c, lost)} unfollowed.`,
              `${cap(brandTr)} reklamını yaptın. Hayranların sana "satılmış" dedi ve ${compact(c, lost)} kişi takibi bıraktı.`,
            );
          }
          return c.t(
            `You promoted ${c.vars.brand} and earned ${c.h.fmt(Number(c.vars.amt))}.`,
            `${cap(brandTr)} reklamını yaptın ve ${c.h.fmt(Number(c.vars.amt))} kazandın.`,
          );
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Decline', 'Reddet'),
        resolve: (c) => {
          gainFans(c, fameState(c.p), 1000);
          return c.t('You turned the deal down and told your fans why. They respected it.', 'Anlaşmayı reddettin ve nedenini hayranlarına anlattın. Saygı duydular.');
        },
      },
    ],
  },
  {
    // Staged tours: each one unlocks after the previous is done and the fan base is big enough.
    id: 'fame.tour',
    category: 'fame',
    cooldown: 2,
    when: (c) => {
      if (!isPath(c, 'music') || !free(c)) return false;
      const t = nextTour(fameState(c.p));
      return !!t && fameState(c.p).fans >= t.fans;
    },
    setup: (c) => {
      const f = fameState(c.p);
      const t = nextTour(f)!;
      c.vars.tier = TOURS.indexOf(t);
      c.vars.repeat = (f.tours ?? 0) >= TOURS.length ? 1 : 0;
    },
    title: (c) => {
      const t = TOURS[Number(c.vars.tier)];
      if (c.lang === 'tr')
        return c.vars.repeat ? `Hayranların ${t.cities} şehirlik bir ${t.nameTr} daha istiyor.` : `Menajerin ${t.cities} şehirlik bir ${t.nameTr} ayarladı.`;
      return c.vars.repeat ? `Your fans want another ${t.cities}-city ${t.name}.` : `Your manager has booked a ${t.cities}-city ${t.name}.`;
    },
    text: (c) => c.t(TOURS[Number(c.vars.tier)].pitch, TOURS[Number(c.vars.tier)].pitchTr),
    choices: [
      {
        id: 'go',
        label: (c) => c.t(`Go on the ${TOURS[Number(c.vars.tier)].cities}-city tour`, `${TOURS[Number(c.vars.tier)].cities} şehirlik turneye çık`),
        resolve: (c) => {
          const f = fameState(c.p);
          const t = TOURS[Number(c.vars.tier)];
          // a tour booked right at the edge of your fan base can play to half-empty rooms
          const shaky = f.fans < t.fans * 1.5 && c.rng.chance(0.25);
          const pay = wage(c, Math.min(5_000_000, f.fans * 0.02 * t.cities) * (shaky ? 0.45 : 1));
          c.h.money(pay);
          const g = gainFans(c, f, f.fans * (shaky ? 0.04 : 0.08 + t.cities / 250));
          c.h.stat('health', -Math.ceil(2 + t.cities / 6));
          c.h.stat('happiness', shaky ? -3 : 6);
          const partner = c.h.partner();
          if (partner) c.h.closeness(partner.person.id, -Math.ceil(t.cities / 5));
          if (!c.vars.repeat) f.tours = (f.tours ?? 0) + 1;
          if (t.cities === 50) c.h.achieve('world_tour');
          if (c.lang === 'tr') {
            const stageTr = c.vars.repeat ? '' : ` Turne ${Number(c.vars.tier) + 1}/${TOURS.length} tamamlandı.`;
            return shaky
              ? `${cap(t.nameTr)} bazı şehirlerde yarı boş salonlara çaldı. Yine de ${c.h.fmt(pay)} ve ${compact(c, g)} hayran kazandırdı.${stageTr}`
              : `${t.doneTr} Turne ${c.h.fmt(pay)} ve ${compact(c, g)} yeni hayran getirdi.${stageTr}`;
          }
          const stage = c.vars.repeat ? '' : ` Tour ${Number(c.vars.tier) + 1} of ${TOURS.length} done.`;
          return shaky
            ? `The ${t.name} played to half-empty rooms in some cities. It still earned ${c.h.fmt(pay)} and ${compact(c, g)} fans.${stage}`
            : `${t.done} The tour earned ${c.h.fmt(pay)} and ${compact(c, g)} new fans.${stage}`;
        },
        tone: 'good',
      },
      { id: 'rest', label: (c) => c.t('Not this year', 'Bu yıl olmaz'), resolve: (c) => (c.h.stat('health', 4), c.t('You said no to the tour and slept for a week.', 'Turneye hayır dedin ve bir hafta boyunca uyudun.')) },
    ],
  },
  {
    id: 'fame.reality_show',
    category: 'fame',
    once: true,
    when: (c) => hasPath(c) && fameOf(c) >= 30 && fameOf(c) < 70,
    title: (c) => c.t('A reality show wants you as a contestant.', 'Bir realite şovu seni yarışmacı olarak istiyor.'),
    text: (c) => c.t('Eight celebrities, one villa, unlimited cameras.', 'Sekiz ünlü, bir villa, sınırsız kamera.'),
    choices: [
      {
        id: 'join',
        label: (c) => c.t('Join the show', 'Programa katıl'),
        resolve: (c) => {
          const f = fameState(c.p);
          const g = gainFans(c, f, f.fans * 0.8);
          c.h.stat('happiness', -5);
          c.h.money(wage(c, 25000));
          return c.t(
            `You joined the show and gained ${compact(c, g)} fans. You also cried on camera about a sandwich.`,
            `Programa katıldın ve ${compact(c, g)} hayran kazandın. Bir de kamera karşısında bir sandviç yüzünden ağladın.`,
          );
        },
      },
      { id: 'no', label: (c) => c.t('Keep your dignity', 'Onurunu koru'), resolve: (c) => c.t('You said no. You watched the show anyway and judged everyone.', 'Hayır dedin. Yine de programı izleyip herkesi yerden yere vurdun.') },
    ],
  },
  {
    id: 'fame.comeback',
    category: 'fame',
    once: true,
    minAge: 40,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f && f.peakFame >= 55 && fameLevel(f.fans) < 35;
    },
    title: (c) => c.t('Fans are asking for a comeback.', 'Hayranların geri dönmeni istiyor.'),
    text: (c) => c.t('A promoter thinks nostalgia is worth a lot of money.', 'Bir organizatöre göre nostalji çok para eder.'),
    choices: [
      {
        id: 'comeback',
        label: (c) => c.t('Do the comeback', 'Sahnelere dön'),
        resolve: (c) => {
          const f = fameState(c.p);
          const g = gainFans(c, f, f.fans * 1.5 + 30000);
          c.h.money(wage(c, 60000));
          c.h.stat('happiness', 10);
          return c.t(
            `Your comeback sold out in minutes. ${compact(c, g)} fans, old and new, are back.`,
            `Dönüş konserinin biletleri dakikalar içinde tükendi. Eski yeni ${compact(c, g)} hayran geri döndü.`,
          );
        },
        tone: 'big',
      },
      { id: 'no', label: (c) => c.t('Leave the past in the past', 'Geçmiş geçmişte kalsın'), resolve: (c) => c.t('You said no. Some legends stay legends by disappearing.', 'Hayır dedin. Bazı efsaneler ortadan kaybolarak efsane kalır.') },
    ],
  },
  {
    id: 'fame.fan_letter',
    category: 'fame',
    cooldown: 5,
    when: (c) => fameOf(c) >= 20,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      const i = c.rng.int(0, 2);
      return c.t(
        [
          'A fan wrote to say your work got them through the hardest year of their life. You kept the letter.',
          'A kid at the airport asked for your autograph and then asked who you were.',
          'A fan tattooed your face on their arm. It looks nothing like you.',
        ][i],
        [
          'Bir hayran, hayatının en zor yılını senin sayende atlattığını yazdı. Mektubu sakladın.',
          'Havalimanında bir çocuk senden imza istedi, sonra da kim olduğunu sordu.',
          'Bir hayranın yüzünü koluna dövme yaptırdı. Sana hiç benzemiyor.',
        ][i],
      );
    },
  },
];

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'fame_start',
    label: (c) => c.t('Chase fame', 'Şöhretin peşine düş'),
    description: (c) => c.t('Music, social media or acting', 'Müzik, sosyal medya ya da oyunculuk'),
    group: 'Fame',
    minAge: 10,
    available: (c) => !hasPath(c) && free(c),
    run: () => ({ event: 'fame.choose_path' }),
  },
  // music
  {
    id: 'fame_practice',
    label: (c) => c.t('Practice your instrument', 'Enstrümanına çalış'),
    description: (c) => c.t('+Skill', '+Yetenek'),
    group: 'Fame',
    minAge: 8,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(3, 7));
      const i = c.rng.int(0, 2);
      return c.t(
        ['You practiced scales until your fingers hurt.', 'You learned a song you hate. You play it perfectly now.', 'You practiced for four hours. Your neighbor knocked twice.'][i],
        ['Parmakların acıyana kadar gam çalıştın.', 'Nefret ettiğin bir şarkıyı öğrendin. Artık kusursuz çalıyorsun.', 'Dört saat çalıştın. Komşun iki kez kapıyı çaldı.'][i],
      );
    },
  },
  {
    id: 'fame_write',
    label: (c) => c.t('Write a song', 'Şarkı yaz'),
    description: (c) => c.t('Quality depends on Skill, Smarts and Happiness', 'Kalite; Yetenek, Zekâ ve Mutluluğa bağlı'),
    group: 'Fame',
    minAge: 10,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const q = Math.max(1, Math.min(100, Math.round(f.skill * 0.55 + c.p.stats.smarts * 0.25 + c.p.stats.happiness * 0.15 + c.rng.int(-15, 15))));
      const title = songTitle(c);
      f.songs.push({ title, quality: q, year: c.s.year, released: false });
      if (c.lang === 'tr') {
        const v = q >= 80 ? 'Hit olabilir.' : q >= 60 ? 'Gayet iyi.' : q >= 40 ? 'Fena değil.' : 'Kötü. Yani gerçekten çok kötü.';
        return `"${title}" adında bir şarkı yazdın (kalite ${q}). ${v}`;
      }
      const verdict = q >= 80 ? 'It might be a hit.' : q >= 60 ? 'It is pretty good.' : q >= 40 ? 'It is fine.' : 'It is bad. Like, really bad.';
      return `You wrote a song called "${title}" (quality ${q}). ${verdict}`;
    },
  },
  {
    id: 'fame_band',
    label: (c) => c.t('Form a band', 'Grup kur'),
    description: (c) => c.t('Find three bandmates', 'Üç grup arkadaşı bul'),
    group: 'Fame',
    minAge: 13,
    available: (c) => isPath(c, 'music') && !fameState(c.p).band && free(c),
    run: () => ({ event: 'fame.band_name' }),
  },
  {
    id: 'fame_gig',
    label: (c) => c.t('Play a gig', 'Sahneye çık'),
    description: (c) => c.t('+Fans, a little money', '+Hayran, biraz da para'),
    group: 'Fame',
    minAge: 12,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      if (c.rng.chance(0.15)) {
        c.h.stat('happiness', -4);
        return c.t('Your gig was a disaster. The amp died and so did the crowd.', 'Konser tam bir felaketti. Önce amfi öldü, sonra seyirci.');
      }
      const crowd = Math.round(20 + f.skill * 3 + f.fans * 0.04 * c.rng.next());
      const g = gainFans(c, f, crowd * (0.3 + f.skill / 200) * (f.band ? 1.3 : 1));
      c.h.money(wage(c, crowd * 2));
      return c.t(
        `You played to ${compact(c, crowd)} people${f.band ? ` with ${f.band.name}` : ''}. ${compact(c, g)} new fans.`,
        `${f.band ? `${f.band.name} ile ` : ''}${compact(c, crowd)} kişiye çaldın. ${compact(c, g)} yeni hayran.`,
      );
    },
  },
  {
    id: 'fame_single',
    label: (c) => c.t('Release a single', 'Single çıkar'),
    description: (c) => c.t('Put your best unreleased song out', 'Çıkmamış en iyi şarkını yayınla'),
    group: 'Fame',
    minAge: 12,
    available: (c) => isPath(c, 'music') && fameState(c.p).songs.some((s) => !s.released) && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const song = [...f.songs].filter((s) => !s.released).sort((a, b) => b.quality - a.quality)[0];
      song.released = true;
      song.year = c.s.year;
      const g = gainFans(c, f, (song.quality ** 2 / 10) * (1 + f.fans / 20000) * (f.label === 'major' ? 2 : f.label ? 1.3 : 1));
      return c.t(
        `You released "${song.title}". ${song.quality >= 70 ? 'Radio stations picked it up!' : 'A few people noticed.'} ${compact(c, g)} new fans.`,
        `"${song.title}" yayında. ${song.quality >= 70 ? 'Radyolar çalmaya başladı!' : 'Birkaç kişi fark etti.'} ${compact(c, g)} yeni hayran.`,
      );
    },
  },
  {
    id: 'fame_album',
    label: (c) => c.t('Record an album', 'Albüm kaydet'),
    description: (c) => c.t('Needs 4 unreleased songs', 'Çıkmamış 4 şarkı gerekir'),
    group: 'Fame',
    minAge: 15,
    available: (c) => isPath(c, 'music') && fameState(c.p).songs.filter((s) => !s.released).length >= 4 && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const tracks = f.songs.filter((s) => !s.released);
      const quality = Math.round(tracks.reduce((a, s) => a + s.quality, 0) / tracks.length);
      const cost = f.label ? 0 : wage(c, 4000);
      c.h.money(-cost);
      tracks.forEach((s) => (s.released = true));
      const title = tracks.sort((a, b) => b.quality - a.quality)[0].title;
      const sales = Math.round((quality ** 2 / 50) * (1 + f.fans / 50000) * (f.label === 'major' ? 2.5 : f.label ? 1.4 : 1));
      f.albums.push({ title, year: c.s.year, quality, sales });
      const g = gainFans(c, f, sales * 40);
      c.h.money(wage(c, sales * (f.label === 'major' ? 400 : 800)));
      return c.t(
        `You released the album "${title}" (quality ${quality}). It sold ${compact(c, sales * 1000)} copies and brought ${compact(c, g)} new fans.${cost ? ` Recording cost ${c.h.fmt(cost)}.` : ''}`,
        `"${title}" albümünü çıkardın (kalite ${quality}). ${compact(c, sales * 1000)} adet sattı ve ${compact(c, g)} yeni hayran getirdi.${cost ? ` Kayıt masrafı ${c.h.fmt(cost)}.` : ''}`,
      );
    },
  },
  // social
  {
    id: 'fame_post',
    label: (c) => c.t('Post content', 'İçerik paylaş'),
    description: (c) => c.t('+Fans, depends on Looks and luck', '+Hayran; Görünüş ve şansa bağlı'),
    group: 'Fame',
    minAge: 13,
    perYear: 3,
    available: (c) => isPath(c, 'social') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const roll = c.rng.next();
      if (roll > 0.96) {
        const g = gainFans(c, f, f.fans * 1.5 + 50000);
        c.h.achieve('viral');
        return c.t(`Your video went massively viral. ${compact(c, g)} new followers overnight.`, `Videon fena patladı. Bir gecede ${compact(c, g)} yeni takipçi.`);
      }
      const g = gainFans(c, f, (50 + c.p.stats.looks * 6 + f.fans * 0.08) * (0.4 + roll));
      const wi = c.rng.int(0, 4); // one RNG call, same as rng.pick on a 5-item list
      const what = ['a "day in my life" video', 'a dance trend', 'a rant about public transport', 'a cooking fail', 'a get-ready-with-me'][wi];
      const whatTr = ['"Bir günüm" videosu', 'Dans akımı videosu', 'Toplu taşıma isyanı', 'Mutfak felaketi videosu', '"Benimle hazırlan" videosu'][wi];
      return c.t(`You posted ${what}. ${compact(c, g)} new followers.`, `${whatTr} paylaştın. ${compact(c, g)} yeni takipçi.`);
    },
  },
  {
    id: 'fame_collab',
    label: (c) => c.t('Collab with another creator', 'Başka bir fenomenle iş birliği yap'),
    description: (c) => c.t('Big boost, needs 5K followers', 'Büyük sıçrama, 5 bin takipçi gerekir'),
    group: 'Fame',
    minAge: 14,
    available: (c) => isPath(c, 'social') && fameState(c.p).fans >= 5000 && free(c),
    run: (c) => {
      const f = fameState(c.p);
      if (c.rng.chance(0.2)) {
        f.scandals++;
        loseFans(f, 0.05);
        return c.t('The collab ended in a public feud. Everybody watched. Nobody won.', 'İş birliği herkesin önünde bir kavgayla bitti. Herkes izledi. Kazanan olmadı.');
      }
      const g = gainFans(c, f, f.fans * 0.35);
      return c.t(`Your collab video was a hit. ${compact(c, g)} new followers.`, `Ortak videonuz olay oldu. ${compact(c, g)} yeni takipçi.`);
    },
  },
  // acting
  {
    id: 'fame_class',
    label: (c) => c.t('Take acting classes', 'Oyunculuk dersi al'),
    description: (c) => c.t('+Skill', '+Yetenek'),
    group: 'Fame',
    minAge: 8,
    perYear: 2,
    available: (c) => isPath(c, 'acting') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(3, 7));
      c.h.money(-wage(c, 150));
      const i = c.rng.int(0, 2);
      return c.t(
        ['Your acting coach made you be a tree for an hour.', 'You did a Shakespeare monologue. The coach nodded slowly.', 'You practiced crying on command. You are now unstoppable.'][i],
        ['Oyunculuk hocan bir saat boyunca ağaç olmanı istedi.', 'Bir Shakespeare monoloğu yaptın. Hoca yavaşça başını salladı.', 'İstediğin an ağlamayı çalıştın. Artık seni kimse durduramaz.'][i],
      );
    },
  },
  {
    id: 'fame_audition',
    label: (c) => c.t('Go to an audition', 'Seçmelere git'),
    description: (c) => c.t('Land a role', 'Rol kap'),
    group: 'Fame',
    minAge: 10,
    perYear: 2,
    available: (c) => isPath(c, 'acting') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const tier = Math.min(3, Math.floor(f.roles / 2));
      const role = ['a background role in a soap opera', 'a supporting role in a TV series', 'the lead in a TV series', 'the lead in a feature film'][tier];
      const roleTr = ['bir pembe dizide figüranlık', 'bir dizide yan rol', 'bir dizide başrol', 'bir sinema filminde başrol'][tier];
      if (c.rng.chance(0.2 + f.skill / 250 + c.p.stats.looks / 400 - tier * 0.05)) {
        f.roles++;
        const pay = wage(c, [1500, 12000, 60000, 250000][tier]);
        c.h.money(pay);
        const g = gainFans(c, f, [300, 4000, 40000, 300000][tier] * (0.5 + f.skill / 100));
        return c.t(`You got ${role}! Paid ${c.h.fmt(pay)} and ${compact(c, g)} new fans.`, `${cap(roleTr)} kaptın! ${c.h.fmt(pay)} kazandın, ${compact(c, g)} yeni hayran.`);
      }
      return c.t(
        `You auditioned for ${role}. They said you were "almost right". Next time.`,
        `${cap(roleTr)} için seçmelere girdin. "Neredeyse aradığımız kişisin" dediler. Bir dahaki sefere.`,
      );
    },
  },
  {
    id: 'fame_meet',
    label: (c) => c.t('Meet your fans', 'Hayranlarınla buluş'),
    description: (c) => c.t('+Happiness, +Fans', '+Mutluluk, +Hayran'),
    group: 'Fame',
    minAge: 12,
    available: (c) => fameOf(c) >= 20 && free(c),
    run: (c) => {
      c.h.stat('happiness', 5);
      const g = gainFans(c, fameState(c.p), fameState(c.p).fans * 0.03);
      return c.t(`You signed autographs for three hours. ${compact(c, g)} new fans and one sore wrist.`, `Üç saat imza dağıttın. ${compact(c, g)} yeni hayran ve bir ağrıyan bilek.`);
    },
  },
  {
    id: 'fame_quit',
    label: (c) => c.t('Retire from the spotlight', 'Spot ışıklarına veda et'),
    description: (c) => c.t('Leave fame behind', 'Şöhreti geride bırak'),
    group: 'Fame',
    minAge: 18,
    available: (c) => hasPath(c),
    run: (c) => {
      const f = fameState(c.p);
      const title = fameTitle(f, c.lang);
      f.path = null;
      c.h.stat('happiness', 3);
      return c.t(`You retired from the spotlight as a ${title}. Your fans will remember.`, `Spot ışıklarına bir ${title} olarak veda ettin. Hayranların seni unutmayacak.`);
    },
  },
];

// ------------------------------------------------------------------ yearly tick
function onYear(c: Ctx) {
  const f = peekFame(c.p);
  if (!f || (!f.path && f.fans === 0)) return;
  // income
  if (f.path === 'music') {
    const streams = f.fans * 0.12 + f.albums.reduce((a, al) => a + al.sales * 30, 0);
    c.h.money(wage(c, streams * (f.label === 'major' ? 0.6 : 1)));
    f.albums.forEach((al) => (al.sales = Math.round(al.sales * 0.6)));
  } else if (f.path === 'social' && f.fans >= 10000) {
    c.h.money(wage(c, f.fans * 0.2));
  }
  // fans drift away when you stop working
  const idle = c.s.year - f.lastActiveYear;
  if (idle >= 1) loseFans(f, Math.min(0.5, 0.06 + idle * 0.04));
  // fame shows as your title when you have no regular job
  if (!c.p.jobId && f.path && fameLevel(f.fans) >= 20) c.p.jobTitle = fameTitle(f, c.lang);
  f.peakFame = Math.max(f.peakFame, fameLevel(f.fans));
  if (fameLevel(f.fans) >= 80) c.h.achieve('superstar');
}

export const famePack: ContentPack = {
  id: 'fame',
  title: 'Fame',
  description: 'Music, social media and acting. Form a band, write songs, release albums, go viral, survive scandals.',
  rating: 'all',
  entitlement: FAME_ENTITLEMENT,
  events,
  activities,
  onYear,
  lifeTiles: (s) => {
    const f = peekFame(s.player);
    if (!f || (!f.path && f.fans === 0)) return [];
    const tr = s.lang === 'tr';
    return [
      { label: tr ? 'Hayran' : 'Fans', value: compact(s, f.fans) },
      { label: tr ? 'Şöhret' : 'Fame', value: `${fameLevel(f.fans)}` },
      { label: f.path ? (tr ? 'Durum' : 'Status') : tr ? 'Eskiden' : 'Former', value: f.path ? fameTitle(f, s.lang) : tr ? 'Emekli yıldız' : 'Retired star' },
    ];
  },
  goals: [
    { id: 'fame_star', label: 'Reach 60 Fame', labelTr: '60 Şöhrete ulaş', check: (s) => (peekFame(s.player)?.peakFame ?? 0) >= 60 },
    { id: 'fame_world_tour', label: 'Finish a world tour', labelTr: 'Bir dünya turnesini tamamla', check: (s) => s.player.achievements.includes('world_tour') },
  ],
  ribbons: [
    { id: 'superstar', name: 'Superstar', desc: 'Reached 80+ Fame.', nameTr: 'Süperstar', descTr: '80+ Şöhrete ulaştı.', test: (_r, p) => (peekFame(p)?.peakFame ?? 0) >= 80 },
    { id: 'world_tour', name: 'Around the World', desc: 'Finished a 50-city world tour.', nameTr: 'Devr-i Âlem', descTr: '50 şehirlik bir dünya turnesini tamamladı.', test: (_r, p) => p.achievements.includes('world_tour') },
    { id: 'controversial', name: 'Controversial', desc: 'Three or more public scandals.', nameTr: 'Olay Adam', descTr: 'Üç ya da daha fazla kamuoyu skandalı.', test: (_r, p) => (peekFame(p)?.scandals ?? 0) >= 3 },
    { id: 'one_hit', name: 'One-Hit Wonder', desc: 'Was famous once, then faded away.', nameTr: 'Tek Hit Harikası', descTr: 'Bir zamanlar ünlüydü, sonra unutuldu.', test: (_r, p) => {
      const f = peekFame(p);
      return !!f && f.peakFame >= 50 && fameLevel(f.fans) < 25;
    } },
  ],
};
