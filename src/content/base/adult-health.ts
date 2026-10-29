import type { ActivityDef, Ctx, EventDef } from '../types';
import { cap, dat, wage } from './util';
import { byCountry, inTr } from './events-flavour';
import { inPrison, say, type Pair } from './lines';
import { T, ch, num, nmv, noMourn, afford, working, partnered, setPartner } from './adult-kit';
import { aliveKin } from './kin';

// Round 4, ages 25+: health. Illness and surgery, cosmetic procedures, and addiction handled with care:
// a drinking or painkiller problem is a flag with a real yearly cost, family can step in, help works,
// recovery is a long road with a relapse risk and a milestone worth celebrating. Never a joke.

/** Struggling with alcohol / with painkillers; recovering (year set). */
export const DRINK = 'ad_drink';
export const PILLS = 'ad_pills';
export const SOBER = 'ad_sober';
const COSMETIC = 'ad_cosmetic';

export const struggling = (c: Ctx) => c.h.has(DRINK) || c.h.has(PILLS);
const sinceFlag = (c: Ctx, f: string) => c.s.year - (c.p.flags[f] ?? c.s.year);

/** Starts or restarts recovery: clears the struggle, sets the sober flag to this year. */
function recover(c: Ctx) {
  c.h.unflag(DRINK);
  c.h.unflag(PILLS);
  c.h.flag(SOBER);
}

/** The yearly cost of an addiction (no rng). */
export function healthOnYear(c: Ctx) {
  if (!struggling(c) || inPrison(c)) return;
  c.h.stat('health', -2);
  c.h.stat('happiness', -1);
  c.h.money(-wage(c, 300));
  c.h.relatives(['spouse', 'partner', 'child']).forEach((r) => c.h.closeness(r.person.id, -1));
}

const CHECKUP_FINE: Pair[] = [
  ['The doctor said "very good" twice and "for your age" once. You are choosing to remember the first two.', 'Doktor iki kez "çok iyi", bir kez de "yaşına göre" dedi. Sen ilk ikisini hatırlamayı seçiyorsun.'],
  ['All the numbers came back normal. You celebrated with something that will make them less normal.', 'Bütün değerler normal çıktı. Onları biraz bozacak bir şeyle kutladın.'],
];

export const healthEvents: EventDef[] = [
  {
    id: 'base.ad_blood_pressure',
    category: 'health',
    minAge: 40,
    once: true,
    weight: 6,
    title: T('Your blood pressure is high. The nurse took it three times, frowning.', 'Tansiyonun yüksek. Hemşire kaşlarını çatarak üç kez ölçtü.'),
    text: T('"Salt, stress or genes," says the doctor. "Probably all three."', 'Doktor "Tuz, stres ya da genetik" diyor. "Muhtemelen üçü birden."'),
    choices: [
      ch('meds', 'Take the tablets, every day', 'İlacı her gün iç', (c) => {
        c.h.stat('health', 5);
        c.h.money(-wage(c, 100));
        return c.t('One small tablet every morning. Your numbers went down. You bought a pill box with the days of the week on it and felt very old and very sensible.', 'Her sabah küçük bir tablet. Değerlerin düştü. Üstünde haftanın günleri yazan bir ilaç kutusu aldın; kendini hem çok yaşlı hem çok akıllı hissettin.');
      }, { tone: 'good' }),
      ch('life', 'Change how you live', 'Yaşam tarzını değiştir', (c) => {
        c.h.stat('health', 4);
        c.h.stat('happiness', -2);
        return c.t('Less salt, more walking, an hour less work. It worked. Food tastes of nothing for a month, then you get used to it.', 'Daha az tuz, daha çok yürüyüş, bir saat daha az iş. İşe yaradı. Bir ay yemeklerin tadı yok, sonra alışıyorsun.');
      }, { tone: 'good' }),
      ch('ignore', 'Ignore it', 'Boş ver', (c) => {
        c.h.stat('health', -5);
        return c.t('You ignored it. Your body did not. The headaches started in spring.', 'Boş verdin. Vücudun boş vermedi. Baş ağrıları baharda başladı.');
      }),
    ],
  },
  {
    id: 'base.ad_knee',
    category: 'health',
    minAge: 45,
    once: true,
    weight: 5,
    setup: (c) => {
      c.vars.amt = wage(c, 5000);
    },
    title: T('Your knee has started to sound like a bag of crisps.', 'Dizin cips paketi gibi ses çıkarmaya başladı.'),
    text: T('Stairs have become a negotiation. The specialist mentions surgery.', 'Merdivenler artık bir pazarlık. Uzman ameliyattan bahsediyor.'),
    choices: [
      ch('surgery', 'Have the operation', 'Ameliyat ol', (c) => {
        c.h.money(-num(c));
        if (c.rng.chance(0.85)) {
          c.h.stat('health', 8);
          return c.t('A new knee and three months of physio. You took the stairs two at a time, once, to prove a point.', 'Yeni bir diz ve üç ay fizik tedavi. Kendini kanıtlamak için bir kez merdivenleri ikişer ikişer çıktın.');
        }
        c.h.stat('health', -2);
        c.h.stat('happiness', -3);
        return c.t('The operation went fine; the recovery did not. A year of physio before you could walk without thinking about it.', 'Ameliyat iyi geçti; iyileşme geçmedi. Düşünmeden yürüyebilmen bir yıl fizik tedavi aldı.');
      }, { badge: 'Risky', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('physio', 'Try physio first', 'Önce fizik tedavi dene', (c) => {
        c.h.money(-wage(c, 600));
        c.h.stat('health', 3);
        return c.t('Twice a week with a cheerful sadist called a physiotherapist. The knee is quieter now. So are you.', 'Haftada iki kez fizyoterapist denen neşeli bir işkenceciyle. Diz artık daha sessiz. Sen de.');
      }),
      ch('cane', 'Buy a nice walking stick', 'Güzel bir baston al', (c) => {
        c.h.stat('looks', 1);
        c.h.stat('health', -1);
        return c.t('The stick has a silver handle. You now walk like a retired general and point at things with it.', 'Bastonun gümüş saplı. Artık emekli bir general gibi yürüyor ve her şeyi onunla işaret ediyorsun.');
      }),
    ],
  },
  {
    id: 'base.ad_appendix',
    category: 'health',
    minAge: 25,
    maxAge: 70,
    once: true,
    weight: 4,
    title: T('A pain in your side has become unbearable. It is your appendix.', 'Böğründeki ağrı dayanılmaz hâle geldi. Apandisitmiş.'),
    text: T('The surgeon says tonight. You are in a gown that does not close at the back.', 'Cerrah bu gece diyor. Arkası kapanmayan bir önlükle yatıyorsun.'),
    choices: [
      ch('ward', 'A bed on the ward', 'Koğuşta bir yatak', (c) => {
        c.h.stat('health', -2);
        return c.t('The operation went well. Your ward neighbour told you his whole life story twice. You know his cousins by name.', 'Ameliyat iyi geçti. Koğuştaki yan yatağın sana bütün hayat hikâyesini iki kez anlattı. Kuzenlerini adlarıyla biliyorsun.');
      }),
      ch('private', 'Pay for a private room', 'Özel oda için para öde', (c) => {
        c.h.money(-wage(c, 1500));
        c.h.stat('health', -1);
        c.h.stat('happiness', 1);
        return c.t('A quiet room, a view of a car park and jelly at four. You recovered in peace and a little boredom.', 'Sessiz bir oda, otopark manzarası ve saat dörtte jöle. Huzur içinde, biraz da sıkılarak iyileştin.');
      }),
      ch('visitors', 'Tell everyone, accept visitors', 'Herkese haber ver, ziyaretçi kabul et', (c) => {
        c.h.stat('health', -2);
        c.h.relatives(['mother', 'father', 'sibling', 'friend', 'child']).forEach((r) => c.h.closeness(r.person.id, 2));
        return c.t(
          inTr(c) ? 'The whole family came, with flowers, cologne and a pot of stuffed vine leaves the nurses were not supposed to see.' : 'The whole family came, with flowers, cards and a cake the nurses were not supposed to see.',
          inTr(c) ? 'Bütün aile geldi; çiçeklerle, kolonyayla ve hemşirelerin görmemesi gereken bir tencere sarmayla.' : 'Bütün aile geldi; çiçeklerle, kartlarla ve hemşirelerin görmemesi gereken bir pastayla.',
        );
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_root_canal',
    category: 'health',
    minAge: 30,
    once: true,
    weight: 5,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, 900);
    },
    title: T('The dentist has said the words "root canal".', 'Dişçi "kanal tedavisi" kelimelerini söyledi.'),
    text: (c) => c.t(`It will cost ${c.h.fmt(num(c))}. Pulling the tooth would be cheaper and faster.`, `${c.h.fmt(num(c))} tutacak. Dişi çektirmek daha ucuz ve hızlı olur.`),
    choices: [
      ch('save', 'Save the tooth', 'Dişi kurtar', (c) => {
        c.h.money(-num(c));
        c.h.stat('health', 2);
        return c.t('Two long appointments with a dentist who hummed the whole time. The tooth lives.', 'Hep mırıldanan bir dişçiyle iki uzun seans. Diş yaşıyor.');
      }, { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('pull', 'Pull it', 'Çektir', (c) => {
        c.h.money(-Math.round(num(c) / 6));
        c.h.stat('looks', -2);
        return c.t('Out it came. You now smile with slightly less confidence and chew on the left like a suspicious camel.', 'Çıktı. Artık biraz daha çekingen gülümsüyor ve sol tarafla, şüpheci bir deve gibi çiğniyorsun.');
      }),
      ch('wait', 'Wait and hope', 'Bekle ve umut et', (c) => {
        c.h.stat('health', -3);
        c.h.stat('happiness', -2);
        return c.t('You waited. The tooth did not get better. It got louder. You went back in the end, with a swollen face.', 'Bekledin. Diş iyileşmedi. Daha da bağırmaya başladı. Sonunda şiş bir yüzle geri gittin.');
      }),
    ],
  },
  {
    id: 'base.ad_cosmetic',
    category: 'health',
    minAge: 35,
    maxAge: 68,
    once: true,
    weight: 5,
    when: noMourn,
    setup: (c) => {
      c.vars.f = c.h.relatives('friend')[0]?.person.id ?? '';
      c.vars.amt = wage(c, 4000);
    },
    title: T('A friend comes back from a cosmetic clinic looking ten years younger.', 'Bir arkadaşın estetik kliniğinden on yaş genç görünerek döndü.'),
    text: T('"Just a little touch-up," they say. The clinic has a discount for referrals.', '"Ufak bir rötuş" diyor. Kliniğin arkadaş getirene indirimi varmış.'),
    choices: [
      ch('small', 'A small, careful touch-up', 'Ufak, dikkatli bir rötuş', (c) => {
        c.h.money(-Math.round(num(c) / 4));
        c.h.flag(COSMETIC);
        c.h.stat('looks', 4);
        return c.t('A careful doctor, a small change. People say you look "rested". You let them think it was a holiday.', 'Dikkatli bir doktor, küçük bir değişiklik. İnsanlar "dinlenmiş görünüyorsun" diyor. Tatil sanmalarına izin veriyorsun.');
      }),
      ch('big', 'Go for the full surgery', 'Tam ameliyata git', (c) => {
        c.h.money(-num(c));
        c.h.flag(COSMETIC);
        if (c.rng.chance(0.7)) {
          c.h.stat('looks', 10);
          c.h.stat('happiness', 3);
          return aliveKin(c, 'mother')
            ? c.t('Two weeks of swelling, then a face you like very much. Your mother asked if you had lost weight.', 'İki hafta şişlik, sonra çok beğendiğin bir yüz. Annen kilo mu verdin diye sordu.')
            : c.t('Two weeks of swelling, then a face you like very much. Your neighbour asked if you had lost weight.', 'İki hafta şişlik, sonra çok beğendiğin bir yüz. Komşun kilo mu verdin diye sordu.');
        }
        c.h.stat('looks', -3);
        c.h.stat('health', -3);
        c.h.stat('happiness', -5);
        return c.t('Something went wrong. It took a second operation and a year to look like yourself again. You learned to read reviews properly.', 'Bir şeyler ters gitti. Yeniden kendine benzemen ikinci bir ameliyat ve bir yıl aldı. Yorumları dikkatle okumayı öğrendin.');
      }, { badge: 'Risky', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('no', 'Decide your face is fine', 'Yüzünün iyi olduğuna karar ver', (c) => {
        c.h.stat('happiness', 3);
        return c.t('You looked in the mirror for a long time and decided every line was earned. You smiled. More lines. Fine.', 'Aynaya uzun uzun baktın ve her çizgiyi hak ettiğine karar verdin. Gülümsedin. Daha çok çizgi. Olsun.');
      }, { tone: 'good' }),
    ],
  },
  {
    id: 'base.ad_hair_loss',
    category: 'health',
    minAge: 30,
    maxAge: 58,
    once: true,
    weight: 5,
    when: noMourn,
    setup: (c) => {
      c.vars.amt = wage(c, inTr(c) ? 1500 : 6000);
    },
    title: T('Your hairline is retreating faster than you would like.', 'Saç çizgin istediğinden hızlı geri çekiliyor.'),
    text: (c) =>
      inTr(c)
        ? c.t('Half the people on your street have had a hair transplant. The clinic down the road has a waiting list.', 'Sokağındakilerin yarısı saç ektirmiş. Yolun aşağısındaki kliniğin sıra listesi var.')
        : c.t('Adverts for hair transplants abroad have started following you around the internet.', 'Yurt dışında saç ekimi reklamları internette peşini bırakmıyor.'),
    choices: [
      ch('transplant', 'Get a transplant', 'Saç ektir', (c) => {
        c.h.money(-num(c));
        c.h.stat('looks', 6);
        return c.t('A week in a headband looking like a startled tennis player, then hair. Real hair. You touch it at traffic lights.', 'Bir hafta bandanayla ürkmüş bir tenisçi gibi dolaştın, sonra saç. Gerçek saç. Kırmızı ışıkta dokunuyorsun.');
      }, { requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('shave', 'Shave it all off', 'Hepsini kazıt', (c) => {
        c.h.stat('looks', 2);
        c.h.stat('happiness', 3);
        return c.t('You shaved it all off. You look like someone who owns a boat. Great decision.', 'Hepsini kazıttın. Teknesi olan biri gibi görünüyorsun. Harika karar.');
      }, { tone: 'good' }),
      ch('hats', 'Invest in hats', 'Şapkaya yatırım yap', (c) => {
        c.h.money(-wage(c, 120));
        return c.t('You now own nine hats. Your favourite has become part of your personality.', 'Artık dokuz şapkan var. En sevdiğin, kişiliğinin bir parçası oldu.');
      }),
    ],
  },
  {
    id: 'base.ad_cosmetic_more',
    category: 'health',
    minAge: 38,
    maxAge: 72,
    once: true,
    weight: 8,
    when: (c) => c.h.has(COSMETIC) && c.s.year - (c.p.flags[COSMETIC] ?? c.s.year) >= 3,
    title: T('The clinic has sent you a birthday card and a "loyalty offer".', 'Klinik sana bir doğum günü kartı ve "sadık müşteri teklifi" yolladı.'),
    text: T('You catch yourself in shop windows, checking. You wonder if you are looking for something that is not there.', 'Vitrinlerde kendine bakarken yakalıyorsun. Orada olmayan bir şey mi arıyorsun, merak ediyorsun.'),
    choices: [
      ch('enough', 'Decide you are done', 'Bu kadarı yeter de', (c) => {
        c.h.stat('happiness', 4);
        c.h.unflag(COSMETIC);
        return c.t('You threw the card away and booked a massage instead. It did more for your face than anything.', 'Kartı attın ve onun yerine bir masaj randevusu aldın. Yüzüne her şeyden çok iyi geldi.');
      }, { tone: 'good' }),
      ch('again', 'Book another procedure', 'Bir işlem daha ayarla', (c) => {
        c.h.money(-wage(c, 1500));
        c.h.stat('looks', 2);
        c.h.stat('happiness', -1);
        return c.t('Another touch-up. It looks fine. You notice you feel the same as before, which is to say not quite fine.', 'Bir rötuş daha. İyi görünüyor. Kendini öncekiyle aynı hissettiğini, yani tam iyi hissetmediğini fark ediyorsun.');
      }),
      ch('talk', 'Talk to someone about it', 'Biriyle konuş', (c) => {
        c.h.money(-wage(c, 300));
        c.h.stat('happiness', 3);
        c.h.unflag(COSMETIC);
        return c.t('A few sessions with a counsellor. It was not really about your face. It rarely is.', 'Bir danışmanla birkaç seans. Mesele aslında yüzün değildi. Nadiren öyledir.');
      }),
    ],
  },
  // ------------------------------------------------ drinking
  {
    id: 'base.ad_drink_notice',
    category: 'health',
    minAge: 28,
    maxAge: 70,
    once: true,
    weight: 5,
    when: (c) => !struggling(c) && !c.h.has(SOBER),
    title: T('You notice you have had a drink every single night for three months.', 'Üç aydır her akşam içtiğini fark ediyorsun.'),
    text: T('"Just one, to unwind." It has not been just one for a while.', '"Bir tane, rahatlamak için." Bir süredir bir tane değil.'),
    choices: [
      ch('cut', 'Stop drinking at home', 'Evde içmeyi bırak', (c) => {
        if (c.rng.chance(0.7)) {
          c.h.stat('health', 4);
          c.h.stat('happiness', 2);
          return c.t('You poured it all away and took up evening walks. The first week was hard. The fourth was easy. You sleep better than you have in years.', 'Hepsini döktün ve akşam yürüyüşlerine başladın. İlk hafta zordu. Dördüncü kolaydı. Yıllardır olmadığı kadar iyi uyuyorsun.');
        }
        c.h.flag(DRINK);
        return c.t('You stopped for ten days. Then a bad day at work. Then another. It is harder than you thought.', 'On gün bıraktın. Sonra işte kötü bir gün. Sonra bir tane daha. Sandığından zor.');
      }, { badge: 'Risky' }),
      ch('help', 'Talk to your doctor', 'Doktoruna anlat', (c) => {
        c.h.money(-wage(c, 200));
        c.h.stat('health', 3);
        c.h.flag(SOBER);
        return c.t('Your doctor did not judge. She gave you a plan and a phone number. You used both.', 'Doktorun yargılamadı. Bir plan ve bir telefon numarası verdi. İkisini de kullandın.');
      }, { tone: 'good' }),
      ch('fine', 'Decide it is fine', 'Bir şey olmadığına karar ver', (c) => {
        c.h.flag(DRINK);
        c.h.stat('happiness', 1);
        return c.t('You decided it was fine. Everyone has a drink. Mornings have started to feel a little heavier.', 'Bir şey olmadığına karar verdin. Herkes içiyor. Sabahlar biraz daha ağır gelmeye başladı.');
      }),
    ],
  },
  {
    id: 'base.ad_painkillers',
    category: 'health',
    minAge: 35,
    maxAge: 75,
    once: true,
    weight: 4,
    when: (c) => !struggling(c),
    title: T('After a back injury, the painkillers are the only thing that helps.', 'Bel sakatlığından sonra ağrı kesiciler işe yarayan tek şey.'),
    text: T('The pain has mostly gone. You are still taking them. A little more than the label says.', 'Ağrı büyük ölçüde geçti. Hâlâ alıyorsun. Kutuda yazandan biraz fazla.'),
    choices: [
      ch('doctor', 'Tell your doctor the truth', 'Doktoruna doğruyu söyle', (c) => {
        c.h.stat('health', 3);
        c.h.flag(SOBER);
        return c.t('It was hard to say out loud. The doctor helped you taper off over two months. Your back is fine. So are you.', 'Yüksek sesle söylemek zordu. Doktor iki ay içinde yavaş yavaş bırakmana yardım etti. Belin iyi. Sen de.');
      }, { tone: 'good' }),
      ch('alone', 'Stop on your own', 'Kendi başına bırak', (c) => {
        if (c.rng.chance(0.5)) {
          c.h.stat('health', 1);
          return c.t('A miserable fortnight, but you did it. You threw the last box in the pharmacy return bin with ceremony.', 'Berbat iki hafta, ama başardın. Son kutuyu törenle eczanenin iade kutusuna attın.');
        }
        c.h.flag(PILLS);
        c.h.stat('health', -2);
        return c.t('You managed four days. Then you found a reason. It is not just your back any more.', 'Dört gün dayanabildin. Sonra bir bahane buldun. Artık mesele sadece belin değil.');
      }, { badge: 'Risky' }),
      ch('keep', 'Keep a few for bad days', 'Kötü günler için birkaç tane sakla', (c) => {
        c.h.flag(PILLS);
        return c.t('A few for bad days. The bad days have become more frequent.', 'Kötü günler için birkaç tane. Kötü günler sıklaşmaya başladı.');
      }),
    ],
  },
  {
    id: 'base.ad_intervention',
    category: 'family',
    minAge: 28,
    weight: 30,
    cooldown: 3,
    when: (c) => struggling(c) && sinceFlag(c, c.h.has(DRINK) ? DRINK : PILLS) >= 1 && c.h.relatives(['spouse', 'partner', 'child', 'sibling', 'mother', 'father']).length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives(['spouse', 'partner', 'child', 'sibling', 'mother', 'father'])).person.id;
    },
    title: (c) => c.t(`${nmv(c)} sits you down. "We need to talk about the ${c.h.has(DRINK) ? 'drinking' : 'pills'}."`, `${nmv(c)} seni karşısına oturtuyor. "${c.h.has(DRINK) ? 'İçki' : 'Haplar'} hakkında konuşmamız lazım."`),
    text: T('There is a list of moments you do not remember. It is not a short list.', 'Hatırlamadığın anların bir listesi var. Kısa bir liste değil.'),
    choices: [
      ch('help', 'Agree to get help', 'Yardım almayı kabul et', (c) => {
        c.h.money(-wage(c, 2000));
        recover(c);
        c.h.closeness(String(c.vars.pid), 10);
        c.h.stat('health', 4);
        return c.t(`You said yes. A program, a group that meets on Tuesdays, and ${nmv(c)} driving you there the first time. It is the start of something.`, `Evet dedin. Bir program, salıları toplanan bir grup ve ilk seferde seni oraya götüren ${nmv(c)}. Bir şeyin başlangıcı.`);
      }, { tone: 'good' }),
      ch('deny', 'Say they are overreacting', 'Abarttıklarını söyle', (c) => {
        c.h.closeness(String(c.vars.pid), -10);
        c.h.stat('happiness', -3);
        return c.t(`You said they were overreacting. ${nmv(c)} left the list on the table. You read it again at three in the morning.`, `Abarttıklarını söyledin. ${nmv(c)} listeyi masada bıraktı. Sabahın üçünde yeniden okudun.`);
      }),
      ch('try', 'Promise to cut down yourself', 'Kendi başına azaltacağına söz ver', (c) => {
        c.h.closeness(String(c.vars.pid), 2);
        if (c.rng.chance(0.35)) {
          recover(c);
          return c.t('You promised, and somehow you kept it. It was the hardest year of your life. You are glad of every day of it.', 'Söz verdin ve bir şekilde tuttun. Hayatının en zor yılıydı. Her gününe şükrediyorsun.');
        }
        return c.t('You promised, and meant it. By summer the promise had worn thin.', 'Söz verdin ve ciddiydin. Yaza kadar söz incelip gitti.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_relapse',
    category: 'health',
    minAge: 28,
    once: true,
    weight: 10,
    when: (c) => c.h.has(SOBER) && sinceFlag(c, SOBER) >= 1 && sinceFlag(c, SOBER) <= 6,
    title: T('A terrible week. An old craving comes back, louder than ever.', 'Berbat bir hafta. Eski bir istek, hiç olmadığı kadar yüksek sesle geri geliyor.'),
    text: T('It would be so easy. Just this once. You know exactly how that sentence ends.', 'Çok kolay olurdu. Sadece bu seferlik. O cümlenin nasıl bittiğini çok iyi biliyorsun.'),
    choices: [
      ch('call', 'Call someone from the group', 'Gruptan birini ara', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You called. They answered on the second ring and talked to you until the craving gave up, around midnight.', 'Aradın. İkinci çalışta açtı ve istek pes edene kadar, gece yarısına kadar seninle konuştu.');
      }, { tone: 'good' }),
      ch('walk', 'Go for a very long walk', 'Çok uzun bir yürüyüşe çık', (c) => {
        c.h.stat('health', 2);
        return c.t('You walked until your legs hurt more than the wanting. You got home, made tea, and went to bed sober.', 'Bacakların istekten daha çok ağrıyana kadar yürüdün. Eve döndün, çay demledin ve ayık yattın.');
      }),
      ch('slip', 'Give in, just this once', 'Bu seferlik teslim ol', (c) => {
        c.h.stat('health', -3);
        c.h.stat('happiness', -4);
        c.h.unflag(SOBER);
        c.h.flag(DRINK);
        return c.t('It was not just this once. A slip is not the end, but it is a long way back.', 'Sadece bu seferlik olmadı. Bir kayma son değildir ama dönüş yolu uzun.');
      }),
    ],
  },
  {
    id: 'base.ad_sober_year',
    category: 'health',
    minAge: 28,
    once: true,
    weight: 25,
    when: (c) => c.h.has(SOBER) && sinceFlag(c, SOBER) >= 2,
    title: T('It has been two years. Two whole years.', 'İki yıl oldu. Koca iki yıl.'),
    text: T('Someone at the group hands you a little coin. Your hands shake for a different reason this time.', 'Gruptan biri sana küçük bir madalyon veriyor. Ellerin bu sefer başka bir sebepten titriyor.'),
    choices: [
      ch('family', 'Celebrate with the family', 'Aileyle kutla', (c) => {
        c.h.stat('happiness', 6);
        c.h.relatives(['spouse', 'partner', 'child', 'sibling', 'mother', 'father']).forEach((r) => c.h.closeness(r.person.id, 4));
        return c.t('Cake, lemonade and a toast with orange juice. Someone gave a speech. You let them.', 'Pasta, limonata ve portakal suyuyla kaldırılan kadehler. Biri konuşma yaptı. İzin verdin.');
      }, { tone: 'good' }),
      ch('sponsor', 'Offer to help someone new', 'Yeni gelen birine yardım teklif et', (c) => {
        c.h.stat('happiness', 5);
        c.h.stat('smarts', 1);
        return c.t('You became someone else\'s phone call. On the night they called at midnight, you understood why it works.', 'Başkasının arayacağı kişi sen oldun. Gece yarısı aradığı o gece, bunun neden işe yaradığını anladın.');
      }, { tone: 'good' }),
      ch('quiet', 'Mark it quietly', 'Sessizce an', (c) => {
        c.h.stat('happiness', 4);
        return c.t('A quiet breakfast, alone, somewhere with a view. You ordered two coffees and drank both, slowly.', 'Manzaralı bir yerde, tek başına sessiz bir kahvaltı. İki kahve söyledin ve ikisini de ağır ağır içtin.');
      }),
    ],
  },
  {
    id: 'base.ad_panic',
    category: 'health',
    minAge: 26,
    maxAge: 65,
    once: true,
    weight: 5,
    title: T('In the middle of the supermarket, your heart starts racing and you cannot breathe.', 'Marketin ortasında kalbin hızla çarpmaya başladı ve nefes alamıyorsun.'),
    text: T('At the hospital, they say your heart is fine. It was a panic attack.', 'Hastanede kalbinin iyi olduğunu söylüyorlar. Panik atakmış.'),
    choices: [
      ch('therapy', 'See a therapist', 'Bir terapiste git', (c) => {
        c.h.money(-wage(c, 800));
        c.h.stat('happiness', 6);
        c.h.stat('health', 2);
        return c.t('Weekly sessions for a year. You learned where it came from, and what to do when it comes. It comes less now.', 'Bir yıl boyunca haftalık seanslar. Nereden geldiğini ve geldiğinde ne yapacağını öğrendin. Artık daha seyrek geliyor.');
      }, { tone: 'good' }),
      ch('breathe', 'Learn breathing exercises', 'Nefes egzersizleri öğren', (c) => {
        c.h.stat('happiness', 3);
        return c.t('Four in, hold, six out. You do it at traffic lights, in meetings and once at a wedding. It helps.', 'Dört içeri, tut, altı dışarı. Kırmızı ışıkta, toplantılarda ve bir keresinde düğünde yaptın. İşe yarıyor.');
      }),
      ch('push', 'Push on as if nothing happened', 'Hiçbir şey olmamış gibi devam et', (c) => {
        c.h.stat('happiness', -4);
        c.h.stat('health', -2);
        return c.t('You pushed on. It happened again, in a lift. Then on a bus. Your world got a little smaller.', 'Devam ettin. Yine oldu; asansörde. Sonra otobüste. Dünyan biraz küçüldü.');
      }),
    ],
  },
  {
    id: 'base.ad_cholesterol',
    category: 'health',
    minAge: 45,
    once: true,
    weight: 5,
    when: noMourn,
    title: (c) => c.t(`The doctor has banned your favourite food: ${favFood(c)[0]}.`, `Doktor en sevdiğin yemeği yasakladı: ${favFood(c)[1]}.`),
    text: T('Your cholesterol has gone up "like a lift with no brakes".', 'Kolesterolün "freni patlamış asansör gibi" yükselmiş.'),
    choices: [
      ch('obey', 'Give it up completely', 'Tamamen bırak', (c) => {
        c.h.stat('health', 5);
        c.h.stat('happiness', -3);
        return c.t('You gave it up. You dream about it. The numbers came down beautifully.', 'Bıraktın. Rüyalarına giriyor. Değerler güzelce düştü.');
      }),
      ch('sunday', 'Only on Sundays', 'Sadece pazarları', (c) => {
        c.h.stat('health', 2);
        c.h.stat('happiness', 1);
        return c.t('Only on Sundays. Sundays have become a religious experience.', 'Sadece pazarları. Pazar günleri artık neredeyse bir ibadet.');
      }),
      ch('ignore', 'Pretend you did not hear', 'Duymamış gibi yap', (c) => {
        c.h.stat('health', -4);
        c.h.stat('happiness', 2);
        return c.t('You pretended not to hear. It was delicious. The next blood test was not.', 'Duymamış gibi yaptın. Çok lezzetliydi. Bir sonraki tahlil değildi.');
      }),
    ],
  },
  {
    id: 'base.ad_scan_wait',
    category: 'health',
    minAge: 40,
    once: true,
    weight: 4,
    setup: (c) => {
      c.vars.amt = wage(c, 700);
    },
    title: T('The doctor wants a scan "to be safe". The waiting list is four months.', 'Doktor "içimiz rahat etsin" diye bir tarama istiyor. Sıra dört ay sonra.'),
    text: (c) => c.t(`A private clinic can do it this week for ${c.h.fmt(num(c))}.`, `Özel bir klinik bu hafta ${c.h.fmt(num(c))} karşılığında çekebilir.`),
    choices: [
      ch('private', 'Pay and go this week', 'Öde ve bu hafta git', (c) => {
        c.h.money(-num(c));
        c.h.stat('happiness', 3);
        return c.t('Clear. All clear. You walked out and bought yourself flowers for no reason at all.', 'Temiz. Tertemiz. Dışarı çıktın ve hiçbir sebep yokken kendine çiçek aldın.');
      }, { tone: 'good', requires: (c) => afford(c, num(c)), requiresLabel: 'Not enough money' }),
      ch('wait', 'Wait for the free one', 'Ücretsiz sırayı bekle', (c) => {
        c.h.stat('happiness', -3);
        return c.t('Four months of not thinking about it, constantly. The scan was clear. You are going to need a holiday.', 'Dört ay boyunca durmadan düşünmemeye çalıştın. Tarama temiz çıktı. Bir tatile ihtiyacın olacak.');
      }),
      ch('skip', 'Decide you feel fine', 'Kendini iyi hissettiğine karar ver', (c) => {
        if (c.rng.chance(0.8)) return c.t('You felt fine and were fine. You still think about it sometimes, at three in the morning.', 'Kendini iyi hissettin ve iyiydin. Yine de bazen, sabahın üçünde, aklına geliyor.');
        c.h.stat('health', -8);
        return c.t('A year later the problem found you instead. It was treatable, but it would have been easier a year ago.', 'Bir yıl sonra sorun seni buldu. Tedavi edilebilirdi ama bir yıl önce çok daha kolay olurdu.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    id: 'base.ad_allergy',
    category: 'health',
    minAge: 30,
    once: true,
    weight: 4,
    when: noMourn,
    setup: (c) => {
      c.vars.v = c.rng.int(0, 2);
    },
    title: (c) => {
      const a = ALLERGY[num(c, 'v')];
      return c.t(`At ${c.age}, you have suddenly become allergic to ${a[0]}.`, `${c.age} yaşında birden ${a[1]} alerjin başladı.`);
    },
    text: T('Your face agrees. It is the size of a melon.', 'Yüzün de katılıyor. Kavun kadar oldu.'),
    choices: [
      ch('doctor', 'See an allergist', 'Bir alerji uzmanına git', (c) => {
        c.h.money(-wage(c, 250));
        c.h.stat('health', 2);
        return c.t('Tests, tablets and an emergency pen you carry everywhere. Your face is back to normal size.', 'Testler, tabletler ve her yere taşıdığın bir acil durum kalemi. Yüzün normal boyutuna döndü.');
      }, { tone: 'good' }),
      ch('avoid', 'Just avoid it', 'Sadece uzak dur', (c) => {
        c.h.stat('happiness', -1);
        return c.t('You avoid it carefully. Everyone you know now asks about it before every meal.', 'Dikkatle uzak duruyorsun. Tanıdığın herkes artık her yemekten önce soruyor.');
      }),
      ch('deny', 'Assume it was a one-off', 'Bir kerelik olduğunu varsay', (c) => {
        c.h.stat('health', -3);
        return c.t('It was not a one-off. The second time was in a restaurant, in front of a date. Memorable.', 'Bir kerelik değildi. İkincisi bir restoranda, bir randevunun ortasında oldu. Unutulmaz.');
      }),
    ],
  },
  {
    id: 'base.ad_second_opinion',
    category: 'health',
    minAge: 50,
    once: true,
    weight: 4,
    setup: (c) => {
      c.vars.amt = wage(c, 400);
    },
    title: T('A surgeon recommends an operation you are not sure you need.', 'Bir cerrah, gerçekten gerekip gerekmediğinden emin olmadığın bir ameliyat öneriyor.'),
    text: T('He is very confident. He also has a new car.', 'Kendinden çok emin. Bir de yeni bir arabası var.'),
    choices: [
      ch('second', 'Get a second opinion', 'İkinci bir görüş al', (c) => {
        c.h.money(-num(c));
        c.h.stat('health', 2);
        return c.t('The second doctor suggested six months of exercises first. They worked. No operation.', 'İkinci doktor önce altı ay egzersiz önerdi. İşe yaradı. Ameliyat yok.');
      }, { tone: 'good' }),
      ch('trust', 'Trust the surgeon', 'Cerraha güven', (c) => {
        c.h.money(-wage(c, 3000));
        if (c.rng.chance(0.75)) {
          c.h.stat('health', 4);
          return c.t('The operation went well. You will never know if you needed it. You feel better, which is what matters.', 'Ameliyat iyi geçti. Gerçekten gerekip gerekmediğini hiç bilmeyeceksin. Kendini iyi hissediyorsun; önemli olan bu.');
        }
        c.h.stat('health', -3);
        return c.t('The recovery was long and the problem came back anyway. You got the second opinion afterwards.', 'İyileşme uzun sürdü ve sorun yine de geri geldi. İkinci görüşü sonradan aldın.');
      }, { badge: 'Risky' }),
      ch('nothing', 'Do nothing for now', 'Şimdilik bir şey yapma', (c) => {
        c.h.stat('health', -1);
        return c.t('You did nothing. Nothing much happened. You check in with your body now and then, like a nervous landlord.', 'Hiçbir şey yapmadın. Pek bir şey olmadı. Arada bir, tedirgin bir ev sahibi gibi vücudunu yokluyorsun.');
      }),
    ],
  },
  {
    id: 'base.ad_sleep_apnea',
    category: 'health',
    minAge: 45,
    once: true,
    weight: 4,
    when: partnered,
    setup: setPartner,
    title: (c) => c.t(`${nmv(c)} says you stop breathing in your sleep.`, `${nmv(c)} uykunda nefesinin durduğunu söylüyor.`),
    text: T('Not for long. Long enough for someone to lie awake counting.', 'Uzun sürmüyor. Birinin uyanık yatıp saymasına yetecek kadar.'),
    choices: [
      ch('test', 'Do a sleep test', 'Uyku testi yaptır', (c) => {
        c.h.money(-wage(c, 500));
        c.h.stat('health', 6);
        c.h.closeness(String(c.vars.pid), 4);
        return c.t('You now sleep with a mask and a humming machine, like a small astronaut. You wake up rested for the first time in a decade.', 'Artık bir maske ve vızıldayan bir makineyle, küçük bir astronot gibi uyuyorsun. On yıldır ilk kez dinlenmiş uyanıyorsun.');
      }, { tone: 'good' }),
      ch('pillows', 'Try more pillows', 'Daha çok yastık dene', (c) => {
        c.h.stat('health', 1);
        return c.t('Four pillows. You sleep sitting up like a Victorian invalid. It helps, a bit.', 'Dört yastık. Eski romanlardaki hastalar gibi oturarak uyuyorsun. Biraz işe yarıyor.');
      }),
      ch('deny', 'Say you breathe perfectly', 'Gayet iyi nefes aldığını söyle', (c) => {
        c.h.stat('health', -3);
        c.h.closeness(String(c.vars.pid), -3);
        return c.t(`${nmv(c)} recorded it. You listened to it once. You booked the test.`, `${nmv(c)} kaydetti. Bir kez dinledin. Testi ayarladın.`);
      }),
    ],
  },
  {
    id: 'base.ad_kidney',
    category: 'family',
    minAge: 28,
    maxAge: 65,
    once: true,
    weight: 3,
    when: (c) => c.h.relatives('sibling').length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(c.h.relatives('sibling')).person.id;
    },
    title: (c) => c.t(`${nmv(c)} needs a kidney. You are a match.`, `${dat(nmv(c))} böbrek lazım. Sen uyumlusun.`),
    text: T('The doctors say you can live a full life with one. They also say it is entirely your choice.', 'Doktorlar tek böbrekle dolu dolu yaşayabileceğini söylüyor. Kararın tamamen sana ait olduğunu da.'),
    choices: [
      ch('give', 'Give it', 'Ver', (c) => {
        c.h.stat('health', -6);
        c.h.stat('happiness', 8);
        c.h.closeness(String(c.vars.pid), 25);
        return c.t(`You woke up next to ${nmv(c)} in the recovery room. ${cap(nmv(c))} was already making jokes about which of you got the better deal.`, `Uyandığında ${nmv(c)} yanındaki yataktaydı ve hangimiz daha kârlı çıktı diye şaka yapıyordu bile.`);
      }, { tone: 'big', badge: 'Big change' }),
      ch('think', 'Ask for time', 'Düşünmek için zaman iste', (c) => {
        c.h.closeness(String(c.vars.pid), -2);
        if (c.rng.chance(0.6)) {
          c.h.stat('happiness', 2);
          return c.t(`While you were thinking, a donor came through. ${nmv(c)} is fine. You are relieved, and something else you cannot name.`, `Sen düşünürken bir donör çıktı. ${nmv(c)} iyi. Rahatladın; bir de adını koyamadığın başka bir şey hissettin.`);
        }
        c.h.stat('happiness', -4);
        return c.t(`You took too long. ${nmv(c)} waited two more years on the list. You talk, but not about that.`, `Fazla uzun düşündün. ${nmv(c)} listede iki yıl daha bekledi. Konuşuyorsunuz ama o konuyu değil.`);
      }),
      ch('no', 'Say no', 'Hayır de', (c) => {
        c.h.closeness(String(c.vars.pid), -10);
        return c.t(`You said no, and explained why. ${nmv(c)} said they understood. Maybe one day they will.`, `Hayır dedin ve nedenini anlattın. ${nmv(c)} anladığını söyledi. Belki bir gün gerçekten anlar.`);
      }),
    ],
  },
  {
    id: 'base.ad_blood_drive',
    category: 'health',
    minAge: 25,
    maxAge: 65,
    once: true,
    weight: 5,
    when: noMourn,
    title: (c) => byCountry(c, { tr: c.t('A blood donation bus is parked outside your work.', 'İşyerinin önüne bir kan bağışı otobüsü park etmiş.'), other: c.t('There is a blood drive in the community centre.', 'Semt merkezinde kan bağışı kampanyası var.') }),
    text: T('There are free biscuits. There is also a needle.', 'Bedava bisküvi var. Bir de iğne.'),
    choices: [
      ch('give', 'Give blood', 'Kan ver', (c) => {
        c.h.stat('happiness', 4);
        return c.t('You gave blood, ate three biscuits and felt like a hero for the whole afternoon. A text later told you it had been used.', 'Kan verdin, üç bisküvi yedin ve bütün öğleden sonra kendini kahraman gibi hissettin. Sonra gelen bir mesaj kanının kullanıldığını söyledi.');
      }, { tone: 'good' }),
      ch('faint', 'Give blood, and faint', 'Kan ver ve bayıl', (c) => {
        c.h.stat('happiness', 2);
        return c.t('You gave blood, stood up too fast and woke up surrounded by nurses and biscuits. Still counts.', 'Kan verdin, çok hızlı ayağa kalktın ve hemşirelerle bisküvilerin arasında uyandın. Yine de sayılır.');
      }),
      ch('skip', 'Walk past', 'Geç git', (c) => c.t('You walked past, then felt guilty about it for the rest of the day.', 'Önünden geçip gittin, sonra günün geri kalanında vicdan yaptın.')),
    ],
  },
  {
    id: 'base.ad_gym_injury',
    category: 'health',
    minAge: 30,
    maxAge: 60,
    once: true,
    weight: 4,
    when: noMourn,
    title: T('You pulled something at the gym trying to impress nobody.', 'Spor salonunda kimseyi etkilemeye çalışmazken bir yerini incittin.'),
    text: T('You can now turn your head to the left, but only with your whole body.', 'Artık başını sola çevirebiliyorsun, ama sadece bütün vücudunla.'),
    choices: [
      ch('rest', 'Rest properly', 'Doğru düzgün dinlen', (c) => {
        c.h.stat('health', 1);
        return c.t('Two weeks of rest and ice. You watched a whole series. Your neck works again.', 'İki hafta dinlenme ve buz. Koca bir diziyi bitirdin. Boynun yine çalışıyor.');
      }),
      ch('massage', 'Book a massage', 'Masaj randevusu al', (c) => {
        c.h.money(-wage(c, 90));
        c.h.stat('health', 3);
        c.h.stat('happiness', 2);
        return c.t('The masseur found the knot and showed it no mercy. You cried, paid and booked again.', 'Masör düğümü buldu ve hiç acımadı. Ağladın, ödedin ve yeniden randevu aldın.');
      }, { tone: 'good' }),
      ch('push', 'Train through it', 'Ağrıyla antrenmana devam et', (c) => {
        c.h.stat('health', -4);
        return c.t('You trained through it and turned a small injury into a big one. The physio sighed in a way you will never forget.', 'Ağrıyla devam ettin ve küçük bir sakatlığı büyük bir sakatlığa çevirdin. Fizyoterapist hiç unutmayacağın bir şekilde iç geçirdi.');
      }),
    ],
  },
  {
    id: 'base.ad_hospital_roommate',
    category: 'health',
    minAge: 40,
    once: true,
    weight: 4,
    when: (c) => c.p.stats.health < 60,
    setup: (c) => {
      c.vars.pid = c.h.newPerson({ age: c.age + c.rng.int(-5, 15) }).id;
    },
    title: (c) => c.t(`A few nights in hospital. Your roommate ${nmv(c)} talks in their sleep.`, `Hastanede birkaç gece. Oda arkadaşın ${nmv(c)} uykusunda konuşuyor.`),
    text: T('Mostly about a dog named Paşa and a debt from 1987.', 'Çoğunlukla Paşa adında bir köpekten ve eski bir borçtan bahsediyor.'),
    choices: [
      ch('friend', 'Become friends', 'Arkadaş ol', (c) => {
        c.h.addRelation(c.h.person(String(c.vars.pid)), 'friend', 55);
        c.h.stat('happiness', 3);
        return c.t(`By the third night you were playing cards at two in the morning. ${nmv(c)} is your friend now. You never mentioned the dog.`, `Üçüncü gece sabahın ikisinde kâğıt oynuyordunuz. ${nmv(c)} artık arkadaşın. Köpekten hiç bahsetmedin.`);
      }, { tone: 'good' }),
      ch('earplugs', 'Ask the nurse for earplugs', 'Hemşireden kulak tıkacı iste', (c) => {
        c.h.stat('health', 2);
        return c.t('The nurse had a whole drawer of them. "Everybody asks about that one," she said.', 'Hemşirenin bütün bir çekmece tıkacı vardı. "Onun için herkes istiyor" dedi.');
      }),
      ch('reply', 'Answer back in your sleep', 'Uykunda cevap ver', (c) => {
        c.h.stat('happiness', 2);
        return c.t('The night nurse found you both having a sleep-talking conversation about the debt. It was settled.', 'Gece hemşiresi ikinizi uykuda borç hakkında konuşurken buldu. Borç kapandı.');
      }),
    ],
  },
  {
    id: 'base.ad_heart_stent',
    category: 'health',
    minAge: 52,
    once: true,
    weight: 4,
    title: T('Chest pain on the stairs. At the hospital they find a blocked artery.', 'Merdivende göğüs ağrısı. Hastanede tıkalı bir damar buluyorlar.'),
    text: T('A stent, tonight. They are calm. You are not.', 'Bu gece stent takılacak. Onlar sakin. Sen değilsin.'),
    choices: [
      ch('change', 'Afterwards, change everything', 'Sonrasında her şeyi değiştir', (c) => {
        c.h.stat('health', 6);
        c.h.stat('happiness', 2);
        if (working(c)) c.h.money(-wage(c, 1000));
        return c.t('Walking every morning, less work, no more takeaways at midnight. You feel better at sixty than you did at fifty.', 'Her sabah yürüyüş, daha az iş, gece yarısı paket yemek yok. Altmışında ellisinde olduğundan iyi hissediyorsun.');
      }, { tone: 'good' }),
      ch('rehab', 'Do the cardiac rehab program', 'Kalp rehabilitasyon programına katıl', (c) => {
        c.h.stat('health', 5);
        return c.t('Twelve weeks on a treadmill next to people who had the same night as you. You are all friends now.', 'Seninle aynı geceyi yaşamış insanların yanında on iki hafta koşu bandı. Artık hepiniz arkadaşsınız.');
      }),
      ch('back', 'Go straight back to normal', 'Hemen eski düzene dön', (c) => {
        c.h.stat('health', -2);
        return c.t('Back at work in a week, back to old habits in a month. The cardiologist has stopped smiling at you.', 'Bir haftada işe, bir ayda eski alışkanlıklara döndün. Kardiyolog artık sana gülümsemiyor.');
      }),
    ],
  },
  {
    id: 'base.ad_checkup_fine',
    category: 'health',
    minAge: 40,
    cooldown: 15,
    weight: 3,
    when: (c) => c.p.stats.health >= 70,
    title: T('Your yearly check-up came back.', 'Yıllık kontrol sonuçların geldi.'),
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 2);
      return say(c, 'ad_checkup_fine', CHECKUP_FINE);
    },
  },
];

const ALLERGY: [string, string][] = [
  ['cats', 'kediye'],
  ['shellfish', 'deniz ürünlerine'],
  ['peaches', 'şeftaliye'],
];

/** The forbidden favourite food, by country: [English, Turkish]. */
const favFood = (c: Ctx): [string, string] =>
  byCountry<[string, string]>(c, {
    tr: ['kokoreç', 'kokoreç'],
    de: ['currywurst', 'körili sosis'],
    uk: ['the full English breakfast', 'İngiliz kahvaltısı'],
    us: ['bacon cheeseburgers', 'pastırmalı çizburger'],
    br: ['feijoada', 'feijoada'],
    fr: ['the cheese board', 'peynir tabağı'],
    es: ['jamón', 'jamón'],
    it: ['carbonara', 'karbonara'],
    nl: ['bitterballen', 'bitterballen'],
    ca: ['poutine', 'poutine'],
    mx: ['tacos al pastor', 'tacos al pastor'],
    jp: ['tonkatsu', 'tonkatsu'],
    other: ['fried cheese', 'kızarmış peynir'],
  });

export const healthActivities: ActivityDef[] = [
  {
    id: 'ad_therapy',
    label: (c) => c.t('See a therapist', 'Terapiste git'),
    description: (c) => c.t('+Happiness, costs money', '+Mutluluk, ücretli'),
    group: 'Mind & Body',
    minAge: 18,
    jailOk: false,
    run: (c) => {
      c.h.money(-wage(c, 120));
      c.h.stat('happiness', c.rng.int(3, 6));
      if (c.h.has(SOBER)) c.h.stat('health', 1);
      return say(c, 'ad_therapy', THERAPY);
    },
  },
  {
    id: 'ad_get_help',
    label: (c) => c.t('Get help for an addiction', 'Bağımlılık için yardım al'),
    description: (c) => c.t('A recovery program. Hard, and worth it.', 'Bir iyileşme programı. Zor ama değer.'),
    group: 'Mind & Body',
    minAge: 18,
    jailOk: false,
    hideWhenUnavailable: true,
    available: struggling,
    run: (c) => {
      c.h.money(-wage(c, 1500));
      if (c.rng.chance(0.75)) {
        recover(c);
        c.h.stat('health', 4);
        c.h.stat('happiness', 3);
        c.h.relatives(['spouse', 'partner', 'child']).forEach((r) => c.h.closeness(r.person.id, 5));
        return c.t('You walked in on a Monday and told a room of strangers the truth. It was the first day of the rest of it.', 'Bir pazartesi içeri girdin ve bir oda dolusu yabancıya gerçeği anlattın. Geri kalan her şeyin ilk günüydü.');
      }
      c.h.stat('happiness', -1);
      return c.t('You went for three weeks, then stopped going. You kept the leaflet. The door is still open.', 'Üç hafta gittin, sonra gitmeyi bıraktın. Broşürü sakladın. Kapı hâlâ açık.');
    },
  },
];

const THERAPY: Pair[] = [
  ['You talked for fifty minutes and cried for five of them. You left feeling lighter.', 'Elli dakika konuştun, beşinde ağladın. Daha hafif hissederek çıktın.'],
  ['The therapist asked one question that you are still thinking about a week later.', 'Terapist bir soru sordu; bir hafta sonra hâlâ onu düşünüyorsun.'],
  ['You talked about your parents for the whole hour. You had meant to talk about work.', 'Bütün seans boyunca annenle babandan bahsettin. Aslında iş hakkında konuşacaktın.'],
  ['You learned a word for something you have felt for twenty years. Having the word helps.', 'Yirmi yıldır hissettiğin bir şeyin adını öğrendin. Adını bilmek iyi geliyor.'],
  ['You sat in silence for a while, and the therapist let you. That was the best part.', 'Bir süre sessizce oturdun ve terapist buna izin verdi. En güzel kısmı oydu.'],
  ['You practised saying no. You said no to the receptionist on the way out. Progress.', 'Hayır demeyi çalıştın. Çıkarken resepsiyondakine hayır dedin. İlerleme.'],
];

