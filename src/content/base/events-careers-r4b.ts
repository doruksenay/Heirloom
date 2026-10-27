import type { EventDef } from '../types';
import { L, cash, fire, onAny, promo } from './career-helpers';
import { demote } from './activities-careers';

// Round 4 careers, part B: care and health, money and offices, the state, tech.

export const careerEventsR4b: EventDef[] = [
  // ================================================================ care and health
  {
    id: 'base.job_care_family',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('caregiver'),
    title: L('The family of the man you care for wants you to move in.', 'Baktığın yaşlı adamın ailesi yanlarına taşınmanı istiyor.'),
    text: L('Better pay, a room of your own, and no days off "except when needed". He holds your hand when they ask.', 'Daha iyi maaş, sana ait bir oda ve "gerektiğinde" dışında izin yok. Onlar sorarken adam elini tutuyor.'),
    choices: [
      {
        id: 'yes',
        label: L('Move in', 'Yanlarına taşın'),
        resolve: (c) => {
          const amt = cash(c, 2500);
          c.h.stat('happiness', 3);
          c.h.stat('health', -2);
          return c.t(`He is happier, the family is grateful, and you saved ${amt}. You also learned every song he knows. Twice.`, `Adam daha mutlu, aile minnettar ve sen ${amt} biriktirdin. Bildiği bütün şarkıları da öğrendin. İki kere.`);
        },
        tone: 'good',
      },
      {
        id: 'terms',
        label: L('Yes, with two days off a week', 'Olur, ama haftada iki gün izinle'),
        requires: (c) => c.p.stats.smarts >= 35,
        requiresLabel: 'Needs Smarts 35+',
        resolve: (c) => {
          const amt = cash(c, 1500);
          c.h.stat('happiness', 5);
          return c.t(`They agreed. ${amt} more a year and your weekends back. He calls Monday "the day you come home".`, `Kabul ettiler. Yılda ${amt} fazla ve hafta sonların sana geri döndü. Adam pazartesiye "sen eve geldiğin gün" diyor.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'no',
        label: L('Keep your own life', 'Kendi hayatını koru'),
        resolve: (c) => {
          c.h.stat('happiness', 1);
          return c.t('You said no kindly. You still visit him every Thursday, even after the family hired someone else.', 'Kibarca hayır dedin. Aile başkasını tuttuktan sonra bile her perşembe onu ziyaret ediyorsun.');
        },
      },
    ],
  },
  {
    id: 'base.job_paramedic_call',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('paramedic'),
    title: L('Two calls come in at once.', 'Aynı anda iki çağrı geldi.'),
    text: L('A man with chest pains across town, and a child with a broken arm around the corner.', 'Şehrin öbür ucunda göğüs ağrısı olan bir adam, köşede de kolu kırılmış bir çocuk.'),
    choices: [
      {
        id: 'chest',
        label: L('The chest pains first', 'Önce göğüs ağrısı'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You got there in eight minutes. It was a heart attack, and he lived. The child got the next ambulance and a lollipop.', 'Sekiz dakikada vardın. Kalp kriziymiş ve adam kurtuldu. Çocuğa bir sonraki ambulans ve bir lolipop düştü.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'child',
        label: L('The child, then race across town', 'Önce çocuk, sonra şehrin öbür ucuna yarış'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('You splinted the arm in four minutes and still beat the other crew across town. A legendary shift.', 'Kolu dört dakikada atele aldın ve yine de öbür ekipten önce şehrin öbür ucuna vardın. Efsanevi bir nöbet.');
          }
          c.h.stat('happiness', -8);
          return c.t('Another crew got to the man first, just in time. You did not sleep that night anyway.', 'Adama başka bir ekip senden önce, tam zamanında yetişti. Yine de o gece uyuyamadın.');
        },
      },
      {
        id: 'radio',
        label: L('Radio for help and take the closer one', 'Telsizle yardım iste, yakındakine git'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('Dispatch sent a second crew. Both patients were fine. The paperwork took longer than both calls.', 'Merkez ikinci bir ekip gönderdi. İki hasta da iyi. Evrak işleri iki çağrıdan da uzun sürdü.');
        },
      },
    ],
  },
  {
    id: 'base.job_pharmacy_plea',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('pharmacist'),
    title: L('A woman begs for antibiotics without a prescription.', 'Bir kadın reçetesiz antibiyotik için yalvarıyor.'),
    text: L('Her son has a fever, the clinic is closed and she has walked a long way.', 'Oğlunun ateşi var, sağlık ocağı kapalı ve çok yol yürümüş.'),
    choices: [
      {
        id: 'rules',
        label: L('Refuse, but call the night doctor for her', 'Reddet ama ona nöbetçi doktoru ara'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('The night doctor saw the boy within the hour. It was a virus; antibiotics would not have helped. She came back to thank you.', 'Nöbetçi doktor çocuğu bir saat içinde gördü. Virüsmüş; antibiyotik işe yaramayacakmış. Kadın teşekkür etmek için geri geldi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'give',
        label: L('Give her a short course', 'Kısa bir kür ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.25)) {
            cash(c, -1500);
            c.h.stat('happiness', -6);
            return c.t('An inspection the next month found the missing box. A fine and a warning on your licence.', 'Ertesi ay yapılan denetim eksik kutuyu buldu. Para cezası ve ruhsatına bir uyarı.');
          }
          return c.t('She left grateful. You lay awake wondering if you had done the right thing.', 'Kadın minnetle ayrıldı. Sen de doğru şeyi yapıp yapmadığını düşünerek uyuyamadın.');
        },
      },
      {
        id: 'fever',
        label: L('Sell her fever syrup and advice', 'Ateş şurubu ve tavsiye ver'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Fever syrup, lots of water, and the number of the emergency line. The boy was fine by morning.', 'Ateş şurubu, bol su ve acil hattın numarası. Çocuk sabaha iyiydi.');
        },
      },
    ],
  },
  {
    id: 'base.job_psych_market',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('psychologist'),
    title: L('You run into a client at the market. They are with their mother.', 'Pazarda bir danışanınla karşılaştın. Yanında annesi var.'),
    text: L('The mother is the main subject of six months of sessions. She is choosing tomatoes.', 'Anne, altı aydır süren seansların ana konusu. Domates seçiyor.'),
    choices: [
      {
        id: 'nod',
        label: L('Nod politely and move on', 'Kibarca başınla selam ver ve geç'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('A tiny nod. Your client looked so relieved that you knew it was the right size of nod.', 'Minicik bir baş selamı. Danışanın o kadar rahatladı ki selamın tam doğru boyda olduğunu anladın.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'hide',
        label: L('Hide behind the melons', 'Kavunların arkasına saklan'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('You hid behind the melons. The melon seller asked if you were all right. At the next session your client said, "I saw you hiding." You both laughed for five minutes.', 'Kavunların arkasına saklandın. Kavuncu iyi olup olmadığını sordu. Bir sonraki seansta danışanın "Saklandığını gördüm" dedi. İkiniz beş dakika güldünüz.');
        },
      },
      {
        id: 'chat',
        label: L('Stop and say hello', 'Durup merhaba de'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t('The mother asked how you know each other. There was a silence you could have cut with a knife and sold by the kilo.', 'Anne birbirinizi nereden tanıdığınızı sordu. Bıçakla kesilip kiloyla satılacak bir sessizlik oldu.');
        },
      },
    ],
  },
  {
    id: 'base.job_midwife_night',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('midwife'),
    title: L('Three babies decide to arrive on the same night.', 'Üç bebek aynı gece doğmaya karar verdi.'),
    text: L('One room, then the next, then the next. The night has only just started.', 'Bir oda, sonra öbürü, sonra öbürü. Gece daha yeni başladı.'),
    choices: [
      {
        id: 'all',
        label: L('Run between all three', 'Üçü arasında koştur'),
        resolve: (c) => {
          c.h.stat('health', -3);
          c.h.stat('happiness', 8);
          return c.t('By sunrise there were three new people in the world and you had helped every one of them in. You cried in the car park. The good kind.', 'Güneş doğduğunda dünyada üç yeni insan vardı ve hepsini sen karşılamıştın. Otoparkta ağladın. Güzel bir ağlamaydı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'call',
        label: L('Call in a colleague', 'Bir meslektaşını çağır'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Your colleague came in her pyjamas under a coat. Two of you, three babies, zero problems.', 'Meslektaşın paltosunun altında pijamasıyla geldi. İki kişi, üç bebek, sıfır sorun.');
        },
      },
    ],
  },
  {
    id: 'base.job_surgeon_long',
    category: 'work',
    minAge: 24,
    weight: 14,
    when: onAny('surgeon'),
    title: L('Hour eleven of an operation, and something unexpected appears.', 'Ameliyatın on birinci saati ve beklenmedik bir şey çıktı.'),
    text: L('The team looks at you. The clock looks at you. The music has stopped.', 'Ekip sana bakıyor. Saat sana bakıyor. Müzik durdu.'),
    choices: [
      {
        id: 'careful',
        label: L('Slow down and do it properly', 'Yavaşla ve usulüne göre yap'),
        resolve: (c) => {
          c.h.stat('health', -3);
          if (c.rng.chance(0.75 + c.p.stats.smarts / 1000)) {
            c.h.stat('happiness', 8);
            return c.t('Fourteen hours in total. The patient woke up and asked for soup. You will never forget that soup.', 'Toplam on dört saat sürdü. Hasta uyandı ve çorba istedi. O çorbayı hiç unutmayacaksın.') + promo(c);
          }
          c.h.stat('happiness', -8);
          return c.t('You did everything right and it was still not enough. You sat with the family afterwards. That is part of the job too.', 'Her şeyi doğru yaptın ve yine de yetmedi. Sonra aileyle oturdun. Bu da işin bir parçası.');
        },
      },
      {
        id: 'senior',
        label: L('Call your old professor', 'Eski hocanı ara'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 4);
          return c.t('He answered from a wedding, talked you through it with a band playing behind him, and went back to dance.', 'Bir düğünden açtı, arkada orkestra çalarken sana adım adım anlattı ve dansa döndü.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_lab_mixup',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('lab_tech'),
    title: L('Two samples with the same surname. Their labels look swapped.', 'Aynı soyadlı iki numune. Etiketleri yer değiştirmiş gibi.'),
    text: L('The results go out in an hour. Rerunning both takes a day.', 'Sonuçlar bir saat sonra çıkıyor. İkisini baştan çalışmak bir gün sürer.'),
    choices: [
      {
        id: 'rerun',
        label: L('Rerun both', 'İkisini de baştan çalış'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('They were swapped. One of them would have been told they were ill. You saved someone a terrible week.', 'Gerçekten karışmışlar. Biri hasta olduğunu sanacaktı. Birini korkunç bir haftadan kurtardın.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'send',
        label: L('Send them, they are probably fine', 'Gönder, büyük ihtimalle doğrudur'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', -8);
            if (c.rng.chance(0.4)) {
              fire(c);
              return c.t('They were swapped. The inquiry was short and the letter was shorter.', 'Karışmışlar. Soruşturma kısa sürdü, işten çıkarma yazısı daha da kısa.');
            }
            return c.t('They were swapped. A doctor caught it a day later. You got a written warning and a long look.', 'Karışmışlar. Bir doktor bir gün sonra fark etti. Yazılı uyarı ve uzun bir bakış aldın.');
          }
          return c.t('They were fine. Your heart rate was not, all afternoon.', 'Sorun yokmuş. Ama kalp atışın bütün öğleden sonra yerine gelmedi.');
        },
      },
    ],
  },
  {
    id: 'base.job_physio_athlete',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('physio'),
    title: L('A local football star wants to play on Sunday. His knee says no.', 'Yerel bir futbol yıldızı pazar günü oynamak istiyor. Dizi hayır diyor.'),
    text: L('The club wants him on the pitch. He wants him on the pitch. You have his scan.', 'Kulüp onu sahada istiyor. O da kendini sahada istiyor. MR sende.'),
    choices: [
      {
        id: 'no',
        label: L('Say he sits out', 'Oynamayacak de'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('He sulked, sat out, and came back stronger three weeks later. The club now sends you every injured player.', 'Surat astı, maçı dışarıdan izledi ve üç hafta sonra daha güçlü döndü. Kulüp artık bütün sakat oyuncularını sana gönderiyor.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'tape',
        label: L('Tape it up and hope', 'Bantla ve dua et'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const amt = cash(c, 800);
            return c.t(`He scored the winner. The club sent ${amt} and a signed shirt.`, `Galibiyet golünü attı. Kulüp ${amt} ve imzalı bir forma gönderdi.`);
          }
          c.h.stat('happiness', -6);
          return c.t('The knee went in the twentieth minute. Six months out. The local paper mentioned your name.', 'Diz yirminci dakikada gitti. Altı ay sahalardan uzak. Yerel gazete senin adını da yazdı.');
        },
      },
    ],
  },

  // ================================================================ money and offices
  {
    id: 'base.job_bank_error',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('bank_teller'),
    title: L('Your till is over by a large amount at closing time.', 'Kapanışta kasada büyük bir fazlalık var.'),
    text: L('Someone, somewhere today, was given too little. The cameras will show who.', 'Bugün biri, bir yerde eksik para almış. Kameralar kim olduğunu gösterecek.'),
    choices: [
      {
        id: 'trace',
        label: L('Stay late and find them', 'Geç saate kal ve sahibini bul'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('A nervous young man who had come to pay his rent. You called him. He came back in slippers to hug you.', 'Kirasını yatırmaya gelen tedirgin bir gençmiş. Onu aradın. Sana sarılmak için terlikleriyle geri geldi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'report',
        label: L('Report it and go home', 'Raporla ve eve git'),
        resolve: (c) => c.t('The branch manager found the customer the next morning. Your report was neat. Nobody remembers neat reports.', 'Şube müdürü müşteriyi ertesi sabah buldu. Raporun düzgündü. Düzgün raporları kimse hatırlamaz.'),
      },
      {
        id: 'keep',
        label: L('Keep the difference', 'Farkı cebe at'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            fire(c);
            c.p.criminalRecord += 1;
            return c.t('Banks count everything twice. You were walked out by security on Monday, with a record.', 'Bankalar her şeyi iki kez sayar. Pazartesi güvenlik eşliğinde dışarı çıkarıldın; sicilin de kirlendi.');
          }
          const amt = cash(c, 600);
          return c.t(`Nobody noticed. ${amt}. You do not enjoy spending it.`, `Kimse fark etmedi. Tam ${amt}. Harcarken hiç keyif almıyorsun.`);
        },
      },
    ],
  },
  {
    id: 'base.job_banker_deal',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('banker'),
    title: L('A big deal is on the table, and something in the numbers smells.', 'Masada büyük bir anlaşma var ve rakamlarda bir şey kokuyor.'),
    text: L('If it closes, everyone gets a bonus. If it is what you think it is, it will not close well.', 'Anlaşma imzalanırsa herkes prim alacak. Eğer düşündüğün şeyse, sonu iyi bitmeyecek.'),
    choices: [
      {
        id: 'dig',
        label: L('Dig into the numbers', 'Rakamları didik didik et'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('health', -2);
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return c.t('You found it: a hidden debt the size of a small country. The deal died; your boss bought you dinner and stopped calling you "the new one".', 'Buldun: küçük bir ülke büyüklüğünde gizli bir borç. Anlaşma çöktü; müdürün sana yemek ısmarladı ve sana "yeni gelen" demeyi bıraktı.') + promo(c);
          }
          return c.t('You found nothing, lost three weekends, and the deal closed fine. You still do not trust it.', 'Hiçbir şey bulamadın, üç hafta sonu kaybettin ve anlaşma sorunsuz kapandı. Hâlâ güvenmiyorsun.');
        },
      },
      {
        id: 'sign',
        label: L('Sign and take the bonus', 'İmzala ve primi al'),
        badge: 'Big money',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            fire(c);
            return c.t('The deal blew up eight months later. Your signature was on page four. So was your career.', 'Anlaşma sekiz ay sonra patladı. İmzan dördüncü sayfadaydı. Kariyerin de.');
          }
          const amt = cash(c, 15000);
          return c.t(`It closed. The bonus was ${amt}. You bought a watch you do not look at.`, `Anlaşma kapandı. Prim ${amt} oldu. Hiç bakmadığın bir saat aldın.`);
        },
      },
      {
        id: 'quiet',
        label: L('Mention it quietly to compliance', 'Uyum birimine sessizce söyle'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Compliance thanked you and took months. The deal died quietly. Nobody knows it was you, which is the point.', 'Uyum birimi teşekkür etti ve aylarca uğraştı. Anlaşma sessizce öldü. Senin olduğunu kimse bilmiyor; amaç da buydu.');
        },
      },
    ],
  },
  {
    id: 'base.job_callcenter_angry',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('call_center', 'sales'),
    title: L('A caller has been shouting at you for eleven minutes.', 'Bir arayan on bir dakikadır sana bağırıyor.'),
    text: L('It is about a bill. It is also, clearly, about everything else in his life.', 'Konu bir fatura. Ama belli ki hayatındaki her şey.'),
    choices: [
      {
        id: 'calm',
        label: L('Stay calm and fix the bill', 'Sakin kal ve faturayı düzelt'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('By minute fifteen he was apologising. By minute twenty he was telling you about his daughter\'s wedding. The bill is fixed.', 'On beşinci dakikada özür diliyordu. Yirminci dakikada kızının düğününü anlatıyordu. Fatura düzeldi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'hold',
        label: L('Put him on hold with the music', 'Bekleme müziğine al'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Four minutes of the hold music calmed him down. It has never done that for anyone before. You keep it as a secret weapon.', 'Dört dakikalık bekleme müziği onu sakinleştirdi. Daha önce kimseye yaramamıştı. Artık gizli silahın.');
        },
      },
      {
        id: 'hangup',
        label: L('Hang up', 'Kapat'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -5);
            return c.t('Calls are recorded for training purposes. Yours is now a training video.', 'Görüşmeler eğitim amaçlı kaydediliyor. Seninki artık bir eğitim videosu.');
          }
          c.h.stat('happiness', 2);
          return c.t('Silence. Beautiful silence. You drank a whole glass of water before the next call.', 'Sessizlik. Güzel bir sessizlik. Bir sonraki aramadan önce koca bir bardak su içtin.');
        },
      },
    ],
  },
  {
    id: 'base.job_sales_target',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('sales', 'marketing'),
    title: L('It is the last day of the quarter and you are short of target.', 'Çeyreğin son günü ve hedefin gerisindesin.'),
    text: L('One big client could close the gap, if you promise them something slightly ambitious.', 'Büyük bir müşteri farkı kapatabilir; tabii biraz iddialı bir söz verirsen.'),
    choices: [
      {
        id: 'promise',
        label: L('Promise delivery in a week', 'Bir haftada teslim sözü ver'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            const amt = cash(c, 1500);
            return c.t(`The warehouse pulled a miracle. Target hit, bonus ${amt}.`, `Depo mucize yarattı. Hedef tuttu, prim ${amt}.`) + promo(c);
          }
          c.h.stat('happiness', -5);
          return c.t('The delivery was three weeks late. The client remembers. Your boss remembers louder.', 'Teslimat üç hafta gecikti. Müşteri unutmadı. Müdürün daha da yüksek sesle unutmadı.');
        },
      },
      {
        id: 'honest',
        label: L('Be honest and miss the target', 'Dürüst ol, hedefi kaçır'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You missed by a little. The client, impressed by the honesty, signed a bigger deal next quarter.', 'Hedefi az farkla kaçırdın. Dürüstlüğünden etkilenen müşteri, bir sonraki çeyrekte daha büyük bir anlaşma imzaladı.');
        },
        tone: 'good',
      },
      {
        id: 'mum',
        label: L('Call every relative you have', 'Bütün akrabaları ara'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('Your aunt bought something she does not need. So did two cousins. You hit the target by one unit and a lot of guilt.', 'Teyzen ihtiyacı olmayan bir şey aldı. İki kuzenin de. Hedefi bir adet ve bolca vicdan azabıyla tutturdun.');
        },
      },
    ],
  },
  {
    id: 'base.job_secretary_boss',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('secretary'),
    title: L('Your boss asks you to tell his wife he is "in a meeting".', 'Patronun karısına "toplantıda" olduğunu söylemeni istiyor.'),
    text: L('He is on the golf course. She knows he is on the golf course. Everybody knows.', 'Golf sahasında. Karısı golf sahasında olduğunu biliyor. Herkes biliyor.'),
    choices: [
      {
        id: 'lie',
        label: L('Say he is in a meeting', 'Toplantıda de'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('She laughed and asked how the meeting\'s handicap was. You will be buying her coffee at the Christmas party.', 'Karısı güldü ve toplantının handikabını sordu. Yılbaşı partisinde ona kahve ısmarlamak zorundasın.');
        },
      },
      {
        id: 'truth',
        label: L('Say he is "out of the office"', '"Ofis dışında" de'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Technically true. Both of them respected it. You are now the most trusted person in the building.', 'Teknik olarak doğru. İkisi de saygı duydu. Artık binanın en güvenilen insanısın.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'put',
        label: L('Put her straight through to his mobile', 'Doğrudan cep telefonuna bağla'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          if (c.rng.chance(0.3)) {
            demote(c);
            return c.t('He was not amused. You were moved to the front desk "for a while".', 'Patron hiç eğlenmedi. "Bir süreliğine" ön bankoya alındın.');
          }
          return c.t('He answered from the ninth hole. The whole office heard the conversation through the wall.', 'Dokuzuncu delikten açtı. Bütün ofis konuşmayı duvarın arkasından dinledi.');
        },
      },
    ],
  },
  {
    id: 'base.job_hr_layoff',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('hr'),
    title: L('You are handed a list of names to let go. A friend is on it.', 'Elinize işten çıkarılacakların listesi verildi. Bir arkadaşın da listede.'),
    text: L('The announcement is on Friday. It is Tuesday.', 'Açıklama cuma günü. Bugün salı.'),
    choices: [
      {
        id: 'warn',
        label: L('Warn your friend quietly', 'Arkadaşını sessizce uyar'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            fire(c);
            return c.t('Your friend told someone, who told someone. Your name was added to the list on Thursday.', 'Arkadaşın birine söyledi, o da başka birine. Perşembe günü senin adın da listeye eklendi.');
          }
          c.h.stat('happiness', 2);
          return c.t('Your friend had a new job lined up by Friday. You both pretend it was luck.', 'Arkadaşın cumaya kadar yeni bir iş ayarladı. İkiniz de şans olduğuna inanıyormuş gibi yapıyorsunuz.');
        },
      },
      {
        id: 'fight',
        label: L('Argue to save some of the jobs', 'Bazı kadroları kurtarmak için diren'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('You found savings elsewhere. Four names came off the list, your friend\'s among them.', 'Başka yerden tasarruf buldun. Listeden dört isim çıktı; arkadaşınınki de.') + promo(c);
          }
          c.h.stat('happiness', -4);
          return c.t('You were thanked for your input and ignored. The list stayed the same.', 'Görüşün için teşekkür edildi ve dikkate alınmadı. Liste aynı kaldı.');
        },
        tone: 'good',
      },
      {
        id: 'job',
        label: L('Do the job as kindly as you can', 'İşini olabildiğince nazik yap'),
        resolve: (c) => {
          c.h.stat('happiness', -3);
          return c.t('You did it with good references, a long notice and a box of tissues. Your friend still says hello. Barely.', 'Bunu iyi referanslarla, uzun bir ihbar süresiyle ve bir kutu mendille yaptın. Arkadaşın hâlâ selam veriyor. Zar zor.');
        },
      },
    ],
  },
  {
    id: 'base.job_marketing_slogan',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('marketing'),
    title: L('Your new slogan went viral, for the wrong reason.', 'Yeni sloganın yayıldı ama yanlış sebepten.'),
    text: L('Read quickly, it says something very rude. The whole internet reads quickly.', 'Hızlı okununca çok ayıp bir şey diyor. Bütün internet hızlı okuyor.'),
    choices: [
      {
        id: 'own',
        label: L('Own it with a joke', 'Espriyle sahiplen'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 8);
            return c.t('Your apology joke went more viral than the mistake. Sales tripled. You are a "genius" now, apparently.', 'Özür esprin hatadan daha çok yayıldı. Satışlar üçe katlandı. Görünüşe göre artık "dâhi"sin.') + promo(c);
          }
          c.h.stat('happiness', -6);
          return c.t('The joke made it worse. Much worse. The board met on a Sunday.', 'Espri durumu kötüleştirdi. Çok kötüleştirdi. Yönetim kurulu pazar günü toplandı.');
        },
      },
      {
        id: 'pull',
        label: L('Pull it and apologise', 'Geri çek ve özür dile'),
        resolve: (c) => {
          c.h.stat('happiness', -2);
          return c.t('You pulled it within the hour. It lives on in screenshots, forever, like all of us.', 'Bir saat içinde geri çektin. Ekran görüntülerinde sonsuza kadar yaşayacak; hepimiz gibi.');
        },
      },
    ],
  },

  // ================================================================ the state
  {
    id: 'base.job_civil_stamp',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('civil_servant'),
    title: L('A citizen needs one stamp. The form needs four.', 'Bir vatandaşın tek bir imzaya ihtiyacı var. Form dört imza istiyor.'),
    text: L('She has been to five offices. You are the sixth. She has brought her whole family for moral support.', 'Beş daireye gitmiş. Sen altıncısın. Moral olsun diye bütün aileyi de getirmiş.'),
    choices: [
      {
        id: 'walk',
        label: L('Walk the form round the building yourself', 'Formu binada kendin dolaştır'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 6);
          return c.t('Four floors, four signatures, one hour. Her grandmother kissed your forehead.', 'Dört kat, dört imza, bir saat. Babaannesi alnından öptü.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'rules',
        label: L('Explain the procedure', 'Prosedürü anlat'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You explained it perfectly. She came back the next week with all four stamps and a look of pure victory.', 'Kusursuz anlattın. Ertesi hafta dört imzayla ve saf bir zafer ifadesiyle geri geldi.');
        },
      },
      {
        id: 'gift',
        label: L('She offers you "a little something"', 'Sana "bir şeyler" uzatıyor'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            fire(c);
            c.p.criminalRecord += 1;
            return c.t('An inspector was in the queue. You lost the job and gained a record.', 'Kuyrukta bir müfettiş varmış. İşini kaybettin, siciline de kayıt düştü.');
          }
          const amt = cash(c, 150);
          c.h.stat('happiness', -4);
          return c.t(`${amt} in an envelope. It felt worse than it should have, and it should have felt bad.`, `Zarfta ${amt} vardı. Olması gerekenden kötü hissettirdi; zaten kötü hissettirmesi gerekiyordu.`);
        },
      },
    ],
  },
  {
    id: 'base.job_judge_case',
    category: 'work',
    minAge: 24,
    weight: 14,
    when: onAny('judge'),
    title: L('A young man stole bread for his family. The law is very clear.', 'Bir genç ailesi için ekmek çalmış. Kanun çok açık.'),
    text: L('The courtroom is full of his neighbours. His mother is in the front row.', 'Salon onun komşularıyla dolu. Annesi en önde.'),
    choices: [
      {
        id: 'mercy',
        label: L('The lightest sentence the law allows', 'Kanunun izin verdiği en hafif ceza'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('A suspended sentence and a referral to social services. His mother brought a tray of pastries to the court. You could not accept them. You wanted to.', 'Ertelenmiş bir ceza ve sosyal hizmetlere sevk. Annesi mahkemeye bir tepsi börek getirdi. Kabul edemedin. Etmek istedin.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'strict',
        label: L('Apply the law as written', 'Kanunu harfiyen uygula'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return c.t('The sentence was fair by the book. The book is not always fair. You read it again that night.', 'Ceza kitaba göre adildi. Kitap her zaman adil değildir. O gece kitabı bir kez daha okudun.');
        },
      },
    ],
  },
  {
    id: 'base.job_diplomat_dinner',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('diplomat'),
    title: L('At a state dinner, a foreign minister insults your country.', 'Bir resmî yemekte yabancı bir bakan ülkene hakaret etti.'),
    text: L('Quietly, in your hearing, with a smile. The soup has just arrived.', 'Sessizce, senin duyabileceğin şekilde, gülümseyerek. Çorba daha yeni geldi.'),
    choices: [
      {
        id: 'wit',
        label: L('Answer with a polite joke', 'Kibar bir espriyle karşılık ver'),
        requires: (c) => c.p.stats.smarts >= 60,
        requiresLabel: 'Needs Smarts 60+',
        resolve: (c) => {
          c.h.stat('happiness', 7);
          return c.t('The whole table laughed, including him. He sent a note the next day suggesting lunch. A small war avoided, a big friendship started.', 'Bütün masa güldü, o da dahil. Ertesi gün öğle yemeği öneren bir not gönderdi. Küçük bir savaş önlendi, büyük bir dostluk başladı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'ignore',
        label: L('Pretend not to hear and eat your soup', 'Duymazdan gel, çorbanı iç'),
        resolve: (c) => {
          c.h.stat('happiness', -1);
          return c.t('You ate the soup. It was very good soup. The ambassador praised your "composure" in a cable home.', 'Çorbanı içtin. Çok güzel bir çorbaydı. Büyükelçi merkeze gönderdiği yazıda "soğukkanlılığını" övdü.');
        },
      },
      {
        id: 'protest',
        label: L('File a formal protest in the morning', 'Sabah resmî protesto notası ver'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -5);
            return c.t('It became a small diplomatic incident. Then a medium one. You were sent to a quieter posting for a while.', 'Küçük bir diplomatik krize dönüştü. Sonra orta boy bir krize. Bir süreliğine daha sakin bir göreve gönderildin.');
          }
          return c.t('He apologised in writing. Your file now has the word "firm" in it.', 'Yazılı olarak özür diledi. Dosyana artık "kararlı" kelimesi eklendi.');
        },
      },
    ],
  },
  {
    id: 'base.job_library_book',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('librarian', 'curator'),
    title: L('An old man returns a book that is forty-one years overdue.', 'Yaşlı bir adam kırk bir yıl gecikmeyle bir kitap iade ediyor.'),
    text: L('He has brought the fine in a jam jar, in old coins, counted.', 'Gecikme cezasını bir reçel kavanozunda, eski bozuk paralarla, sayılmış olarak getirmiş.'),
    choices: [
      {
        id: 'waive',
        label: L('Waive the fine', 'Cezayı sil'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('He told you the book had got him through a hard winter long ago. You put it on display with his story beside it.', 'Kitabın ona çok zor bir kışı atlattırdığını anlattı. Kitabı hikâyesiyle birlikte vitrine koydun.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'take',
        label: L('Take the jar, as a matter of principle', 'İlke gereği kavanozu al'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('He was proud to pay. The jar sits on your desk now. Nobody is allowed to touch it.', 'Ödediği için gurur duydu. Kavanoz artık masanda duruyor. Kimsenin dokunmasına izin yok.');
        },
      },
    ],
  },
  {
    id: 'base.job_curator_fake',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('curator'),
    title: L("You suspect the museum's star painting is a fake.", 'Müzenin en gözde tablosunun sahte olduğundan şüpheleniyorsun.'),
    text: L('The brushwork is wrong. The director has just printed it on ten thousand tote bags.', 'Fırça darbeleri yanlış. Müdür daha yeni on bin bez çantaya bastırdı.'),
    choices: [
      {
        id: 'test',
        label: L('Order a lab test', 'Laboratuvar testi iste'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 7);
            return c.t('Fake. The real one turned up in a farmhouse attic a year later, thanks to you. The papers called you "the curator who looked".', 'Sahte çıktı. Gerçeği bir yıl sonra senin sayende bir çiftlik evinin tavan arasında bulundu. Gazeteler sana "bakmayı bilen küratör" dedi.') + promo(c);
          }
          c.h.stat('happiness', -3);
          return c.t('It was genuine; the painter was just having a bad day. The director has not forgotten.', 'Gerçekmiş; ressam o gün kötü bir gününde imiş. Müdür bunu unutmadı.');
        },
      },
      {
        id: 'quiet',
        label: L('Keep your doubts to yourself', 'Şüpheni kendine sakla'),
        resolve: (c) => c.t('The tote bags sold out. You walk past the painting every day and it winks at you.', 'Bez çantalar tükendi. Her gün tablonun önünden geçiyorsun ve sana göz kırpıyor.'),
      },
    ],
  },
  {
    id: 'base.job_social_case',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('social_worker'),
    title: L('A family on your list has stopped answering the door.', 'Listendeki bir aile kapıyı açmaz oldu.'),
    text: L('There are three children. The neighbours say the lights go on late and off early.', 'Üç çocuk var. Komşular ışıkların geç yanıp erken söndüğünü söylüyor.'),
    choices: [
      {
        id: 'visit',
        label: L('Keep visiting until they open', 'Açana kadar ziyarete devam et'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('On the fourth visit the mother opened the door and cried. The heating had been cut off. It was back on by Friday.', 'Dördüncü ziyarette anne kapıyı açıp ağladı. Kaloriferleri kesilmişti. Cumaya kadar yeniden açıldı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'school',
        label: L('Talk to the children\'s school first', 'Önce çocukların okuluyla konuş'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          c.h.stat('happiness', 3);
          return c.t('Their teacher had noticed too. Together you got the family help without anyone feeling ambushed.', 'Öğretmenleri de fark etmişti. Birlikte, kimse kendini köşeye sıkışmış hissetmeden aileye yardım ulaştırdınız.');
        },
      },
    ],
  },
  {
    id: 'base.job_politician_campaign',
    category: 'work',
    minAge: 25,
    weight: 12,
    when: onAny('politician'),
    title: L('Your party asks you to promise a bridge.', 'Partin bir köprü sözü vermeni istiyor.'),
    text: L('There is no river. There is no money. There is a lot of enthusiasm.', 'Nehir yok. Para yok. Ama bolca heves var.'),
    choices: [
      {
        id: 'bridge',
        label: L('Promise the bridge', 'Köprü sözü ver'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('The crowd loved the bridge. A journalist asked where the river was. You said "vision".', 'Kalabalık köprüye bayıldı. Bir gazeteci nehrin nerede olduğunu sordu. Sen de "vizyon" dedin.') + (c.rng.chance(0.4) ? promo(c) : '');
        },
      },
      {
        id: 'honest',
        label: L('Promise a better bus service instead', 'Onun yerine daha iyi otobüs seferi sözü ver'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('Less applause, more votes. The buses actually came, too. People remember buses.', 'Daha az alkış, daha çok oy. Otobüsler de gerçekten geldi. İnsanlar otobüsleri hatırlar.');
        },
        tone: 'good',
      },
      {
        id: 'door',
        label: L('Skip the rally and knock on doors', 'Mitingi bırak, kapı kapı dolaş'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', 3);
          return c.t('You knocked on 600 doors and drank 140 glasses of tea. You know every street now, and every street knows you.', 'Altı yüz kapı çaldın ve yüz kırk bardak çay içtin. Artık her sokağı tanıyorsun; her sokak da seni.');
        },
      },
    ],
  },

  // ================================================================ tech
  {
    id: 'base.job_it_restart',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('it_support'),
    title: L('The whole office is down on the morning of the big presentation.', 'Büyük sunumun sabahı bütün ofisin sistemi çöktü.'),
    text: L('Forty people are standing behind you. Some of them are holding coffee as if it were a weapon.', 'Kırk kişi arkanda dikiliyor. Bazıları kahvesini silah gibi tutuyor.'),
    choices: [
      {
        id: 'restart',
        label: L('Turn it off and on again', 'Kapatıp aç'),
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 6);
            return c.t('It worked. You will never tell them it was that simple. They think you are a wizard.', 'İşe yaradı. Bu kadar basit olduğunu onlara asla söylemeyeceksin. Seni büyücü sanıyorlar.') + promo(c);
          }
          c.h.stat('happiness', -3);
          return c.t('It did not work. Neither did the second time. The presentation was done with a flip chart.', 'İşe yaramadı. İkincisinde de yaramadı. Sunum kâğıt tahtayla yapıldı.');
        },
      },
      {
        id: 'cable',
        label: L('Check the cables under the desks', 'Masaların altındaki kabloları kontrol et'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('A cleaner had unplugged the main switch to charge a phone. You plugged it back in and a cheer went up. You let them believe it was hard.', 'Temizlik görevlisi telefon şarj etmek için ana anahtarın fişini çekmiş. Geri taktın ve bir tezahürat koptu. Zor bir işmiş gibi düşünmelerine izin verdin.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_gamedev_crunch',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('game_dev'),
    title: L('Launch is in three weeks and the game is held together with tape.', 'Çıkışa üç hafta var ve oyun bantla bir arada duruyor.'),
    text: L('Management wants "crunch": everyone working nights until launch.', 'Yönetim "crunch" istiyor: çıkışa kadar herkes gece de çalışacak.'),
    choices: [
      {
        id: 'crunch',
        label: L('Crunch with the team', 'Ekiple birlikte gece gündüz çalış'),
        resolve: (c) => {
          c.h.stat('health', -6);
          c.h.stat('happiness', -2);
          return c.t('The game launched on time. You saw the reviews from a pile of pizza boxes. They were good.', 'Oyun vaktinde çıktı. Eleştirileri bir pizza kutusu yığınının arasından okudun. İyiydi.') + promo(c);
        },
      },
      {
        id: 'cut',
        label: L('Argue to cut features instead', 'Bunun yerine özellik kesmeyi savun'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 6);
            return c.t('They listened. A smaller game launched on time and everyone slept. Players loved it.', 'Dinlediler. Daha küçük bir oyun vaktinde çıktı ve herkes uyudu. Oyuncular bayıldı.');
          }
          c.h.stat('happiness', -3);
          return c.t('They did not listen. You crunched anyway, but with a told-you-so ready.', 'Dinlemediler. Yine de gece gündüz çalıştın, ama "ben demiştim" cümlen hazırdı.');
        },
        tone: 'good',
      },
      {
        id: 'easter',
        label: L('Hide a tiny cat in the game', 'Oyuna minicik bir kedi sakla'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Players found the cat on day two. There is a fan club now. The cat has more followers than the studio.', 'Oyuncular kediyi ikinci gün buldu. Artık bir hayran kulübü var. Kedinin stüdyodan daha çok takipçisi var.');
        },
      },
    ],
  },
  {
    id: 'base.job_data_model',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('data_scientist'),
    title: L('Your model says the company should sell ice cream in winter.', 'Modelin şirketin kışın dondurma satması gerektiğini söylüyor.'),
    text: L('The numbers are clean. The board meeting is tomorrow. You are not sure you believe it.', 'Rakamlar tertemiz. Yönetim toplantısı yarın. Sen bile inandığından emin değilsin.'),
    choices: [
      {
        id: 'present',
        label: L('Present it with confidence', 'Kendinden emin sun'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 7);
            return c.t('Winter ice cream was a hit. Nobody knows why. You do not either, but you have a chart.', 'Kış dondurması tuttu. Kimse nedenini bilmiyor. Sen de bilmiyorsun ama elinde bir grafik var.') + promo(c);
          }
          c.h.stat('happiness', -5);
          return c.t('Nobody bought ice cream in the snow. Your model now has a nickname in the canteen.', 'Karda kimse dondurma almadı. Modelinin artık yemekhanede bir lakabı var.');
        },
      },
      {
        id: 'check',
        label: L('Check the data again', 'Veriyi bir kez daha kontrol et'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          return c.t('A sensor had logged degrees in the wrong units. The real answer was soup. You presented soup.', 'Bir sensör sıcaklığı yanlış birimle kaydetmiş. Doğru cevap çorbaymış. Çorbayı sundun.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_atc_storm',
    category: 'work',
    minAge: 22,
    weight: 14,
    when: onAny('atc'),
    title: L('A storm closes the runway with nine planes circling.', 'Fırtına pisti kapattı; yukarıda dokuz uçak tur atıyor.'),
    text: L('Fuel is getting low on two of them. Everyone in the tower is very quiet.', 'İkisinin yakıtı azalıyor. Kuledeki herkes çok sessiz.'),
    choices: [
      {
        id: 'divert',
        label: L('Divert the low ones to another airport', 'Yakıtı azalanları başka havalimanına yönlendir'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Everyone landed safely somewhere. Nine planes, nine thank-yous on the radio.', 'Herkes bir yere güvenle indi. Dokuz uçak, telsizden dokuz teşekkür.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'gap',
        label: L('Wait for a gap in the storm', 'Fırtınada bir boşluk bekle'),
        badge: 'Risky',
        resolve: (c) => {
          c.h.stat('health', -2);
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 8);
            return c.t('A twelve-minute gap. You landed all nine in eleven. The tower applauded. Controllers do not applaud.', 'On iki dakikalık bir boşluk açıldı. Dokuzunu on bir dakikada indirdin. Kule alkışladı. Kontrolörler alkışlamaz.');
          }
          c.h.stat('happiness', -6);
          return c.t('The gap never came. You diverted them all at the last minute. Nobody was hurt; your nerves were.', 'Boşluk hiç açılmadı. Son dakikada hepsini başka yere yönlendirdin. Kimse zarar görmedi; sinirlerin hariç.');
        },
      },
    ],
  },
];
