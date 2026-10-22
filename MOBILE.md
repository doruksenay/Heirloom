# Heirloom'u telefona kurmak ve mağazaya çıkarmak

Projede hazır **Android** (`android/`) ve **iOS** (`ios/`) klasörleri var. Kod, ikon, açılış ekranı, kayıt sistemi, satın alma ve reklam bağlantıları hazır. Geriye bilgisayarında derlemek ve hesap/anahtar işlemleri kalıyor.

## 0. Bir kez yapılacaklar

1. Node.js 20+ kur, proje klasöründe `npm install` çalıştır.
2. **Uygulama kimliğini değiştir:** `capacitor.config.ts` içindeki `appId` (`com.heirloomgame.lifesim`) yerine kendi alan adını ters yaz, ör. `com.sanobaba.heirloom`. Mağazaya bir kez yüklendikten sonra değiştirilemez. Değiştirdikten sonra `android/app/build.gradle` içindeki `applicationId` ve `namespace` değerlerini de aynı yap; iOS'ta Xcode → Signing & Capabilities → Bundle Identifier.
3. Her kod değişikliğinden sonra: `npm run build && npx cap sync`

## 1. Android'de test etmek (Windows, Mac veya Linux)

1. [Android Studio](https://developer.android.com/studio) kur.
2. `npx cap open android` (veya Android Studio'da `android/` klasörünü aç). İlk açılışta Gradle indirmesi birkaç dakika sürer.
3. Telefonda Geliştirici seçenekleri → USB hata ayıklama'yı aç, kabloyla bağla, Android Studio'da ▶ Run.

Mağaza için: Build → Generate Signed Bundle → **Android App Bundle (.aab)**. Oluşturduğun imza anahtarını (keystore) ve şifresini kaybetme; güncellemeler için hep aynısı gerekir.

## 2. iPhone'da test etmek (Mac gerekir)

1. Mac'e Xcode kur.
2. `npx cap open ios`
3. Xcode → App hedefi → Signing & Capabilities → Team olarak Apple hesabını seç.
4. iPhone'u bağla, ▶ Run. Mağaza için: Product → Archive → Distribute App.

## 3. Mağaza hesapları (senin yapman gerekenler)

| | Google Play | App Store |
|---|---|---|
| Hesap | Play Console, tek seferlik 25 $ | Apple Developer Program, yıllık 99 $ |
| Yükleme | .aab dosyası | Xcode Archive |
| Gerekenler | Gizlilik politikası linki, Veri güvenliği formu, İçerik derecelendirme anketi | Gizlilik politikası linki, App Privacy formu, Yaş derecelendirmesi |

**Yaş derecelendirmesi:** Crime World (suç, şiddet) ve rastgele paket olmadığı için anketlerde "suç/şiddet temaları: var, gerçek kumar: yok, kullanıcılar arası iletişim: yok" cevaplarını ver. Beklenen sonuç yaklaşık 16+/17+.

## 4. Satın almalar (RevenueCat)

1. [RevenueCat](https://app.revenuecat.com) hesabı aç (ücretsiz başlar, gelir belli seviyeyi geçince küçük bir pay alır).
2. Play Console ve App Store Connect'te **tek seferlik ürünler** oluştur. Ürün kimlikleri `src/platform/purchases.ts` içindekilerle birebir aynı olmalı: `pack.crime_world`, `pack.fame`, `pack.culture_tr`, `theme.coal`, `theme.bloom`.
3. RevenueCat'te her ürün için **aynı isimde bir entitlement** oluştur ve ürünü ona bağla. Hepsini bir Offering'e ekle.
4. RevenueCat API anahtarlarını `src/platform/config.ts` içine yaz (`appl_...` iOS, `goog_...` Android).

Anahtar boşken telefonda da test modu çalışır (her şey ücretsiz açılır), yani mağaza ayarı bitmeden oyunu test edebilirsin.

## 5. Reklamlar (AdMob)

1. [AdMob](https://apps.admob.com) hesabı aç, iOS ve Android için birer uygulama ekle, her birine **Rewarded** reklam birimi oluştur.
2. `src/platform/config.ts` içinde reklam birimi kimliklerini değiştir ve `testing: false` yap (sadece yayından hemen önce).
3. Uygulama kimliklerini (ca-app-pub-...~...) değiştir:
   - Android: `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
   - iOS: `ios/App/App/Info.plist` → `GADApplicationIdentifier`

Şu an girili olanlar Google'ın herkese açık **test** kimlikleri; test reklamı gösterir, para kazandırmaz. Kendi telefonunda gerçek reklamlara tıklama, AdMob hesabı kapatılabilir.

## 6. Yayından önce kontrol listesi

- [ ] `appId` değiştirildi
- [ ] RevenueCat anahtarları ve ürünler hazır, gerçek satın alma test edildi (sandbox hesabıyla)
- [ ] AdMob kimlikleri gerçek, `testing: false`
- [ ] `public/privacy.html` içindeki köşeli parantezli alanlar dolduruldu ve sayfa bir web adresinde yayında (ör. GitHub Pages); link iki mağazaya girildi
- [ ] Mağaza metinleri `STORE_LISTING.md` dosyasından, görseller `store-screenshots/` klasöründen yüklendi
- [ ] RevenueCat'te `premium.no_ads` (Heirloom+) ürünü de oluşturuldu
- [ ] Önce Play Console'da **kapalı test** (closed testing) ile 12+ kişiye dağıt; yeni kişisel hesaplarda Google bunu istiyor
