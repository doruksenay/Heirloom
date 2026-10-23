import type { ChoiceDef, Ctx, EventDef } from '../types';
import { acc, cap, dat, gen, kin, nm, single, wage, who, wth } from './util';

// v0.2 content: friends, pets, work, home, kids, old age, and events that create new heirlooms.

/** Turkish forms of the friend_moves cities: [name, dative, locative]. */
const CITY_TR: Record<string, [string, string, string]> = {
  Berlin: ['Berlin', "Berlin'e", "Berlin'de"],
  Toronto: ['Toronto', "Toronto'ya", "Toronto'da"],
  Melbourne: ['Melbourne', "Melbourne'a", "Melbourne'da"],
  Dubai: ['Dubai', "Dubai'ye", "Dubai'de"],
  Lisbon: ['Lizbon', "Lizbon'a", "Lizbon'da"],
};
const cityTr = (en: string, form: 0 | 1 | 2) => CITY_TR[en]?.[form] ?? en;

const HABITS_EN = ['plays the drums at 2 a.m.', 'labels every item in the fridge', 'has a pet snake named Dave', 'is never, ever there'];
const HABITS_TR = [
  "gece 2'de davul çalıyor.",
  'buzdolabındaki her şeyi tek tek etiketliyor.',
  'Dave adında bir yılan besliyor.',
  'hiç ama hiç ortalıkta yok.',
];
const habitTr = (en: string) => HABITS_TR[HABITS_EN.indexOf(en)] ?? en;

const heirChoice = (i: number): ChoiceDef => ({
  id: `heir${i}`,
  label: (c) => (c.vars[`kid${i}`] ? c.t(`Leave them to ${nm(c, `kid${i}`)}`, `Yadigârları ${dat(nm(c, `kid${i}`))} bırak`) : '—'),
  requires: (c) => !!c.vars[`kid${i}`],
  requiresLabel: '—',
  resolve: (c: Ctx) => {
    Object.keys(c.p.flags)
      .filter((f) => f.startsWith('heir:'))
      .forEach((f) => c.h.unflag(f));
    c.h.flag(`heir:${c.vars[`kid${i}`]}`);
    c.h.closeness(String(c.vars[`kid${i}`]), 8);
    return c.t(
      `You wrote your will. The family heirlooms will go to ${nm(c, `kid${i}`)}.`,
      `Vasiyetini yazdın. Aile yadigârları ${dat(nm(c, `kid${i}`))} kalacak.`,
    );
  },
  tone: 'big',
});

export const moreEvents: EventDef[] = [
  // ------------------------------------------------ friends
  {
    id: 'base.best_friend',
    category: 'childhood',
    minAge: 6,
    maxAge: 14,
    once: true,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender }).id;
    },
    title: (c) =>
      c.t(`${nm(c)} from your class asks if you want to be best friends.`, `Sınıftan ${nm(c)} sana "Kanka olalım mı?" diye soruyor.`),
    text: (c) =>
      c.t('They offer you half a chocolate bar as a signing bonus.', 'İmza bonusu olarak yarım çikolata teklif ediyor.'),
    choices: [
      {
        id: 'yes',
        label: (c) => c.t('Accept the chocolate (and the friendship)', 'Çikolatayı (ve dostluğu) kabul et'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 80);
          c.h.stat('happiness', 6);
          c.h.flag('best_friend');
          return c.t(
            `You and ${nm(c)} became best friends. You swapped friendship bracelets.`,
            `${wth(nm(c))} kanka oldunuz. Arkadaşlık bileklikleri takıştınız.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('You prefer being a lone wolf', 'Sen yalnız kurtsun'),
        resolve: (c) => c.t('You said no. You ate lunch alone, mysteriously.', 'Hayır dedin. Öğle yemeğini tek başına, gizemli gizemli yedin.'),
      },
    ],
  },
  {
    id: 'base.friend_moves',
    category: 'random',
    minAge: 10,
    once: true,
    when: (c) => c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.h.relatives('friend')[0].person.id;
      c.vars.city = c.rng.pick(['Berlin', 'Toronto', 'Melbourne', 'Dubai', 'Lisbon']);
    },
    title: (c) =>
      c.t(`${nm(c)} is moving to ${c.vars.city}.`, `${nm(c)} ${cityTr(String(c.vars.city), 1)} taşınıyor.`),
    text: (c) => c.t('The goodbye party is on Saturday.', 'Veda partisi cumartesi.'),
    choices: [
      {
        id: 'promise',
        label: (c) => c.t('Promise to call every week', 'Her hafta arayacağına söz ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 5);
          c.h.stat('happiness', -3);
          return c.t(
            `You promised ${nm(c)} you'd call every week. You managed about four times.`,
            `${dat(nm(c))} her hafta arayacağına söz verdin. Toplam dört kere falan arayabildin.`,
          );
        },
      },
      {
        id: 'visit',
        label: (c) => c.t('Plan a visit next summer', 'Seneye yaz için ziyaret planla'),
        resolve: (c) => {
          c.h.money(-wage(c, 900));
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 4);
          return c.t(
            `You visited ${nm(c)} in ${c.vars.city}. Best trip of your life.`,
            `${acc(nm(c))} ${cityTr(String(c.vars.city), 2)} ziyaret ettin. Hayatının en güzel seyahatiydi.`,
          );
        },
      },
    ],
  },

  // ------------------------------------------------ pets
  {
    id: 'base.cat_old',
    category: 'family',
    once: true,
    when: (c) => c.h.has('pet_cat') && c.s.year - c.p.flags['pet_cat'] >= 15,
    text: '',
    apply: (c) => {
      c.h.unflag('pet_cat');
      c.h.flag('cat_memory');
      c.h.stat('happiness', -10);
      return c.t(
        'Pamuk passed away peacefully on the windowsill, in the sun spot. Seventeen good years.',
        'Pamuk, pencere kenarındaki güneşli köşesinde huzur içinde gözlerini yumdu. On yedi güzel yıl.',
      );
    },
    tone: 'bad',
  },
  {
    id: 'base.new_kitten',
    category: 'family',
    minAge: 12,
    once: true,
    when: (c) => c.h.has('cat_memory') && !c.h.has('pet_cat'),
    title: (c) => c.t('A kitten is crying in the rain outside your door.', 'Kapının önünde, yağmurun altında bir kedi yavrusu miyavlıyor.'),
    text: (c) =>
      c.t('It is white, tiny and very loud. It looks familiar somehow.', 'Bembeyaz, minicik ve çok gürültülü. Nedense hiç yabancı gelmiyor.'),
    choices: [
      {
        id: 'adopt',
        label: (c) => c.t('Bring it in', 'İçeri al'),
        resolve: (c) => {
          c.h.flag('pet_cat');
          c.h.stat('happiness', 10);
          return c.t('You adopted the kitten and named it Pamuk II.', 'Yavruyu sahiplendin ve adını II. Pamuk koydun.');
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Not ready yet', 'Henüz hazır değilsin'),
        resolve: (c) =>
          c.t('You gave the kitten to the shelter. You visit sometimes.', 'Yavruyu barınağa verdin. Arada bir ziyaretine gidiyorsun.'),
      },
    ],
  },

  // ------------------------------------------------ teens
  {
    id: 'base.first_phone',
    category: 'childhood',
    minAge: 9,
    maxAge: 13,
    once: true,
    title: (c) => c.t('Everyone in your class has a phone except you.', 'Sınıfta senden başka telefonu olmayan kalmadı.'),
    text: (c) =>
      c.t('You have rehearsed a 12-point argument for your parents.', 'Ailen için 12 maddelik bir savunma hazırladın ve prova ettin.'),
    choices: [
      {
        id: 'beg',
        label: (c) => c.t('Present your argument', 'Savunmanı yap'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            c.h.flag('phone');
            return c.t(
              'Your argument worked. You got your first phone. It is already cracked.',
              'Savunman işe yaradı. İlk telefonuna kavuştun. Ekranı şimdiden çatlak.',
            );
          }
          c.h.stat('happiness', -4);
          return c.t(
            'Your parents listened to all 12 points and said "maybe next year."',
            'Ailen 12 maddenin hepsini dinledi ve "Seneye bakarız" dedi.',
          );
        },
      },
      {
        id: 'save',
        label: (c) => c.t('Save up for it yourself', 'Kendi paranla al'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t(
            'You started saving your pocket money. Your parents were secretly impressed.',
            'Harçlıklarını biriktirmeye başladın. Ailen gizliden gizliye gurur duydu.',
          );
        },
      },
    ],
  },
  {
    id: 'base.selfie',
    category: 'random',
    minAge: 13,
    maxAge: 22,
    title: (c) => c.t('Your selfie is getting attention online.', 'Selfien internette ilgi topluyor.'),
    text: (c) =>
      c.t('A stranger commented "who is this??" with five fire emojis.', 'Tanımadığın biri beş tane ateş emojisiyle "bu kim??" yorumu yaptı.'),
    choices: [
      {
        id: 'more',
        label: (c) => c.t('Post more', 'Daha çok paylaş'),
        resolve: (c) => {
          c.h.stat('looks', 2);
          if (c.rng.chance(0.25)) {
            c.h.stat('happiness', -6);
            return c.t(
              'You posted more. The comments turned mean. You deleted the app for a week.',
              'Daha çok paylaştın. Yorumlar çirkinleşti. Uygulamayı bir haftalığına sildin.',
            );
          }
          c.h.stat('happiness', 5);
          return c.t(
            'You posted more. You now have 3,000 followers and a ring light.',
            'Daha çok paylaştın. Artık 3.000 takipçin ve bir halka ışığın var.',
          );
        },
      },
      {
        id: 'private',
        label: (c) => c.t('Make your account private', 'Hesabını gizliye al'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('You went private. Peace and quiet.', 'Hesabı gizliye aldın. Oh be, huzur.');
        },
      },
    ],
  },
  {
    id: 'base.roommate',
    category: 'school',
    minAge: 18,
    maxAge: 24,
    once: true,
    when: (c) => c.p.school === 'university',
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age, gender: c.p.gender }).id;
      c.vars.habit = c.rng.pick(HABITS_EN);
    },
    title: (c) =>
      c.t(`Your new roommate ${nm(c)} ${c.vars.habit}`, `Yeni oda arkadaşın ${nm(c)} ${habitTr(String(c.vars.habit))}`),
    text: (c) => c.t('You will share a very small room for a year.', 'Bir yıl boyunca minicik bir odayı paylaşacaksınız.'),
    choices: [
      {
        id: 'friends',
        label: (c) => c.t('Try to be friends', 'Arkadaş olmayı dene'),
        resolve: (c) => {
          c.h.addRelation(who(c), 'friend', 60);
          c.h.stat('happiness', 3);
          return c.t(`You and ${nm(c)} became friends. Mostly.`, `${wth(nm(c))} arkadaş oldunuz. Sayılır.`);
        },
      },
      {
        id: 'move',
        label: (c) => c.t('Request a room change', 'Oda değişikliği iste'),
        resolve: (c) => {
          c.h.money(-wage(c, 300));
          return c.t(
            'You paid to switch rooms. Your new roommate is completely normal. Suspiciously normal.',
            'Para verip oda değiştirdin. Yeni oda arkadaşın tamamen normal. Şüphe uyandıracak kadar normal.',
          );
        },
      },
    ],
  },

  // ------------------------------------------------ work & money
  {
    id: 'base.raise',
    category: 'work',
    minAge: 22,
    maxAge: 64,
    cooldown: 6,
    when: (c) => !!c.p.jobId && c.p.jobYears >= 2,
    title: (c) => c.t('You have not had a raise in two years.', 'İki yıldır zam görmedin.'),
    text: (c) => c.t('Your annual review is tomorrow.', 'Yıllık performans görüşmen yarın.'),
    choices: [
      {
        id: 'ask',
        label: (c) => c.t('Ask for a promotion', 'Terfi iste'),
        resolve: (c) => {
          if (c.rng.chance(0.25 + c.p.stats.smarts / 300) && c.h.promote()) {
            c.h.stat('happiness', 6);
            return c.t(`You asked and you got it. You are now ${c.h.jobTitle()}.`, `İstedin ve aldın. Artık ${c.h.jobTitle()} oldun.`);
          }
          c.h.stat('happiness', -3);
          return c.t(
            'Your manager said "budgets are tight." He drove off in a new car.',
            'Müdürün "Bütçeler kısıtlı" dedi. Sonra yeni arabasına binip gitti.',
          );
        },
      },
      {
        id: 'wait',
        label: (c) => c.t('Wait for them to notice you', 'Fark edilmeyi bekle'),
        resolve: (c) => c.t('You waited. They did not notice.', 'Bekledin. Fark etmediler.'),
      },
    ],
  },
  {
    id: 'base.coworker_birthday',
    category: 'work',
    cooldown: 5,
    when: (c) => !!c.p.jobId,
    text: '',
    apply: (c) => {
      c.h.money(-wage(c, 20));
      const i = c.rng.int(0, 1);
      return c.t(
        [
          "You chipped in for a coworker's birthday cake. You still don't know her name.",
          'The office threw a surprise party for your boss. You ate four slices of cake.',
        ][i],
        [
          'Bir iş arkadaşının doğum günü pastası için para topladınız. Hâlâ adını bilmiyorsun.',
          'Ofiste patrona sürpriz parti yapıldı. Dört dilim pasta yedin.',
        ][i],
      );
    },
  },
  {
    id: 'base.car_breakdown',
    category: 'money',
    minAge: 18,
    cooldown: 6,
    when: (c) => c.h.has('license'),
    setup: (c) => {
      c.vars.amt = wage(c, c.rng.int(400, 2500));
    },
    title: (c) =>
      c.t(
        `Your car broke down. The mechanic says ${c.h.fmt(Number(c.vars.amt))}.`,
        `Araban bozuldu. Tamirci ${c.h.fmt(Number(c.vars.amt))} diyor.`,
      ),
    text: (c) => c.t('He says it while wiping his hands very slowly.', 'Bunu söylerken ellerini çok, çok yavaş siliyor.'),
    choices: [
      {
        id: 'pay',
        label: (c) => c.t('Pay for the repair', 'Tamir parasını öde'),
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          return c.t('You paid for the repair. The car makes a new noise now.', 'Tamir parasını ödedin. Araba şimdi yeni bir ses çıkarıyor.');
        },
      },
      {
        id: 'bus',
        label: (c) => c.t('Take the bus from now on', 'Artık otobüse bin'),
        resolve: (c) => {
          c.h.unflag('license');
          c.h.flag('license_nocar');
          c.h.stat('health', 2);
          return c.t(
            'You sold the car for scrap and started taking the bus. You know all the drivers now.',
            'Arabayı hurdaya verip otobüse binmeye başladın. Artık bütün şoförlerle selamlaşıyorsun.',
          );
        },
      },
    ],
  },
  {
    id: 'base.stock_tip',
    category: 'money',
    minAge: 21,
    cooldown: 8,
    when: (c) => c.p.money > wage(c, 3000),
    setup: (c) => {
      c.vars.amt = Math.round(c.p.money * 0.3);
    },
    title: (c) =>
      c.t('Your cousin swears a small company is about to "explode."', 'Kuzenin, küçük bir şirketin "uçmak üzere" olduğuna yemin ediyor.'),
    text: (c) =>
      c.t(`He wants you to put ${c.h.fmt(Number(c.vars.amt))} into it.`, `İçine ${c.h.fmt(Number(c.vars.amt))} yatırmanı istiyor.`),
    choices: [
      {
        id: 'invest',
        label: (c) => c.t('Invest', 'Yatırım yap'),
        badge: 'Risky',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          const roll = c.rng.next();
          if (roll < 0.35) {
            c.h.money(-amt);
            return c.t(
              'The company exploded. Not in the good way. You lost everything you put in.',
              'Şirket uçtu. Ama uçuruma. Yatırdığın her kuruş gitti.',
            );
          }
          if (roll < 0.85) {
            c.h.money(Math.round(amt * 0.4));
            return c.t('The stock went up a little. You made a modest profit.', 'Hisse biraz yükseldi. Mütevazı bir kâr ettin.');
          }
          c.h.money(amt * 3);
          c.h.stat('happiness', 8);
          return c.t(
            `The stock went to the moon. You made ${c.h.fmt(amt * 3)}! Your cousin will never let you forget it.`,
            `Hisse aya çıktı. Tam ${c.h.fmt(amt * 3)} kazandın! Kuzenin bunu ömür boyu başına kakacak.`,
          );
        },
      },
      {
        id: 'no',
        label: (c) => c.t('Politely decline', 'Kibarca reddet'),
        resolve: (c) =>
          c.t('You declined. Your cousin called you "a sheep" at dinner.', 'Reddettin. Kuzenin yemekte sana "koyun" dedi.'),
      },
    ],
  },
  {
    id: 'base.neighbor',
    category: 'random',
    minAge: 20,
    cooldown: 8,
    title: (c) =>
      c.t('Your neighbor drills into the wall every Sunday at 8 a.m.', 'Komşun her pazar sabah 8\'de duvarı matkapla deliyor.'),
    text: (c) => c.t('You are starting to hear drills in your dreams.', 'Rüyalarında bile matkap sesi duymaya başladın.'),
    choices: [
      {
        id: 'knock',
        label: (c) => c.t('Knock and talk', 'Kapısını çal, konuş'),
        resolve: (c) => {
          if (c.rng.chance(0.6))
            return c.t(
              'You talked. He apologized and brought you baklava. Peace achieved.',
              'Konuştunuz. Özür diledi ve sana baklava getirdi. Barış sağlandı.',
            );
          c.h.stat('happiness', -3);
          return c.t('You talked. He started drilling on Saturdays too.', 'Konuştunuz. Artık cumartesileri de deliyor.');
        },
      },
      {
        id: 'music',
        label: (c) => c.t('Play loud music back', 'Müziği sonuna kadar aç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t(
            'You played opera at full volume. The drilling stopped. So did the greetings in the hallway.',
            'Son ses opera açtın. Matkap sustu. Merdivendeki selamlaşmalar da.',
          );
        },
      },
    ],
  },
  {
    id: 'base.renovation',
    category: 'money',
    minAge: 25,
    cooldown: 10,
    when: (c) => c.p.home.owned,
    setup: (c) => {
      c.vars.amt = wage(c, 15000);
    },
    title: (c) => c.t('Your kitchen is falling apart.', 'Mutfağın dökülüyor.'),
    text: (c) =>
      c.t(
        `A full renovation would cost ${c.h.fmt(Number(c.vars.amt))}.`,
        `Baştan aşağı tadilat ${c.h.fmt(Number(c.vars.amt))} tutar.`,
      ),
    choices: [
      {
        id: 'renovate',
        label: (c) => c.t('Renovate', 'Tadilat yaptır'),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          const amt = Number(c.vars.amt);
          c.h.money(-amt);
          c.p.home.value += Math.round(amt * 1.3);
          c.h.stat('happiness', 6);
          return c.t(
            'You renovated the kitchen. The house is worth more and you finally have a drawer that closes.',
            'Mutfağı yeniledin. Evin değeri arttı ve nihayet kapanan bir çekmecen var.',
          );
        },
      },
      {
        id: 'tape',
        label: (c) => c.t('Fix it with tape', 'Bantla idare et'),
        resolve: (c) =>
          c.t('You fixed it with tape. It is load-bearing tape now.', 'Bantla tamir ettin. O bant artık taşıyıcı kolon.'),
      },
    ],
  },
  {
    id: 'base.friend_wedding',
    category: 'love',
    minAge: 24,
    maxAge: 45,
    cooldown: 5,
    when: (c) => c.h.relatives('friend').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('friend')).person.id;
    },
    title: (c) =>
      c.t(
        `${nm(c)} is getting married and wants you to give a speech.`,
        `${nm(c)} evleniyor ve düğünde senin konuşma yapmanı istiyor.`,
      ),
    text: (c) =>
      c.t('You have known each other forever. You have stories.', 'Birbirinizi ezelden beri tanıyorsunuz. Anlatacak çok hikâyen var.'),
    choices: [
      {
        id: 'heartfelt',
        label: (c) => c.t('Give a heartfelt speech', 'İçten bir konuşma yap'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 10);
          c.h.stat('happiness', 4);
          return c.t(`Your speech made ${nm(c)} cry. In a good way.`, `Konuşman ${acc(nm(c))} ağlattı. İyi anlamda.`);
        },
      },
      {
        id: 'roast',
        label: (c) => c.t('Roast them', 'Tiye al'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('The roast killed. Even the grandmother laughed.', 'Salonu yıktın. Babaanne bile güldü.');
          }
          c.h.closeness(String(c.vars.pid), -15);
          return c.t(
            `You told the story about ${nm(c)}'s ex. The groom's side went very quiet.`,
            `${gen(nm(c))} eski sevgilisinin hikâyesini anlattın. Damat tarafı buz kesti.`,
          );
        },
      },
    ],
  },

  // ------------------------------------------------ kids
  {
    id: 'base.teen_sneak',
    category: 'family',
    minAge: 30,
    cooldown: 4,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 13 && c.h.ageOf(k.person) <= 17),
    setup: (c) => {
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 13 && c.h.ageOf(k.person) <= 17)!.person.id;
    },
    title: (c) => {
      const k = kin(c, who(c), 'child');
      return c.t(
        `You caught your ${k} ${nm(c)} sneaking back in at 3 a.m.`,
        `${cap(k)} ${acc(nm(c))} gece 3'te eve gizlice girerken yakaladın.`,
      );
    },
    text: (c) =>
      c.t('They are holding their shoes and a very guilty face.', 'Elinde ayakkabıları, yüzünde koca bir suçluluk ifadesi var.'),
    choices: [
      {
        id: 'ground',
        label: (c) => c.t('Ground them for a month', 'Bir ay ev hapsi ver'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -8);
          return c.t(
            `You grounded ${nm(c)}. The silence at breakfast could cut glass.`,
            `${dat(nm(c))} ev hapsi verdin. Kahvaltıdaki sessizlik bıçakla kesilir.`,
          );
        },
      },
      {
        id: 'talk',
        label: (c) => c.t('Sit down and talk', 'Oturup konuşun'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 6);
          return c.t(
            `You and ${nm(c)} talked until sunrise. You learned more than you wanted to.`,
            `${wth(nm(c))} sabaha kadar konuştunuz. Bilmek istediğinden fazlasını öğrendin.`,
          );
        },
      },
      {
        id: 'pretend',
        label: (c) => c.t('Pretend you saw nothing', 'Görmemiş gibi yap'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 2);
          return c.t(
            `You pretended you saw nothing. ${nm(c)} pretended too. A family tradition.`,
            `Hiçbir şey görmemiş gibi yaptın. ${nm(c)} da öyle. Aile geleneği.`,
          );
        },
      },
    ],
  },
  {
    id: 'base.kid_graduates',
    category: 'family',
    cooldown: 1,
    when: (c) => c.h.relatives('child').some((k) => c.h.ageOf(k.person) === 18),
    text: '',
    apply: (c) => {
      const kid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) === 18)!;
      c.h.closeness(kid.person.id, 6);
      c.h.stat('happiness', 6);
      const k = kin(c, kid.person, 'child');
      return c.t(
        `Your ${k} ${kid.person.firstName} graduated from high school. You cried in the third row.`,
        `${cap(k)} ${kid.person.firstName} liseden mezun oldu. Üçüncü sırada hüngür hüngür ağladın.`,
      );
    },
    tone: 'good',
  },

  // ------------------------------------------------ old age
  {
    id: 'base.retirement_trip',
    category: 'random',
    minAge: 62,
    once: true,
    when: (c) => c.p.retired && c.p.money > wage(c, 5000),
    title: (c) => c.t('You finally have time to travel.', 'Nihayet gezmeye vaktin var.'),
    text: (c) => c.t('The travel agent is very excited about cruises.', 'Seyahat acentesi cruise turları konusunda fazlasıyla heyecanlı.'),
    choices: [
      {
        id: 'cruise',
        label: (c) => c.t('Take a cruise', 'Cruise turuna çık'),
        resolve: (c) => {
          c.h.money(-wage(c, 4000));
          c.h.stat('happiness', 10);
          return c.t("You took a cruise and won the ship's karaoke contest.", 'Cruise turuna çıktın ve gemideki karaoke yarışmasını kazandın.');
        },
      },
      {
        id: 'village',
        label: (c) => c.t('Visit the village your family came from', 'Ailenin memleketindeki köyü ziyaret et'),
        resolve: (c) => {
          c.h.money(-wage(c, 800));
          c.h.stat('happiness', 8);
          c.h.stat('smarts', 2);
          return c.t(
            'You visited the old family village. An old man there remembered your grandparents.',
            'Ailenin eski köyünü ziyaret ettin. Kahvedeki bir amca dedenle nineni hatırladı.',
          );
        },
      },
    ],
  },
  {
    id: 'base.will',
    category: 'heirloom',
    minAge: 60,
    once: true,
    when: (c) => c.s.dynasty.heirlooms.length > 0 && c.h.relatives('child').length >= 2,
    setup: (c) => {
      c.h
        .relatives('child')
        .slice(0, 3)
        .forEach((k, i) => (c.vars[`kid${i}`] = k.person.id));
    },
    title: (c) => c.t('Your lawyer says it is time to write your will.', 'Avukatın vasiyetini yazmanın vakti geldiğini söylüyor.'),
    text: (c) =>
      c.t('Who should keep the family heirlooms after you?', 'Senden sonra aile yadigârlarına kim sahip çıkacak?'),
    choices: [heirChoice(0), heirChoice(1), heirChoice(2)],
  },

  // ------------------------------------------------ new heirlooms
  {
    id: 'base.piano',
    category: 'heirloom',
    minAge: 25,
    once: true,
    when: (c) => !c.h.hasHeirloom('piano') && c.h.relatives('child').some((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12),
    setup: (c) => {
      c.vars.amt = wage(c, 2500);
      c.vars.pid = c.h.relatives('child').find((k) => c.h.ageOf(k.person) >= 5 && c.h.ageOf(k.person) <= 12)!.person.id;
    },
    title: (c) => c.t(`${nm(c)} wants piano lessons.`, `${nm(c)} piyano dersi almak istiyor.`),
    text: (c) =>
      c.t(
        `An old upright piano is for sale for ${c.h.fmt(Number(c.vars.amt))}.`,
        `Eski bir duvar piyanosu ${c.h.fmt(Number(c.vars.amt))} fiyatla satılıkmış.`,
      ),
    choices: [
      {
        id: 'buy',
        label: (c) => c.t('Buy the piano', 'Piyanoyu al'),
        requires: (c) => c.p.money >= Number(c.vars.amt),
        requiresLabel: 'Not enough money',
        resolve: (c) => {
          c.h.money(-Number(c.vars.amt));
          c.h.addHeirloom(
            'piano',
            c.t(`${c.p.firstName}'s upright piano`, `${gen(c.p.firstName)} duvar piyanosu`),
            c.t(
              `${c.p.firstName} bought it in ${c.s.year} so ${nm(c)} could learn to play.`,
              `${c.p.firstName} bunu ${c.s.year} yılında, ${nm(c)} çalmayı öğrensin diye aldı.`,
            ),
          );
          c.h.closeness(String(c.vars.pid), 10);
          return c.t(
            `You bought the piano. ${nm(c)} played "Chopsticks" 400 times the first week.`,
            `Piyanoyu aldın. ${nm(c)} ilk hafta "Kedi Valsi"ni 400 kere çaldı.`,
          );
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Maybe a keyboard instead', 'Belki onun yerine bir org'),
        resolve: (c) =>
          c.t(
            `You bought ${nm(c)} a small keyboard. It has a drum button.`,
            `${dat(nm(c))} küçük bir org aldın. Davul tuşu da var.`,
          ),
      },
    ],
  },
  {
    id: 'base.painting',
    category: 'heirloom',
    minAge: 30,
    maxAge: 80,
    once: true,
    when: (c) => !c.h.hasHeirloom('painting'),
    title: (c) => c.t('You signed up for a painting class.', 'Resim kursuna yazıldın.'),
    text: (c) =>
      c.t('The teacher says you have "a very confident brush."', 'Hocan "fırçanın çok özgüvenli" olduğunu söylüyor.'),
    choices: [
      {
        id: 'serious',
        label: (c) => c.t('Paint a real masterpiece', 'Gerçek bir başyapıt çiz'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          if (c.rng.chance(0.4 + c.p.stats.smarts / 400)) {
            c.h.addHeirloom(
              'painting',
              c.t(`${c.p.firstName}'s view of ${c.p.city}`, `${gen(c.p.firstName)} ${c.p.city} manzarası`),
              c.t(
                `${c.p.firstName} painted it in ${c.s.year}. It hung in the hallway ever since.`,
                `${c.p.firstName} bunu ${c.s.year} yılında yaptı. O günden beri koridorda asılı.`,
              ),
            );
            return c.t(
              `Your painting of ${c.p.city} turned out beautiful. It will hang in the family hallway for generations.`,
              `${c.p.city} tablon harika oldu. Nesiller boyu ailenin koridorunda asılı kalacak.`,
            );
          }
          return c.t(
            'Your masterpiece looks like a sad potato. You are weirdly proud of it.',
            'Başyapıtın üzgün bir patatese benziyor. Garip bir şekilde gurur duyuyorsun.',
          );
        },
      },
      {
        id: 'fun',
        label: (c) => c.t('Just have fun with it', 'Sadece eğlen'),
        resolve: (c) => (
          c.h.stat('happiness', 4),
          c.t('You painted happy little clouds and drank tea.', 'Mutlu küçük bulutlar çizip çayını yudumladın.')
        ),
      },
    ],
  },
  {
    id: 'base.quilt',
    category: 'heirloom',
    minAge: 60,
    once: true,
    when: (c) => !c.h.hasHeirloom('quilt') && c.h.relatives('child').some((k) => (k.person.kids ?? 0) > 0),
    text: '',
    apply: (c) => {
      c.h.addHeirloom(
        'quilt',
        c.t(`${c.p.firstName}'s patchwork quilt`, `${gen(c.p.firstName)} kırk yama yorganı`),
        c.t(
          `${c.p.firstName} stitched it from old family clothes in ${c.s.year}.`,
          `${c.p.firstName} bunu ${c.s.year} yılında ailenin eski kıyafetlerinden dikti.`,
        ),
      );
      c.h.stat('happiness', 5);
      return c.t(
        "You stitched a quilt from the family's old clothes, one patch for every grandchild. It took you all winter.",
        'Ailenin eski kıyafetlerinden, her torun için bir yama olacak şekilde yorgan diktin. Bütün kışını aldı.',
      );
    },
    tone: 'good',
  },
  {
    id: 'base.recipes',
    category: 'heirloom',
    minAge: 40,
    once: true,
    when: (c) => !c.h.hasHeirloom('recipes') && !single(c),
    text: '',
    apply: (c) => {
      c.h.addHeirloom(
        'recipes',
        c.t(`${c.p.firstName}'s recipe notebook`, `${gen(c.p.firstName)} tarif defteri`),
        c.t(
          `${c.p.firstName} started writing the family recipes down in ${c.s.year}.`,
          `${c.p.firstName}, ${c.s.year} yılında aile tariflerini deftere yazmaya başladı.`,
        ),
      );
      c.h.stat('happiness', 3);
      return c.t(
        'You started writing down the family recipes in a notebook before anyone forgets them. Page one: the soup.',
        'Kimse unutmadan aile tariflerini bir deftere yazmaya başladın. İlk sayfa: çorba.',
      );
    },
  },
];
