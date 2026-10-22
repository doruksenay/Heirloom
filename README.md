# Heirloom: Life Simulator

Nesiller boyu süren bir hayat simülasyonu. Bir hayat yaşarsın, sonra çocuğunla devam edersin; ev, aile yadigârları ve seçimlerin bir sonraki nesle geçer.

Sürüm: **v0.4 (test sürümü)**. Satın almalar ve reklamlar test modunda; ödeme alınmaz.

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

## Yeni bir tema veya arayüz eklemek

- **Sadece renk/font:** `src/themes/registry.ts` içinde `THEMES` listesine yeni bir giriş ekle. Ücretliyse `entitlement` ver ve ürünü `PRODUCTS` listesine ekle.
- **Farklı bir arayüz parçası:** `src/ui/skins/index.tsx` içine yeni bir bileşen yaz (ör. istatistikler için yeni bir gösterim), `Skin` tipine adını ekle ve haritaya kaydet. Temalar `skin` alanıyla hangi parçayı kullanacağını seçer.

Şu an 4 tema var: Evening Album ve Daylight (ücretsiz), Coal & Gold ve Bloom (ücretli). Coal & Gold, halka göstergeler ve kart tipi hikâye akışıyla farklı bir arayüz kullanıyor.

## Mağazaya çıkış

Adım adım rehber **MOBILE.md** dosyasında. Kısaca: `npm run build && npx cap sync`, sonra `npx cap open android` / `npx cap open ios`.

Kalan teknik not: fontlar şu an Google Fonts'tan yükleniyor; internet yokken yedek font kullanılır. İstenirse font dosyaları uygulamanın içine gömülebilir.
