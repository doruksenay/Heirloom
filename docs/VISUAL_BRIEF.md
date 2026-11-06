# Heirloom: görsel brief (milestone sahneleri ve yardımcı varlıklar)

Bu doküman bir çizer / AI-destekli illüstrasyon süreci için hazırlandı. Amaç: oyunun yazı ağırlıklı akışını, hayatın **üç anında** görselle desteklemek: ilk ekran, kilometre taşları, hayatın sonu. Her olaya ayrı görsel **istenmiyor**: tek sahne birçok olayı kapsar.

## 1. Stil rehberi

| Konu | Karar |
|---|---|
| Biçim | Düz (flat) vektör, kalın dış çizgi yok, hafif doku/grain serbest. SVG'ye çevrilebilir olmalı (tema ve skin sistemi renk değiştirir). |
| Palet ("Heirloom Dusk") | Gece `#1B1446`, derin `#0C0B26`, mercan `#FF6B8B`, kehribar `#FFB347`, turkuaz `#00E5D1`, krem `#FFF4EC`. Her sahnede en fazla 5 renk + tonları. |
| Işık | Her sahnede tek sıcak ışık kaynağı (lamba, pencere, gün batımı). Hanedan hissi: sıcak ışık = aile. |
| Karakterler | Yüzsüz/az detaylı siluet-vari figürler; cilt tonları mevcut avatar paletiyle aynı (`#F3CDB0 … #5E3B27`). Belirli bir ülkeye/kültüre bağlı kıyafet yok (genel, çağdaş-zamansız). |
| Yasak | Gerçek marka, logo, ünlü kişi, kopyalanmış sahne/karakter. Her sahne özgün olmalı. |
| Boyut | Ana kart: 1080×720 (3:2), ayrıca 540×360 küçük sürüm. Ev/eşya ikonları 512×512. Başlık görselleri 1080×360. |
| Teslim | SVG (tercih) + 2x PNG. Dosya adı: `scene_<id>.svg`. Katmanlı kaynak (Figma/Illustrator) da teslim edilir. |
| Erişilebilirlik | Her görsel için 1 cümle alt metin (EN + TR); metin görselin içine **gömülmez**. |

## 2. Sahne listesi (40 kilometre taşı)

Her satır bir sahne; "Kapsadığı olaylar" bu sahnenin hangi oyun olaylarında gösterileceğini söyler (eşleştirme sonradan koda eklenecek).

### Çocukluk ve gençlik (10)
| # | Sahne id | Sahne | Kapsadığı olaylar |
|---|---|---|---|
| 1 | birth | Bir pencerenin önünde, ışıkta bebek kundağı, iki el | doğum, baby_name |
| 2 | grandma_stories | Bir büyükannenin dizinde eski bir eşya, çocuk dinliyor | heirloom_story, yc_grandparent_stories, ch_grandma_spoils |
| 3 | first_day_school | Sırt çantalı çocuk, büyük okul kapısı | okul başlangıcı, ch_homework |
| 4 | birthday_child | Mumlu pasta, balonlar, küçük masa | ch_birthday, yc_birthday_money |
| 5 | treehouse | Ağaç ev, iki çocuk, gün batımı | yc_treehouse, yc_car_trip |
| 6 | broken_heirloom | Yerde kırık bir eşya, korkmuş çocuk | ch_broken_heirloom |
| 7 | pet_funeral | Bahçede küçük bir mezar, çocuk ve kutu | pet_fish_funeral, pet_turtle_will |
| 8 | first_date | İki figür, sinema/kafe neonu | first_date_teen, prom |
| 9 | road_trip | Eski bir araba, açık yol, iki-üç genç | road_trip, ys_overnight_trip |
| 10 | summer_job | Dondurma/bahçe/garson önlüğü, genç | summer_job, job_parttime_* |

### Genç yetişkinlik ve iş (8)
| # | Sahne id | Sahne | Kapsadığı olaylar |
|---|---|---|---|
| 11 | graduation | Kep havada, kalabalık, aile alkışlıyor | mezuniyet olayları, ya_teacher_retires |
| 12 | first_apartment | Karton kutular, tek koltuk, pencere | move_back_home, ya_first_day, housewarming |
| 13 | job_rejections | Masa başında mektup yığını, çay | job_rejections, job_search |
| 14 | first_job | Ofis/atölye kapısı, yeni kimlik kartı | job_board, ilk iş |
| 15 | promotion | Masada kutlama, iş arkadaşları | terfi olayları |
| 16 | layoff | Karton kutuda masa eşyaları | hr_layoff, fired |
| 17 | night_shift | Gece, hastane/fabrika ışıkları, yorgun figür | job_nurse_night, job_midwife_night, job_trucker_night |
| 18 | student_loan | Evrak, hesap makinesi, endişe | us.student_loans, ad_kid_house_loan |

### Aşk ve aile (10)
| # | Sahne id | Sahne | Kapsadığı olaylar |
|---|---|---|---|
| 19 | proposal | Bir yüzük, şehir ışıkları, iki figür | proposal |
| 20 | wedding | Çiçek kemeri, konuklar, ışık zinciri | wedding olayları, cousin_wedding, friend_wedding |
| 21 | pregnancy | Küçük patik, el karnın üstünde | gebelik olayları |
| 22 | newborn | Beşik, gece lambası, iki yorgun ebeveyn | yeni bebek olayları |
| 23 | family_dinner | Kalabalık yemek masası, ortada büyük tabak | anniversary, ad_inlaw_moves_in |
| 24 | argument | İki figür, aralarında boş sandalye | argument, ad_anniv_forgot |
| 25 | divorce | İki ayrı anahtar, masada | divorce olayları |
| 26 | kid_graduates | Çocuğun mezuniyeti, ebeveynler arkada | kid_graduates, ad_old_gk_graduation |
| 27 | empty_nest | Boş çocuk odası, açık kapı | empty_nest, child_abroad |
| 28 | inheritance | Bir mühür, eski bir anahtar, vasiyet kâğıdı | will, ad_will_surprise, ad_inherit_* |

### Orta yaş ve yaşlılık (8)
| # | Sahne id | Sahne | Kapsadığı olaylar |
|---|---|---|---|
| 29 | house_purchase | Anahtar teslimi, "satıldı" tabelası | home_listings, gb_house |
| 30 | birthday_milestone | 40/50 pastası, hafif ironik şaka balonu | ad_birthday_40/50 |
| 31 | illness | Hastane penceresi, el eli tutuyor | illness, ad_hospital_roommate |
| 32 | retirement | Çalışma masası kapanıyor, bavul/çay | retirement, gb_retire, retirement_trip |
| 33 | grandchild | Dede/nine ve torun, bahçede | grandkids_stories, elder_grandbaby |
| 34 | garden_elder | Bahçede çay, arılar | elder_garden, elder_walk |
| 35 | old_friend_funeral | Siyah giyimli küçük kalabalık, yağmur | ad_old_friend_funeral, grief_* |
| 36 | last_trip | Bir bavul, tren/plaj, iki yaşlı | ad_old_last_trip, ad_dream_trip |

### Hanedan ve hayatın sonu (4)
| # | Sahne id | Sahne | Kapsadığı olaylar |
|---|---|---|---|
| 37 | pass_the_torch | Bir elden ele geçen eşya, uzun gölge | meşale devri (HeirCard) |
| 38 | final_words | Pencere, sönmeye yakın mum, açık defter | Summary (son sözler) |
| 39 | family_portrait | Bir aile fotoğrafı çerçevesi, her kuşaktan bir silüet | Family ekranı / Aile Defteri |
| 40 | museum_card | Müze vitrini, küçük yadigâr kartı | dynasty end (Summary) |

## 3. Yardımcı varlıklar

| Varlık | Adet | Not |
|---|---|---|
| Yaşam evresi başlıkları (bebek, çocuk, genç, genç yetişkin, yetişkin, orta yaş, yaşlı, hanedan) | 8 | 1080×360 şerit |
| Miras eşyası illüstrasyonları (`src/engine/heirlooms.ts`, 16 eşya) | 16 | 512×512, eşya başına tek ışık |
| Ev kademeleri (oda, stüdyo, daire, ev, villa, çiftlik…) | 7 | 3:2 |
| Ülke kartları (12 ülke) | 12 | Şehir silueti, şehir başına değil ülke başına |
| Evcil hayvan türleri (7) | 7 | Oturan poz yeterli |
| Rozet ikonları (~50, bkz. ribbons-more) | ~50 | 128×128, tek renk + vurgu |
| Meslek kategori ikonları | ~20 | 64×64 çizgi ikon |
| Paylaşım kartı şablonu | 3–4 | Kod ile çiziliyor; çizer yalnızca arka plan motifi verebilir |

## 4. Toplam ve sıralama

- **Asgari paket (~120):** sahneler 1, 2, 3, 11, 14, 19, 20, 22, 27, 28, 32, 37, 38, 39 (14 öncelikli) + eşyalar (16) + evre başlıkları (8) + rozetler (~50) + ev (7) + ülke (12) + evcil (7).
- **Önerilen paket (~250):** 40 sahne + yukarıdaki yardımcı varlıkların tümü.
- İlk sürüm için sahne öncelik sırası: **1, 3, 11, 14, 19, 20, 22, 27, 28, 32, 37, 38, 39, 40**.

## 5. Kod tarafı (çizerin bilmesi gerekmez)

Sahne eşleştirmesi yapılınca `EventDef` içine isteğe bağlı bir `scene: '<sahne id>'` alanı eklenir; Life ekranında olay kartının üstünde sahne görseli çıkar. Görsel yoksa bugünkü yazı akışı değişmez (geriye uyumlu).
