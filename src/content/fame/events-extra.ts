import type { Ctx, EventDef } from '../types';
import type { Person } from '../../engine/types';
import { cap, kin, wage } from '../base/util';
import { fameState, gainFans, isPath, loseFans, peekFame, type FameState } from './state';
import { compact, fameOf, free, hasPath } from './util';

// Fame pack, second set: 15 events for the gaps. The first break, life as a public person, the people around the
// star and the long game. Randomness: one pick in setup where text varies, chances in resolve, never language-bound.

const W = 7;
const fs = (c: Ctx): FameState => fameState(c.p);
const star = (c: Ctx, lo: number, hi = 100) => hasPath(c) && free(c) && fameOf(c) >= lo && fameOf(c) <= hi;
const peak = (c: Ctx) => peekFame(c.p)?.peakFame ?? 0;
const kidsAged = (c: Ctx, min: number, max: number) => c.h.relatives('child').filter((k) => c.h.ageOf(k.person) >= min && c.h.ageOf(k.person) <= max);
const pp = (c: Ctx): Person => c.h.person(String(c.vars.pid));
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

export const fameExtraEvents: EventDef[] = [
  // ================================================================ the first break
  {
    id: 'fame.x_bad_review',
    category: 'fame',
    minAge: 14,
    weight: W,
    cooldown: 6,
    when: (c) => star(c, 12, 45),
    title: (c) => c.t('Your first bad review is out.', 'İlk kötü eleştirin yayımlandı.'),
    text: (c) =>
      byPath(
        c,
        ['A critic called your voice "a kettle having a crisis". Your mother cut it out and framed it anyway.', 'A commenter with a very small profile picture wrote that you are "a ring light with opinions". Three hundred people liked it.', 'A critic wrote that you are "a very confident beginner". Three people shared it.'],
        ['Bir eleştirmen sesin için "krize girmiş bir çaydanlık" yazdı. Annen yine de kupürü kesip çerçeveletti.', 'Profil resmi çok küçük biri senin için "fikirleri olan bir halka ışık" yazdı. Üç yüz kişi beğendi.', 'Bir eleştirmen senin için "çok kendinden emin bir acemi" yazdı. Üç kişi paylaştı.'],
      ),
    choices: [
      {
        id: 'reply',
        label: (c) => c.t('Write a witty reply', 'Esprili bir cevap yaz'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.12 + 200);
            return c.t(`Your reply made the critic look grumpy and you look charming. ${compact(c, g)} new fans.`, `Cevabın eleştirmeni huysuz, seni sempatik gösterdi. ${compact(c, g)} yeni hayran.`);
          }
          const lost = scandal(c, 0.04);
          c.h.stat('happiness', -3);
          return c.t(`The joke landed badly and the critic wrote a second, longer review. ${compact(c, lost)} fans left.`, `Espri tutmadı, eleştirmen ikinci ve daha uzun bir yazı yazdı. ${compact(c, lost)} hayran gitti.`);
        },
      },
      {
        id: 'learn',
        label: (c) => c.t('Read it twice, take notes', 'İki kere oku, not al'),
        resolve: (c) => {
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 3);
          c.h.stat('happiness', -2);
          return c.t('It stung, and two of the points were right. You worked on those two.', 'Canını yaktı ama iki eleştiri haklıydı. O ikisi üzerinde çalıştın.');
        },
        tone: 'good',
      },
      {
        id: 'ignore',
        label: (c) => c.t('Never read reviews again', 'Bir daha hiç yorum okuma'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You banned reviews from the house. Your menajer now reads them aloud, but only the nice ones.', 'Eve eleştiri girmesini yasakladın. Menajerin artık yalnızca güzel olanları sana okuyor.');
        },
      },
    ],
  },
  {
    id: 'fame.x_lucky_audition',
    category: 'fame',
    minAge: 16,
    maxAge: 60,
    weight: W,
    once: true,
    when: (c) => isPath(c, 'acting') && free(c) && fameOf(c) <= 45,
    title: (c) => c.t('You walked into the wrong audition.', 'Yanlış seçmeye girdin.'),
    text: (c) => c.t('You were looking for the toilet. The casting director thinks your confused face is exactly what the dizi needs.', 'Tuvaleti arıyordun. Casting yönetmeni şaşkın yüzünün dizinin tam aradığı şey olduğunu düşünüyor.'),
    choices: [
      {
        id: 'play',
        label: (c) => c.t('Play along', 'Oyunu sürdür'),
        badge: 'Risky',
        resolve: (c) => {
          const f = fs(c);
          if (c.rng.chance(0.6)) {
            f.roles++;
            f.skill = Math.min(100, f.skill + 2);
            const g = gainFans(c, f, f.fans * 0.2 + 500);
            const pay = wage(c, 3000);
            c.h.money(pay);
            c.h.stat('happiness', 5);
            return c.t(`You got a small part, three lines and a very good coat. ${compact(c, g)} new fans, ${c.h.fmt(pay)} for the week.`, `Küçük bir rol kaptın: üç replik ve çok güzel bir palto. ${compact(c, g)} yeni hayran, haftalığın ${c.h.fmt(pay)}.`);
          }
          c.h.stat('happiness', -2);
          return c.t('You read the wrong script out loud with great feeling. The room clapped politely, and nobody called back.', 'Yanlış metni büyük bir duyguyla yüksek sesle okudun. Salon nazikçe alkışladı, kimse geri aramadı.');
        },
      },
      {
        id: 'confess',
        label: (c) => c.t('Confess and ask for the toilet', 'İtiraf et, tuvaleti sor'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          const g = gainFans(c, fs(c), 150);
          return c.t(`They laughed so hard they offered you a coffee and a card. ${compact(c, g)} people heard the story.`, `O kadar güldüler ki sana kahve ve kartvizit ikram ettiler. Hikâyeyi ${compact(c, g)} kişi duydu.`);
        },
        tone: 'good',
      },
      {
        id: 'leave',
        label: (c) => c.t('Slip out quietly', 'Sessizce sıvış'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You slipped out, found the toilet and never found out who got the part.', 'Sessizce çıktın, tuvaleti buldun; rolü kimin aldığını hiç öğrenemedin.');
        },
      },
    ],
  },
  {
    id: 'fame.x_show_cancelled',
    category: 'fame',
    minAge: 15,
    weight: W,
    cooldown: 7,
    when: (c) => star(c, 15, 55),
    setup: (c) => {
      c.vars.pay = wage(c, c.rng.int(2000, 6000));
    },
    title: (c) => byPath(c, ['Your gig was cancelled.', 'Your livestream was cancelled.', 'Your dizi was cancelled.'], ['Konserin iptal edildi.', 'Canlı yayının iptal edildi.', 'Dizin yayından kalktı.']),
    text: (c) => c.t('The organizer sent an email with six exclamation marks and no explanation. The venue found a wedding to host instead.', 'Organizatör altı ünlemli ve açıklamasız bir e-posta gönderdi. Mekân yerine bir düğün buldu.'),
    choices: [
      {
        id: 'sue',
        label: (c) => c.t('Demand your fee', 'Ücretini talep et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.money(Number(c.vars.pay));
            return c.t(`The lawyer's letter worked. ${c.h.fmt(Number(c.vars.pay))} arrived, plus an apology bouquet.`, `Avukat mektubu işe yaradı. ${c.h.fmt(Number(c.vars.pay))} hesabına yattı, üstüne özür çiçeği geldi.`);
          }
          c.h.money(-Math.round(Number(c.vars.pay) / 4));
          c.h.stat('happiness', -3);
          return c.t('The organizer disappeared and the lawyer did not. You paid the lawyer.', 'Organizatör ortadan kayboldu, avukat kaybolmadı. Avukatın parasını sen ödedin.');
        },
      },
      {
        id: 'free',
        label: (c) => c.t('Play for free on the pavement', 'Kaldırımda bedavaya çal'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.08 + 300);
          c.h.stat('happiness', 4);
          return c.t(`You made a show out of nothing, on the pavement outside the venue. ${compact(c, g)} new fans and one noise complaint.`, `Mekânın önündeki kaldırımda yoktan bir gösteri çıkardın. ${compact(c, g)} yeni hayran ve bir gürültü şikâyeti.`);
        },
        tone: 'good',
      },
      {
        id: 'rest',
        label: (c) => c.t('Take it as a day off', 'Tatil günü say'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('health', 2);
          return c.t('You slept until noon for the first time this year. The fans will survive.', 'Bu yıl ilk kez öğlene kadar uyudun. Hayranlar bir gün dayanır.');
        },
      },
    ],
  },
  // ================================================================ life as a public person
  {
    id: 'fame.x_kind_letter',
    category: 'fame',
    minAge: 16,
    weight: W,
    cooldown: 8,
    when: (c) => star(c, 40),
    title: (c) => c.t('A very long letter, and the same handwriting again.', 'Çok uzun bir mektup, yine aynı el yazısı.'),
    text: (c) => c.t('Eleven pages, all about how you are meant to be together. The sender signs off "your biggest fan", twice.', 'On bir sayfa, hepsi sizin nasıl birbirinize ait olduğunuz üzerine. Gönderen iki kere "en büyük hayranın" diye imza atmış.'),
    choices: [
      {
        id: 'kind',
        label: (c) => c.t('Answer kindly, set a limit', 'Nazikçe cevapla, sınır koy'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 3);
            return c.t('You wrote a short, warm reply that said no clearly. The letters stopped, and a thank-you card came instead.', 'Kısa, sıcak ama net bir ret yazdın. Mektuplar kesildi, onun yerine bir teşekkür kartı geldi.');
          }
          c.h.stat('happiness', -3);
          return c.t('The reply was too kind and the letters doubled. Your menajer took over the mailbox.', 'Cevap fazla naziktı, mektuplar ikiye katlandı. Posta kutusunu menajerin devraldı.');
        },
        tone: 'good',
      },
      {
        id: 'agent',
        label: (c) => c.t('Let the security team handle it', 'Güvenlik ekibi baksın'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          return c.t('A professional called the sender. It went well, and you slept better, if a little guiltily.', 'Profesyonel biri göndereni aradı. İş yoluna girdi; biraz mahcup da olsan daha rahat uyudun.');
        },
      },
      {
        id: 'frame',
        label: (c) => c.t('Keep it and say nothing', 'Sakla, hiçbir şey söyleme'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -5);
            return c.t('A fourth letter arrived, with a photo of your front door. You called the police that night.', 'Dördüncü mektup geldi, içinde ön kapının fotoğrafı vardı. O gece polisi aradın.');
          }
          return c.t('No more letters came. You still check the mailbox with one eye closed.', 'Başka mektup gelmedi. Posta kutusuna hâlâ tek gözün kapalı bakıyorsun.');
        },
      },
    ],
  },
  {
    id: 'fame.x_tabloid_story',
    category: 'fame',
    minAge: 16,
    weight: W,
    cooldown: 6,
    when: (c) => star(c, 35),
    setup: (c) => {
      c.vars.i = c.rng.int(0, 2);
    },
    title: (c) => c.t('The tabloids invented a story about you.', 'Magazin sayfaları senin hakkında bir hikâye uydurdu.'),
    text: (c) => {
      const i = Number(c.vars.i);
      return c.t(
        ['Front page: you are secretly engaged to someone who owns a boat. You have never met anyone who owns a boat.', 'Front page: you have a secret twin who lives in a lighthouse.', 'Front page: you are hiding a fortune inside a sofa.'][i],
        ['Manşet: tekne sahibi biriyle gizlice nişanlanmışsın. Tekne sahibi biriyle hiç tanışmadın.', 'Manşet: bir deniz fenerinde yaşayan gizli bir ikizin varmış.', 'Manşet: servetini bir kanepenin içinde saklıyormışsın.'][i],
      );
    },
    choices: [
      {
        id: 'deny',
        label: (c) => c.t('Deny it firmly', 'Kesin bir dille yalanla'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 2);
            return c.t('Your statement ran on page nine. At least it ran.', 'Açıklaman dokuzuncu sayfada çıktı. Hiç değilse çıktı.');
          }
          const g = gainFans(c, fs(c), fs(c).fans * 0.03 + 100);
          return c.t(`Denying only made the story bigger. ${compact(c, g)} people got curious about you.`, `Yalanlama hikâyeyi daha da büyüttü. ${compact(c, g)} kişi seni merak etti.`);
        },
      },
      {
        id: 'play',
        label: (c) => c.t('Play along for a week', 'Bir hafta oyuna katıl'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.1 + 500);
            c.h.stat('happiness', 3);
            return c.t(`Your winks at the cameras went viral. ${compact(c, g)} new fans, and a boat owner sent you a bottle of wine.`, `Kameralara göz kırpışların gündem oldu. ${compact(c, g)} yeni hayran; tekne sahibi biri sana şarap gönderdi.`);
          }
          const lost = scandal(c, 0.04);
          return c.t(`Nobody found the joke funny. ${compact(c, lost)} fans left.`, `Kimse şakayı komik bulmadı. ${compact(c, lost)} hayran gitti.`);
        },
      },
      {
        id: 'ignore',
        label: (c) => c.t('Laugh and say nothing', 'Gül geç'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('By Friday the paper had a new victim. You framed the page and put it in the toilet.', 'Cuma günü gazetenin yeni bir kurbanı vardı. Sayfayı çerçeveleyip tuvalete astın.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'fame.x_charity_request',
    category: 'fame',
    minAge: 18,
    weight: W,
    cooldown: 6,
    when: (c) => star(c, 30) && c.p.money >= wage(c, 5000),
    setup: (c) => {
      c.vars.cost = wage(c, 4000);
    },
    title: (c) => c.t('A children\'s charity wants your face.', 'Bir çocuk vakfı yüzünü istiyor.'),
    text: (c) => c.t('A small foundation is putting on a gala. Their budget is a raffle and a very large cake.', 'Küçük bir vakıf gala düzenliyor. Bütçeleri bir çekiliş ve kocaman bir pasta.'),
    choices: [
      {
        id: 'show',
        label: (c) => c.t('Show up and stay all night', 'Gel, sabaha kadar kal'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.04 + 200);
          c.h.stat('happiness', 5);
          return c.t(`You sold raffle tickets and cut the cake. A child asked if you were a real person. ${compact(c, g)} new fans.`, `Çekiliş bileti sattın, pastayı kestin. Bir çocuk senin gerçek biri olup olmadığını sordu. ${compact(c, g)} yeni hayran.`);
        },
        tone: 'good',
      },
      {
        id: 'cheque',
        label: (c) => c.t('Send a donation', 'Bağış gönder'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-Number(c.vars.cost));
          c.h.stat('happiness', 2);
          return c.t(`You donated ${c.h.fmt(Number(c.vars.cost))}. They named a reading corner after you, without the cake.`, `${c.h.fmt(Number(c.vars.cost))} bağışladın. Kütüphanede bir okuma köşesine adını verdiler, pasta yok tabii.`);
        },
      },
      {
        id: 'busy',
        label: (c) => c.t('Say your calendar is full', 'Takvimin dolu de'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('It was true, and it still felt bad. You sent a signed poster; they raffled it for a lot.', 'Doğruydu ama yine de kötü hissettirdi. İmzalı bir poster yolladın; çekilişte iyi para etti.');
        },
      },
    ],
  },
  {
    id: 'fame.x_wardrobe_live',
    category: 'fame',
    minAge: 15,
    weight: W,
    cooldown: 8,
    when: (c) => star(c, 35),
    title: (c) => c.t('Your trousers gave up live on air.', 'Pantolonun canlı yayında pes etti.'),
    text: (c) => c.t('Four million viewers, one split seam and a stylist who is suddenly very interested in her shoes.', 'Dört milyon izleyici, bir patlayan dikiş ve birdenbire ayakkabılarıyla çok ilgilenen bir stilist.'),
    choices: [
      {
        id: 'laugh',
        label: (c) => c.t('Laugh and keep going', 'Gül ve devam et'),
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.07 + 400);
            c.h.stat('happiness', 3);
            return c.t(`You finished the interview with a jacket tied around your waist. ${compact(c, g)} new fans love people who laugh at themselves.`, `Röportajı belinde bağlı bir ceketle bitirdin. Kendine gülenleri seven ${compact(c, g)} yeni hayran kazandın.`);
          }
          c.h.stat('happiness', -3);
          return c.t('The clip was slowed down and set to music. You had to laugh again, a little less.', 'Görüntü yavaşlatılıp müzikle paylaşıldı. Bir kez daha güldün ama bu sefer biraz daha az.');
        },
        tone: 'good',
      },
      {
        id: 'blame',
        label: (c) => c.t('Blame the stylist on air', 'Stilisti canlı yayında suçla'),
        badge: 'Risky',
        resolve: (c) => {
          const lost = scandal(c, 0.03);
          return c.t(`The stylist cried backstage and the internet took her side. ${compact(c, lost)} fans left.`, `Stilist kuliste ağladı, internet onun yanında durdu. ${compact(c, lost)} hayran gitti.`);
        },
      },
      {
        id: 'brand',
        label: (c) => c.t('Turn it into a clothing line', 'Bir giyim koleksiyonuna çevir'),
        badge: 'Big money',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            const pay = wage(c, 15000);
            c.h.money(pay);
            return c.t(`"Split Seam" trousers sold out in a day. ${c.h.fmt(pay)} for one bad moment.`, `"Patlak Dikiş" pantolonları bir günde tükendi. Tek bir kötü an için ${c.h.fmt(pay)}.`);
          }
          c.h.money(-wage(c, 2000));
          return c.t('Nobody wanted trousers that burst. The warehouse is now full of them.', 'Kimse patlayan pantolon istemedi. Depo şimdi onlarla dolu.');
        },
      },
    ],
  },
  // ================================================================ the people around you
  {
    id: 'fame.x_agent_cut',
    category: 'fame',
    minAge: 18,
    weight: W,
    cooldown: 8,
    when: (c) => star(c, 40),
    setup: (c) => {
      c.vars.cut = c.rng.pick([15, 20, 25]);
    },
    title: (c) => c.t('Your manager wants a bigger cut.', 'Menajerin payını artırmak istiyor.'),
    text: (c) => c.t(`Over lunch, ${c.vars.cut}% of everything is what they want. They insist it is "just the market", and order the second dessert.`, `Öğle yemeğinde her şeyden yüzde ${c.vars.cut} istiyor. "Piyasa böyle" diyor ve ikinci tatlıyı söylüyor.`),
    choices: [
      {
        id: 'agree',
        label: (c) => c.t('Agree to the new deal', 'Yeni anlaşmayı kabul et'),
        resolve: (c) => {
          c.h.money(-wage(c, 6000));
          const g = gainFans(c, fs(c), fs(c).fans * 0.05 + 300);
          return c.t(`Your manager worked harder than ever, loudly. ${compact(c, g)} new fans, and a smaller bank balance.`, `Menajerin her zamankinden çok, hem de yüksek sesle çalıştı. ${compact(c, g)} yeni hayran, biraz daha az bakiye.`);
        },
      },
      {
        id: 'bargain',
        label: (c) => c.t('Negotiate hard', 'Sert pazarlık et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.money(wage(c, 2000));
            c.h.stat('happiness', 3);
            return c.t('You settled for five points more, with a promise of better hotels. A good deal, a cold handshake.', 'Beş puan fazlaya, daha iyi oteller sözüyle anlaştınız. İyi bir anlaşma, soğuk bir tokalaşma.');
          }
          const lost = scandal(c, 0.03);
          return c.t(`They left and told a magazine about it. ${compact(c, lost)} fans left, and you answered your own phone for a month.`, `Gitti ve bunu bir dergiye anlattı. ${compact(c, lost)} hayran gitti, sen de bir ay telefonlara kendin baktın.`);
        },
      },
      {
        id: 'new',
        label: (c) => c.t('Find a new manager', 'Yeni menajer bul'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 4000));
          c.h.stat('happiness', 2);
          return c.t('The new one is cheaper, younger and answers messages in eleven minutes. You miss the old one a little.', 'Yenisi daha ucuz, daha genç ve mesajlara on bir dakikada cevap veriyor. Eskisini biraz özledin.');
        },
      },
    ],
  },
  {
    id: 'fame.x_copycat',
    category: 'fame',
    minAge: 14,
    weight: W,
    cooldown: 8,
    when: (c) => star(c, 25, 75),
    title: (c) => c.t('Someone is copying everything you do.', 'Biri yaptığın her şeyi kopyalıyor.'),
    text: (c) => byPath(c, ['A newcomer plays your riff, wears your jacket and says your catchphrase.', 'A newcomer makes your videos, in your corner of the room, with your same ring light.', 'A newcomer takes your type of roles, your hairstyle and your agent\'s lunch table.'], ['Yeni biri senin riff\'ini çalıyor, senin ceketini giyiyor ve senin lafını kullanıyor.', 'Yeni biri senin videolarını, odanın senin köşende, aynı halka ışıkla çekiyor.', 'Yeni biri senin rollerini, saç modelini ve menajerinin yemek masasını alıyor.']),
    choices: [
      {
        id: 'public',
        label: (c) => c.t('Call them out publicly', 'Herkesin içinde ifşa et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.45)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.05 + 200);
            return c.t(`You were right and everyone agreed. ${compact(c, g)} fans stood up for you.`, `Haklıydın ve herkes katıldı. ${compact(c, g)} hayran sana destek çıktı.`);
          }
          const lost = scandal(c, 0.03);
          return c.t(`Now you look petty and they look like a young talent. ${compact(c, lost)} fans left.`, `Şimdi sen küçük düşünen, o genç bir yetenek gibi göründü. ${compact(c, lost)} hayran gitti.`);
        },
      },
      {
        id: 'mentor',
        label: (c) => c.t('Invite them for tea', 'Çaya davet et'),
        resolve: (c) => {
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 2);
          c.h.stat('happiness', 3);
          return c.t('Over tea you found out they just wanted to be you. By the third glass you were giving advice.', 'Çay sohbetinde sadece senin gibi olmak istediğini öğrendin. Üçüncü bardakta nasihat veriyordun.');
        },
        tone: 'good',
      },
      {
        id: 'ahead',
        label: (c) => c.t('Reinvent yourself, stay ahead', 'Kendini yenile, bir adım önde ol'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 3000));
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 3);
          return c.t('You changed your look and your sound. The copycat spent a year catching up, and you were already bored of the new thing.', 'Görünümünü ve sesini değiştirdin. Taklitçi bir yıl yetişmeye çalıştı, sen yeniden sıkılmıştın bile.');
        },
      },
    ],
  },
  {
    id: 'fame.x_fan_friend',
    category: 'fame',
    minAge: 16,
    weight: W,
    once: true,
    when: (c) => star(c, 30),
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: Math.max(16, c.age + c.rng.int(-8, 8)) }).id;
    },
    title: (c) => c.t(`${pn(c)} has come to every show.`, `${cap(pn(c))} her konserine geliyor.`),
    text: (c) => c.t(`${pn(c)} has stood in the same spot at the front for two years and knows the setlist better than you do. After the show, ${pn(c)} hands you a flask of tea.`, `${cap(pn(c))} iki yıldır hep aynı yerde, en önde duruyor ve setlisti senden iyi biliyor. Gösteriden sonra sana bir termos çay uzatıyor.`),
    choices: [
      {
        id: 'befriend',
        label: (c) => c.t('Invite them backstage', 'Kulise davet et'),
        resolve: (c) => {
          c.h.addRelation(pp(c), 'friend', 40);
          c.h.stat('happiness', 5);
          return c.t(`${pn(c)} became a real friend, the one who tells you when the show was bad.`, `${cap(pn(c))} gerçek bir arkadaşın oldu: gösteri kötüyse ilk söyleyen kişi.`);
        },
        tone: 'good',
      },
      {
        id: 'photo',
        label: (c) => c.t('Take a photo and move on', 'Fotoğraf çektir, devam et'),
        resolve: (c) => {
          gainFans(c, fs(c), 50);
          return c.t('A kind photo, a signed ticket, a smile. It will hang on a wall somewhere.', 'Güzel bir fotoğraf, imzalı bir bilet, bir gülümseme. Bir yerde duvarda asılı kalacak.');
        },
      },
      {
        id: 'staff',
        label: (c) => c.t('Offer a job on the crew', 'Ekipte iş teklif et'),
        resolve: (c) => {
          c.h.addRelation(pp(c), 'friend', 25);
          c.h.money(-wage(c, 1500));
          const f = fs(c);
          f.skill = Math.min(100, f.skill + 1);
          return c.t(`${cap(pn(c))} now sells the merch and runs the fan page better than any agency.`, `${cap(pn(c))} artık tişört satıyor ve hayran sayfasını bir ajanstan iyi yönetiyor.`);
        },
      },
    ],
  },
  {
    id: 'fame.x_child_spotlight',
    category: 'fame',
    minAge: 22,
    weight: W,
    cooldown: 8,
    needs: ['child'],
    when: (c) => star(c, 35) && kidsAged(c, 5, 17).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(kidsAged(c, 5, 17)).person.id;
    },
    title: (c) => c.t(`${pn(c)} wants to be on stage with you.`, `${cap(pn(c))} seninle sahneye çıkmak istiyor.`),
    text: (c) => c.t(`Your ${kin(c, pp(c), 'child')} has learned your encore by heart and announced it at dinner, standing on a chair.`, `${cap(kin(c, pp(c), 'child'))} bis parçanı ezberlemiş ve akşam yemeğinde sandalyenin üstüne çıkıp ilan etmiş.`),
    choices: [
      {
        id: 'once',
        label: (c) => c.t('One song, one time', 'Bir şarkı, bir kez'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), 8);
          const g = gainFans(c, fs(c), fs(c).fans * 0.05 + 300);
          c.h.stat('happiness', 4);
          return c.t(`${pn(c)} bowed three times and forgot the second verse. ${compact(c, g)} new fans cried anyway.`, `${cap(pn(c))} üç kez eğilip selam verdi, ikinci kıtayı unuttu. ${compact(c, g)} yeni hayran yine de ağladı.`);
        },
        tone: 'good',
      },
      {
        id: 'later',
        label: (c) => c.t('Not until school is done', 'Okul bitmeden olmaz'),
        resolve: (c) => {
          c.h.closeness(String(c.vars.pid), -3);
          c.h.stat('happiness', 1);
          return c.t(`${cap(pn(c))} sulked for a week and did the homework with a very dramatic sigh.`, `${cap(pn(c))} bir hafta surat astı, ödevi çok dramatik iç çekişlerle yaptı.`);
        },
      },
      {
        id: 'tour',
        label: (c) => c.t('Make them a regular on tour', 'Turnenin sabit konuğu yap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), 10);
            const g = gainFans(c, fs(c), fs(c).fans * 0.1 + 500);
            return c.t(`The audience adored the little duo. ${compact(c, g)} new fans, and a calendar full of school notes.`, `Seyirci küçük düeti çok sevdi. ${compact(c, g)} yeni hayran ve okul mazeret yazılarıyla dolu bir takvim.`);
          }
          c.h.closeness(String(c.vars.pid), -6);
          scandal(c, 0.02);
          return c.t(`A teacher called it a missed week of school, and the press called it a stage parent. ${cap(pn(c))} was tired.`, `Bir öğretmen buna okuldan kaçırılmış hafta dedi, basın "sahne velisi" yazdı. ${cap(pn(c))} yorgundu.`);
        },
      },
    ],
  },
  // ================================================================ the long game
  {
    id: 'fame.x_comeback_tour',
    category: 'fame',
    minAge: 50,
    weight: W,
    once: true,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f && free(c) && f.path === 'music' && f.peakFame >= 40 && (fameOf(c) <= f.peakFame - 4 || c.age >= 60);
    },
    setup: (c) => {
      c.vars.cost = wage(c, c.rng.int(8000, 20000));
    },
    title: (c) => c.t('A promoter wants a comeback tour.', 'Bir organizatör geri dönüş turnesi istiyor.'),
    text: (c) => c.t('Twelve cities, small halls, an audience that remembers every word and your old trousers. The bus has no toilet either.', 'On iki şehir, küçük salonlar, her sözü ve eski pantolonlarını hatırlayan bir seyirci. Otobüsün tuvaleti yine yok.'),
    choices: [
      {
        id: 'go',
        label: (c) => c.t('Pack the guitar and go', 'Çantayı topla, yola çık'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-Number(c.vars.cost));
          const f = fs(c);
          f.lastActiveYear = c.s.year;
          if (c.rng.chance(0.7)) {
            const g = gainFans(c, f, f.fans * 0.35 + 3000);
            const pay = Math.round(Number(c.vars.cost) * 2.2);
            c.h.money(pay);
            c.h.stat('happiness', 6);
            c.h.stat('health', -2);
            return c.t(`Twelve sold-out nights and a back that complains. ${compact(c, g)} fans old and new, and ${c.h.fmt(pay)} in ticket money.`, `On iki dolu gece ve şikâyet eden bir bel. Eski yeni ${compact(c, g)} hayran, bilet geliri ${c.h.fmt(pay)}.`);
          }
          c.h.stat('happiness', -3);
          return c.t('Half the halls were two-thirds empty. The people who came sang louder than a full house.', 'Salonların yarısı üçte iki boştu. Gelenler dolu bir salondan yüksek sesle söyledi.');
        },
      },
      {
        id: 'small',
        label: (c) => c.t('Three nights in your hometown', 'Memleketinde üç gece'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), 2000);
          c.h.stat('happiness', 4);
          return c.t(`Three nights, neighbours in the front row, tea served between songs. ${compact(c, g)} fans came back.`, `Üç gece, ön sırada komşular, şarkı arasında çay servisi. ${compact(c, g)} hayran geri döndü.`);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: (c) => c.t('Say you are done with buses', 'Otobüslerden bıktım de'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('health', 2);
          return c.t('You stayed home and let the old records do the touring.', 'Evde kaldın, eski plaklar turneye çıksın.');
        },
      },
    ],
  },
  {
    id: 'fame.x_farewell_show',
    category: 'fame',
    minAge: 58,
    weight: W,
    once: true,
    when: (c) => free(c) && peak(c) >= 50 && hasPath(c),
    title: (c) => c.t('Time for a farewell show?', 'Veda gösterisinin zamanı geldi mi?'),
    text: (c) => c.t('Your menajer found the biggest hall in town. Everyone you ever worked with has already said yes, even the ones who stopped speaking to you.', 'Menajerin şehrin en büyük salonunu buldu. Birlikte çalıştığın herkes evet dedi, seninle konuşmayanlar bile.'),
    choices: [
      {
        id: 'grand',
        label: (c) => c.t('Go big, invite everyone', 'Büyük yap, herkesi çağır'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 10000));
          const g = gainFans(c, fs(c), fs(c).fans * 0.1 + 2000);
          c.h.stat('happiness', 8);
          return c.t(`Three hours, four encores and one old rival crying in row six. ${compact(c, g)} fans will tell this story forever.`, `Üç saat, dört bis ve altıncı sırada ağlayan eski bir rakip. ${compact(c, g)} hayran bu geceyi hep anlatacak.`);
        },
        tone: 'big',
      },
      {
        id: 'child',
        label: (c) => c.t('Open with your child', 'Çocuğunla birlikte aç'),
        hidden: (c) => kidsAged(c, 16, 50).length === 0,
        resolve: (c) => {
          const k = c.rng.pick(kidsAged(c, 16, 50)).person;
          c.h.closeness(k.id, 12);
          const g = gainFans(c, fs(c), fs(c).fans * 0.06 + 1000);
          c.h.stat('happiness', 8);
          return c.t(`${cap(kin(c, k, 'child'))} played the first song and you played the last. A new name, an old stage. ${compact(c, g)} fans stood up.`, `İlk şarkıyı ${kin(c, k, 'child')}, sonuncuyu sen çaldın. Yeni bir isim, eski bir sahne. ${compact(c, g)} hayran ayağa kalktı.`);
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: (c) => c.t('One small room, no cameras', 'Küçük bir salon, kamerasız'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Fifty chairs, old friends, a thermos of tea. You said goodbye to a dream the way you started it.', 'Elli sandalye, eski dostlar, bir termos çay. Hayalinle, başladığın gibi vedalaştın.');
        },
      },
    ],
  },
  {
    id: 'fame.x_documentary',
    category: 'fame',
    minAge: 45,
    weight: W,
    once: true,
    when: (c) => free(c) && peak(c) >= 50,
    title: (c) => c.t('A film crew wants to make a documentary.', 'Bir ekip senin belgeselini çekmek istiyor.'),
    text: (c) => c.t('Their director has already interviewed your old neighbour, your first teacher and the man who sold you your first guitar.', 'Yönetmenleri çoktan eski komşunla, ilk öğretmeninle ve sana ilk aletini satan adamla konuşmuş.'),
    choices: [
      {
        id: 'open',
        label: (c) => c.t('Open every drawer', 'Bütün çekmeceleri aç'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            const g = gainFans(c, fs(c), fs(c).fans * 0.12 + 5000);
            c.h.stat('happiness', 5);
            return c.t(`It was funny and honest. A new generation found you; ${compact(c, g)} new fans.`, `Hem komikti hem dürüst. Yeni bir kuşak seni keşfetti; ${compact(c, g)} yeni hayran.`);
          }
          const lost = scandal(c, 0.04);
          c.h.stat('happiness', -4);
          return c.t(`Your old bandmate told his side too. ${compact(c, lost)} fans left, and one old friendship, again.`, `Eski grup arkadaşın kendi tarafını da anlattı. ${compact(c, lost)} hayran gitti, bir eski dostluk da bir kez daha.`);
        },
      },
      {
        id: 'control',
        label: (c) => c.t('Insist on final cut', 'Son kesim hakkını iste'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 8000));
          const g = gainFans(c, fs(c), fs(c).fans * 0.04 + 1000);
          return c.t(`You saw it first and removed the haircut years. ${compact(c, g)} new fans never knew.`, `Önce sen izledin ve saç modeli yıllarını çıkardın. ${compact(c, g)} yeni hayran hiçbir şey fark etmedi.`);
        },
      },
      {
        id: 'decline',
        label: (c) => c.t('Say your life is not a film', 'Hayatım film değil de'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('They made it anyway, with your old neighbour as the lead. It is surprisingly good.', 'Yine de çektiler, başrolde eski komşun. Şaşırtıcı derecede iyi.');
        },
      },
    ],
  },
  {
    id: 'fame.x_hall_of_fame',
    category: 'fame',
    minAge: 55,
    weight: W,
    once: true,
    when: (c) => free(c) && peak(c) >= 60,
    title: (c) => c.t('Your town wants to put up a statue.', 'Memleketin sana heykel dikmek istiyor.'),
    text: (c) => c.t('The mayor says it will stand in the main square, between the pigeons and the dolmuş stop. They ask how you want to be remembered.', 'Belediye başkanı heykelin ana meydanda, güvercinlerle dolmuş durağının arasında duracağını söylüyor. Nasıl hatırlanmak istediğini soruyor.'),
    choices: [
      {
        id: 'pose',
        label: (c) => c.t('Mid-performance, mouth open', 'Sahnede, ağzı açık'),
        resolve: (c) => {
          const g = gainFans(c, fs(c), fs(c).fans * 0.03 + 2000);
          c.h.stat('happiness', 7);
          return c.t(`Bronze you sings to the pigeons every day. ${compact(c, g)} visitors took photos with it this year.`, `Bronz sen güvercinlere her gün şarkı söylüyor. Bu yıl ${compact(c, g)} ziyaretçi onunla fotoğraf çektirdi.`);
        },
        tone: 'big',
      },
      {
        id: 'sitting',
        label: (c) => c.t('Sitting on a bench with an empty seat', 'Bir bankta, yanı boş oturuyor'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('Children climb on the bench and sit next to you. Someone leaves a glass of tea every morning.', 'Çocuklar banka çıkıp yanına oturuyor. Biri her sabah yanına bir bardak çay bırakıyor.');
        },
        tone: 'good',
      },
      {
        id: 'library',
        label: (c) => c.t('Give the money to a library instead', 'Parayı bunun yerine kütüphaneye ver'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 10000));
          c.h.stat('happiness', 5);
          return c.t('There is a small plaque with your name over the children\'s shelf. The mayor was relieved about the pigeons.', 'Çocuk rafının üstünde adının yazdığı küçük bir plaket var. Belediye başkanı güvercinler için rahatladı.');
        },
      },
    ],
  },
];
