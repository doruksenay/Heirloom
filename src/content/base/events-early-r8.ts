import type { Ctx, EventDef } from '../types';
import { Kw, befriend, friendsOf, grandsOf, heK, hisK, kw, near, newKid, nmc, opt, out, siblingsOf, tt } from './young-kit';

// Round 8: the first eighteen years. Warm, short moments for the thin ages, and a few that plant the dynasty hook in
// childhood (a name, a story, a wall of photos, a keepsake tin): this family is something you inherit and pass on.
// No new heirloom is ever created here; the keepsake events only flag the moment, or name an heirloom that already
// exists in the family. Every event is once per life, with a modest weight.

/** A living, real (not step) parent, for the events that put words in a parent's mouth. */
const realParents = (c: Ctx) => c.h.relatives(['mother', 'father']).filter((r) => !r.rel.step);
function pickReal(c: Ctx, key = 'par') {
  const ps = realParents(c);
  if (ps.length) c.vars[key] = c.rng.pick(ps).person.id;
}

/** The family heirloom this event is about (vars.hid), in the story language. */
function heirloomName(c: Ctx): string {
  const item = c.s.dynasty.heirlooms.find((x) => x.uid === c.vars.hid);
  if (!item) return '';
  return item.alt ? item.alt[c.lang === 'tr' ? 'tr' : 'en'] : item.name;
}

const SIBLING_AGES = (c: Ctx) => siblingsOf(c).filter((r) => {
  const a = c.h.ageOf(r.person);
  return a >= 3 && a < 18;
});

export const earlyR8Events: EventDef[] = [
  // ================================================================ 4–8: the family starts to talk
  {
    id: 'base.early8_name_story',
    category: 'family',
    minAge: 4,
    maxAge: 8,
    once: true,
    weight: 8,
    needs: ['parent'],
    setup: (c) => {
      pickReal(c);
      c.vars.v = c.rng.int(0, 2);
    },
    title: tt('You ask why you are called what you are called.', 'Neden adının o olduğunu soruyorsun.'),
    text: (c) => {
      const v = Number(c.vars.v);
      const en = [
        'after someone in the family who was apparently brave, or at least loud',
        'because it was the only name nobody argued about, after a three-week argument',
        'because it was pulled out of a hat, and then the hat was told to keep quiet about it',
      ][v];
      const tr = [
        'adını ailedeki cesur birinden almışsın, ya da en azından sesi çok çıkan birinden',
        'üç hafta süren bir tartışmadan sonra kimsenin itiraz etmediği tek ad bu çıkmış',
        'adını bir şapkadan çekmişler, şapkaya da kimseye söylememesini tembihlemişler',
      ][v];
      return c.t(`${Kw(c, 'par')} tells you the story: ${en}.`, `${Kw(c, 'par')} anlatıyor: ${tr}.`);
    },
    choices: [
      opt('proud', ['Wear it like a crown', 'Adını taç gibi tak'], (c) => {
        near(c, 'par', 4);
        return out(c, { hap: 3 }, `You said your name to the mirror seven times. It fits. Somebody handed it to you in good faith, and one day you may hand one on.`, 'Aynaya yedi kez adını söyledin. Üstüne tam oturuyor. Birileri onu sana güvenle verdi, bir gün sen de birine vereceksin.');
      }, { tone: 'good' }),
      opt('ask', ['Ask who had it before you', 'Senden önce kimde olduğunu sor'], (c) => {
        near(c, 'par', 3);
        return out(c, { sma: 1, hap: 2 }, 'It turns out the name has been in the family longer than the sofa. You are now its keeper, which is a lot for someone who cannot reach the light switch.', 'Meğer bu ad ailede koltuktan bile eskiymiş. Artık onun bekçisisin; ışık düğmesine uzanamayan biri için hiç de küçük bir iş değil.');
      }),
      opt('swap', ['Ask for a cooler one', 'Daha havalısını iste'], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 1 }, 'Request declined. A name is something you inherit, not a menu. You tried "Lightning" for one afternoon and nobody answered.', 'Talep reddedildi. İsim miras kalır, menüden seçilmez. Bir öğleden sonra "Şimşek" dedirtmeye çalıştın; kimse dönüp bakmadı.');
      }),
    ],
  },
  {
    id: 'base.early8_table_story',
    category: 'family',
    minAge: 6,
    maxAge: 9,
    once: true,
    weight: 8,
    needs: ['parent'],
    setup: (c) => {
      pickReal(c);
      c.vars.v = c.rng.int(0, 2);
    },
    title: tt('Dinner, and the story again.', 'Akşam yemeği ve o hikâye yine.'),
    text: (c) => {
      const v = Number(c.vars.v);
      const en = [
        'the winter the heating broke and everyone slept in one room "for weeks" (it was one night)',
        'the time a relative drove four hours to the wrong wedding and stayed for the cake',
        'the day the first fridge arrived and six people carried it upstairs with strong opinions',
      ][v];
      const tr = [
        'kaloriferin bozulduğu ve herkesin "haftalarca" tek odada yattığı kış (aslında bir geceydi)',
        'bir akrabanın dört saat yol gidip yanlış düğüne varması ve pasta için kalması',
        'ilk buzdolabının geldiği, altı kişinin de üst kata kuvvetli fikirlerle taşıdığı gün',
      ][v];
      return c.t(`${Kw(c, 'par')} tells the one about ${en}. Everyone at the table knows it by heart. Everyone listens anyway.`, `${Kw(c, 'par')} yine şu hikâyeyi anlatıyor: ${tr}. Masadaki herkes ezbere biliyor. Yine de herkes dinliyor.`);
    },
    choices: [
      opt('listen', ['Listen like it is brand new', 'Sanki ilk kez duyuyormuş gibi dinle'], (c) => {
        near(c, 'par', 4);
        c.h.flag('early8_tale');
        return out(c, { hap: 3 }, 'The story grew two details, just for the audience. You noticed that this is how a family keeps things: one retelling at a time. One day it will be your turn at the head of the table.', 'Hikâye dinleyici için iki ayrıntı kazandı. Bir ailenin bir şeyleri böyle sakladığını fark ettin: her anlatışta biraz daha. Bir gün masanın başında sıra sende olacak.');
      }, { tone: 'good' }),
      opt('add', ['Add a dramatic detail of your own', 'Kendi dramatik ayrıntını ekle'], (c) => {
        near(c, 'par', 2);
        c.h.flag('early8_tale');
        return out(c, { hap: 2, sma: 1 }, 'Next time, your detail was in it: a goose. In this family that is how you join the story, by being added to it. The goose is now canon.', 'Bir sonraki anlatışta senin ayrıntın da vardı: bir kaz. Bu ailede hikâyeye böyle katılıyorsun, hikâyeye eklenerek. Kaz artık resmî.');
      }),
      opt('correct', ['Correct a small detail', 'Küçük bir ayrıntıyı düzelt'], (c) => {
        near(c, 'par', -2);
        return out(c, { sma: 2 }, '"It was Tuesday." Silence. "...It was Wednesday," they admitted. The story is now two minutes shorter and nobody is thrilled.', '"Salıydı." Sessizlik. "...Çarşambaydı," diye kabul ettiler. Hikâye iki dakika kısaldı ve kimse sevinmedi.');
      }),
    ],
  },
  {
    id: 'base.early8_nickname',
    category: 'family',
    minAge: 5,
    maxAge: 9,
    once: true,
    weight: 7,
    setup: (c) => {
      c.vars.v = c.rng.int(0, 3);
    },
    title: (c) => {
      const v = Number(c.vars.v);
      return c.t(`Your family now calls you "${['Biscuit', 'Captain', 'Pickle', 'Bean'][v]}".`, `Ailen sana artık "${['Bisküvi', 'Kaptan', 'Turşu', 'Fasulye'][v]}" diyor.`);
    },
    text: tt('Nobody remembers who started it. By now the neighbours use it too.', 'Kimin başlattığını kimse hatırlamıyor. Artık komşular bile öyle sesleniyor.'),
    choices: [
      opt('embrace', ['Answer to it proudly', 'Gururla cevap ver'], (c) => out(c, { hap: 3 }, 'You answered to it so well that it will outlive you. In a family, nicknames are the only thing handed down with no paperwork.', 'O kadar güzel cevap verdin ki lakap seni de aşacak. Ailede lakap, evrak işi olmadan devredilen tek şey.'), { tone: 'good' }),
      opt('demand', ['Insist on your real name', 'Gerçek adını söylemekte ısrar et'], (c) => out(c, { sma: 1, hap: -1 }, 'You insisted. They said "of course, boss" for exactly one day. On day two the nickname was back, with a bonus nickname.', 'Israr ettin. Bir gün boyunca "tabii efendim" dediler. İkinci gün lakap geri geldi, yanında bir de yeni lakapla.')),
      opt('school', ['Take it to school', 'Okula taşı'], (c) => out(c, { hap: 1, loo: -1 }, 'By Friday the entire class was using it. You are now famous for something you did not do. It is a start.', 'Cumaya kadar bütün sınıf kullanıyordu. Yapmadığın bir şeyle ünlü oldun. İyi bir başlangıç.')),
    ],
  },
  {
    id: 'base.early8_sick_day',
    category: 'childhood',
    minAge: 3,
    maxAge: 8,
    once: true,
    weight: 7,
    needs: ['parent'],
    setup: (c) => pickReal(c),
    title: tt('A sick day at home.', 'Evde hasta bir gün.'),
    text: (c) => c.t(`The house is quiet in a way you have never heard. ${Kw(c, 'par')} stays home with you and keeps touching your forehead as if it were a doorbell.`, `Ev hiç duymadığın kadar sessiz. ${Kw(c, 'par')} seninle evde kaldı ve alnına dokunup duruyor, sanki kapı zili.`),
    choices: [
      opt('nest', ['Build a blanket nest on the sofa', 'Koltukta battaniyeden yuva yap'], (c) => {
        near(c, 'par', 3);
        return out(c, { hea: 2, hap: 3 }, 'You recovered on schedule, in a nest. It turns out this is exactly how the grown-ups in your family got better when they were small, down to the same cushion.', 'Tam zamanında iyileştin, bir yuvanın içinde. Meğer ailedeki büyükler de küçükken tıpkı böyle iyileşirmiş, hatta aynı yastıkla.');
      }, { tone: 'good' }),
      opt('questions', ['Ask a hundred questions about when they were little', 'Küçükken neler yaptıklarını yüz soruyla sor'], (c) => {
        near(c, 'par', 4);
        return out(c, { sma: 2, hap: 2 }, 'Question sixty-one was "what did you do when you were sick?" The answer: "Exactly this." You are both pleased that some things get passed down with no effort.', 'Altmış birinci soru "hastayken ne yapardın?" idi. Cevap: "Tam olarak bunu." İkiniz de bazı şeylerin zahmetsizce devredilmesine sevindiniz.');
      }),
      opt('fake', ['Pretend to feel worse than you do', 'Olduğundan hasta numarası yap'], (c) => {
        near(c, 'par', -1);
        return out(c, { hap: 2, hea: -1 }, 'You were caught when you asked for a second slice of cake. The thermometer, unlike you, tells the truth.', 'İkinci dilim pasta isteyince yakalandın. Termometre senin aksine doğruyu söyler.');
      }),
    ],
  },

  // ================================================================ 6–13: home, a wall, a tin, a keepsake
  {
    id: 'base.early8_moving_day',
    category: 'childhood',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 7,
    title: tt('Your family is moving to a new place.', 'Aileniz yeni bir eve taşınıyor.'),
    text: tt('Your room is a cardboard city. The kettle is now "somewhere". Your favourite spoon is nowhere.', 'Odan karton bir şehre döndü. Çaydanlık artık "bir yerlerde". En sevdiğin kaşık hiçbir yerde.'),
    choices: [
      opt('pack', ['Pack your own box', 'Kendi kutunu hazırla'], (c) => out(c, { sma: 1, hap: 1 }, 'You labelled it IMPORTANT and filled it with a rock, a spoon and one sock. It was the first box unpacked, as the most important one.', 'Üstüne ÖNEMLİ yazdın, içine bir taş, bir kaşık ve tek çorap koydun. Önemli kutu olarak ilk açılan o oldu.'), { tone: 'good' }),
      opt('hide', ['Hide in the biggest box', 'En büyük kutuya saklan'], (c) => out(c, { hap: 3 }, 'You were nearly loaded onto the truck. The movers said it was the lightest box they ever carried and the only one that giggled.', 'Neredeyse kamyona yükleniyordun. Nakliyeciler bu kutunun taşıdıkları en hafif ve kıkırdayan tek kutu olduğunu söyledi.')),
      opt('goodbye', ['Say goodbye to every room', 'Her odaya veda et'], (c) => out(c, { hap: -1, sma: 1 }, 'You said goodbye to every room, including the bathroom. It took an hour. The movers waited with the respect of people who have seen this before.', 'Banyo dahil her odaya veda ettin. Bir saat sürdü. Nakliyeciler, bunu daha önce görmüş insanların saygısıyla bekledi.')),
    ],
  },
  {
    id: 'base.early8_photo_wall',
    category: 'family',
    minAge: 7,
    maxAge: 11,
    once: true,
    weight: 8,
    title: tt('The wall of family photos.', 'Duvardaki aile fotoğrafları.'),
    text: tt('The hallway wall holds framed faces, hung whenever somebody found a nail. A few of them have your nose and much worse haircuts.', 'Koridor duvarı, biri çivi bulduğunda asılmış çerçeveli yüzlerle dolu. Bazılarının burnu seninkine benziyor, saç kesimleri çok daha kötü.'),
    choices: [
      opt('who', ['Ask who everybody is', 'Hepsinin kim olduğunu sor'], (c) => {
        c.h.flag('early8_wall');
        return out(c, { sma: 2, hap: 1 }, 'You learned names, nicknames and what happened in the one where everyone is squinting. The wall is not decoration. It is a family tree with fingerprints.', 'Adları, lakapları ve herkesin gözlerini kıstığı fotoğrafta ne olduğunu öğrendin. Duvar süs değil. Parmak izli bir soy ağacı.');
      }, { tone: 'good' }),
      opt('hang', ['Hang your own drawing among them', 'Kendi resmini aralarına as'], (c) => out(c, { hap: 3 }, 'Between two serious portraits now hangs a horse. Nobody took it down. You are officially on the wall.', 'İki ciddi portrenin arasında şimdi bir at asılı. Kimse indirmedi. Artık resmen duvardasın.')),
      opt('space', ['Ask about the empty space at the end', 'Sondaki boş yeri sor'], (c) => {
        c.h.flag('early8_wall');
        return out(c, { hap: 2, sma: 1 }, '"That is for whoever comes next," they said. You spent the evening counting nails and thinking about who that might be, and then about who might hang you.', '"Orası sonradan gelecek olan için," dediler. Akşamı çivileri sayarak ve o kişinin kim olabileceğini, sonra da seni kimin asacağını düşünerek geçirdin.');
      }),
    ],
  },
  {
    id: 'base.early8_keepsake_tin',
    category: 'family',
    minAge: 6,
    maxAge: 10,
    once: true,
    weight: 8,
    needs: ['parent'],
    setup: (c) => {
      pickReal(c);
      const items = c.s.dynasty.heirlooms;
      if (items.length) c.vars.hid = c.rng.pick(items).uid;
    },
    title: tt('A biscuit tin at the back of the wardrobe.', 'Dolabın arkasında bir bisküvi kutusu.'),
    text: (c) => {
      const hl = heirloomName(c);
      const extra = hl ? { en: ` It lives near ${hl}, which has its own shelf.`, tr: ` Kutu, kendi rafı olan aile yadigârı ${hl} ile aynı yerde duruyor.` } : { en: '', tr: '' };
      return c.t(
        `It is full of small odd things: a button, a ticket, a key to nothing.${extra.en} ${Kw(c, 'par')} finds you rummaging and, instead of scolding, sits down to explain.`,
        `İçi küçük tuhaf şeylerle dolu: bir düğme, bir bilet, hiçbir şeyi açmayan bir anahtar.${extra.tr} ${Kw(c, 'par')} seni karıştırırken yakaladı ve azarlamak yerine oturup anlatmaya başladı.`,
      );
    },
    choices: [
      opt('key', ['Ask about the key to nothing', 'Hiçbir şeyi açmayan anahtarı sor'], (c) => {
        near(c, 'par', 3);
        c.h.flag('early8_tin');
        return out(c, { sma: 2, hap: 2 }, 'It opened a trunk in a flat the family left long ago. The trunk is gone. The key stayed. "That is the rule," they said. "You keep the key."', 'Ailenin çok önce ayrıldığı bir evdeki sandığı açarmış. Sandık gitmiş. Anahtar kalmış. "Kural bu," dediler. "Anahtarı saklarsın."');
      }, { tone: 'good' }),
      opt('keep', ['Ask to keep one thing', 'Birini saklamak için izin iste'], (c) => {
        near(c, 'par', 2);
        c.h.flag('early8_tin');
        return out(c, { hap: 3 }, 'You were given a button, the family\'s oldest. You carry it like a passport and show it to people who did not ask.', 'Sana düğme verildi, ailenin en eskisi. Pasaport gibi taşıyor, sormayanlara bile gösteriyorsun.');
      }),
      opt('add', ['Add something of your own', 'Kendi eşyalarından birini ekle'], (c) => {
        near(c, 'par', 3);
        c.h.flag('early8_tin');
        return out(c, { hap: 2 }, 'You added a bottle cap. The tin now has you in it. This is how a family collects people: one odd little thing at a time.', 'Bir şişe kapağı ekledin. Kutunun içinde artık sen de varsın. Aile insanları böyle toplar: tuhaf küçük bir şeyle, bir seferde.');
      }),
    ],
  },
  {
    id: 'base.early8_grand_keepsake',
    category: 'heirloom',
    minAge: 8,
    maxAge: 13,
    once: true,
    weight: 8,
    needs: ['grandparent'],
    when: (c) => c.s.dynasty.heirlooms.length > 0 && grandsOf(c).length > 0,
    setup: (c) => {
      const gs = grandsOf(c);
      c.vars.gp = c.rng.pick(gs).person.id;
      c.vars.hid = c.rng.pick(c.s.dynasty.heirlooms).uid;
    },
    title: (c) => c.t(`${Kw(c, 'gp')} lifts the lid off something old.`, `${Kw(c, 'gp')} eski bir şeyin kapağını kaldırıyor.`),
    text: (c) =>
      c.t(
        `It is the family keepsake: ${heirloomName(c)}. "This will be yours one day," ${heK(c, 'gp')} says. "Not today. Today you may look."`,
        `Aile yadigârı: ${heirloomName(c)}. "Bu bir gün senin olacak," diyor. "Bugün değil. Bugün sadece bakabilirsin."`,
      ),
    choices: [
      opt('promise', ['Promise to look after it', 'Ona iyi bakacağına söz ver'], (c) => {
        near(c, 'gp', 5);
        c.h.flag('early8_promise');
        return out(c, { hap: 2 }, 'You promised with a hand on your heart, then on the rug, because you ran out of hand. It was the most serious thing you had ever said.', 'Elini kalbine koyarak söz verdin, sonra halıya koyarak, çünkü el yetmedi. Hayatında söylediğin en ciddi şeydi.');
      }, { tone: 'good' }),
      opt('hold', ['Ask to hold it', 'Tutmak için izin iste'], (c) => {
        near(c, 'gp', 3);
        return out(c, { hap: 3, sma: 1 }, 'You held it with both hands and your breath. Nothing broke. Everyone exhaled only after it was back in its box.', 'İki elinle ve nefesini tutarak tuttun. Hiçbir şey kırılmadı. Kutusuna dönene kadar kimse nefes almadı.');
      }),
      opt('worth', ['Ask how much it is worth', 'Ne kadar ettiğini sor'], (c) => {
        near(c, 'gp', -3);
        return out(c, { sma: 1 }, '"It is not for sale." "But if it were?" You were given the look usually reserved for spinach. You will be forgiven by Sunday.', '"Satılık değil." "Ama olsaydı?" Genelde ıspanağa ayrılan o bakışı aldın. Pazara kadar affedileceksin.');
      }),
    ],
  },

  // ================================================================ 9–15: friends, siblings, the kitchen
  {
    id: 'base.early8_tape_line',
    category: 'family',
    minAge: 7,
    maxAge: 13,
    once: true,
    weight: 8,
    needs: ['sibling'],
    when: (c) => SIBLING_AGES(c).length > 0,
    setup: (c) => {
      const list = SIBLING_AGES(c);
      if (list.length) c.vars.sib = c.rng.pick(list).person.id;
    },
    title: (c) => c.t(`A tape line appears down the middle of the room you share with ${nmc(c, 'sib')}.`, `${nmc(c, 'sib', 'wth')} paylaştığın odanın ortasında bir bant çizgisi belirdi.`),
    text: tt('Who put it there is disputed. Which side has the window is not.', 'Onu kimin yapıştırdığı tartışmalı. Pencerenin hangi tarafta olduğu değil.'),
    choices: [
      opt('respect', ['Respect the line', 'Çizgiye saygı göster'], (c) => {
        near(c, 'sib', 2);
        return out(c, { hap: 1 }, 'Peace through geometry. For a week, you each had a country with a border and exactly one shared opinion about socks.', 'Geometriyle gelen barış. Bir hafta boyunca ikinizin de sınırları belli bir ülkesi vardı ve çoraplar konusunda tek bir ortak fikriniz.');
      }),
      opt('toe', ['Put one toe across', 'Bir ayağını karşıya uzat'], (c) => {
        near(c, 'sib', -3);
        return out(c, { hap: 2 }, 'The toe had a mission. The treaty collapsed in four seconds and a pillow war began.', 'Parmağın bir görevi vardı. Antlaşma dört saniyede çöktü, yastık savaşı başladı.');
      }),
      opt('treaty', ['Negotiate a shared shelf', 'Ortak bir raf için pazarlık et'], (c) => {
        near(c, 'sib', 5);
        return out(c, { sma: 2, hap: 1 }, 'You traded the window for the lamp and one shelf in the middle. The line stayed, but with a gate. You will find out that most families run on gates.', 'Pencereyi lambayla, ortadaki bir rafı da ikiniz için takas ettin. Çizgi kaldı, ama bir kapıyla. Çoğu ailenin kapılarla yürüdüğünü ileride göreceksin.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.early8_friend_fallout',
    category: 'school',
    minAge: 9,
    maxAge: 14,
    once: true,
    weight: 8,
    when: (c) => friendsOf(c).length > 0,
    setup: (c) => {
      const fs = friendsOf(c);
      if (fs.length) c.vars.fr = c.rng.pick(fs).person.id;
    },
    title: (c) => c.t(`${nmc(c, 'fr')} sat somewhere else at lunch.`, `${nmc(c, 'fr')} öğle yemeğinde başka yere oturdu.`),
    text: (c) => c.t(`Without you. Without telling you. Next to someone who owns a trampoline.`, `Sensiz. Sana söylemeden. Üstelik trambolini olan birinin yanına.`),
    choices: [
      opt('ask', ['Ask what happened', 'Ne olduğunu sor'], (c) => {
        near(c, 'fr', 6);
        return out(c, { hap: 1 }, '"I thought you were busy." You were not. Two apologies and half a swapped sandwich later, everything was fine and nobody could say what it had been about.', '"Meşgulsün sandım." Değildin. İki özür ve yarım takas sandviçin ardından her şey yoluna girdi; neyle ilgili olduğunu kimse söyleyemedi.');
      }, { tone: 'good' }),
      opt('sulk', ['Sulk with great dignity', 'Büyük bir vakarla küs'], (c) => {
        near(c, 'fr', -5);
        return out(c, { hap: -2 }, 'You ignored them so well it took them until Thursday to notice. By then you had both forgotten the reason and kept the silence anyway, out of respect.', 'Onu o kadar iyi görmezden geldin ki fark etmesi perşembeyi buldu. O zamana kadar ikiniz de sebebi unuttunuz, sessizliği yine de saygıdan sürdürdünüz.');
      }),
      opt('trampoline', ['Befriend the trampoline kid too', 'Trambolin sahibiyle de arkadaş ol'], (c) => {
        const kid = newKid(c, 'kid', 1);
        befriend(c, 'kid', 45);
        near(c, 'fr', 2);
        return out(c, { hap: 3 }, `Friendship got bigger. ${kid.firstName} turned out to be fine, and the trampoline turned out to be enormous.`, `Arkadaşlık büyüdü. ${kid.firstName} gayet iyi biri çıktı, trambolin de devasa.`);
      }),
    ],
  },
  {
    id: 'base.early8_take_after',
    category: 'family',
    minAge: 10,
    maxAge: 13,
    once: true,
    weight: 8,
    title: tt('Relatives debate who you take after.', 'Akrabalar kime çektiğini tartışıyor.'),
    text: tt('The nose is from one side, the laugh from the other, the stubbornness from "somewhere in the middle". You are standing there, being discussed.', 'Burun bir taraftan, kahkaha öbür taraftan, inatçılık da "aradan bir yerden". Sen ortada duruyor, tartışılıyorsun.'),
    choices: [
      opt('brains', ['Claim the brains', 'Zekâyı sahiplen'], (c) => out(c, { sma: 2, loo: -1 }, 'You claimed the clever ancestors, and spent the evening reading to live up to them. There are no records. You chose your own history, and it is yours now.', 'Akıllı atalarını seçtin ve akşamı onlara layık olmak için kitap okuyarak geçirdin. Kayıt yok. Kendi geçmişini seçtin, artık senin.')),
      opt('looks', ['Claim the looks', 'Güzelliği sahiplen'], (c) => out(c, { loo: 2, sma: -1 }, 'You decided you got the good cheekbones, and stood in a way that proved it, for hours. One day somebody will say the same about your kid, and you will pretend it is a surprise.', 'İyi elmacık kemiklerinin sende olduğuna karar verdin ve bunu kanıtlayan bir duruşla saatlerce durdun. Bir gün birileri bunu senin çocuğun için de söyleyecek; sen şaşırmış gibi yapacaksın.')),
      opt('grit', ['Claim the stubbornness', 'İnatçılığı sahiplen'], (c) => out(c, { hea: 2, hap: -1 }, 'You took the stubborn streak, the one that outlived three winters and two doctors. It comes with a lot of "no" and a very strong heart.', 'İnatçılığı aldın; üç kışı ve iki doktoru atlatmış olanı. Yanında çok "hayır" ve çok sağlam bir kalp geliyor.')),
    ],
  },
  {
    id: 'base.early8_family_dish',
    category: 'family',
    minAge: 11,
    maxAge: 15,
    once: true,
    weight: 8,
    needs: ['parent'],
    setup: (c) => pickReal(c),
    title: tt('You are allowed to stir the family dish.', 'Aile yemeğini karıştırmana izin var.'),
    text: (c) => c.t(`Every family has one dish only one person makes right. This year ${kw(c, 'par')} decides ${heK(c, 'par')} trusts you with the spoon. There is no recipe, only "a bit of this" and "until it looks right".`, `Her ailenin yalnızca bir kişinin doğru yaptığı bir yemeği vardır. Bu yıl ${kw(c, 'par')} kaşığı sana emanet etmeye karar verdi. Tarif yok; yalnızca "şundan biraz" ve "olana kadar".`),
    choices: [
      opt('learn', ['Watch closely and take notes', 'Dikkatle izle ve not al'], (c) => {
        near(c, 'par', 4);
        c.h.flag('early8_dish');
        return out(c, { sma: 2, hap: 1 }, 'You wrote "a bit" forty-one times. You will make it your own way someday and call it the family way, and whoever eats it will believe you.', '"Biraz" yazısını kırk bir kez yazdın. Bir gün kendi yöntemine göre yapıp ona aile usulü diyeceksin; yiyen de sana inanacak.');
      }, { tone: 'good' }),
      opt('taste', ['Volunteer as chief taster', 'Baş tadıcı olmaya gönüllü ol'], (c) => {
        near(c, 'par', 2);
        return out(c, { hap: 3, hea: -1 }, 'Quality control was thorough. There was not quite enough left for the table, but the dish passed the exam.', 'Kalite kontrol çok titizdi. Sofraya tam yetecek kadar kalmadı ama yemek sınavı geçti.');
      }),
      opt('improve', ['Improve it with ketchup', 'Ketçapla geliştir'], (c) => {
        near(c, 'par', -3);
        return out(c, { hap: 1 }, 'The ketchup went in. A silence followed that was older than the dish itself. The dish survived. The relationship will need a day.', 'Ketçap girdi. Yemekten bile eski bir sessizlik çöktü. Yemek hayatta kaldı. İlişkinin bir güne ihtiyacı var.');
      }),
    ],
  },

  // ================================================================ 14–17: the near horizon
  {
    id: 'base.early8_heartbreak',
    category: 'love',
    minAge: 14,
    maxAge: 17,
    once: true,
    weight: 8,
    setup: (c) => pickReal(c),
    title: tt('You were "better as friends".', 'Seninle "arkadaş kalmak daha iyiymiş".'),
    text: tt('The person you had been "talking to" for three weeks has made a decision. You did not get a vote. The ceiling looks different now.', 'Üç haftadır "konuştuğun" kişi bir karar verdi. Oy hakkın yoktu. Tavan artık farklı görünüyor.'),
    choices: [
      opt('songs', ['Play sad songs on repeat', 'Hüzünlü şarkıları tekrar çal'], (c) => out(c, { hap: -2, sma: 1 }, 'You wallowed professionally. By day four you were humming the chorus happily, which is worse. You now have strong opinions about minor keys.', 'Profesyonelce hüzünlendin. Dördüncü günde nakaratı neşeyle mırıldanıyordun, ki bu daha kötü. Artık minör tonlar hakkında güçlü fikirlerin var.')),
      opt('talk', ['Tell a parent', 'Bir ebeveynine anlat'], (c) => {
        near(c, 'par', 5);
        return out(c, { hap: 3 }, `"I know," ${heK(c, 'par')} said, made something to eat, and told you about ${hisK(c, 'par')} first one. It was longer and involved a motorbike. You did not feel better, but you felt less alone, and it turns out that is most of it.`, '"Biliyorum," dedi, yiyecek bir şeyler hazırladı ve kendi ilkini anlattı. Daha uzundu ve içinde bir motosiklet vardı. Daha iyi hissetmedin ama yalnız hissetmedin; çoğu zaman mesele bu çıkıyor.');
      }, { hidden: (c) => !c.vars.par, tone: 'good' }),
      opt('friends', ['Call your friends', 'Arkadaşlarını ara'], (c) => out(c, { hap: 2 }, 'They arrived with snacks and a ranking of the person\'s flaws. It was unkind, accurate and exactly what you needed.', 'Atıştırmalıklarla ve o kişinin kusurlarının sıralamasıyla geldiler. Acımasız, doğru ve tam ihtiyacın olan şeydi.'), { hidden: (c) => friendsOf(c).length === 0 }),
      opt('busy', ['Throw yourself into something', 'Kendini bir işe ver'], (c) => out(c, { sma: 2, hap: -1 }, 'You reorganised your entire room and finished a project nobody asked for. The heart is a muscle; the room, at least, looks great.', 'Bütün odanı yeniden düzenledin ve kimsenin istemediği bir projeyi bitirdin. Kalp bir kas; en azından oda harika görünüyor.')),
    ],
  },
  {
    id: 'base.early8_future_letter',
    category: 'school',
    minAge: 15,
    maxAge: 17,
    once: true,
    weight: 7,
    title: tt('Write a letter to yourself, to open in ten years.', 'Kendine bir mektup yaz, on yıl sonra açılacak.'),
    text: tt('The teacher lists questions on the board: where will you live, what will you do, who will be there, and will anyone small have your laugh?', 'Öğretmen tahtaya sorular sıralıyor: nerede yaşayacaksın, ne yapacaksın, yanında kim olacak ve küçük biri senin kahkahana sahip olacak mı?'),
    choices: [
      opt('serious', ['Write it honestly', 'Dürüstçe yaz'], (c) => {
        c.h.flag('early8_letter');
        return out(c, { sma: 1, hap: 2 }, `You wrote that you hoped for a family of your own someday, and that you hoped they would like the old stories as much as you do. You sealed it. Future ${c.p.firstName} will cry a little.`, `Bir gün kendi ailen olsun istediğini ve onların eski hikâyeleri senin kadar sevmesini umduğunu yazdın. Zarfı kapattın. Gelecekteki sen biraz ağlayacak.`);
      }, { tone: 'good' }),
      opt('joke', ['Fill it with jokes', 'Şakalarla doldur'], (c) => out(c, { hap: 3 }, '"Dear me, did you buy a boat yet? If not, why? Love, me." You laughed alone at your desk. The ten years will be funnier than the letter.', '"Sevgili ben, tekne aldın mı? Almadıysan neden? Sevgiler, ben." Sıranda tek başına güldün. On yıl mektuptan daha komik olacak.')),
      opt('blank', ['Seal it empty', 'Boş bırakıp kapat'], (c) => out(c, { hap: 1 }, 'A blank page, sealed with great ceremony. Future you will be either impressed or very confused. You are betting on impressed.', 'Büyük bir törenle kapatılmış boş bir sayfa. Gelecekteki sen ya etkilenecek ya da çok şaşıracak. Sen etkilenmeye oynuyorsun.')),
    ],
  },
];
