import type { Lang } from '../engine/types';

/**
 * Interface strings. Keys are the English text, so screens stay readable:
 *   T('Age up')                      → "Yaşlan" in Turkish
 *   T('Age {n}', { n: 12 })          → "12 yaş"
 * A test (tests/i18n.test.ts) scans src/ui for T('...') calls and fails if one has no Turkish entry.
 * To add a language: add it to Lang, add a dictionary like TR below, and register it in DICTS.
 */

let current: Lang = 'en';
export const setUiLang = (l: Lang | undefined) => {
  current = l ?? 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = current;
};
export const uiLang = (): Lang => current;

export const TR: Record<string, string> = {
  // navigation
  Life: 'Hayat',
  Home: 'Ev',
  Family: 'Aile',
  Activities: 'Aktiviteler',
  Store: 'Mağaza',
  Back: 'Geri',
  Main: 'Ana menü',
  Settings: 'Ayarlar',

  // life screen
  '{name} family · Gen {n}': '{name} ailesi · {n}. kuşak',
  '{name}, age {n}': '{name}, {n} yaşında',
  'In prison · {n} yr left': 'Cezaevinde · {n} yıl kaldı',
  'Retired {job}': 'Emekli {job}',
  'University student': 'Üniversite öğrencisi',
  Student: 'Öğrenci',
  Unemployed: 'İşsiz',
  Baby: 'Bebek',
  Child: 'Çocuk',
  Teen: 'Genç',
  Adult: 'Yetişkin',
  Elder: 'Yaşlı',
  Bank: 'Banka',
  'Salary / yr': 'Maaş / yıl',
  Heirlooms: 'Yadigârlar',
  'Age {n}': '{n} yaş',
  'Age up': 'Yaşlan',
  'AGE UP': 'YAŞLAN',
  'Life story': 'Hayat hikâyesi',
  Happiness: 'Mutluluk',
  Health: 'Sağlık',
  Smarts: 'Zekâ',
  Looks: 'Görünüş',
  'Rewind with {item} ({n} left this life)': '{item} ile geri al (bu hayatta {n} hak)',
  "Your parents' home": 'Ailenin evi',

  // event categories
  childhood: 'çocukluk',
  school: 'okul',
  work: 'iş',
  love: 'aşk',
  family: 'aile',
  health: 'sağlık',
  money: 'para',
  crime: 'suç',
  random: 'rastgele',
  culture: 'kültür',
  fame: 'şöhret',
  business: 'iş dünyası',
  campus: 'kampüs',
  life: 'hayat',
  milestone: 'dönüm noktası',
  heirloom: 'yadigâr',

  // choice badges (content gives these in English; they are translated here)
  Risky: 'Riskli',
  'Big change': 'Büyük değişiklik',
  'Costs more': 'Daha pahalı',
  'No opening': 'Açık yok',
  'Not enough money': 'Para yetmiyor',
  'Not enough savings': 'Birikim yetmiyor',
  'Breaks the chain': 'Zinciri kırar',
  'No way back': 'Dönüşü yok',
  'Big money': 'Büyük para',
  'Needs Smarts {n}+': 'Zekâ {n}+ gerekir',
  'Needs Looks {n}+': 'Görünüş {n}+ gerekir',
  'Needs Health {n}+': 'Sağlık {n}+ gerekir',
  Safe: 'Güvenli',
  Free: 'Ücretsiz',
  'Bank loan': 'Banka kredisi',
  Illegal: 'Yasa dışı',

  // activities
  '{n}/{max} this year': 'Bu yıl {n}/{max}',
  'Life goals': 'Hayat hedefleri',
  "This life's goals": 'Bu hayatın hedefleri',
  '2 extra activities unlocked for this year.': 'Bu yıl için 2 ekstra aktivite açıldı.',
  'Watch an ad': 'Reklam izle',
  'You are in prison. Most activities are off-limits.': 'Cezaevindesin. Aktivitelerin çoğu yasak.',
  'Done for this year': 'Bu yıl yapıldı',
  'Mind & Body': 'Zihin ve Beden',
  Love: 'Aşk',
  Campus: 'Kampüs',
  Career: 'Kariyer',
  Business: 'İş',
  Fame: 'Şöhret',
  Money: 'Para',
  'After dark': 'Gece hayatı',

  // ad overlay
  Ad: 'Reklam',
  'Ad placeholder · test build': 'Reklam yer tutucusu · test sürümü',
  'Reward: {r}': 'Ödül: {r}',
  'Reward in {n}s': '{n} sn sonra ödül',
  'Claim reward': 'Ödülü al',
  'Close without reward': 'Ödülsüz kapat',

  // home
  'Your living room': 'Oturma odan',
  'An old crate': 'Eski bir kasa',
  'Heirloom clock': 'Yadigâr saat',
  Value: 'Değer',
  'Passed down, never sold': 'Kuşaktan kuşağa, asla satılmaz',
  'No heirlooms yet. Win a trophy, or keep something special long enough.': 'Henüz yadigâr yok. Bir ödül kazan ya da özel bir şeyi yeterince uzun sakla.',
  'Since {y} · {n} generation': '{y} yılından beri · {n} kuşak',
  'Since {y} · {n} generations': '{y} yılından beri · {n} kuşak',
  Decorate: 'Dekorasyon',
  'Bank {m}': 'Banka {m}',
  '+{n} Happiness': '+{n} Mutluluk',
  Placed: 'Yerleştirildi',

  // family
  Dynasty: 'Hanedan',
  'The {name} family': '{name} ailesi',
  Generations: 'Kuşak',
  '{n} yrs': '{n} yıl',
  History: 'Tarih',
  Legacy: 'Miras puanı',
  'Gen {n}': '{n}. kuşak',
  'Gen {n} · You': '{n}. kuşak · Sen',
  '{career} · lived {age} ({from}–{to})': '{career} · {age} yıl yaşadı ({from}–{to})',
  'Left {item}': 'Bıraktığı: {item}',
  'Living family': 'Yaşayan aile',
  'Nobody yet. Go out and meet people.': 'Henüz kimse yok. Dışarı çık, insanlarla tanış.',
  '{name}: open interactions': '{name}: etkileşimleri aç',
  'Closeness with {name}': '{name} ile yakınlık',
  Closeness: 'Yakınlık',
  Ribbons: 'Kurdeleler',
  '{n}/{max} collected': '{n}/{max} toplandı',
  Close: 'Kapat',
  '{n} interaction left with {name} this year': 'Bu yıl {name} ile {n} etkileşim hakkın kaldı',
  '{n} interactions left with {name} this year': 'Bu yıl {name} ile {n} etkileşim hakkın kaldı',
  'See {name} again next year': '{name} ile seneye tekrar görüş',
  Mother: 'Anne',
  Father: 'Baba',
  Sister: 'Kız kardeş',
  Brother: 'Erkek kardeş',
  Girlfriend: 'Kız arkadaş',
  Boyfriend: 'Erkek arkadaş',
  Wife: 'Eş',
  Husband: 'Eş',
  Ex: 'Eski sevgili',
  Daughter: 'Kız',
  Son: 'Oğul',
  Friend: 'Arkadaş',

  // summary
  'New ribbon: {name}': 'Yeni kurdele: {name}',
  Cause: 'Ölüm nedeni',
  'Never settled down': 'Hiç yuva kurmadı',
  '{name}, {n} years': '{name}, {n} yıl',
  '{n} child': '{n} çocuk',
  '{n} children': '{n} çocuk',
  '{n} grandchild': '{n} torun',
  '{n} grandchildren': '{n} torun',
  'Left behind': 'Geride bıraktığı',
  'Final words': 'Son sözleri',
  '{name} ({from}–{to}) lived {age} years in {city}.': '{name} ({from}–{to}), {city} şehrinde {age} yıl yaşadı.',
  'Final words: "{w}"': 'Son sözleri: "{w}"',
  'Ribbon: {name}': 'Kurdele: {name}',
  'Story copied. Paste it anywhere.': 'Hikâye kopyalandı. İstediğin yere yapıştır.',
  'A life well lived': 'Dolu dolu bir hayat',
  'Gone too soon': 'Çok erken gitti',
  'years lived · legacy +{n}': 'yıl yaşadı · miras +{n}',
  'Life goals · {n}/{max}': 'Hayat hedefleri · {n}/{max}',
  'Continue as {name}, {n}': '{name} olarak devam et ({n})',
  'No children to carry on. The {name} story ends here, but a new family can begin.':
    '{name} ailesini sürdürecek çocuk yok. Hikâye burada bitiyor ama yeni bir aile başlayabilir.',
  'Share her story': 'Hikâyesini paylaş',
  'Share his story': 'Hikâyesini paylaş',
  'Start a new family': 'Yeni bir aile kur',

  // new life
  'Begin a new family': 'Yeni bir aile kur',
  'Live one life, then continue as your child. Your home, your heirlooms and your choices carry on.':
    'Bir hayat yaşa, sonra çocuğun olarak devam et. Evin, yadigârların ve seçimlerin seninle gelir.',
  'Test life · Zonguldak, Türkiye · 2 family heirlooms': 'Deneme hayatı · Zonguldak, Türkiye · 2 aile yadigârı',
  Play: 'Oyna',
  'Custom life': 'Özel hayat',
  Randomize: 'Rastgele',
  Gender: 'Cinsiyet',
  Female: 'Kadın',
  Male: 'Erkek',
  'First name': 'Ad',
  'Family name': 'Soyadı',
  Country: 'Ülke',
  City: 'Şehir',
  'Be born': 'Doğ',

  // store
  'Purchase was cancelled.': 'Satın alma iptal edildi.',
  '{name} unlocked. Pick it in Settings.': '{name} açıldı. Ayarlar’dan seçebilirsin.',
  '{name} unlocked.': '{name} açıldı.',
  'Test build: every purchase is free.': 'Test sürümü: tüm satın almalar ücretsiz.',
  'Restored {n} purchase.': '{n} satın alma geri yüklendi.',
  'Restored {n} purchases.': '{n} satın alma geri yüklendi.',
  'No purchases to restore.': 'Geri yüklenecek satın alma yok.',
  'Restore purchases': 'Satın almaları geri yükle',
  'Store sections': 'Mağaza bölümleri',
  Expansions: 'Genişlemeler',
  Themes: 'Temalar',
  Premium: 'Premium',
  'Coming soon': 'Yakında',
  'This expansion contains crime, violence and adult themes. Tap again to confirm you are 18 or older.':
    'Bu genişleme suç, şiddet ve yetişkin temaları içerir. 18 yaşından büyük olduğunu onaylamak için tekrar dokun.',
  'Age check required': 'Yaş doğrulaması gerekir',
  'Colors, fonts and layout': 'Renkler, yazı tipleri ve düzen',
  Owned: 'Sende var',
  'I am 18+, buy': '18 yaşından büyüğüm, satın al',

  // settings
  Done: 'Tamam',
  Language: 'Dil',
  'Stories already written stay in the language they were written in.': 'Önceden yazılmış hikâyeler yazıldıkları dilde kalır.',
  Theme: 'Tema',
  'In use': 'Kullanılıyor',
  Use: 'Kullan',
  'Adult content': 'Yetişkin içerik',
  'Turns on 18+ expansions you own, like Crime World.': 'Sahip olduğun 18+ genişlemeleri (Suç Dünyası gibi) açar.',
  'Adult expansions include crime, violence and mature themes. Tap the switch again to confirm you are 18 or older.':
    'Yetişkin genişlemeleri suç, şiddet ve olgun temalar içerir. 18 yaşından büyük olduğunu onaylamak için düğmeye tekrar dokun.',
  'Start over': 'Baştan başla',
  'Ends the current family. Purchases and themes stay.': 'Mevcut aileyi bitirir. Satın almalar ve temalar kalır.',
  'Yes, end this family': 'Evet, bu aileyi bitir',
  Cancel: 'Vazgeç',
  'New family': 'Yeni aile',
  'Privacy policy': 'Gizlilik politikası',
  'Heirloom: Life Simulator · {v} test build': 'Heirloom: Life Simulator · {v} test sürümü',
};

const DICTS: Partial<Record<Lang, Record<string, string>>> = { tr: TR };

/** Translate an interface string into the current language, filling {placeholders}. */
export function T(en: string, vars?: Record<string, string | number>): string {
  let out = DICTS[current]?.[en] ?? en;
  if (vars) for (const k in vars) out = out.split(`{${k}}`).join(String(vars[k]));
  return out;
}

/** Plural helper: picks the "one" or "many" English key, then translates. */
export const Tn = (n: number, one: string, many: string, vars: Record<string, string | number> = {}) =>
  T(n === 1 ? one : many, { n, ...vars });

/** Content badges are written in English; "Needs Smarts 60+" style badges carry a number. */
export function badgeText(badge: string): string {
  const m = badge.match(/^Needs (Smarts|Looks|Health) (\d+)\+$/);
  if (m) return T(`Needs ${m[1]} {n}+`, { n: m[2] });
  return T(badge);
}

/** Number formatting for counts and scores (dots in Turkish: 12.500). */
export const fmtInt = (n: number) => n.toLocaleString(current === 'tr' ? 'tr-TR' : 'en-US');
