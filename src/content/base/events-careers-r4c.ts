import type { Ctx, EventDef } from '../types';
import { PART_TIME_JOBS } from './util';
import { inTr } from './events-flavour';
import { L, cash, fire, onAny, promo } from './career-helpers';

// Round 4 careers, part C: outdoors and animals, freelancers and performers, Türkiye's esnaf, part-time work.

/** A pupil or student working an after-school job. */
const partTimer = (c: Ctx) => !!c.p.jobId && PART_TIME_JOBS.has(c.p.jobId) && !c.p.retired && c.p.jailYears === 0 && (c.age < 23 || c.p.school !== null);

export const careerEventsR4c: EventDef[] = [
  // ================================================================ outdoors and animals
  {
    id: 'base.job_sailor_storm',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('sailor'),
    title: L('Three weeks at sea, and the cook has quit.', 'Denizde üçüncü hafta ve aşçı işi bıraktı.'),
    text: L('Twenty-two hungry sailors look at the galley, then at you.', 'Yirmi iki aç gemici önce mutfağa, sonra sana bakıyor.'),
    choices: [
      {
        id: 'cook',
        label: L('Cook for everyone', 'Herkese sen pişir'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Your lentil soup became legend. The captain wrote "cook" next to your name, then crossed it out and wrote "irreplaceable".', 'Mercimek çorban efsane oldu. Kaptan adının yanına "aşçı" yazdı, sonra üstünü çizip "yeri doldurulamaz" yazdı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'rota',
        label: L('Set up a cooking rota', 'Yemek nöbeti çizelgesi yap'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('A different cook every night. Tuesday was a disaster. Thursday was surprisingly excellent. Nobody starved.', 'Her gece başka bir aşçı. Salı felaketti. Perşembe şaşırtıcı derecede harikaydı. Kimse aç kalmadı.');
        },
      },
      {
        id: 'tins',
        label: L('Live on tins until port', 'Limana kadar konserveyle idare et'),
        resolve: (c) => {
          c.h.stat('health', -2);
          c.h.stat('happiness', -2);
          return c.t('Eleven days of tinned beans. At the port, the crew ate an entire restaurant.', 'On bir gün konserve fasulye. Limanda tayfa koca bir lokantayı silip süpürdü.');
        },
      },
    ],
  },
  {
    id: 'base.job_zoo_escape',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('zookeeper'),
    title: L('A penguin has escaped and is heading for the café.', 'Bir penguen kaçtı ve kafeye doğru gidiyor.'),
    text: L('It is walking very fast, with purpose. Visitors are filming.', 'Çok hızlı ve kararlı yürüyor. Ziyaretçiler video çekiyor.'),
    choices: [
      {
        id: 'fish',
        label: L('Lure it back with a fish', 'Balıkla geri çağır'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('It followed the fish all the way home, like a small offended waiter. The video was watched by millions.', 'Balığın peşinden evine kadar yürüdü; küçük, alıngan bir garson gibi. Video milyonlarca kez izlendi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'chase',
        label: L('Chase it', 'Kovala'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 2);
          return c.t('You slipped in the duck pond. The penguin watched you, then went home on its own. It had made its point.', 'Ördek havuzunda kaydın. Penguen seni izledi, sonra kendi kendine evine döndü. Söyleyeceğini söylemişti.');
        },
      },
      {
        id: 'coffee',
        label: L('Let it have its coffee', 'Bırak kahvesini içsin'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -4);
            return c.t('It ate a child\'s chips. The parents complained. The child did not; it was the best day of the child\'s life.', 'Bir çocuğun patates kızartmasını yedi. Anne babası şikâyet etti. Çocuk etmedi; hayatının en güzel günüydü.');
          }
          c.h.stat('happiness', 4);
          return c.t('It stood by the counter, looked at the menu and walked back. Penguins are just like us.', 'Tezgâhın yanında durdu, menüye baktı ve geri yürüdü. Penguenler de bizim gibi.');
        },
      },
    ],
  },
  {
    id: 'base.job_ranger_smoke',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('ranger'),
    title: L('You see smoke rising from a valley on a dry, windy day.', 'Kuru ve rüzgârlı bir günde bir vadiden duman yükseldiğini gördün.'),
    text: L('It could be a picnic. It could be the start of something terrible.', 'Bir piknik olabilir. Korkunç bir şeyin başlangıcı da olabilir.'),
    choices: [
      {
        id: 'alarm',
        label: L('Raise the alarm now', 'Hemen alarm ver'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('It was a barbecue that had jumped into the grass. The planes put it out in an hour. You saved half a forest.', 'Çimlere sıçramış bir mangal ateşiymiş. Uçaklar bir saatte söndürdü. Ormanın yarısını sen kurtardın.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'look',
        label: L('Drive down and look first', 'Önce gidip bak'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            c.h.stat('happiness', 3);
            return c.t('A family barbecue, safely in a pit. You gave a short talk about wind. They gave you a kebab.', 'Güvenli bir ocakta yapılan aile mangalıymış. Rüzgâr hakkında kısa bir konuşma yaptın. Sana bir şiş kebap verdiler.');
          }
          c.h.stat('health', -6);
          return c.t('It was a real fire. You got out with singed eyebrows and called it in from the road.', 'Gerçek bir yangınmış. Kaşların hafifçe yanmış hâlde kurtuldun ve yoldan haber verdin.');
        },
      },
    ],
  },
  {
    id: 'base.job_prison_contraband',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('prison_officer'),
    title: L('An inmate offers you money to look the other way.', 'Bir mahkûm başka tarafa bakman için sana para teklif ediyor.'),
    text: L('Just one parcel, he says, nothing dangerous. Everyone does it, he says.', 'Sadece bir paket, diyor, tehlikeli bir şey değil. Herkes yapıyor, diyor.'),
    choices: [
      {
        id: 'report',
        label: L('Report him', 'Tutanak tut'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('The search found a phone and two others in on it. The governor shook your hand in front of the whole wing.', 'Aramada bir telefon ve işin içinde olan iki kişi daha çıktı. Müdür bütün koğuşun önünde elini sıktı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'refuse',
        label: L('Refuse and leave it there', 'Reddet, uzatma'),
        resolve: (c) => c.t('He shrugged and tried someone else. You keep your eyes open on that corridor now.', 'Omuz silkti ve başkasını denedi. Artık o koridorda gözün hep açık.'),
      },
      {
        id: 'take',
        label: L('Take the money', 'Parayı al'),
        badge: 'Illegal',
        resolve: (c) => {
          if (c.rng.chance(0.6)) {
            fire(c);
            c.p.criminalRecord += 1;
            return c.t('The parcel was found. So were you. You know the building well; now you know it from the other side for a night.', 'Paket bulundu. Sen de. Binayı iyi tanıyorsun; artık bir geceliğine öbür tarafından da tanıyorsun.');
          }
          const amt = cash(c, 800);
          c.h.stat('happiness', -5);
          return c.t(`${amt}, and a knot in your stomach that never quite goes away.`, `Tam ${amt}; bir de midende hiç tam geçmeyen bir düğüm.`);
        },
      },
    ],
  },
  {
    id: 'base.job_shepherd_wolf',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('shepherd'),
    title: L('The dogs are barking at the edge of the forest. Something is there.', 'Köpekler ormanın kenarında havlıyor. Orada bir şey var.'),
    text: L('The flock has bunched up. The night is cold and very dark.', 'Sürü bir araya toplandı. Gece soğuk ve zifiri karanlık.'),
    choices: [
      {
        id: 'fire',
        label: L('Light a fire and keep watch', 'Ateş yak ve nöbet tut'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 4);
          return c.t('You sat by the fire all night with the dogs. At dawn there were wolf tracks in the mud, and every sheep was there.', 'Bütün gece köpeklerle ateşin başında oturdun. Şafakta çamurda kurt izleri vardı ve bütün koyunlar yerindeydi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'trust',
        label: L('Trust the dogs and sleep', 'Köpeklere güven ve uyu'),
        resolve: (c) => {
          if (c.rng.chance(0.3)) {
            cash(c, -400);
            c.h.stat('happiness', -5);
            return c.t('Two sheep were missing in the morning. The dogs looked ashamed. So did you.', 'Sabah iki koyun eksikti. Köpekler mahcup görünüyordu. Sen de.');
          }
          return c.t('The dogs earned their bread. Not a sheep missing. You gave them the good bones.', 'Köpekler ekmeklerini hak etti. Tek bir koyun eksik değil. Onlara en güzel kemikleri verdin.');
        },
      },
    ],
  },
  {
    id: 'base.job_bee_swarm',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('beekeeper'),
    title: L("A swarm of your bees has settled on the mayor's car.", 'Arılarından bir oğul belediye başkanının arabasına kondu.'),
    text: L('He is due at a ribbon-cutting in twenty minutes. The bees are very calm. He is not.', 'Yirmi dakika sonra bir açılış töreninde olması gerekiyor. Arılar çok sakin. O değil.'),
    choices: [
      {
        id: 'box',
        label: L('Coax them into a box', 'Tatlılıkla bir kutuya al'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('You scooped the queen in with your bare hand and the rest followed. The mayor was late and impressed. You got a new hive out of it.', 'Ana arıyı çıplak elle kutuya aldın, gerisi peşinden geldi. Başkan geç kaldı ama çok etkilendi. Sana da yeni bir kovan çıktı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'honey',
        label: L('Offer him a jar of honey for his trouble', 'Zahmeti için bir kavanoz bal uzat'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('He took the honey to the ceremony and mentioned you in his speech. Your honey sold out by Saturday.', 'Balı törene götürdü ve konuşmasında senden bahsetti. Balların cumartesiye kadar tükendi.');
        },
      },
    ],
  },
  {
    id: 'base.job_gardener_roses',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('gardener'),
    title: L("You accidentally pruned the owner's prize roses to stumps.", 'Ev sahibinin ödüllü güllerini yanlışlıkla dibinden budadın.'),
    text: L('The flower show is in two months. She is back from holiday tomorrow.', 'Çiçek yarışmasına iki ay var. Ev sahibi yarın tatilden dönüyor.'),
    choices: [
      {
        id: 'confess',
        label: L('Confess and promise to save them', 'İtiraf et, kurtaracağına söz ver'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('She was furious for a day. Two months later the roses won second prize, the best they had ever done.', 'Bir gün çok kızdı. İki ay sonra güller ikincilik aldı; şimdiye kadarki en iyi dereceleriydi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'replace',
        label: L('Buy identical roses and replant', 'Aynı güllerden alıp yeniden dik'),
        resolve: (c) => {
          const amt = cash(c, -350);
          if (c.rng.chance(0.5)) return c.t(`It cost you ${amt}. She never noticed. You will take this to your grave.`, `Sana ${amt} patladı. Hiç fark etmedi. Bu sırrı mezara götüreceksin.`);
          c.h.stat('happiness', -4);
          return c.t(`It cost you ${amt}, and she noticed at once: "These are not my roses." She kept you on, out of pity.`, `Sana ${amt} patladı ve hemen fark etti: "Bunlar benim güllerim değil." Acıdığından seni işte tuttu.`);
        },
      },
    ],
  },

  // ================================================================ freelancers and performers
  {
    id: 'base.job_musician_wedding',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('musician'),
    title: L('At a wedding, the groom asks for the same song for the ninth time.', 'Bir düğünde damat aynı şarkıyı dokuzuncu kez istiyor.'),
    text: L('He is holding money in the air. The bride is looking at you with pleading eyes.', 'Elinde havada sallanan paralar var. Gelin sana yalvaran gözlerle bakıyor.'),
    choices: [
      {
        id: 'play',
        label: L('Play it a ninth time', 'Dokuzuncu kez çal'),
        resolve: (c) => {
          const amt = cash(c, 300);
          return c.t(`You played it with feeling. ${amt} in tips. The bride has not forgiven you.`, `Hissederek çaldın. ${amt} bahşiş topladın. Gelin seni hâlâ affetmedi.`);
        },
      },
      {
        id: 'bride',
        label: L('Play the bride\'s favourite instead', 'Onun yerine gelinin sevdiği şarkıyı çal'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('The bride danced with her grandmother and everyone cried. Her family has booked you for three more weddings.', 'Gelin babaannesiyle dans etti ve herkes ağladı. Ailesi seni üç düğün için daha ayarladı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'medley',
        label: L('Sneak it into a medley', 'Bir potpurinin içine sıkıştır'),
        requires: (c) => c.p.stats.smarts >= 40,
        requiresLabel: 'Needs Smarts 40+',
        resolve: (c) => {
          const amt = cash(c, 200);
          c.h.stat('happiness', 4);
          return c.t(`Everyone got their song, nobody noticed the trick. ${amt} and a standing ovation from the aunts.`, `Herkes kendi şarkısını aldı, kimse numarayı fark etmedi. ${amt} ve teyzelerden ayakta alkış.`);
        },
      },
    ],
  },
  {
    id: 'base.job_photo_wedding',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('photographer'),
    title: L('Your camera dies in the middle of the wedding vows.', 'Nikâhın tam ortasında fotoğraf makinen kapandı.'),
    text: L('The spare battery is in the car. The car is in another district.', 'Yedek pil arabada. Araba başka bir semtte.'),
    choices: [
      {
        id: 'phone',
        label: L('Shoot it on your phone', 'Telefonla çek'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('The phone photos were the couple\'s favourites. "So natural," they said. You did not tell them.', 'Telefonla çektiğin fotoğraflar çiftin en sevdikleri oldu. "Çok doğal," dediler. Söylemedin.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'borrow',
        label: L('Borrow a guest\'s camera', 'Bir misafirin makinesini ödünç al'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('An uncle with a very expensive camera and no idea how to use it was delighted to help. He is your assistant now, unpaid.', 'Çok pahalı bir makinesi olan ama nasıl kullanılacağını bilmeyen bir amca yardım etmeye bayıldı. Artık senin asistanın, gönüllü olarak.');
        },
      },
      {
        id: 'redo',
        label: L('Ask them to repeat the vows', 'Nikâhı tekrarlamalarını rica et'),
        resolve: (c) => {
          c.h.stat('happiness', -4);
          return c.t('They did, through gritted teeth. The second "yes" was noticeably less romantic. You gave them a discount.', 'Dişlerini sıkarak tekrarladılar. İkinci "evet" belirgin biçimde daha az romantikti. İndirim yaptın.');
        },
      },
    ],
  },
  {
    id: 'base.job_writer_publisher',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('writer'),
    title: L('A publisher likes your book, if you change the ending.', 'Bir yayınevi kitabını beğendi; sonunu değiştirirsen.'),
    text: L('They want a happy ending. Your ending is the whole point of the book.', 'Mutlu son istiyorlar. Oysa kitabın bütün anlamı senin yazdığın sonda.'),
    choices: [
      {
        id: 'change',
        label: L('Change the ending', 'Sonu değiştir'),
        resolve: (c) => {
          const amt = cash(c, 3000);
          return c.t(`The book sold well. ${amt} advance. Readers write to say the ending felt "a bit sudden".`, `Kitap iyi sattı. ${amt} avans aldın. Okurlar sonun "biraz aceleye gelmiş" olduğunu yazıyor.`) + promo(c);
        },
      },
      {
        id: 'keep',
        label: L('Keep your ending', 'Kendi sonunu koru'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.35)) {
            const amt = cash(c, 6000);
            c.h.stat('happiness', 10);
            return c.t(`A smaller publisher took it as it was. It won a prize. ${amt}, and letters from strangers who cried in the right place.`, `Daha küçük bir yayınevi olduğu gibi bastı. Ödül aldı. ${amt} kazandın; bir de doğru yerde ağlayan yabancılardan mektuplar.`);
          }
          c.h.stat('happiness', -2);
          return c.t('No other publisher bit. The manuscript is in a drawer, waiting for a braver decade.', 'Başka yayınevi ilgilenmedi. Müsvedde, daha cesur bir on yılı beklemek üzere çekmecede.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_translator_rush',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('translator'),
    title: L('A 300-page manual for a dishwasher, due in five days.', 'Beş günde teslim edilecek üç yüz sayfalık bir bulaşık makinesi kılavuzu.'),
    text: L('It pays well. It is also the most boring document ever written in any language.', 'İyi para veriyor. Ama hangi dilde yazılmış olursa olsun, yazılmış en sıkıcı metin.'),
    choices: [
      {
        id: 'take',
        label: L('Take it and drink a lot of tea', 'Al ve bol çay iç'),
        resolve: (c) => {
          c.h.stat('health', -2);
          const amt = cash(c, 1200);
          return c.t(`Done on time. ${amt}. You can now explain the rinse cycle in two languages, unprompted, at parties.`, `Vaktinde bitti. ${amt} kazandın. Artık durulama programını iki dilde, kimse sormadan, davetlerde anlatabiliyorsun.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'novel',
        label: L('Turn it down for a novel you love', 'Sevdiğin bir roman için geri çevir'),
        resolve: (c) => {
          const amt = cash(c, 400);
          c.h.stat('happiness', 6);
          return c.t(`The novel paid ${amt} and three months of joy. Your name is on the cover, in small letters. It counts.`, `Roman ${amt} ve üç ay mutluluk getirdi. Adın kapakta, küçük harflerle. Sayılır.`);
        },
      },
    ],
  },
  {
    id: 'base.job_hair_bride',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('hairdresser'),
    title: L('A bride arrives with a photo of a hairstyle that defies physics.', 'Bir gelin fizik kurallarına meydan okuyan bir saç modeli fotoğrafıyla geldi.'),
    text: L('The wedding is in three hours. She has very fine hair and very high hopes.', 'Düğün üç saat sonra. Saçları çok ince, umutları çok yüksek.'),
    choices: [
      {
        id: 'try',
        label: L('Attempt it with a lot of pins', 'Bolca tokayla dene'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.5 + c.p.stats.smarts / 400)) {
            c.h.stat('happiness', 7);
            return c.t('Ninety-four pins and a can of spray. It held through the dancing. Her whole family now comes to you.', 'Doksan dört toka ve bir kutu sprey. Dans boyunca dayandı. Bütün ailesi artık sana geliyor.') + promo(c);
          }
          c.h.stat('happiness', -5);
          return c.t('It collapsed during the first dance, slowly, majestically. Everyone pretended not to see.', 'İlk dansta yavaş yavaş, görkemle çöktü. Herkes görmemiş gibi yaptı.');
        },
      },
      {
        id: 'suggest',
        label: L('Suggest something that will last', 'Dayanacak bir şey öner'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('She was doubtful, then delighted. It looked lovely in every photo, even at two in the morning.', 'Önce kararsızdı, sonra bayıldı. Gece ikide bile bütün fotoğraflarda çok güzel görünüyordu.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_florist_wedding',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('florist'),
    title: L('The wedding flowers arrived in the wrong colour.', 'Düğün çiçekleri yanlış renkte geldi.'),
    text: L('The bride wanted white. The supplier sent orange. The ceremony is at noon.', 'Gelin beyaz istemişti. Tedarikçi turuncu gönderdi. Tören öğlen.'),
    choices: [
      {
        id: 'market',
        label: L('Race to the flower market', 'Çiçek haline koş'),
        resolve: (c) => {
          c.h.stat('health', -1);
          cash(c, -150);
          return c.t('You came back with white roses at 11:40 and arranged them in eighteen minutes. A personal best.', 'On ikiye yirmi kala beyaz güllerle döndün ve on sekiz dakikada düzenledin. Kişisel rekor.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'sell',
        label: L('Sell her on orange', 'Turuncuya ikna et'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 5);
            return c.t('"Orange means joy," you said, inventing it on the spot. She loved it. Orange weddings are now a trend in your neighbourhood.', '"Turuncu neşe demektir," dedin; o an uydurarak. Bayıldı. Mahallende turuncu düğünler artık moda.');
          }
          c.h.stat('happiness', -4);
          return c.t('She did not want joy. She wanted white. You gave her a refund and an apology bouquet.', 'O neşe istemiyordu. Beyaz istiyordu. Parasını iade ettin ve bir özür buketi verdin.');
        },
      },
    ],
  },
  {
    id: 'base.job_guide_lost',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('tour_guide'),
    title: L('You count your tour group. One is missing.', 'Tur grubunu saydın. Biri eksik.'),
    text: L('It is the man in the big hat who kept asking about the toilets. The bus leaves in fifteen minutes.', 'Durmadan tuvaletleri soran büyük şapkalı adam. Otobüs on beş dakika sonra kalkıyor.'),
    choices: [
      {
        id: 'search',
        label: L('Search the old town', 'Eski şehri ara'),
        resolve: (c) => {
          c.h.stat('health', -1);
          c.h.stat('happiness', 4);
          return c.t('You found him drinking tea with a carpet seller, who had sold him nothing and told him everything. The group gave you a standing ovation on the bus.', 'Onu bir halıcıyla çay içerken buldun; halıcı ona hiçbir şey satmamış ama her şeyi anlatmış. Grup otobüste seni ayakta alkışladı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'hat',
        label: L('Look for the hat from a rooftop', 'Bir çatıdan şapkayı ara'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('You spotted the hat from the café terrace in two minutes. Big hats: the tour guide\'s best friend.', 'Kafe terasından şapkayı iki dakikada gördün. Büyük şapkalar: rehberin en iyi dostu.');
        },
      },
    ],
  },
  {
    id: 'base.job_trainer_client',
    category: 'work',
    minAge: 18,
    weight: 14,
    when: onAny('trainer'),
    title: L('A client wants to look like a film star by his wedding in a month.', 'Bir müşterin bir ay sonraki düğününe kadar film yıldızı gibi görünmek istiyor.'),
    text: L('He has never been to a gym. He has brought a photo. The photo is retouched.', 'Hayatında spor salonuna gitmemiş. Bir fotoğraf getirmiş. Fotoğraf rötuşlu.'),
    choices: [
      {
        id: 'honest',
        label: L('Set honest goals', 'Dürüst hedefler koy'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('He lost a bit, stood straighter, and smiled more. At the wedding he looked like the best version of himself. He sent you cake.', 'Biraz kilo verdi, daha dik durdu ve daha çok gülümsedi. Düğünde kendinin en iyi hâli gibi görünüyordu. Sana pasta yolladı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'brutal',
        label: L('Train him brutally', 'Acımadan çalıştır'),
        resolve: (c) => {
          if (c.rng.chance(0.4)) {
            c.h.stat('happiness', -4);
            return c.t('He pulled a muscle in week two and danced at his wedding on one leg. His mother-in-law blames you.', 'İkinci haftada kası çekildi ve düğününde tek ayak üstünde dans etti. Kayınvalidesi seni suçluyor.');
          }
          const amt = cash(c, 300);
          return c.t(`He hated you for a month and loved the photos forever. ${amt} bonus.`, `Bir ay senden nefret etti, fotoğraflara ise ömür boyu bayılacak. ${amt} prim.`);
        },
      },
    ],
  },
  {
    id: 'base.job_preschool_parent',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: onAny('preschool'),
    title: L('Glitter day went wrong. Very wrong.', 'Simli boya günü ters gitti. Çok ters.'),
    text: L('Twenty children, one open jar, and now everything in the room sparkles, including the hamster.', 'Yirmi çocuk, açık bir kavanoz ve şimdi odadaki her şey parlıyor; hamster dahil.'),
    choices: [
      {
        id: 'party',
        label: L('Declare a sparkle party', 'Parıltı partisi ilan et'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('Best day of the year, according to twenty reviewers under six. The parents found glitter for months. Some still do.', 'Altı yaş altı yirmi eleştirmene göre yılın en güzel günüydü. Veliler aylarca sim buldu. Bazıları hâlâ buluyor.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'clean',
        label: L('Make cleaning a game', 'Temizliği oyuna çevir'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('"Who can find the most glitter?" Twenty tiny cleaners. The room was spotless by lunch. The hamster stays fabulous.', '"En çok simi kim bulacak?" Yirmi minik temizlikçi. Oda öğlene kadar pırıl pırıl oldu. Hamster ise parlamaya devam ediyor.');
        },
      },
    ],
  },
  {
    id: 'base.job_driving_lesson',
    category: 'work',
    minAge: 23,
    weight: 14,
    when: onAny('driving_instructor'),
    title: L('Your student confuses the brake and the accelerator. Again.', 'Öğrencin freni ve gazı yine karıştırdı.'),
    text: L('The exam is tomorrow. You are both sitting very still in a hedge.', 'Sınav yarın. İkiniz de bir çalılığın içinde kıpırdamadan oturuyorsunuz.'),
    choices: [
      {
        id: 'calm',
        label: L('Laugh, breathe and start again', 'Gül, nefes al, baştan başla'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('She passed the next day, first time. She waved at you from the test car like a champion.', 'Ertesi gün ilk denemede geçti. Sınav arabasından sana bir şampiyon gibi el salladı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'postpone',
        label: L('Suggest postponing the exam', 'Sınavı ertelemeyi öner'),
        resolve: (c) => c.t('She postponed, practised for a month and passed. The hedge has recovered. So have you.', 'Erteledi, bir ay çalıştı ve geçti. Çalılık iyileşti. Sen de.'),
      },
    ],
  },

  // ================================================================ Türkiye's esnaf
  {
    id: 'base.job_cay_rush',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: (c) => inTr(c) && onAny('cayci')(c),
    title: L('Every office in the building orders tea at once.', 'Binadaki bütün ofisler aynı anda çay istedi.'),
    text: L('Forty glasses, six floors, one tray and the lift is broken.', 'Kırk bardak, altı kat, tek bir tepsi ve asansör bozuk.'),
    choices: [
      {
        id: 'stairs',
        label: L('Take the stairs, two trays at a time', 'Merdivenden, iki tepsi birden çık'),
        resolve: (c) => {
          c.h.stat('health', 2);
          c.h.stat('happiness', 4);
          return c.t('Not a drop spilled. On the sixth floor someone started clapping and the whole floor joined in.', 'Bir damla bile dökülmedi. Altıncı katta biri alkışlamaya başladı, bütün kat katıldı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'order',
        label: L('Serve the bosses first', 'Önce müdürlere götür'),
        resolve: (c) => {
          const amt = cash(c, 60);
          return c.t(`The bosses tipped ${amt}. The interns got their tea cold and told everyone.`, `Müdürler ${amt} bahşiş verdi. Stajyerlerin çayı soğuk gitti ve herkese anlattılar.`);
        },
      },
      {
        id: 'boy',
        label: L('Recruit the porter\'s boy to help', 'Kapıcının oğlunu yardıma çağır'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('The boy carried half and charged you one simit. Fair. You have an apprentice now, of sorts.', 'Çocuk yarısını taşıdı, karşılığında bir simit istedi. Hakkaniyetli. Artık bir çırağın var sayılır.');
        },
      },
    ],
  },
  {
    id: 'base.job_simit_rain',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: (c) => inTr(c) && onAny('simitci')(c),
    title: L('A downpour, and your tray is full of fresh simit.', 'Sağanak bastırdı ve tablan taze simitle dolu.'),
    text: L('The ferry crowd is running for cover. So is everyone who would buy from you.', 'İskele kalabalığı saçak altına koşuyor. Senden simit alacak herkes de.'),
    choices: [
      {
        id: 'ferry',
        label: L('Follow the crowd under the shelter', 'Kalabalığın peşinden saçak altına git'),
        resolve: (c) => {
          const amt = cash(c, 40);
          c.h.stat('happiness', 4);
          return c.t(`Wet people love warm simit. You sold out under the awning and made ${amt}.`, `Islanan insan sıcak simidi sever. Tentenin altında hepsini sattın, ${amt} kazandın.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'give',
        label: L('Hand them out to the street cats and kids', 'Sokak kedilerine ve çocuklara dağıt'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('You made no money and the best memories of the year. A girl gave you a drawing of you with a halo made of simit.', 'Hiç para kazanmadın ama yılın en güzel anılarını biriktirdin. Bir kız sana, başında simitten bir hale olan bir resmini verdi.');
        },
      },
      {
        id: 'cover',
        label: L('Cover the tray and wait', 'Tablanın üstünü ört ve bekle'),
        resolve: (c) => c.t('The rain stopped in an hour. The simit were still warm, almost. You sold half.', 'Yağmur bir saatte dindi. Simitler hâlâ sıcaktı, sayılır. Yarısını sattın.'),
      },
    ],
  },
  {
    id: 'base.job_muhtar_requests',
    category: 'work',
    minAge: 25,
    weight: 14,
    when: (c) => inTr(c) && onAny('muhtar')(c),
    title: L('Monday morning at the muhtar office: a queue to the door.', 'Muhtarlıkta pazartesi sabahı: kuyruk kapıya kadar.'),
    text: L('A broken street lamp, a stray dog, a residence paper and two neighbours who want you to settle a feud about a fig tree.', 'Bozuk bir sokak lambası, sahipsiz bir köpek, bir ikametgâh belgesi ve bir incir ağacı yüzünden küs iki komşu.'),
    choices: [
      {
        id: 'fig',
        label: L('Start with the fig tree', 'İncir ağacından başla'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('You decided each neighbour gets the figs from their side. They shook hands. One of them brought you a box of figs. From whose side, nobody asked.', 'Her komşunun kendi tarafındaki incirleri alacağına karar verdin. Tokalaştılar. Biri sana bir kasa incir getirdi. Hangi taraftan olduğunu kimse sormadı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'lamp',
        label: L('Call the municipality about the lamp', 'Lamba için belediyeyi ara'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('Nine calls and one personal visit later, the lamp works. The street now calls you "the one who gets things done".', 'Dokuz telefon ve bir ziyaretin ardından lamba yandı. Sokak artık sana "iş bitiren muhtar" diyor.');
        },
      },
      {
        id: 'tea',
        label: L('Put the kettle on for everyone', 'Herkese çay demle'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Nothing got solved and everyone left happy. Sometimes the office is just a warm room with tea.', 'Hiçbir şey çözülmedi ve herkes mutlu ayrıldı. Bazen muhtarlık sadece içinde çay olan sıcak bir odadır.');
        },
      },
    ],
  },
  {
    id: 'base.job_imam_heating',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: (c) => inTr(c) && onAny('imam')(c),
    title: L('The heating in the mosque broke in the coldest week of winter.', 'Kışın en soğuk haftasında caminin kaloriferi bozuldu.'),
    text: L('The old men of the congregation come in coats and scarves. The repair fund is empty.', 'Cemaatin yaşlıları paltolarla, atkılarla geliyor. Tamir kasası boş.'),
    choices: [
      {
        id: 'collect',
        label: L('Ask the neighbourhood for help', 'Mahalleden yardım iste'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          return c.t('The butcher, the grocer and a family you had never met paid for the repair within a week. The mosque has never been so warm.', 'Kasap, bakkal ve hiç tanımadığın bir aile bir hafta içinde tamir parasını denkleştirdi. Cami hiç bu kadar sıcak olmamıştı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'self',
        label: L('Pay for it from your own pocket', 'Kendi cebinden öde'),
        resolve: (c) => {
          const amt = cash(c, -400);
          c.h.stat('happiness', 4);
          return c.t(`It cost you ${amt}. Nobody knows, except the repairman, who tells everyone.`, `Sana ${amt} patladı. Kimse bilmiyor; herkese anlatan tamirci hariç.`);
        },
      },
      {
        id: 'tea',
        label: L('Serve hot tea after prayers until spring', 'Bahara kadar namazdan sonra sıcak çay ikram et'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('The tea after prayers became a tradition. When the heating was fixed in spring, nobody wanted to stop the tea.', 'Namaz sonrası çay bir geleneğe dönüştü. Baharda kalorifer tamir edildiğinde kimse çayı bırakmak istemedi.');
        },
      },
    ],
  },
  {
    id: 'base.job_kapici_bread',
    category: 'work',
    minAge: 20,
    weight: 14,
    when: (c) => inTr(c) && onAny('kapici')(c),
    title: L('The lady on the fifth floor wants her bread "warm, not hot".', 'Beşinci kattaki teyze ekmeğini "ılık olsun, sıcak değil" diye istiyor.'),
    text: L('Every morning for six years. Today the bakery has only hot bread.', 'Altı yıldır her sabah. Bugün fırında sadece sıcak ekmek var.'),
    choices: [
      {
        id: 'cool',
        label: L('Walk slowly so it cools on the way', 'Yolda soğusun diye yavaş yürü'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('You timed it perfectly. She said "just right" for the first time in six years. You told your whole family.', 'Zamanlamayı tutturdun. Altı yıldır ilk kez "tam kıvamında" dedi. Bütün ailene anlattın.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'explain',
        label: L('Explain the bakery has only hot bread', 'Fırında sadece sıcak ekmek olduğunu anlat'),
        resolve: (c) => c.t('She accepted it as if you had announced a national tragedy. Then she gave you a slice of börek.', 'Sanki ulusal bir felaket duyurmuşsun gibi kabullendi. Sonra sana bir dilim börek verdi.'),
      },
    ],
  },
  {
    id: 'base.job_dolmus_fare',
    category: 'work',
    minAge: 21,
    weight: 14,
    when: (c) => inTr(c) && onAny('dolmus')(c),
    title: L('Fares are coming forward hand to hand: "Two full, one student!"', 'Paralar elden ele öne geliyor: "İki tam, bir öğrenci!"'),
    text: L('You are driving, counting and making change at a red light. The light is about to turn green.', 'Hem sürüyor, hem sayıyor, hem kırmızı ışıkta para üstü veriyorsun. Işık yeşile dönmek üzere.'),
    choices: [
      {
        id: 'juggle',
        label: L('Count, drive and give change at once', 'Say, sür ve para üstünü aynı anda ver'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('Every coin to the right hand, green light, smooth start. A passenger in the back said "maşallah" quietly.', 'Her bozukluk doğru ele gitti, ışık yeşil, yumuşacık kalkış. Arkadan bir yolcu usulca "Maşallah" dedi.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'pull',
        label: L('Pull over and sort it out', 'Kenara çek, hesabı düzelt'),
        resolve: (c) => c.t('Thirty seconds at the kerb, all accounts settled. The car behind honked a long, meaningful honk.', 'Kaldırımda otuz saniye, bütün hesaplar kapandı. Arkadaki araba uzun ve anlamlı bir korna çaldı.'),
      },
      {
        id: 'student',
        label: L('Let the student ride free', 'Öğrenciden para alma'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('The student thanked you all the way to the last stop. The other passengers looked at you like a kind uncle.', 'Öğrenci son durağa kadar teşekkür etti. Diğer yolcular sana iyi kalpli bir amcaya bakar gibi baktı.');
        },
      },
    ],
  },
  {
    id: 'base.job_pazar_closing',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: (c) => inTr(c) && onAny('pazarci')(c),
    title: L('Closing time at the market and you still have a mountain of tomatoes.', 'Pazar kapanıyor ve tezgâhta hâlâ bir dağ domates var.'),
    text: L('The neighbouring stall has started shouting prices you cannot match.', 'Yan tezgâh senin inemeyeceğin fiyatlar bağırmaya başladı.'),
    choices: [
      {
        id: 'shout',
        label: L('Out-shout them', 'Onlardan yüksek bağır'),
        resolve: (c) => {
          const amt = cash(c, 80);
          c.h.stat('happiness', 4);
          return c.t(`"Here is the tomato, here is the flavour!" You sold out and lost your voice. ${amt} in the till.`, `"Domates burada, lezzet burada!" Hepsini sattın, sesin kısıldı. Kasada ${amt} var.`) + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'give',
        label: L('Give the rest to the soup kitchen', 'Kalanını aşevine ver'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('The soup kitchen made menemen for sixty people. You ate a plate too. Best breakfast of the year.', 'Aşevi altmış kişiye menemen yaptı. Sen de bir tabak yedin. Yılın en güzel kahvaltısı.');
        },
      },
      {
        id: 'sauce',
        label: L('Take them home and make sauce', 'Eve götürüp salça yap'),
        resolve: (c) => {
          c.h.stat('health', 1);
          return c.t('Your balcony was red with drying tomato paste for a week. Your neighbours all got a jar. Winter is sorted.', 'Balkonun bir hafta kuruyan salçayla kıpkırmızı oldu. Bütün komşulara birer kavanoz düştü. Kış hazır.');
        },
      },
    ],
  },
  {
    id: 'base.job_doner_rush',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: (c) => inTr(c) && onAny('doner')(c),
    title: L('Lunch rush, and the skewer is turning faster than you can slice.', 'Öğle kalabalığı ve şiş senin kesebileceğinden hızlı dönüyor.'),
    text: L('Thirty people from the factory next door, one hour of break, one knife.', 'Yandaki fabrikadan otuz kişi, bir saatlik mola, tek bir bıçak.'),
    choices: [
      {
        id: 'fast',
        label: L('Slice like the wind', 'Rüzgâr gibi kes'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Thirty wraps in twenty-two minutes. The factory foreman wants to hire you for the assembly line. You said no; the döner needs you.', 'Yirmi iki dakikada otuz dürüm. Fabrikanın ustabaşı seni banda almak istedi. Hayır dedin; dönerin sana ihtiyacı var.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'plate',
        label: L('Switch everyone to plates and rice', 'Herkese pilav üstü tabak ver'),
        resolve: (c) => {
          const amt = cash(c, 60);
          return c.t(`Plates are faster and cost more. The till smiled: ${amt}. A few traditionalists grumbled.`, `Tabak daha hızlı, hem de daha pahalı. Kasa güldü: ${amt}. Birkaç gelenekçi homurdandı.`);
        },
      },
    ],
  },
  {
    id: 'base.job_bekci_night',
    category: 'work',
    minAge: 21,
    weight: 14,
    when: (c) => inTr(c) && onAny('bekci')(c),
    title: L('Two in the morning, and a shop door is ajar on your street.', 'Gece ikide sokağındaki bir dükkânın kapısı aralık.'),
    text: L('A light flickers inside. Your whistle is in your hand.', 'İçeride bir ışık titriyor. Düdüğün elinde.'),
    choices: [
      {
        id: 'whistle',
        label: L('Blow the whistle and go in', 'Düdüğü çal ve içeri gir'),
        badge: 'Risky',
        resolve: (c) => {
          if (c.rng.chance(0.7)) {
            c.h.stat('happiness', 5);
            return c.t('It was the owner, doing his accounts at night because his wife snores. He made you tea at 2 a.m.', 'Dükkân sahibiymiş; karısı horladığı için hesaplarını gece yapıyormuş. Gece ikide sana çay demledi.') + promo(c);
          }
          c.h.stat('health', -4);
          return c.t('Two burglars ran out of the back. You caught one and lost your cap. The neighbourhood bought you a new cap.', 'Arka kapıdan iki hırsız fırladı. Birini yakaladın, şapkanı kaybettin. Mahalle sana yeni bir şapka aldı.');
        },
      },
      {
        id: 'call',
        label: L('Call for backup and wait', 'Destek iste ve bekle'),
        resolve: (c) => c.t('The patrol came. It was the owner doing his accounts. Everybody had tea. Everybody went home.', 'Ekip geldi. Dükkân sahibi hesap yapıyormuş. Herkes çay içti. Herkes evine gitti.'),
      },
    ],
  },

  // ================================================================ part-time work
  {
    id: 'base.job_parttime_exam',
    category: 'work',
    minAge: 14,
    maxAge: 25,
    weight: 12,
    when: partTimer,
    title: L('Your boss asks you to cover a shift the night before a big exam.', 'Patronun büyük bir sınavdan önceki akşam vardiyaya kalmanı istiyor.'),
    text: L('Double pay. One chapter left to read. Possibly two.', 'Çift ücret. Okunacak bir ünite kaldı. Belki iki.'),
    choices: [
      {
        id: 'shift',
        label: L('Take the shift', 'Vardiyaya kal'),
        resolve: (c) => {
          const amt = cash(c, 80);
          c.h.stat('smarts', -1);
          return c.t(`${amt} richer, one chapter poorer. You guessed three questions and got two.`, `${amt} daha zenginsin, bir ünite daha fakir. Üç soruyu tahminle yaptın, ikisi tuttu.`) + promo(c);
        },
      },
      {
        id: 'study',
        label: L('Say no and study', 'Hayır de ve ders çalış'),
        resolve: (c) => {
          c.h.stat('smarts', 2);
          c.h.stat('happiness', 2);
          return c.t('Your boss sighed and found someone else. You aced the exam.', 'Patronun iç çekip başkasını buldu. Sınavı çok iyi geçtin.');
        },
        tone: 'good',
      },
      {
        id: 'both',
        label: L('Study during the quiet hours', 'Boş saatlerde ders çalış'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            cash(c, 80);
            c.h.stat('smarts', 1);
            return c.t('It was a quiet night. You read the whole chapter between customers and got paid for it.', 'Sakin bir geceydi. Müşterilerin arasında bütün üniteyi okudun ve bunun için para da aldın.');
          }
          c.h.stat('happiness', -3);
          return c.t('It was the busiest night of the year. You did not open the book once.', 'Yılın en yoğun gecesiydi. Kitabı bir kez bile açamadın.');
        },
      },
    ],
  },
  {
    id: 'base.job_babysit_chaos',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: onAny('babysitter'),
    title: L('The children have locked you out of the living room.', 'Çocuklar seni salonun dışında bıraktı, kapıyı kilitlediler.'),
    text: L('You can hear giggling and something heavy being moved. The parents are back in an hour.', 'Kıkırdamalar ve ağır bir şeyin sürüklendiğini duyuyorsun. Anne baba bir saat sonra dönüyor.'),
    choices: [
      {
        id: 'bribe',
        label: L('Negotiate with biscuits', 'Bisküviyle pazarlık et'),
        resolve: (c) => {
          c.h.stat('happiness', 4);
          return c.t('The door opened for two biscuits each. They had built a fort out of every cushion in the house. You helped finish it. The parents loved it.', 'Kapı kişi başı iki bisküviye açıldı. Evdeki bütün minderlerden bir kale yapmışlar. Bitirmelerine yardım ettin. Anne baba bayıldı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'quiet',
        label: L('Go completely quiet until they get curious', 'Merak edene kadar tamamen sus'),
        resolve: (c) => {
          c.h.stat('smarts', 1);
          return c.t('Four minutes of silence and the door opened a crack: "Are you still there?" You won.', 'Dört dakikalık sessizlikten sonra kapı aralandı: "Hâlâ orada mısın?" Kazandın.');
        },
      },
    ],
  },
  {
    id: 'base.job_lifeguard_save',
    category: 'work',
    minAge: 16,
    weight: 14,
    when: onAny('lifeguard'),
    title: L('A child is splashing in the deep end, and not for fun.', 'Derin tarafta bir çocuk çırpınıyor ve bu oyun değil.'),
    text: L('Everyone else is looking at their phones.', 'Herkes telefonuna bakıyor.'),
    choices: [
      {
        id: 'dive',
        label: L('Dive in', 'Atla'),
        resolve: (c) => {
          c.h.stat('happiness', 10);
          return c.t('You had him out in twenty seconds. He coughed, cried and asked if he could go again. His mother hugged you for a full minute.', 'Yirmi saniyede çıkardın. Öksürdü, ağladı ve bir daha girip giremeyeceğini sordu. Annesi sana tam bir dakika sarıldı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'float',
        label: L('Throw the ring and talk him in', 'Simidi at ve konuşarak çek'),
        resolve: (c) => {
          c.h.stat('happiness', 6);
          c.h.stat('smarts', 1);
          return c.t('He grabbed the ring and you pulled him in, calm as a textbook. The pool manager put your name on the board.', 'Simide tutundu ve onu ders kitabındaki gibi sakin bir şekilde çektin. Havuz müdürü adını panoya yazdı.');
        },
      },
    ],
  },
  {
    id: 'base.job_dog_tangle',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: onAny('dog_walker'),
    title: L('Six dogs, six leads, and a cat on the other side of the road.', 'Altı köpek, altı tasma ve yolun karşısında bir kedi.'),
    text: L('The cat knows exactly what it is doing.', 'Kedi tam olarak ne yaptığını biliyor.'),
    choices: [
      {
        id: 'hold',
        label: L('Plant your feet and hold on', 'Ayaklarını sağlam bas ve tut'),
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.stat('happiness', 4);
            return c.t('You held. Six dogs, one human, zero escapes. The cat looked disappointed.', 'Tuttun. Altı köpek, bir insan, sıfır kaçak. Kedi hayal kırıklığına uğramış görünüyordu.') + promo(c);
          }
          c.h.stat('health', -2);
          return c.t('You were dragged across a flowerbed. All six dogs were very pleased with the walk.', 'Bir çiçek tarhının içinden sürüklendin. Altı köpek de yürüyüşten çok memnundu.');
        },
      },
      {
        id: 'treat',
        label: L('Shake the treat bag', 'Mama poşetini salla'),
        resolve: (c) => {
          c.h.stat('happiness', 3);
          return c.t('Six heads turned to you at once. The cat was forgotten. Never underestimate the treat bag.', 'Altı kafa aynı anda sana döndü. Kedi unutuldu. Mama poşetini asla küçümseme.');
        },
        tone: 'good',
      },
    ],
  },
  {
    id: 'base.job_tutor_kid',
    category: 'work',
    minAge: 14,
    weight: 14,
    when: onAny('tutor'),
    title: L('The kid you tutor says maths is "pointless".', 'Ders verdiğin çocuk matematiğin "gereksiz" olduğunu söylüyor.'),
    text: L('He has a test on Friday and a football match on Saturday.', 'Cuma sınavı, cumartesi de maçı var.'),
    choices: [
      {
        id: 'football',
        label: L('Teach it with football statistics', 'Futbol istatistikleriyle anlat'),
        resolve: (c) => {
          c.h.stat('happiness', 5);
          return c.t('Percentages through penalty records. He got a B and asked for "more football maths". His parents raised your rate.', 'Yüzdeleri penaltı istatistikleriyle anlattın. İyi bir not aldı ve "daha çok futbol matematiği" istedi. Ailesi ücretini artırdı.') + promo(c);
        },
        tone: 'good',
      },
      {
        id: 'drill',
        label: L('Drill the exercises', 'Bol bol soru çözdür'),
        resolve: (c) => c.t('Forty exercises. He passed, barely, and still thinks maths is pointless. A draw.', 'Kırk soru. Kıl payı geçti ve matematiğin gereksiz olduğunu hâlâ düşünüyor. Berabere.'),
      },
    ],
  },
  {
    id: 'base.job_parttime_boss',
    category: 'work',
    minAge: 14,
    maxAge: 25,
    weight: 10,
    when: (c) => partTimer(c) && onAny('fast_food', 'cashier', 'shop_helper', 'car_wash', 'cinema_usher', 'seasonal_hotel', 'newspaper', 'barista', 'retail')(c),
    title: L('Your manager says you are "management material".', 'Müdürün senin "yöneticilik malzemesi" olduğunu söylüyor.'),
    text: L('You are still at school. The offer is more hours and a badge that says "Supervisor".', 'Hâlâ okuldasın. Teklif daha çok saat ve üstünde "Sorumlu" yazan bir yaka kartı.'),
    choices: [
      {
        id: 'yes',
        label: L('Take the badge', 'Yaka kartını al'),
        resolve: (c) => {
          c.h.stat('smarts', -1);
          cash(c, 150);
          return c.t('You are in charge of three people older than you. It is strange and you are surprisingly good at it.', 'Senden büyük üç kişinin sorumlususun. Tuhaf ve şaşırtıcı derecede iyisin.') + promo(c);
        },
      },
      {
        id: 'no',
        label: L('Keep it small for now', 'Şimdilik küçük tut'),
        resolve: (c) => {
          c.h.stat('happiness', 2);
          return c.t('You kept your hours and your grades. Your manager said the badge would wait for you. It might.', 'Saatlerini de notlarını da korudun. Müdürün yaka kartının seni bekleyeceğini söyledi. Belki bekler.');
        },
        tone: 'good',
      },
    ],
  },
];
