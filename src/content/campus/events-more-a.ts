import type { ChoiceDef, Ctx, EventDef } from '../types';
import { nm, wage } from '../base/util';
import { atUni, bumpGpa, campusState, free, inGrad, peekCampus } from './state';

// Campus pack, second set A: lectures and exams, professors, the dorm and housing, money, the first-year adjustment.
// Randomness: people and variants are picked in setup, chances in resolve; nothing depends on the language.

const enrolled = (c: Ctx) => atUni(c) && free(c);
/** Lives in a dorm or a rented room, not in a home of their own. */
const dorm = (c: Ctx) => enrolled(c) && !c.p.home.owned;
const firstYear = (c: Ctx) => enrolled(c) && !inGrad(c) && c.p.schoolYears <= 1;
const gpaNow = (c: Ctx) => peekCampus(c.p)?.gpa ?? 0;

/** A classmate of roughly the player's age. */
const classmate = (c: Ctx) => c.h.newPerson({ age: Math.max(17, c.age + c.rng.int(-2, 2)) });
const heOf = (c: Ctx) => c.h.he(c.h.person(String(c.vars.pid)));

const ev = (e: Omit<EventDef, 'category' | 'minAge' | 'cooldown'> & { cooldown?: number }): EventDef => ({
  category: 'school',
  minAge: 16,
  cooldown: 4,
  ...e,
});

const pay = (c: Ctx, usd: number) => c.h.money(-wage(c, usd));
const afford = (usd: number): Pick<ChoiceDef, 'requires' | 'requiresLabel'> => ({ requires: (c) => c.p.money >= wage(c, usd), requiresLabel: 'Not enough money' });

export const campusMoreAEvents: EventDef[] = [
  // ------------------------------------------------------------------ lectures and exams
  ev({
    id: 'campus.a_cram_night',
    weight: 26,
    when: enrolled,
    title: (c) => c.t('The exam is tomorrow. You have read none of it.', 'Sınav yarın. Sen hiçbirini okumadın.'),
    text: (c) => c.t('The textbook is 600 pages and its spine has never been cracked. Your highlighter has dried out from loneliness.', 'Ders kitabı altı yüz sayfa ve sırtı hiç açılmamış. Fosforlu kalemin yalnızlıktan kurumuş.'),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    choices: [
      {
        id: 'coffee',
        label: (c) => c.t('Coffee, panic and the whole book', 'Kahve, panik ve bütün kitap'),
        resolve: (c) => {
          bumpGpa(c, 0.1 + c.p.stats.smarts / 600);
          c.h.stat('health', -4);
          c.h.stat('smarts', 1);
          return c.t('You read 600 pages in nine hours and saw colours that do not exist. The exam went fine. You slept through the bus home.', 'Dokuz saatte altı yüz sayfa okudun, var olmayan renkler gördün. Sınav fena geçmedi. Eve dönen otobüste uyuyakaldın.');
        },
      },
      {
        id: 'sleep',
        label: (c) => c.t('Sleep and trust the lectures', 'Uyu, derslere güven'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 250)) {
            bumpGpa(c, 0.1);
            c.h.stat('happiness', 3);
            return c.t('You slept eight hours and walked in glowing. Half of it came back to you. It was the right half.', 'Sekiz saat uyudun, sınıfa pırıl pırıl girdin. Konunun yarısı aklına geldi, hem de doğru yarısı.');
          }
          bumpGpa(c, -0.2);
          return c.t('You slept beautifully. The exam did not care. You left three pages blank and a doodle of a horse.', 'Harika uyudun. Sınav umursamadı. Üç sayfa boş bıraktın, bir de at çizdin.');
        },
      },
      {
        id: 'notes',
        label: (c) => c.t("Beg a friend for their notes", 'Bir arkadaşından not dilen'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          bumpGpa(c, 0.08);
          c.h.addRelation(f, 'friend', c.rng.int(50, 70));
          c.h.stat('happiness', 1);
          return c.t(`${f.firstName} sent photos of neat handwriting at 1 a.m. with the message "you owe me tea". You do.`, `${f.firstName} gece birde düzgün el yazılı notların fotoğraflarını yolladı, altına "bir çay borçlusun" yazdı. Borçlusun.`);
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_failed_midterm',
    weight: 24,
    when: enrolled,
    title: (c) => c.t('You got 38 on the midterm.', 'Vizeden 38 aldın.'),
    text: (c) => c.t('The class average was forty-one, which is less of a comfort than you hoped.', 'Sınıf ortalaması kırk bir çıkmış; umduğun kadar teselli etmedi.'),
    choices: [
      {
        id: 'regrade',
        label: (c) => c.t('Ask for a re-grade', 'Kâğıdın yeniden okunmasını iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 300)) {
            bumpGpa(c, 0.2);
            return c.t('The hoca found a page stuck to another page. Thirty-eight became fifty-six. You did not argue.', 'Hoca iki kâğıdın birbirine yapıştığını fark etti. Otuz sekiz elli altı oldu. Sen de itiraz etmedin.');
          }
          c.h.stat('happiness', -3);
          return c.t('The hoca read it again, slowly, and found two more mistakes. It is now 36.', 'Hoca kâğıdı yavaş yavaş yeniden okudu ve iki hata daha buldu. Not otuz altıya düştü.');
        },
      },
      {
        id: 'grind',
        label: (c) => c.t('Rebuild your study habits', 'Çalışma düzenini baştan kur'),
        resolve: (c) => {
          bumpGpa(c, 0.12);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -2);
          return c.t('You bought a planner and a lamp and, for the first time, went to bed before 3 a.m. The final went noticeably better.', 'Bir ajanda ve bir masa lambası aldın, ilk kez gece üçten önce yattın. Final gözle görülür biçimde daha iyi geçti.');
        },
        tone: 'good',
      },
      {
        id: 'laugh',
        label: (c) => c.t('Frame it and laugh', 'Çerçeveletip gül geç'),
        resolve: (c) => {
          bumpGpa(c, -0.1);
          c.h.stat('happiness', 4);
          return c.t('You pinned the exam above your bed with the caption "Humble beginnings". Your friends loved it. Your GPA did not.', 'Kâğıdı yatağının üstüne "Tevazu dersi" yazıp astın. Arkadaşların bayıldı. Ortalamanın hoşuna gitmedi.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_open_book',
    weight: 24,
    when: enrolled,
    title: (c) => c.t('The professor announces an open-book exam.', 'Hoca sınavın açık kitap olduğunu duyurdu.'),
    text: (c) => c.t('"Bring anything you like," says the hoca, smiling in a way that worries you.', '"İstediğinizi getirin" diyor hoca, içini ürperten bir gülümsemeyle.'),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    choices: [
      {
        id: 'all',
        label: (c) => c.t('Carry every book you own', 'Elindeki bütün kitapları taşı'),
        resolve: (c) => {
          c.h.stat('health', -2);
          if (c.rng.chance(0.5)) {
            bumpGpa(c, 0.15);
            return c.t('Your back is ruined, but the answer to question 3 was on page 412 and you found it with four minutes to spare.', 'Belin mahvoldu ama üçüncü sorunun cevabı dört yüz on ikinci sayfadaydı, bulmana dört dakika kala buldun.');
          }
          bumpGpa(c, -0.05);
          return c.t('You spent the whole exam looking for the right book. The right book was at home.', 'Bütün sınav boyunca doğru kitabı aradın. Doğru kitap evde kalmıştı.');
        },
      },
      {
        id: 'notes',
        label: (c) => c.t('Bring only your own notes', 'Sadece kendi notlarını getir'),
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 250)) {
            bumpGpa(c, 0.2);
            c.h.stat('smarts', 1);
            return c.t('The questions were not in any book. They were in your notes. The hoca winked, or blinked. You will never know.', 'Sorular hiçbir kitapta yoktu, senin notlarındaydı. Hoca göz kırptı, ya da gözü kaydı. Hiç öğrenemeyeceksin.');
          }
          bumpGpa(c, 0.02);
          c.h.stat('happiness', -1);
          return c.t('Your notes turned out to be mostly doodles and the phrase "important!!" written next to nothing.', 'Notlarının çoğu karalama çıktı, bir de hiçbir şeyin yanında durmayan "önemli!!" yazıları.');
        },
      },
      {
        id: 'share',
        label: (c) => c.t('Share a book with your neighbor', 'Yanındakiyle aynı kitaba bak'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          bumpGpa(c, 0.08);
          c.h.addRelation(f, 'friend', c.rng.int(50, 72));
          return c.t(`You and ${f.firstName} turned the pages in whispers, like a very boring heist. You both passed.`, `${f.firstName} ile fısıltıyla sayfa çevirdiniz; çok sıkıcı bir soygun gibiydi. İkiniz de geçtiniz.`);
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_freeloader',
    weight: 24,
    when: enrolled,
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`${nm(c)} has done nothing for the group project.`, `${nm(c)} grup ödevinde hiçbir şey yapmadı.`),
    text: (c) => c.t(`The slides are due in two days. ${heOf(c) === 'she' ? 'She' : 'He'} has contributed one emoji to the group chat.`, 'Teslime iki gün var. Mesaj grubuna şimdiye kadar tek bir emoji gönderdi.'),
    choices: [
      {
        id: 'alone',
        label: (c) => c.t('Do it all yourself', 'Hepsini kendin yap'),
        resolve: (c) => {
          bumpGpa(c, 0.1);
          c.h.stat('smarts', 1);
          c.h.stat('happiness', -3);
          return c.t(`You finished at dawn and listed ${nm(c)} last, in a very small font.`, `Sabaha karşı bitirdin ve ${nm(c)} adını en sona, çok küçük puntoyla yazdın.`);
        },
      },
      {
        id: 'confront',
        label: (c) => c.t('Confront them', 'Yüzleş'),
        badge: 'Risky',
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.5)) {
            bumpGpa(c, 0.05);
            c.h.addRelation(f, 'friend', c.rng.int(48, 66));
            return c.t(`${f.firstName} apologised, explained a very long week, and made all the diagrams overnight. They were good.`, `${f.firstName} özür diledi, çok uzun bir hafta geçirdiğini anlattı ve bütün şemaları bir gecede çizdi. Güzeldi de.`);
          }
          c.h.stat('happiness', -2);
          return c.t(`${f.firstName} read your message and left it on read. The emoji returned, alone, at midnight.`, `${f.firstName} mesajını okudu ve cevap vermedi. Gece yarısı o tek emoji yine geldi.`);
        },
      },
      {
        id: 'report',
        label: (c) => c.t('Tell the hoca', 'Hocaya söyle'),
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            bumpGpa(c, 0.1);
            return c.t('The hoca graded you separately. For once, fairness arrived on time.', 'Hoca seni ayrı değerlendirdi. Adalet bu sefer tam zamanında geldi.');
          }
          bumpGpa(c, -0.05);
          c.h.stat('happiness', -2);
          return c.t('"You are adults," said the hoca. "Work it out." It was the least helpful sentence of your year.', '"Büyüksünüz, aranızda halledin" dedi hoca. Yılın en az işe yarayan cümlesiydi.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_wrong_hall',
    weight: 20,
    when: (c) => enrolled(c) && !inGrad(c),
    title: (c) => c.t('You have been attending the wrong lecture for three weeks.', 'Üç haftadır yanlış derse giriyorsun.'),
    text: (c) => c.t('It is about medieval pottery. You have notes, opinions and a favourite seat.', 'Ders ortaçağ seramiği üzerine. Notların, fikirlerin ve en sevdiğin sıran var.'),
    choices: [
      {
        id: 'stay',
        label: (c) => c.t('Stay for the pottery', 'Seramikle devam et'),
        resolve: (c) => {
          bumpGpa(c, -0.1);
          c.h.stat('smarts', 3);
          c.h.stat('happiness', 3);
          return c.t('You can now date a jug from across the room. Your real course carried on without you.', 'Bir testinin yaşını odanın öbür ucundan söyleyebiliyorsun. Asıl dersin sensiz devam etti.');
        },
      },
      {
        id: 'back',
        label: (c) => c.t('Go back to the right room', 'Doğru sınıfa dön'),
        resolve: (c) => {
          bumpGpa(c, 0.05);
          c.h.stat('happiness', -2);
          return c.t('You said goodbye to the pottery hoca, who gave you a small bowl. You are keeping your pens in it.', 'Seramik hocasına veda ettin; o da sana küçük bir kâse hediye etti. Kalemlerini içinde tutuyorsun.');
        },
      },
      {
        id: 'both',
        label: (c) => c.t('Attend both', 'İkisine de gir'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            bumpGpa(c, 0.05);
            c.h.stat('smarts', 2);
            c.h.stat('happiness', -2);
            return c.t('Eight hours of lectures a day, one of them about pots. You are tired and extremely well rounded.', 'Günde sekiz saat ders, biri de çanak çömlek üzerine. Yorgunsun ama çok yönlüsün.');
          }
          c.h.stat('health', -4);
          bumpGpa(c, -0.05);
          return c.t('You fell asleep in both halls, once with your head on a replica amphora.', 'İki salonda da uyuyakaldın; birinde başın bir amfora maketinin üstündeydi.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_attendance',
    weight: 20,
    when: enrolled,
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`${nm(c)} asks you to sign the attendance sheet.`, `${nm(c)} yoklama kâğıdını onun yerine imzalamanı istiyor.`),
    text: (c) => c.t('"Just once," says the friend. It is the fifth "just once" this month.', '"Bir kereliğine" diyor. Bu ay beşinci "bir kereliğine".'),
    choices: [
      {
        id: 'sign',
        label: (c) => c.t('Sign for them', 'İmzala'),
        badge: 'Risky',
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.3)) {
            bumpGpa(c, -0.15);
            c.h.stat('happiness', -4);
            return c.t('The hoca counted heads. Thirty-one signatures, thirty students. You both got a very quiet talk.', 'Hoca kafa saydı. Otuz öğrenciye otuz bir imza. İkinize de çok sessiz bir konuşma yapıldı.');
          }
          c.h.addRelation(f, 'friend', c.rng.int(60, 78));
          c.h.stat('happiness', 2);
          return c.t(`Nobody noticed. ${f.firstName} now considers you a criminal mastermind and a brother or sister in arms.`, `Kimse fark etmedi. ${f.firstName} artık seni suç dehası ve can yoldaşı sayıyor.`);
        },
      },
      {
        id: 'refuse',
        label: (c) => c.t('Say no', 'Hayır de'),
        resolve: (c) => {
          bumpGpa(c, 0.03);
          c.h.stat('happiness', -1);
          return c.t(`${nm(c)} sulked for a week. You gained a reputation for principles, which is a polite word for boring.`, `${nm(c)} bir hafta küstü. İlkeli biri olarak ün saldın; "sıkıcı"nın kibar hali.`);
        },
      },
      {
        id: 'deal',
        label: (c) => c.t('Sign, but for their notes all term', 'İmzala, ama dönem boyu notlar karşılığında'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            bumpGpa(c, -0.15);
            c.h.stat('happiness', -3);
            return c.t('Caught, with the notes in your bag as evidence. The hoca read them. They were very good, which did not help.', 'Yakalandın; kanıt olarak çantandaki notlar duruyordu. Hoca okudu. Çok iyiydiler, bu da işini kurtarmadı.');
          }
          bumpGpa(c, 0.1);
          return c.t('A term of beautifully colour-coded notes arrived, one lecture at a time. Crime pays, on a small scale.', 'Dönem boyunca renk renk işaretlenmiş notlar her derste elinde oldu. Suç, küçük çapta, kazandırıyor.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_resit',
    weight: 36,
    when: (c) => enrolled(c) && gpaNow(c) < 2.6 && !!peekCampus(c.p)?.startYear,
    title: (c) => c.t('You failed a course. The resit is in two weeks.', 'Bir dersten kaldın. Bütünleme iki hafta sonra.'),
    text: (c) => c.t('Your student number is on the results board in red. It is not a good colour for a number.', 'Sonuç panosunda öğrenci numaran kırmızıyla yazılmış. Rakam için pek yakışan bir renk değil.'),
    choices: [
      {
        id: 'study',
        label: (c) => c.t('Study hard for the resit', 'Bütünlemeye canla başla çalış'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          if (c.rng.chance(0.55 + c.p.stats.smarts / 250)) {
            bumpGpa(c, 0.2);
            return c.t('You passed with a CC and cried in the corridor. Happy tears, mostly.', 'CC ile geçtin ve koridorda ağladın. Çoğunlukla mutluluktan.');
          }
          return c.t('You failed again. The course has started to treat you like family.', 'Yine kaldın. Ders artık seni aileden saymaya başladı.');
        },
      },
      {
        id: 'appeal',
        label: (c) => c.t('Appeal the result', 'Nota itiraz et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            bumpGpa(c, 0.2);
            return c.t('A committee found an addition error on your paper. You are now a person who passed, retroactively.', 'Bir komisyon kâğıdında toplama hatası buldu. Artık geriye dönük olarak geçmiş sayılıyorsun.');
          }
          c.h.stat('happiness', -3);
          return c.t('The committee thanked you for your interest. It took a month to say so.', 'Komisyon ilgin için teşekkür etti. Bunu söylemeleri bir ay sürdü.');
        },
      },
      {
        id: 'retake',
        label: (c) => c.t('Retake the course next year', 'Dersi gelecek yıl alttan al'),
        badge: 'Costs more',
        resolve: (c) => {
          pay(c, 300);
          bumpGpa(c, -0.05);
          c.h.stat('happiness', -1);
          return c.t('You will sit in the same room with the next year, who are suspiciously young.', 'Gelecek yıl aynı sınıfta, şüpheli derecede genç görünen yeni dönemle oturacaksın.');
        },
      },
    ],
  }),

  // ------------------------------------------------------------------ professors
  ev({
    id: 'campus.a_office_hours',
    weight: 24,
    when: enrolled,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.rng.int(42, 66) }).id;
    },
    title: (c) => {
      const prof = c.h.person(String(c.vars.pid));
      return c.t(`Professor ${prof.lastName} left the office door open.`, `${prof.firstName} Hoca ofisinin kapısını açık bırakmış.`);
    },
    text: (c) => c.t('There is a plate of biscuits and a sign: "Students welcome". Nobody has been in since March.', 'Masada bir tabak bisküvi, kapıda "Öğrenciler buyursun" yazıyor. Mart ayından beri kimse uğramamış.'),
    choices: [
      {
        id: 'material',
        label: (c) => c.t('Ask about the course material', 'Ders konusunu sor'),
        resolve: (c) => {
          bumpGpa(c, 0.1);
          c.h.stat('smarts', 2);
          return c.t('Forty minutes later you understood the thing the whole lecture hall had been nodding at.', 'Kırk dakika sonra bütün amfinin başını sallayarak geçiştirdiği konuyu anlamıştın.');
        },
        tone: 'good',
      },
      {
        id: 'career',
        label: (c) => c.t('Ask about life after graduation', 'Mezuniyet sonrasını sor'),
        resolve: (c) => {
          const prof = c.h.person(String(c.vars.pid));
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t(`Professor ${prof.lastName} talked for an hour about a cat, a failed experiment and what really matters. You left with a list of books and tea stains.`, `${prof.firstName} Hoca bir saat boyunca bir kediden, başarısız bir deneyden ve asıl önemli olandan söz etti. Elinde bir kitap listesiyle, çay lekeleriyle çıktın.`);
        },
      },
      {
        id: 'biscuits',
        label: (c) => c.t('Eat a biscuit and leave', 'Bir bisküvi al, çık'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You took two biscuits and said "just checking". Nobody knows what you checked.', 'İki bisküvi aldın, "sadece bakmaya geldim" dedin. Neye baktığını kimse bilmiyor.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_rec_letter',
    weight: 26,
    cooldown: 6,
    when: (c) => enrolled(c) && gpaNow(c) >= 2.3,
    title: (c) => c.t('You need a recommendation letter.', 'Bir referans mektubuna ihtiyacın var.'),
    text: (c) => c.t('The form wants a professor who "knows you well". You know one professor, and she knows you slightly.', 'Formda seni "yakından tanıyan" bir hoca isteniyor. Sen bir hoca tanıyorsun, o da seni biraz tanıyor.'),
    choices: [
      {
        id: 'close',
        label: (c) => c.t('Ask the professor who knows you', 'Seni tanıyan hocadan iste'),
        resolve: (c) => {
          if (c.rng.chance(0.4 + gpaNow(c) / 10 + c.p.stats.smarts / 400)) {
            c.h.stat('happiness', 6);
            c.h.stat('smarts', 1);
            return c.t('The letter called you "diligent". You read the word eleven times and had to sit down.', 'Mektupta sana "çalışkan" demişler. Kelimeyi on bir kez okuyup oturmak zorunda kaldın.');
          }
          c.h.stat('happiness', -3);
          return c.t('"Of course," she said. Then, kindly: "Remind me which one you are?"', '"Tabii" dedi hoca. Sonra nazikçe ekledi: "Sen hangisiydin?"');
        },
      },
      {
        id: 'draft',
        label: (c) => c.t('Write a draft for her to sign', 'Taslağı kendin yaz, o imzalasın'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.stat('happiness', 3);
            return c.t('She signed it without changing a word. You described yourself as a "once-in-a-generation talent". Your face is hot.', 'Tek kelimeyi değiştirmeden imzaladı. Kendini "nesilde bir görülen yetenek" diye anlatmıştın. Yüzün yanıyor.');
          }
          c.h.stat('happiness', -2);
          c.h.stat('smarts', 1);
          return c.t('She crossed out "genius" and wrote "punctual". It was, honestly, the more accurate word.', '"Dahi"nin üstünü çizip "dakik" yazmış. Dürüst olmak gerekirse daha doğru kelime oydu.');
        },
      },
      {
        id: 'famous',
        label: (c) => c.t('Ask the famous professor', 'Ünlü hocadan iste'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.2)) {
            c.h.money(wage(c, 600));
            c.h.stat('happiness', 9);
            return c.t('His assistant forwarded it, he signed it in a taxi, and it opened a small grant. A famous name goes a long way.', 'Asistanı iletti, hoca da bir taksinin arkasında imzaladı. Küçük bir hibe de çıktı. Ünlü bir isim çok yol açıyor.');
          }
          c.h.stat('happiness', -2);
          return c.t('You received a form letter that began "Dear Student". The student, apparently, was you.', '"Sevgili Öğrenci" diye başlayan hazır bir mektup geldi. Öğrenci, anlaşılan, sendin.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_prof_feud',
    weight: 22,
    when: enrolled,
    title: (c) => c.t('You corrected the professor in front of the class.', 'Hocayı bütün sınıfın önünde düzelttin.'),
    text: (c) => c.t('You were right, which is the worst part. The professor now gives your homework a long, slow stare.', 'Haklıydın, işin en kötü yanı da bu. Hoca artık ödevine uzun uzun, yavaş yavaş bakıyor.'),
    choices: [
      {
        id: 'apologise',
        label: (c) => c.t('Apologise with tea', 'Çayla gidip özür dile'),
        resolve: (c) => {
          bumpGpa(c, 0.05);
          c.h.stat('happiness', -1);
          return c.t('The hoca softened, took the tea and said "Next time, email me." You will. You will absolutely email.', 'Hoca yumuşadı, çayı aldı ve "Bir dahaki sefere e-posta atın" dedi. Atacaksın. Kesinlikle e-posta atacaksın.');
        },
      },
      {
        id: 'stand',
        label: (c) => c.t('Stand your ground', 'Dediğinin arkasında dur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 300)) {
            bumpGpa(c, 0.15);
            c.h.stat('smarts', 1);
            c.h.stat('happiness', 4);
            return c.t('The next week the hoca quietly changed the slide and handed you the best mark of the class. Respect is respect.', 'Ertesi hafta hoca slaytı sessizce düzeltti, sınıfın en yüksek notunu sana verdi. Saygı saygıdır.');
          }
          bumpGpa(c, -0.25);
          c.h.stat('happiness', -3);
          return c.t('The hoca now asks you the hardest question every lecture, smiling. Your grades have taken a historical turn.', 'Hoca her derste en zor soruyu sana soruyor, üstelik gülümseyerek. Notların tarihi bir dönemece girdi.');
        },
      },
      {
        id: 'section',
        label: (c) => c.t('Switch to another section', 'Başka şubeye geç'),
        resolve: (c) => {
          bumpGpa(c, -0.05);
          c.h.stat('happiness', 1);
          return c.t('The new section meets at 8 a.m. Peace costs an early alarm.', 'Yeni şube sabah sekizde. Huzurun bedeli erken alarm.');
        },
      },
    ],
  }),

  // ------------------------------------------------------------------ the dorm and housing
  ev({
    id: 'campus.a_dish_war',
    weight: 24,
    when: dorm,
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t(`${nm(c)} has not washed a dish since October.`, `${nm(c)} ekimden beri tek bir tabak yıkamadı.`),
    text: (c) => c.t('The sink has grown its own ecosystem. A house meeting has been called, with minutes.', 'Lavabo kendi ekosistemini kurdu. Tutanaklı bir ev toplantısı çağrıldı.'),
    choices: [
      {
        id: 'chart',
        label: (c) => c.t('Propose a chore chart', 'Nöbet çizelgesi öner'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          if (c.rng.chance(0.55)) {
            c.h.addRelation(f, 'friend', c.rng.int(50, 72));
            c.h.stat('happiness', 3);
            return c.t(`The chart worked. ${f.firstName} even drew little soap bubbles in the margin.`, `Çizelge işe yaradı. ${f.firstName} kenara küçük sabun köpükleri bile çizdi.`);
          }
          c.h.stat('happiness', -1);
          return c.t('The chart lasted nine days. It now hangs on the fridge as a historical document.', 'Çizelge dokuz gün dayandı. Şimdi buzdolabında tarihi bir belge olarak duruyor.');
        },
      },
      {
        id: 'alone',
        label: (c) => c.t('Quietly wash everything yourself', 'Sessizce hepsini sen yıka'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.stat('health', 1);
          return c.t('You washed forty-one items. You found a spoon you thought was a myth.', 'Kırk bir parça yıkadın. Efsane sandığın bir kaşık çıktı.');
        },
      },
      {
        id: 'own',
        label: (c) => c.t('Buy your own plate and guard it', 'Kendi tabağını al, koru'),
        badge: 'Costs more',
        resolve: (c) => {
          pay(c, 40);
          c.h.stat('happiness', 2);
          return c.t('You bought one plate, one pan and a padlock for the cupboard. The kitchen is now a fortress with a single resident.', 'Bir tabak, bir tava ve dolaba bir asma kilit aldın. Mutfak artık tek kişilik bir kale.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_flood',
    weight: 22,
    cooldown: 6,
    when: dorm,
    title: (c) => c.t('A pipe burst above your dorm room.', 'Yurt odanın üstündeki boru patladı.'),
    text: (c) => c.t('At 3 a.m. it rained indoors. Your textbooks are now soup.', 'Gece üçte oda içinde yağmur yağdı. Ders kitapların şimdi çorba.'),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    choices: [
      {
        id: 'laptop',
        label: (c) => c.t('Save the laptop first', 'Önce bilgisayarı kurtar'),
        resolve: (c) => {
          pay(c, 150);
          bumpGpa(c, -0.03);
          return c.t('The laptop lived. The books did not. You are now the proud owner of a swollen chemistry text that smells of lake.', 'Bilgisayar kurtuldu, kitaplar kurtulmadı. Artık göl kokan, şişmiş bir kimya kitabının gururlu sahibisin.');
        },
      },
      {
        id: 'books',
        label: (c) => c.t('Save the books first', 'Önce kitapları kurtar'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('smarts', 1);
            return c.t('You carried everything out in a laundry bag. Both survived. You are a hero, damp but a hero.', 'Her şeyi çamaşır torbasıyla dışarı taşıdın. İkisi de kurtuldu. Kahramansın; ıslak ama kahraman.');
          }
          pay(c, 500);
          c.h.stat('happiness', -3);
          return c.t('The books are perfect. The laptop is now an aquarium. Money was spent.', 'Kitaplar sapasağlam. Bilgisayar ise akvaryum oldu. Para harcandı.');
        },
      },
      {
        id: 'chain',
        label: (c) => c.t('Wake the whole floor for a bucket chain', 'Bütün katı kaldır, kova zinciri kur'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          pay(c, 50);
          c.h.addRelation(f, 'friend', c.rng.int(58, 78));
          c.h.stat('happiness', 4);
          return c.t(`Twenty-two students in pyjamas passed buckets down the stairs. ${f.firstName} was in charge of the whistle. It was the most fun anyone had had all term.`, `Pijamalı yirmi iki öğrenci kovaları merdivenden elden ele taşıdı. Düdük ${f.firstName} adlı arkadaştaydı. Dönemin en eğlenceli gecesiydi.`);
        },
        tone: 'good',
      },
    ],
  }),

  ev({
    id: 'campus.a_noise',
    weight: 22,
    when: dorm,
    title: (c) => c.t('The dorm warden is knocking at midnight.', 'Yurt müdürü gece yarısı kapını çalıyor.'),
    text: (c) => c.t('A noise complaint has your name on it. In your defence, you were only singing in the shower. The shower has excellent acoustics.', 'Hakkında gürültü şikâyeti var. Savunman: sadece duşta şarkı söylüyordun. Duşun akustiği mükemmel.'),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    choices: [
      {
        id: 'sorry',
        label: (c) => c.t('Apologise and promise to hum', 'Özür dile, mırıldanacağına söz ver'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You promised to hum quietly. The warden nodded gravely. You have not hummed since.', 'Sessizce mırıldanacağına söz verdin. Müdür ciddiyetle başını salladı. O günden beri mırıldanmadın.');
        },
      },
      {
        id: 'argue',
        label: (c) => c.t('Argue about the acoustics', 'Akustik üzerine tartış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('happiness', 4);
            return c.t('The warden stepped into the shower, listened, and said "hm". You were let off. He asked you to sing once more.', 'Müdür duşa girdi, dinledi ve "hmm" dedi. Seni affetti. Bir kez daha söylemeni rica etti.');
          }
          pay(c, 60);
          c.h.stat('happiness', -2);
          return c.t('There is a fine for "unlicensed concerts". You paid it. The receipt calls it a concert, which is something.', 'Bir "ruhsatsız konser" cezası var. Ödedin. Makbuzda konser yazıyor, bu da bir şey.');
        },
      },
      {
        id: 'concert',
        label: (c) => c.t('Turn it into a corridor concert', 'Koridorda konsere çevir'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          campusState(c.p).parties++;
          c.h.addRelation(f, 'friend', c.rng.int(55, 75));
          c.h.stat('happiness', 5);
          c.h.stat('health', -1);
          return c.t(`Forty people clapped along. ${f.firstName} brought a pan as a drum. The warden stayed to the end and denied it.`, `Kırk kişi alkışla eşlik etti. ${f.firstName} davul yerine tava getirdi. Müdür sonuna kadar kaldı ve sonra inkâr etti.`);
        },
        tone: 'good',
      },
    ],
  }),

  ev({
    id: 'campus.a_move_off',
    weight: 22,
    cooldown: 6,
    when: (c) => dorm(c) && !inGrad(c),
    title: (c) => c.t('A flat off campus: three rooms, one bathroom, five friends.', 'Kampüs dışında bir daire: üç oda, tek banyo, beş arkadaş.'),
    text: (c) => c.t('The landlord has one rule: no pets, no candles, no cooking fish.', 'Ev sahibinin tek kuralı var: hayvan yok, mum yok, balık pişirmek yok.'),
    choices: [
      {
        id: 'friends',
        label: (c) => c.t('Move in with your friends', 'Arkadaşlarla taşın'),
        badge: 'Costs more',
        ...afford(900),
        resolve: (c) => {
          pay(c, 900);
          c.h.stat('happiness', 6);
          bumpGpa(c, -0.05);
          return c.t('The shower has a schedule and the fridge has a constitution. You have never been so happy or so distracted.', 'Banyonun nöbet listesi, buzdolabının tüzüğü var. Hiç bu kadar mutlu ve hiç bu kadar dağınık olmamıştın.');
        },
      },
      {
        id: 'alone',
        label: (c) => c.t('Rent a cheaper room, far out', 'Uzakta daha ucuz bir oda kirala'),
        badge: 'Costs more',
        ...afford(500),
        resolve: (c) => {
          pay(c, 500);
          bumpGpa(c, 0.05);
          c.h.stat('happiness', 1);
          return c.t('It is quiet. It is also two dolmuş rides from the library. You read a lot on the way.', 'Sessiz. Ama kütüphaneye iki dolmuş uzaklıkta. Yolda çok okudun.');
        },
      },
      {
        id: 'stay',
        label: (c) => c.t('Stay in the dorm', 'Yurtta kal'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You kept your cheap room and the person who steals your slippers. At least you know each other.', 'Ucuz odanı ve terliklerini çalan kişiyi korudun. En azından birbirinizi tanıyorsunuz.');
        },
      },
    ],
  }),

  // ------------------------------------------------------------------ money
  ev({
    id: 'campus.a_textbook',
    weight: 26,
    when: enrolled,
    title: (c) => c.t('The textbook costs as much as a small scooter.', 'Ders kitabı küçük bir motosiklet kadar tutuyor.'),
    text: (c) => c.t('The hoca wrote it. The hoca requires it. The hoca, you assume, is doing well.', 'Kitabı hoca yazmış. Hoca da zorunlu tutmuş. Hocanın işleri yolunda, herhalde.'),
    choices: [
      {
        id: 'buy',
        label: (c) => c.t('Buy it new', 'Sıfırını al'),
        badge: 'Costs more',
        ...afford(250),
        resolve: (c) => {
          pay(c, 250);
          bumpGpa(c, 0.1);
          return c.t('It smells wonderful and you are afraid to open it. You open it. The first page has an error.', 'Mis gibi kokuyor, açmaya kıyamıyorsun. Açtın. İlk sayfasında hata var.');
        },
      },
      {
        id: 'copy',
        label: (c) => c.t('Photocopy it at the copy shop', 'Fotokopicide çoğalt'),
        resolve: (c) => {
          pay(c, 15);
          bumpGpa(c, 0.03);
          return c.t('A spiral-bound copy, slightly crooked, with two pages upside down. The shop owner knows your name and your course.', 'Spiralli, hafif eğri, iki sayfası ters bir kopya. Fotokopici abi adını da dersini de biliyor.');
        },
      },
      {
        id: 'senior',
        label: (c) => c.t("Borrow a senior's old copy", 'Üst dönemden eski baskıyı ödünç al'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            bumpGpa(c, 0.05);
            c.h.stat('happiness', 2);
            return c.t("The previous owner's margin doodles turned out to be the exam answers. Priceless, though it is not cheating.", 'Önceki sahibin kenar notları sınav soruları çıktı. Paha biçilemez; hile sayılmaz da.');
          }
          bumpGpa(c, -0.05);
          return c.t('It is the 2009 edition. The chapter on computers recommends a floppy disk.', 'Elindeki 2009 baskısı. Bilgisayar bölümü disket öneriyor.');
        },
        tone: 'good',
      },
    ],
  }),

  ev({
    id: 'campus.a_campus_job',
    weight: 26,
    when: (c) => enrolled(c) && !c.p.jobId,
    title: (c) => c.t('A part-time job is open on campus.', 'Kampüste yarı zamanlı bir iş çıktı.'),
    text: (c) => c.t('The pay is modest and the hours are awkward. The noticeboard lists a few options and a free lunch.', 'Ücret idare eder, saatler de zor. İlan panosunda birkaç seçenek ve bir öğün bedava yemek yazıyor.'),
    choices: [
      {
        id: 'library',
        label: (c) => c.t('Night duty at the library', 'Kütüphanede gece nöbeti'),
        resolve: (c) => {
          c.h.money(wage(c, 1500));
          c.h.stat('health', -2);
          c.h.stat('smarts', 1);
          return c.t('You stamp books and read between stamps. The one lamp that flickers is, quietly, your friend.', 'Kitap damgalıyor, damgaların arasında okuyorsun. Göz kırpan tek lamba sessizce arkadaşın oldu.');
        },
      },
      {
        id: 'cafeteria',
        label: (c) => c.t('Work the cafeteria counter', 'Yemekhane tezgâhında çalış'),
        resolve: (c) => {
          c.h.money(wage(c, 1800));
          c.h.stat('health', -2);
          bumpGpa(c, -0.08);
          return c.t('Pay is better. You now smell permanently of fried onions, and everyone you know has asked for extra rice.', 'Ücret daha iyi. Artık sürekli kızarmış soğan kokuyorsun ve tanıdığın herkes fazladan pilav istedi.');
        },
      },
      {
        id: 'tutor',
        label: (c) => c.t('Tutor younger students', 'Alt dönemlere özel ders ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 250)) {
            c.h.money(wage(c, 1300));
            c.h.stat('smarts', 2);
            return c.t('Explaining it twice taught it to you. They also learned. Somehow.', 'İki kez anlatınca kendin de öğrendin. Onlar da öğrendi. Nasılsa.');
          }
          c.h.money(wage(c, 400));
          c.h.stat('happiness', -2);
          return c.t('A student asked a question you cannot answer. You said "good question" for forty minutes.', 'Bir öğrenci cevaplayamadığın bir soru sordu. Kırk dakika boyunca "güzel soru" dedin.');
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Keep your free time', 'Boş vaktini koru'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          bumpGpa(c, 0.03);
          return c.t('You spent the hours sleeping, studying and thinking about money. The last one is the least productive.', 'O saatleri uyuyarak, çalışarak ve parayı düşünerek geçirdin. Sonuncusu en verimsiz olanı.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_scholarship_renewal',
    weight: 70,
    cooldown: 3,
    when: (c) => enrolled(c) && c.h.has('scholarship') && !!peekCampus(c.p)?.startYear,
    title: (c) => c.t('Your scholarship is up for renewal.', 'Bursunun yenilenme zamanı geldi.'),
    text: (c) => c.t('A committee will review your grades, your motivation letter and, rumour says, your facial expression.', 'Bir komisyon notlarına, niyet mektubuna ve söylentiye göre yüz ifadene bakacak.'),
    choices: [
      {
        id: 'submit',
        label: (c) => c.t('Submit the file and hope', 'Dosyayı ver, bekle'),
        resolve: (c) => {
          if (c.rng.chance(Math.min(0.97, 0.2 + gpaNow(c) * 0.22))) {
            c.h.money(wage(c, 300));
            c.h.stat('happiness', 4);
            return c.t('Renewed. The committee also added a small raise and a handshake that was a little too firm.', 'Yenilendi. Komisyon küçük bir artış ve biraz fazla sıkı bir el sıkma da ekledi.');
          }
          c.h.unflag('scholarship');
          c.h.stat('happiness', -6);
          return c.t('Not renewed. Tuition has returned, like a relative who stays too long.', 'Yenilenmedi. Harç, fazla kalan bir misafir gibi geri döndü.');
        },
      },
      {
        id: 'support',
        label: (c) => c.t('Ask a hoca for a support letter', 'Bir hocadan destek mektubu iste'),
        resolve: (c) => {
          if (c.rng.chance(Math.min(0.98, 0.32 + gpaNow(c) * 0.22))) {
            c.h.money(wage(c, 300));
            c.h.stat('happiness', 4);
            return c.t('The letter said you were "a net positive for the department". You are using that on your CV.', 'Mektupta "bölüme net katkı sağlıyor" yazıyordu. Bunu özgeçmişine koyuyorsun.');
          }
          c.h.unflag('scholarship');
          c.h.stat('happiness', -6);
          return c.t('The hoca wrote a lovely letter, but the committee wanted a higher number than your grades gave them.', 'Hoca güzel bir mektup yazdı ama komisyon notlarının verdiğinden yüksek bir rakam istedi.');
        },
      },
      {
        id: 'let_go',
        label: (c) => c.t('Let it lapse and work instead', 'Bırak, çalış'),
        resolve: (c) => {
          c.h.unflag('scholarship');
          c.h.money(wage(c, 1000));
          c.h.stat('happiness', -2);
          return c.t('You gave up the scholarship for a job and your evenings. The paperwork is gone; so is the pressure.', 'Bursu bir işe ve akşamlarına karşılık bıraktın. Evrak kalmadı; baskı da.');
        },
      },
    ],
  }),

  // ------------------------------------------------------------------ the first year
  ev({
    id: 'campus.a_orientation',
    once: true,
    weight: 60,
    when: firstYear,
    title: (c) => c.t('Orientation week: you know nobody.', 'Oryantasyon haftası: kimseyi tanımıyorsun.'),
    text: (c) => c.t('Everyone else arrived in pairs with matching suitcases and calm faces.', 'Herkes ikişer üçer gelmiş, valizler takım, yüzler sakin.'),
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    choices: [
      {
        id: 'everything',
        label: (c) => c.t('Go to every event', 'Her etkinliğe katıl'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          c.h.addRelation(f, 'friend', c.rng.int(56, 76));
          c.h.stat('happiness', 4);
          c.h.stat('health', -2);
          return c.t(`By Friday you had ten phone numbers, one sunburn and a new friend, ${f.firstName}. You cannot remember the other nine.`, `Cuma günü on telefon numaran, bir güneş yanığın ve yeni bir arkadaşın vardı: ${f.firstName}. Diğer dokuzunu hatırlamıyorsun.`);
        },
        tone: 'good',
      },
      {
        id: 'corner',
        label: (c) => c.t('Read in a corner', 'Köşede kitap oku'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          bumpGpa(c, 0.05);
          c.h.stat('happiness', -1);
          return c.t('You read a novel in the corner of every event. Two other people did the same. You are not friends yet, but you recognise one another.', 'Her etkinliğin köşesinde bir roman okudun. İki kişi daha aynısını yaptı. Henüz arkadaş değilsiniz ama birbirinizi tanıyorsunuz.');
        },
      },
      {
        id: 'town',
        label: (c) => c.t('Explore the town alone', 'Şehri tek başına gez'),
        resolve: (c) => {
          pay(c, 30);
          c.h.stat('happiness', 3);
          return c.t('You found the best simit in town, a hill with a view and a bench with your name on it (not literally).', 'Şehrin en güzel simidini, manzaralı bir tepeyi ve sanki adına yapılmış bir bank buldun.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_homesick',
    weight: 40,
    cooldown: 3,
    when: (c) => firstYear(c) && !c.p.home.owned,
    title: (c) => c.t('You are homesick on a Sunday evening.', 'Pazar akşamı memleket özlemi bastı.'),
    text: (c) => c.t("The dorm smells of other people's dinners. None of them are your family's.", 'Yurt başkalarının akşam yemeklerinin kokusuyla dolu. Hiçbiri senin evinin kokusu değil.'),
    choices: [
      {
        id: 'call',
        label: (c) => c.t('Call home', 'Eve telefon et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          const parents = c.h.relatives(['mother', 'father']);
          if (parents.length) {
            c.h.closeness(parents[0].person.id, 4);
            return c.t('Your parent cried first, then asked if you were eating. You said yes. You had eaten toast.', 'Önce annen babandan biri ağladı, sonra yemek yiyip yemediğini sordu. "Yiyorum" dedin. Tost yemiştin.');
          }
          return c.t('You called the only number that still answers on Sundays. It helped more than you let on.', 'Pazar günleri hâlâ açan tek numarayı aradın. Gösterdiğinden daha çok iyi geldi.');
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Take the bus home for the weekend', 'Hafta sonu otobüsle eve git'),
        badge: 'Costs more',
        ...afford(80),
        resolve: (c) => {
          pay(c, 80);
          c.h.stat('happiness', 6);
          c.h.stat('health', 2);
          bumpGpa(c, -0.03);
          return c.t('You came back with a laundry bag full of home-cooked food and no homework done. Both were worth it.', 'Evden yemek dolu bir çamaşır torbasıyla, yapılmamış ödevle döndün. İkisi de değdi.');
        },
      },
      {
        id: 'busy',
        label: (c) => c.t('Throw yourself into your studies', 'Kendini derslere ver'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          bumpGpa(c, 0.05);
          c.h.stat('happiness', -1);
          return c.t('You studied until the longing faded. It came back at 2 a.m., on time, but you were ready.', 'Özlem geçene kadar çalıştın. Gece ikide tam zamanında geri geldi ama hazırlıklıydın.');
        },
      },
    ],
  }),

  ev({
    id: 'campus.a_laundry',
    once: true,
    weight: 45,
    when: firstYear,
    setup: (c) => {
      c.vars.pid = classmate(c).id;
    },
    title: (c) => c.t('Your first laundry day ends in pink.', 'İlk çamaşır günün her şeyin pembe olmasıyla bitti.'),
    text: (c) => c.t('One red sock. One white wardrobe. A new personality.', 'Bir kırmızı çorap. Bir beyaz gardırop. Yeni bir kişilik.'),
    choices: [
      {
        id: 'proud',
        label: (c) => c.t('Wear it with confidence', 'Pembeyi özgüvenle giy'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('looks', 2);
            c.h.stat('happiness', 3);
            return c.t('People asked where you got such a bold colour. You said "Paris". It was the dorm laundry room.', 'İnsanlar bu cesur rengi nereden aldığını sordu. "Paris" dedin. Yurdun çamaşırhanesiydi.');
          }
          c.h.stat('looks', -1);
          c.h.stat('happiness', -1);
          return c.t('Someone in the lecture asked if you were "the pink person". You are now the pink person.', 'Derste biri sana "pembeli kişi" misin diye sordu. Artık pembeli kişisin.');
        },
      },
      {
        id: 'replace',
        label: (c) => c.t('Buy a new wardrobe', 'Yeni gardırop al'),
        badge: 'Costs more',
        ...afford(120),
        resolve: (c) => {
          pay(c, 120);
          c.h.stat('looks', 1);
          return c.t('You bought plain things in plain colours. You have vowed never to wash anything with a red sock again.', 'Sade renklerde sade parçalar aldın. Bir daha kırmızı çorapla hiçbir şey yıkamamaya yemin ettin.');
        },
      },
      {
        id: 'ask',
        label: (c) => c.t('Ask a neighbor how laundry works', 'Komşu odadakine çamaşırın nasıl yıkandığını sor'),
        resolve: (c) => {
          const f = c.h.person(String(c.vars.pid));
          c.h.addRelation(f, 'friend', c.rng.int(52, 72));
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 2);
          return c.t(`${f.firstName} taught you about colours, temperatures and the term "delicates". Humbling, and warm.`, `${f.firstName} sana renkleri, dereceleri ve "narin kumaş" kavramını öğretti. Alçakgönüllülük dersi, ama sıcacık.`);
        },
        tone: 'good',
      },
    ],
  }),
];
