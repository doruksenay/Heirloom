import type { EventDef } from '../types';
import { cap, kin, wage, who } from '../base/util';
import { inUK } from './common';

// UK culture pack: everyday life moments for characters living in the United Kingdom (British spelling and words).

const parentSetup = (c: Parameters<NonNullable<EventDef['setup']>>[0]) => {
  const k = c.h.relatives('child')[0];
  if (k) c.vars.pid = k.person.id;
};

export const ukEvents: EventDef[] = [
  // ------------------------------------------------------------------ childhood
  {
    id: 'uk.nativity',
    category: 'school',
    minAge: 6,
    maxAge: 9,
    once: true,
    weight: 10,
    when: (c) => inUK(c) && c.p.school === 'primary',
    needs: ['student'],
    title: (c) => c.t('The school nativity play', 'Okulun Noel oyunu'),
    text: (c) =>
      c.t(
        'The casting has gone up. Eleven shepherds, four angels, one donkey, and a tea towel with your name on it.',
        'Rol dağılımı asıldı. On bir çoban, dört melek, bir eşek ve üstünde adın yazan bir mutfak bezi var.',
      ),
    choices: [
      {
        id: 'star',
        label: (c) => c.t('Beg for the speaking part', 'Konuşmalı rolü kap'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            c.h.stat('smarts', 1);
            return c.t(
              'You delivered your one line, "No room at the inn", with real menace. A parent in row three started clapping.',
              'Tek repliğini, "Han dolu", gerçek bir tehditle söyledin. Üçüncü sıradaki bir veli alkışlamaya başladı.',
            );
          }
          c.h.stat('happiness', -3);
          return c.t(
            'Your mind went white. You said "Yes, come in" and the whole story fell apart. The donkey took over.',
            'Aklın bembeyaz oldu. "Evet, buyurun" deyip bütün hikâyeyi çökerttin. Sahneyi eşek devraldı.',
          );
        },
      },
      {
        id: 'tea_towel',
        label: (c) => c.t('Be the best shepherd you can be', 'En iyi çoban ol'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'You stood in your tea towel, held a stick and did not blink for twenty minutes. A teacher called it "a really committed shepherd".',
            'Mutfak bezinin içinde elinde sopayla yirmi dakika göz kırpmadan durdun. Öğretmen sana "gerçekten işine bağlı bir çoban" dedi.',
          );
        },
        tone: 'good',
      },
      {
        id: 'wave',
        label: (c) => c.t('Wave at your family in the audience', 'Seyircideki ailene el salla'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('looks', 1);
          return c.t(
            'You waved the entire time. The video goes on to be played at every family gathering for thirty years.',
            'Bütün oyun boyunca el salladın. O video otuz yıl boyunca her aile buluşmasında yeniden izlenecek.',
          );
        },
      },
    ],
  },
  {
    id: 'uk.eleven_plus',
    category: 'school',
    minAge: 10,
    maxAge: 11,
    once: true,
    weight: 10,
    when: (c) => inUK(c) && c.p.school === 'primary',
    needs: ['student'],
    title: (c) => c.t('The 11-plus is on Saturday', '11-plus sınavı cumartesi'),
    text: (c) =>
      c.t(
        'Your area still has a grammar school, and everyone in Year 6 has suddenly become very serious about verbal reasoning.',
        'Bölgende hâlâ bir devlet gramer okulu var ve altıncı sınıftaki herkes birden sözel mantığa kafayı taktı.',
      ),
    choices: [
      {
        id: 'revise',
        label: (c) => c.t('Do the practice papers every night', 'Her akşam deneme çöz'),
        resolve: (c) => {
          c.h.stat('smarts', 4);
          c.h.stat('happiness', -3);
          return c.t(
            'You worked through a tower of practice papers. You can now spot the odd one out in anything, including dinner.',
            'Bir kule dolusu deneme çözdün. Artık her şeyde, akşam yemeğinde bile, farklı olanı buluyorsun.',
          );
        },
      },
      {
        id: 'wing',
        label: (c) => c.t('Wing it', 'Boş ver, doğaçlama gir'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35 + c.p.stats.smarts / 200)) {
            c.h.stat('smarts', 2);
            c.h.stat('happiness', 5);
            return c.t('You guessed your way through the paper and passed. Nobody has ever been so relaxed about it, or so insufferable.', 'Kâğıdı tahminle doldurup geçtin. Kimse bu işi bu kadar rahat, bu kadar da çekilmez yapmamıştı.');
          }
          c.h.stat('happiness', -3);
          return c.t('The letter came on Tuesday. The words "not been offered a place" were doing a lot of work. The comprehensive down the road is fine, actually.', 'Salı günü mektup geldi. "Yer teklif edilmedi" cümlesi epey ağırdı. Yolun aşağısındaki normal okul aslında gayet iyi.');
        },
      },
      {
        id: 'walk',
        label: (c) => c.t('Go for a long walk and ignore it', 'Uzun bir yürüyüşe çık, unut'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 3);
          return c.t(
            'You spent the morning kicking leaves in the park. The exam is a rumour. The leaves were excellent.',
            'Sabahı parkta yaprakları tekmeleyerek geçirdin. Sınav bir söylentiydi. Yapraklar harikaydı.',
          );
        },
      },
    ],
  },

  // ------------------------------------------------------------------ teen
  {
    id: 'uk.gcse_results',
    category: 'school',
    minAge: 16,
    maxAge: 16,
    once: true,
    weight: 150,
    when: (c) => inUK(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('GCSE results day', 'GCSE sonuç günü'),
    text: (c) =>
      c.t(
        'A thin envelope waits for you in the school hall. Everyone is pretending to be calm, which is why the whole hall is shaking.',
        'Okul salonunda ince bir zarf seni bekliyor. Herkes sakinmiş gibi yapıyor, bu yüzden bütün salon titriyor.',
      ),
    choices: [
      {
        id: 'open_now',
        label: (c) => c.t('Open it right there', 'Hemen orada aç'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3 + c.p.stats.smarts / 140)) {
            c.h.stat('happiness', 7);
            c.h.stat('smarts', 1);
            return c.t('Mostly sevens and eights. You screamed, a teacher cried, and somebody hugged you who had never spoken to you.', 'Çoğu yedi ve sekiz. Bağırdın, bir öğretmen ağladı, seninle hiç konuşmamış biri de sarıldı.');
          }
          c.h.stat('happiness', -5);
          return c.t('A lot of fours and a three in maths. You went quiet in the hall and loud in the car park.', 'Bir sürü dört ve matematikten bir üç. Salonda sustun, otoparkta bağırdın.');
        },
      },
      {
        id: 'home',
        label: (c) => c.t('Take it home unopened', 'Açmadan eve götür'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          c.h.stat('health', -1);
          return c.t(
            'You carried the envelope home like a small bomb. At the kitchen table you opened it with one eye. It was fine. Mostly.',
            'Zarfı küçük bir bomba gibi eve taşıdın. Mutfak masasında tek gözünle açtın. İyiydi. Neredeyse.',
          );
        },
      },
      {
        id: 'friend',
        label: (c) => c.t('Make a friend open it for you', 'Bir arkadaşına açtır'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t(
            'Your friend read it out like a newsreader. You swapped envelopes and screamed in a bus shelter. A fine tradition.',
            'Arkadaşın zarfı spiker gibi okudu. Zarfları değiştirip bir otobüs durağında bağırdınız. Güzel bir gelenek.',
          );
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'uk.ucas',
    category: 'school',
    minAge: 17,
    maxAge: 17,
    once: true,
    weight: 150,
    when: (c) => inUK(c) && c.p.school === 'highschool',
    needs: ['student'],
    title: (c) => c.t('The UCAS offers come in', 'UCAS teklifleri geliyor'),
    text: (c) =>
      c.t(
        'Five universities have replied. One wants three As, one wants a personal statement rewrite, and one has sent a very long email about open days.',
        'Beş üniversite cevap verdi. Biri üç A istiyor, biri kişisel yazının baştan yazılmasını, biri de açık günler hakkında çok uzun bir e-posta göndermiş.',
      ),
    choices: [
      {
        id: 'firm',
        label: (c) => c.t('Pick the dream offer: three As', 'Hayal teklifini seç: üç A'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25 + c.p.stats.smarts / 160)) {
            c.h.stat('smarts', 3);
            c.h.stat('happiness', 5);
            return c.t('You ticked it as your firm choice and sent the form off before you could change your mind. Now it is all up to August.', 'Kesin tercihin olarak işaretleyip fikrin değişmeden formu gönderdin. Şimdi her şey ağustosa kaldı.');
          }
          c.h.stat('happiness', -3);
          c.h.stat('smarts', 1);
          return c.t('You aimed high and it is going to be tense in August. Clearing is a sport, and you are about to take it up.', 'Yükseği hedefledin, ağustos gergin geçecek. Yer arama dönemi (Clearing) başlı başına bir spor ve sen ona başlamak üzeresin.');
        },
      },
      {
        id: 'safe',
        label: (c) => c.t('Choose the safe insurance option', 'Güvenli sigorta seçeneğini seç'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', 2);
          c.h.stat('smarts', 1);
          return c.t('You picked the offer you can reach without crying. It has a good canal and a student union that does cheap chips.', 'Ağlamadan ulaşabileceğin teklifi seçtin. Güzel bir kanalı ve ucuz patates kızartması satan öğrenci birliği var.');
        },
      },
      {
        id: 'apprentice',
        label: (c) => c.t('Look at an apprenticeship instead', 'Bunun yerine çıraklığa bak'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('health', 1);
          c.h.stat('happiness', 3);
          return c.t(
            'You spent a Saturday at an employer open day. They paid you to learn, which your cousins could not believe.',
            'Cumartesiyi bir işverenin tanıtım gününde geçirdin. Sana öğrenmen için maaş veriyorlar, kuzenlerin buna inanamadı.',
          );
        },
      },
    ],
  },

  // ------------------------------------------------------------------ young adult
  {
    id: 'uk.deposit',
    category: 'money',
    minAge: 19,
    maxAge: 40,
    cooldown: 8,
    weight: 8,
    when: inUK,
    needs: ['renter'],
    title: (c) => c.t('The landlord and your deposit', 'Ev sahibi ve depozito'),
    text: (c) =>
      c.t(
        'You are moving out. The landlord is keeping part of your deposit for "a professional deep clean", which, strangely, did not happen.',
        'Taşınıyorsun. Ev sahibi depozitonun bir kısmını "profesyonel derin temizlik" için tutacağını söylüyor. Garip biçimde o temizlik hiç yapılmamış.',
      ),
    choices: [
      {
        id: 'dispute',
        label: (c) => c.t('Dispute it with your move-in photos', 'Taşınma fotoğraflarınla itiraz et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.65)) {
            c.h.money(wage(c, 900));
            c.h.stat('happiness', 4);
            return c.t('The deposit scheme sided with your photos of the same stain in the same place. Your money came back with a polite apology.', 'Depozito kurumu, aynı lekenin aynı yerde durduğu fotoğraflarını haklı buldu. Paran kibar bir özürle geri geldi.');
          }
          c.h.money(wage(c, 300));
          c.h.stat('happiness', -3);
          return c.t('Three weeks of emails later you got a little back and a lot of stress. The stain stays in your life story.', 'Üç haftalık e-postadan sonra biraz para ve çok stres kaldı. Leke hayat hikâyene dahil oldu.');
        },
      },
      {
        id: 'scrub',
        label: (c) => c.t('Scrub the flat yourself all night', 'Bütün gece evi kendin temizle'),
        resolve: (c) => {
          c.h.money(wage(c, 800));
          c.h.stat('health', -2);
          c.h.stat('happiness', 1);
          return c.t('You cleaned until midnight with a toothbrush. The landlord found nothing to complain about and looked quite disappointed.', 'Gece yarısına kadar diş fırçasıyla temizlik yaptın. Ev sahibi şikâyet edecek bir şey bulamadı ve açıkça hayal kırıklığına uğradı.');
        },
        tone: 'good',
      },
      {
        id: 'shrug',
        label: (c) => c.t('Shrug and let them keep it', 'Omuz silk, bırak kalsın'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(wage(c, 300));
          c.h.stat('happiness', -2);
          return c.t('You took what was offered and left. Somebody, somewhere, now owns a lovely new mop.', 'Verileni alıp çıktın. Biri, bir yerlerde, şimdi harika yeni bir paspasa sahip.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ adult
  {
    id: 'uk.pub_quiz',
    category: 'random',
    minAge: 20,
    maxAge: 70,
    cooldown: 3,
    weight: 8,
    when: inUK,
    title: (c) => c.t('Pub quiz night', 'Pub bilgi yarışması gecesi'),
    text: (c) =>
      c.t(
        'Your team has a name that was funny at the time. It is a tie-break question about the length of a river, and everybody is looking at you.',
        'Takımının adı o an çok komik gelmişti. Eşitlik bozma sorusu bir nehrin uzunluğu ve herkes sana bakıyor.',
      ),
    choices: [
      {
        id: 'guess',
        label: (c) => c.t('Trust your gut and write a number', 'İçgüdüne güven, bir sayı yaz'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.4 + c.p.stats.smarts / 250)) {
            c.h.money(wage(c, 60));
            c.h.stat('happiness', 6);
            return c.t('You were off by a single mile. The prize was a bar tab and a framed certificate nobody has ever put in a frame.', 'Sadece bir mil sapma yaptın. Ödül bir bar hesabı ve kimsenin hiç çerçeveletmediği bir sertifikaydı.');
          }
          c.h.stat('happiness', -1);
          return c.t('You were out by three hundred miles. The team still brings it up. The next round was brilliant, though.', 'Üç yüz mil yanıldın. Takım hâlâ bunu hatırlatıyor. Ama sonraki tur harikaydı.');
        },
      },
      {
        id: 'phone',
        label: (c) => c.t('Check your phone under the table', 'Telefona masanın altından bak'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', -4);
            return c.t('The quizmaster has eyes like a hawk. You were disqualified in front of two hundred strangers and a dog.', 'Sunucunun şahin gibi gözleri var. İki yüz yabancı ve bir köpeğin önünde diskalifiye edildin.');
          }
          c.h.money(wage(c, 60));
          c.h.stat('happiness', 3);
          return c.t('You won. The prize was lovely. Your conscience has been walking you home ever since.', 'Kazandın. Ödül çok güzeldi. Vicdanın o günden beri seni eve kadar yürütüyor.');
        },
      },
      {
        id: 'team',
        label: (c) => c.t('Let the team decide', 'Takım karar versin'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          return c.t('Four people shouted four numbers and the quietest one won. You came third, which is very much a result.', 'Dört kişi dört sayı bağırdı, en sessiz olan kazandı. Üçüncü oldunuz, bu da başlı başına bir sonuç.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'uk.marquee_wedding',
    category: 'milestone',
    minAge: 24,
    maxAge: 60,
    cooldown: 6,
    weight: 8,
    when: inUK,
    title: (c) => c.t('A wedding in a marquee', 'Çadırda bir düğün'),
    text: (c) =>
      c.t(
        'The couple chose a marquee in a field. It has not stopped raining for three days, and the dance floor is now a pond.',
        'Çift bir tarlada çadır tuttu. Üç gündür yağmur durmadı ve dans pisti bir göle döndü.',
      ),
    choices: [
      {
        id: 'dance',
        label: (c) => c.t('Dance in the mud anyway', 'Çamurda yine de dans et'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('looks', -2);
          return c.t('You danced barefoot in a puddle. Every photo from that night has you in it, very happy and very wet.', 'Çıplak ayakla su birikintisinde dans ettin. O geceden kalan her fotoğrafta varsın: çok mutlu ve sırılsıklam.');
        },
        tone: 'good',
      },
      {
        id: 'pole',
        label: (c) => c.t('Hold up the marquee pole with the best man', 'Sağdıçla çadır direğini tut'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            c.h.stat('health', -4);
            c.h.stat('happiness', -1);
            return c.t('The wind won. You went down with the pole and a trifle, and woke up with a sprained wrist and a standing ovation.', 'Rüzgâr kazandı. Direkle ve bir tatlıyla birlikte yere düştün; bileğin burkuldu ama ayakta alkışlandın.');
          }
          c.h.stat('happiness', 5);
          c.h.stat('smarts', 1);
          return c.t('Together you held that marquee up for two hours. A hero has been born, wearing a borrowed suit.', 'Birlikte o çadırı iki saat ayakta tuttunuz. Ödünç bir takımla bir kahraman doğdu.');
        },
      },
      {
        id: 'car',
        label: (c) => c.t('Wait it out in the car', 'Arabada bekle'),
        badge: 'Safe',
        resolve: (c) => {
          c.h.stat('happiness', -2);
          c.h.stat('health', 1);
          return c.t('You watched the speeches through a misty windscreen. You stayed dry. Everyone else got a story.', 'Konuşmaları buğulu bir ön camdan izledin. Kuru kaldın. Herkesin bir anısı oldu.');
        },
      },
    ],
  },

  // ------------------------------------------------------------------ elder
  {
    id: 'uk.gp_lottery',
    category: 'health',
    minAge: 55,
    maxAge: 90,
    cooldown: 5,
    weight: 8,
    when: inUK,
    title: (c) => c.t('The 8am GP phone queue', 'Sabah sekizde doktor telefon sırası'),
    text: (c) =>
      c.t(
        'You have been on hold since 8:00. You are number nine in the queue, and the cough is not going anywhere.',
        'Sabah sekizden beri beklemedesin. Sırada dokuzuncusun ve öksürük hiçbir yere gitmiyor.',
      ),
    choices: [
      {
        id: 'redial',
        label: (c) => c.t('Keep redialling until you get through', 'Hat açılana kadar tekrar ara'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.55)) {
            c.h.stat('health', 3);
            c.h.stat('happiness', 2);
            return c.t('At 8:41am a human answered. You got a slot for next Thursday, and the receptionist wished you luck.', 'Sekiz kırk birde bir insan telefonu açtı. Gelecek perşembeye randevu aldın ve görevli sana şans diledi.');
          }
          c.h.stat('happiness', -3);
          return c.t('All the appointments had gone by 8:05. You were told to ring again tomorrow. You will.', 'Bütün randevular sekizi beş geçe bitmişti. Yarın tekrar aramanı söylediler. Arayacaksın.');
        },
      },
      {
        id: 'pharmacist',
        label: (c) => c.t('Ask the pharmacist instead', 'Onun yerine eczacıya sor'),
        badge: 'Free',
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 2);
          return c.t('The pharmacist listened, nodded and handed over something that works. Nobody asked you to call back at 8am.', 'Eczacı dinledi, başını salladı ve işe yarayan bir şey uzattı. Kimse senden sabah sekizde aramanı istemedi.');
        },
        tone: 'good',
      },
      {
        id: 'private',
        label: (c) => c.t('Pay for a private appointment', 'Özel randevu için öde'),
        badge: 'Costs more',
        resolve: (c) => {
          c.h.money(-wage(c, 140));
          c.h.stat('health', 4);
          return c.t('You were seen the same afternoon, in a room with plants. The bill came with a leaflet, a tea and a mild guilty feeling.', 'Aynı öğleden sonra, bitkili bir odada muayene oldun. Fatura yanında bir broşür, bir çay ve hafif bir suçluluk duygusuyla geldi.');
        },
      },
    ],
  },
  {
    id: 'uk.sunday_roast',
    category: 'family',
    minAge: 58,
    maxAge: 95,
    cooldown: 5,
    weight: 8,
    when: inUK,
    needs: ['child'],
    setup: parentSetup,
    title: (c) => c.t('Sunday roast, family style', 'Pazar yemeği, aile usulü'),
    text: (c) => {
      const k = who(c);
      return k
        ? c.t(
            `Your ${kin(c, k, 'child')} is hosting Sunday roast. The Yorkshire puddings have risen, and so has the noise level.`,
            `${cap(kin(c, k, 'child'))} pazar yemeği veriyor. Yorkshire pudingleri kabardı, gürültü de öyle.`,
          )
        : '';
    },
    choices: [
      {
        id: 'seconds',
        label: (c) => c.t('Go back for seconds and thirds', 'İkinci ve üçüncü tabağa geç'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          c.h.stat('health', -1);
          if (c.vars.pid) c.h.closeness(String(c.vars.pid), 4);
          return c.t('You ate until the gravy ran out. Someone has to make the second pudding, and that someone is now very tired.', 'Sos bitene kadar yedin. İkinci pudingi birinin yapması gerek ve o kişi şimdi çok yorgun.');
        },
      },
      {
        id: 'carve',
        label: (c) => c.t('Offer to carve the joint', 'Etin dilimlenmesini üstlen'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          c.h.stat('smarts', 1);
          if (c.vars.pid) c.h.closeness(String(c.vars.pid), 6);
          return c.t('You carved with a steady hand and a cough of authority. Even the dog stopped to watch.', 'Sağlam bir elle ve otoriter bir öksürükle dilimledin. Köpek bile seyretmek için durdu.');
        },
        tone: 'good',
      },
      {
        id: 'nap',
        label: (c) => c.t('Nod off in the armchair', 'Koltukta uyuyakal'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 2);
          return c.t('You woke up under a blanket you never saw arrive, with a cup of tea going cold. It was a lovely afternoon.', 'Geldiğini görmediğin bir battaniyenin altında, soğumaya yüz tutmuş bir çayla uyandın. Güzel bir öğleden sonraydı.');
        },
      },
    ],
  },
];
