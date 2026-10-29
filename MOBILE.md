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

**Yaş derecelendirmesi:** Crime World (suç, şiddet) ve rastgele paket olmadığı için anketlerde "suç/şiddet temaları: var, gerçek kumar: yok, simüle kumar: seyrek/hafif (oyun içi piyango), kullanıcılar arası iletişim: yok" cevaplarını ver. Beklenen sonuç App Store'da 17+, Google Play'de PEGI 16.

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

## 6. Analitik ve çökme raporları (PostHog + Sentry)

Oyun ilk açılışta oyuncuya sorar. "Evet" diyenlerden anonim kullanım verisi ve çökme raporu gelir; "Hayır" diyenlerden hiçbir şey gelmez. Ayarlardan her zaman değiştirilebilir. Yerel (native) kurulum gerekmez, anahtarları girmek yeterli.

1. [PostHog](https://eu.posthog.com) → AB bölgesinde ücretsiz hesap aç → Project settings → **Project API key** (`phc_...`). Bunu `src/platform/config.ts` → `posthog.key` alanına yaz.
2. [Sentry](https://sentry.io) → ücretsiz hesap aç, platform olarak **Browser JavaScript** seç → Client Keys → **DSN**. Bunu `sentryDsn` alanına yaz.
3. Gönderilen olaylar:
   - `app_open`, `intro_done`, `life_start`, `age_milestone` (1, 3, 6, 12, 18, 25, 40, 60, 80, 100 yaş), `life_end`, `continue_child`, `new_family`
   - `screen` (sekme değişimi), `tip_done`
   - `purchase_start/done/cancel`, `restore`, `ad_start`, `ad_done`, `language`, `theme`
4. İlk bakılacak grafik: `life_start` → `age_milestone 18` → `life_end` → `continue_child` hunisi. İnsanlar hanedan döngüsüne giriyor mu, orada görünür.

**Mağaza gizlilik formları:**
- **App Store "App Privacy":** Usage Data (Product Interaction) ve Diagnostics (Crash Data). İkisi de "Not linked to user", "Not used for tracking". AdMob için ayrıca Identifiers (Device ID) ve Advertising Data, "Used for tracking" (ATT izni istenir).
- **Google Play "Data safety":** App activity, App info and performance (crash logs) ve Device or other IDs (AdMob). Verilerin şifreli aktarıldığını işaretle.

## 7. Bulut sunucusu (isteğe bağlı: aile kodu, Günün Hayatı sıralaması, hediye kodları, yönetim paneli)

Sunucu kodu `server/` klasöründe hazır: bir **Cloudflare Worker** ve **D1** veritabanı. `src/platform/config.ts` içindeki `CLOUD_URL` boş olduğu sürece uygulamada bulutla ilgili hiçbir şey görünmez ve hiçbir istek gitmez. Yani bu bölümü yayından sonra da yapabilirsin.

Ne işe yarar:
- **Bulut kaydı:** Oyuncu Ayarlar'dan açarsa ailesi buluta yedeklenir (uygulama arka plana geçince ve her 5 oyun yılında bir). Ona `HLM-7K2Q-9XPA` gibi bir **aile kodu** ve 6 haneli bir **PIN** gösterilir; yeni telefonda Ayarlar → "Aileni bu telefona taşı" ile ailesini geri alır. Hesap, e-posta, isim yok.
- **Bulut verilerimi sil:** Apple'ın istediği uygulama içi veri silme. Tek dokunuşla sunucudaki her şey silinir.
- **Günün Hayatı sıralaması:** İsteyen oyuncu sonucunu gönderir, "oyuncuların %X kadarından iyi" ve günün ilk 20'si görünür. Temel hile koruması var (o günün kategorileri, mantıklı aralıklar, kurulum başına günde tek kayıt).
- **Yönetim paneli:** `https://SENİN-ADRESİN/admin` adresinde, şifreyle. Oyuncuları listeler (kurulum kimliği, takma ad, son görülme, kuşak, paketler), tek tek **tüm paketler / Heirloom+** verip geri alabilir, **hediye kodu** oluşturup silebilirsin. Oyuncu kodu Ayarlar → "Hediye kodu" alanına yazar. Bunlar gerçek satın almalara ek bir katmandır; satışlar yine RevenueCat'ten geçer.

### Kurulum adımları (bir kez, yaklaşık 15 dakika)

1. **Hesap aç:** [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) adresinden ücretsiz Cloudflare hesabı aç ve e-postanı doğrula. Kredi kartı gerekmez.
2. **Sunucu klasörüne geç ve bağımlılıkları kur:**
   ```
   cd server
   npm install
   ```
3. **Giriş yap:** `npx wrangler login` — tarayıcı açılır, "Allow" de.
4. **Veritabanını oluştur** (verinin Batı Avrupa'da durması için `weur`):
   ```
   npx wrangler d1 create heirloom --location=weur
   ```
   Çıktıdaki `database_id = "..."` değerini kopyala ve `server/wrangler.toml` içindeki sıfırlı `database_id` satırına yapıştır.
5. **Tabloları kur:**
   ```
   npm run db:init
   ```
   (Bu, `npx wrangler d1 execute heirloom --remote --file=schema.sql` komutudur.)
6. **Gizli anahtarları gir.** İkisi de uzun ve rastgele olsun; şifre yöneticinde sakla. Rastgele bir değer üretmek için: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
   ```
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put PEPPER
   ```
   - `ADMIN_TOKEN`: yönetim panelinin şifresi (en az 24 karakter). İstediğin zaman değiştirebilirsin.
   - `PEPPER`: PIN'leri ve IP adreslerini özetlemek için kullanılan gizli değer (en az 16, tercihen 32+ karakter). **Bir kez koy, bir daha değiştirme**; değişirse mevcut bütün PIN'ler geçersiz olur.
7. **Yayınla:**
   ```
   npx wrangler deploy
   ```
   Çıktıda `https://heirloom-cloud.KULLANICI-ADIN.workers.dev` gibi bir adres görünür. Tarayıcıda `…/v1/health` aç; `{"ok":true}` görmelisin. `…/admin` adresinde panel açılır, `ADMIN_TOKEN` ile gir.
8. **Uygulamaya bağla:** `src/platform/config.ts` içinde
   ```ts
   export const CLOUD_URL = 'https://heirloom-cloud.KULLANICI-ADIN.workers.dev';
   ```
   yaz (sonda `/` olmadan), sonra `npm run build && npx cap sync`. Ayarlar'da "Bulut kaydı", "Günün Hayatı sıralaması", "Hediye kodu" ve "Aileni bu telefona taşı" bölümleri belirir.
9. **Gizlilik politikası:** `public/privacy.html` bulut bölümünü zaten anlatıyor (EN + TR). Mağaza formlarında da güncelle:
   - **App Store "App Privacy":** "Other User Content" (oyun kaydı, takma ad) ve "User ID" (rastgele kurulum kimliği) → amaç *App Functionality*, *Used for tracking: No*. *Linked to user* için **Yes** seç: veriler rastgele kimliğe bağlı (kimliği belli bir kişiye değil, ama Apple bunu da "bağlı" sayabilir; Yes güvenli taraftır).
   - **Google Play "Data safety":** "App activity → Other user-generated content" ve "Device or other IDs" → toplanıyor, isteğe bağlı, şifreli aktarım, silme isteği uygulama içinden.

**Yerelde denemek istersen** (hesap gerekmez): `cd server`, `cp .dev.vars.example .dev.vars`, `npm run db:init:local`, `npm run dev` → `http://127.0.0.1:8787`. Uygulamayı tarayıcıda buna bağlamak için geçici olarak `CLOUD_URL = 'http://127.0.0.1:8787'` yap.

**Testler:** Sunucu mantığı ve istemci `npx vitest run tests/cloud-server.test.ts tests/cloud-client.test.ts` ile, bellekteki sahte bir veritabanına karşı test edilir.

### Güvenlik özeti
- Kişisel veri tutulmaz. Kurulum kimliği rastgeledir; cihaz sırrı ve PIN yalnızca özet (SHA-256 / HMAC + `PEPPER`) olarak saklanır. IP adresleri yalnızca bir gün içinde silinen hız sınırı sayaçlarında, anahtarlı özet olarak durur.
- Hız sınırları: aynı aile koduna saatte en fazla 6 PIN denemesi, IP başına saatte 30 geri yükleme ve 30 hediye kodu denemesi, oyuncu başına saatte 40 kayıt, yönetim panelinde saatte 10 yanlış şifreden sonra kilit.
- Boyut sınırları: kayıt en fazla 1 MB (gerçek kayıtlar 10–60 KB), diğer istekler en fazla 4 KB.
- CORS yalnızca uygulamanın kendi adreslerine açık (`capacitor://localhost`, `https://localhost`); yönetim API'si başka sitelerden çağrılamaz. Oyunu web'de de yayınlarsan adresini `wrangler.toml` → `ALLOWED_ORIGINS` listesine ekle.
- Yeni telefona taşıma eski telefonun anahtarını geçersiz kılar; iki telefon aynı aileyi birbirinin üstüne yazamaz.
- Her gece 03:17 UTC'de temizlik: 90 günden eski sıralama kayıtları ve 18 aydır bağlanmayan aileler silinir.

### Ücretsiz katman ve maliyet

| | Ücretsiz (Workers Free) | Ücretli (Workers Paid, ayda 5 $) |
|---|---|---|
| İstek | Günde 100.000 | Ayda 10 milyon dahil, sonrası milyon başına 0,30 $ |
| İşlemci | İstek başına 10 ms (bu sunucunun işleri için yeterli) | Ayda 30 milyon ms dahil |
| D1 okuma | Günde 5 milyon satır | Ayda 25 milyar satır dahil |
| D1 yazma | Günde 100.000 satır | Ayda 50 milyon satır dahil, sonrası milyon başına 1 $ |
| D1 depolama | Toplam 5 GB (veritabanı başına 500 MB) | 5 GB dahil, sonrası GB başına ayda 0,75 $ |

Kabaca hesap: bulut kaydı açık bir oyuncu günde 20–30 satır yazar, bir kayıt 10–60 KB tutar. Ücretsiz katman **günde 3.000–4.000 aktif bulut oyuncusuna** ve **10.000+ yedeklenmiş aileye** kadar yeter. Sınır aşılırsa istekler o gün için hata verir ama oyun çalışmaya devam eder (bulut tamamen isteğe bağlı). Büyüyünce Cloudflare panelinden Workers Paid'e (ayda 5 $) geçmek yeterli; kodda değişiklik gerekmez. Güncel rakamlar: [Workers fiyatları](https://developers.cloudflare.com/workers/platform/pricing/), [D1 fiyatları](https://developers.cloudflare.com/d1/platform/pricing/).

## 8. Yayından önce kontrol listesi

- [ ] `appId` değiştirildi
- [ ] RevenueCat anahtarları ve ürünler hazır, gerçek satın alma test edildi (sandbox hesabıyla)
- [ ] AdMob kimlikleri gerçek, `testing: false`
- [ ] `public/privacy.html` içindeki köşeli parantezli alanlar dolduruldu ve sayfa bir web adresinde yayında (ör. GitHub Pages); link iki mağazaya girildi
- [ ] Mağaza metinleri `STORE_LISTING.md` dosyasından, görseller `store-screenshots/en` (İngilizce mağaza sayfası) ve `store-screenshots/tr` (Türkçe mağaza sayfası) klasörlerinden yüklendi
- [ ] RevenueCat'te `premium.no_ads` (Heirloom+) ürünü de oluşturuldu
- [ ] Yaş derecelendirme anketi `STORE_LISTING.md` → "Kategori ve derecelendirme" bölümüne göre doldurulur. Oyun içi parayla oynanan piyango bileti olduğu için "Simulated Gambling: Infrequent/Mild" işaretlenir; gerçek parayla kumar yok. Suç Dünyası'ndaki suç ve şiddet temaları nedeniyle beklenen derece App Store'da 17+.
- [ ] PostHog anahtarı ve Sentry DSN girildi, telefonda "Evet" deyip bir olayın PostHog'a düştüğü görüldü
- [ ] Önce Play Console'da **kapalı test** (closed testing) ile 12+ kişiye dağıt; yeni kişisel hesaplarda Google bunu istiyor
- [ ] (İsteğe bağlı) Bulut sunucusu kuruldu (bölüm 7), `CLOUD_URL` girildi, telefonda bulut kaydı açılıp aile kodu ikinci bir cihaza taşınarak denendi, App Privacy / Data safety formlarına bulut verileri eklendi
