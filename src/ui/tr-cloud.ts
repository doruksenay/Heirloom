// Turkish interface strings for the opt-in cloud (Settings → cloud section, Daily leaderboard). Merged into TR in
// src/i18n/ui.ts.
export const TR_CLOUD: Record<string, string> = {
  // settings: cloud save
  'Cloud save': 'Bulut kaydı',
  'Keeps a copy of your family online, so you can move it to a new phone with a family code. No names or contact details, only the game.':
    'Aileni internette yedekler; aile koduyla yeni telefonuna taşıyabilirsin. İsim ya da iletişim bilgisi yok, yalnızca oyun.',
  'Family code': 'Aile kodu',
  Show: 'Göster',
  Hide: 'Gizle',
  'Keep the code and PIN somewhere safe. With them you can bring this family to another phone.':
    'Kodu ve PIN numarasını güvenli bir yere not et. Bu aileyi başka bir telefona onlarla taşırsın.',
  'Last saved {t}': 'Son kayıt: {t}',
  'Not saved yet': 'Henüz kaydedilmedi',
  'Save now': 'Şimdi kaydet',
  'Saved to the cloud.': 'Buluta kaydedildi.',
  'New PIN': 'Yeni PIN',
  'This family was moved to another phone, so this phone stopped saving it. Turn cloud save on again to start a new family code here.':
    'Bu aile başka bir telefona taşındı, bu telefon artık onu kaydetmiyor. Burada yeni bir aile koduyla başlamak için bulut kaydını yeniden aç.',

  // settings: leaderboard
  'Daily leaderboard': 'Günün Hayatı sıralaması',
  'Compare your Daily Challenge with real players. Sends only your scores and the nickname below.':
    'Günün Hayatı sonucunu gerçek oyuncularla karşılaştır. Yalnızca puanların ve aşağıdaki takma ad gönderilir.',
  'Nickname (optional)': 'Takma ad (isteğe bağlı)',
  'Shown on the leaderboard. Not your real name, please.': 'Sıralamada görünür. Lütfen gerçek adını yazma.',

  // settings: gift codes
  'Gift code': 'Hediye kodu',
  'Enter a gift code': 'Hediye kodu gir',
  Redeem: 'Kullan',
  'Gift unlocked: {items}': 'Hediye açıldı: {items}',
  'You already used this code.': 'Bu kodu zaten kullandın.',
  'This code is not valid.': 'Bu kod geçerli değil.',
  'This code has been used up.': 'Bu kodun kullanım hakkı bitmiş.',

  // settings: moving a family
  'Move a family here': 'Aileni bu telefona taşı',
  'Enter a family code': 'Aile kodu gir',
  'Enter the family code and PIN from your other phone. The family on this phone will be replaced.':
    'Diğer telefonundaki aile kodunu ve PIN numarasını gir. Bu telefondaki ailenin yerine o gelir.',
  'Bring my family': 'Ailemi getir',
  'Wrong code or PIN.': 'Kod ya da PIN yanlış.',
  'Too many tries. Wait an hour and try again.': 'Çok fazla deneme oldu. Bir saat bekleyip yeniden dene.',
  'No connection. Try again later.': 'Bağlantı yok. Biraz sonra yeniden dene.',
  'Something went wrong. Try again later.': 'Bir şeyler ters gitti. Biraz sonra yeniden dene.',
  'The save is too big for the cloud.': 'Kayıt buluta sığmayacak kadar büyük.',

  // settings: deletion
  'Delete my cloud data': 'Bulut verilerimi sil',
  'Deletes the family code, the online save and your leaderboard entries from our server. The game on this phone stays.':
    'Aile kodunu, internetteki kaydı ve sıralamadaki sonuçlarını sunucumuzdan siler. Bu telefondaki oyun yerinde kalır.',
  'Yes, delete': 'Evet, sil',
  'Cloud data deleted.': 'Bulut verilerin silindi.',

  // daily leaderboard
  'Better than {n}% of players': 'Oyuncuların %{n} kadarından iyi',
  '{n} players today': 'Bugün {n} oyuncu',
  'You are the first player today. Check back later to see how you rank.': 'Bugün ilk oynayan sensin. Sıralamanı görmek için sonra yine bak.',
  'Compare with real players': 'Gerçek oyuncularla karşılaştır',
  "Today's top players": 'Bugünün en iyileri',
  You: 'Sen',
  'Player {tag}': 'Oyuncu {tag}',
  'Ranked by the average share of players beaten in today’s categories.': 'Bugünkü alanlarda geçtiğin oyuncu oranının ortalamasına göre sıralanır.',
};
