import type { Ctx, EventDef } from '../types';
import { abl, acc, dat, gen, wage, wth } from './util';
import { dateGender } from './events-scheduled';
import { afford, ch, married, nmv, noMourn, setPartner, yearsTogether } from './adult-kit';
import { divorceTerms, divorcedLine } from './relationships';
import { HeK, heK, hasFriend, near, out, pickParent, Kw, friendsOf } from './young-kit';

// Love wave: romance and relationships across the whole life (ids base.lv_*). Crushes, notes and first dates for the
// young, apps and blind dates, friend-to-lover, exes and rebounds, jealousy and temptation, long distance, meeting
// the family, wedding-party planning (the first year of a marriage), in-laws, marriage crises, life after a split,
// single life, and love late in life or after losing a partner. No anniversaries (the engine runs those).
// RNG: a few c.rng calls in setups and resolves, never depending on the language. Money in US dollars via wage().
// Anyone who acts is a living person: partners and exes come from c.h.relatives (living only), new people are
// created in setup, parents and friends are picked with needs/hasFriend guards.

const B = { category: 'love' as const };
const pid = (c: Ctx) => String(c.vars.pid);
const nn = (c: Ctx, k = 'pid') => nmv(c, k);
/** The first (living) unmarried partner, stored in vars.pid. */
const dating = (c: Ctx) => c.h.relatives('partner').length > 0;
const setDating = (c: Ctx) => {
  c.vars.pid = c.h.relatives('partner')[0]?.person.id ?? '';
};
/** Takes money (US dollars, scaled), never into debt. */
const spend = (c: Ctx, usd: number) => c.h.money(-Math.min(wage(c, usd), Math.max(0, c.p.money)));
const can = (usd: number) => (c: Ctx) => afford(c, wage(c, usd));
const cashTxt = (c: Ctx, usd: number) => c.h.fmt(wage(c, usd));

/** A new person of a gender the player is drawn to, about the player's age, stored in vars[key] (one rng for age). */
function newDate(c: Ctx, lo: number, hi: number, key = 'pid') {
  const age = Math.max(lo, Math.min(hi, c.age + c.rng.int(-3, 3)));
  c.vars[key] = c.h.newPerson({ gender: dateGender(c), age }).id;
}
/** Makes the person in vars[key] the partner (only when there is none). */
function startDating(c: Ctx, key = 'pid', closeness = 60): boolean {
  if (c.h.partner()) return false;
  c.h.addRelation(c.h.person(String(c.vars[key])), 'partner', closeness);
  return true;
}
/** Chance that a first move works: looks and mood help a little. One rng call. */
const lucky = (c: Ctx, base: number) => c.rng.chance(Math.min(0.9, base + c.p.stats.looks / 400 + c.p.stats.happiness / 600));
/** Ends the relationship with `id`: a break-up for a partner, a full divorce for a spouse. Returns the story line plus the divorce sentences. */
function split(c: Ctx, id: string, en: string, tr: string): string {
  const spouse = c.p.relations.find((r) => r.personId === id)?.kind === 'spouse';
  const line = c.t(en, tr);
  if (!spouse) {
    c.h.setKind(id, 'ex');
    return line;
  }
  const head = divorcedLine(c, id);
  return `${line} ${head} ${divorceTerms(c, id)}`.replace(/\s+/g, ' ').trim();
}
/** A recent ex (split within `years` years), stored in vars.pid. */
const recentEx = (c: Ctx, years = 2) => c.h.relatives('ex').filter((r) => c.s.year - r.rel.sinceYear <= years);
const widowed = (c: Ctx) =>
  !c.h.partner() &&
  c.p.relations.some((r) => (r.kind === 'spouse' || r.kind === 'partner') && c.s.people[r.personId]?.deathYear !== undefined);
const adultFriends = (c: Ctx) => friendsOf(c).filter((f) => c.h.ageOf(f.person) >= 18 && Math.abs(c.h.ageOf(f.person) - c.age) <= 15);
const hasAdultFriend = (c: Ctx) => adultFriends(c).length > 0;


// ------------------------------------------------------------------ teens

const teen: EventDef[] = [
  {
    ...B,
    id: 'base.lv_crush_note',
    minAge: 14,
    maxAge: 17,
    weight: 70,
    cooldown: 3,
    maxPerLife: 2,
    needs: ['student', 'single'],
    setup: (c) => newDate(c, 13, 19),
    title: (c) => c.t('A folded note in your bag', 'Çantanda katlanmış bir not'),
    text: (c) =>
      c.t(
        `Between two textbooks you find a note: "I think you're nice. Do you think I'm nice? Circle yes or no." The handwriting looks a lot like ${nn(c)}'s, who sits two rows ahead of you.`,
        `İki ders kitabının arasında bir not buluyorsun: "Seni sevimli buluyorum. Sence ben sevimli miyim? Evet ya da hayır'ı daire içine al." El yazısı iki sıra önünde oturan ${dat(nn(c))} ait gibi görünüyor.`,
      ),
    choices: [
      ch('yes', 'Circle yes, in pen', 'Evet\'i kalemle daire içine al', (c) => {
        if (lucky(c, 0.55) && startDating(c, 'pid', 55)) return out(c, { hap: 6 }, `It was ${nn(c)}'s note after all. By lunch you were holding hands under the table, which is a legal thing to do in school.`, `Notu gerçekten ${nn(c)} yazmış. Öğle yemeğinde masanın altında el ele tutuşuyordunuz; okulda bunun yasak olmadığını düşünüyorsunuz.`);
        return out(c, { hap: -4 }, 'The note was meant for the person sitting behind you. You folded it into a very small square and thought about moving to another country.', 'Not arkanda oturan kişiye yazılmıştı. Notu minicik bir kareye katlayıp başka bir ülkeye taşınmayı düşündün.');
      }, { tone: 'good' }),
      ch('joke', 'Draw a small cat and write "maybe"', 'Küçük bir kedi çiz ve "belki" yaz', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 50)) return out(c, { hap: 5 }, `${nn(c)} laughed so loudly the teacher looked up. The cat is now pinned above a desk, and so are you, kind of.`, `${nn(c)} o kadar yüksek sesle güldü ki öğretmen kafasını kaldırdı. Kedi artık bir sıranın üstünde duruyor; sen de biraz öyle.`);
        return out(c, { hap: 1 }, 'Nobody answered the cat. It stayed unanswered for the rest of the term, which is its own kind of fame.', 'Kediye kimse cevap vermedi. Dönem boyunca cevapsız kaldı; bu da bir tür ünlülük.');
      }),
      ch('show', 'Show it to your friends', 'Arkadaşlarına göster', (c) => out(c, { hap: -3 }, 'Within an hour the whole class has read it twice and added commentary. The note comes back to you with a heart, an arrow and someone else\'s name on it.', 'Bir saat içinde bütün sınıf notu iki kez okuyup yorum ekledi. Not sana kalp, ok ve başkasının adıyla geri geldi.')),
      ch('bin', 'Pretend you never saw it', 'Hiç görmemiş gibi yap', (c) => out(c, { hap: -2 }, 'You dropped it in the bin and thought about it for eleven days. The bin was emptied on day three.', 'Notu çöpe attın ve on bir gün boyunca düşündün. Çöp üçüncü gün boşaltılmıştı.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_study_excuse',
    minAge: 14,
    maxAge: 18,
    weight: 55,
    cooldown: 4,
    maxPerLife: 2,
    needs: ['student', 'single'],
    setup: (c) => newDate(c, 13, 19),
    title: (c) => c.t(`${nn(c)} asks you to study together`, `${nn(c)} birlikte ders çalışmayı teklif ediyor`),
    text: (c) =>
      c.t(
        `"I really don't understand any of it," says ${nn(c)}. ${HeK(c, 'pid')} understands all of it, and you both know it. The library closes at six.`,
        `"Hiçbir şey anlamıyorum," diyor ${nn(c)}. Aslında her şeyi anlıyor ve ikiniz de bunu biliyorsunuz. Kütüphane altıda kapanıyor.`,
      ),
    choices: [
      ch('study', 'Actually study, properly', 'Gerçekten, düzgünce ders çalış', (c) => out(c, { sma: 2, hap: 2 }, `You covered three chapters and ${nn(c)} said "you explain things well" like it was a compliment and a confession at once. You also passed the test.`, `Üç konu bitirdiniz; ${nn(c)} "iyi anlatıyorsun" dedi, hem iltifat hem itiraf gibiydi. Ayrıca sınavı da geçtin.`), { tone: 'good' }),
      ch('snacks', 'Bring snacks and make it a hangout', 'Atıştırmalık getir, buluşmaya çevir', (c) => {
        if (lucky(c, 0.45) && startDating(c, 'pid', 55)) return out(c, { hap: 5, sma: -1 }, `Three chapters became zero chapters and one very long walk home. ${nn(c)} texted "same time tomorrow?" before you reached your door.`, `Üç konu sıfır konuya, bir de çok uzun bir eve yürüyüşüne dönüştü. Kapına varmadan ${nn(c)} "yarın aynı saat?" diye yazdı.`);
        return out(c, { hap: 2, sma: -2 }, 'The snacks were a hit. The chapter was not covered. Neither was the test.', 'Atıştırmalıklar çok sevildi. Konu bitmedi. Sınav da iyi geçmedi.');
      }),
      ch('fake', 'Pretend you do not get it either', 'Sen de anlamıyormuş gibi yap', (c) => out(c, { hap: 1, sma: -1 }, 'Two people stared at one page for an hour, each pretending to be lost. It was the most honest hour of your week.', 'İki kişi bir saat boyunca aynı sayfaya baktı, ikisi de kayıp rolü yaptı. Haftanın en dürüst saatiydi.')),
      ch('busy', 'Say you are busy', 'Meşgulsün de', (c) => out(c, { hap: -2 }, `You were not busy. You watched the same video four times and wondered what ${nn(c)} was doing.`, `Meşgul değildin. Aynı videoyu dört kez izleyip ${nn(c)} ne yapıyor diye düşündün.`)),
    ],
  },
  {
    ...B,
    id: 'base.lv_dare',
    minAge: 14,
    maxAge: 18,
    weight: 50,
    cooldown: 4,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 13, 19),
    title: (c) => c.t('Truth or dare', 'Doğruluk mu, cesaret mi'),
    text: (c) => c.t(`At a sleepover somebody dares you to text ${nn(c)} "I think about you at night." Everyone is watching the phone. The phone is watching you.`, `Bir pijama partisinde biri sana ${dat(nn(c))} "Geceleri seni düşünüyorum" yazman için meydan okuyor. Herkes telefona bakıyor. Telefon sana bakıyor.`),
    choices: [
      ch('send', 'Send it', 'Gönder', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 50)) return out(c, { hap: 6 }, `Three dots appeared. Then: "same". The room screamed so loudly a parent knocked on the wall.`, 'Üç nokta çıktı. Sonra: "ben de". Odadaki çığlık o kadar yüksekti ki bir ebeveyn duvara vurdu.');
        return out(c, { hap: -5 }, `"Who is this?" You had not been saved in the contacts. The group chat has been framing the reply ever since.`, '"Kimsin?" diye geldi. Rehberde kayıtlı bile değildin. Grup sohbeti cevabı o gün bugündür çerçeveliyor.');
      }, { badge: 'Risky' }),
      ch('soft', 'Send "hey, how was your day?" instead', '\"Selam, günün nasıldı?\" yaz', (c) => out(c, { hap: 2 }, 'The room booed. But ' + nn(c) + ' replied with a long, nice paragraph, and the booing turned into respect.', 'Oda yuhaladı. Ama ' + nn(c) + ' uzun ve güzel bir paragrafla cevap verdi; yuhalama saygıya döndü.')),
      ch('truth', 'Pick truth and name the wrong person', 'Doğruluğu seç ve yanlış kişiyi söyle', (c) => out(c, { hap: -1 }, 'You named someone you barely know. Now the whole grade thinks you are in love with them, and they are not displeased.', 'Pek tanımadığın birinin adını söyledin. Şimdi bütün sınıf ona âşık olduğunu sanıyor; o da pek rahatsız değil.')),
      ch('pass', 'Go to the kitchen and eat cereal', 'Mutfağa git ve gevrek ye', (c) => out(c, { hap: 1 }, 'Cowards eat well. You also heard from the kitchen that the next dare was worse.', 'Korkaklar iyi yer. Mutfaktan bir sonraki cesaretin daha kötü olduğunu da duydun.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_friend_same_crush',
    minAge: 14,
    maxAge: 19,
    weight: 70,
    cooldown: 5,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => hasFriend(c),
    setup: (c) => {
      c.vars.fr = c.rng.pick(friendsOf(c)).person.id;
      newDate(c, 13, 20, 'pid');
    },
    title: (c) => c.t('You and your friend like the same person', 'Arkadaşınla aynı kişiden hoşlanıyorsunuz'),
    text: (c) =>
      c.t(
        `${nn(c, 'fr')} spent the whole walk home talking about ${nn(c)}. You had been about to say the same thing about the same person. Instead you said "mm" for ten minutes.`,
        `${nn(c, 'fr')} eve dönerken boyunca ${abl(nn(c))} bahsetti. Sen de aynı kişi hakkında aynı şeyi söyleyecektin. Onun yerine on dakika boyunca "hmm" dedin.`,
      ),
    choices: [
      ch('step', 'Step aside and say nothing', 'Kenara çekil ve hiçbir şey söyleme', (c) => {
        near(c, 'fr', 8);
        return out(c, { hap: -2 }, `${nn(c, 'fr')} asked ${nn(c)} out the next week. You were a very good listener about it, and a very quiet one.`, `${nn(c, 'fr')} ertesi hafta ${dat(nn(c))} çıkma teklif etti. Çok iyi bir dinleyici oldun, çok da sessiz.`);
      }),
      ch('tell', 'Tell the truth and let the best one win', 'Gerçeği söyle ve en iyisi kazansın', (c) => {
        near(c, 'fr', 6);
        return out(c, { hap: 2 }, `You both laughed until you cried, shook on it and agreed ${nn(c)} could choose nobody. ${HeK(c, 'pid')} chose a third person within the month.`, `İkiniz de gözyaşları içinde gülene kadar güldünüz, el sıkıştınız ve ${nn(c)} kimseyi seçmeyebilir diye anlaştınız. ${nn(c)} bir ay içinde üçüncü bir kişiyi seçti.`);
      }, { tone: 'good' }),
      ch('race', 'Ask first', 'İlk sen sor', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 55)) {
          near(c, 'fr', -18);
          return out(c, { hap: 3 }, `${nn(c)} said yes. ${nn(c, 'fr')} stopped sitting next to you for a while, and looks at the table when you talk.`, `${nn(c)} evet dedi. ${nn(c, 'fr')} bir süre yanında oturmadı, sen konuşurken masaya bakıyor.`);
        }
        near(c, 'fr', -15);
        return out(c, { hap: -6 }, `You were turned down and you lost a friend for the month. It was a thorough, efficient failure.`, 'Reddedildin ve bir ay boyunca bir arkadaşını kaybettin. Kapsamlı ve verimli bir başarısızlıktı.');
      }, { badge: 'Risky', tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_parent_caught',
    minAge: 14,
    maxAge: 17,
    weight: 55,
    cooldown: 4,
    maxPerLife: 1,
    needs: ['parent'],
    setup: (c) => {
      pickParent(c);
      newDate(c, 13, 19);
    },
    title: (c) => c.t('Caught texting', 'Mesajlaşırken yakalandın'),
    text: (c) =>
      c.t(
        `${Kw(c, 'par')} walks in without knocking, sees your phone light up with a heart from ${nn(c)}, and says nothing for a very long, loud moment.`,
        `${Kw(c, 'par')} kapıyı çalmadan giriyor, telefon ekranında ${abl(nn(c))} gelen bir kalbi görüyor ve çok uzun, gürültülü bir an boyunca hiçbir şey söylemiyor.`,
      ),
    choices: [
      ch('own', 'Own up, calmly', 'Sakin sakin kabul et', (c) => {
        near(c, 'par', 6);
        return out(c, { hap: 2 }, `You told them everything, in a regular voice. They asked three polite questions and made sure you knew about the curfew. It could have been worse by a mile.`, 'Her şeyi normal bir sesle anlattın. Üç kibar soru sordular ve sokağa çıkma saatini hatırlattılar. Çok daha kötü olabilirdi.');
      }, { tone: 'good' }),
      ch('lie', 'Say it is a group chat', 'Grup sohbeti de', (c) => {
        near(c, 'par', -4);
        return out(c, { hap: -2 }, `${nn(c)} sent a second heart while they were still reading. The group chat has exactly two members.`, `Onlar hâlâ okurken ${nn(c)} ikinci bir kalp gönderdi. Grup sohbetinde tam iki kişi var.`);
      }, { tone: 'bad' }),
      ch('turn', 'Ask why they never knock', 'Neden hiç kapı çalmadığını sor', (c) => {
        near(c, 'par', -3);
        return out(c, { hap: 1 }, 'You went on offence. They went to the kitchen to think. Two days later there is a small lock on your door that you did not ask for, and a knock before every entry.', 'Saldırıya geçtin. Onlar düşünmek için mutfağa gitti. İki gün sonra kapında istemediğin küçük bir kilit ve her girişte bir tıklama var.');
      }),
    ],
  },
  {
    ...B,
    id: 'base.lv_first_breakup',
    minAge: 14,
    maxAge: 20,
    weight: 200,
    cooldown: 5,
    maxPerLife: 1,
    needs: ['partnered'],
    when: (c) => dating(c),
    setup: setDating,
    title: (c) => c.t(`${nn(c)} ends it by text`, `${nn(c)} ayrılığı mesajla bildiriyor`),
    text: (c) =>
      c.t(
        `"I think we should be friends." You read it in line at the shop, with someone's elbow in your ribs. ${nn(c)} used a full stop. Not a good sign.`,
        `"Bence arkadaş kalalım." Marketin kuyruğunda, biri dirseğini kaburgana vururken okudun. ${nn(c)} sonuna nokta koymuş. İyi işaret değil.`,
      ),
    choices: [
      ch('playlist', 'Make a very sad playlist', 'Çok hüzünlü bir çalma listesi yap', (c) => out(c, { hap: -3 }, 'It has 94 songs. You only needed four. Your parents now know a lot about your inner life through the wall.', 'Listede 94 şarkı var. Dört yeterdi. Ailen duvardan iç dünyan hakkında artık çok şey biliyor.')),
      ch('friends', 'Let your friends carry you through it', 'Arkadaşların seni taşısın', (c) => {
        c.h.relatives('friend').forEach((r) => c.h.closeness(r.person.id, 3));
        return out(c, { hap: 1 }, 'Pizza, a documentary about penguins and a ban on saying the name. By Sunday you could say it with only a little flinch.', 'Pizza, penguenler hakkında bir belgesel ve ismi anmama yasağı. Pazara kadar adı sadece biraz ürpererek söyleyebiliyordun.');
      }, { tone: 'good' }),
      ch('reply', 'Reply with a long, honest paragraph', 'Uzun, dürüst bir paragrafla cevap ver', (c) => {
        if (c.rng.chance(0.25)) {
          return out(c, { hap: -2 }, `${nn(c)} replied "ok" after four hours. You counted the hours.`, `${nn(c)} dört saat sonra "tamam" yazdı. Saatleri saydın.`);
        }
        return out(c, { hap: -2 }, 'You hit send, felt briefly strong, then felt briefly sick. A day later you felt a little lighter.', 'Gönder tuşuna basınca bir an güçlü, ardından bir an hasta hissettin. Bir gün sonra biraz hafifledin.');
      }),
    ].map((x) => ({
      ...x,
      resolve: (c: Ctx) => {
        c.h.setKind(pid(c), 'ex');
        return x.resolve(c);
      },
    })),
  },
  {
    ...B,
    id: 'base.lv_party_ask',
    minAge: 14,
    maxAge: 18,
    weight: 55,
    cooldown: 3,
    maxPerLife: 2,
    needs: ['student', 'single'],
    setup: (c) => newDate(c, 13, 19),
    title: (c) => c.t('The end-of-year party', 'Yıl sonu partisi'),
    text: (c) => c.t(`The whole school is going to the end-of-year party. You would very much like to go with ${nn(c)}, and you would very much like to be good at asking.`, `Bütün okul yıl sonu partisine gidiyor. ${wth(nn(c))} gitmeyi çok isterdin; bir de bunu sormakta iyi olmayı.`),
    choices: [
      ch('big', 'Make a big gesture', 'Büyük bir jest yap', (c) => {
        spend(c, 15);
        if (lucky(c, 0.4) && startDating(c, 'pid', 55)) return out(c, { hap: 6 }, `Balloons, a sign and a friend filming. ${nn(c)} said yes with both hands over the face. The video has more views than your last project.`, `Balonlar, bir pankart ve çekim yapan bir arkadaş. ${nn(c)} yüzünü iki eliyle kapayarak evet dedi. Video son projenden daha çok izlendi.`);
        return out(c, { hap: -6 }, `${nn(c)} said "I'm so sorry" very kindly, in front of two hundred people and a balloon shaped like a heart.`, `${nn(c)} iki yüz kişinin ve kalp şeklinde bir balonun önünde çok kibarca "çok üzgünüm" dedi.`);
      }, { badge: 'Risky', requires: can(15), requiresLabel: 'Not enough money' }),
      ch('quiet', 'Ask quietly after class', 'Ders çıkışında sessizce sor', (c) => {
        if (lucky(c, 0.5) && startDating(c, 'pid', 50)) return out(c, { hap: 5 }, `${nn(c)} smiled and said "I was hoping you would." You walked home three centimetres above the pavement.`, `${nn(c)} gülümseyip "bekliyordum" dedi. Eve kaldırımdan üç santim yukarıda yürüdün.`);
        return out(c, { hap: -3 }, `${nn(c)} was already going with someone else, kindly said so and wished you a good night. A good night followed, in your room.`, `${nn(c)} zaten başkasıyla gidiyormuş, kibarca söyledi ve iyi geceler diledi. İyi bir gece geldi, odanda.`);
      }),
      ch('group', 'Go with the whole group instead', 'Bütün grupla git', (c) => out(c, { hap: 3 }, 'Safety in numbers: eleven friends, one very bad playlist, a lot of laughing. You danced like a person who had not been rejected.', 'Sayı güvenliği: on bir arkadaş, çok kötü bir çalma listesi, bolca kahkaha. Reddedilmemiş biri gibi dans ettin.')),
      ch('skip', 'Stay home', 'Evde kal', (c) => out(c, { hap: -2 }, 'You watched the party on other people\'s stories until midnight. It looked smaller than it felt.', 'Partiyi gece yarısına kadar başkalarının hikâyelerinden izledin. Hissettiğinden daha küçük görünüyordu.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_rumor',
    minAge: 14,
    maxAge: 18,
    weight: 45,
    cooldown: 4,
    maxPerLife: 1,
    needs: ['student'],
    setup: (c) => newDate(c, 13, 19),
    title: (c) => c.t('A rumor about you and ' + nn(c), nn(c) + ' ile ilgili bir söylenti'),
    text: (c) =>
      c.t(
        `Everyone says you and ${nn(c)} are "talking". You have exchanged exactly nine words, six of them about homework.`,
        `Herkes seninle ${nn(c)} arasında "bir şeyler olduğunu" söylüyor. Aranızda tam dokuz kelime geçti, altısı ödevle ilgili.`,
      ),
    choices: [
      ch('deny', 'Deny it loudly', 'Yüksek sesle yalanla', (c) => out(c, { hap: -2 }, `You denied it so hard that people trust it more. ${nn(c)} heard about your denial, which was the worst part.`, `O kadar sert yalanladın ki insanlar daha çok inandı. ${nn(c)} yalanlamandan haberdar oldu; en kötüsü buydu.`)),
      ch('laugh', 'Laugh and let it float', 'Gül geç, bırak dolaşsın', (c) => out(c, { hap: 2 }, 'A rumor you do not fight gets bored in a week. By Friday it was about someone else entirely.', 'Savaşmadığın söylenti bir haftada sıkılır. Cuma günü tamamen başka biri hakkındaydı.'), { tone: 'good' }),
      ch('lean', 'Go and talk to them for real', 'Gidip gerçekten konuş', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 50)) return out(c, { hap: 5 }, `"So, apparently we are talking," you said. ${nn(c)} grinned. "Apparently." The rumor was a few weeks early and proud of itself.`, `"Görünüşe göre konuşuyormuşuz," dedin. ${nn(c)} sırıttı. "Görünüşe göre." Söylenti birkaç hafta erken geldi ve kendisiyle gurur duyuyor.`);
        return out(c, { hap: -3 }, `You were brave for a whole minute. ${nn(c)} said "I like someone else," and then the corridor smelled of floor cleaner.`, `Tam bir dakika cesur oldun. ${nn(c)} "başkasından hoşlanıyorum" dedi ve koridor yer temizleyicisi gibi koktu.`);
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_old_photo_like',
    minAge: 14,
    maxAge: 29,
    weight: 45,
    cooldown: 5,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 13, 32),
    title: (c) => c.t('Your thumb did something', 'Parmağın bir şey yaptı'),
    text: (c) =>
      c.t(
        `It is 1 a.m. and you are scrolling through ${nn(c)}'s profile, far, far back. A little too far. The heart under a photo from three years ago is now red. It is yours.`,
        `Saat gece bir ve ${gen(nn(c))} profilinde çok, çok eskilere iniyorsun. Biraz fazla eskiye. Üç yıl önceki bir fotoğrafın altındaki kalp kırmızıya döndü. Senin.`,
      ),
    choices: [
      ch('unlike', 'Unlike it fast', 'Hemen beğeniyi geri al', (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: -3 }, `Too late: the notification had already arrived. ${nn(c)} now knows you looked, and knows you panicked.`, `Çok geç: bildirim çoktan gitmişti. ${nn(c)} baktığını da, panik yaptığını da biliyor.`);
        return out(c, { hap: 1 }, 'Gone in two seconds. You lay in the dark for an hour, sure you had got away with something.', 'İki saniyede gitti. Karanlıkta bir saat yattın, bir şeyi atlattığından emindin.');
      }),
      ch('comment', 'Comment "great hat"', '"Harika şapka" yorumu yaz', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 50)) return out(c, { hap: 5 }, `${nn(c)} replied "I miss that hat" and then, at 2 a.m., "want to get a coffee?" The hat was bought again.`, `${nn(c)} "O şapkayı özledim" diye cevap verdi, gece ikide de "kahve içelim mi?" diye yazdı. Şapka yeniden alındı.`);
        return out(c, { hap: -1 }, 'Heart, no reply. The hat was a good hat, though.', 'Kalp geldi, cevap gelmedi. Yine de şapka güzel bir şapkaydı.');
      }, { badge: 'Risky' }),
      ch('phone', 'Throw the phone into a pillow', 'Telefonu yastığa fırlat', (c) => out(c, { hap: 0 }, 'The phone survived. You did not, emotionally, until breakfast.', 'Telefon sağ kaldı. Sen, duygusal olarak, kahvaltıya kadar kalmadın.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_confession_rejected',
    minAge: 15,
    maxAge: 32,
    weight: 45,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 14, 35),
    title: (c) => c.t('You tell ' + nn(c) + ' how you feel', dat(nn(c)) + ' ne hissettiğini söylüyorsun'),
    text: (c) => c.t(`You practised the speech in the shower, in the bus and in your head. It was two sentences long. ${nn(c)} listens to all of it, then looks at the ground.`, `Konuşmayı duşta, otobüste ve kafanda çalıştın. İki cümleydi. ${nn(c)} hepsini dinliyor, sonra yere bakıyor.`),
    choices: [
      ch('grace', 'Take it with grace', 'Zarafetle karşıla', (c) => out(c, { hap: -3, sma: 1 }, `"I'm not there, but I'm glad you said it," said ${nn(c)}. It hurt in a clean sort of way. You were braver than you felt.`, `${nn(c)} "Ben aynı yerde değilim ama söylemene sevindim" dedi. Temiz bir şekilde acıttı. Hissettiğinden daha cesurdun.`), { tone: 'good' }),
      ch('joke', 'Say it was a bit', '"Şaka yapıyordum" de', (c) => out(c, { hap: -4 }, 'Nobody laughed, least of all you. The bit lives on in people\'s memories as "that thing".', 'Kimse gülmedi, en az da sen. Şaka insanların hafızasında "o olay" olarak yaşıyor.')),
      ch('push', 'Ask if they are sure', '"Emin misin?" diye sor', (c) => {
        if (c.rng.chance(0.15) && startDating(c, 'pid', 40)) return out(c, { hap: 4 }, `A long pause. "Actually... ask me again on Saturday." It was the longest week of the year.`, 'Uzun bir sessizlik. "Aslında... cumartesi bir daha sor." Yılın en uzun haftasıydı.');
        return out(c, { hap: -6 }, `${nn(c)} was sure. It is a sentence that cannot be un-asked.`, `${nn(c)} emindi. Geri alınamayan bir soruydu.`);
      }, { badge: 'Risky' }),
    ],
  },
];

// ------------------------------------------------------------------ single life, apps and dates

const singles: EventDef[] = [
  {
    ...B,
    id: 'base.lv_app_photo',
    minAge: 18,
    maxAge: 45,
    weight: 55,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    title: (c) => c.t('Choosing a profile photo', 'Profil fotoğrafı seçmek'),
    text: (c) => c.t('You have 400 photos on your phone and exactly four in which you look like a person who owns a calendar. Your friends have given you five contradicting opinions.', 'Telefonunda 400 fotoğraf var ve yalnızca dördünde takvimi olan biri gibi görünüyorsun. Arkadaşların sana birbirine zıt beş görüş verdi.'),
    choices: [
      ch('real', 'The honest one, with the dog hair', 'Dürüst olan, köpek tüylü', (c) => {
        const n = c.rng.int(2, 6);
        return out(c, { hap: 2 }, `${n} matches in a week, all of them people who do not mind dog hair. That is a better filter than anything the app sells.`, `Bir haftada ${n} eşleşme geldi; hepsi köpek tüyüne aldırmayan insanlar. Uygulamanın sattığı her şeyden iyi bir filtre.`);
      }, { tone: 'good' }),
      ch('filter', 'The heavily filtered one', 'Fazlasıyla filtrelenmiş olan', (c) => {
        const n = c.rng.int(6, 15);
        return out(c, { hap: -1 }, `${n} matches, and every one of them will meet a slightly different person. You can see the dates coming from far away.`, `${n} eşleşme geldi ve hepsi gerçek sen yerine biraz farklı biriyle tanışacak. Randevular uzaktan görünüyor.`);
      }),
      ch('fish', 'The one holding a big fish', 'Elinde koca bir balıkla çekildiğin', (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: 3 }, 'Wildly successful with exactly one person, who has asked three times about the fish. You are now in love with a stranger and a fish.', 'Tam bir kişiyle çılgın bir başarı elde ettin; o da balığı üç kez sordu. Şimdi hem bir yabancıya hem de bir balığa âşıksın.');
        return out(c, { hap: -1 }, 'Zero matches and four messages that only ask about the fish. It was a very fine fish.', 'Sıfır eşleşme ve yalnızca balığı soran dört mesaj. Çok güzel bir balıktı.');
      }),
      ch('skip', 'Delete the app', 'Uygulamayı sil', (c) => out(c, { hap: 1 }, 'You chose the real world and a very flat Saturday. The air is surprisingly clean.', 'Gerçek dünyayı ve bomboş bir cumartesiyi seçtin. Hava şaşırtıcı derecede temiz.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_catfish',
    minAge: 18,
    maxAge: 50,
    weight: 45,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 18, 55),
    title: (c) => c.t(`${nn(c)} looks different in person`, `${nn(c)} gerçekte farklı görünüyor`),
    text: (c) => c.t(`The profile said 28, tall and "adventurous". The person at the table is 40-ish, medium and mostly adventurous about ordering dessert. ${HeK(c, 'pid')} waves with total confidence.`, `Profilde 28, uzun boylu ve "maceracı" yazıyordu. Masadaki kişi 40 civarı, orta boylu ve ancak tatlı sipariş ederken maceracı. ${nn(c)} büyük bir özgüvenle el sallıyor.`),
    choices: [
      ch('stay', 'Stay for the meal anyway', 'Yine de yemeğe kal', (c) => {
        spend(c, 30);
        if (c.rng.chance(0.3) && startDating(c, 'pid', 50)) return out(c, { hap: 4 }, `It turned out ${nn(c)} was funny. Truly funny. You are annoyed at how much you like each other.`, `${nn(c)} komikmiş. Gerçekten komik. Birbirinizi bu kadar sevmenize sinirleniyorsun.`);
        return out(c, { hap: -1 }, 'Dinner was nice. The company was a lie, but the pasta was real.', 'Yemek güzeldi. Eşlik yalandı ama makarna gerçekti.');
      }),
      ch('leave', 'Say you feel ill and leave', 'Kendini kötü hissettiğini söyle ve git', (c) => out(c, { hap: -1 }, 'Your acting deserved an award; your honesty did not. You spent the evening at home with soup, guilty and fed.', 'Oyunculuğun ödülü hak ediyordu; dürüstlüğün etmiyordu. Akşamı evde çorbayla, suçlu ve tok geçirdin.')),
      ch('say', 'Say it kindly', 'Nazikçe söyle', (c) => out(c, { hap: 2 }, `"The photos were old, weren't they?" ${nn(c)} sighed, then laughed. You split the bill and parted as the only two honest people on the app.`, `"Fotoğraflar eskiydi, değil mi?" ${nn(c)} iç çekti, sonra güldü. Hesabı bölüştünüz ve uygulamadaki tek iki dürüst insan olarak ayrıldınız.`), { tone: 'good' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_wrong_chat',
    minAge: 16,
    maxAge: 60,
    weight: 45,
    cooldown: 5,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 16, 60),
    title: (c) => c.t('The voice note went to the wrong chat', 'Sesli mesaj yanlış sohbete gitti'),
    text: (c) => c.t(`You sent a four-minute voice note about how much you like ${nn(c)}. It was meant for your best friend. It went to ${nn(c)}. It is already marked as heard.`, `${abl(nn(c))} ne kadar hoşlandığını anlatan dört dakikalık bir sesli mesaj attın. En yakın arkadaşına gidecekti. ${dat(nn(c))} gitti. Dinlendi bile.`),
    choices: [
      ch('own', 'Own it: "yes, all true"', '"Evet, hepsi doğru" diye sahip çık', (c) => {
        if (lucky(c, 0.5) && startDating(c, 'pid', 55)) return out(c, { hap: 6 }, `A pause, a typing bubble, then "I had no idea. Dinner on Friday?" Never underestimate a thumb.`, 'Bir sessizlik, yazıyor baloncuğu, sonra "hiç bilmiyordum. Cuma akşam yemeği?" Başparmağın gücünü asla hafife alma.');
        return out(c, { hap: -4 }, `${nn(c)} replied with a single polite heart. A single polite heart is the weather of rejection.`, `${nn(c)} tek bir kibar kalple cevap verdi. Tek bir kibar kalp, reddedilmenin hava durumudur.`);
      }, { badge: 'Risky' }),
      ch('delete', 'Delete it for everyone', 'Herkes için sil', (c) => out(c, { hap: -2 }, '"This message was deleted" is the most interesting sentence on the internet. Nothing happened. Everything is fine. Everyone is fine.', '"Bu mesaj silindi" internetteki en ilginç cümle. Hiçbir şey olmadı. Her şey yolunda. Herkes yolunda.')),
      ch('joke', 'Claim it was a script for a play', '"Bir oyunun senaryosuydu" de', (c) => out(c, { hap: 1 }, `Now you are auditioning for a play that does not exist. ${nn(c)} offered to read the other part.`, `Artık var olmayan bir oyun için seçmelere giriyorsun. ${nn(c)} diğer rolü okumayı teklif etti.`)),
    ],
  },
  {
    ...B,
    id: 'base.lv_blind_date',
    minAge: 20,
    maxAge: 55,
    weight: 60,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['single'],
    when: (c) => hasFriend(c),
    setup: (c) => {
      c.vars.fr = c.rng.pick(friendsOf(c)).person.id;
      newDate(c, 20, 55);
    },
    title: (c) => c.t('A blind date', 'Kör randevu'),
    text: (c) => c.t(`${nn(c, 'fr')} has "someone perfect" for you. Their only description is "so nice". ${nn(c, 'fr')} also says ${nn(c)} loves everything you love. You love nothing in particular.`, `${nn(c, 'fr')} sana "mükemmel biri" ayarlamış. Tek tarifi "çok iyi biri". Ayrıca ${nn(c)} senin sevdiğin her şeyi seviyormuş. Sen özel olarak hiçbir şeyi sevmiyorsun.`),
    choices: [
      ch('go', 'Go, with an open mind', 'Açık fikirle git', (c) => {
        spend(c, 25);
        if (lucky(c, 0.42) && startDating(c, 'pid', 55)) {
          near(c, 'fr', 4);
          return out(c, { hap: 5 }, `${nn(c)} was nice, and funny, and for once ${nn(c, 'fr')} was right. You will not hear the end of this from ${nn(c, 'fr')}.`, `${nn(c)} iyi biriydi, komikti ve bir kez olsun ${nn(c, 'fr')} haklıydı. Bunun sonu gelmeyecek.`);
        }
        return out(c, { hap: -1 }, `${nn(c)} was nice, in the same way as a wall. You said you would be in touch, and both of you knew the touch was not coming.`, `${nn(c)} iyi biriydi, bir duvarın iyi olduğu gibi. Haberleşiriz dediniz ve ikiniz de haberleşmeyeceğinizi biliyordunuz.`);
      }, { requires: can(25), requiresLabel: 'Not enough money' }),
      ch('decline', 'Politely decline', 'Kibarca reddet', (c) => {
        near(c, 'fr', -3);
        return out(c, { hap: 0 }, `${nn(c, 'fr')} said "fine", the way people say it when the answer is not fine.`, `${nn(c, 'fr')} "tamam" dedi, tamam olmadığı zamanlarda söylendiği gibi.`);
      }),
      ch('double', 'Insist on a double date', 'Çifte randevuda ısrar et', (c) => out(c, { hap: 2 }, `Four of you, one table, many awkward silences filled by ${nn(c, 'fr')}. It felt safe. It also felt like a school trip.`, `Dört kişi, tek masa ve ${nn(c, 'fr')} tarafından doldurulan çok sayıda garip sessizlik. Güvenli hissettirdi. Okul gezisi gibi de hissettirdi.`)),
    ],
  },
  {
    ...B,
    id: 'base.lv_bar_drink',
    minAge: 21,
    maxAge: 55,
    weight: 55,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 21, 55),
    title: (c) => c.t('A drink from across the room', 'Karşı masadan gelen içecek'),
    text: (c) => c.t(`The waiter puts a drink in front of you. "From the one by the window." ${nn(c)} lifts a glass and does an impressive amount of eyebrow.`, `Garson önüne bir içecek koyuyor. "Pencere kenarındaki kişiden." ${nn(c)} kadehini kaldırıp etkileyici bir kaş hareketi yapıyor.`),
    choices: [
      ch('join', 'Go over and sit down', 'Yanına git ve otur', (c) => {
        spend(c, 20);
        if (lucky(c, 0.45) && startDating(c, 'pid', 55)) return out(c, { hap: 5 }, `Two hours became closing time. You left together and no one was dangerous. Your friends demanded a full report.`, `İki saat kapanış saati oldu. Birlikte ayrıldınız ve kimse tehlikeli değildi. Arkadaşların tam bir rapor istedi.`);
        return out(c, { hap: 1 }, `${nn(c)} spent the evening talking about a boat. You learned a lot about boats and nothing about love.`, `${nn(c)} akşamı bir tekneden bahsederek geçirdi. Tekneler hakkında çok şey, aşk hakkında hiçbir şey öğrendin.`);
      }, { requires: can(20), requiresLabel: 'Not enough money' }),
      ch('wave', 'Raise your glass and stay put', 'Kadehini kaldır ama yerinde kal', (c) => out(c, { hap: 2 }, 'You have discovered the oldest, safest form of flirting. Nobody got hurt, and you got a free drink.', 'Flörtün en eski, en güvenli biçimini keşfettin. Kimse zarar görmedi, bedava içecek de kazandın.'), { tone: 'good' }),
      ch('send', 'Send the drink back', 'İçeceği geri gönder', (c) => out(c, { hap: -2 }, 'The waiter delivered your "no thank you" very gravely. Everyone in the room got to hear it. The drink was the best part of your evening.', 'Garson senin "hayır, teşekkürler"ini çok ciddi bir şekilde iletti. Salondaki herkes duydu. İçecek akşamın en güzel yanıydı.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_ghosted',
    minAge: 18,
    maxAge: 50,
    weight: 55,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 18, 50),
    title: (c) => c.t(`${nn(c)} stopped replying`, `${nn(c)} cevap vermeyi bıraktı`),
    text: (c) => c.t(`Three great dates, a long, warm text on Sunday, and then silence. Eleven days of it. You know ${nn(c)} has been online. You know how many times, because you checked.`, `Üç harika randevu, pazar günü uzun ve sıcak bir mesaj ve sonra sessizlik. On bir gün boyunca. ${nn(c)} çevrimiçi olmuş, biliyorsun. Kaç kez olduğunu da biliyorsun, çünkü baktın.`),
    choices: [
      ch('text', 'Send one last, calm message', 'Son bir sakin mesaj gönder', (c) => {
        if (c.rng.chance(0.25) && startDating(c, 'pid', 40)) return out(c, { hap: 3 }, `${nn(c)} answered in four minutes, "so sorry, my phone broke, my life broke, can I explain?" It was a real explanation. It was a bad week.`, `${nn(c)} dört dakikada cevap verdi: "çok özür dilerim, telefonum bozuldu, hayatım bozuldu, açıklayabilir miyim?" Gerçek bir açıklamaydı. Kötü bir haftaydı.`);
        return out(c, { hap: 1 }, 'No answer, but you said the thing calmly and kept your dignity. It sits in your chest like a heavy coat that is finally yours.', 'Cevap gelmedi ama bunu sakin söyledin ve onurunu korudun. Göğsünde, artık sana ait olan ağır bir palto gibi duruyor.');
      }),
      ch('block', 'Block and move on', 'Engelle ve devam et', (c) => out(c, { hap: 1, sma: 1 }, 'It felt like closing a window in a cold room. Immediately warmer, and the street is quieter.', 'Soğuk bir odada pencereyi kapatmak gibiydi. Hemen ısındı, sokak da sessizleşti.'), { tone: 'good' }),
      ch('stalk', 'Keep checking their profile', 'Profiline bakmaya devam et', (c) => out(c, { hap: -4 }, 'You now know their cousin\'s dog\'s name. You have learned nothing about yourself. Your thumb is tired.', 'Artık kuzenlerinin köpeğinin adını biliyorsun. Kendin hakkında hiçbir şey öğrenmedin. Başparmağın yoruldu.'), { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_red_flag_date',
    minAge: 20,
    maxAge: 55,
    weight: 45,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 20, 55),
    title: (c) => c.t('A date with a little red flag', 'Küçük bir kırmızı bayrağı olan randevu'),
    text: (c) => c.t(`${nn(c)} is charming, until the waiter brings the wrong order and ${nn(c)} turns into a different weather. Then back to charming. Then ${heK(c, 'pid')} mentions the ex for the fourth time.`, `${nn(c)} büyüleyici, ta ki garson yanlış siparişi getirene dek; sonra hava değişiyor. Sonra yine büyüleyici. Sonra eski sevgilisini dördüncü kez anıyor.`),
    choices: [
      ch('end', 'End it nicely and pay for your half', 'Güzelce bitir ve payını öde', (c) => { spend(c, 15); return out(c, { hap: 1, sma: 1 }, 'You said "I had a good evening, but I think we want different things." It was the whole truth in eleven words.', '"Güzel bir akşamdı ama sanırım farklı şeyler istiyoruz" dedin. Gerçeğin tamamı on bir kelimeydi.'); }, { tone: 'good' }),
      ch('stay', 'Give it another chance', 'Bir şans daha ver', (c) => {
        if (c.rng.chance(0.3) && startDating(c, 'pid', 45)) return out(c, { hap: -1 }, `The second dinner was lovely, and so was the third. Your friends have started a spreadsheet of the flags and will not stop until it becomes a pie chart.`, `İkinci yemek güzeldi, üçüncüsü de. Arkadaşların bayraklarla ilgili bir tablo açtı ve pasta grafiğine dönüşene kadar bırakmayacak.`);
        return out(c, { hap: -3 }, 'The second dinner had the same weather, and the ex was joined by a cousin. You paid for the whole bill out of sheer fatigue.', 'İkinci yemekte hava aynıydı ve eski sevgiliye bir kuzen daha eklendi. Hesabın hepsini bitkinlikten ödedin.');
      }, { tone: 'bad' }),
      ch('leave', 'Leave during the dessert', 'Tatlı sırasında kalk git', (c) => out(c, { hap: 0 }, 'You said you had to take an urgent call from "the vet". You do not have a pet. You do now have a small guilty relationship with the vet.', '"Veterinerden" acil bir telefon geldi dedin. Evcil hayvanın yok. Artık veterinerle küçük, suçlu bir ilişkin var.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_friend_to_love',
    minAge: 18,
    maxAge: 60,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    when: (c) => hasAdultFriend(c),
    setup: (c) => {
      c.vars.fr = c.rng.pick(adultFriends(c)).person.id;
      c.vars.pid = c.vars.fr;
    },
    title: (c) => c.t(`Something changes with ${nn(c)}`, `${wth(nn(c))} bir şey değişiyor`),
    text: (c) => c.t(`You have known ${nn(c)} for years. Last night, ${heK(c, 'pid')} laughed at your terrible joke and you felt it in your knees. It is a bad time for your knees to have opinions.`, `${nn(c)} ile yıllardır tanışıyorsunuz. Dün gece kötü bir esprine güldü ve bunu dizlerinde hissettin. Dizlerinin fikir sahibi olması için kötü bir zaman.`),
    choices: [
      ch('tell', 'Tell the truth', 'Gerçeği söyle', (c) => {
        const id = pid(c);
        if (c.rng.chance(0.45)) {
          if (c.p.relations.find((r) => r.personId === id)?.kind === 'friend') c.h.setKind(id, 'partner');
          c.h.closeness(id, 12);
          return out(c, { hap: 8 }, `"Oh thank god," said ${nn(c)}. "I have been trying to say it since March." It turned out the awkward part had been done years ago.`, `${nn(c)} "çok şükür" dedi. "Mart'tan beri söylemeye çalışıyorum." Meğer garip kısım yıllar önce bitmiş.`);
        }
        c.h.closeness(id, -10);
        return out(c, { hap: -5 }, `${nn(c)} was kind and clear. It left a small, careful gap between you that did not exist before. It might close.`, `${nn(c)} nazikti ve netti. Aranızda daha önce olmayan küçük, dikkatli bir boşluk bıraktı. Kapanabilir.`);
      }, { badge: 'Risky' }),
      ch('wait', 'Wait and watch for signs', 'Bekle ve işaret ara', (c) => { c.h.closeness(pid(c), 2); return out(c, { hap: -1 }, 'You looked for signs in every word, every pause and a text that said "lol". You are now an expert in the word "lol".', 'Her kelimede, her sessizlikte ve "lol" yazan bir mesajda işaret aradın. Artık "lol" kelimesinde uzmansın.'); }),
      ch('hide', 'Keep it a secret and stay friends', 'Sır olarak sakla ve arkadaş kal', (c) => { c.h.closeness(pid(c), 3); return out(c, { hap: -2 }, 'A secret with a name that is always in the room. The friendship is real; so is the weather in your chest.', 'Hep odada duran adlı bir sır. Arkadaşlık gerçek; göğsündeki hava durumu da öyle.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_work_crush',
    minAge: 22,
    maxAge: 55,
    weight: 70,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single', 'employed'],
    setup: (c) => newDate(c, 22, 55),
    title: (c) => c.t('A crush at work', 'İş yerinde bir hoşlanma'),
    text: (c) => c.t(`Nobody warned you that ${nn(c)} from down the corridor would start to look like a very good idea. Every meeting is now a meeting about ${nn(c)}.`, `Koridorun sonundaki ${nn(c)} çok iyi bir fikir gibi görünmeye başlayacak, kimse seni uyarmadı. Her toplantı artık ${nn(c)} hakkında bir toplantı.`),
    choices: [
      ch('ask', 'Ask for coffee, in the open', 'Herkesin içinde kahve teklif et', (c) => {
        if (lucky(c, 0.42) && startDating(c, 'pid', 55)) return out(c, { hap: 5 }, `${nn(c)} said "I was wondering when you'd ask." The kitchen coffee has never tasted so serious.`, `${nn(c)} "ne zaman soracaksın diye düşünüyordum" dedi. Ofis kahvesi hiç bu kadar ciddi tatmamıştı.`);
        return out(c, { hap: -3 }, `A polite no. You will see ${nn(c)} at every meeting until one of you retires or moves to another floor.`, `Kibar bir hayır. Biriniz emekli olana ya da başka kata geçene kadar her toplantıda ${acc(nn(c))} göreceksin.`);
      }, { badge: 'Risky' }),
      ch('pro', 'Keep it strictly professional', 'Kesinlikle profesyonel kal', (c) => out(c, { hap: -1, sma: 1 }, 'You sent an email so formal it could have been framed. Nothing happened, and you were extremely good at it.', 'Çerçevelenebilecek kadar resmî bir e-posta gönderdin. Hiçbir şey olmadı ve bunda çok başarılıydın.')),
      ch('drift', 'Take longer walks past the corridor', 'Koridordan geçen daha uzun yürüyüşlere çık', (c) => out(c, { hap: 2 }, 'Six months of tiny, very good nothing. Your step count is the best in the team.', 'Altı ay boyunca küçük, çok güzel hiçlikler. Adım sayın ekibin en iyisi.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_dating_burnout',
    minAge: 24,
    maxAge: 50,
    weight: 60,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    title: (c) => c.t('Tired of dating', 'Randevulardan yoruldun'),
    text: (c) => c.t('Fourteen first dates this year, each with the same three questions and the same three answers. You can no longer tell if you are bored of them or of yourself.', 'Bu yıl on dört ilk randevu, her birinde aynı üç soru ve aynı üç cevap. Artık onlardan mı kendinden mi sıkıldığını ayırt edemiyorsun.'),
    choices: [
      ch('pause', 'Take a break from dating', 'Flörtlere ara ver', (c) => out(c, { hap: 3, hea: 1 }, 'No apps, no dates. You started painting walls, running and seeing friends. You did not find love, but you found a Saturday.', 'Uygulama yok, randevu yok. Duvar boyamaya, koşmaya ve arkadaşlarla görüşmeye başladın. Aşkı bulmadın ama bir cumartesi buldun.'), { tone: 'good' }),
      ch('swipe', 'Swipe harder', 'Daha hızlı kaydır', (c) => out(c, { hap: -3 }, 'You swiped through 900 faces, the sort of exercise that turns a human into a catalogue. You feel nothing, which is itself a feeling.', '900 yüzü kaydırdın; insanı kataloğa çeviren bir egzersiz. Hiçbir şey hissetmiyorsun; bu da bir duygu.')),
      ch('plant', 'Buy a plant and a nice lamp', 'Bir bitki ve güzel bir lamba al', (c) => { spend(c, 40); return out(c, { hap: 3 }, 'You named the plant. The lamp is warm. Your flat is more cheerful, and an unexpected number of people ask if you have "someone".', 'Bitkiye isim verdin. Lamba sıcak. Evin daha neşeli ve beklenmedik sayıda kişi "biri var mı" diye soruyor.'); }, { requires: can(40), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_cooking_class',
    minAge: 22,
    maxAge: 70,
    weight: 45,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 22, 70),
    title: (c) => c.t('A cooking class for one', 'Tek kişilik yemek kursu'),
    text: (c) => c.t(`You signed up for a pasta class to learn something. At the next counter ${nn(c)} is holding a rolling pin like a baby, and asks if you know how much salt is "a pinch".`, `Bir şeyler öğrenmek için makarna kursuna yazıldın. Yan tezgâhta ${nn(c)} oklavayı bebek tutar gibi tutuyor ve "bir tutam" tuzun ne kadar olduğunu bilip bilmediğini soruyor.`),
    choices: [
      ch('help', 'Help with the dough', 'Hamurda yardım et', (c) => {
        spend(c, 60);
        if (lucky(c, 0.45) && startDating(c, 'pid', 55)) return out(c, { hap: 5, sma: 1 }, `Flour on both noses, an enormous bowl of mediocre pasta and a phone number written on the apron. It was the best dish you've ever failed at.`, `İki burnunda da un, kocaman bir kase vasat makarna ve önlüğe yazılmış bir telefon numarası. Hayatında başarısız olduğun en güzel yemekti.`);
        return out(c, { hap: 2, sma: 1 }, 'You learned to make ravioli. Not the person, the pasta. The pasta, in the end, was the better partner.', 'Mantı yapmayı öğrendin. Kişiyle değil, makarnayla. Sonunda makarna daha iyi ortaktı.');
      }, { requires: can(60), requiresLabel: 'Not enough money' }),
      ch('focus', 'Focus on the pasta', 'Makarnaya odaklan', (c) => { spend(c, 60); return out(c, { hap: 2, sma: 1 }, 'Perfect ravioli. You carried them home like newborns. The instructor said you had a gift. Just not for the person next to you.', 'Mükemmel mantılar. Onları yeni doğmuş bebekler gibi eve taşıdın. Eğitmen yeteneğin olduğunu söyledi. Yanındaki kişiye karşı değil, sadece.'); }, { requires: can(60), requiresLabel: 'Not enough money' }),
      ch('skip', 'Leave early, claim a headache', 'Erken ayrıl, baş ağrısı bahanesi bul', (c) => out(c, { hap: -1 }, 'You went home and ate cereal while looking at your own hands. They were not shaking, which was a relief.', 'Eve gidip kendi ellerine bakarak gevrek yedin. Titremiyorlardı, bu bir rahatlıktı.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_wedding_plus_one',
    minAge: 23,
    maxAge: 55,
    weight: 50,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 23, 55),
    title: (c) => c.t('A wedding, no plus-one', 'Düğün, ama eşlik edecek kimse yok'),
    text: (c) => c.t(`A friend's wedding invitation says "and guest". Your seat card has your name and nobody beside it. At table six, ${nn(c)} is also alone and also staring at the salt.`, `Bir arkadaşının düğün davetiyesinde "ve eşlikçi" yazıyor. Yer kartında adın var, yanında kimse yok. Altıncı masada ${nn(c)} da yalnız ve o da tuza bakıyor.`),
    choices: [
      ch('hello', 'Say hello over the salt', 'Tuz üzerinden merhaba de', (c) => {
        if (lucky(c, 0.45) && startDating(c, 'pid', 55)) return out(c, { hap: 5 }, `You danced one slow song and three bad ones. By the cake ${nn(c)} had your number and your whole life story. The bride says she planned it. She did not.`, `Yavaş bir şarkı ve üç kötü şarkıyla dans ettiniz. Pastaya kadar ${nn(c)} numaranı ve tüm hayat hikâyeni almıştı. Gelin bunu planladığını söylüyor. Planlamadı.`);
        return out(c, { hap: 1 }, `${nn(c)} was warm and left at nine to catch a train. You danced with a cousin and an uncle who said you looked "too thin".`, `${nn(c)} sıcakkanlıydı ve dokuzda tren yetiştirmek için ayrıldı. Bir kuzenle ve "çok zayıfsın" diyen bir amcayla dans ettin.`);
      }),
      ch('dance', 'Dance with everybody', 'Herkesle dans et', (c) => out(c, { hap: 3 }, 'Wedding dancing is a public service. You danced with the bride, the groom, two children and a very serious grandmother who led.', 'Düğün dansı bir kamu hizmetidir. Gelinle, damatla, iki çocukla ve yöneten çok ciddi bir büyükannenin elinden dans ettin.'), { tone: 'good' }),
      ch('leave', 'Leave after the cake', 'Pastadan sonra ayrıl', (c) => out(c, { hap: -2 }, 'You went home in a nice outfit to a dark flat. The cake was excellent, and you ate a second slice in the kitchen, standing up.', 'Güzel kıyafetinle karanlık bir eve gittin. Pasta mükemmeldi, ikinci dilimi mutfakta ayakta yedin.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_valentine_solo',
    minAge: 17,
    maxAge: 80,
    weight: 50,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    title: (c) => c.t('Valentine\'s Day, party of one', 'Sevgililer Günü, tek kişilik'),
    text: (c) => c.t('Every window is a heart. Every ad is a couple. A shop assistant asks "something for your special someone?" and you say "the cat". It is not a cat. It is a mood.', 'Her vitrin kalp. Her reklam bir çift. Bir tezgâhtar "özel biri için bir şey mi?" diye soruyor, sen de "kedi için" diyorsun. Kedi yok. Bir ruh hali var.'),
    choices: [
      ch('friends', 'Organise a friends\' dinner', 'Arkadaşlarla yemek ayarla', (c) => { spend(c, 30); c.h.relatives('friend').forEach((r) => c.h.closeness(r.person.id, 3)); return out(c, { hap: 4 }, 'Five singles, one long table, a heart-shaped pizza and a bet about who will find love first. The winner is already rich in pizza.', 'Beş bekâr, uzun bir masa, kalp şeklinde bir pizza ve aşkı kimin önce bulacağına dair bir bahis. Kazanan şimdiden pizzaca zengin.'); }, { tone: 'good', requires: can(30), requiresLabel: 'Not enough money' }),
      ch('treat', 'Treat yourself', 'Kendine bir şeyler al', (c) => { spend(c, 50); return out(c, { hap: 3 }, 'A good meal, a good book and a candle. You did not suffer. You were, sadly, quite happy.', 'İyi bir yemek, iyi bir kitap ve bir mum. Acı çekmedin. Maalesef oldukça mutluydun.'); }, { requires: can(50), requiresLabel: 'Not enough money' }),
      ch('sulk', 'Sulk in a blanket', 'Battaniyenin içinde somurt', (c) => out(c, { hap: -3 }, 'You watched a romantic film and commented on every plot point out loud. The blanket agreed with you at all times.', 'Romantik bir film izleyip her olay örgüsüne yüksek sesle yorum yaptın. Battaniye her zaman sana hak verdi.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_parent_matchmaker',
    minAge: 24,
    maxAge: 50,
    weight: 85,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single', 'parent'],
    setup: (c) => {
      pickParent(c);
      newDate(c, 24, 50);
    },
    title: (c) => c.t('Your parent has someone in mind', 'Ebeveynin birini düşünüyor'),
    text: (c) => c.t(`${Kw(c, 'par')} stirs the soup and says, much too casually, "the neighbour's friend has a very nice ${c.h.person(pid(c)).gender === 'female' ? 'daughter' : 'son'}. ${nn(c)}. Only has a slightly large car." There is a photo. There is always a photo.`, `${Kw(c, 'par')} çorbayı karıştırırken fazlasıyla rahat bir sesle "komşunun arkadaşının çok güzel bir ${c.h.person(pid(c)).gender === 'female' ? 'kızı' : 'oğlu'} var. ${nn(c)}. Sadece arabası biraz büyük" diyor. Bir fotoğraf var. Hep bir fotoğraf vardır.`),
    choices: [
      ch('meet', 'Agree to one coffee', 'Bir kahve içmeyi kabul et', (c) => {
        near(c, 'par', 4);
        if (lucky(c, 0.35) && startDating(c, 'pid', 50)) return out(c, { hap: 4 }, `${nn(c)} turned out to be a person, not a photo. You will never hear the end of the soup. You will not mind.`, `${nn(c)} fotoğraf değil, gerçek bir insan çıktı. Çorbanın sonunu asla duymayacaksın. Aldırmayacaksın da.`);
        return out(c, { hap: 0 }, `The coffee was fine. The conversation was fine. Nothing was fine in the car on the way home, mostly the parent asking.`, 'Kahve fena değildi. Sohbet fena değildi. Eve dönerken arabada hiçbir şey fena değildi; çoğunlukla ebeveyn soruyordu.');
      }),
      ch('no', 'Politely refuse', 'Kibarca reddet', (c) => { near(c, 'par', -2); return out(c, { hap: 0 }, 'You said you would find someone yourself. The soup is quieter now, and a little bit hurt. The photo is still on the fridge.', 'Birini kendin bulacağını söyledin. Çorba şimdi daha sessiz ve biraz kırgın. Fotoğraf hâlâ buzdolabında.'); }),
      ch('pretend', 'Pretend you already have someone', 'Zaten biri varmış gibi yap', (c) => { near(c, 'par', -5); return out(c, { hap: -2 }, 'Now you have to invent a person. Their name is Sam, they are a pilot and they are always far away. Your parent wants to meet them at the next family dinner.', 'Şimdi bir insan uydurmak zorundasın. Adı Sam, pilot ve hep çok uzakta. Ebeveynin onunla bir sonraki aile yemeğinde tanışmak istiyor.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_speed_dating',
    minAge: 24,
    maxAge: 60,
    weight: 40,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 24, 60),
    title: (c) => c.t('Speed dating', 'Hızlı flört gecesi'),
    text: (c) => c.t('A bell rings every five minutes and a new face sits down. By the seventh you have said "I work in..." so often it has stopped being words. Then ' + 'someone sits down and says: "Let\'s skip the job and talk about snacks."', 'Beş dakikada bir zil çalıyor ve yeni bir yüz oturuyor. Yedincide "ben ... işinde çalışıyorum" cümlesini o kadar çok söyledin ki artık kelime olmaktan çıktı. Sonra biri oturup "işi geçelim, atıştırmalıkları konuşalım" diyor.'),
    choices: [
      ch('snacks', 'Talk about snacks', 'Atıştırmalıkları konuş', (c) => {
        spend(c, 20);
        if (lucky(c, 0.5) && startDating(c, 'pid', 55)) return out(c, { hap: 5 }, `${nn(c)} ticked your box. You ticked ${nn(c)}'s. The organiser said it was the first genuine match this year. You were both more proud than you let on.`, `${nn(c)} seni işaretledi. Sen de ${acc(nn(c))} işaretledin. Organizatör bu yılki ilk gerçek eşleşme olduğunu söyledi. İkiniz de gösterdiğinizden fazla gurur duydunuz.`);
        return out(c, { hap: 1 }, 'A beautiful five minutes, a lukewarm tick-box, and a lifelong view on crisps.', 'Güzel beş dakika, ılık bir işaret kutusu ve cipsle ilgili ömür boyu bir görüş.');
      }, { requires: can(20), requiresLabel: 'Not enough money' }),
      ch('tick', 'Tick every box', 'Hepsini işaretle', (c) => out(c, { hap: -1 }, 'Eleven matches. Eleven messages. Nine of them said "hi" and then died. The remaining two are on a different planet.', 'On bir eşleşme. On bir mesaj. Dokuzu "selam" deyip öldü. Kalan ikisi başka bir gezegende.')),
      ch('leave', 'Leave at the third bell', 'Üçüncü zilde ayrıl', (c) => out(c, { hap: -1 }, 'You discovered you do not like timed charm. You are, however, much better at saying "no, thank you" than before.', 'Zamanlı cazibeyi sevmediğini keşfettin. Ancak "hayır, teşekkürler" demekte eskisinden çok daha iyisin.')),
    ],
  },
];

// ------------------------------------------------------------------ exes, rebounds, jealousy, temptation

const exGroup: EventDef[] = [
  {
    ...B,
    id: 'base.lv_ex_midnight',
    minAge: 19,
    maxAge: 65,
    weight: 95,
    cooldown: 5,
    maxPerLife: 2,
    when: (c) => c.h.relatives('ex').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('ex')).person.id;
    },
    title: (c) => c.t(`${nn(c)} texts at 2 a.m.`, `${nn(c)} gece ikide mesaj atıyor`),
    text: (c) => c.t(`"Hey. Are you awake? I just found your old scarf." ${nn(c)} has not said your name in months, and now it is two in the morning and there is a scarf.`, `"Selam. Uyanık mısın? Eski atkını buldum." ${nn(c)} aylardır adını anmamıştı; şimdi sabahın ikisi ve ortada bir atkı var.`),
    choices: [
      ch('reply', 'Reply "I am now"', '"Şimdi uyandım" yaz', (c) => {
        if (!c.h.partner() && c.rng.chance(0.4)) {
          c.h.setKind(pid(c), 'partner');
          c.h.closeness(pid(c), 15);
          return out(c, { hap: 4 }, `You talked until the birds started. By breakfast you were back together, and by lunch you had both reminded each other why it ended. You're trying anyway.`, `Kuşlar ötmeye başlayana kadar konuştunuz. Kahvaltıya kadar yeniden birlikteydiniz, öğleye kadar ikiniz de nedenini birbirinize hatırlattınız. Yine de deniyorsunuz.`);
        }
        return out(c, { hap: -3 }, `It was a pleasant hour and an unpleasant morning. The scarf is in a bag by the door and so is the whole sad business.`, 'Hoş bir saat ve hoş olmayan bir sabahtı. Atkı kapının yanında bir poşette, bütün üzüntü de öyle.');
      }, { badge: 'Risky' }),
      ch('ignore', 'Put the phone face down', 'Telefonu ters çevir', (c) => out(c, { hap: 2, sma: 1 }, 'You turned the phone over and looked at the ceiling for forty minutes. In the morning the text looked a lot less like a message and more like a weather report.', 'Telefonu ters çevirip kırk dakika tavana baktın. Sabah mesaj, mesajdan çok hava durumu raporuna benziyordu.'), { tone: 'good' }),
      ch('friend', 'Wake a friend and ask what to do', 'Bir arkadaşı uyandırıp ne yapacağını sor', (c) => {
        c.h.relatives('friend').slice(0, 1).forEach((r) => c.h.closeness(r.person.id, 4));
        return out(c, { hap: 1 }, 'The advice at 2:20 a.m. was "do not". The advice at 2:25 a.m. was "do not, and delete the number". You kept the number but didn\'t reply.', 'Gece 2.20 tavsiyesi "yapma"ydı. 2.25 tavsiyesi "yapma ve numarayı sil"di. Numarayı sakladın ama cevap vermedin.');
      }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ex_new_partner',
    minAge: 20,
    maxAge: 70,
    weight: 95,
    cooldown: 5,
    maxPerLife: 2,
    when: (c) => c.h.relatives('ex').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('ex')).person.id;
      newDate(c, 20, 60, 'qid');
    },
    title: (c) => c.t(`You run into ${nn(c)} with someone new`, `${acc(nn(c))} yeni biriyle görüyorsun`),
    text: (c) => c.t(`Of all the supermarkets in town. Of all the aisles. ${nn(c)} is holding hands with ${nn(c, 'qid')}, who has an irritatingly good jacket. You are holding a bag of frozen peas and a very bad face.`, `Şehirdeki bunca marketten, bunca reyondan. ${nn(c)} ${wth(nn(c, 'qid'))} el ele. Karşındaki kişinin rahatsız edici derecede güzel bir ceketi var. Sen bir paket dondurulmuş bezelye ve çok kötü bir yüz ifadesi tutuyorsun.`),
    choices: [
      ch('smile', 'Smile and say congratulations', 'Gülümse ve tebrik et', (c) => out(c, { hap: 3, sma: 1 }, `You were the most graceful person in the building. Behind the cereal you let a small tear fall into the peas.`, 'Binadaki en zarif kişiydin. Gevrek reyonunun arkasında bezelyelerin üstüne küçük bir damla gözyaşı bıraktın.'), { tone: 'good' }),
      ch('fake', 'Pretend you are on a call', 'Telefonla konuşuyormuş gibi yap', (c) => out(c, { hap: -1 }, 'You said "yes, the quarterly numbers are fine" to nobody for six aisles. Your voice did not once go down.', 'Altı reyon boyunca kimseye "evet, üç aylık rakamlar iyi" dedin. Sesin bir kez bile düşmedi.')),
      ch('flee', 'Leave the trolley and walk out', 'Arabayı bırakıp çık', (c) => { spend(c, 10); return out(c, { hap: -2 }, 'The frozen peas are somewhere on aisle 7, still frozen and probably judging. You bought a bag of crisps from the petrol station and ate them in the car.', 'Dondurulmuş bezelyeler muhtemelen 7. reyonda hâlâ donmuş ve hüküm veriyor. Benzinlikten bir paket cips alıp arabada yedin.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ex_wedding',
    minAge: 24,
    maxAge: 65,
    weight: 85,
    cooldown: 6,
    maxPerLife: 1,
    when: (c) => c.h.relatives('ex').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('ex')).person.id;
    },
    title: (c) => c.t(`${nn(c)} is getting married`, `${nn(c)} evleniyor`),
    text: (c) => c.t(`A cream-coloured envelope arrives with your name in perfect handwriting. ${nn(c)} is getting married, and you are, somehow, on the list. There is a handwritten line: "Hope you'll come."`, `Adın mükemmel bir el yazısıyla yazılmış krem renkli bir zarf geliyor. ${nn(c)} evleniyor ve nedense davetli listesindesin. El yazısıyla bir satır var: "Umarım gelirsin."`),
    choices: [
      ch('go', 'Go, with your best outfit', 'En iyi kıyafetinle git', (c) => { spend(c, 80); return out(c, { hap: 3 }, `You hugged ${nn(c)}, congratulated the new partner and ate three pieces of cake with the good grace of a person who has moved on. In the taxi you wept briefly, and then ate more cake from a napkin.`, `${acc(nn(c))} kucakladın, yeni eşi tebrik ettin ve ileri gitmiş birinin zarafetiyle üç dilim pasta yedin. Taksiyle dönerken kısaca ağladın, sonra peçeteye sarılı pastadan yedin.`); }, { tone: 'good', requires: can(80), requiresLabel: 'Not enough money' }),
      ch('gift', 'Send a gift and a kind note', 'Hediye ve nazik bir not gönder', (c) => { spend(c, 40); return out(c, { hap: 1 }, 'The gift was a toaster. The note said "all the best". You wrote it five times and the fifth was the shortest.', 'Hediye bir tost makinesiydi. Notta "en iyi dileklerimle" yazıyordu. Beş kez yazdın, beşincisi en kısaydı.'); }, { requires: can(40), requiresLabel: 'Not enough money' }),
      ch('ignore', 'Do not reply', 'Cevap verme', (c) => out(c, { hap: -2 }, 'The cream envelope is on the fridge, face down, like a card in a game. It will probably still be there next year.', 'Krem zarf buzdolabının üstünde, bir oyun kartı gibi ters duruyor. Muhtemelen seneye de orada olacak.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_rebound',
    minAge: 16,
    maxAge: 60,
    weight: 400,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['single'],
    when: (c) => recentEx(c, 3).length > 0,
    setup: (c) => newDate(c, 14, 60),
    title: (c) => c.t('A rebound', 'Ayrılıktan sonra bir sıçrama'),
    text: (c) => c.t(`${nn(c)} is attractive, available and has no history with you at all. Your friends say it's a rebound, and you reply that it's a "bounce". The ex's photo is still in your phone.`, `${nn(c)} çekici, müsait ve seninle hiçbir geçmişi yok. Arkadaşların buna "sıçrama" diyor, sen "zıplama" diyorsun. Eski sevgilinin fotoğrafı hâlâ telefonunda.`),
    choices: [
      ch('go', 'Go for it', 'Hadi bakalım', (c) => {
        if (c.rng.chance(0.4) && startDating(c, 'pid', 55)) return out(c, { hap: 5 }, `It started as a rebound and quietly turned into something else. The ex's photo was deleted on a Sunday, without ceremony.`, 'Bir sıçrama olarak başladı ve sessizce başka bir şeye dönüştü. Eski sevgilinin fotoğrafı bir pazar günü, törensiz silindi.');
        return out(c, { hap: -2 }, `It lasted six weeks, nine dinners and one very honest sentence: "I think I'm using you to forget someone." ${nn(c)} took it well. You took it badly.`, `Altı hafta, dokuz akşam yemeği ve çok dürüst bir cümle sürdü: "Sanırım birini unutmak için seni kullanıyorum." ${nn(c)} iyi karşıladı. Sen kötü karşıladın.`);
      }, { badge: 'Risky' }),
      ch('wait', 'Not yet', 'Henüz değil', (c) => out(c, { hap: 2, hea: 1 }, 'You said "not yet" and meant it. Weeks later, you were still alone and still fine, which is a new kind of strength.', '"Henüz değil" dedin ve bunu kastettin. Haftalar sonra hâlâ yalnızdın ve hâlâ iyiydin; bu yeni bir tür güç.'), { tone: 'good' }),
      ch('trip', 'Book a trip alone instead', 'Bunun yerine tek başına tatile çık', (c) => { spend(c, 400); return out(c, { hap: 5, hea: 2 }, 'A week by the water with no phone signal and three books. You came back lighter and with an unreasonably good tan.', 'Su kenarında, telefon çekmeyen bir hafta ve üç kitap. Daha hafif ve makul olmayacak kadar güzel bir bronzlukla döndün.'); }, { tone: 'good', requires: can(400), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ex_apology',
    minAge: 21,
    maxAge: 70,
    weight: 95,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => c.h.relatives('ex').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('ex')).person.id;
    },
    title: (c) => c.t(`${nn(c)} turns up with an apology`, `${nn(c)} özür dilemeye geliyor`),
    text: (c) => c.t(`${nn(c)} is on your doorstep with flowers and a speech. It's a good speech. It's the one you wished you'd heard back then.`, `${nn(c)} elinde çiçek ve bir konuşmayla kapında. İyi bir konuşma. O zaman duymayı dilediğin konuşma.`),
    choices: [
      ch('back', 'Take them back', 'Tekrar kabul et', (c) => {
        if (c.rng.chance(0.55)) {
          c.h.setKind(pid(c), 'partner');
          c.h.closeness(pid(c), 20);
          return out(c, { hap: 6 }, `It was a good second try. This time you both say things before they become fights. It is odd, and it's lovely.`, 'İyi bir ikinci denemeydi. Bu sefer ikiniz de bir şeyleri kavga olmadan önce söylüyorsunuz. Tuhaf ve çok güzel.');
        }
        return out(c, { hap: -5 }, `Four months later, the same old thing, only with better flowers. The second goodbye was shorter and meaner.`, 'Dört ay sonra aynı eski mesele, sadece çiçekler daha iyi. İkinci veda daha kısa ve daha acımasızdı.');
      }, { badge: 'Risky' }),
      ch('coffee', 'Offer coffee, only coffee', 'Sadece kahve teklif et', (c) => out(c, { hap: 2 }, `You talked for two hours on the doorstep with two mugs and the flowers on the step. At the end you shook hands. It felt like a real, mild closing.`, 'İki kupa ve basamakta duran çiçeklerle kapı eşiğinde iki saat konuştunuz. Sonunda el sıkıştınız. Gerçek, ılımlı bir kapanış gibi hissettirdi.'), { tone: 'good' }),
      ch('close', 'Close the door gently', 'Kapıyı usulca kapat', (c) => out(c, { hap: 0, sma: 1 }, 'You took the flowers, said thank you and closed the door. The flowers lasted a week, longer than a few things did.', 'Çiçekleri alıp teşekkür ettin ve kapıyı kapattın. Çiçekler bir hafta dayandı; bazı şeylerden daha uzun.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_found_messages',
    minAge: 20,
    maxAge: 75,
    weight: 28,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['partnered'],
    setup: setPartner,
    title: (c) => c.t('A message that should not exist', 'Var olmaması gereken bir mesaj'),
    text: (c) => c.t(`${nn(c)}'s phone lights up on the table: a name you don't know, three hearts and "last night was incredible". ${nn(c)} is in the shower, singing.`, `${gen(nn(c))} telefonu masada yanıyor: tanımadığın bir isim, üç kalp ve "dün gece harikaydı". ${nn(c)} duşta, şarkı söylüyor.`),
    choices: [
      ch('confront', 'Confront, calmly, at breakfast', 'Kahvaltıda sakince yüzleş', (c) => {
        if (c.rng.chance(0.55)) {
          return split(c, pid(c), `${nn(c)} did not deny it. There was no shouting, which was worse. By the weekend the boxes were out.`, `${nn(c)} inkâr etmedi. Bağırma olmadı; bu daha kötüydü. Hafta sonuna kutular çıkmıştı.`);
        }
        c.h.closeness(pid(c), -3);
        return out(c, { hap: 2 }, `It was a plan for your surprise party, and the hearts came from the baker. You went bright red. ${nn(c)} laughed for a full minute and then did the dishes.`, `Senin sürpriz doğum günü planıydı ve kalpler pastacıdan geliyordu. Kıpkırmızı oldun. ${nn(c)} tam bir dakika güldü, sonra bulaşıkları yıkadı.`);
      }, { tone: 'big' }),
      ch('snoop', 'Read the whole chat', 'Tüm sohbeti oku', (c) => {
        if (c.rng.chance(0.4)) return split(c, pid(c), `The chat went back five months. You read it standing up, in the hallway, with a glass in your hand. You put the glass down very slowly.`, `Sohbet beş ay öncesine gidiyordu. Koridorda ayakta, elinde bir bardakla okudun. Bardağı çok yavaş bıraktın.`);
        return out(c, { hap: -3 }, 'It was a surprise being planned for you. You felt rotten for snooping, and had to act surprised on the day, which you did badly.', 'Senin için planlanan bir sürprizdi. Karıştırdığın için kendini kötü hissettin ve o gün şaşırmış gibi yapman gerekti; bunu kötü yaptın.');
      }, { badge: 'Risky' }),
      ch('ignore', 'Put the phone back and say nothing', 'Telefonu yerine koy, hiçbir şey söyleme', (c) => { c.h.closeness(pid(c), -6); return out(c, { hap: -5 }, 'You know now, or you suspect, and neither lets you sleep. A message you did not read can weigh more than one you did.', 'Artık biliyorsun ya da şüpheleniyorsun; ikisi de uyumana izin vermiyor. Okumadığın bir mesaj, okuduğundan daha ağır gelebilir.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_tempted_trip',
    minAge: 25,
    maxAge: 62,
    weight: 40,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['partnered', 'employed'],
    setup: (c) => {
      setPartner(c);
      c.vars.qid = c.h.newPerson({ age: Math.max(22, c.age + c.rng.int(-6, 6)), gender: c.h.person(pid(c)).gender }).id;
    },
    title: (c) => c.t('After the conference dinner', 'Konferans yemeğinden sonra'),
    text: (c) => c.t(`${nn(c, 'qid')} from another office has been funny all evening, and the hotel bar is almost empty. The hotel key is warm in your pocket. It is only a drink. It's always only a drink.`, `Başka ofisten ${nn(c, 'qid')} bütün akşam komikti ve otelin barı neredeyse boş. Otel anahtarı cebinde ılık. Sadece bir içki. Hep sadece bir içkidir.`),
    choices: [
      ch('resist', 'Say goodnight and call home', 'İyi geceler de ve eve ara', (c) => { c.h.closeness(pid(c), 5); return out(c, { hap: 2 }, `You called ${nn(c)} from the corridor and talked about the dishwasher for twenty minutes. It was the most romantic call of the year.`, `Koridordan ${acc(nn(c))} aradın ve yirmi dakika bulaşık makinesi hakkında konuştun. Yılın en romantik telefonuydu.`); }, { tone: 'good' }),
      ch('drink', 'Have one drink and see', 'Bir içki iç ve gör', (c) => {
        if (c.rng.chance(0.45)) {
          return split(c, pid(c), `One drink became the corridor, and the corridor became a mistake. ${nn(c)} found out from a colleague three weeks later. It was in all the wrong places.`, `Bir içki koridora, koridor hataya dönüştü. ${nn(c)} üç hafta sonra bir iş arkadaşından öğrendi. Tüm yanlış yerlerde duyuldu.`);
        }
        c.h.closeness(pid(c), -2);
        return out(c, { hap: -2 }, 'You had one drink, felt a ghost of something and left. The ghost followed you to the lift and stayed in the room all night. You told nobody.', 'Bir içki içtin, bir şeyin hayaletini hissettin ve ayrıldın. Hayalet asansöre kadar seni takip etti ve bütün gece odada kaldı. Kimseye söylemedin.');
      }, { badge: 'Risky', tone: 'bad' }),
      ch('team', 'Pull the whole team into a group photo', 'Bütün ekibi grup fotoğrafına çek', (c) => out(c, { hap: 1 }, 'Eleven people in a slightly crooked photo, and one person who understood what you were doing. It was a good photo.', 'Biraz eğri bir fotoğrafta on bir kişi ve ne yaptığını anlayan bir kişi. İyi bir fotoğraftı.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_old_flame_dm',
    minAge: 24,
    maxAge: 70,
    weight: 28,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['partnered'],
    setup: (c) => {
      setPartner(c);
      newDate(c, 24, 70, 'qid');
    },
    title: (c) => c.t(`${nn(c, 'qid')} from long ago sends a message`, `Eski günlerden ${nn(c, 'qid')} mesaj atıyor`),
    text: (c) => c.t(`"I was clearing out boxes and found the letters we wrote. Do you ever think about it?" ${nn(c, 'qid')} was your first love. You last thought about it on Tuesday, in the shower.`, `"Kutuları boşaltırken yazdığımız mektupları buldum. Hiç düşünüyor musun?" ${nn(c, 'qid')} ilk aşkındı. Geçen salı duşta düşündüğünden beri bir daha düşünmedin.`),
    choices: [
      ch('polite', 'Reply kindly and end it there', 'Nazikçe cevapla ve orada bitir', (c) => { c.h.closeness(pid(c), 3); return out(c, { hap: 1, sma: 1 }, `You wrote "so good to hear from you, take care", deleted three different ending lines and read the finished message aloud to ${nn(c)}. They said "you're a bit of a saint".`, `"Haber almak çok güzel, kendine iyi bak" yazdın, üç farklı bitiş cümlesini sildin ve bitmiş mesajı ${dat(nn(c))} yüksek sesle okudun. "Biraz azizsin" dedi.`); }, { tone: 'good' }),
      ch('secret', 'Reply, keep it secret', 'Cevapla, gizle', (c) => {
        if (c.rng.chance(0.4)) return split(c, pid(c), `You moved to an app that no longer leaves a trace. ${nn(c)} found the thread. It wasn't what you said; it was that you hid it.`, `İz bırakmayan bir uygulamaya geçtin. Yazışmayı ${nn(c)} buldu. Sorun yazdıkların değil, gizlemendi.`);
        c.h.closeness(pid(c), -3);
        return out(c, { hap: -2 }, 'Three messages and a coffee never had. You deleted it all after a week, and the hollow remained longer.', 'Üç mesaj ve hiç yaşanmayan bir kahve. Bir hafta sonra hepsini sildin, içindeki boşluk daha uzun kaldı.');
      }, { badge: 'Risky', tone: 'bad' }),
      ch('show', 'Show your partner and laugh together', 'Partnerine göster ve birlikte gül', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 3 }, `${nn(c)} read it twice and said "tell them the letters are in the bin". You did, with a smiley. It cost nothing and settled everything.`, `${nn(c)} iki kez okudu ve "mektupların çöpte olduğunu söyle" dedi. Gülen suratla yazdın. Hiçbir şeye mal olmadı ve her şeyi çözdü.`); }, { tone: 'good' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_partner_jealous',
    minAge: 18,
    maxAge: 60,
    weight: 38,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['partnered'],
    setup: setPartner,
    title: (c) => c.t(`${nn(c)} is jealous`, `${nn(c)} kıskanıyor`),
    text: (c) => c.t(`Somebody commented a laughing face on your picture, and now ${nn(c)} is going through every like you gave in the last two years. The word "interesting" is used eleven times.`, `Biri fotoğrafına gülen yüz yorumu yaptı ve şimdi ${nn(c)} son iki yıldır verdiğin her beğeniyi inceliyor. "İlginç" kelimesi on bir kez kullanıldı.`),
    choices: [
      ch('calm', 'Talk it through, phone down', 'Telefonlar kapalı, konuşarak çöz', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 2 }, `The real problem was a bad month at work. It always is. You fixed it with a long dinner and a very short list of rules.`, 'Asıl sorun işteki kötü bir aydı. Hep öyledir. Uzun bir akşam yemeği ve çok kısa bir kural listesiyle çözdün.'); }, { tone: 'good' }),
      ch('defend', 'Get defensive', 'Savunmaya geç', (c) => { c.h.closeness(pid(c), -7); return out(c, { hap: -4 }, 'You won the argument and lost the evening. The sofa now has a border running through it.', 'Tartışmayı kazandın, akşamı kaybettin. Koltuğun üstünden artık bir sınır geçiyor.'); }, { tone: 'bad' }),
      ch('password', 'Hand over the phone, passcode and all', 'Telefonu şifresiyle ver', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.closeness(pid(c), 3);
          return out(c, { hap: 0 }, 'Nothing was found. It did settle the matter. It also taught everyone in the house that privacy is on a payment plan.', 'Hiçbir şey bulunmadı. Mesele kapandı. Ayrıca evdeki herkese mahremiyetin taksitle ödenebildiğini öğretti.');
        }
        c.h.closeness(pid(c), -5);
        return out(c, { hap: -3 }, `A joke chat with a friend was read with a very serious face. Nothing happened, but the trust has a crack in it now.`, 'Bir arkadaşla şaka sohbeti çok ciddi bir yüzle okundu. Hiçbir şey olmadı ama güvende artık bir çatlak var.');
      }),
    ],
  },
  {
    ...B,
    id: 'base.lv_you_jealous',
    minAge: 17,
    maxAge: 60,
    weight: 28,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['partnered'],
    setup: (c) => {
      setPartner(c);
      newDate(c, 18, 60, 'qid');
    },
    title: (c) => c.t('Jealous at the party', 'Partide kıskançlık'),
    text: (c) => c.t(`${nn(c)} is across the room, laughing at something ${nn(c, 'qid')} said, head thrown back, the kind of laugh you thought was yours. You hold your cup in the exact way of a person who is not jealous.`, `${nn(c)} odanın karşısında, ${gen(nn(c, 'qid'))} söylediği bir şeye başını arkaya atarak gülüyor; senin sandığın cinsten bir kahkaha. Bardağını kıskanç olmayan birinin tam tutacağı şekilde tutuyorsun.`),
    choices: [
      ch('say', 'Tell the truth later, kindly', 'Sonra, nazikçe gerçeği söyle', (c) => { c.h.closeness(pid(c), 5); return out(c, { hap: 2 }, `In the taxi you said "I got jealous." ${nn(c)} said "of whom?" and then "oh". It was the best conversation of the night.`, `Taksiyle dönerken "Kıskandım" dedin. ${nn(c)} "kimi?" dedi, sonra "ha." Gecenin en güzel konuşmasıydı.`); }, { tone: 'good' }),
      ch('glare', 'Glare from a distance', 'Uzaktan sert bak', (c) => { c.h.closeness(pid(c), -5); return out(c, { hap: -3 }, `${nn(c)} noticed in four seconds and asked what was wrong in front of everyone. The answer was "nothing", delivered at a speed that meant everything.`, `${nn(c)} dört saniyede fark etti ve herkesin önünde neyin var diye sordu. Cevap "hiçbir şey"di; her şeyi ifade eden bir hızla söylendi.`); }, { tone: 'bad' }),
      ch('home', 'Go home early and sulk', 'Erken eve git ve somurt', (c) => { c.h.closeness(pid(c), -2); return out(c, { hap: -2 }, 'You left a message about a headache. Your head was perfectly fine; it was something to the left of it.', 'Baş ağrısıyla ilgili mesaj bıraktın. Kafan gayet iyiydi; bir şey ondan biraz sol tarafındaydı.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_secret_admirer',
    minAge: 16,
    maxAge: 50,
    weight: 40,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 16, 50),
    title: (c) => c.t('A secret admirer', 'Gizli bir hayran'),
    text: (c) => c.t('Flowers, then a handwritten card, then a small box of chocolate you did not order. All signed with a drawing of a tiny owl. Everyone swears it is not them.', 'Çiçekler, sonra el yazısıyla bir kart, sonra sipariş etmediğin küçük bir çikolata kutusu. Hepsi minik bir baykuş çizimiyle imzalı. Herkes onların olmadığına yemin ediyor.'),
    choices: [
      ch('hunt', 'Investigate like a detective', 'Dedektif gibi araştır', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 55)) return out(c, { hap: 5, sma: 1 }, `The person behind the owl was ${nn(c)}, charming, nervous, and confessing with a chocolate in hand. Your first date was beside the real owls in the park.`, `Baykuşun ardındaki kişi ${nn(c)} çıktı; sevimli, gergin ve elinde çikolatayla itiraf ediyordu. İlk randevunuz parktaki gerçek baykuşların yanındaydı.`);
        return out(c, { hap: -2, sma: 1 }, 'The owl was a prank by a friend who wanted to see how long you would investigate. It was eleven days. You were warm but also annoyed.', 'Baykuş, ne kadar araştıracağını görmek isteyen bir arkadaşın şakasıydı. On bir gün sürdü. Hem için ısındı hem sinirlendin.');
      }),
      ch('wait', 'Wait to be revealed', 'Ortaya çıkmasını bekle', (c) => out(c, { hap: 3 }, 'Nobody ever came forward, and the cards stopped in the spring. You kept the owl on your desk. It watches you like a small, wise ghost.', 'Kimse ortaya çıkmadı ve kartlar bahar gelince kesildi. Baykuşu masanda tuttun. Seni küçük, bilge bir hayalet gibi izliyor.')),
      ch('post', 'Post the mystery online', 'Gizemi internette paylaş', (c) => out(c, { hap: -1 }, 'Eighty-one comments, nine detectives, no suspect. One person said it was a marketing campaign. The owl has a following now.', 'Seksen bir yorum, dokuz dedektif, şüpheli yok. Biri bunun bir pazarlama kampanyası olduğunu söyledi. Baykuşun artık takipçileri var.')),
    ],
  },
];

// ------------------------------------------------------------------ distance, meeting the family, the party after the wedding

const together: EventDef[] = [
  {
    ...B,
    id: 'base.lv_ld_start',
    minAge: 19,
    maxAge: 40,
    weight: 85,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['apart'],
    when: dating,
    setup: setDating,
    title: (c) => c.t(`${nn(c)} gets a job in another city`, `${nn(c)} başka bir şehirde iş buluyor`),
    text: (c) => c.t(`A one-year contract, five hours away by train. "Come with me, or wait for me," says ${nn(c)}, and you can hear that both options come with a bill.`, `Bir yıllık sözleşme, trenle beş saat uzakta. ${nn(c)} "ya benimle gel ya da beni bekle" diyor ve iki seçeneğin de bir faturası olduğunu duyuyorsun.`),
    choices: [
      ch('try', 'Try long distance', 'Uzak mesafeyi dene', (c) => {
        if (c.rng.chance(0.6)) { c.h.closeness(pid(c), 6); return out(c, { hap: -1 }, 'Late calls, weekend trains, a shared playlist. You are better at writing now and worse at sleeping. It is going surprisingly well.', 'Geç saatlerde aramalar, hafta sonu trenleri, ortak bir çalma listesi. Artık daha iyi yazıyorsun, daha kötü uyuyorsun. Şaşırtıcı derecede iyi gidiyor.'); }
        c.h.closeness(pid(c), -8);
        return out(c, { hap: -4 }, 'The calls got shorter, then fewer, and then they were all about logistics. The gap in your bed is the exact size of a person.', 'Aramalar kısaldı, sonra seyrekleşti, sonra hepsi lojistik oldu. Yatağındaki boşluk tam bir insan boyutunda.');
      }),
      ch('follow', 'Move with them', 'Onunla taşın', (c) => {
        spend(c, 500);
        c.h.flag('moved_in');
        c.h.closeness(pid(c), 12);
        return out(c, { hap: 3 }, `You packed everything into eleven boxes and a plant. The new flat is small, with nothing on the walls yet but both of your names on the door.`, 'Her şeyi on bir kutuya ve bir bitkiye sığdırdın. Yeni daire küçük, duvarlarda henüz hiçbir şey yok ama kapıda ikinizin de adı var.');
      }, { tone: 'big', requires: can(500), requiresLabel: 'Not enough money' }),
      ch('end', 'End it kindly', 'Güzelce bitir', (c) => split(c, pid(c), `You both cried a little at the station and agreed it's better to end it at its best. The train leaves, you stay, and the platform is oddly warm.`, 'İstasyonda ikiniz de biraz ağladınız ve en güzel anında bitirmenin daha iyi olduğunda anlaştınız. Tren gidiyor, sen kalıyorsun ve peron tuhaf biçimde sıcak.'), { tone: 'big' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ld_visit',
    minAge: 19,
    maxAge: 65,
    weight: 55,
    cooldown: 4,
    maxPerLife: 2,
    needs: ['apart'],
    when: dating,
    setup: setDating,
    title: (c) => c.t(`A weekend with ${nn(c)}`, `${wth(nn(c))} bir hafta sonu`),
    text: (c) => c.t(`The best two days of the month cost two months of patience. You and ${nn(c)} have just forty-eight hours, one bag each and a lot of unsaid things to fit in.`, `Ayın en güzel iki günü iki aylık sabra mal oldu. ${wth(nn(c))} sadece kırk sekiz saatiniz, birer çantanız ve sığdırılacak çok söylenmemiş şey var.`),
    choices: [
      ch('train', 'Take the train', 'Trene bin', (c) => { spend(c, 60); c.h.closeness(pid(c), 8); return out(c, { hap: 4 }, 'You spent the trip with your forehead against the window and the weekend with your forehead against theirs. The Monday was awful.', 'Yolculuğu alnın camda, hafta sonunu alnın onunkine dayalı geçirdin. Pazartesi berbattı.'); }, { tone: 'good', requires: can(60), requiresLabel: 'Not enough money' }),
      ch('surprise', 'Fly there to surprise them', 'Sürpriz yapmak için uç', (c) => {
        spend(c, 250);
        if (c.rng.chance(0.75)) { c.h.closeness(pid(c), 14); return out(c, { hap: 7 }, `${nn(c)} opened the door in a towel and a toothbrush and screamed. Then cried. Then cooked an egg. It was the best egg of your life.`, `${nn(c)} kapıyı havlu ve diş fırçasıyla açtı ve çığlık attı. Sonra ağladı. Sonra yumurta pişirdi. Hayatının en güzel yumurtasıydı.`); }
        c.h.closeness(pid(c), -2);
        return out(c, { hap: -3 }, `${nn(c)} was out of town for work. The sitter had the key but not the story. You ate sad noodles on their sofa and flew back.`, `${nn(c)} iş için şehir dışındaydı. Anahtar komşudaydı ama hikâye değil. Onun koltuğunda üzgün bir noodle yedin ve geri uçtun.`);
      }, { badge: 'Risky', requires: can(250), requiresLabel: 'Not enough money' }),
      ch('skip', 'Skip it, too tired', 'Vazgeç, çok yorgunsun', (c) => { c.h.closeness(pid(c), -6); return out(c, { hap: -2 }, 'You said next time. You had said next time last time. The voice on the phone was kind, and its kindness was very quiet.', 'Bir dahaki sefere dedin. Geçen sefer de bir dahaki sefere demiştin. Telefondaki ses nazikti ve nezaketi çok sessizdi.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ld_fade',
    minAge: 19,
    maxAge: 50,
    weight: 85,
    cooldown: 5,
    maxPerLife: 1,
    needs: ['apart'],
    when: dating,
    setup: setDating,
    title: (c) => c.t('The calls are getting shorter', 'Aramalar kısalıyor'),
    text: (c) => c.t(`Nine minutes on Monday, six on Wednesday, four on Sunday. ${nn(c)} says "I'm tired" in a voice that has stopped finding you funny. You say "me too". Nobody knows who is lying.`, `Pazartesi dokuz dakika, çarşamba altı, pazar dört. ${nn(c)} "yorgunum" diyor; sesi artık seni komik bulmuyor. Sen de "ben de" diyorsun. Kimin yalan söylediğini kimse bilmiyor.`),
    choices: [
      ch('schedule', 'Schedule a proper call, once a week', 'Haftada bir düzgün görüşme planla', (c) => { c.h.closeness(pid(c), 7); return out(c, { hap: 2 }, 'Sunday at eight, phones down, a shared dinner on two screens. It feels like a date. You both made it a bit too formal and then relaxed.', 'Pazar sekizde, telefonlar kapalı, iki ekranda ortak yemek. Randevu gibi hissettiriyor. İkiniz de önce biraz fazla resmî oldunuz, sonra rahatladınız.'); }, { tone: 'good' }),
      ch('talk', 'Say it plainly: "are we ending?"', 'Açıkça sor: "bitiyor muyuz?"', (c) => {
        if (c.rng.chance(0.5)) return split(c, pid(c), `A long silence, and then a sad, honest "I think so." You were both waiting for the other to say it. You hung up and the flat was suddenly very tidy.`, `Uzun bir sessizlik, sonra üzgün, dürüst bir "sanırım." İkiniz de diğerinin söylemesini bekliyordunuz. Telefonu kapattın ve ev birden çok derli toplu göründü.`);
        c.h.closeness(pid(c), 10);
        return out(c, { hap: 3 }, `"No!" said ${nn(c)}, much too fast. You both laughed. It was the best call of the year, and it lasted two hours.`, `${nn(c)} çok hızlı bir şekilde "Hayır!" dedi. İkiniz de güldünüz. Yılın en güzel konuşmasıydı ve iki saat sürdü.`);
      }, { badge: 'Risky' }),
      ch('drift', 'Let it drift', 'Akışına bırak', (c) => { c.h.closeness(pid(c), -9); return out(c, { hap: -3 }, 'Days between messages became weeks. Nobody ended it; it dissolved, like sugar in cold coffee. You can still taste it.', 'Mesajlar arasındaki günler haftalara dönüştü. Kimse bitirmedi; soğuk kahvede şeker gibi eridi. Hâlâ tadı var.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_meet_parents',
    minAge: 19,
    maxAge: 45,
    weight: 55,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['partnered'],
    when: dating,
    setup: setDating,
    title: (c) => c.t(`Lunch with ${nn(c)}'s parents`, `${gen(nn(c))} ailesiyle öğle yemeği`),
    text: (c) => c.t(`${nn(c)}'s dad shakes your hand like it's an audit. ${nn(c)}'s mom asks, with soup, what exactly your "plans" are. There is a dog, a framed photo of ${nn(c)} at nine, and a very long table.`, `${gen(nn(c))} babası elini bir denetim gibi sıkıyor. Annesi çorba eşliğinde tam olarak "planlarının" ne olduğunu soruyor. Bir köpek, ${gen(nn(c))} dokuz yaşındaki çerçeveli bir fotoğrafı ve çok uzun bir masa var.`),
    choices: [
      ch('self', 'Be yourself', 'Kendin ol', (c) => {
        if (c.rng.chance(0.65)) { c.h.closeness(pid(c), 8); return out(c, { hap: 4 }, `By dessert, the dad had shown you his fishing photos, a high honour. The mom wrapped a slice of cake "for the road". You've been approved.`, 'Tatlıya gelince baba sana balık fotoğraflarını gösterdi, büyük bir onur. Anne "yol için" bir dilim pasta sardı. Onay aldın.'); }
        c.h.closeness(pid(c), -2);
        return out(c, { hap: -2 }, 'You told a joke about your job. It was heard as a joke about their kid\'s taste. You are still searching for the moment it went wrong.', 'İşinle ilgili bir şaka yaptın. Çocuklarının zevkine yapılmış bir şaka gibi anlaşıldı. Her şeyin nerede ters gittiğini hâlâ arıyorsun.');
      }),
      ch('flowers', 'Bring flowers and a very good cake', 'Çiçek ve çok güzel bir pasta getir', (c) => { spend(c, 40); c.h.closeness(pid(c), 7); return out(c, { hap: 3 }, 'Flowers for the mom, a cake for the dad, a biscuit for the dog. You walked in like the head of a small, polite embassy.', 'Anneye çiçek, babaya pasta, köpeğe bisküvi. Küçük ve kibar bir elçiliğin başkanı gibi girdin.'); }, { requires: can(40), requiresLabel: 'Not enough money' }),
      ch('nervous', 'Say nothing and eat everything', 'Hiçbir şey söyleme, hepsini ye', (c) => { c.h.closeness(pid(c), 2); return out(c, { hap: 1 }, 'You said eleven words in two hours and had four helpings. The mom took it as a compliment. The dad took it as a mystery.', 'İki saatte on bir kelime ettin, dört kez tabak aldın. Anne bunu iltifat saydı. Baba gizem olarak gördü.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_ring_shop',
    minAge: 21,
    maxAge: 50,
    weight: 45,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['partnered'],
    when: (c) => dating(c) && yearsTogether(c) >= 1,
    setup: setDating,
    title: (c) => c.t('A visit to the jeweller', 'Kuyumcuya bir ziyaret'),
    text: (c) => c.t(`You told ${nn(c)} you were "going for a run". You are, in fact, in a shop that smells of velvet, staring at twelve nearly identical rings while a very calm person says the word "carat" like a poem.`, `${dat(nn(c))} "koşuya çıkıyorum" dedin. Aslında kadife kokan bir dükkândasın, birbirinin neredeyse aynı on iki yüzüğe bakıyorsun ve çok sakin biri "karat" kelimesini şiir gibi söylüyor.`),
    choices: [
      ch('big', 'The big, impressive one', 'Büyük ve gösterişli olanı', (c) => { spend(c, 1500); c.h.closeness(pid(c), 5); return out(c, { hap: 3 }, 'It sparkled like a small sun. The jeweller wept slightly with joy. The ring will be in your sock drawer, in its box, for as long as it takes to find the right moment.', 'Küçük bir güneş gibi parladı. Kuyumcu hafifçe sevinç gözyaşı döktü. Yüzük, doğru anı bulana kadar çorap çekmecende kutusunda duracak.'); }, { badge: 'Costs more', requires: can(1500), requiresLabel: 'Not enough money' }),
      ch('simple', 'A simple one, with an engraving', 'Sade olanı, bir gravürle', (c) => { spend(c, 400); c.h.closeness(pid(c), 6); return out(c, { hap: 3 }, 'Thin gold and three words inside, in your own handwriting. It cost a lot less than the first one and says more. The sock drawer has a new secret.', 'İnce altın ve içinde senin el yazınla üç kelime. İlkinden çok daha ucuza geldi ve daha çok şey söylüyor. Çorap çekmecesinin yeni bir sırrı var.'); }, { tone: 'good', requires: can(400), requiresLabel: 'Not enough money' }),
      ch('leave', 'Go for a real run instead', 'Onun yerine gerçekten koşmaya çık', (c) => out(c, { hap: -1, hea: 1 }, 'You jogged out of the shop in your good shoes, past three more shops, and reached a park, where you sat on a bench and realised you had been scared of the word "forever" all week.', 'Dükkândan iyi ayakkabılarınla koşarak çıktın, üç dükkânı daha geçtin ve bir parka vardın; bankta oturup bütün hafta "sonsuza dek" kelimesinden korktuğunu fark ettin.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_two_families',
    minAge: 21,
    maxAge: 50,
    weight: 85,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['partnered', 'parent'],
    when: dating,
    setup: (c) => {
      setDating(c);
      pickParent(c);
    },
    title: (c) => c.t('Both families at one table', 'İki aile tek masada'),
    text: (c) => c.t(`${Kw(c, 'par')} and ${nn(c)}'s parents are meeting for the first time. Seven people, four forbidden subjects, one bowl of olives that everyone keeps moving three centimetres to the left.`, `${Kw(c, 'par')} ile ${gen(nn(c))} ailesi ilk kez buluşuyor. Yedi kişi, dört yasak konu ve herkesin üç santim sola kaydırıp durduğu bir kase zeytin.`),
    choices: [
      ch('host', 'Host the evening yourself', 'Akşamı kendin yönet', (c) => { near(c, 'par', 3); c.h.closeness(pid(c), 5); return out(c, { hap: 3 }, 'You led the conversation like an air-traffic controller: "Nobody mention politics. Everybody love the soup." The soup was a triumph.', 'Sohbeti bir hava trafik kontrolörü gibi yönettin: "Kimse siyaseti anmasın. Herkes çorbayı sevsin." Çorba bir zaferdi.'); }, { tone: 'good' }),
      ch('wing', 'Wing it and hope', 'Doğaçla ve umut et', (c) => {
        if (c.rng.chance(0.5)) { near(c, 'par', 3); c.h.closeness(pid(c), 6); return out(c, { hap: 4 }, 'Somehow both fathers discovered a shared hatred of the same football referee and talked until midnight. The mothers swapped numbers and recipes.', 'Nasıl olduysa iki baba aynı hakeme duydukları nefreti keşfetti ve gece yarısına kadar konuştu. İki anne numaraları ve tarifleri değiş tokuş etti.'); }
        near(c, 'par', -3);
        return out(c, { hap: -3 }, 'Someone brought up the wrong topic during the main course. It involved a will. Nobody wanted the olives after that.', 'Ana yemekte biri yanlış konuyu açtı. Bir vasiyet söz konusuydu. Ondan sonra kimse zeytin istemedi.');
      }),
      ch('restaurant', 'Move it to a neutral restaurant', 'Tarafsız bir restorana taşı', (c) => { spend(c, 150); near(c, 'par', 1); c.h.closeness(pid(c), 3); return out(c, { hap: 2 }, 'No one had to be the host and no one could comment on the sofa. The bill was long. The evening was short and calm.', 'Kimsenin ev sahibi olması gerekmedi, kimse koltuğa laf atamadı. Hesap uzundu. Akşam kısa ve sakindi.'); }, { requires: can(150), requiresLabel: 'Not enough money' }),
    ],
  },
  // ---- the party after the wedding
  {
    ...B,
    id: 'base.lv_party_budget',
    minAge: 20,
    maxAge: 60,
    weight: 450,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['married'],
    when: (c) => married(c) && yearsTogether(c) <= 2 && noMourn(c) && !c.h.has('lv_party'),
    setup: (c) => {
      setPartner(c);
      c.h.flag('lv_party');
    },
    title: (c) => c.t('The wedding party quote', 'Düğün partisi teklifi'),
    text: (c) => c.t(`You and ${nn(c)} want a proper celebration. The venue quoted a number that has more zeros than your plans, and the catering page says "per head, per hunger".`, `${wth(nn(c))} düzgün bir kutlama istiyorsunuz. Mekân, planlarından fazla sıfırı olan bir rakam söyledi; yemek sayfasında "kişi başı, açlık başı" yazıyor.`),
    choices: [
      ch('big', 'Go all in', 'Sonuna kadar git', (c) => { spend(c, 4000); c.h.closeness(pid(c), 8); return out(c, { hap: 6 }, 'A band, two cakes and a photo booth that is still your favourite object. You dance for four hours; your savings do not, they stay sitting down.', 'Bir grup, iki pasta ve hâlâ en sevdiğin eşya olan bir fotoğraf kabini. Dört saat dans ettin; birikimin etmedi, oturdu kaldı.'); }, { badge: 'Costs more', requires: can(4000), requiresLabel: 'Not enough money' }),
      ch('small', 'A small garden lunch', 'Küçük bir bahçe yemeği', (c) => { spend(c, 700); c.h.closeness(pid(c), 6); return out(c, { hap: 5 }, 'Thirty people, long tables, borrowed chairs and a friend with a speaker. It was the most "you" day you can imagine, with rain only in the second half.', 'Otuz kişi, uzun masalar, ödünç sandalyeler ve hoparlörlü bir arkadaş. Hayal edebileceğin en "sen" günüydü; yağmur yalnızca ikinci yarıda.'); }, { tone: 'good', requires: can(700), requiresLabel: 'Not enough money' }),
      ch('skip', 'Skip the party, take a trip later', 'Partiyi atla, sonra tatile çık', (c) => { c.h.closeness(pid(c), 2); return out(c, { hap: 1 }, 'You decided on a promise: "when we can". The relatives sulked quietly; the savings were happy; and the promise has been quietly aging in a drawer.', 'Bir sözde karar kıldınız: "yapabildiğimizde". Akrabalar sessizce küstü; birikim mutlu oldu; söz de bir çekmecede sessizce yaşlanıyor.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_party_guests',
    minAge: 20,
    maxAge: 60,
    weight: 450,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['married'],
    when: (c) => married(c) && yearsTogether(c) <= 2 && noMourn(c) && !c.h.has('lv_party'),
    setup: (c) => {
      setPartner(c);
      c.h.flag('lv_party');
    },
    title: (c) => c.t('The guest list war', 'Davetli listesi savaşı'),
    text: (c) => c.t(`The list started at sixty. Now it's one-eighty, because ${nn(c)} has "just a few" cousins and you have a former neighbour who once lent you an egg. A spreadsheet has become a battlefield.`, `Liste altmışla başladı. Şimdi yüz seksen, çünkü ${nn(c)} tarafında "sadece birkaç" kuzen var, sende de bir kez sana yumurta ödünç vermiş eski bir komşu. Bir tablo savaş alanına döndü.`),
    choices: [
      ch('cut', 'Cut it ruthlessly to sixty', 'Acımasızca altmışa indir', (c) => { c.h.relatives(['sibling', 'friend']).slice(0, 2).forEach((r) => c.h.closeness(r.person.id, -4)); c.h.closeness(pid(c), 3); return out(c, { hap: 0 }, 'The party was warm and small, and three people did not speak to you until the autumn. One of them was the egg neighbour.', 'Parti sıcak ve küçüktü; üç kişi sonbahara kadar seninle konuşmadı. Biri yumurta komşusuydu.'); }),
      ch('all', 'Invite everyone', 'Herkesi çağır', (c) => { spend(c, 1500); c.h.closeness(pid(c), 4); return out(c, { hap: 4 }, 'A hundred and eighty people, two dancing uncles and a toast that went on for eleven minutes. The bill was as long as the toast. You were glad of it.', 'Yüz seksen kişi, dans eden iki amca ve on bir dakika süren bir kadeh. Hesap kadehin kadar uzundu. Buna memnun oldun.'); }, { requires: can(1500), requiresLabel: 'Not enough money' }),
      ch('fair', 'Draw the line by who came to your life, not by blood', 'Çizgiyi kana değil, hayatına girenlere göre çek', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 3, sma: 1 }, 'It was an elegant rule and it ended the war in a night. It also, quietly, gave you a clearer view of your own life.', 'Zarif bir kuraldı ve savaşı bir gecede bitirdi. Ayrıca sessizce kendi hayatın hakkında daha net bir görüş sağladı.'); }, { tone: 'good' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_party_mishap',
    minAge: 20,
    maxAge: 60,
    weight: 450,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['married'],
    when: (c) => married(c) && yearsTogether(c) <= 2 && noMourn(c) && !c.h.has('lv_party'),
    setup: (c) => {
      setPartner(c);
      c.h.flag('lv_party');
    },
    title: (c) => c.t('The party that went wrong', 'Ters giden parti'),
    text: (c) => c.t(`The cake leans. The sound system plays a ringtone every four minutes. A guest gets lost in the car park, a different guest gets lost inside the venue. ${nn(c)} looks at you across the room with the face of a person who is about to laugh or scream.`, `Pasta eğiliyor. Ses sistemi dört dakikada bir zil sesi çalıyor. Bir misafir otoparkta kayboluyor, bir başkası mekânın içinde. ${nn(c)} odanın karşısından sana gülmek ya da bağırmak üzere olan birinin yüzüyle bakıyor.`),
    choices: [
      ch('laugh', 'Laugh and make it the story', 'Gül ve hikâye yap', (c) => { c.h.closeness(pid(c), 10); return out(c, { hap: 6 }, `You took the microphone and said "this is what a marriage looks like". They cheered, and the leaning cake got a standing ovation. It's the story you tell most.`, `Mikrofonu alıp "bir evlilik işte böyle görünür" dedin. Alkışladılar; eğik pasta ayakta alkış aldı. En çok anlattığınız hikâye bu.`); }, { tone: 'good' }),
      ch('complain', 'Find the manager', 'Müdürü bul', (c) => {
        if (c.rng.chance(0.5)) { c.h.money(wage(c, 600)); return out(c, { hap: 1 }, 'You were calm, factual and terrifying. A refund of a decent part of the bill came, and an apology cake that stood perfectly straight.', 'Sakin, olgun ve korkutucuydun. Faturanın iyi bir kısmı iade edildi, bir de dümdüz duran özür pastası geldi.'); }
        c.h.closeness(pid(c), -3);
        return out(c, { hap: -3 }, 'The manager said it was in the contract. It was in the contract. You spent your party reading small print, and the cake got to lean in peace.', 'Müdür bunun sözleşmede yazdığını söyledi. Sözleşmede yazıyordu. Partini küçük yazıları okuyarak geçirdin; pasta rahatça eğik kaldı.');
      }),
      ch('fix', 'Quietly fix everything yourself', 'Her şeyi sessizce kendin düzelt', (c) => { c.h.closeness(pid(c), 2); return out(c, { hap: -2, hea: -1 }, 'You spent your own party as the stage crew. By the end you were exhausted and proud. Nobody noticed and the photos show you with a pair of pliers.', 'Kendi partini sahne ekibi olarak geçirdin. Sonunda yorgun ve gururluydun. Kimse fark etmedi; fotoğraflarda elinde pense var.'); }),
    ],
  },
  // ---- in-laws
  {
    ...B,
    id: 'base.lv_inlaws_stay',
    minAge: 22,
    maxAge: 60,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['married'],
    setup: setPartner,
    title: (c) => c.t('The in-laws are coming for the weekend', 'Kayınvalide ve kayınpeder hafta sonu geliyor'),
    text: (c) => c.t(`${nn(c)}'s parents are "just popping by for the weekend." They have brought three suitcases, a plant and a frank opinion on how you load the dishwasher. By Sunday no one has mentioned leaving.`, `${gen(nn(c))} ailesi "sadece hafta sonu uğrayacak." Üç bavul, bir bitki ve bulaşık makinesini nasıl doldurduğuna dair açık bir görüşle geldiler. Pazar günü hâlâ kimse gitmekten söz etmedi.`),
    choices: [
      ch('welcome', 'Embrace it', 'Kucakla', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 1, hea: -1 }, 'You cooked a feast every night. They went home after twelve days with a casserole dish from your house and a new respect.', 'Her akşam ziyafet pişirdin. On iki gün sonra senin evinden bir güveç kabı ve yeni bir saygıyla evlerine gittiler.'); }, { tone: 'good' }),
      ch('hint', 'Hint heavily about "work this week"', '"Bu hafta iş" diye üstü kapalı ima et', (c) => {
        if (c.rng.chance(0.5)) { c.h.closeness(pid(c), 2); return out(c, { hap: 1 }, 'They took the hint and left on Monday, offended in a respectful way. The house is yours again; you find yourself missing the plant.', 'İması anladılar ve pazartesi saygıyla alınarak ayrıldılar. Ev yine senin; bitkiyi özlediğini fark ediyorsun.'); }
        c.h.closeness(pid(c), -3);
        return out(c, { hap: -3 }, 'They read "work" as "bring us lunch at the office", and now there is a new set of keys with your name on a spare. Nothing was resolved.', 'İşi "ofiste bize öğle yemeği getir" diye anladılar; şimdi yedek bir anahtarın üzerinde adın yazılı. Hiçbir şey çözülmedi.');
      }),
      ch('talk', 'Ask your partner to deal with it', 'Partnerinden çözmesini iste', (c) => { c.h.closeness(pid(c), -1); return out(c, { hap: 0 }, `${nn(c)} said, "oh, I'll tell them," and then spent three evenings finding a way to tell them. On day nine, the suitcases rolled out. The silence in the house was lovely and a little rude.`, `${nn(c)} "ha, ben söylerim" dedi ve üç akşamı nasıl söyleyeceğini bulmakla geçirdi. Dokuzuncu günde bavullar yuvarlandı. Evdeki sessizlik güzeldi ve biraz kaba.`); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_inlaws_comment',
    minAge: 22,
    maxAge: 62,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['married'],
    setup: setPartner,
    title: (c) => c.t('A remark from the in-laws', 'Kayın tarafından bir laf'),
    text: (c) => c.t(`"It's lovely. It's just... ${nn(c)} used to eat so much better." It is said over your cooking, at your table, with a smile. The room goes very quiet. A fork scrapes.`, `"Çok güzel. Sadece... ${nn(c)} eskiden çok daha iyi beslenirdi." Senin yemeğin üzerine, senin masanda, gülümsemeyle söyleniyor. Oda çok sessizleşiyor. Bir çatal ses çıkarıyor.`),
    choices: [
      ch('smile', 'Smile and take a second helping', 'Gülümse ve ikinci porsiyonu al', (c) => out(c, { hap: -1 }, 'You ate with enormous dignity. The compliment you did not give back was louder than the one they did not give.', 'Muazzam bir vakarla yedin. Geri vermediğin iltifat, vermedikleri iltifattan daha gürültülüydü.')),
      ch('defend', 'Calmly say it\'s the best food in the house', 'Sakince evin en güzel yemeği olduğunu söyle', (c) => { c.h.closeness(pid(c), 3); return out(c, { hap: 2 }, `Before you could answer, ${nn(c)} said, "It's my favourite meal in the world." The in-laws had a lot of water.`, `Sen cevap veremeden ${nn(c)} "Dünyadaki en sevdiğim yemek" dedi. Kayın tarafı bol bol su içti.`); }, { tone: 'good' }),
      ch('serve', 'Offer to cook their favourite next time', 'Bir dahaki sefere sevdiklerini pişirmeyi teklif et', (c) => { c.h.closeness(pid(c), 2); return out(c, { hap: -1, sma: 1 }, 'You sent a recipe you had no right to know. The next dinner was a negotiation disguised as a stew. Everyone left a little more understood, and not at all less hungry.', 'Bilmeye hakkın olmayan bir tarif gönderdin. Sonraki akşam yemeği, güveç kılığına girmiş bir müzakereydi. Herkes biraz daha anlaşılmış, hiç daha az aç olmadan ayrıldı.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_inlaws_loan',
    minAge: 28,
    maxAge: 62,
    weight: 45,
    cooldown: 7,
    maxPerLife: 1,
    needs: ['married'],
    setup: setPartner,
    title: (c) => c.t('A loan request', 'Borç talebi'),
    text: (c) => c.t(`${nn(c)}'s family has a "small, short, completely temporary" problem and needs a loan. ${nn(c)} looks at you with the eyes of someone who has been asked this before, and has answered yes before.`, `${gen(nn(c))} ailesinin "küçük, kısa, tamamen geçici" bir sorunu var ve borç gerekiyor. ${nn(c)} sana daha önce de bu soru sorulmuş ve daha önce de evet demiş birinin gözleriyle bakıyor.`),
    choices: [
      ch('lend', 'Lend the money', 'Parayı ver', (c) => { spend(c, 2000); c.h.closeness(pid(c), 7); return out(c, { hap: 1 }, 'The money went and (in time) half of it came back, with a jar of pickles. The pickles were excellent. The other half is a tradition.', 'Para gitti ve zamanla yarısı turşu kavanozuyla birlikte geri geldi. Turşular mükemmeldi. Diğer yarısı bir gelenek.'); }, { requires: can(2000), requiresLabel: 'Not enough money' }),
      ch('small', 'Lend a smaller amount, with a date', 'Daha küçük bir miktar, tarihli olarak ver', (c) => { spend(c, 500); c.h.closeness(pid(c), 3); return out(c, { hap: 1, sma: 1 }, 'You wrote a friendly, clear note: amount, date, no drama. They returned it on time and were quietly offended, then quietly grateful.', 'Dostça, net bir not yazdın: miktar, tarih, drama yok. Zamanında geri ödediler; sessizce alındılar, sonra sessizce minnettar oldular.'); }, { tone: 'good', requires: can(500), requiresLabel: 'Not enough money' }),
      ch('no', 'Say no', 'Hayır de', (c) => { c.h.closeness(pid(c), -9); return out(c, { hap: -3 }, `${nn(c)} said "I understand" in the tone of a person who did not. The weekend dinner at their house is now eaten in a very polite silence.`, `${nn(c)} "anlıyorum" dedi, anlamayan birinin tonuyla. Onların evindeki hafta sonu yemeği artık çok kibar bir sessizlikte yeniyor.`); }, { tone: 'bad' }),
    ],
  },
];

// ------------------------------------------------------------------ marriage and couples

const couples: EventDef[] = [
  {
    ...B,
    id: 'base.lv_marr_quiet',
    minAge: 27,
    maxAge: 80,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['married'],
    when: (c) => yearsTogether(c) >= 3 && noMourn(c),
    setup: setPartner,
    title: (c) => c.t('When did we last talk?', 'En son ne zaman konuştuk?'),
    text: (c) => c.t(`At dinner you realise that you and ${nn(c)} have spent three weeks discussing bins, bills and who is picking up whom. Nothing is wrong. That is the problem: nothing is anything.`, `Akşam yemeğinde ${wth(nn(c))} üç haftadır çöpleri, faturaları ve kimin kimi alacağını konuştuğunuzu fark ediyorsun. Yanlış giden bir şey yok. Sorun da bu: hiçbir şey hiçbir şey değil.`),
    choices: [
      ch('therapy', 'Suggest a counsellor', 'Bir danışman öner', (c) => {
        spend(c, 300);
        c.h.closeness(pid(c), 9);
        return out(c, { hap: 3, sma: 1 }, `Six sessions and a worksheet with the terrifying title "Things I Needed". You cried in the car park, held hands in the lift and sat at the same end of the sofa for the first time in a year.`, `Altı seans ve "İhtiyacım Olanlar" gibi ürkütücü bir başlığı olan bir çalışma kâğıdı. Otoparkta ağladın, asansörde el ele tutuştun ve bir yıl sonra ilk kez kanepenin aynı ucuna oturdunuz.`);
      }, { tone: 'good', requires: can(300), requiresLabel: 'Not enough money' }),
      ch('weekend', 'Plan a weekend away, phones off', 'Telefonsuz bir hafta sonu kaçamağı planla', (c) => {
        spend(c, 500);
        c.h.closeness(pid(c), 8);
        return out(c, { hap: 5 }, 'A cabin, a board game neither of you understood, and the best dinner in five years, eaten slowly with candlelight and the strong smell of damp wood.', 'Bir kulübe, ikinizin de anlamadığı bir masa oyunu ve beş yılın en iyi akşam yemeği; mum ışığında, nemli odun kokusuyla yavaş yavaş yendi.');
      }, { tone: 'good', requires: can(500), requiresLabel: 'Not enough money' }),
      ch('ignore', 'Tell yourself all marriages go quiet', 'Her evliliğin sessizleştiğini kendine söyle', (c) => { c.h.closeness(pid(c), -6); return out(c, { hap: -3 }, 'It may be true. The silence got comfortable and then heavier, until one day you passed each other in the hall and said "sorry" like strangers.', 'Doğru olabilir. Sessizlik rahat, sonra ağır oldu; bir gün koridorda karşılaşıp yabancılar gibi "pardon" dediniz.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_marr_money',
    minAge: 24,
    maxAge: 70,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['married'],
    setup: setPartner,
    title: (c) => c.t('The bank statement', 'Banka ekstresi'),
    text: (c) => c.t(`${nn(c)} holds up the statement. There is a line that says "ONLINE PURCHASE – ${cashTxt(c, 380)}". Neither of you remembers it. Both of you suspect the other. The statement trembles with justice.`, `${nn(c)} ekstreyi kaldırıyor. "ONLINE ALIŞVERİŞ – ${cashTxt(c, 380)}" yazan bir satır var. İkiniz de hatırlamıyorsunuz. İkiniz de diğerinden şüpheleniyorsunuz. Ekstre adaletle titriyor.`),
    choices: [
      ch('own', 'Remember, and own up', 'Hatırla ve kabul et', (c) => { spend(c, 380); c.h.closeness(pid(c), 3); return out(c, { hap: 0 }, `It was a blender. A very specific, very powerful blender. ${nn(c)} used it by Thursday, and said nothing about it for a week.`, `Bir blenderdi. Çok özel, çok güçlü bir blender. ${nn(c)} perşembeye kadar kullandı ve bir hafta boyunca hiçbir şey söylemedi.`); }),
      ch('fight', 'Fight about it', 'Bu yüzden kavga et', (c) => { c.h.closeness(pid(c), -8); return out(c, { hap: -4 }, 'The fight began with the statement and ended with something somebody said at a wedding years ago. The statement turned out to be a duplicate error, refunded in four days.', 'Kavga ekstreyle başladı, yıllar önce bir düğünde söylenmiş bir şeyle bitti. Ekstre mükerrer bir hataymış, dört günde iade edildi.'); }, { tone: 'bad' }),
      ch('budget', 'Sit down and make a budget together', 'Oturup birlikte bütçe yapın', (c) => { c.h.closeness(pid(c), 6); c.h.money(wage(c, 250)); return out(c, { hap: 2, sma: 2 }, 'A colour-coded spreadsheet, a "fun money" line for each of you, and the discovery of four subscriptions nobody uses. Saved the equivalent of a decent holiday.', 'Renk kodlu bir tablo, ikinizin de "eğlence parası" satırı ve kimsenin kullanmadığı dört aboneliğin keşfi. İyi bir tatile denk bir tasarruf.'); }, { tone: 'good' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_marr_chores',
    minAge: 20,
    maxAge: 75,
    weight: 40,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['cohabiting'],
    setup: setPartner,
    title: (c) => c.t('The chore chart', 'İş bölümü tablosu'),
    text: (c) => c.t(`${nn(c)} has created a laminated chart called "Home Division of Labour". There are colours. There is a column called "invisible work". Your name is in the column called "bins", which you consider an insult to a lifetime of dishes.`, `${nn(c)} "Ev İş Bölümü" adında plastik kaplı bir tablo hazırlamış. Renkler var. "Görünmeyen emek" adlı bir sütun var. Adın "çöpler" sütununda; bunu bir ömür bulaşığa hakaret sayıyorsun.`),
    choices: [
      ch('accept', 'Accept it, with edits', 'Düzenlemelerle kabul et', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 1, sma: 1 }, 'You traded the bins for the laundry and cleared up the invisible column. The chart is now on the fridge and the fridge has never been so well run.', 'Çöpleri çamaşırla değiştirip görünmeyen sütunu açıklığa kavuşturdun. Tablo buzdolabında ve buzdolabı hiç bu kadar iyi yönetilmedi.'); }, { tone: 'good' }),
      ch('protest', 'Protest on principle', 'İlkesel olarak itiraz et', (c) => { c.h.closeness(pid(c), -5); return out(c, { hap: -2 }, 'You gave a speech on the importance of spontaneity in household work. The bins sat there for eleven days. They have a very strong opinion of you.', 'Ev işlerinde kendiliğindenliğin önemi üzerine bir konuşma yaptın. Çöpler on bir gün orada durdu. Senin hakkında çok güçlü bir görüşleri var.'); }),
      ch('hire', 'Pay for a cleaner twice a month', 'Ayda iki kez temizlikçi tut', (c) => { spend(c, 150); c.h.closeness(pid(c), 4); return out(c, { hap: 3 }, 'The chart lost an entire column and gained a lamp on a clean shelf. A large number of arguments ended in a single month.', 'Tablo koca bir sütun kaybetti, temiz bir rafa lamba kazandı. Bir ayda çok sayıda tartışma sona erdi.'); }, { requires: can(150), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_marr_apart',
    minAge: 30,
    maxAge: 70,
    weight: 50,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['married'],
    when: (c) => yearsTogether(c) >= 5 && noMourn(c),
    setup: setPartner,
    title: (c) => c.t(`${nn(c)} asks for some time apart`, `${nn(c)} biraz ayrı kalmak istiyor`),
    text: (c) => c.t(`${nn(c)} puts the kettle on, which never happens before bad news. "I don't want to leave. I just want a few months in my sister's spare room to hear myself think." The kettle boils for a long time.`, `${nn(c)} su ısıtıcısını açıyor; kötü haberlerden önce hiç olmayan bir şey. "Gitmek istemiyorum. Sadece kendi düşüncelerimi duyabilmek için birkaç ay kardeşimin boş odasında kalmak istiyorum." Su ısıtıcısı uzun uzun kaynıyor.`),
    choices: [
      ch('agree', 'Agree, and use the time well', 'Kabul et ve zamanı iyi kullan', (c) => {
        if (c.rng.chance(0.6)) { c.h.closeness(pid(c), 10); return out(c, { hap: 1, hea: 2 }, `Three months of weekly dinners, long walks and your own breathing. ${nn(c)} came back with a bag and a better laugh. You had found yours.`, `Üç ay haftalık akşam yemekleri, uzun yürüyüşler ve kendi nefesin. ${nn(c)} bir çanta ve daha iyi bir kahkahayla döndü. Seninkini de bulmuştun.`); }
        return split(c, pid(c), `The months stretched. Nobody was sure who stopped calling first. Eventually a letter from a lawyer arrived, polite and sad.`, `Aylar uzadı. Kimin önce aramayı bıraktığından kimse emin değil. Sonunda bir avukattan nazik ve üzgün bir mektup geldi.`);
      }, { badge: 'Risky' }),
      ch('refuse', 'Refuse: "we fix it together"', 'Reddet: "birlikte düzeltiriz"', (c) => {
        if (c.rng.chance(0.55)) { c.h.closeness(pid(c), 6); return out(c, { hap: 2 }, `${nn(c)} sat down again. You said all of it, the good and the bad, until the kettle clicked twice. It was a long night, and a new beginning.`, `${nn(c)} tekrar oturdu. İyiyi de kötüyü de hepsini söyledin; su ısıtıcısı iki kez tık yapana kadar. Uzun bir geceydi ve yeni bir başlangıç.`); }
        c.h.closeness(pid(c), -10);
        return out(c, { hap: -5 }, `${nn(c)} left the next morning with one bag and, as an act of cruelty, the good umbrella. It is raining.`, `${nn(c)} ertesi sabah tek bir çanta ve, bir zalimlik olarak, iyi şemsiyeyle çıktı. Yağmur yağıyor.`);
      }, { badge: 'Risky' }),
      ch('couns', 'Offer counselling first', 'Önce danışmanlığı öner', (c) => { spend(c, 400); c.h.closeness(pid(c), 5); return out(c, { hap: 1, sma: 1 }, 'Eight sessions. By the fifth, the same sentence kept coming up: "I never said, because I thought you knew". You are using fewer words and meaning more of them.', 'Sekiz seans. Beşinciye kadar aynı cümle hep geldi: "Söylemedim çünkü bildiğini sanıyordum". Daha az kelime kullanıyor ve her biriyle daha çok şey kastediyorsunuz.'); }, { requires: can(400), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_couple_roadtrip',
    minAge: 20,
    maxAge: 75,
    weight: 22,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['partnered'],
    setup: setPartner,
    title: (c) => c.t('The navigation argument', 'Navigasyon kavgası'),
    text: (c) => c.t(`A three-hour drive, one map app and two people who each know a better way. ${nn(c)} says "turn left". The app says "turn right". The road says nothing, which is the most helpful thing said all day.`, `Üç saatlik bir yol, bir harita uygulaması ve her biri daha iyi bir yol bildiğini sanan iki kişi. ${nn(c)} "sola dön" diyor. Uygulama "sağa dön" diyor. Yol hiçbir şey demiyor; bu, bütün günün en yardımcı sözü.`),
    choices: [
      ch('app', 'Trust the app', 'Uygulamaya güven', (c) => { c.h.closeness(pid(c), -2); return out(c, { hap: 0 }, 'The app took you to a field. A lovely field. You had a picnic on the car and decided not to mention the word "told".', 'Uygulama sizi bir tarlaya götürdü. Güzel bir tarlaya. Arabanın kaputunda piknik yaptınız ve "söylemiştim" kelimesini anmamaya karar verdiniz.'); }),
      ch('partner', 'Trust your partner', 'Partnerine güven', (c) => { c.h.closeness(pid(c), 5); return out(c, { hap: 2 }, `${nn(c)}'s way was faster by eleven minutes and mentioned it nine times. You took the compliment out of the glove box and ate it with the sandwich.`, `${gen(nn(c))} yolu on bir dakika daha hızlıydı ve bunu dokuz kez anmak zorunda kaldı. İltifatı torpido gözünden çıkarıp sandviçle yedin.`); }, { tone: 'good' }),
      ch('stop', 'Stop at the next café and decide over cake', 'Sonraki kafede dur ve pastayla karar ver', (c) => { spend(c, 20); c.h.closeness(pid(c), 6); return out(c, { hap: 3 }, 'Two coffees, one large cake, a shared map and the ugly truth that you were both slightly wrong. The rest of the drive was unusually cheerful.', 'İki kahve, bir büyük pasta, ortak bir harita ve ikinizin de biraz yanlış olduğunuza dair çirkin gerçek. Yolun geri kalanı olağandışı neşeliydi.'); }, { tone: 'good', requires: can(20), requiresLabel: 'Not enough money' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_partner_gift',
    minAge: 18,
    maxAge: 80,
    weight: 22,
    cooldown: 5,
    maxPerLife: 2,
    needs: ['partnered'],
    setup: setPartner,
    title: (c) => c.t(`${nn(c)}'s birthday present`, `${gen(nn(c))} doğum günü hediyesi`),
    text: (c) => c.t(`${nn(c)} said, "I don't need anything", in the voice that means "I have already composed a list in my head and will judge the result". You have a week and a lot of fear.`, `${nn(c)} "bir şeye ihtiyacım yok" dedi; bu, "kafamda zaten bir liste yaptım ve sonucu yargılayacağım" demek. Bir haftan ve çok korkun var.`),
    choices: [
      ch('exp', 'Plan an evening with all their favourites', 'En sevdiği her şeyle bir akşam planla', (c) => { spend(c, 100); c.h.closeness(pid(c), 8); return out(c, { hap: 4 }, 'Their favourite food, their favourite film, a cake with a spelling mistake. They cried at the cake. They say the mistake is the best part.', 'En sevdiği yemek, en sevdiği film, yazım hatası olan bir pasta. Pastada ağladı. Hatanın en güzel kısmı olduğunu söylüyor.'); }, { tone: 'good', requires: can(100), requiresLabel: 'Not enough money' }),
      ch('tech', 'Buy the gadget they mentioned once', 'Bir kez bahsettiği aleti satın al', (c) => {
        spend(c, 250);
        if (c.rng.chance(0.55)) { c.h.closeness(pid(c), 9); return out(c, { hap: 4 }, `${nn(c)} stared at the box with real emotion: "You listened." It was the most romantic sentence of the year, and it was about a vacuum cleaner.`, `${nn(c)} kutuya gerçek bir duyguyla baktı: "Beni dinlemişsin." Yılın en romantik cümlesiydi ve bir elektrikli süpürge hakkındaydı.`); }
        c.h.closeness(pid(c), -2);
        return out(c, { hap: -2 }, `"Oh," said ${nn(c)}. "I meant the other one." There was an other one. It is the same price. You keep a straight face and a receipt.`, `${nn(c)} "ha," dedi. "Ben diğerini kastetmiştim." Başka bir tane varmış. Aynı fiyatta. Ciddi bir yüz ve fişi sakladın.`);
      }, { badge: 'Risky', requires: can(250), requiresLabel: 'Not enough money' }),
      ch('forget', 'Forget it until the day itself', 'Günün kendisine kadar unut', (c) => { spend(c, 15); c.h.closeness(pid(c), -5); return out(c, { hap: -2 }, 'You ran to the petrol station for flowers and a card with a bear on it. The bear said "Sorry". The card had a previous owner\'s name on it.', 'Çiçek ve üzerinde ayı olan bir kart için benzinliğe koştun. Ayı "Özür dilerim" diyordu. Kartın üzerinde önceki sahibinin adı vardı.'); }, { tone: 'bad' }),
    ],
  },
];

// ------------------------------------------------------------------ after a split

const afterSplit: EventDef[] = [
  {
    ...B,
    id: 'base.lv_post_first_night',
    minAge: 20,
    maxAge: 75,
    weight: 300,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    when: (c) => recentEx(c, 2).length > 0,
    setup: (c) => {
      c.vars.pid = recentEx(c, 2)[0].person.id;
    },
    title: (c) => c.t('The first quiet evening', 'İlk sessiz akşam'),
    text: (c) => c.t(`It has been a while since ${nn(c)}. You hear the fridge hum, the neighbour's tap, and your own heart doing what it can. The sofa is awfully big.`, `${abl(nn(c))} ayrılalı bir süre oldu. Buzdolabının uğultusunu, komşunun musluğunu ve kendi kalbinin elinden geleni yapışını duyuyorsun. Koltuk korkunç derecede büyük.`),
    choices: [
      ch('friend', 'Call a friend and talk until midnight', 'Bir arkadaşını ara ve gece yarısına kadar konuş', (c) => { c.h.relatives('friend').slice(0, 2).forEach((r) => c.h.closeness(r.person.id, 4)); return out(c, { hap: 3 }, 'Three hours of laughing and crying, in a ratio you would not have predicted. By the end the flat had a voice again, a little hoarse, but yours.', 'Üç saat gülme ve ağlama, beklemeyeceğin bir oranda. Sonunda evin yeniden bir sesi vardı; biraz boğuk, ama senin.'); }, { tone: 'good' }),
      ch('reno', 'Rearrange every piece of furniture', 'Bütün mobilyaları yeniden yerleştir', (c) => out(c, { hap: 2, hea: 1 }, 'At 1 a.m. you moved the sofa, the table and a wardrobe by yourself. The room felt like a different country. A sore back is a small fee for a new country.', 'Gece birde koltuğu, masayı ve bir gardırobu tek başına taşıdın. Oda başka bir ülke gibi hissettirdi. Ağrıyan bir sırt, yeni bir ülke için küçük bir bedel.')),
      ch('wallow', 'Wallow with ice cream and old messages', 'Dondurma ve eski mesajlarla kendini kaybet', (c) => out(c, { hap: -4, hea: -1 }, 'You read it all, from the beginning, and made the classic mistake of laughing at the early parts. You found the bottom of the tub, and then the bottom of yourself.', 'Hepsini en baştan okudun ve baştaki kısımlara gülme klasik hatasını yaptın. Kovanın dibini, sonra kendi dibini buldun.'), { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_post_photos',
    minAge: 18,
    maxAge: 70,
    weight: 250,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => recentEx(c, 4).length > 0,
    setup: (c) => {
      c.vars.pid = recentEx(c, 4)[0].person.id;
    },
    title: (c) => c.t('Two thousand photos', 'İki bin fotoğraf'),
    text: (c) => c.t(`Your phone has an album called "Us". It has 2,114 pictures. ${nn(c)} is in most of them, laughing in a way you now hold against them. A prompt: "Delete this album?"`, `Telefonunda "Biz" adlı bir albüm var. İçinde 2.114 fotoğraf. Çoğunda ${nn(c)} var; artık ona karşı tuttuğun bir şekilde gülüyor. Bir soru: "Bu albüm silinsin mi?"`),
    choices: [
      ch('all', 'Delete the lot', 'Hepsini sil', (c) => out(c, { hap: 1 }, 'A bar filled slowly, and then it was empty. The phone has got faster. You feel weirdly proud and slightly ill.', 'Bir çubuk yavaşça doldu, sonra boş kaldı. Telefon hızlandı. Tuhaf bir gurur ve hafif bir bulantı hissediyorsun.')),
      ch('ten', 'Keep the best ten, delete the rest', 'En iyi on tanesini sakla, gerisini sil', (c) => out(c, { hap: 3, sma: 1 }, 'You kept the ones where you look like yourself, not the ones where you look like a couple. A good rule for any photo.', 'Çift gibi göründüğün değil, kendin gibi göründüğün fotoğrafları sakladın. Her fotoğraf için iyi bir kural.'), { tone: 'good' }),
      ch('keep', 'Leave it for another year', 'Bir yıl daha bırak', (c) => out(c, { hap: -2 }, 'The album sits there, with its own quiet gravity. Every "On this day..." memory is a small ambush.', 'Albüm kendi sessiz yerçekimiyle orada duruyor. Her "Bugün bir yıl önce..." anısı küçük bir pusu.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_post_sides',
    minAge: 18,
    maxAge: 70,
    weight: 300,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => recentEx(c, 3).length > 0 && hasFriend(c),
    setup: (c) => {
      c.vars.pid = recentEx(c, 3)[0].person.id;
      c.vars.fr = c.rng.pick(friendsOf(c)).person.id;
    },
    title: (c) => c.t('Friends choose sides', 'Arkadaşlar taraf seçiyor'),
    text: (c) => c.t(`${nn(c, 'fr')} has been seen having coffee with ${nn(c)}. It was "just a coffee", and it felt like a verdict. They say it won't change anything. It already has.`, `${nn(c, 'fr')} ${wth(nn(c))} kahve içerken görülmüş. "Sadece bir kahve"ymiş ama bir hüküm gibi hissettirdi. Hiçbir şeyin değişmeyeceğini söylüyorlar. Zaten değişti.`),
    choices: [
      ch('talk', 'Say it kindly: "it stings a bit"', 'Nazikçe söyle: "biraz canımı yaktı"', (c) => { near(c, 'fr', 5); return out(c, { hap: 2 }, `${nn(c, 'fr')} listened and said "You're right, I didn't think". The next coffee was with you, with no verdict at all.`, `${nn(c, 'fr')} dinledi ve "haklısın, düşünmedim" dedi. Bir sonraki kahve seninleydi, hiç hüküm olmadan.`); }, { tone: 'good' }),
      ch('cold', 'Go cold on them', 'Soğuk davran', (c) => { near(c, 'fr', -14); return out(c, { hap: -3 }, 'You replied with thumbs and then not at all. The friendship now exists only in your contacts and in your pride.', 'Başparmakla, sonra hiç cevap vermedin. Arkadaşlık artık yalnızca rehberinde ve gururunda var.'); }, { tone: 'bad' }),
      ch('allow', 'Pretend it\'s fine', 'Sorun yokmuş gibi davran', (c) => { near(c, 'fr', 1); return out(c, { hap: -2 }, 'You said "of course, no problem" through a smile that could have cut glass. At home, the cushion had a bad evening.', 'Camı kesebilecek bir gülümsemeyle "tabii, sorun yok" dedin. Evde yastık kötü bir akşam geçirdi.'); }),
    ],
  },
];

// ------------------------------------------------------------------ love late in life, and after losing a partner

const late: EventDef[] = [
  {
    ...B,
    id: 'base.lv_late_neighbour',
    minAge: 55,
    maxAge: 85,
    weight: 55,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    setup: (c) => newDate(c, 55, 88),
    title: (c) => c.t(`${nn(c)} next door knocks`, `Yan kapıdaki ${nn(c)} kapıyı çalıyor`),
    text: (c) => c.t(`${nn(c)} stands there with a plate of something warm: "I made far too much again. Would you like to help?" You have not been asked for help with a plate of food in a very long time, and your hair is a mess.`, `${nn(c)} elinde sıcak bir şey olan bir tabakla kapıda: "Yine fazla yaptım. Yardım eder misin?" Çok uzun zamandır yemek tabağı için yardım istenmemişti ve saçların dağınık.`),
    choices: [
      ch('invite', 'Invite them in', 'İçeri davet et', (c) => {
        if (lucky(c, 0.5) && startDating(c, 'pid', 55)) return out(c, { hap: 6 }, `One plate became a standing Tuesday dinner. By the autumn you walked through the garden gate without knocking. People on the street have started to wink.`, 'Bir tabak, her salı yemeğine dönüştü. Sonbahara kadar bahçe kapısından çalmadan geçmeye başladın. Sokaktaki insanlar göz kırpmaya başladı.');
        return out(c, { hap: 3 }, 'A lovely evening of stories and plum cake. Not romance, but company, which at this age is a close cousin.', 'Hikâyeler ve erik keki eşliğinde güzel bir akşam. Romantizm değil ama arkadaşlık; bu yaşta yakın bir kuzen.');
      }, { tone: 'good' }),
      ch('thanks', 'Thank them at the door', 'Kapıda teşekkür et', (c) => out(c, { hap: -1 }, 'You took the plate and said thank you, stood in the hallway and ate it with the door shut. It was delicious. You thought about it for a week.', 'Tabağı alıp teşekkür ettin, koridorda kapıyı kapatıp yedin. Lezzetliydi. Bir hafta boyunca düşündün.')),
      ch('return', 'Return the plate with a baked present', 'Tabağı fırından çıkmış bir hediyeyle geri ver', (c) => { spend(c, 15); if (c.rng.chance(0.3) && startDating(c, 'pid', 50)) return out(c, { hap: 5 }, `${nn(c)} said "Now we are in a pie war." A pie war is the best sort of war, for people who like pie.`, `${nn(c)} "Şimdi bir turta savaşındayız" dedi. Turta savaşı, turtayı sevenler için en güzel savaş.`); return out(c, { hap: 2 }, 'The plate came back and forth for months, each time with something heavier on it. A friendship of cakes. It was a lot.', 'Tabak aylarca gidip geldi, her seferinde üstünde daha ağır bir şeyle. Pastalardan bir dostluk. Bayağı güzeldi.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_late_dance',
    minAge: 58,
    maxAge: 85,
    weight: 55,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['single'],
    setup: (c) => newDate(c, 55, 88),
    title: (c) => c.t('The afternoon dance', 'Öğleden sonra dansı'),
    text: (c) => c.t(`The community hall has a dance every Thursday: a band of six, a table of sandwiches and a whole room of people who have stopped caring. ${nn(c)} holds out a hand across the floor. "You look like someone who knows how."`, `Mahalle salonunda her perşembe bir dans var: altı kişilik bir grup, bir sandviç masası ve umursamayı bırakmış koca bir oda dolusu insan. ${nn(c)} pistin karşısından elini uzatıyor. "Nasıl yapılacağını bilen biri gibi görünüyorsun."`),
    choices: [
      ch('dance', 'Say yes, and ignore your knees', 'Evet de ve dizlerini görmezden gel', (c) => {
        if (lucky(c, 0.5) && startDating(c, 'pid', 55)) return out(c, { hap: 6, hea: 1 }, 'You did not know how. You did it anyway, joyfully and wrongly. Every Thursday since, the band plays a slow one at 3 p.m., and looks at the two of you.', 'Nasıl yapıldığını bilmiyordun. Yine de yaptın, neşeyle ve yanlış. O günden beri her perşembe grup saat üçte yavaş bir parça çalıyor ve ikinize bakıyor.');
        return out(c, { hap: 4, hea: 1 }, 'Three dances, one near-fall, two sandwiches. You went home with sore feet and a straighter back. Your knees have filed a note.', 'Üç dans, bir düşmeye yakın an, iki sandviç. Ağrıyan ayaklarla ama daha dik bir sırtla eve gittin. Dizlerin bir not bıraktı.');
      }, { tone: 'good' }),
      ch('watch', 'Stay on your chair and tap along', 'Sandalyende kal ve ritim tut', (c) => out(c, { hap: 1 }, 'You watched the dancers with the pleasure of someone at the cinema. The sandwich was egg. You looked at your hands, not unhappily.', 'Dansçıları sinemadaki biri gibi zevkle izledin. Sandviç yumurtalıydı. Ellerine baktın, mutsuz değil.')),
      ch('teach', 'Offer to teach them something instead', 'Bunun yerine ona bir şey öğretmeyi teklif et', (c) => { if (c.rng.chance(0.3) && startDating(c, 'pid', 50)) return out(c, { hap: 5, sma: 1 }, `You taught ${nn(c)} to play cards; ${heK(c, 'pid')} taught you to waltz. You both cheat at the first, and are very bad at the second.`, `${dat(nn(c))} kâğıt oynamayı öğrettin; o sana vals yapmayı. İlkinde ikiniz de hile yapıyorsunuz, ikincisinde ise çok kötüsünüz.`); return out(c, { hap: 2, sma: 1 }, 'A card game became a regular afternoon, and a regular afternoon became something to look forward to. It is a gift, at any age.', 'Bir kâğıt oyunu düzenli bir öğleden sonra oldu, düzenli bir öğleden sonra da sabırsızlıkla beklenecek bir şey. Her yaşta bir armağan.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_late_kids',
    minAge: 52,
    maxAge: 88,
    weight: 130,
    cooldown: 7,
    maxPerLife: 1,
    needs: ['partnered', 'child'],
    when: (c) => dating(c) && yearsTogether(c) <= 4,
    setup: setDating,
    title: (c) => c.t(`Your children meet ${nn(c)}`, `Çocukların ${acc(nn(c))} tanıyor`),
    text: (c) => c.t(`You have told your children about ${nn(c)}. One is delighted. One is "just asking questions". One has gone silent in a way that has a lawyer in it. The family chat has had forty messages and no mention of a name.`, `Çocuklarına ${abl(nn(c))} bahsettin. Biri çok sevindi. Biri "sadece soru soruyor". Biri içinde avukat olan bir şekilde sessizleşti. Aile sohbetinde kırk mesaj var ve hiçbirinde bir isim geçmiyor.`),
    choices: [
      ch('dinner', 'Invite them all to dinner', 'Hepsini yemeğe çağır', (c) => {
        spend(c, 80);
        c.h.relatives('child').forEach((r) => c.h.closeness(r.person.id, 2));
        if (c.rng.chance(0.6)) { c.h.closeness(pid(c), 6); return out(c, { hap: 5 }, `Your youngest asked ${nn(c)} for the salt, by name. By dessert there was an invitation to a birthday. The quiet one hugged you at the door, hard.`, `En küçük çocuğun ${nn(c)} adıyla seslenerek tuzu istedi. Tatlıda bir doğum günü daveti vardı. Sessiz kalan çocuğun kapıda sana sıkıca sarıldı.`); }
        c.h.closeness(pid(c), -2);
        return out(c, { hap: -2 }, `The evening ended at nine. One child left early. ${nn(c)} said afterwards: "They love you. It will take time." You nodded, and quietly pinned that sentence to the fridge in your mind.`, `Akşam dokuzda bitti. Bir çocuk erken ayrıldı. ${nn(c)} sonrasında: "Seni seviyorlar. Zaman alacak." dedi. Başını salladın ve bu cümleyi zihninde buzdolabına iliştirdin.`);
      }, { badge: 'Risky', requires: can(80), requiresLabel: 'Not enough money' }),
      ch('wait', 'Give them time, no pressure', 'Zaman ver, baskı yapma', (c) => { c.h.relatives('child').forEach((r) => c.h.closeness(r.person.id, 3)); return out(c, { hap: 1 }, 'You said nothing more for a month. The silent child called on a Sunday and asked, awkwardly, if they could "see the new coat" you bought. It was a start.', 'Bir ay boyunca başka bir şey söylemedin. Sessiz çocuk bir pazar günü aradı ve beceriksizce aldığın "yeni paltoyu görebilir mi" diye sordu. Bir başlangıçtı.'); }, { tone: 'good' }),
      ch('stand', 'Tell them it is your life', '"Bu benim hayatım" de', (c) => { c.h.relatives('child').forEach((r) => c.h.closeness(r.person.id, -6)); c.h.closeness(pid(c), 4); return out(c, { hap: 0 }, 'It was true and well said, and the room went very still. You were right, and your Sunday phone has been very quiet since.', 'Doğruydu ve iyi söylenmişti; oda çok sessizleşti. Haklıydın ve pazar telefonun o günden beri çok sessiz.'); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_late_apart',
    minAge: 58,
    maxAge: 88,
    weight: 55,
    cooldown: 6,
    maxPerLife: 1,
    needs: ['apart'],
    when: (c) => dating(c) && yearsTogether(c) >= 2,
    setup: setDating,
    title: (c) => c.t(`${nn(c)} suggests living together`, `${nn(c)} birlikte yaşamayı öneriyor`),
    text: (c) => c.t(`"We spend every evening at one flat or the other," says ${nn(c)}, "and we both keep a toothbrush in two places. It's silly." You like your armchair. You like your way of making coffee. You like ${nn(c)} more than either.`, `"Her akşam ya birinin ya ötekinin evindeyiz," diyor ${nn(c)}, "ikimizin de iki yerde diş fırçası var. Saçma." Koltuğunu seviyorsun. Kahve yapış tarzını seviyorsun. ${acc(nn(c))} bunların ikisinden de çok seviyorsun.`),
    choices: [
      ch('moveIn', 'Move in together', 'Birlikte yaşayın', (c) => { c.h.flag('moved_in'); c.h.closeness(pid(c), 12); return out(c, { hap: 6 }, 'The second armchair was donated to a charity shop, and you now argue about the coffee in person. It is wonderful, and takes up the whole kitchen.', 'İkinci koltuk bir yardım dükkânına bağışlandı ve kahvenin tartışmasını artık yüz yüze yapıyorsunuz. Harika ve koca mutfağı kaplıyor.'); }, { tone: 'good' }),
      ch('apart', 'Stay in two homes, together', 'İki evde, birlikte kalın', (c) => { c.h.closeness(pid(c), 6); return out(c, { hap: 4 }, 'Two keys, two coffee machines, one standing dinner. Everyone says it is the sensible arrangement. You are quietly smug about it.', 'İki anahtar, iki kahve makinesi, bir sabit akşam yemeği. Herkes bunun mantıklı düzen olduğunu söylüyor. Sessizce buna havalısın.'); }, { tone: 'good' }),
      ch('no', 'Say you need your own space', 'Kendi alanına ihtiyacın olduğunu söyle', (c) => { c.h.closeness(pid(c), -7); return out(c, { hap: -3 }, `${nn(c)} said "of course", and meant it, and was a little hurt. It took a month of warm evenings to reach the old ease.`, `${nn(c)} "tabii" dedi ve samimi söyledi ama biraz kırıldı. Eski rahatlığa varmak bir ay sıcak akşam aldı.`); }),
    ],
  },
  {
    ...B,
    id: 'base.lv_late_marry',
    minAge: 58,
    maxAge: 88,
    weight: 50,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['partnered'],
    when: (c) => dating(c) && yearsTogether(c) >= 2,
    setup: setDating,
    title: (c) => c.t(`${nn(c)} asks you to marry`, `${nn(c)} evlenme teklif ediyor`),
    text: (c) => c.t(`"I am too old to be anyone's fiancé," says ${nn(c)}, holding a ring made of a curtain hook and a surprising amount of confidence. "Will you marry me anyway?" There is a long pause in which a bird says its piece.`, `"Kimsenin nişanlısı olamayacak kadar yaşlıyım," diyor ${nn(c)}, perde kancasından yapılmış ve şaşırtıcı miktarda özgüven taşıyan bir yüzük tutarak. "Yine de benimle evlenir misin?" Bir kuşun lafını söylediği uzun bir sessizlik oluyor.`),
    choices: [
      ch('yes', 'Say yes', 'Evet de', (c) => { c.h.setKind(pid(c), 'spouse'); c.h.achieve('married'); return out(c, { hap: 9 }, `Fourteen guests, a registry office and a ring from an actual jeweller, bought the day after. At the table, someone said, "It's never too late", and ${nn(c)} said, "Well, it's late, but it's not too late."`, `On dört davetli, bir nikâh dairesi ve ertesi gün gerçek bir kuyumcudan alınan yüzük. Masada biri "Hiçbir şey için geç değildir" dedi, ${nn(c)} "Geç, ama çok geç değil" diye cevapladı.`); }, { tone: 'big' }),
      ch('together', 'Say you are happy as you are', 'Olduğun gibi mutlu olduğunu söyle', (c) => { c.h.closeness(pid(c), 3); return out(c, { hap: 3 }, `"As we are, then," said ${nn(c)}, and kept the curtain hook as a keepsake. It sits on the shelf and watches over a perfectly good arrangement.`, `"O zaman olduğumuz gibi," dedi ${nn(c)} ve perde kancasını hatıra olarak sakladı. Rafta duruyor ve gayet iyi bir düzene göz kulak oluyor.`); }),
      ch('no', 'Say it is a little too late for papers', 'Evrak için biraz geç olduğunu söyle', (c) => { c.h.closeness(pid(c), -9); return out(c, { hap: -3 }, 'You did not say it with unkindness, but it sounded like the end of a bridge. You both stood in the hallway and listened to the bird finishing.', 'Kötü niyetle söylemedin ama bir köprünün sonu gibi geldi. İkiniz de koridorda durup kuşun işini bitirmesini dinlediniz.'); }, { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_widow_invite',
    minAge: 45,
    maxAge: 88,
    weight: 70,
    cooldown: 6,
    maxPerLife: 2,
    needs: ['single'],
    when: (c) => widowed(c),
    setup: (c) => newDate(c, 45, 88),
    title: (c) => c.t('An invitation, after the loss', 'Kayıptan sonra bir davet'),
    text: (c) => c.t(`${nn(c)} from the choir invites you for a walk by the water. It's "only a walk". You have not been invited anywhere on purpose in more than two years. The feeling is somewhere between guilt and a very soft hope.`, `Koro arkadaşlarından ${nn(c)} seni su kenarında yürüyüşe davet ediyor. "Sadece bir yürüyüş". İki yıldan uzun süredir kimse sizi bir yere bilerek çağırmamıştı. Duygu, suçluluk ile çok yumuşak bir umut arasında bir yerde.`),
    choices: [
      ch('go', 'Go, and let it be a walk', 'Git ve yürüyüş olarak kalsın', (c) => {
        if (lucky(c, 0.4) && startDating(c, 'pid', 50)) return out(c, { hap: 6 }, `You talked about the water, the choir and then, slowly, about love. ${nn(c)} listened as if the stories were being laid carefully on a table. You walked home in a different light.`, `Sudan, korodan, sonra yavaş yavaş aşktan bahsettiniz. ${nn(c)} hikâyeler özenle masaya konuyormuş gibi dinledi. Eve farklı bir ışıkta yürüdün.`);
        return out(c, { hap: 3, hea: 1 }, 'A good walk, a slow bench, some biscuits. Nothing more, and it was enough. You discovered that your legs still know the way to a Sunday.', 'İyi bir yürüyüş, bir bankta mola, birkaç bisküvi. Başka bir şey yok ve yetti. Bacaklarının bir pazara giden yolu hâlâ bildiğini keşfettin.');
      }, { tone: 'good' }),
      ch('later', 'Say "later", and mean it', '"Daha sonra" de ve bunu kastet', (c) => out(c, { hap: 0 }, 'You said it kindly. A "later" can be a door left ajar. You are still very much there, thinking.', 'Bunu nazikçe söyledin. Bir "daha sonra" aralık bırakılmış bir kapı olabilir. Hâlâ oradasın ve düşünüyorsun.')),
      ch('decline', 'Decline: "that part of my life is closed"', 'Reddet: "hayatımın o kısmı kapandı"', (c) => out(c, { hap: -2 }, 'It was said with dignity, and received with dignity. You then felt, absurdly, like a house with the shutters down on a bright day.', 'Vakarla söylendi ve vakarla karşılandı. Sonra, saçma biçimde, parlak bir günde kepenkleri inik bir ev gibi hissettin.'), { tone: 'bad' }),
    ],
  },
  {
    ...B,
    id: 'base.lv_widow_ring',
    minAge: 50,
    maxAge: 90,
    weight: 55,
    cooldown: 8,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => widowed(c),
    title: (c) => c.t('The ring', 'Yüzük'),
    text: (c) => c.t('It is still on your finger, a little worn, a little loose. Someone at the club noticed and said nothing, kindly. You have started turning it when you think. Every year it asks a question you cannot quite hear.', 'Hâlâ parmağında, biraz aşınmış, biraz bol. Kulüpteki biri fark etti ve nazikçe hiçbir şey söylemedi. Düşünürken çevirmeye başladın. Her yıl tam duyamadığın bir soru soruyor.'),
    choices: [
      ch('keep', 'Keep wearing it', 'Takmaya devam et', (c) => out(c, { hap: 1 }, 'It is not a prison; it is a promise you still keep. On your good days it is warm. On your bad ones it is a quiet hand.', 'Bir hapishane değil; hâlâ tuttuğun bir söz. İyi günlerinde sıcak. Kötü günlerinde sessiz bir el.'), { tone: 'good' }),
      ch('chain', 'Move it to a chain, close to the heart', 'Kalbe yakın bir zincire taşı', (c) => out(c, { hap: 3 }, 'A small step that did not need a speech. The finger lightened, and the memory stayed exactly where it belonged. It felt like a quiet kind of permission.', 'Konuşma gerektirmeyen küçük bir adım. Parmak hafifledi, anı tam ait olduğu yerde kaldı. Sessiz bir tür izin gibi hissettirdi.'), { tone: 'good' }),
      ch('drawer', 'Put it in a drawer, wrapped in cloth', 'Bir bezle sarıp çekmeceye koy', (c) => out(c, { hap: -1 }, 'The pale band on your finger remained for a month. It looked like an open question. You had a long, quiet afternoon with the cloth.', 'Parmağındaki soluk iz bir ay kaldı. Açık bir soru gibi görünüyordu. Bezle uzun, sessiz bir öğleden sonra geçirdin.')),
    ],
  },
  {
    ...B,
    id: 'base.lv_widow_app',
    minAge: 55,
    maxAge: 88,
    weight: 50,
    cooldown: 7,
    maxPerLife: 1,
    needs: ['single'],
    when: (c) => widowed(c),
    setup: (c) => newDate(c, 55, 88),
    title: (c) => c.t('A relative installs a dating app', 'Bir akraban flört uygulaması yüklüyor'),
    text: (c) => c.t(`A relative "helped" with your phone and left a new icon on your screen: a flame. It already shows ${nn(c)}, age-appropriate, standing next to a bicycle, "looking for someone to share coffee and bad jokes". You have been blushing for ten minutes.`, `Bir akraban telefonunla "yardım etti" ve ekranına yeni bir simge bıraktı: bir alev. Şimdiden yaşa uygun, bisikletin yanında duran ${nn(c)} görünüyor: "kahve ve kötü espri paylaşacak birini arıyor". On dakikadır kızarıyorsun.`),
    choices: [
      ch('try', 'Send one careful message', 'Dikkatli tek bir mesaj gönder', (c) => {
        if (lucky(c, 0.45) && startDating(c, 'pid', 50)) return out(c, { hap: 6 }, `Three careful messages became twenty uncareful ones. You met in a café where both of you got there forty minutes early. The bicycle was real.`, 'Üç dikkatli mesaj yirmi dikkatsiz mesaja dönüştü. İkinizin de kırk dakika erken geldiği bir kafede buluştunuz. Bisiklet gerçekti.');
        return out(c, { hap: 1 }, 'A polite exchange, a kind goodbye and a small, bright pride in having tried. The flame is still on the screen.', 'Kibar bir yazışma, nazik bir veda ve denemiş olmanın küçük, parlak gururu. Alev hâlâ ekranda.');
      }),
      ch('delete', 'Delete the app immediately', 'Uygulamayı hemen sil', (c) => out(c, { hap: -1 }, 'The flame died with a small, self-righteous click. The relative will be offended on Sunday, and you will be offended back.', 'Alev küçük, kendinden emin bir tıkla söndü. Akraban pazar günü alınacak, sen de karşılık vereceksin.')),
      ch('read', 'Read the profiles for company', 'Profilleri keyif için oku', (c) => out(c, { hap: 2 }, 'You read forty profiles, laughed at six and sighed at two. It has been a long time since the phone gave you any company rather than bad news.', 'Kırk profil okudun, altısına güldün, ikisine içini çektin. Telefonun sana kötü haber yerine arkadaşlık vermesinin üzerinden uzun zaman geçti.')),
    ],
  },
];

export const loveWaveEvents: EventDef[] = [...teen, ...singles, ...exGroup, ...together, ...couples, ...afterSplit, ...late];
