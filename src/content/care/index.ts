import type { ActivityDef, ContentPack } from '../types';
import type { RibbonDef } from '../../engine/ribbons';
import type { GoalDef } from '../../engine/goals';
import type { Player } from '../../engine/types';
import { say, type Pair } from '../base/lines';
import { careEvents } from './events';

// "Care" expansion: looking after the people who looked after you, and the slower years of your own body.
export const CARE_ENTITLEMENT = 'pack.care';

const flag = (p: Player, name: string) => p.flags[name] !== undefined;

const CALL: Pair[] = [
  ['You rang and heard about the neighbour’s hip, the price of eggs and a dream with a goat in it. It was lovely.', 'Aradın; komşunun kalçasını, yumurta fiyatını ve içinde keçi olan bir rüyayı dinledin. Çok güzeldi.'],
  ['A long call. The best part was the pause before “Well. Look after yourself.”', 'Uzun bir görüşme. En güzel kısmı “Neyse. Kendine iyi bak” öncesindeki duraklamaydı.'],
  ['You asked what they had for lunch and got an answer that went back to 1964.', 'Öğle yemeğinde ne yediklerini sordun ve 1964’e kadar uzanan bir cevap aldın.'],
  ['You rang during their programme. They talked over it, which was the programme’s fault.', 'Programlarının tam ortasında aradın. Programın üstüne konuştular; suç programdaydı.'],
  ['They answered on the ninth ring, breathless, and had been in the garden the whole time.', 'Dokuzuncu çalışta nefes nefese açtılar; bütün vakit bahçedeymişler.'],
  ['A short call. They said “Eat something” four times and “I love you” once, in the same tone.', 'Kısa bir görüşme. Dört kez “Bir şey ye”, bir kez “Seni seviyorum” dediler; ikisini de aynı sesle.'],
  ['You called to ask a recipe. You came away with the recipe and a verdict on your haircut.', 'Bir tarifi sormak için aradın. Tarifle birlikte saç modeline dair bir hüküm de aldın.'],
  ['They told you about a wedding you had not been invited to, in forensic detail.', 'Davet edilmediğin bir düğünü adli tıp titizliğiyle anlattılar.'],
  ['The line crackled, and neither of you minded. It was mostly the sound of someone being there.', 'Hat çıtırdadı ve ikiniz de takmadınız. Çoğu, birinin orada olmasının sesiydi.'],
  ['You asked how they slept. Forty minutes later you knew about the whole street’s night.', 'Nasıl uyudukları sordun. Kırk dakika sonra bütün sokağın gecesini öğrenmiştin.'],
  ['They put the phone down by accident and you listened to their kitchen for a minute. It was lovely.', 'Telefonu yanlışlıkla bıraktılar ve bir dakika mutfaklarını dinledin. Çok güzeldi.'],
];
const SIT: Pair[] = [
  ['You sat with them and did nothing at all. It was the most useful thing you did all week.', 'Yanlarında oturup hiçbir şey yapmadın. Haftanın en yararlı işiydi.'],
  ['You went through a box of photographs together. They knew every face. You pretended to know them too.', 'Birlikte bir kutu fotoğrafa baktınız. Her yüzü tanıdılar. Sen de tanıyormuş gibi yaptın.'],
  ['You tidied the cupboard they have been meaning to tidy since 1998. They supervised from a chair.', 'Onların 1998’den beri toplamayı düşündüğü dolabı topladın. Bir sandalyeden gözetim yaptılar.'],
  ['You helped sort the mail. They kept a leaflet about gutters “for later”.', 'Postaları ayırmaya yardım ettin. Oluklarla ilgili bir broşürü “sonrası için” sakladılar.'],
  ['You watched the afternoon quiz together. They knew every answer from before 1980.', 'Öğleden sonra yarışmasını birlikte izlediniz. 1980’den önceki her cevabı biliyorlardı.'],
  ['You carried the shopping up and stayed for tea. It turned into soup.', 'Alışverişi yukarı taşıdın ve çaya kaldın. Çay çorbaya dönüştü.'],
  ['They showed you how to fold a tea towel “properly”. There are rules. There have always been rules.', 'Çay bezini “doğru dürüst” katlamayı gösterdiler. Kuralları var. Hep vardı.'],
  ['You sat on the balcony and watched the street. A dog crossed it twice, with great purpose.', 'Balkonda oturup sokağı izledin. Bir köpek büyük bir amaçla iki kez karşıdan karşıya geçti.'],
  ['You helped them find their glasses. They were on their head. The ritual is part of the visit.', 'Gözlüklerini bulmalarına yardım ettin. Kafalarındaydı. Bu tören ziyaretin bir parçası.'],
  ['You re-read an old letter aloud for them. They corrected your pronunciation of a name from 1962.', 'Eski bir mektubu onlara yüksek sesle okudun. 1962’den bir ismi telaffuzunda düzelttiler.'],
  ['You changed a bulb that did not need changing, to have a reason to stay another hour.', 'Değişmesi gerekmeyen bir ampulü değiştirdin; bir saat daha kalmak için bahane olsun diye.'],
];
const MOVE: Pair[] = [
  ['Gentle exercise, slow stretches, and a teacher who said “well done” at every wobble.', 'Hafif egzersiz, yavaş esnemeler ve her sendelemede “aferin” diyen bir öğretmen.'],
  ['A class of eleven people and a radio. You were the third-best in the room, which pleased you out of all proportion.', 'On bir kişilik bir sınıf ve bir radyo. Odadaki üçüncü en iyiydin; bu seni orantısız derecede mutlu etti.'],
  ['You walked the long way round the park and said hello to a heron.', 'Parkta uzun yoldan yürüdün ve bir balıkçıla selam verdin.'],
  ['You tried a slow stretching class and discovered muscles with names.', 'Yavaş bir esneme sınıfı denedin ve adı olan kaslar keşfettin.'],
  ['A walk by the water, a bench, a thermos. The heron was there again. It remembers you.', 'Suyun kıyısında bir yürüyüş, bir bank, bir termos. Balıkçıl yine oradaydı. Seni hatırlıyor.'],
  ['Chair yoga. You were the only one who laughed. The teacher, to her credit, laughed too.', 'Sandalye yogası. Gülen tek kişi sendin. Öğretmen de, takdir edilmeli, güldü.'],
  ['You swam slowly, and the lifeguard nodded at you in a way that said “well done for being here”.', 'Yavaş yüzdün; cankurtaran sana “gelmiş olman bile güzel” der gibi başını salladı.'],
  ['You took the stairs instead of the lift. Nobody saw, and you gave yourself a small, private medal.', 'Asansör yerine merdiveni kullandın. Kimse görmedi ve kendine küçük, gizli bir madalya verdin.'],
  ['A morning walk with a neighbour. You solved two small problems and one very large one, in theory.', 'Bir komşuyla sabah yürüyüşü. İki küçük, bir de çok büyük sorunu kuramda çözdünüz.'],
  ['You danced in the kitchen, to the radio, for one entire song. It counted.', 'Mutfakta, radyoyla, bir şarkının tamamı boyunca dans ettin. Sayıldı.'],
  ['You did your exercises in front of a window and a cat watched, unimpressed.', 'Egzersizlerini bir pencerenin önünde yaptın ve bir kedi etkilenmeden izledi.'],
];

const activities: ActivityDef[] = [
  {
    id: 'care_call',
    label: (c) => c.t('Call your parent', 'Ebeveynini ara'),
    description: (c) => c.t('+Happiness, closer', '+Mutluluk, yakınlık'),
    group: 'Family',
    minAge: 16,
    available: (c) => c.h.relatives(['mother', 'father']).length > 0,
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 2);
      for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, 2);
      return say(c, 'care_call', CALL);
    },
  },
  {
    id: 'care_sit',
    label: (c) => c.t('Spend an afternoon with your parent', 'Ebeveynine bir öğleden sonra ayır'),
    description: (c) => c.t('+Happiness, much closer', '+Mutluluk, çok daha yakın'),
    group: 'Family',
    minAge: 20,
    available: (c) => c.h.relatives(['mother', 'father']).some((r) => c.h.ageOf(r.person) >= 60),
    hideWhenUnavailable: true,
    run: (c) => {
      c.h.stat('happiness', 3);
      for (const r of c.h.relatives(['mother', 'father'])) c.h.closeness(r.person.id, 5);
      return say(c, 'care_sit', SIT);
    },
  },
  {
    id: 'care_move',
    label: (c) => c.t('Join a gentle exercise class', 'Hafif egzersiz sınıfına katıl'),
    description: (c) => c.t('+Health, +Happiness', '+Sağlık, +Mutluluk'),
    group: 'Mind & Body',
    minAge: 45,
    run: (c) => {
      c.h.stat('health', 3);
      c.h.stat('happiness', 2);
      return say(c, 'care_move', MOVE);
    },
  },
];

const ribbons: RibbonDef[] = [
  {
    id: 'carer',
    name: 'The Carer',
    desc: 'Looked after a parent in their last years.',
    nameTr: 'Bakım Veren',
    descTr: 'Ebeveynine son yıllarında baktı.',
    test: (_r, p) => flag(p, 'care_parent'),
  },
  {
    id: 'long_haul',
    name: 'The Long Haul',
    desc: 'Lived 75+ years with a lasting condition.',
    nameTr: 'Uzun Yol',
    descTr: 'Kalıcı bir rahatsızlıkla 75+ yıl yaşadı.',
    test: (r, p) => flag(p, 'care_condition') && r.age >= 75,
  },
];

const goals: GoalDef[] = [
  { id: 'care_parent', label: 'Look after a parent as they grow old', labelTr: 'Yaşlanan bir ebeveyne bak', check: (s) => flag(s.player, 'care_parent') },
  { id: 'care_recorded', label: 'Record a parent’s life story', labelTr: 'Bir ebeveynin hayat hikâyesini kaydet', check: (s) => flag(s.player, 'care_recorded') },
];

export const carePack: ContentPack = {
  id: 'care',
  title: 'Care',
  description: 'Looking after the people who looked after you, and the slower years of your own body: doctors, routines, good days and quiet ones.',
  rating: 'all',
  entitlement: CARE_ENTITLEMENT,
  events: careEvents,
  activities,
  ribbons,
  goals,
};
