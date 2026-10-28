// Turkish interface strings added in round 4 (Life screen, store, heir cards, job listing, avatars).
// Merged into TR in src/i18n/ui.ts, so T() and the i18n test see them like any other entry.
export const TR_UI4: Record<string, string> = {
  // life screen
  'Show stats': 'İstatistikleri göster',
  Rewind: 'Geri al',

  // heir cards
  Niece: 'Yeğen',
  Nephew: 'Yeğen',
  'Little one': 'Henüz küçük',
  'In school': 'Okulda',
  'No job yet': 'Henüz işi yok',
  'In your will': 'Vasiyette adı var',
  '{n} kid': '{n} çocuk',
  '{n} kids': '{n} çocuk',
  '{n} heirloom': '{n} yadigâr',
  '{n} heirlooms': '{n} yadigâr',

  // job board
  'Job listings': 'İş ilanları',
  Later: 'Sonra',
  Fields: 'Alanlar',
  All: 'Hepsi',
  'Nothing here you can apply for yet.': 'Burada henüz başvurabileceğin bir ilan yok.',
  "Hide jobs you can't get yet": 'Henüz giremediğin işleri gizle',
  "{n} job you can't get yet": 'Henüz giremediğin {n} iş',
  "{n} jobs you can't get yet": 'Henüz giremediğin {n} iş',
  'Part-time': 'Yarı zamanlı',
  Freelance: 'Serbest',
  'up to {title}': 'en üstte {title}',
  'Apply for {title}, {pay} a year': '{title} ilanına başvur, yıllık {pay}',
  '{n} opening you can apply for. Salaries are per year.': 'Başvurabileceğin {n} ilan var. Maaşlar yıllık.',
  '{n} openings you can apply for. Salaries are per year.': 'Başvurabileceğin {n} ilan var. Maaşlar yıllık.',
  'Good odds': 'Şansın yüksek',
  'Fair odds': 'Şansın orta',
  'Long shot': 'Zor ihtimal',

  // settings
  'For {name} in this life. Each heir finds their own way.': 'Bu hayatta {name} için geçerli. Her varis kendi yolunu bulur.',

  // store
  'The whole life is free: jobs, love, family, street crime, a first taste of fame and Türkiye. Packs add depth on top.':
    'Hayatın tamamı ücretsiz: işler, aşk, aile, sokak suçları, şöhrete ilk adım ve Türkiye. Paketler bunun üstüne derinlik katar.',
  'Save {n}%': '%{n} tasarruf',
  'What you get': 'Neler var',
  'Included for everyone': 'Herkese dahil',
  'Included with Heirloom+': 'Heirloom+ ile geldi',
  'Also included in Heirloom+': 'Heirloom+ içinde de var',
  'Instead of {p} one by one': 'Tek tek alsan {p}',
  // heir cards: the home's value and the cash on top of it
  Cash: 'Nakit',
  '+{amount} cash': '+{amount} nakit',
  Buy: 'Satın al',
  // round 5 (consistency): heir card labels, family tab kinship, mortgage, activities
  'Home {amount}': 'Ev {amount}',
  '{amount} cash': '{amount} nakit',
  Mortgage: 'Konut kredisi',
  '{n} year to go': '{n} yıl kaldı',
  '{n} years to go': '{n} yıl kaldı',
  'Paid off': 'Ödenen',
  'Left to pay': 'Kalan borç',
  'Yearly payment': 'Yıllık taksit',
  'Bonus: a short ad gives you 2 more activities this year.': 'Bonus: kısa bir reklam izlersen bu yıl 2 aktivite hakkı daha kazanırsın.',
  Watch: 'İzle',
};
