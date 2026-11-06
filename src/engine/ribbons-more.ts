import type { LifeRecord, Player } from './types';
import type { RibbonDef } from './ribbons';

/**
 * Round 8: more end-of-life ribbons, rarest and most specific first, because the first match wins (ribbons.ts puts
 * them between 'big_family' and 'soulmates'). Every test reads only data a life really keeps: the record, the
 * achievements, the relations, p.ext and the dynasty. Type-only imports, so there is no circular import with
 * ribbons.ts. Each ribbon is meant for roughly 0.3% to 3% of lives (measured with bot dynasties:
 * 35 ribbons take about a third of all lives together); the shares come from the thresholds below, so retune them together.
 */

const has = (p: Player, ...ids: string[]) => ids.some((id) => p.achievements.includes(id));

/** The best-paid job of the life and its rung (p.ext.engine.peakJob, game.ts), if any. */
const peakJob = (p: Player) => ((p.ext?.engine as { peakJob?: { id: string; level: number } } | undefined)?.peakJob);
/** A lifetime of one kind of work: the best job was one of `ids` at `rung` or higher, and the life reached retirement. */
const careerOf = (p: Player, ids: string[], rung = 2) => {
  const j = peakJob(p);
  return !!j && p.retired && ids.includes(j.id) && j.level >= rung;
};

/** Pets the family ever had in this player's time (the list keeps the dead ones too). */
const petCount = (p: Player) => ((p.ext?.pets as { pets?: unknown[] } | undefined)?.pets ?? []).length;

/** People the player has loved: the partner or spouse now, and every ex. */
const loves = (p: Player) => p.relations.filter((r) => r.kind === 'partner' || r.kind === 'spouse' || r.kind === 'ex').length;
const exes = (p: Player) => p.relations.filter((r) => r.kind === 'ex').length;

const flag = (p: Player, f: string) => f in p.flags;

/** Lives that ended in debt or alone keep 'broke' and 'lone_wolf', which come later. */
const keepsOwn = (r: LifeRecord) => r.netWorth >= 0 && (!!r.partnerName || r.children > 0 || r.age < 60);

const ribbon = (id: string, name: string, desc: string, nameTr: string, descTr: string, test: RibbonDef['test']): RibbonDef => ({
  id,
  name,
  desc,
  nameTr,
  descTr,
  test: (r, p, s) => keepsOwn(r) && test(r, p, s),
});


export const MORE_RIBBONS: RibbonDef[] = [
  // ---- things that were done (achievements)
  ribbon('everyday_hero', 'Everyday Hero', 'Did the brave thing when nobody asked and nobody was filming.', 'Günlük Kahraman', 'Kimse istemeden, kimse çekmeden cesur olanı yaptı.', (_r, p) => has(p, 'hero', 'caught_thief')),
  ribbon('memoirist', 'Memoirist', 'Wrote the memoir. The names were changed, the story was not.', 'Anı Yazarı', 'Anılarını yazdı. İsimler değişti, hikâye değişmedi.', (_r, p) => has(p, 'memoir')),
  ribbon('with_honors', 'With Honors', 'Graduated with honors and mentioned it only twice a year.', 'Onur Listesi', 'Onur derecesiyle mezun oldu ve bunu yılda yalnızca iki kez andı.', (_r, p) => has(p, 'honors')),
  ribbon('local_celeb', 'Known at the Bakery', 'Famous in exactly one neighbourhood, and quite happy there.', 'Fırıncının Tanıdığı', 'Tam olarak tek bir mahallede ünlüydü ve orada gayet mutluydu.', (_r, p) => has(p, 'local_celeb')),
  ribbon('twice_graduated', 'Twice Graduated', 'Went back for a master\'s degree. Nobody was surprised, least of all the library.', 'İki Diplomalı', 'Yüksek lisansa döndü. Kimse şaşırmadı, en az da kütüphane.', (_r, p) => has(p, 'masters')),
  ribbon('marathoner', 'Marathon Finisher', 'Ran 42 kilometres on purpose.', 'Maratonu Bitiren', 'Kırk iki kilometreyi bilerek koştu.', (_r, p) => has(p, 'marathon')),
  ribbon('successor', 'Passed the Keys', 'Handed the company to someone who could run it. Rarer than it sounds.', 'Anahtar Teslim', 'Şirketi yönetebilecek birine devretti. Duyulandan daha nadirdir.', (_r, p) => has(p, 'successor')),
  ribbon('homecomer', 'Homecomer', 'Went abroad, then moved back to where the bread tastes right.', 'Memlekete Dönen', 'Yurtdışına gitti, sonra ekmeğin tadının doğru olduğu yere döndü.', (_r, p) => flag(p, 'returned_home')),
  ribbon('far_from_home', 'Far From Home', 'Built a life in a country that was not the one they were born in.', 'Gurbetçi', 'Doğduğu ülkeden başka bir ülkede hayat kurdu.', (_r, p) => flag(p, 'emigrated') || flag(p, 'citizen_abroad')),

  // ---- love and family
  ribbon('heartbreaker', 'Heartbreaker', 'Two or more exes, and every one of them still tells the story.', 'Kalp Kırıcı', 'İki ya da daha fazla eski sevgili; hepsi hikâyeyi hâlâ anlatıyor.', (_r, p) => exes(p) >= 2),
  ribbon('serial_romantic', 'Serial Romantic', 'Fell in love four times or more, each one completely.', 'Seri Âşık', 'Dört kez ya da daha fazla âşık oldu, hepsine tüm kalbiyle.', (_r, p) => loves(p) >= 4),
  ribbon('grandparent_six', 'Grandparent of Six', 'Six or more grandchildren, and a very long birthday list.', 'Torun Kalabalığı', 'Altı ya da daha fazla torun ve çok uzun bir doğum günü listesi.', (r) => r.grandchildren >= 6),
  ribbon('line_founder', 'Founder of a Line', 'The first generation, with five grandchildren to show for it.', 'Soyun Kurucusu', 'İlk kuşak ve elinde gösterecek beş torun.', (r) => r.generation === 1 && r.grandchildren >= 5),
  ribbon('pet_whisperer', 'Pet Whisperer', 'Four or more pets, and every one of them knew whose house it was.', 'Hayvan Dostu', 'Dört ya da daha fazla evcil hayvan; hepsi evin kimin olduğunu bilirdi.', (_r, p) => petCount(p) >= 4),
  ribbon('rich_other_ways', 'Rich in Other Ways', 'Three children, a full table and an empty account.', 'Başka Türlü Zengin', 'Üç çocuk, dolu bir sofra ve boş bir hesap.', (r) => r.children >= 3 && r.netWorth < 10_000 && r.age >= 60),

  // ---- money and home
  ribbon('bootstrapper', 'Bootstrapper', 'No university, plenty of money. Nobody can say how.', 'Sıfırdan', 'Üniversite yok, bol para var. Kimse nasıl olduğunu açıklayamıyor.', (r, p) => p.education !== 'university' && r.netWorth >= 700_000),
  ribbon('old_money', 'Old Money', 'Third generation or later, and quietly worth a good deal.', 'Köklü Servet', 'Üçüncü kuşak ya da sonrası ve sessizce hatırı sayılır bir servet.', (r) => r.generation >= 3 && r.netWorth >= 600_000),
  ribbon('frugal_saint', 'Frugal Saint', 'Never owned a house, never wasted a coin, left a tidy sum.', 'Tutumlu Evliya', 'Hiç ev almadı, hiç kuruş harcamadı, derli toplu bir miras bıraktı.', (r, p) => r.age >= 70 && r.netWorth >= 600_000 && !p.home.owned),
  ribbon('mortgage_marathon', 'Mortgage Marathon', 'Still paying off the house at the end. The house, at least, was pleased.', 'Kredi Maratonu', 'Sonuna kadar evin taksitini ödedi. Ev en azından memnundu.', (_r, p) => !!p.home.loan),

  // ---- how it ended
  ribbon('hale_hearty', 'Hale and Hearty', 'Past eighty-eight and in better health than the doctor.', 'Demir Gibi', 'Seksen sekizi geçti ve doktordan daha sağlıklıydı.', (r, p) => r.age >= 88 && p.stats.health >= 50),
  ribbon('long_goodbye', 'Long Goodbye', 'A long illness, and a long time to say everything.', 'Uzun Veda', 'Uzun bir hastalık ve her şeyi söylemek için uzun bir zaman.', (r) => r.cause === 'a long illness' && r.age >= 85),
  ribbon('mind_the_step', 'Mind the Step', 'Lived a full life and was undone by a stair.', 'Basamağa Dikkat', 'Dolu dolu bir hayat yaşadı ve bir basamağa yenildi.', (r) => r.cause === 'a fall'),
  ribbon('quiet_exit', 'Quiet Exit', 'Went in their sleep without making a fuss, as planned.', 'Sessiz Veda', 'Uykusunda, gürültü çıkarmadan göçtü; tam planladığı gibi.', (r) => r.cause === 'peacefully in sleep' && r.age >= 88),
  ribbon('never_clocked_out', 'Never Clocked Out', 'Still working past 88. Retirement was a rumour.', 'Emekliliği Bilmeyen', '88 yaşını geçince de çalışıyordu. Emeklilik bir söylentiydi.', (r, p) => !!p.jobId && !p.retired && r.age >= 88),
  ribbon('workhorse', 'Workhorse', 'More than forty-six years in one job and a clean retirement.', 'Çalışkan Arı', 'Aynı işte kırk altı yıldan fazla ve temiz bir emeklilik.', (_r, p) => p.retired && p.jobYears >= 47),
  ribbon('head_turner', 'Head Turner', 'Looks 80 or higher. Took it with grace, mostly.', 'Göz Alıcı', 'Görünüş 80 ya da üstü. Bunu zarafetle taşıdı, çoğunlukla.', (_r, p) => p.stats.looks >= 80),
  ribbon('quiet_genius', 'Quiet Genius', 'Smarts 88 or higher without a diploma to prove it.', 'Sessiz Dahi', 'Diploması olmadan 88 ya da üstü Zekâ.', (_r, p) => p.stats.smarts >= 88 && p.education !== 'university'),
  ribbon('one_slip', 'One Slip', 'One conviction, forty years of being careful.', 'Tek Hata', 'Bir mahkûmiyet, kırk yıl dikkat.', (r, p) => p.criminalRecord === 1 && r.age >= 80),

  // ---- the work of a lifetime (best job of the life, at least the third rung)
  ribbon('chalk_dust', 'Chalk Dust', 'A teacher for life. Somewhere, a former pupil still sits up straight.', 'Tebeşir Tozu', 'Bir ömür öğretmen oldu. Bir yerlerde eski bir öğrenci hâlâ dik oturuyor.', (_r, p) => careerOf(p, ['teacher', 'preschool'], 3)),
  ribbon('night_shift', 'Night Shift', 'Looked after people for a living. Everyone remembers the one who stayed.', 'Gece Nöbeti', 'Hayatını insanlara bakarak kazandı. Herkes kalan o kişiyi hatırlıyor.', (_r, p) => careerOf(p, ['nurse', 'midwife', 'paramedic'], 3)),
  ribbon('kitchen_legend', 'Kitchen Legend', 'Cooked for a living, and the family still argues about the recipes.', 'Mutfak Efsanesi', 'Aşçılıkla geçindi; aile tariflerini hâlâ tartışıyor.', (_r, p) => careerOf(p, ['chef', 'baker', 'butcher', 'simitci'], 3)),
  ribbon('frequent_flyer', 'Frequent Flyer', 'A career in the air, and a suitcase that packs itself.', 'Gökyüzü Müdavimi', 'Gökyüzünde geçen bir kariyer ve kendi kendine hazırlanan bir bavul.', (_r, p) => careerOf(p, ['pilot', 'cabin_crew', 'atc'], 2)),
  ribbon('word_person', 'Word Person', 'Made a living from sentences and never stopped correcting menus.', 'Söz Ustası', 'Cümlelerle geçindi ve menülerdeki hataları düzeltmeyi hiç bırakmadı.', (_r, p) => careerOf(p, ['journalist', 'writer', 'translator'], 3)),
  ribbon('on_the_road', 'On the Road', 'Spent a working life behind a wheel and knew every shortcut.', 'Yolların Adamı', 'Çalışma hayatını direksiyon başında geçirdi ve her kestirmeyi bildi.', (_r, p) => careerOf(p, ['tour_guide', 'trucker', 'driving_instructor'], 3)),
  ribbon('good_with_hands', 'Good With Their Hands', 'Fixed, built and mended things, and refused to be thanked for it.', 'Eli Yatkın', 'Bir şeyleri onardı, kurdu, yamadı; teşekkür edilmesini istemedi.', (_r, p) => careerOf(p, ['electrician', 'plumber', 'carpenter', 'welder', 'mechanic', 'tailor', 'jeweler', 'construction', 'house_painter'], 2)),
];
