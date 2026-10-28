import type { Ctx } from '../types';
import type { Pair } from './lines';
import { PART_TIME_JOBS, isPupil, ownsWork, workKind, type WorkKind } from './util';
import { COMMUNITY, COMMUNITY_JOBS, JOB_R4, PART_TIME } from './work-lines-r4';

// Work lines by the kind of working day (playtest 3, problem 1: a miner answering emails on a Sunday, a fire
// chief zeroing the inbox). `workPool(c)` gives the kind's pool plus a few lines written for the exact job,
// and `workKey(c)` the memory key for `say` (the pool differs by job, so the key does too).

/** Fits every kind of employed work: office, shifts, uniforms, classrooms. */
const COMMON: Pair[] = [
  ['You did the work of two people this month. The second person was also you, slightly more tired.', 'Bu ay iki kişinin işini yaptın. İkinci kişi de sendin, biraz daha yorgun hâlin.'],
  ['You came in on your day off because something needed doing. Something always needs doing.', 'Bir işin yapılması gerektiği için izin gününde geldin. Hep yapılması gereken bir iş vardır.'],
  ['You beat your own record this month. Nobody else keeps track. You do.', 'Bu ay kendi rekorunu kırdın. Kimse takip etmiyor. Sen ediyorsun.'],
  ['You came home too tired to talk, proud of a long, honest day. Then another. Then another.', 'Eve konuşamayacak kadar yorgun ama uzun ve dürüst bir günün gururuyla döndün. Sonra bir gün daha. Bir gün daha.'],
  ["You fixed someone else's mistake before anyone noticed. Nobody noticed. That was the point.", 'Başkasının hatasını kimse fark etmeden düzelttin. Kimse fark etmedi. Amaç da buydu.'],
];

const OFFICE: Pair[] = [
  ['You stayed late every night this month. Your boss nodded at you once.', 'Bu ay her gece mesaiye kaldın. Patronun sana bir kere başıyla selam verdi.'],
  ['You answered emails on a Sunday. Nobody noticed. Except your back.', 'Pazar günü e-postalara cevap verdin. Kimse fark etmedi. Belin hariç.'],
  ['You fixed a problem nobody else could. Someone else presented it.', 'Kimsenin çözemediği bir sorunu çözdün. Sunumu başkası yaptı.'],
  ['You became the person who knows where everything is. A blessing and a curse.', 'Her şeyin nerede olduğunu bilen kişi oldun. Hem nimet hem bela.'],
  ['You color-coded the shared calendar. Your colleagues fear and respect you.', 'Ortak takvimi renk renk düzenledin. İş arkadaşların senden hem korkuyor hem saygı duyuyor.'],
  ['You skipped lunch for a deadline. You made the deadline. The deadline did not say thank you.', 'Bir teslim tarihi için öğle yemeğini atladın. Yetiştirdin. Teslim tarihi teşekkür etmedi.'],
  ['You came in early all month. The cleaner now greets you as a colleague.', 'Bütün ay erkenden geldin. Temizlik görevlisi artık seni iş arkadaşı gibi selamlıyor.'],
  ['You volunteered for the project nobody wanted. Now it is your project. Nobody else wants it still.', 'Kimsenin istemediği projeye gönüllü oldun. Artık senin projen. Hâlâ başka kimse istemiyor.'],
  ['You stayed late for a meeting about why meetings run late.', 'Toplantıların neden uzadığı üzerine geç saatte bir toplantıya kaldın.'],
  ['You rewrote a report three times. The final version was the first one. Your boss loved it.', 'Bir raporu üç kez baştan yazdın. Son hâli ilk hâliydi. Patronun bayıldı.'],
  ['You trained the new hire. They are now faster than you. You are proud and a little worried.', 'Yeni gelen çalışanı yetiştirdin. Artık senden hızlı. Hem gururlusun hem biraz endişeli.'],
  ['You worked every weekend this month. Your laptop knows your face better than your neighbors do.', 'Bu ay bütün hafta sonları çalıştın. Dizüstü bilgisayarın yüzünü komşularından iyi tanıyor.'],
  ['You stayed so late that the motion-sensor lights gave up on you.', 'O kadar geç saate kadar kaldın ki hareket sensörlü ışıklar senden ümidi kesti.'],
  ['You got your inbox down to zero. It lasted eleven minutes. You took a screenshot.', 'Gelen kutunu sıfırladın. On bir dakika sürdü. Ekran görüntüsünü aldın.'],
  ['You worked through a cold instead of staying home. Half the office has it now. Teamwork.', 'Evde kalmak yerine soğuk algınlığıyla çalıştın. Ofisin yarısı da kaptı. Takım çalışması.'],
  ['You fixed the printer. Word spread. You are now the IT department.', 'Yazıcıyı tamir ettin. Haber yayıldı. Artık bilgi işlem departmanı sensin.'],
  ['You made a spreadsheet so beautiful that a colleague asked for a copy just to look at it.', 'O kadar güzel bir tablo hazırladın ki bir iş arkadaşın sırf bakmak için bir kopyasını istedi.'],
  ['You took work home every evening this month. Your sofa is now an office with cushions.', 'Bu ay her akşam eve iş götürdün. Kanepen artık minderli bir ofis.'],
  ['A client called with an impossible request. You made it possible, then lay on the floor for ten minutes.', 'Bir müşteri imkânsız bir istekle aradı. İmkânsızı başardın, sonra on dakika yere uzandın.'],
  ['You prepared so well for a meeting that it was cancelled. You will use those slides one day.', 'Toplantıya o kadar iyi hazırlandın ki toplantı iptal oldu. O sunumu bir gün kullanacaksın.'],
  ['You ate lunch at your desk every day this month. The keyboard holds crumbs from three different sandwiches.', 'Bu ay her gün öğle yemeğini masanda yedin. Klavyede üç farklı sandviçin kırıntısı var.'],
  ['Your boss wrote "good job" in an email. Two words. You read them twenty times.', 'Patronun bir e-postada "Eline sağlık" yazdı. İki kelime. Yirmi kez okudun.'],
  ['You wrote an email so diplomatic it took an hour. The reply was "ok".', 'Öyle diplomatik bir e-posta yazdın ki bir saatini aldı. Cevap "tmm" geldi.'],
  ['You said "quick question" to a colleague two minutes before home time. It took an hour. You suffered most.', 'Mesai bitmeden iki dakika önce bir iş arkadaşına "Kısa bir sorum var" dedin. Bir saat sürdü. En çok da sen pişman oldun.'],
  ['You found a mistake in a spreadsheet that had been wrong since before you were hired. You kept it to yourself for a day, just to enjoy it.', 'Sen işe girmeden önce bile yanlış olan bir tablodaki hatayı buldun. Tadını çıkarmak için bir gün kimseye söylemedin.'],
  ['You took the meeting notes. Three people later read them back to you as their own ideas.', 'Toplantı notlarını sen tuttun. Üç kişi sonra onları kendi fikriymiş gibi sana geri okudu.'],
  ['You worked through the weekend. On Monday someone asked if you had a nice rest.', 'Bütün hafta sonu çalıştın. Pazartesi biri "İyi dinlendin mi?" diye sordu.'],
  ['You stayed until the building turned the air conditioning off. You now know what the office sounds like when it thinks it is alone.', 'Bina klimayı kapatana kadar kaldın. Ofisin kendini yalnız sandığında nasıl sesler çıkardığını artık biliyorsun.'],
  ['You were on four calls at once and did well in at least two of them.', 'Aynı anda dört görüşmeye bağlandın; en az ikisinde gayet iyiydin.'],
  ['You cleared the backlog. Your reward was a bigger backlog, with your name on it.', 'Biriken işleri bitirdin. Ödülün, üstünde adın yazan daha büyük bir iş yığını oldu.'],
  ["You covered for a colleague on leave and did both jobs. You watered their plant too. It is thriving, unlike you.", 'İzindeki bir iş arkadaşının yerine de baktın, iki işi birden yürüttün. Saksısını da suladın. O gayet iyi, sen değil.'],
  ['You learned the keyboard shortcut for everything. Your mouse now gathers dust and respect.', 'Her şeyin klavye kısayolunu öğrendin. Faren artık toz ve saygı topluyor.'],
  ['The tea in the office kitchen ran out at four. You finished the report on willpower alone.', 'Ofis mutfağında çay saat dörtte bitti. Raporu sadece iradenle bitirdin.'],
];

const TRADE: Pair[] = [
  ['You took every extra shift going. You now sleep in your clothes, for efficiency.', 'Bulduğun her fazla mesaiyi aldın. Artık verimli olsun diye kıyafetlerinle uyuyorsun.'],
  ['You started before sunrise all month. You have seen more dawns than most poets.', 'Bütün ay güneş doğmadan işe başladın. Çoğu şairden fazla şafak gördün.'],
  ['Your hands ache and your work has never been better. The two might be related.', 'Ellerin sızlıyor ve işin hiç bu kadar iyi olmamıştı. İkisi arasında bir bağ olabilir.'],
  ['You worked so hard this month that your tools need a holiday.', 'Bu ay o kadar çok çalıştın ki aletlerinin tatile ihtiyacı var.'],
  ['You stayed late to finish properly instead of quickly. It shows.', 'Çabuk değil düzgün bitirmek için geç saate kadar kaldın. Belli oluyor.'],
  ['An old hand watched you work and said, "Not bad." From them, that is a medal.', 'Kıdemli biri seni çalışırken izledi ve "Fena değil" dedi. Ondan bu bir madalya sayılır.'],
  ['You skipped the tea break three days in a row. Your workmates staged an intervention with biscuits.', 'Üç gün üst üste çay molasını atladın. Arkadaşların bisküviyle müdahale etti.'],
  ['You taught a newcomer the tricks of the trade. By Friday they were calling you "the master".', 'Yeni gelen birine işin inceliklerini öğrettin. Cuma gününe kadar sana "usta" demeye başladı.'],
  ['You ate lunch standing up every day this week. Efficient, and bad for the soul.', 'Bu hafta her gün öğle yemeğini ayakta yedin. Verimli ama ruha zararlı.'],
  ['You came home so dirty that the family made you undress on the doormat. It is a ceremony now.', 'Eve o kadar kirli döndün ki aile seni kapının önünde soyunmaya mecbur etti. Artık bir tören bu.'],
  ['You wore through a pair of work boots in one season. The shop assistant asked what you do. "Everything," you said.', 'Bir mevsimde bir çift iş botunu eskittin. Satıcı ne iş yaptığını sordu. "Her şeyi" dedin.'],
  ['Your back filed a complaint on Monday. You ignored it until Friday, then listened very carefully.', 'Belin pazartesi şikâyette bulundu. Cumaya kadar duymazdan geldin, cuma günü pür dikkat dinledin.'],
  ['You fixed something with a piece of wire and a strong opinion. It is still holding.', 'Bir şeyi bir parça tel ve sağlam bir inatla tamir ettin. Hâlâ dayanıyor.'],
  ['You worked a double and drank enough tea to float a small boat.', 'Çift vardiya çalıştın ve küçük bir kayığı yüzdürecek kadar çay içtin.'],
  ['The foreman watched you finish a job nobody wanted and said nothing. Next morning there was a new pair of gloves by your tea glass.', 'Ustabaşı kimsenin istemediği bir işi bitirdiğini gördü ve hiçbir şey demedi. Ertesi sabah çay bardağının yanında yepyeni bir iş eldiveni vardı.'],
  ['You came home with dust in places dust should not reach. You are not asking how.', 'Eve, tozun ulaşmaması gereken yerlerde tozla döndün. Nasıl olduğunu sormuyorsun.'],
  ['You did a job twice because the first time was only nearly right. Nobody else would have seen it. You would have.', 'Bir işi iki kez yaptın, çünkü ilki ancak neredeyse doğruydu. Başka kimse görmezdi. Sen görürdün.'],
  ['You learned to tell what is wrong from the sound alone. Younger workers think it is witchcraft.', 'Neyin bozuk olduğunu sadece sesinden anlamayı öğrendin. Gençler bunun büyü olduğunu düşünüyor.'],
  ['You went to bed at nine all week and called it a social life.', 'Bütün hafta dokuzda yattın ve buna sosyal hayat dedin.'],
  ['You carried more than you should have and lived to tell the tale, mostly to your physiotherapist.', 'Taşıman gerekenden fazlasını taşıdın ve anlatacak kadar hayatta kaldın. Çoğunlukla fizyoterapistine anlatıyorsun.'],
  ['You finished a week of hard graft and slept fourteen hours on Saturday. The family checked on you twice.', 'Ağır bir haftayı bitirdin ve cumartesi on dört saat uyudun. Aile iki kez gelip yaşıyor musun diye baktı.'],
];

const SERVICE: Pair[] = [
  ['You took every extra shift going. You now sleep in your clothes, for efficiency.', 'Bulduğun her fazla mesaiyi aldın. Artık verimli olsun diye kıyafetlerinle uyuyorsun.'],
  ['You worked through a holiday. Someone brought you a plate of food and called you a hero.', 'Bayramda bile çalıştın. Biri sana bir tabak yemek getirip kahraman dedi.'],
  ['You smiled at the public for nine hours straight. At home your face kept smiling on its own for a while.', 'Dokuz saat boyunca insanlara gülümsedin. Evde yüzün bir süre kendi kendine gülümsemeye devam etti.'],
  ['You swapped shifts with everyone who asked. Your calendar is now a work of abstract art.', 'Rica eden herkesle vardiya değiştirdin. Takvimin artık soyut bir sanat eseri.'],
  ['A regular said you are the only reason they keep coming back. You will think about it for a week.', 'Müdavimlerden biri hâlâ gelmesinin tek sebebinin sen olduğunu söyledi. Bir hafta bunu düşüneceksin.'],
  ['Somebody was rude to you at nine and somebody was lovely to you at five. The day came out even.', 'Biri sabah dokuzda sana kabalık etti, biri akşam beşte çok tatlıydı. Gün berabere bitti.'],
  ['You covered the late shift and the early one after it. You saw the same moon go down that you saw come up.', 'Gece vardiyasını, ardından da sabahçıyı sen kapattın. Doğduğunu gördüğün ayın battığını da gördün.'],
  ['You kept your cool with a customer who wanted to speak to "someone in charge". You were the someone.', '"Bir yetkiliyle" görüşmek isteyen bir müşteriye karşı soğukkanlılığını korudun. Yetkili sendin.'],
  ['You learned to read moods from the way people say "hello". It is a superpower and a burden.', 'İnsanların "merhaba" deyişinden ruh hâllerini okumayı öğrendin. Hem süper güç hem yük.'],
  ['The rush hit at once and you handled it like a conductor. Afterwards you sat in the back and shook a bit.', 'Kalabalık bir anda bastırdı ve sen bir orkestra şefi gibi idare ettin. Sonra arkaya geçip biraz titredin.'],
  ['You trained the new starter and they now say your catchphrases. The place is turning into you.', 'Yeni geleni yetiştirdin; artık senin lafların onun ağzında. Mekân yavaş yavaş sana dönüşüyor.'],
  ['Your feet hurt, your voice is hoarse and the till balanced to the last coin. A good day, then.', 'Ayakların ağrıyor, sesin kısık ve kasa son kuruşuna kadar tuttu. İyi bir gün yani.'],
  ['You ate your lunch in four bites between two customers. You do not remember what it was.', 'Öğle yemeğini iki müşteri arasında dört lokmada yedin. Ne olduğunu hatırlamıyorsun.'],
  ['A child said thank you without being told to. You told everyone at home.', 'Bir çocuk kimse söylemeden teşekkür etti. Evde herkese anlattın.'],
  ['You worked a double on a hot day and the boss bought everyone ice cream. Workers of the world, united by ice cream.', 'Sıcak bir günde çift vardiya çalıştın, patron herkese dondurma ısmarladı. Bütün emekçiler dondurmada birleşti.'],
];

const CREW: Pair[] = [
  ['You flew to four cities in three days and woke up not knowing which hotel ceiling you were looking at.', 'Üç günde dört şehre uçtun; uyandığında hangi otelin tavanına baktığını bilemedin.'],
  ['You took every extra rotation going. Your suitcase never quite gets unpacked now.', 'Bulduğun her ek uçuşu aldın. Bavulun artık hiçbir zaman tam boşalmıyor.'],
  ['Your body clock gave up and now runs on airport time.', 'Biyolojik saatin pes etti; artık havalimanı saatiyle çalışıyor.'],
  ['Turbulence, a full plane and a two-hour delay. You stayed calm, and so did everyone else, because you did.', 'Türbülans, tıklım tıklım bir uçak ve iki saatlik rötar. Sen sakin kaldın; sen sakin olduğun için herkes de.'],
  ['You spent a holiday at thirty-five thousand feet. The crew shared a cake cut with a plastic knife.', 'Bayramı on bin metre yükseklikte çalışarak geçirdin. Ekip plastik bıçakla kesilmiş bir pastayı paylaştı.'],
  ['You slept four hours in a hotel by the runway and still gave a perfect briefing.', 'Pistin yanındaki bir otelde dört saat uyudun ve brifingi yine kusursuz verdin.'],
  ['A nervous flyer gripped the armrest the whole way. At the door they thanked you as if you had carried the plane.', 'Uçmaktan korkan bir yolcu bütün yol koltuğun kolunu sıktı. Kapıda sana uçağı sırtında taşımışsın gibi teşekkür etti.'],
  ['You know the way from gate to gate in six airports without looking up. Your own city still confuses you.', 'Altı havalimanında kapıdan kapıya başını kaldırmadan yürüyebiliyorsun. Kendi şehrinde hâlâ kayboluyorsun.'],
  ['A child on board got a tour and a pair of wings to pin on. You got a drawing of a plane with you in it, larger than the plane.', 'Uçaktaki bir çocuk küçük bir tur ve yakasına takacak bir kanat rozeti aldı. Sen de içinde senin olduğun, senin uçaktan büyük çizildiğin bir resim aldın.'],
];

const HEALTH: Pair[] = [
  ['You washed your hands so many times this week that they now look ten years older than you.', 'Bu hafta ellerini o kadar çok yıkadın ki ellerin senden on yaş büyük görünüyor.'],
  ['You skipped lunch for a patient who needed you more. You ate a biscuit at four and called it a meal.', 'Sana daha çok ihtiyacı olan bir hasta için öğle yemeğini atladın. Saat dörtte bir bisküvi yedin ve buna öğün dedin.'],
  ["A patient's family brought pastries for the whole team. You had three, for morale.", 'Bir hastanın ailesi bütün ekibe bir tepsi baklava getirdi. "Moral olsun" diye üç dilim yedin.'],
  ['You stayed an hour after your day ended because one more patient was waiting. There is always one more.', 'Bir hasta daha beklediği için mesai bittikten sonra bir saat daha kaldın. Hep bir hasta daha olur.'],
  ['You explained the same thing nine times today, kindly, all nine times.', 'Bugün aynı şeyi dokuz kez anlattın; dokuzunda da güler yüzle.'],
  ['You wore your comfortable shoes until they gave up. They retired in service.', 'Rahat ayakkabılarını pes edene kadar giydin. Görev başında emekli oldular.'],
  ['A colleague asked for a second opinion. You gave it, and they listened. A good day.', 'Bir meslektaşın ikinci görüş istedi. Verdin, dinledi. İyi bir gündü.'],
  ['Someone who came in frightened left smiling. You will remember the smile longer than the case.', 'Korkarak gelen biri gülümseyerek çıktı. O gülümsemeyi vakadan daha uzun hatırlayacaksın.'],
  ['You read up on a rare case until midnight. The next morning it walked in. You were ready.', 'Nadir görülen bir vakayı gece yarısına kadar okudun. Ertesi sabah tam o vaka kapıdan girdi. Hazırdın.'],
  ['You drank coffee that had been sitting on the counter since morning. You are past caring.', 'Sabahtan beri tezgâhta duran kahveyi içtin. Artık umursamıyorsun.'],
  ['Your handwriting has become illegible even to you. The pharmacist has started guessing, kindly.', 'El yazın artık senin için bile okunmaz oldu. Eczacı iyi niyetle tahmin etmeye başladı.'],
  ['You trained a nervous new starter. On day three they did it alone and looked at you as if you had invented medicine.', 'Ürkek bir yeni başlayanı yetiştirdin. Üçüncü gün işi tek başına yaptı ve sana tıbbı sen icat etmişsin gibi baktı.'],
  ['You caught something small that would have become something big. Nobody will ever know. You know.', 'Büyük bir derde dönüşecek küçük bir şeyi zamanında yakaladın. Kimse bilmeyecek. Sen biliyorsun.'],
  ['You took every extra shift going. Your scrubs now feel more like pyjamas than your pyjamas do.', 'Bulduğun her ek nöbeti aldın. Forman artık pijamandan daha çok pijama gibi geliyor.'],
  ['You held a frightened hand for ten minutes. It was the most important thing you did all week.', 'Korkmuş bir eli on dakika tuttun. Bütün haftanın en önemli işi buydu.'],
];

const UNIFORM: Pair[] = [
  ['You pulled a double and polished your boots at the end of it, out of habit and pride.', 'Çift nöbet tuttun, sonunda da alışkanlıktan ve gururdan botlarını parlattın.'],
  ['You volunteered for every night duty this month. The night has started to recognise you.', 'Bu ay bütün gece nöbetlerine gönüllü oldun. Gece artık seni tanımaya başladı.'],
  ['You aced the fitness test. The younger ones asked for your secret. You said "tea".', 'Kondisyon testini birincilikle geçtin. Gençler sırrını sordu. "Çay" dedin.'],
  ['You ironed your uniform until the crease could slice bread.', 'Üniformanı ütüledin; çizgisi ekmek kesecek kadar keskin.'],
  ['You were first in and last out all month. Your name on the duty roster is practically engraved.', 'Bütün ay ilk gelen ve son çıkan sendin. Nöbet çizelgesinde adın neredeyse kazınmış durumda.'],
  ['You did the paperwork nobody wants to do. All of it. Somewhere a filing cabinet is grateful.', 'Kimsenin yapmak istemediği evrak işlerini yaptın. Hepsini. Bir yerlerde bir dosya dolabı sana minnettar.'],
  ['A drill ran long, so you ran it again, properly. The new recruits now copy the way you stand.', 'Bir tatbikat uzadı; sen de bir kez daha, usulüyle yaptırdın. Yeni gelenler artık senin duruşunu taklit ediyor.'],
  ['You worked through a holiday. Someone brought you a plate of food and called you a hero. This time it was nearly true.', 'Bayramda bile görevdeydin. Biri sana bir tabak yemek getirip kahraman dedi. Bu sefer neredeyse doğruydu.'],
  ['You came home and fell asleep in your uniform. The family put a blanket over you and took a photo.', 'Eve gelip üniformanla uyuyakaldın. Aile üstüne bir battaniye örttü, bir de fotoğraf çekti.'],
  ['Your superior said "carry on" in a tone that, translated, meant "well done".', 'Amirin "Devam" dedi; tercüme edilirse "Aferin" demekti.'],
  ['You checked the equipment twice, then once more. Nobody laughed. In your line of work, nobody laughs at that.', 'Teçhizatı iki kez kontrol ettin, sonra bir kez daha. Kimse gülmedi. Senin işinde buna kimse gülmez.'],
  ['You ate lunch standing up every day this week. Efficient, and bad for the soul.', 'Bu hafta her gün öğle yemeğini ayakta yedin. Verimli ama ruha zararlı.'],
  ["You covered a colleague's shift so they could see their kid's school play. They brought you a drawing from the kid.", 'Bir arkadaşın, çocuğunun okul gösterisini izleyebilsin diye nöbetini sen tuttun. Çocuğun yaptığı bir resmi getirdi sana.'],
  ['You made tea for the whole shift at three in the morning. Morale is a kettle.', 'Gece üçte bütün vardiyaya çay demledin. Moral dediğin bir çaydanlıktır.'],
  ['A long night, a cold wind and nothing went wrong. That is the best kind of night, and nobody ever hears about it.', 'Uzun bir gece, soğuk bir rüzgâr ve hiçbir şey ters gitmedi. Gecelerin en iyisi budur ve kimse duymaz.'],
];

const SCHOOL: Pair[] = [
  ['You stayed after hours with the ones who were struggling. One of them finally got it. You drove home grinning.', 'Zorlananlarla mesai sonrasına kaldın. Biri sonunda anladı. Eve sırıtarak döndün.'],
  ['A parent cornered you with a complaint and left paying you a compliment. You do not know how you did it either.', 'Bir veli seni şikâyet etmek için köşeye sıkıştırdı, iltifat ederek ayrıldı. Nasıl yaptığını sen de bilmiyorsun.'],
  ['You learned every name in the new group in a week, including the twins.', 'Yeni grubun bütün isimlerini bir haftada öğrendin; ikizler dahil.'],
  ['You lost your voice by Thursday and got through Friday with a whistle and your eyebrows.', 'Perşembe günü sesin kısıldı. Cumayı bir düdük ve kaşlarınla idare ettin.'],
  ['You planned next term during the holidays. Your family asked what holidays are for.', 'Tatilde gelecek dönemi planladın. Ailen tatilin ne işe yaradığını sordu.'],
  ['Someone you taught years ago stopped you in the street to say thank you. You were useless for the rest of the day.', 'Yıllar önce yetiştirdiğin biri sokakta seni durdurup teşekkür etti. Günün geri kalanında hiçbir işe yaramadın.'],
  ['You bought supplies with your own money again. Somewhere an accountant sighs.', 'Malzemeleri yine kendi cebinden aldın. Bir yerlerde bir muhasebeci iç çekiyor.'],
  ['You gave a talk so stirring that even the quiet one at the back put a hand up.', 'Öyle coşkulu bir konuşma yaptın ki arkadaki sessiz çocuk bile parmak kaldırdı.'],
  ['You spotted who was having a bad week before they said a word. You were right, and you were gentle.', 'Kimin kötü bir hafta geçirdiğini o daha tek kelime etmeden fark ettin. Haklıydın ve nazik davrandın.'],
  ['You stayed late to redo a plan that was not working. The next day it worked so well nobody knew it had ever been broken.', 'İşlemeyen bir planı baştan yapmak için geç saate kaldın. Ertesi gün öyle iyi işledi ki bozuk olduğunu kimse anlamadı.'],
  ['Thirty young people asked you a hundred questions today. You answered ninety and bluffed ten with confidence.', 'Bugün otuz genç sana yüz soru sordu. Doksanını cevapladın, onunu da kendinden emin bir şekilde geçiştirdin.'],
  ['You learned the new slang so you could understand your group. You used it once. The silence was total.', 'Grubunu anlayabilmek için yeni argoyu öğrendin. Bir kez kullandın. Çıt çıkmadı.'],
  ['You kept your temper through a whole week of chaos. On Friday someone said thank you, and it was enough.', 'Koca bir kaos haftası boyunca sabrını korudun. Cuma günü biri teşekkür etti; yetti de arttı bile.'],
  ['The quietest one finally did something brilliant, and you made sure everyone saw it.', 'En sessizleri sonunda harika bir şey yaptı; sen de herkesin görmesini sağladın.'],
];

const STUDIO: Pair[] = [
  ['You practised until your body did it without asking you. That is the whole secret, and it is not a secret.', 'Vücudun sana sormadan yapana kadar çalıştın. Bütün sır bu ve sır değil.'],
  ['You skipped a party to work. You could hear it from your window. You worked anyway.', 'Çalışmak için bir partiyi ektin. Pencereden sesi geliyordu. Yine de çalıştın.'],
  ['You looked back over your own work and found ten things to fix. You fixed four. Progress.', 'Kendi işine dönüp baktın ve düzeltilecek on şey buldun. Dördünü düzelttin. İlerleme.'],
  ['You did the boring part properly: the warm-up, the prep, the cleaning up. Nobody claps for that part. It is the part that counts.', 'Sıkıcı kısmı da hakkıyla yaptın: ısınma, hazırlık, toparlanma. Kimse o kısmı alkışlamaz. Asıl önemli olan o kısımdır.'],
  ['You started at dawn and stopped when the light went, then carried on out of stubbornness.', 'Şafakta başladın, ışık gidince durdun, sonra inadından devam ettin.'],
  ['A kid said they want to do what you do when they grow up. You said "practise", and then, more quietly, "a lot".', 'Bir çocuk büyüyünce senin işini yapmak istediğini söyledi. "Çok çalış" dedin, sonra daha alçak sesle "ama çok".'],
  ['You had a terrible day, then a slightly less terrible one, then a good one. That is the rhythm of it.', 'Berbat bir gün geçirdin, sonra biraz daha az berbat bir gün, sonra iyi bir gün. İşin ritmi bu.'],
  ['You went back to basics for a week, the very first things you ever learned. Everything else got better.', 'Bir hafta boyunca en başa, ilk öğrendiğin şeylere döndün. Geri kalan her şey düzeldi.'],
  ['Someone you admire saw your work and said one word: "more". You have been working ever since.', 'Hayran olduğun biri yaptığın işi görüp tek kelime söyledi: "Daha." O günden beri çalışıyorsun.'],
  ['You ate, slept and worked, in that order, for a month. Your friends sent a search party.', 'Bir ay boyunca yedin, uyudun ve çalıştın; bu sırayla. Arkadaşların arama ekibi gönderdi.'],
  ['You finally did the thing you had been avoiding for a year. It took an afternoon.', 'Bir yıldır kaçtığın şeyi sonunda yaptın. Bir öğleden sonra sürdü.'],
];

const OWNER: Pair[] = [
  ['You opened up before anyone and locked up after everyone. The keys are heavier than they look.', 'Herkesten önce açıp herkesten sonra kapattın. Anahtarlar göründüğünden ağır.'],
  ['You paid everyone else first, again. Your own pay is "next month", as it has been for a while.', 'Yine önce herkesin parasını ödedin. Senin maaşın bir süredir olduğu gibi "gelecek ay".'],
  ['You did the books at the kitchen table until midnight. The numbers balanced on the third try.', 'Gece yarısına kadar mutfak masasında hesapları yaptın. Rakamlar üçüncü denemede tuttu.'],
  ['Someone was ill, so you covered the shift yourself. The owner is also the spare pair of hands.', 'Biri hastalandı diye vardiyayı kendin karşıladın. Patron dediğin aynı zamanda yedek eldir.'],
  ['A supplier tried to raise prices. You talked them back down over two glasses of tea.', 'Bir tedarikçi fiyat artırmaya kalktı. İki bardak çayın üstünden eski fiyata razı ettin.'],
  ['You took no day off all month. You are the boss, and the boss is very strict with you.', 'Bütün ay tek gün izin yapmadın. Patron sensin ve patron sana karşı çok katı.'],
  ['You hired someone young and good. Watching them work, you remembered yourself, minus the mistakes.', 'Genç ve işini bilen birini işe aldın. Onu izlerken kendini hatırladın; hataların hariç.'],
  ['You fixed the sign out front yourself. It is slightly crooked and entirely yours.', 'Kapıdaki tabelayı kendin tamir ettin. Biraz eğri ama tamamen senin.'],
  ['A customer said "my father used to come here too". You stood a little straighter all day.', 'Bir müşteri "Babam da buraya gelirdi" dedi. Bütün gün biraz daha dik durdun.'],
  ['You worked through a holiday, because the business does not know what a holiday is.', 'Bayramda bile çalıştın; işin bayram nedir bilmiyor.'],
  ['You lay awake doing sums about rent and wages, then got up and opened on time anyway.', 'Gece yatakta kira ve maaş hesabı yaptın, sonra kalkıp yine de vaktinde açtın.'],
];

/** A few lines written for the exact job, added to the kind's pool. */
const JOB: Record<string, Pair[]> = {
  miner: [
    ['You went down before dawn and came up after dark. You saw the sun on Sunday and it was a big occasion.', 'Şafaktan önce indin, karanlık bastıktan sonra çıktın. Güneşi pazar günü gördün; büyük bir olaydı.'],
    ['Your lamp flickered at the bottom of the shaft. The man next to you held his up without a word. That is the job.', 'Kuyunun dibinde kafa lamban titredi. Yanındaki adam tek kelime etmeden kendi lambasını tuttu. İş dediğin bu.'],
    ['You washed for half an hour and still left a grey ring in the bath. The family calls it your signature.', 'Yarım saat yıkandın, yine de küvette gri bir halka bıraktın. Ailen buna imzan diyor.'],
    ['The shift ended, the cage came up and everyone counted heads without saying so. All there. Tea, then home.', 'Vardiya bitti, kafes yukarı çıktı ve herkes belli etmeden kafa saydı. Hepsi tamam. Önce çay, sonra ev.'],
    ['You coughed coal dust all week and joked about it all week. The joking is part of the safety gear.', 'Bütün hafta kömür tozu öksürdün, bütün hafta da şakasını yaptın. Şaka da güvenlik teçhizatına dahil.'],
  ],
  electrician: [
    ['You rewired an old flat where every wire was the same colour. You will tell this story at your retirement party.', 'Bütün kabloları aynı renk olan eski bir daireyi baştan döşedin. Bu hikâyeyi emeklilik partinde anlatacaksın.'],
    ['You got a small shock and a large lesson. You now test everything twice, including the kettle at home.', 'Küçük bir elektrik çarptı, büyük bir ders aldın. Artık her şeyi iki kez test ediyorsun; evdeki su ısıtıcısı dahil.'],
    ['You crawled through a loft in summer heat for three hours. You came down a different, wiser, wetter person.', 'Yaz sıcağında üç saat bir çatı arasında süründün. Aşağı başka, daha bilge ve daha terli biri olarak indin.'],
    ['A customer asked if it was "just a fuse". It was not just a fuse. It is never just a fuse.', 'Bir müşteri "Sadece sigorta mı?" diye sordu. Sadece sigorta değildi. Hiçbir zaman sadece sigorta değildir.'],
    ['You worked in the rain all week and did not complain once. Out loud.', 'Bütün hafta yağmurda çalıştın ve bir kez bile şikâyet etmedin. Sesli olarak.'],
  ],
  mechanic: [
    ['You heard a rattle from across the garage and named the part before the owner finished describing it.', 'Atölyenin öbür ucundan bir tıkırtı duydun ve sahibi anlatmayı bitirmeden parçanın adını söyledin.'],
    ['Your hands are black to the wrist. The special soap only reaches the knuckles.', 'Ellerin bileklerine kadar kapkara. Özel sabun ancak boğumlara kadar yetişiyor.'],
    ['You lay under a car for so long that the cat from next door fell asleep on your legs.', 'Bir arabanın altında o kadar uzun yattın ki yan dükkânın kedisi bacaklarının üstünde uyuyakaldı.'],
    ['A customer said "it only makes the noise when you are not here". You took it for a drive. It made the noise. Justice.', 'Bir müşteri "Siz yokken ses yapıyor" dedi. Arabayı bir tur attırdın. Ses yaptı. Adalet yerini buldu.'],
    ['You found a missing spanner inside an engine. You are not saying whose engine. You are not saying whose spanner.', 'Kayıp bir anahtarı bir motorun içinde buldun. Kimin motoru olduğunu söylemiyorsun. Kimin anahtarı olduğunu da.'],
  ],
  farmer: [
    ['You were up before the rooster all month. The rooster is starting to feel unnecessary.', 'Bütün ay horozdan önce kalktın. Horoz kendini gereksiz hissetmeye başladı.'],
    ['You worked in the rain all week and did not complain once. Out loud.', 'Bütün hafta yağmurda çalıştın ve bir kez bile şikâyet etmedin. Sesli olarak.'],
    ['You finished the field an hour before the storm and watched it come in from the porch, very satisfied.', 'Fırtınadan bir saat önce tarlayı bitirdin ve gelişini sundurmadan büyük bir memnuniyetle izledin.'],
    ['You talked to the tractor all day to keep it going. It worked. Do not tell anyone.', 'Çalışmaya devam etsin diye bütün gün traktörle konuştun. İşe yaradı. Kimseye söyleme.'],
    ['You checked the sky forty times a day. The sky did what it wanted, as usual.', 'Günde kırk kez gökyüzüne baktın. Gökyüzü her zamanki gibi bildiğini okudu.'],
    ['You had soil under your nails at a wedding. Nobody minded. The bride\'s grandfather shook your hand twice.', 'Bir düğüne tırnaklarının arasında toprakla gittin. Kimse aldırmadı. Gelinin dedesi elini iki kez sıktı.'],
  ],
  fisher: [
    ['You were out before light and back after dark, smelling of the sea in a way soap cannot reach.', 'Ortalık ağarmadan açıldın, karanlıkta döndün; sabunun ulaşamayacağı bir deniz kokusuyla.'],
    ['You mended nets on the quay all afternoon. The gulls supervised.', 'Bütün öğleden sonra rıhtımda ağ ördün. Martılar denetledi.'],
    ['A rough sea, a full hold and nobody sick. You count that as a fine day.', 'Dalgalı bir deniz, dolu bir ambar ve kimse kusmadı. Sen buna güzel bir gün diyorsun.'],
    ['You worked in the rain all week and did not complain once. Out loud.', 'Bütün hafta yağmurda çalıştın ve bir kez bile şikâyet etmedin. Sesli olarak.'],
    ['You read the weather from the clouds and turned back early. Two hours later the others came in soaked and impressed.', 'Bulutlardan havayı okuyup erken döndün. İki saat sonra ötekiler sırılsıklam ve hayran bir hâlde geldi.'],
  ],
  barista: [
    ['You made three hundred coffees today and drank four. The fifth one you only looked at.', 'Bugün üç yüz kahve yaptın, dördünü içtin. Beşinciye sadece baktın.'],
    ['You drew a perfect leaf in the milk foam. The customer stirred it straight away. You let it go, like a monk.', 'Süt köpüğüne kusursuz bir yaprak çizdin. Müşteri hemen karıştırdı. Bir keşiş gibi bıraktın gitsin.'],
    ['You remembered a regular\'s order, name and dog\'s birthday. They tipped like a relative.', 'Bir müdavimin siparişini, adını ve köpeğinin doğum gününü hatırladın. Akraba gibi bahşiş bıraktı.'],
    ['You stood for so long this week that sitting down felt like a holiday abroad.', 'Bu hafta o kadar ayakta kaldın ki oturmak yurt dışı tatili gibi geldi.'],
  ],
  retail: [
    ['You folded the same pile of jumpers four times. It was knocked over four times. You are at peace now.', 'Aynı kazak yığınını dört kez katladın. Dört kez devrildi. Artık huzurlusun.'],
    ['You found the exact size in the stockroom for a customer who had given up. They looked at you like you had found treasure.', 'Umudunu kesmiş bir müşteri için depoda tam bedeni buldun. Sana define bulmuşsun gibi baktı.'],
    ['You stood for so long this week that sitting down felt like a holiday abroad.', 'Bu hafta o kadar ayakta kaldın ki oturmak yurt dışı tatili gibi geldi.'],
    ['The sale started at nine. By ten you had seen things no one should see in a shoe department.', 'İndirim dokuzda başladı. Saat ona kadar bir ayakkabı reyonunda kimsenin görmemesi gereken şeyler gördün.'],
  ],
  taxi: [
    ['You drove twelve hours and heard nine life stories. Three were true.', 'On iki saat direksiyon salladın ve dokuz hayat hikâyesi dinledin. Üçü gerçekti.'],
    ['You know every shortcut in the city and three that should not exist.', 'Şehrin bütün kestirmelerini biliyorsun; bir de var olmaması gereken üç tanesini.'],
    ['A passenger slept the whole way home. You drove extra gently, like a parent.', 'Bir yolcu bütün yol uyudu. Bir anne baba gibi ekstra yumuşak sürdün.'],
    ['You drove the night shift all month. The city at four in the morning belongs to you, the bakers and the cats.', 'Bütün ay gece vardiyasında çalıştın. Sabahın dördünde şehir sana, fırıncılara ve kedilere ait.'],
  ],
  chef: [
    ['You worked a double in a kitchen hotter than the sun. You have no eyebrows to speak of, but the sauce was perfect.', 'Güneşten sıcak bir mutfakta çift vardiya çalıştın. Kaşın kalmadı sayılır ama sos kusursuzdu.'],
    ['You tasted the soup forty times today. You have not eaten a meal, but you have eaten.', 'Bugün çorbanın tadına kırk kez baktın. Yemek yemedin ama bir şekilde doydun.'],
    ['Service ended at midnight. You ate cold rice standing over the sink, the traditional dinner of cooks.', 'Servis gece yarısı bitti. Lavabonun başında ayakta soğuk pilav yedin; aşçıların geleneksel akşam yemeği.'],
    ['A plate came back to the kitchen completely clean, wiped with bread. The whole line cheered.', 'Bir tabak mutfağa ekmekle silinmiş, tertemiz döndü. Bütün mutfak tezahürat yaptı.'],
    ['You burned your forearm on the oven door and did not stop plating. The scar has joined the others.', 'Kolunu fırın kapağında yaktın ve tabak hazırlamayı bırakmadın. Yara izi diğerlerine katıldı.'],
  ],
  cabin_crew: [
    ['You pushed the trolley up and down the aisle so many times that you dream in rows of seats.', 'Servis arabasını koridorda o kadar çok itip çektin ki artık rüyalarında koltuk sıraları görüyorsun.'],
    ['You did the safety demonstration with such conviction that one passenger actually read the card.', 'Güvenlik gösterisini öyle inandırıcı yaptın ki bir yolcu gerçekten kartı okudu.'],
  ],
  pilot: [
    ['You landed in a crosswind so smoothly that the passengers did not clap. That is the highest praise.', 'Yan rüzgârda öyle yumuşak indin ki yolcular alkışlamadı. En büyük övgü budur.'],
    ['You spent a week in the simulator having engines fail on purpose. You came out calmer than you went in.', 'Bir hafta boyunca simülatörde bilerek arızalanan motorlarla uğraştın. Girdiğinden daha sakin çıktın.'],
  ],
  nurse: [
    ['You did three night shifts in a row and now say "good morning" at all hours.', 'Üst üste üç gece nöbeti tuttun; artık günün her saatinde "günaydın" diyorsun.'],
    ['You found a vein on the first try that two doctors had missed. You did not say anything. Your face did.', 'İki doktorun bulamadığı damarı ilk denemede buldun. Hiçbir şey demedin. Yüzün dedi.'],
    ['An old patient asked you to stay five more minutes. You stayed ten.', 'Yaşlı bir hasta beş dakika daha kalmanı istedi. On dakika kaldın.'],
  ],
  doctor: [
    ['You were on call all weekend and slept in fifteen-minute pieces. You can now nap standing up, like a horse.', 'Bütün hafta sonu nöbetçiydin ve on beşer dakikalık parçalar hâlinde uyudun. Artık at gibi ayakta kestirebiliyorsun.'],
    ['You told a family good news today. You will keep their faces for a long time.', 'Bugün bir aileye iyi bir haber verdin. Yüzlerini uzun süre aklında tutacaksın.'],
    ['Someone at a dinner asked you to "just have a quick look" at their knee. You had a quick look. It was fine.', 'Bir yemekte biri "Şu dizime bir bakıver" dedi. Baktın. Bir şeyi yoktu.'],
  ],
  vet: [
    ['A dog who hates vets licked your hand on the way out. You consider it a professional award.', 'Veterinerlerden nefret eden bir köpek çıkarken elini yaladı. Bunu mesleki bir ödül sayıyorsun.'],
    ['You were scratched by a cat, kicked by a goat and loved by a rabbit, all before lunch.', 'Öğle yemeğinden önce bir kedi tırmaladı, bir keçi tekme attı ve bir tavşan seni çok sevdi.'],
    ['A child brought in a hamster wrapped in a scarf and asked you to be careful. You were very careful.', 'Bir çocuk atkıya sarılı bir hamster getirdi ve dikkatli olmanı rica etti. Çok dikkatli oldun.'],
  ],
  dentist: [
    ['You told forty people to floss this week. You estimate four will.', 'Bu hafta kırk kişiye diş ipi kullanmasını söyledin. Dördünün kullanacağını tahmin ediyorsun.'],
    ['A patient who has been afraid of dentists for twenty years sat in your chair and did not cry. You both felt brave.', 'Yirmi yıldır dişçiden korkan bir hasta koltuğuna oturdu ve ağlamadı. İkiniz de kendinizi cesur hissettiniz.'],
    ['You held a conversation with someone whose mouth was full of cotton. You understood every word.', 'Ağzı pamukla dolu biriyle sohbet ettin. Her kelimesini anladın.'],
  ],
  police: [
    ['You walked the beat in the rain until the shopkeepers started bringing you tea without asking.', 'Yağmurda devriye attın; esnaf sormadan çay getirmeye başlayana kadar.'],
    ['You spent a whole shift looking for a lost grandfather and found him at the bakery, telling stories. Best result of the year.', 'Bütün bir vardiyayı kayıp bir dedeyi aramakla geçirdin; onu fırında hikâye anlatırken buldun. Yılın en güzel sonucu.'],
    ['You filled in reports until your handwriting changed shape.', 'El yazının şekli değişene kadar tutanak doldurdun.'],
  ],
  firefighter: [
    ['You trained with full kit on in the summer heat. You sweated out a person-sized amount of water.', 'Yaz sıcağında tam teçhizatla eğitim yaptın. Bir insan boyunda su terledin.'],
    ['The alarm went off during dinner, again. The station has never once finished a meal together.', 'Alarm yine yemeğin ortasında çaldı. İstasyon şimdiye kadar bir kez bile yemeği birlikte bitiremedi.'],
    ['You got a cat down from a tree. The cat showed no gratitude. The owner baked you a cake.', 'Ağaçtaki bir kediyi indirdin. Kedi hiç minnet göstermedi. Sahibi sana kek yaptı.'],
  ],
  soldier: [
    ['You stood watch through a freezing night and counted the stars to stay awake. There are more than you think.', 'Dondurucu bir gecede nöbet tuttun ve uyanık kalmak için yıldızları saydın. Sandığından fazla.'],
    ['You made your bed so tightly that the inspection bounced a coin on it and nodded.', 'Yatağını öyle gergin yaptın ki teftişte üstünde bozuk para zıplattılar ve başlarıyla onayladılar.'],
    ['A long march in the rain, then hot soup from a big pot. You have never tasted better soup.', 'Yağmurda uzun bir yürüyüş, sonra kocaman bir kazandan sıcak çorba. Bundan güzel çorba içmedin.'],
  ],
  officer: [
    ['You planned an exercise down to the minute. It went wrong in a new and interesting way. You adapted.', 'Bir tatbikatı dakikası dakikasına planladın. Yeni ve ilginç bir şekilde ters gitti. Uyum sağladın.'],
    ['You read every report put in front of you, footnotes included. The footnotes were where the truth was.', 'Önüne konan bütün raporları dipnotlarına kadar okudun. Gerçek dipnotlardaydı.'],
  ],
  teacher: [
    ['You marked eighty papers in one weekend. Your red pen ran out before your patience did. Just.', 'Bir hafta sonunda seksen kâğıt okudun. Kırmızı kalemin sabrından önce bitti. Kıl payı.'],
    ['You found a note under your door from a pupil: "Your lesson was the least boring." You framed it.', 'Kapının altında bir öğrencinden not buldun: "En az sıkıcı ders sizinkiydi." Çerçeveletip astın.'],
    ['You were on duty in the playground at break and broke up three football disputes and one marriage proposal.', 'Teneffüste bahçe nöbetçisiydin; üç futbol kavgası ve bir evlenme teklifi ayırdın.'],
    ['A pupil who could not read in September read a whole page out loud in May. You went home and told everyone.', 'Eylülde okuyamayan bir öğrenci mayısta koca bir sayfayı yüksek sesle okudu. Eve gidip herkese anlattın.'],
    ['Parents\' evening ran until nine. You said "lovely to meet you" forty times and meant it thirty-one.', 'Veli toplantısı akşam dokuza kadar sürdü. Kırk kez "Tanıştığımıza memnun oldum" dedin; otuz birinde ciddiydin.'],
  ],
  coach: [
    ['You ran drills in the rain until the whole squad could do them in their sleep. Some of them now do.', 'Bütün takım uykusunda yapabilene kadar yağmurda antrenman yaptırdın. Bazıları artık gerçekten uykusunda yapıyor.'],
    ['You watched the last match back four times and found the one moment it turned. The team groaned. Then nodded.', 'Son maçı dört kez izledin ve maçın koptuğu anı buldun. Takım inledi. Sonra başını salladı.'],
  ],
  artist: [
    ['You painted until the light went, then by lamplight, then by stubbornness.', 'Işık gidene kadar boyadın, sonra lamba ışığında, sonra da inadına.'],
    ['You scraped a whole canvas back to white and started again. It was the right decision. It felt terrible.', 'Koca bir tuvali kazıyıp bembeyaz yaptın ve baştan başladın. Doğru karardı. Berbat hissettirdi.'],
    ['You found paint in your hair at a family dinner. Blue, this time. Everyone at the table said it suits you.', 'Bir aile yemeğinde saçında boya buldun. Bu sefer mavi. Masadaki herkes yakıştığını söyledi.'],
  ],
  athlete: [
    ['You trained twice a day all month. Stairs have become your enemy and your friend.', 'Bütün ay günde iki antrenman yaptın. Merdivenler hem düşmanın hem dostun oldu.'],
    ['You stayed after training to practise one move a hundred times. On Saturday you needed it once. It worked.', 'Antrenmandan sonra kalıp tek bir hareketi yüz kez çalıştın. Cumartesi bir kere lazım oldu. İşe yaradı.'],
    ['The physio said your legs are "unusually stubborn". You took it as a compliment.', 'Fizyoterapist bacaklarının "alışılmadık derecede inatçı" olduğunu söyledi. İltifat olarak aldın.'],
  ],
  lawyer: [
    ['You read a two-hundred-page contract and found the one sentence that mattered. It was on page 187.', 'İki yüz sayfalık bir sözleşmeyi okudun ve önemli olan tek cümleyi buldun. Yüz seksen yedinci sayfadaydı.'],
    ['You prepared for a hearing until three in the morning. The other side settled at nine. Victory tastes like tiredness.', 'Bir duruşmaya gece üçe kadar hazırlandın. Karşı taraf sabah dokuzda uzlaştı. Zaferin tadı yorgunluk gibi.'],
  ],
  accountant: [
    ['The numbers were off by one coin. You found it at eleven at night and shouted, alone, in triumph.', 'Rakamlar bir kuruş tutmuyordu. Gece on birde buldun ve tek başına zafer çığlığı attın.'],
    ['It was the end of the tax year. You have not seen daylight or your family in a while, but the books are beautiful.', 'Vergi dönemi sonuydu. Bir süredir ne gün ışığı gördün ne aileni, ama defterler pırıl pırıl.'],
  ],
  engineer: [
    ['You fixed a bug at two in the morning by deleting one line. You do not know why it worked. You are not asking.', 'Gece ikide tek bir satırı silerek bir hatayı düzelttin. Neden işe yaradığını bilmiyorsun. Sormuyorsun da.'],
    ['You drew a diagram on the whiteboard so good that nobody has dared to rub it out for a month.', 'Beyaz tahtaya öyle güzel bir şema çizdin ki bir aydır kimse silmeye cesaret edemiyor.'],
  ],
  designer: [
    ['You moved a button two pixels to the left and the whole thing finally looked right. Nobody else can see it.', 'Bir düğmeyi iki piksel sola kaydırdın ve her şey sonunda doğru görünmeye başladı. Başka kimse farkı göremiyor.'],
    ['You made thirty versions. The client chose the first one. You have made your peace with it.', 'Otuz farklı versiyon hazırladın. Müşteri ilkini seçti. Bununla barıştın.'],
  ],
  journalist: [
    ['You chased a source for a week and got the quote at a bus stop in the rain. It made the front page.', 'Bir kaynağın peşinden bir hafta koştun ve alıntıyı yağmurda bir otobüs durağında aldın. Manşet oldu.'],
    ['You filed a story five minutes before the deadline and then could not stop shaking your leg for an hour.', 'Haberi teslim saatinden beş dakika önce gönderdin, sonra bir saat boyunca bacağını sallamayı bırakamadın.'],
  ],
  architect: [
    ['You redrew a staircase eleven times. Climbing the real one one day will feel like a reunion.', 'Bir merdiveni on bir kez yeniden çizdin. Bir gün gerçeğini çıkarken eski bir dostla buluşmuş gibi olacaksın.'],
    ['You built a model out of card and glue until midnight. You have glue on your eyelid. The model is lovely.', 'Gece yarısına kadar karton ve yapıştırıcıyla maket yaptın. Göz kapağında yapıştırıcı var. Maket çok güzel.'],
  ],
  realtor: [
    ['You showed the same flat eleven times. You now describe its "morning light" in your sleep.', 'Aynı daireyi on bir kez gösterdin. Artık uykunda bile "sabah güneşini" anlatıyorsun.'],
    ['You found a family the exact house they wanted. The child ran straight to a bedroom and claimed it. Your best sale yet.', 'Bir aileye tam istedikleri evi buldun. Çocuk doğruca bir yatak odasına koşup sahiplendi. Şimdiye kadarki en güzel satışın.'],
  ],
  academic: [
    ['You marked essays until the arguments started to blur into one long, confident paragraph.', 'Ödevleri, iddialar tek bir uzun ve kendinden emin paragrafa dönüşene kadar okudun.'],
    ['You rewrote a paper for the reviewers. Reviewer two will never be satisfied. Reviewer two is a state of mind.', 'Hakemler için bir makaleyi baştan yazdın. İkinci hakem asla memnun olmayacak. İkinci hakem bir ruh hâli.'],
  ],
  research: [
    ['An experiment failed for the ninth time. On the tenth it worked, at seven on a Friday evening, with nobody there to see.', 'Bir deney dokuzuncu kez başarısız oldu. Onuncuda işe yaradı; cuma akşamı saat yedide, görecek kimse yokken.'],
    ['You stared at the same graph for an hour and then saw it. You went for a walk to calm down.', 'Bir saat aynı grafiğe baktın, sonra gördün. Sakinleşmek için yürüyüşe çıktın.'],
  ],
};

const KIND_POOL: Record<Exclude<WorkKind, 'none'>, Pair[]> = {
  office: OFFICE,
  trade: [...TRADE, ...COMMON],
  service: [...SERVICE, ...COMMON],
  health: [...HEALTH, ...COMMON],
  uniform: [...UNIFORM, ...COMMON],
  school: [...SCHOOL, ...COMMON],
  studio: STUDIO,
};

/** Crew jobs read their own pool (pilots and cabin crew are 'studio' and 'service' kinds for events). */
const CREW_JOBS = new Set(['pilot', 'cabin_crew']);

/** An after-school job held by a pupil or a young student: the part-time pool fits better than the kind's. */
const partTimer = (c: Ctx) => PART_TIME_JOBS.has(c.p.jobId ?? '') && (isPupil(c) || c.p.school === 'university' || c.age < 23);

/** The "work extra hard" pool for the player's job: kind pool (or the owner's) plus the job's own lines. */
export function workPool(c: Ctx): Pair[] {
  const id = c.p.jobId ?? '';
  const extra = JOB[id] ?? JOB_R4[id] ?? [];
  if (ownsWork(c)) return [...OWNER, ...extra];
  if (CREW_JOBS.has(id)) return [...CREW, ...COMMON, ...extra];
  if (COMMUNITY_JOBS.has(id)) return [...COMMUNITY, ...extra];
  if (partTimer(c)) return [...PART_TIME, ...extra];
  const kind = workKind(c);
  return [...(kind === 'none' ? COMMON : KIND_POOL[kind]), ...extra];
}

/** Line-memory key for workPool (one per pool shape). */
export function workKey(c: Ctx): string {
  const id = c.p.jobId ?? 'none';
  if (ownsWork(c)) return `work_hard.owner.${id}`;
  if (COMMUNITY_JOBS.has(id)) return `work_hard.community.${id}`;
  if (partTimer(c)) return `work_hard.parttime.${id}`;
  return `work_hard.${CREW_JOBS.has(id) ? 'crew' : workKind(c)}.${id}`;
}

// ------------------------------------------------ job events by kind of work

/** base.burnout: what overwork looks like in this job. */
export const BURNOUT: Record<WorkKind, Pair> = {
  office: ['You fell asleep in a meeting. Twice.', 'Toplantıda uyuyakaldın. İki kere.'],
  trade: ['You fell asleep on your lunch break sitting on an upturned bucket. Twice.', 'Öğle arasında ters çevrilmiş bir kovanın üstünde uyuyakaldın. İki kere.'],
  service: ['You fell asleep standing up behind the counter. A customer woke you, kindly.', 'Tezgâhın arkasında ayakta uyuyakaldın. Bir müşteri nazikçe uyandırdı.'],
  health: ['You fell asleep in the staff room in the middle of a sentence. Your own sentence.', 'Personel odasında bir cümlenin ortasında uyuyakaldın. Kendi cümlenin.'],
  uniform: ['You nodded off in the vehicle between calls. Your partner let you sleep and kept watch.', 'İki çağrı arasında araçta uyuyakaldın. Ekip arkadaşın seni uyutup nöbeti devraldı.'],
  school: ['You fell asleep at your desk over a pile of marking. The red pen left a line across your cheek.', 'Bir yığın kâğıdın başında masada uyuyakaldın. Kırmızı kalem yanağında bir çizgi bıraktı.'],
  studio: ['You fell asleep in your work clothes, mid-thought, with the lights on.', 'İş kıyafetlerinle, bir düşüncenin ortasında, ışıklar açıkken uyuyakaldın.'],
  none: ['You have not taken a day off since you opened. You fell asleep doing the accounts. Twice.', 'İşi açtığından beri tek gün izin yapmadın. Hesapları yaparken uyuyakaldın. İki kere.'],
};

/** base.layoffs: [the job is gone, the place it went from], and the survivor's line. */
export const LAYOFF: Partial<Record<WorkKind, { lost: (t: string) => Pair; kept: Pair }>> = {
  office: {
    lost: (t) => [`Your company announced layoffs. You lost your job as ${t}.`, `Şirketin işten çıkarma açıkladı. ${t} koltuğun da gitti.`],
    kept: ['Your company announced layoffs. You survived, but your desk neighbor did not.', 'Şirketin işten çıkarma açıkladı. Sen kurtuldun ama yan masadaki kurtulamadı.'],
  },
  trade: {
    lost: (t) => [`The work dried up and the crew was cut. You lost your job as ${t}.`, `İşler azaldı ve ekip küçüldü. ${t} olarak çalıştığın işten çıkarıldın.`],
    kept: ['The work dried up and the crew was cut. You kept your place; the man you shared your tea with did not.', 'İşler azaldı ve ekip küçüldü. Sen kaldın; çayını paylaştığın adam kalamadı.'],
  },
  service: {
    lost: (t) => [`The place is cutting staff. You lost your job as ${t}.`, `İşyeri eleman azaltıyor. ${t} olarak çalıştığın işten çıkarıldın.`],
    kept: ['The place is cutting staff. You kept your shifts; the one who always covered yours did not.', 'İşyeri eleman azaltıyor. Sen vardiyalarını korudun; hep seninkini devralan arkadaşın gitti.'],
  },
  health: {
    lost: (t) => [`The clinic is cutting posts. You lost your job as ${t}.`, `Kurum kadro azaltıyor. ${t} olarak çalıştığın işten çıkarıldın.`],
    kept: ['The clinic is cutting posts. You kept yours, and now you cover two.', 'Kurum kadro azaltıyor. Sen kaldın; artık iki kişinin işini yapıyorsun.'],
  },
};
