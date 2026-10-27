# Heirloom: Life Simulator

Nesiller boyu süren bir hayat simülasyonu. Bir hayat yaşarsın, sonra çocuğunla devam edersin; ev, aile yadigârları ve seçimlerin bir sonraki nesle geçer.

Sürüm: **v0.8 (çıkış adayı, test sürümü)**. Satın almalar ve reklamlar test modunda; ödeme alınmaz.

### v0.8'de neler var
- **Günün Hayatı (Daily Challenge)** (`src/engine/daily.ts`, `src/ui/screens/Daily.tsx`):
  - Her gün dünyadaki herkes aynı kişi olarak doğar (UTC tarihten tohum). O hayat 3 kategoride puanlanır: servet, uzun ömür, kalabalık aile, hayvansever, kariyer zirvesi, sevilen; bazı günler Şöhret ya da Patron.
  - Her kategoride bronz/gümüş/altın madalya, seri sayacı ve emojili paylaşım metni.
  - Bazı günler bir ücretli paket herkese açıktır. Satın almalar ve Heirloom+ challenge'ı etkilemez.
  - Ayrı kayıtta durur; aileye dokunmaz.
  - Madalya eşikleri `npx vite-node scripts/daily-par.ts` ile yeniden hesaplanır.
- **3. bağımsız okumanın düzeltmeleri:**
  - Ofis dışı mesleklere kendi iş cümleleri (`work-lines.ts`); ofis olayları yalnızca masa başı işlerde.
  - İlişkiye özel konuşma havuzları (`people-lines.ts`); tekrar hafızası artık bütün hanedanda ortak.
  - Yadigârlar geçmişini hatırlıyor: kayıp korkusu, tamir, ritüel ve düğün metinleri önceki kuşakları anıyor.
  - Çocuk ve eş için yas olayları; yas yılında şaka satırı çıkmıyor.
  - Evlat edinme ve yeğen varis; varissiz biten aileler %14'ten %6–7'ye indi.
  - Ölüm nedenleri yaşa göre; torun varis metinleri ve kuşak numaraları düzeldi.
  - Patron serveti dengelendi (ücretsiz oyunun 3–4 katı). Şöhret satırları ölmüş akrabayı anmıyor. Kariyer fuarı ve kafa avcısı düşük pozisyon teklif etmiyor. Suç dengesi düzeldi.
  - `da()` eki ("Gizem de", "Pamuk da") ve 25 Türkçe düzeltme.
- **Tekrar ölçümü:** hayat içi kalıp tekrarı %6,4'ten %2,5'e; hayatların dörtte birinde geçen satır payı %10'dan %3,4'e indi.
- **v0.7:** marka paleti, yeni logo, ikon ve açılış ekranı; bayrağı devretme, torunlar ve üvey ebeveynler; 2. okumanın düzeltmeleri.
- Testler: 17 dosya, 188 test.

### v0.6'da neler var (ilk çıkış adayı)
- **Ana oyuna 72 yeni olay ve 7 aktivite:**
  - **Orta yaş (25–64)** `events-midlife.ts`: zehirli patron, yan iş, kariyer değişikliği, çocuğun karnesi, boş yuva, aile WhatsApp grubu, ev kredisi, kripto, dolandırıcı araması, kefillik, okul buluşması, apartman toplantısı… (38 olay)
  - **Yaşlılık (60+)** `events-elder.ts`, `activities-elder.ts`: torunlar, torun bakmak, akıllı telefon öğrenmek, kalça ameliyatı, emekli maaşı, tavla rakibi, evi kime bırakacağın, 50. yıl, anı kitabı… (34 olay, 7 aktivite)
  - Sık yapılan 10 aktiviteye 3–7'şer farklı sonuç cümlesi (tekrar hissi azaldı).
- **Suç Dünyası büyüdü** (`src/content/crime/`): 26 olay, 8 aktivite, 3 rozet, 2 hedef. Gözaltı → kefalet → mahkeme, peşini bırakmayan dedektif, firari olmak, zaman aşımı, ekip soygunu, zimmet, cezaevi isyanı ve atölyesi, sabıkayla iş aramak, çocuğun geçmişini öğrenmesi, düze çıkma. Ceza üst sınırı 12 yıl (toplam 15).
- **Giriş akışı:** ilk açılışta 3 sayfalık anlatım, ilk hayatta sırayla çıkan tek seferlik ipuçları (`src/ui/Tip.tsx`, `src/ui/screens/Intro.tsx`). Ekran çökerse "Ailen güvende" kurtarma kartı.
- **Analitik ve çökme raporları** (`src/platform/analytics.ts`): PostHog + Sentry, sadece oyuncu izin verirse; anahtarlar `config.ts`'de, kurulum `MOBILE.md` → 6.
- **Mağaza görselleri** `store-screenshots/en` ve `store-screenshots/tr`.
- Türkçe: yabancı isimler okunuşa göre ek alıyor (Alice'i, George'un), ince l'li isimler (Alp'le, Kemal'e), anneanne/babaanne ayrımı, yadigâr devir cümleleri Türkçe.
- Testler: `tests/crime.test.ts`, `tests/analytics.test.ts` (toplam 28 test).

### v0.5'te neler var
- **Türkçe dil desteği:** arayüz, olaylar, aktiviteler, meslekler, rozetler, hedefler, yadigârlar ve mağaza tamamen Türkçe. Ayarlar'dan English / Türkçe seçilir; ilk açılışta telefonun dili kullanılır. İsim ekleri otomatik (`Ayşe'yle`, `Zonguldak'ta`, `Alp'le`, `Kemal'e`). Türkçede para `₺957.440` biçiminde yazılır. Aynı tohum iki dilde aynı hayatı üretir (testle doğrulanıyor).
- **Kampüs genişlemesi** (`src/content/campus`, $2.99): bölüm seçimi, not ortalaması (GPA), kulüpler ve başkanlık seçimi, ev arkadaşı, hoca, vize-final, kopya, burs, eylem, kampüs aşkı, parti, yarı zamanlı iş, staj ve stajdan iş teklifi, Erasmus, bitirme tezi, kariyer fuarı, onur derecesiyle mezuniyet, yüksek lisans ve doktora, akademik kariyer (Araştırma Görevlisi → Dekan) ve Ar-Ge kariyeri. 19 olay, 12 aktivite, 2 meslek, 3 rozet, 2 hayat hedefi.
- **Soy genişlemesi** (`src/content/lineage`, $3.99): arma, aile köşkü ve bakımı, miras kuralı, eski husumet, portre duvarı, burs, mezar bakımı, müze ödüncü, mektup. 40 olay, 3 aktivite, 2 rozet, 2 hayat hedefi; seçimler hanedanın miras puanını (`legacy`) ve yakınlığı doğrudan etkiler. Testi: `tests/lineage.test.ts`.
- **Mülk ve Yatırım genişlemesi** (`src/content/property`, $3.99): kiralık daire ve dükkân (her yıl kira gelir), hisse ve çöküş, temettü, arsa ve imar, sınır anlaşmazlığı, dolandırıcılık, yazlık, müzayede, miras devri, küçülme. 39 olay, 3 aktivite, 2 rozet, 2 hayat hedefi, yıllık kira. Testi: `tests/property.test.ts`.
- **Bakım ve Yaşlanma genişlemesi** (`src/content/care`, $2.99): ebeveyn bakımı (ilk belirtiler, doktor, taşınma, gece aramaları, tükenmişlik, kardeş paylaşımı, bakımevi, düşme, anahtarlar, evrak), kendi yaşlanman (sırt, tarama, kalıcı teşhis, ilaç rutini, destek grubu, işitme, görme, uyku, yürüyüş, merdiven), yalnızlık ve vasiyet. 37 olay, 3 aktivite, 2 rozet, 2 hayat hedefi. Testi: `tests/care.test.ts`.
- **Köy ve Toprak genişlemesi** (`src/content/homestead`, $2.99): sebze bahçesi (yıllık hasat), don, kuraklık, pazar tezgâhı, tavuk, inek, arı, meyve bahçesi, yaban domuzu, fırtına, köy şöleni ve düğünü, kar, kooperatif, destek başvurusu, değirmen. 36 olay, 3 aktivite, 2 rozet, 2 hayat hedefi. Testi: `tests/homestead.test.ts`.
- **Gurbet genişlemesi** (`src/content/abroad`, $3.99): yurt dışındaki aile (koli, görüntülü arama, yaz dönüşü, havalimanı, cenaze), yurt dışında iki yıllık sözleşme (ilk kış, dil, aksan, dönmek ya da kalmak, vatandaşlık), iki dilli çocuk, memleket köyü, ters kültür şoku. 37 olay, 3 aktivite, 2 rozet, 2 hayat hedefi. Çalışma sözleşmesi bayraklarla anlatılır; oyuncunun ülkesi ve şehri değişmez. Testi: `tests/abroad.test.ts`.
- **Kampüs ve Suç Dünyası kalınlaştırıldı**: Kampüs 19 → 41 olay (`campus/events-more.ts`: grup ödevi, vize paniği, hackathon, harç zammı, danışman, konferans, mezunlar buluşması…), Suç Dünyası 26 → 42 olay (`crime/events-more.ts`: sicilin sonuçları, komşular, ziyaret günü, cezaevi bahçesi, sicil kapatma, gençlere anlatmak…; nasıl-yapılır içeriği yok). Testi: `tests/more-content.test.ts`.
- Yeni testler: `tests/i18n.test.ts` (Türkçesi eksik arayüz metni), `tests/i18n-sim.test.ts` (Türkçe hayatlarda İngilizce cümle kaçağı ve aynı tohum kontrolü), `tests/campus.test.ts`.

### v0.4'te neler var
- **Boss genişlemesi** (`src/content/boss`): kafe, çay markası, moda, yemek teslimatı, teknoloji girişimi veya oyun stüdyosu kur. Çalışan al/çıkar, pazarlama, yatırımcı turları (hisse karşılığı para), satış, satın alma teklifi, halka arz, nakit krizi ve iflas. Pazar doygunluğu ve %25 kurumlar vergisiyle gerçekçi tavan. Şirket mirasla çocuğa geçer (aile şirketi). 4 yeni rozet.
- **Hayat hedefleri** (`src/engine/goals.ts`): her hayata çakışmayan 3 hedef; her biri +200 miras puanı, üçü birden "Overachiever" rozeti. Paketler kendi hedeflerini ekleyebilir.
- **Heirloom+**: reklamsız, yılda +2 aktivite, hayat başına ikinci geri alma.
- **Gömülü fontlar** (`src/ui/fonts`): telefonda internetsiz çalışır.
- **AB/BK reklam onayı** (Google UMP) reklamlardan önce gösterilir.
- **Mağaza dosyaları:** `public/privacy.html` (gizlilik politikası, EN+TR), `STORE_LISTING.md` (EN+TR mağaza metinleri), `store-screenshots/` (6 adet 1290×2796 görsel).
- Düzeltme: başka bir çocukla devam edilince yadigârın kime kaldığı yazısı artık doğru kişiyi gösteriyor.

### v0.3'te neler var
- **Fame genişlemesi** (`src/content/fame`): müzik, sosyal medya ve oyunculuk kariyerleri. Grup kurma, şarkı yazma (kalite sistemi), single ve albüm, konser, plak şirketi, turne, viral olma, paparazzi, skandal, ödül (yadigâra dönüşür), reality show, geri dönüş. Hayran sayısından türeyen şöhret seviyesi ve 3 yeni rozet.
- **Paket kancaları:** paketler kendi durumunu (`player.ext`), yıllık işlemini (`onYear`), Life ekranı kutucuklarını (`lifeTiles`) ve rozetlerini (`ribbons`) ekleyebilir.
- **Mobil uygulama:** `android/` ve `ios/` projeleri, ikon ve açılış ekranı, Preferences ile kalıcı kayıt, RevenueCat ve AdMob bağlantıları, "Restore purchases". Ayrıntılar: **MOBILE.md**.

### v0.2'de neler var
- Ülkeye göre para birimi (₺, €, £, R$). Oyun içi para ABD doları bazında tutulur, gösterim `world.ts` içindeki kurla çevrilir.
- Aile üyeleriyle etkileşim (`src/engine/interactions.ts`): vakit geçir, hediye, iltifat, para iste, tavsiye, kavga, ayrıl/boşan, masal oku. Kişi başı yılda 2.
- Hayat sonu rozetleri (`src/engine/ribbons.ts`), profilde koleksiyon.
- Ödüllü reklam yeri (`src/platform/ads.ts`): test sürümünde 3 saniyelik yer tutucu, ödül +2 aktivite.
- Yadigâr üreten olaylar (piyano, tablo, yorgan, tarif defteri) ve vasiyet: yadigârların kime kalacağını seçmek.
- Türkiye kültür paketi (`src/content/culture-tr`): YKS, askerlik, görücü usulü, kına, takı, bayram, kira artışı, iftar, mahalle maçı, kahvehane, Zonguldak maden müzesi.

## Çalıştırma

```bash
npm install
npm run dev            # tarayıcıda geliştirme sunucusu
npm test               # 1000 hayatlık simülasyon testi + kayıt/nesil testleri
npm run build          # iOS/Android'e paketlenecek web derlemesi (dist/)
npm run build:preview  # tek dosyalık paylaşılabilir test sürümü (dist-preview/heirloom.html)
```

## Klasör yapısı

| Klasör | Ne var |
|---|---|
| `src/engine/` | Oyun motoru: yaşlanma, okul, iş, para, ölüm, nesil devri, yadigârlar. Arayüzden bağımsız, test edilebilir. |
| `src/content/` | İçerik paketleri. `base/` temel oyun, `crime/` 18+ "Crime World" genişlemesi. |
| `src/themes/` | Satılabilir temalar (renk, font, köşe yuvarlaklığı + arayüz parçası seçimi). |
| `src/ui/` | Ekranlar (`screens/`) ve değiştirilebilir arayüz parçaları (`skins/`). |
| `src/platform/` | Kayıt (localStorage) ve satın alma sağlayıcısı. |
| `tests/` | Simülasyon testleri. |

## Yeni bir genişleme paketi eklemek

1. `src/content/<paket>/index.ts` içinde bir `ContentPack` tanımla: olaylar (`events`), aktiviteler (`activities`), meslekler (`jobs`).
2. `entitlement` alanına mağaza ürün kimliğini yaz (ör. `pack.fame`). Yetişkin içerikse `rating: 'mature'` yap; o zaman oyuncunun 18+ onayı da gerekir.
3. Paketi `src/content/registry.ts` içindeki `PACKS` listesine ekle.
4. Ürünü `src/platform/purchases.ts` içindeki `PRODUCTS` listesine ekle.

Olaylar seçimli (`choices`) ya da seçimsiz (`apply`) olabilir. Koşullar (`when`), yaş aralığı, tekrar süresi (`cooldown`) ve ağırlık (`weight`) desteklenir.

## Metin yazmak ve dil eklemek

- **Arayüz metinleri:** ekranlarda `T('Age up')` gibi İngilizce anahtar kullanılır, Türkçesi `src/i18n/ui.ts` içindeki `TR` sözlüğündedir. Değişken için `T('Age {n}', { n: 12 })`, tekil/çoğul için `Tn(n, 'one', 'many')`. `tests/i18n.test.ts`, ekranlarda Türkçesi eksik bir `T()` kalırsa hata verir.
- **Hikâye metinleri:** olay ve aktivitelerde `c.t('English', 'Türkçe')`. Türkçe ekler için `src/i18n/tr-grammar.ts`: `gen('Ada')` → "Ada'nın", `loc('Zonguldak')` → "Zonguldak'ta", `dat`, `acc`, `abl`, `wth`. Akrabalık için `kin(c, kişi, 'sibling')` → "kız kardeşin".
- **Katalog verisi:** meslekler `titlesTr`, eşyalar `nameTr`, yadigârlar `effectTr`, rozetler `nameTr/descTr`, hedefler `labelTr`, ürünler `titleTr/descriptionTr`, temalar `nameTr/descriptionTr`.
- **Rastgelelik:** iki dildeki listeden seçim yaparken tek bir `c.rng.int` ile indeks seçilir; böylece aynı tohum iki dilde de aynı hayatı üretir.
- **Yeni dil:** `Lang` tipine ekle (`src/engine/types.ts`), `ui.ts` içine sözlük ekle, `Ctx.t` yerine çok dilli bir yardımcıya geç. Dil, ilk açılışta telefonun diline göre seçilir; Ayarlar'dan değiştirilebilir.

## Yeni bir tema veya arayüz eklemek

- **Sadece renk/font:** `src/themes/registry.ts` içinde `THEMES` listesine yeni bir giriş ekle. Ücretliyse `entitlement` ver ve ürünü `PRODUCTS` listesine ekle.
- **Farklı bir arayüz parçası:** `src/ui/skins/index.tsx` içine yeni bir bileşen yaz (ör. istatistikler için yeni bir gösterim), `Skin` tipine adını ekle ve haritaya kaydet. Temalar `skin` alanıyla hangi parçayı kullanacağını seçer.

Şu an 4 tema var: Evening Album ve Daylight (ücretsiz), Coal & Gold ve Bloom (ücretli). Coal & Gold, halka göstergeler ve kart tipi hikâye akışıyla farklı bir arayüz kullanıyor.

## Mağazaya çıkış

Adım adım rehber **MOBILE.md** dosyasında. Kısaca: `npm run build && npx cap sync`, sonra `npx cap open android` / `npx cap open ios`.

Kalan teknik not: fontlar şu an Google Fonts'tan yükleniyor; internet yokken yedek font kullanılır. İstenirse font dosyaları uygulamanın içine gömülebilir.
